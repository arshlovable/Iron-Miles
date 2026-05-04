-- Optional link from fuel_logs to foods catalog (text id on foods).

alter table public.fuel_logs
  add column if not exists food_id text null references public.foods (id) on delete set null;

create index if not exists fuel_logs_user_food_idx on public.fuel_logs (user_id, food_id)
  where food_id is not null;

-- Reference data: authenticated users can read active foods for logging UI.
alter table public.foods enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'foods' and policyname = 'foods_select_authenticated'
  ) then
    create policy "foods_select_authenticated"
      on public.foods for select
      to authenticated
      using (true);
  end if;
end $$;
