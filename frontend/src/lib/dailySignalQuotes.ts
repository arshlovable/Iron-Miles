export const DAILY_SIGNAL_QUOTES: string[] = [
  'Stay on route. No detours.',
  "You don't stop when it's hard.",
  'Discipline drives. Comfort rides passenger.',
  'Keep rolling. No excuses today.',
  'No missed stops. Ever again.',
  'Long haul mindset. Every day.',
  'You finish what you started.',
  'Drive through the resistance anyway.',
  "Comfort isn't your destination anymore.",
  'Stay behind the wheel. Always.',
  "Don't negotiate with weakness today.",
  'Discipline over mood. Every time.',
  'Show up. No matter what.',
  'No excuses. Just earned miles.',
  "You've survived worse. Move forward.",
  'Stay dangerous. Stay consistent daily.',
  "Weak thoughts don't get control.",
  'You are not done yet.',
  'Lock in. Stay locked in.',
  'Control your mind. Control everything.',
  'Built daily. Not given freely.',
  'One more rep. Always matters.',
  'Strength is earned. Not wished.',
  'Grow or stall. Choose now.',
  'No skipped sessions. No exceptions.',
  'This is earned discipline, not hype.',
  "You don't wait. You act.",
  'Body follows the standard you set.',
  'Effort compounds. So does weakness.',
  'Earn your place today again.',
];

/**
 * Returns a deterministic quote for the given (or current) local calendar date.
 * quoteIndex = dayOfYear % DAILY_SIGNAL_QUOTES.length
 * Day-of-year is 0-based: Jan 1 → 0.
 */
export function getDailySignalQuote(date: Date = new Date()): string {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diffMs = date.getTime() - startOfYear.getTime();
  const msPerDay = 1000 * 60 * 60 * 24;
  // dayOfYear: Jan 1 → 1, so subtract 1 for 0-based index
  const dayOfYear = Math.floor(diffMs / msPerDay) - 1;
  const index = Math.abs(dayOfYear) % DAILY_SIGNAL_QUOTES.length;
  return DAILY_SIGNAL_QUOTES[index];
}
