import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandLogo } from './BrandLogo';

describe('BrandLogo', () => {
  it('uses the light horizontal logo by default and the on-dark logo in dark system themes', () => {
    render(<BrandLogo alt="InUni" className="h-10 w-auto" variant="horizontal" />);

    const image = screen.getByRole('img', { name: 'InUni' });
    const picture = image.closest('picture');
    const darkSource = picture?.querySelector(
      'source[media="(prefers-color-scheme: dark)"]',
    );

    expect(image).toHaveAttribute('src', '/brand/inuni-logo-horizontal.svg');
    expect(darkSource).toHaveAttribute(
      'srcset',
      '/brand/inuni-logo-horizontal-on-dark.svg',
    );
  });

  it('uses the light mark by default and the on-dark mark in dark system themes', () => {
    const { container } = render(
      <BrandLogo aria-hidden="true" className="h-14 w-14" variant="mark" />,
    );

    const image = container.querySelector('img');
    const darkSource = container.querySelector(
      'source[media="(prefers-color-scheme: dark)"]',
    );

    expect(image).toHaveAttribute('src', '/brand/inuni-logo-mark.svg');
    expect(darkSource).toHaveAttribute(
      'srcset',
      '/brand/inuni-logo-mark-on-dark.svg',
    );
  });
});
