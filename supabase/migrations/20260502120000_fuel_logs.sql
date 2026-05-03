-- Minimal one-tap fuel logging (meals + snacks, no nutrition fields).

create table if not exists public.fuel_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_type text not null check (log_type in ('meal', 'snack')),
  created_at timestamptz not null default now()
);

create index if not exists fuel_logs_user_created_idx
  on public.fuel_logs (user_id, created_at desc);

alter table public.fuel_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'fuel_logs' and policyname = 'fuel_logs_select_own'
  ) then
    create policy "fuel_logs_select_own"
      on public.fuel_logs for select
      to authenticated
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'fuel_logs' and policyname = 'fuel_logs_insert_own'
  ) then
    create policy "fuel_logs_insert_own"
      on public.fuel_logs for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'fuel_logs' and policyname = 'fuel_logs_delete_own'
  ) then
    create policy "fuel_logs_delete_own"
      on public.fuel_logs for delete
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;
