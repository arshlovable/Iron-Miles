import { BarChart3, Dumbbell, Route, Truck } from 'lucide-react';
import heroTruck from '../assets/design/hero-truck.webp';
import PhoneFrame from '../components/PhoneFrame';
import StoreBadges from '../components/StoreBadges';

const BENEFITS = [
  { icon: Dumbbell, lines: ['Real Workouts', 'Real Results'] },
  { icon: Route, lines: ['Fitness', 'Anywhere'] },
  { icon: Truck, lines: ['Built for', 'Truck Drivers'] },
  { icon: BarChart3, lines: ['A Stronger', 'You Ahead'] },
];

export default function Hero() {
  return (
    <section
      id="home"
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-asphalt pt-[4.5rem]"
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <img
          src={heroTruck}
          alt=""
          fetchPriority="high"
          className="absolute inset-y-0 right-0 h-full w-full object-cover object-[70%_center] opacity-70 lg:w-[62%] lg:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-asphalt via-asphalt/85 to-asphalt/10 lg:via-asphalt/70 lg:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-asphalt to-transparent" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-asphalt/80 to-transparent" />
      </div>

      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.15fr_0.6fr_0.55fr] lg:gap-6 lg:px-8 lg:pb-20 lg:pt-14">
        <div className="max-w-2xl">
          <p className="font-label text-lg font-semibold uppercase tracking-[0.12em] text-gold sm:text-xl">
            Built by a trucker. For truckers.
          </p>
          <h1
            id="hero-heading"
            className="heading-shadow mt-3 font-display text-[3.4rem] uppercase leading-[0.92] sm:text-7xl xl:text-[6.2rem]"
          >
            <span className="text-metal block">Fitness Built</span>
            <span className="text-goldmetal block">For the Road.</span>
          </h1>
          <p className="mt-5 text-lg text-steel sm:text-xl">Real workouts. Real results. A stronger you ahead.</p>

          <ul className="mt-8 grid grid-cols-2 gap-y-6 sm:grid-cols-4">
            {BENEFITS.map(({ icon: Icon, lines }, index) => (
              <li
                key={lines.join(' ')}
                className={`flex flex-col items-center px-2 text-center ${
                  index > 0 ? 'sm:border-l sm:border-gold/35' : ''
                } ${index % 2 === 1 ? 'border-l border-gold/35 sm:border-l' : ''}`}
              >
                <Icon className="h-8 w-8 text-gold" strokeWidth={2.2} aria-hidden="true" />
                <span className="mt-2 font-label text-xs font-semibold uppercase leading-tight tracking-[0.06em] text-steel sm:text-[0.8rem]">
                  {lines[0]}
                  <br />
                  {lines[1]}
                </span>
              </li>
            ))}
          </ul>

          <StoreBadges className="mt-9" />
        </div>

        <div className="flex justify-center">
          <PhoneFrame
            screenshot="dashboard"
            alt="Iron Miles dashboard screen showing lifetime Iron Miles and the Generate Workout button"
            className="w-[15.5rem] rotate-[-2deg] sm:w-[17rem] lg:w-full lg:max-w-[18rem]"
            eager
          />
        </div>

        <div className="relative hidden h-full min-h-[22rem] lg:block" aria-hidden="true">
          <p className="absolute bottom-6 right-0 rotate-[-10deg] text-right font-script text-[2.7rem] leading-[0.95] text-steel/95 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
            Drive
            <br />
            Train
            <br />
            Improve
            <br />
            Repeat
          </p>
        </div>
      </div>
    </section>
  );
}
