-- Normalize final-six exercise display names to Title Case.

UPDATE public.exercises SET name = 'Band Bicep Curls' WHERE slug = 'band_bicep_curls';
UPDATE public.exercises SET name = 'Banded Squats' WHERE slug = 'banded_squats';
UPDATE public.exercises SET name = 'In Cab Pull Ups' WHERE slug = 'in_cab_pull_ups';
