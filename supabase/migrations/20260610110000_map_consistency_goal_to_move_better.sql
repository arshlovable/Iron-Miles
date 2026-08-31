-- Map deprecated onboarding goals to move_better.
UPDATE public.profiles
SET primary_goal = 'move_better'
WHERE primary_goal IN ('stay_consistent', 'consistency');
