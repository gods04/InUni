import type { ReactNode } from 'react';

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;
const TRAILING_PUNCTUATION_PATTERN = /[.,!?;:]+$/;

function splitUrlToken(token: string) {
  let href = token;
  let suffix = '';

  while (TRAILING_PUNCTUATION_PATTERN.test(href)) {
    suffix = `${href.at(-1) ?? ''}${suffix}`;
    href = href.slice(0, -1);
  }

  return { href, suffix };
}

function decodePathname(pathname: string) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function cleanFileLabel(segment: string) {
  return segment
    .replace(/\.[a-z0-9]{2,6}$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^(\d{4}|uct ac za)\s+/i, '')
    .replace(/\s+\d+[a-z]?$/i, '')
    .trim();
}

export function getLinkDisplayText(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.replace(/^www\./i, '');
    const decodedPath = decodePathname(url.pathname);

    if (/ebe-handbook/i.test(decodedPath)) {
      return 'Engineering and the Built Environment UG Handbook PDF';
    }

    if (/commerce-handbook/i.test(decodedPath)) {
      return 'Commerce UG Handbook PDF';
    }

    if (/undergraduate-prospectus/i.test(decodedPath)) {
      return hostname.endsWith('uct.ac.za')
        ? 'UCT undergraduate prospectus'
        : 'Undergraduate prospectus';
    }

    const segments = decodedPath.split('/').filter(Boolean);
    const lastSegment = segments.at(-1) ?? '';
    const extension = lastSegment.match(/\.([a-z0-9]{2,6})$/i)?.[1].toUpperCase();
    const fileLabel = cleanFileLabel(lastSegment);

    if (fileLabel) {
      return extension ? `${fileLabel} ${extension}` : fileLabel;
    }

    return hostname;
  } catch {
    return rawUrl;
  }
}

export function getTextWithReadableLinks(text: string) {
  return text.replace(URL_PATTERN, (token) => {
    const { href, suffix } = splitUrlToken(token);
    return `${getLinkDisplayText(href)}${suffix}`;
  });
}

export function LinkedText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const token = match[0];
    const index = match.index ?? 0;
    const { href, suffix } = splitUrlToken(token);

    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }

    parts.push(
      <a
        className="font-semibold text-brand-700 underline decoration-brand-100 underline-offset-4 transition hover:text-brand-600 hover:decoration-brand-600"
        href={href}
        key={`${href}-${index}`}
        rel="noopener noreferrer"
        target="_blank"
        title={href}
      >
        {getLinkDisplayText(href)}
      </a>,
    );

    if (suffix) {
      parts.push(suffix);
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
