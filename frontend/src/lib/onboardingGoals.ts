export const ONBOARDING_GOAL_OPTIONS = [
  { value: 'build_muscle', label: 'Build Muscle', sub: 'Gain strength on the road', icon: 'arm-flex' },
  { value: 'lose_weight', label: 'Lose Weight', sub: 'Burn fat between stops', icon: 'fire' },
  { value: 'move_better', label: 'Move Better', sub: 'Reduce aches, stay mobile', icon: 'yoga' },
] as const;

export type OnboardingGoal = (typeof ONBOARDING_GOAL_OPTIONS)[number]['value'];

const GOAL_LABELS: Record<OnboardingGoal, string> = {
  build_muscle: 'Build Muscle',
  lose_weight: 'Lose Weight',
  move_better: 'Move Better',
};

const VALID_GOALS = new Set<string>(ONBOARDING_GOAL_OPTIONS.map((o) => o.value));

/** Maps deprecated consistency goals to move_better. */
export function normalizeOnboardingGoal(goal: string | null | undefined): OnboardingGoal | null {
  if (!goal) return null;
  if (goal === 'stay_consistent' || goal === 'consistency') return 'move_better';
  if (VALID_GOALS.has(goal)) return goal as OnboardingGoal;
  return null;
}

export function onboardingGoalLabel(goal: string | null | undefined): string {
  const normalized = normalizeOnboardingGoal(goal);
  if (!normalized) return '—';
  return GOAL_LABELS[normalized];
}

export function isDeprecatedOnboardingGoal(goal: string | null | undefined): boolean {
  return goal === 'stay_consistent' || goal === 'consistency';
}
