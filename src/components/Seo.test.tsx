import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Seo } from './Seo';

function getMeta(selector: string): HTMLMetaElement | null {
  return document.head.querySelector(selector);
}

function getCanonical(): HTMLLinkElement | null {
  return document.head.querySelector('link[rel="canonical"]');
}

function getStructuredData(): HTMLScriptElement | null {
  return document.head.querySelector('script[type="application/ld+json"][data-seo="structured-data"]');
}

describe('Seo', () => {
  afterEach(() => {
    document.title = '';
    document.head
      .querySelectorAll('[data-seo="managed"], [data-seo="structured-data"]')
      .forEach((element) => element.remove());
  });

  it('writes discoverable page metadata for public UCT student forum pages', async () => {
    render(
      <Seo
        canonicalPath="/"
        description="InUni is a UCT student forum for campus questions, study help, handbooks, shared files, and student conversations."
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'InUni',
          url: 'https://inuni.co.za/',
        }}
        title="InUni | UCT Student Forum"
      />,
    );

    await waitFor(() =>
      expect(document.title).toBe('InUni | UCT Student Forum'),
    );
    expect(getMeta('meta[name="description"]')).toHaveAttribute(
      'content',
      'InUni is a UCT student forum for campus questions, study help, handbooks, shared files, and student conversations.',
    );
    expect(getMeta('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'InUni | UCT Student Forum',
    );
    expect(getMeta('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://inuni.co.za/',
    );
    expect(getMeta('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
    expect(getCanonical()).toHaveAttribute('href', 'https://inuni.co.za/');
    expect(getStructuredData()?.textContent).toContain('"@type":"WebSite"');
  });

  it('marks private utility routes as noindex without losing canonical URLs', async () => {
    render(
      <Seo
        canonicalPath="/login"
        description="Log in to InUni."
        noindex
        title="Log in | InUni"
      />,
    );

    await waitFor(() => expect(document.title).toBe('Log in | InUni'));
    expect(getMeta('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex,nofollow',
    );
    expect(getCanonical()).toHaveAttribute(
      'href',
      'https://inuni.co.za/login',
    );
  });
});
