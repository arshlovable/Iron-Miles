const files = import.meta.glob<string>('../assets/screenshots/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});

export type ScreenshotKey =
  | 'dashboard'
  | 'workout-generator'
  | 'generated-workout'
  | 'workouts-library'
  | 'fuel'
  | 'progress-map';

export function getScreenshot(key: ScreenshotKey): string | undefined {
  const match = Object.entries(files).find(([path]) => {
    const base = path.split('/').pop() ?? '';
    return base.replace(/\.(png|jpe?g|webp)$/i, '') === key;
  });
  return match?.[1];
}
