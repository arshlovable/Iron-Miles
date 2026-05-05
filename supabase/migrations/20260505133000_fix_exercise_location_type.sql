-- Exercises inserted without location_type are invisible to the location-scoped
-- query in generate-workout (eq location_type only). Align NULL rows with the
-- default truck-stop library so they are returned alongside existing rows.
UPDATE public.exercises
SET location_type = 'truck_stop'
WHERE location_type IS NULL;
