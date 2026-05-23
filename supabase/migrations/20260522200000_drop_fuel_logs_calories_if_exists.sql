-- Revert any accidental fuel_logs.calories column; calories live on public.foods only.

alter table public.fuel_logs
  drop column if exists calories;
