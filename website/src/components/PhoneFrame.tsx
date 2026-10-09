const screenshots = import.meta.glob<string>('../assets/screenshots/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});

export type ScreenshotName =
  | 'dashboard'
  | 'workout-generator'
  | 'generated-workout'
  | 'workouts-library'
  | 'fuel'
  | 'progress-map';

export function hasScreenshot(name: ScreenshotName): boolean {
  return findScreenshot(name) !== undefined;
}

function findScreenshot(name: ScreenshotName): string | undefined {
  const match = Object.entries(screenshots).find(([file]) => {
    const base = file.split('/').pop() ?? '';
    return base.replace(/\.(png|jpe?g|webp)$/i, '') === name;
  });
  return match?.[1];
}

type PhoneFrameProps = {
  screenshot: ScreenshotName;
  alt: string;
  className?: string;
  eager?: boolean;
};

export default function PhoneFrame({ screenshot, alt, className = '', eager = false }: PhoneFrameProps) {
  const src = findScreenshot(screenshot);

  return (
    <div
      className={`relative aspect-[1/2.2] rounded-[2.1rem] bg-gradient-to-b from-[#3a3a37] via-[#141413] to-[#2b2b28] p-[7px] shadow-[0_25px_60px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.08)] ${className}`}
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[1.7rem] bg-[#0b0b0a]">
        <div className="flex h-[7%] shrink-0 items-center justify-center" aria-hidden="true">
          <span className="h-[45%] w-[34%] rounded-full bg-black" />
        </div>
        {src ? (
          <img
            src={src}
            alt={alt}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className="min-h-0 w-full flex-1 object-contain object-top"
          />
        ) : (
          <div
            role="img"
            aria-label={alt}
            className="flex w-full flex-1 items-center justify-center bg-gradient-to-b from-[#121210] to-black"
          >
            <span className="h-14 w-14 rounded-full border-4 border-gold/40" />
          </div>
        )}
      </div>
    </div>
  );
}
