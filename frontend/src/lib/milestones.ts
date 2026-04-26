export type MilestoneProgressItem = {
  miles: number;
  title: string;
  unlocked: boolean;
  current?: boolean;
  icon: string;
};

export type MilestoneProgressComputed = {
  milestones: MilestoneProgressItem[];
  currentMilestone: { miles: number; title: string; icon: string };
  nextMilestone: { miles: number; title: string; icon: string } | null;
  milesToCurrentMilestone: number;
  progressPctToCurrentMilestone: number;
};

export const MILESTONE_THRESHOLDS: Array<{ miles: number; title: string; icon: string }> = [
  { miles: 100, title: 'Rolling Start', icon: 'key-variant' },
  { miles: 500, title: 'First Long Haul', icon: 'truck-delivery' },
  { miles: 1000, title: 'Road Warrior', icon: 'shield-star' },
  { miles: 2500, title: 'Highway Legend', icon: 'highway' },
  { miles: 5000, title: 'Iron Driver', icon: 'medal' },
  { miles: 10000, title: 'Elite Hauler', icon: 'fire' },
];

export function computeMilestoneProgress(lifetimeMiles: number): MilestoneProgressComputed {
  const normalizedMiles = Math.max(0, Math.floor(lifetimeMiles));
  const firstLockedIndex = MILESTONE_THRESHOLDS.findIndex((m) => normalizedMiles < m.miles);
  const currentIndex =
    firstLockedIndex === -1 ? MILESTONE_THRESHOLDS.length - 1 : Math.max(0, firstLockedIndex);
  const nextIndex = currentIndex < MILESTONE_THRESHOLDS.length - 1 ? currentIndex + 1 : -1;
  const previousThreshold = currentIndex > 0 ? MILESTONE_THRESHOLDS[currentIndex - 1].miles : 0;
  const currentThreshold = MILESTONE_THRESHOLDS[currentIndex].miles;
  const span = Math.max(1, currentThreshold - previousThreshold);
  const progressPctToCurrentMilestone = Math.max(
    0,
    Math.min(100, ((normalizedMiles - previousThreshold) / span) * 100)
  );

  return {
    milestones: MILESTONE_THRESHOLDS.map((m, idx) => ({
      ...m,
      unlocked: normalizedMiles >= m.miles,
      current: idx === currentIndex,
    })),
    currentMilestone: MILESTONE_THRESHOLDS[currentIndex],
    nextMilestone: nextIndex >= 0 ? MILESTONE_THRESHOLDS[nextIndex] : null,
    milesToCurrentMilestone: Math.max(0, currentThreshold - normalizedMiles),
    progressPctToCurrentMilestone,
  };
}

