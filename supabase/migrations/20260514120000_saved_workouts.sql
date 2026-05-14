-- Saved personal workouts (snapshots of generated workouts for repeat runs)
-- + RLS allowing authenticated users to insert their own generated_workout_exercises rows

-- ── Tables ───────────────────────────────────────────────────────────────────
create table public.saved_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  target_area text,
  workout_style text,
  equipment jsonb not null default '[]'::jsonb,
  difficulty text,
  duration_minutes integer not null,
  estimated_iron_miles integer not null default 0,
  source text not null default 'generated',
  source_generated_workout_id uuid references public.generated_workouts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_workout_exercises (
  id uuid primary key default gen_random_uuid(),
  saved_workout_id uuid not null references public.saved_workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  order_index integer not null,
  sets integer,
  reps text,
  rest_seconds integer,
  instruction_override text,
  created_at timestamptz not null default now()
);

create index idx_saved_workouts_user_created on public.saved_workouts (user_id, created_at desc);
create index idx_saved_workout_exercises_workout_order on public.saved_workout_exercises (saved_workout_id, order_index);

create unique index saved_workouts_user_source_gen_unique
  on public.saved_workouts (user_id, source_generated_workout_id)
  where source_generated_workout_id is not null;

-- ── updated_at on saved_workouts ─────────────────────────────────────────────
create or replace function public.set_saved_workouts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger saved_workouts_updated_at
  before update on public.saved_workouts
  for each row
  execute procedure public.set_saved_workouts_updated_at();

-- ── RLS: saved_workouts ───────────────────────────────────────────────────────
alter table public.saved_workouts enable row level security;
alter table public.saved_workout_exercises enable row level security;

create policy "saved_workouts_select_own"
  on public.saved_workouts for select
  to authenticated
  using (user_id = auth.uid());

create policy "saved_workouts_insert_own"
  on public.saved_workouts for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "saved_workouts_update_own"
  on public.saved_workouts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "saved_workouts_delete_own"
  on public.saved_workouts for delete
  to authenticated
  using (user_id = auth.uid());

create policy "saved_workout_exercises_select_own"
  on public.saved_workout_exercises for select
  to authenticated
  using (
    exists (
      select 1
      from public.saved_workouts sw
      where sw.id = saved_workout_exercises.saved_workout_id
        and sw.user_id = auth.uid()
    )
  );

create policy "saved_workout_exercises_insert_own"
  on public.saved_workout_exercises for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.saved_workouts sw
      where sw.id = saved_workout_exercises.saved_workout_id
        and sw.user_id = auth.uid()
    )
  );

create policy "saved_workout_exercises_update_own"
  on public.saved_workout_exercises for update
  to authenticated
  using (
    exists (
      select 1
      from public.saved_workouts sw
      where sw.id = saved_workout_exercises.saved_workout_id
        and sw.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.saved_workouts sw
      where sw.id = saved_workout_exercises.saved_workout_id
        and sw.user_id = auth.uid()
    )
  );

create policy "saved_workout_exercises_delete_own"
  on public.saved_workout_exercises for delete
  to authenticated
  using (
    exists (
      select 1
      from public.saved_workouts sw
      where sw.id = saved_workout_exercises.saved_workout_id
        and sw.user_id = auth.uid()
    )
  );

-- ── Grants ────────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.saved_workouts to authenticated;
grant select, insert, update, delete on public.saved_workout_exercises to authenticated;
grant select, insert, update, delete on public.saved_workouts to service_role;
grant select, insert, update, delete on public.saved_workout_exercises to service_role;

-- ── generated_workout_exercises: allow owners to insert/update/delete lines ───
create policy "generated_workout_exercises_insert_own_workout"
  on public.generated_workout_exercises for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.generated_workouts gw
      where gw.id = generated_workout_exercises.generated_workout_id
        and gw.user_id = auth.uid()
    )
  );

create policy "generated_workout_exercises_update_own_workout"
  on public.generated_workout_exercises for update
  to authenticated
  using (
    exists (
      select 1
      from public.generated_workouts gw
      where gw.id = generated_workout_exercises.generated_workout_id
        and gw.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.generated_workouts gw
      where gw.id = generated_workout_exercises.generated_workout_id
        and gw.user_id = auth.uid()
    )
  );

create policy "generated_workout_exercises_delete_own_workout"
  on public.generated_workout_exercises for delete
  to authenticated
  using (
    exists (
      select 1
      from public.generated_workouts gw
      where gw.id = generated_workout_exercises.generated_workout_id
        and gw.user_id = auth.uid()
    )
  );
