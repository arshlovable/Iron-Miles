/** User-facing intensity labels. Internal values remain easy | medium | hard. */

export const DIFFICULTY_DISPLAY_LABEL: Record<'easy' | 'medium' | 'hard', string> = {
  easy: 'Light Load',
  medium: 'Working Load',
  hard: 'Heavy Load',
};

export function difficultyDisplayLabel(raw: string | null | undefined): string {
  const key = String(raw ?? 'medium')
    .trim()
    .toLowerCase();
  if (key === 'easy' || key === 'light') return DIFFICULTY_DISPLAY_LABEL.easy;
  if (key === 'hard' || key === 'heavy') return DIFFICULTY_DISPLAY_LABEL.hard;
  return DIFFICULTY_DISPLAY_LABEL.medium;
}
