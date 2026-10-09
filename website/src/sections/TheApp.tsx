import PhoneFrame, { hasScreenshot, type ScreenshotName } from '../components/PhoneFrame';
import VisualButton from '../components/VisualButton';

const FEATURES: { screenshot: ScreenshotName; title: string; body: string; alt: string }[] = [
  {
    screenshot: 'dashboard',
    title: 'Dashboard',
    body: 'Start your next workout in seconds.',
    alt: 'Iron Miles dashboard with the lifetime Iron Miles gauge and the Generate Workout button',
  },
  {
    screenshot: 'workout-generator',
    title: 'Built Around Your Time & Gear',
    body: 'Use what you have. No gym needed.',
    alt: 'Iron Miles workout generator screen asking what equipment you have',
  },
  {
    screenshot: 'generated-workout',
    title: 'Real Workouts for Real Life',
    body: 'Simple, effective workouts designed for drivers.',
    alt: 'Generated Upper Body Road Strength workout with six band and push-up exercises',
  },
  {
    screenshot: 'workouts-library',
    title: 'Any Stop. Any Equipment. Anytime.',
    body: 'Workouts for the cab, truck stops, core, and mobility.',
    alt: 'Iron Miles workouts library with Cab, Truck Stop, Core and Mobility categories',
  },
  {
    screenshot: 'fuel',
    title: 'Fuel Your Body. Drive Farther.',
    body: 'Simple food tracking for life on the road.',
    alt: 'Iron Miles fuel gauge tracking daily meals, with Add Meal and Add Snack buttons',
  },
];

const VISIBLE_FEATURES = FEATURES.filter((feature) => hasScreenshot(feature.screenshot));

export default function TheApp() {
  return (
    <section
      id="app"
      aria-labelledby="app-heading"
      className="asphalt-texture relative isolate overflow-hidden border-b border-gold/30"
    >
      <div
        className="pointer-events-none absolute -right-40 top-0 -z-10 h-[30rem] w-[50rem] rounded-full bg-gold/5 blur-3xl"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.62fr_1.9fr] lg:gap-8 lg:px-8 lg:py-16">
        <div className="max-w-md self-center">
          <p className="font-label text-lg font-semibold uppercase tracking-[0.14em] text-gold">The App</p>
          <h2
            id="app-heading"
            className="heading-shadow mt-2 font-display text-5xl uppercase leading-[0.93] xl:text-[4.1rem]"
          >
            <span className="text-metal block">Your Gym.</span>
            <span className="text-goldmetal block">Wherever</span>
            <span className="text-goldmetal block">You Park.</span>
          </h2>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-steel/90">
            Generate trucker-friendly workouts, fuel your body, and track your progress through a second odometer
            &mdash; one that measures discipline.
          </p>
          <VisualButton label="Explore the App" className="mt-7" />
        </div>

        <ul
          id="features"
          aria-label="App features"
          className={`-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0 ${
            VISIBLE_FEATURES.length >= 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4 lg:gap-6'
          }`}
        >
          {VISIBLE_FEATURES.map((feature) => (
            <li key={feature.screenshot} className="w-[11.5rem] shrink-0 snap-center text-center sm:w-[13rem] lg:w-auto">
              <PhoneFrame screenshot={feature.screenshot} alt={feature.alt} className="mx-auto w-full" />
              <h3 className="mt-4 font-label text-sm font-semibold uppercase leading-tight tracking-[0.06em] text-gold-light">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm leading-snug text-steel/85">{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
