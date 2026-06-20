import { describe, expect, it } from 'vitest';
import css from '../index.css?raw';
import tailwindConfig from '../../tailwind.config.js?raw';

describe('dark mode foundation', () => {
  it('defines semantic color tokens with a system dark-mode override', () => {
    expect(tailwindConfig).toContain(
      "ink: 'rgb(var(--color-ink) / <alpha-value>)'",
    );
    expect(tailwindConfig).toContain(
      "canvas: 'rgb(var(--color-canvas) / <alpha-value>)'",
    );
    expect(tailwindConfig).toContain(
      "panel: 'rgb(var(--color-panel) / <alpha-value>)'",
    );
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('color-scheme: dark');
    expect(css).toContain('--color-canvas:');
    expect(css).toContain('--color-panel:');
  });

  it('keeps common light utilities readable when the system theme is dark', () => {
    expect(css).toContain('.bg-white');
    expect(css).toContain('.text-slate-600');
    expect(css).toContain('.border-slate-100');
  });
});
