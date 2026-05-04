alter table exercises enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'exercises' and policyname = 'exercises_select_catalog'
  ) then
    create policy "exercises_select_catalog"
    on exercises for select
    to authenticated
    using (true);
  end if;
end $$;

create or replace function public.delete_completed_workout_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_uid uuid;
  v_session workout_sessions%rowtype;
  v_deleted_logs integer := 0;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_session_id is null then
    raise exception 'p_session_id is required';
  end if;

  select *
  into v_session
  from workout_sessions
  where id = p_session_id
    and user_id = v_uid
    and status = 'completed';

  if not found then
    raise exception 'Completed workout session not found';
  end if;

  delete from iron_miles_log
  where user_id = v_uid
    and source_type = 'workout'
    and source_id = p_session_id;
  get diagnostics v_deleted_logs = row_count;

  update profiles
  set lifetime_iron_miles = greatest(
    0,
    coalesce(lifetime_iron_miles, 0) - greatest(0, coalesce(v_session.iron_miles_earned, 0))
  )
  where id = v_uid;

  delete from workout_sessions
  where id = p_session_id
    and user_id = v_uid;

  return jsonb_build_object(
    'deleted_session_id', p_session_id,
    'deleted_log_rows', v_deleted_logs
  );
end;
$function$;

revoke all on function public.delete_completed_workout_session(uuid) from public;
grant execute on function public.delete_completed_workout_session(uuid) to authenticated;
