import type { MouseEvent } from 'react';
import { STORE_LINKS, isPlaceholderLink } from '../config/links';

function preventPlaceholder(href: string) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (isPlaceholderLink(href)) event.preventDefault();
  };
}

function externalProps(href: string) {
  return isPlaceholderLink(href) ? {} : { target: '_blank', rel: 'noopener noreferrer' };
}

function GooglePlayLogo() {
  return (
    <svg viewBox="0 0 24 26" className="h-7 w-7 shrink-0" aria-hidden="true">
      <path d="M1 1.2 13.6 13 1 24.8c-.4-.3-.6-.8-.6-1.4V2.6c0-.6.2-1.1.6-1.4Z" fill="#00d7fe" />
      <path d="M17.8 8.8 13.6 13 1 1.2c.4-.4 1.1-.5 1.8-.1l15 7.7Z" fill="#00f076" />
      <path d="M17.8 17.2 2.8 24.9c-.7.4-1.4.3-1.8-.1L13.6 13l4.2 4.2Z" fill="#ff3a44" />
      <path d="m22.4 11.5-4.6-2.7L13.6 13l4.2 4.2 4.6-2.7c1.1-.6 1.1-2.4 0-3Z" fill="#ffd400" />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 fill-white" aria-hidden="true">
      <path d="M16.4 12.7c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4.1ZM13.9 5.1c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5Z" />
    </svg>
  );
}

const badgeClass =
  'inline-flex h-14 min-w-[10.5rem] items-center gap-2.5 rounded-lg border border-[#8a8a85] bg-black px-3.5 text-left text-white shadow-[0_6px_18px_rgba(0,0,0,0.5)] transition-colors hover:border-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';

type StoreBadgesProps = {
  className?: string;
  size?: 'md' | 'sm';
};

export default function StoreBadges({ className = '', size = 'md' }: StoreBadgesProps) {
  const scale = size === 'sm' ? 'scale-90 origin-left' : '';
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <a
        href={STORE_LINKS.googlePlay}
        onClick={preventPlaceholder(STORE_LINKS.googlePlay)}
        {...externalProps(STORE_LINKS.googlePlay)}
        className={`${badgeClass} ${scale}`}
        aria-label="Get Iron Miles on Google Play"
      >
        <GooglePlayLogo />
        <span className="leading-none">
          <span className="block text-[0.6rem] font-medium uppercase tracking-wide">Get it on</span>
          <span className="block text-[1.35rem] font-medium tracking-tight">Google Play</span>
        </span>
      </a>
      <a
        href={STORE_LINKS.appStore}
        onClick={preventPlaceholder(STORE_LINKS.appStore)}
        {...externalProps(STORE_LINKS.appStore)}
        className={`${badgeClass} ${scale}`}
        aria-label="Download Iron Miles on the App Store"
      >
        <AppleLogo />
        <span className="leading-none">
          <span className="block text-[0.65rem] font-medium">Download on the</span>
          <span className="block text-[1.4rem] font-medium tracking-tight">App Store</span>
        </span>
      </a>
    </div>
  );
}

export { preventPlaceholder, externalProps };
