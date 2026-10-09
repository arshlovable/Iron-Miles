import { Dumbbell, HeartPulse, Truck, Users } from 'lucide-react';
import founder from '../assets/design/founder-silhouette.webp';
import VisualButton from '../components/VisualButton';

const PILLARS = [
  { icon: Truck, title: 'Real Experience', body: 'Built from the realities of life on the road.' },
  { icon: Dumbbell, title: 'Real Solutions', body: 'Practical workouts that actually work.' },
  { icon: HeartPulse, title: 'Real Impact', body: 'Stronger drivers, healthier lives, longer careers.' },
  { icon: Users, title: 'For Truckers', body: 'Everything we do is designed with drivers in mind.' },
];

export default function Story() {
  return (
    <section
      id="our-story"
      aria-labelledby="story-heading"
      className="asphalt-texture relative isolate overflow-hidden border-y border-gold/30"
    >
      <div className="mx-auto grid max-w-[1440px] items-stretch gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr_0.62fr] lg:gap-8 lg:px-8 lg:py-16">
        <div className="relative z-10 max-w-xl self-center">
          <p className="font-label text-lg font-semibold uppercase tracking-[0.14em] text-gold">My Story</p>
          <h2
            id="story-heading"
            className="heading-shadow mt-2 font-display text-[2.4rem] uppercase leading-[0.95] sm:text-5xl lg:text-[2.6rem] xl:text-[3.2rem]"
          >
            <span className="text-metal block lg:whitespace-nowrap">From the Driver&rsquo;s Seat</span>
            <span className="text-goldmetal block">To Iron Miles.</span>
          </h2>
          <div className="mt-5 space-y-3 text-[1.02rem] leading-relaxed text-steel/90">
            <p>
              I&rsquo;m Arshmit, a long-haul truck driver and the founder of Iron Miles. I know what it&rsquo;s like to
              live on the road &mdash; long hours, unpredictable schedules, limited space, and inconsistent gym access.
            </p>
            <p>
              I built Iron Miles because I needed a practical way to stay strong, healthy, and mentally sharp as a
              driver.
            </p>
            <p>
              This app is the result of that experience. It&rsquo;s built by a trucker, for truckers, to make fitness a
              realistic part of life on the road.
            </p>
          </div>
          <VisualButton label="Read the Full Story" className="mt-7" />
        </div>

        <figure className="relative -mx-4 min-h-[20rem] sm:-mx-6 lg:mx-0 lg:-my-16">
          <img
            src={founder}
            alt="Silhouette of Iron Miles founder Arshmit Gill in sunglasses, backlit by a sunset beside his truck"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[45%_25%] brightness-[0.62] contrast-[1.1]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-charcoal via-transparent to-charcoal/80"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-asphalt via-asphalt/70 to-transparent" aria-hidden="true" />
          <figcaption className="absolute bottom-6 right-6 text-right lg:bottom-10">
            <span className="block -rotate-6 font-script text-4xl text-gold-light drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)] sm:text-5xl">
              Arshmit Gill
            </span>
            <span className="mt-2 block font-label text-xs font-semibold uppercase tracking-[0.14em] text-steel">
              Founder &amp; CEO
              <br />
              Iron Miles
            </span>
          </figcaption>
        </figure>

        <ul className="gold-panel relative z-10 self-center divide-y divide-gold/20 px-5 py-2">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-4 py-4">
              <Icon className="mt-0.5 h-8 w-8 shrink-0 text-gold" strokeWidth={2.2} aria-hidden="true" />
              <div>
                <h3 className="font-label text-sm font-semibold uppercase tracking-[0.1em] text-gold-light">{title}</h3>
                <p className="mt-1 text-sm leading-snug text-steel/85">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
