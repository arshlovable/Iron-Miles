export const STORE_LINKS = {
  googlePlay: 'https://play.google.com/store/apps/details?id=com.ironmiles.app',
  appStore: 'https://apps.apple.com/ca/app/id6814315997',
} as const;

/** Nav CTA: scroll to the dual-store download section. */
export const GET_THE_APP_HREF = '#road-ahead';

export function isPlaceholderLink(href: string): boolean {
  return href === '#' || href.trim() === '';
}

export function isExternalLink(href: string): boolean {
  return href.startsWith('https://') || href.startsWith('http://');
}

export const SITE_URL = 'https://ironmiles.app';
