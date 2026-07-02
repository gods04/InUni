import { describe, expect, it } from 'vitest';
import robots from '../../public/robots.txt?raw';
import sitemap from '../../public/sitemap.xml?raw';

describe('static SEO crawl files', () => {
  it('allows public pages while excluding private app routes from robots.txt', () => {
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain('Disallow: /profile');
    expect(robots).toContain('Disallow: /login');
    expect(robots).toContain('Disallow: /reset-password');
    expect(robots).toContain('Sitemap: https://inuni.co.za/sitemap.xml');
  });

  it('lists crawlable public UCT student forum pages in the sitemap', () => {
    expect(sitemap).toContain('<loc>https://inuni.co.za/</loc>');
    expect(sitemap).toContain('<loc>https://inuni.co.za/files</loc>');
    expect(sitemap).toContain('<loc>https://inuni.co.za/tools</loc>');
    expect(sitemap).toContain(
      '<loc>https://inuni.co.za/post/engineering-handbook-where-do-i-check-course-rules</loc>',
    );
    expect(sitemap).toContain(
      '<loc>https://inuni.co.za/post/commerce-handbook-link-for-bcom-and-bbussc</loc>',
    );
    expect(sitemap).not.toContain('99999999-9999-4999-8999-999999999991');
    expect(sitemap).not.toContain('<loc>https://inuni.co.za/admin</loc>');
    expect(sitemap).not.toContain('<loc>https://inuni.co.za/profile</loc>');
  });
});
