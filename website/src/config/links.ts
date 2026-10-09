// Placeholder store links. Replace '#' with the real listing URLs once they are public.
export const STORE_LINKS = {
  googlePlay: '#',
  appStore: '#',
} as const;

export const GET_THE_APP_HREF = '#';

export function isPlaceholderLink(href: string): boolean {
  return href === '#' || href.trim() === '';
}

export const SITE_URL = 'https://ironmiles.app';
