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

      <div className="mx-auto flex max-w-[1440px] flex-col px-4 pb-10 pt-3 sm:px-6 lg:grid lg:grid-cols-[1.15fr_0.6fr_0.55fr] lg:items-center lg:gap-x-6 lg:gap-y-0 lg:px-8 lg:pb-20 lg:pt-14">
        <div className="order-1 max-w-2xl lg:col-start-1 lg:row-start-1">
          <p className="font-label text-sm font-semibold uppercase tracking-[0.12em] text-gold sm:text-lg lg:text-xl">
            Built by a trucker. For truckers.
          </p>
          <h1
            id="hero-heading"
            className="heading-shadow mt-1 font-display text-[2.55rem] uppercase leading-[0.9] min-[390px]:text-[2.85rem] sm:text-5xl sm:leading-[0.92] lg:mt-3 lg:text-7xl xl:text-[6.2rem]"
          >
            <span className="text-metal block">Fitness Built</span>
            <span className="text-goldmetal block">For the Road.</span>
          </h1>
          <p className="mt-2 text-base text-steel lg:mt-5 lg:text-xl">
            Real workouts. Real results. A stronger you ahead.
          </p>
        </div>

        <StoreBadges className="order-2 mt-4 lg:col-start-1 lg:row-start-3 lg:mt-9" />

        <ul className="order-4 mt-8 grid grid-cols-4 gap-2 lg:col-start-1 lg:row-start-2 lg:mt-8 lg:grid-cols-4 lg:gap-0">
          {BENEFITS.map(({ icon: Icon, lines }, index) => (
            <li
              key={lines.join(' ')}
              className={`flex flex-col items-center px-1 text-center lg:px-2 ${
                index > 0 ? 'lg:border-l lg:border-gold/35' : ''
              }`}
            >
              <Icon className="h-6 w-6 text-gold lg:h-8 lg:w-8" strokeWidth={2.2} aria-hidden="true" />
              <span className="mt-1.5 font-label text-[0.62rem] font-semibold uppercase leading-tight tracking-[0.04em] text-steel sm:text-xs lg:mt-2 lg:text-[0.8rem] lg:tracking-[0.06em]">
                {lines[0]}
                <br />
                {lines[1]}
              </span>
            </li>
          ))}
        </ul>

        <div className="order-3 mt-5 flex justify-center lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:mt-0">
          <PhoneFrame
            screenshot="dashboard"
            alt="Iron Miles dashboard screen showing lifetime Iron Miles and the Generate Workout button"
            className="w-[15.5rem] sm:w-[17rem] lg:w-full lg:max-w-[18rem] lg:-rotate-2"
            eager
          />
        </div>

        <div
          className="relative hidden h-full min-h-[22rem] lg:col-start-3 lg:row-start-1 lg:row-span-3 lg:block"
          aria-hidden="true"
        >
          <p className="absolute bottom-6 right-0 -rotate-[10deg] text-right font-script text-[2.7rem] leading-[0.95] text-steel/95 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
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
