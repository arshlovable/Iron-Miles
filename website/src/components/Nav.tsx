import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { GET_THE_APP_HREF } from '../config/links';
import { externalProps, preventPlaceholder } from './StoreBadges';
import Logo from './Logo';

export const NAV_ITEMS = [
  { label: 'Home', href: '#home' },
  { label: 'App', href: '#app' },
  { label: 'Our Story', href: '#our-story' },
  { label: 'Mission', href: '#mission' },
  { label: 'Features', href: '#features' },
  { label: 'Culture', href: '#culture' },
  { label: 'Road Ahead', href: '#road-ahead' },
] as const;

function useActiveSection() {
  const [active, setActive] = useState<string>('#home');

  useEffect(() => {
    const ids = NAV_ITEMS.map((item) => item.href.slice(1));
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const onScroll = () => {
      const line = window.scrollY + 120;
      const tops = elements.map((el) => el.getBoundingClientRect().top + window.scrollY);
      let index = 0;
      tops.forEach((top, i) => {
        if (top <= line && top > tops[index]) index = i;
      });

      // Mission and Culture share a row on desktop, so prefer the clicked anchor when tops tie.
      const hashIndex = elements.findIndex((el) => `#${el.id}` === window.location.hash);
      if (hashIndex !== -1 && Math.abs(tops[hashIndex] - tops[index]) < 4) index = hashIndex;

      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        index = tops.indexOf(Math.max(...tops));
      }
      setActive(`#${elements[index]?.id ?? 'home'}`);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('hashchange', onScroll);
    };
  }, []);

  return active;
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const active = useActiveSection();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gold/25 bg-asphalt/90 backdrop-blur-md">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-[4.5rem] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        <a href="#home" className="shrink-0" aria-label="Iron Miles home">
          <Logo />
        </a>

        <ul className="hidden items-center gap-1 xl:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.href;
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={isActive ? 'location' : undefined}
                  className={`relative block px-3.5 py-2 font-label text-[0.82rem] font-medium uppercase tracking-[0.08em] transition-colors focus-visible:outline-2 focus-visible:outline-gold ${
                    isActive ? 'text-gold-light' : 'text-steel hover:text-gold-light'
                  }`}
                >
                  {item.label}
                  {isActive ? (
                    <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 bg-gold" aria-hidden="true" />
                  ) : null}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href={GET_THE_APP_HREF}
            onClick={preventPlaceholder(GET_THE_APP_HREF)}
            {...externalProps(GET_THE_APP_HREF)}
            className="rounded-md border-[1.5px] border-gold bg-black/60 px-4 py-2 font-label text-xs font-semibold uppercase tracking-[0.1em] text-gold-light transition-colors hover:bg-gold hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Get the App
          </a>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gold/40 text-gold-light xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        hidden={!open}
        className="border-t border-gold/20 bg-asphalt/95 xl:hidden"
      >
        <ul className="mx-auto flex max-w-[1440px] flex-col px-4 py-3 sm:px-6">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active === item.href ? 'location' : undefined}
                className={`block border-b border-white/5 py-3 font-label text-base uppercase tracking-[0.1em] ${
                  active === item.href ? 'text-gold-light' : 'text-steel'
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
