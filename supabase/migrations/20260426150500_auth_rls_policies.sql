alter table profiles enable row level security;
alter table generated_workouts enable row level security;
alter table generated_workout_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table iron_miles_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_own'
  ) then
    create policy "profiles_select_own"
    on profiles for select
    to authenticated
    using (id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_insert_own'
  ) then
    create policy "profiles_insert_own"
    on profiles for insert
    to authenticated
    with check (id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_own'
  ) then
    create policy "profiles_update_own"
    on profiles for update
    to authenticated
    using (id = auth.uid())
    with check (id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'generated_workouts' and policyname = 'generated_workouts_select_own'
  ) then
    create policy "generated_workouts_select_own"
    on generated_workouts for select
    to authenticated
    using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'generated_workouts' and policyname = 'generated_workouts_insert_own'
  ) then
    create policy "generated_workouts_insert_own"
    on generated_workouts for insert
    to authenticated
    with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'generated_workouts' and policyname = 'generated_workouts_update_own'
  ) then
    create policy "generated_workouts_update_own"
    on generated_workouts for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'generated_workout_exercises' and policyname = 'generated_workout_exercises_select_own_workout'
  ) then
    create policy "generated_workout_exercises_select_own_workout"
    on generated_workout_exercises for select
    to authenticated
    using (
      exists (
        select 1
        from generated_workouts gw
        where gw.id = generated_workout_exercises.generated_workout_id
          and gw.user_id = auth.uid()
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'workout_sessions' and policyname = 'workout_sessions_select_own'
  ) then
    create policy "workout_sessions_select_own"
    on workout_sessions for select
    to authenticated
    using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'iron_miles_log' and policyname = 'iron_miles_log_select_own'
  ) then
    create policy "iron_miles_log_select_own"
    on iron_miles_log for select
    to authenticated
    using (user_id = auth.uid());
  end if;
end $$;
