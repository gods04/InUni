import type { ImgHTMLAttributes } from 'react';

type BrandLogoVariant = 'horizontal' | 'mark';

interface BrandLogoProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  variant: BrandLogoVariant;
}

const logoSources: Record<
  BrandLogoVariant,
  { darkTheme: string; lightTheme: string }
> = {
  horizontal: {
    darkTheme: '/brand/inuni-logo-horizontal-on-dark.svg',
    lightTheme: '/brand/inuni-logo-horizontal.svg',
  },
  mark: {
    darkTheme: '/brand/inuni-logo-mark-on-dark.svg',
    lightTheme: '/brand/inuni-logo-mark.svg',
  },
};

export function BrandLogo({
  alt,
  className,
  variant,
  ...imageProps
}: BrandLogoProps) {
  const source = logoSources[variant];

  return (
    <picture>
      <source
        media="(prefers-color-scheme: dark)"
        srcSet={source.darkTheme}
      />
      <img
        {...imageProps}
        alt={alt ?? (variant === 'horizontal' ? 'InUni' : '')}
        className={className}
        src={source.lightTheme}
      />
    </picture>
  );
}
