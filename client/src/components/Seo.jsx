import { useEffect } from 'react';

export const SITE_NAME = 'The Creative Studio';
export const DEFAULT_DESCRIPTION =
  'The Creative Studio — handmade gifts, paintings, flower bouquets, printing services and online recruitment for islanders. Create, craft, customize and share happiness.';

// Base URL used for canonical + social tags. Set VITE_SITE_URL in production
// (e.g. https://the-creativestudio.com); otherwise the current origin is used.
export function siteUrl() {
  const fromEnv = import.meta.env.VITE_SITE_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return '';
}

function upsertMeta(attr, key, content) {
  if (!key || content === undefined || content === null || content === '') return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', String(content));
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Per-page SEO: title, description, canonical, Open Graph / Twitter cards and
 * optional JSON-LD structured data. Renders nothing.
 *
 * @param {string}  title        Page title (site name is appended automatically).
 * @param {string}  description  Meta description.
 * @param {string}  [image]      Absolute image URL for social sharing.
 * @param {string}  [type]       og:type — 'website' or 'product'/'article'.
 * @param {string}  [path]       Route path (e.g. '/shop') for canonical + og:url.
 * @param {boolean} [noindex]    Keep the page out of search results.
 * @param {object}  [jsonLd]     Structured data object (schema.org).
 */
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  type = 'website',
  path,
  noindex = false,
  jsonLd,
}) {
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Handmade Gifts, Paintings & Flowers`;
    document.title = fullTitle;

    const base = siteUrl();
    const url = base && path ? `${base}${path.startsWith('/') ? path : `/${path}`}` : base;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:locale', 'en_IN');

    upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);

    upsertLink('canonical', url);

    const id = 'seo-jsonld';
    const previous = document.getElementById(id);
    if (previous) previous.remove();
    if (jsonLdString) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      script.textContent = jsonLdString;
      document.head.appendChild(script);
    }

    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [title, description, image, type, path, noindex, jsonLdString]);

  return null;
}
