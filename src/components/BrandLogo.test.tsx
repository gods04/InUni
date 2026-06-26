import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandLogo } from './BrandLogo';

describe('BrandLogo', () => {
  it('uses the light horizontal logo in dark system themes', () => {
    render(<BrandLogo alt="InUni" className="h-10 w-auto" variant="horizontal" />);

    const image = screen.getByRole('img', { name: 'InUni' });
    const picture = image.closest('picture');
    const darkSource = picture?.querySelector(
      'source[media="(prefers-color-scheme: dark)"]',
    );

    expect(image).toHaveAttribute('src', '/brand/inuni-logo-horizontal-dark.png');
    expect(darkSource).toHaveAttribute(
      'srcset',
      '/brand/inuni-logo-horizontal.png',
    );
  });

  it('uses a visible mark asset in dark system themes', () => {
    const { container } = render(
      <BrandLogo aria-hidden="true" className="h-14 w-14" variant="mark" />,
    );

    const image = container.querySelector('img');
    const darkSource = container.querySelector(
      'source[media="(prefers-color-scheme: dark)"]',
    );

    expect(image).toHaveAttribute('src', '/brand/inuni-logo-mark-dark.png');
    expect(darkSource).toHaveAttribute('srcset', '/brand/inuni-favicon.png');
  });
});
