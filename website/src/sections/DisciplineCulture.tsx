import { Brain, Megaphone, Users } from 'lucide-react';
import disciplineTruck from '../assets/design/discipline-truck.webp';
import PhoneFrame from '../components/PhoneFrame';
import StoreBadges from '../components/StoreBadges';
import VisualButton from '../components/VisualButton';

const FUTURE = [
  { icon: Users, title: 'Community', body: 'Connect with drivers who share the same mission.' },
  { icon: Megaphone, title: 'Coaching', body: 'More personalized guidance for your goals.' },
  { icon: Brain, title: 'Mindset', body: 'Build resilience and mental strength for the long haul.' },
];

export default function DisciplineCulture() {
  return (
    <div className="relative isolate overflow-hidden bg-asphalt">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_8%,rgba(232,140,40,0.45),rgba(120,50,15,0.25)_35%,transparent_70%)]" />
        <img
          src={disciplineTruck}
          alt=""
          loading="lazy"
          className="absolute bottom-0 left-0 hidden h-[60%] w-[42%] object-cover object-left-bottom opacity-90 lg:block"
        />
        <div className="absolute bottom-0 left-0 hidden h-[60%] w-[42%] bg-gradient-to-r from-transparent via-transparent to-asphalt lg:block" />
        <div className="absolute bottom-0 left-0 hidden h-[60%] w-[42%] bg-gradient-to-b from-asphalt via-transparent to-asphalt/60 lg:block" />
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 pb-10 pt-14 sm:px-6 lg:grid-cols-[1fr_0.72fr_1.25fr] lg:gap-8 lg:px-8 lg:pt-16">
        <section id="mission" aria-labelledby="discipline-heading" className="max-w-md">
          <h2
            id="discipline-heading"
            className="heading-shadow text-goldmetal font-display text-5xl uppercase leading-[0.95] xl:text-[3.6rem]"
          >
            Miles of Discipline
          </h2>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-steel/90">
            Every workout moves your second odometer forward. Build consistency, reach new mile markers, and see your
            progress over time.
          </p>
          <VisualButton label="See Progress Map" className="mt-7" />
          <img
            src={disciplineTruck}
            alt="A semi-truck driving through the mountains at sunset"
            loading="lazy"
            className="mt-10 aspect-[3/2] w-full rounded-md object-cover lg:hidden"
          />
        </section>

        <div className="flex justify-center lg:items-start">
          <PhoneFrame
            screenshot="progress-map"
            alt="Iron Miles Progress Map showing lifetime Iron Miles and road milestones"
            className="w-[15rem] sm:w-[16.5rem] lg:w-full lg:max-w-[17rem]"
          />
        </div>

        <section id="culture" aria-labelledby="culture-heading">
          <h2
            id="culture-heading"
            className="heading-shadow font-display text-5xl uppercase leading-[0.95] xl:text-[3.6rem]"
          >
            <span className="text-metal block">More Than an App.</span>
            <span className="text-goldmetal block">A Culture.</span>
          </h2>
          <p className="mt-4 max-w-xl text-[1.02rem] leading-relaxed text-steel/90">
            Iron Miles is for drivers who refuse to let the road take their health, their energy, or their future.
            It&rsquo;s a movement of strength, discipline, and self-improvement &mdash; on and off the road.
          </p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-3">
            {FUTURE.map(({ icon: Icon, title, body }) => (
              <li key={title} className="gold-panel flex flex-col items-center px-4 pb-4 pt-5 text-center">
                <Icon className="h-9 w-9 text-gold" strokeWidth={2.1} aria-hidden="true" />
                <h3 className="mt-3 font-label text-base font-semibold uppercase tracking-[0.1em] text-steel">
                  {title}
                </h3>
                <p className="mt-1.5 flex-1 text-sm leading-snug text-steel/80">{body}</p>
                <span className="mt-4 inline-block rounded-sm bg-gradient-to-b from-gold-light to-gold px-4 py-1.5 font-label text-xs font-semibold uppercase tracking-[0.12em] text-black">
                  Coming Soon
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section
        id="road-ahead"
        aria-labelledby="cta-heading"
        className="relative mx-auto max-w-[1440px] px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pb-16"
      >
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <h2 id="cta-heading" className="heading-shadow font-display uppercase leading-[0.95]">
            <span className="text-metal block text-3xl sm:text-4xl">The Road Doesn&rsquo;t Stop.</span>
            <span className="text-goldmetal block text-5xl sm:text-6xl">Neither Do We.</span>
          </h2>
          <p className="mt-3 text-steel/90">Discover Iron Miles. Build your discipline. Own your road.</p>
          <StoreBadges className="mt-6 justify-center" />
        </div>

        <div
          aria-hidden="true"
          className="mx-auto mt-10 w-fit rotate-[-3deg] rounded-md border-[3px] border-[#e6e4dc] bg-gradient-to-b from-[#1f5a3c] to-[#123b27] px-6 py-3 text-center font-label text-xl font-semibold uppercase leading-tight tracking-[0.08em] text-[#eeece6] shadow-[0_10px_30px_rgba(0,0,0,0.6)] outline outline-[3px] outline-[#1a4a32] lg:absolute lg:bottom-28 lg:right-10 lg:mt-0"
        >
          Stronger
          <br />
          Drivers
          <br />
          Happier
          <br />
          Tomorrows
        </div>

        <footer className="mt-12 flex flex-col items-center gap-2 border-t border-gold/20 pt-6 text-center text-xs text-mist sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Iron Miles. Built by a trucker. For truckers.</p>
          <p className="font-label uppercase tracking-[0.12em]">Drive. Train. Improve. Repeat.</p>
        </footer>
      </section>
    </div>
  );
}
