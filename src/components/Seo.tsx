import { useEffect } from 'react';

const SITE_ORIGIN = 'https://inuni.co.za';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/brand/inuni-logo-horizontal.png`;

interface SeoProps {
  canonicalPath: string;
  description: string;
  image?: string;
  noindex?: boolean;
  structuredData?: Record<string, unknown>;
  title: string;
  type?: 'website' | 'article';
}

function absoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_ORIGIN}${normalizedPath}`;
}

function getOrCreateMeta(attribute: 'name' | 'property', key: string) {
  let meta = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }

  meta.dataset.seo = 'managed';
  return meta;
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  getOrCreateMeta(attribute, key).setAttribute('content', content);
}

function getOrCreateCanonical() {
  let link = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );

  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }

  link.dataset.seo = 'managed';
  return link;
}

function setStructuredData(data?: Record<string, unknown>) {
  document.head
    .querySelectorAll('script[type="application/ld+json"][data-seo="structured-data"]')
    .forEach((script) => script.remove());

  if (!data) return;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.dataset.seo = 'structured-data';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function Seo({
  canonicalPath,
  description,
  image = DEFAULT_IMAGE,
  noindex = false,
  structuredData,
  title,
  type = 'website',
}: SeoProps) {
  useEffect(() => {
    const canonicalUrl = absoluteUrl(canonicalPath);
    const imageUrl = absoluteUrl(image);

    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');
    setMeta('property', 'og:site_name', 'InUni');
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:image', imageUrl);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', imageUrl);
    getOrCreateCanonical().href = canonicalUrl;
    setStructuredData(structuredData);
  }, [canonicalPath, description, image, noindex, structuredData, title, type]);

  return null;
}
