/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        brand: {
          50: 'rgb(var(--color-brand-50) / <alpha-value>)',
          100: 'rgb(var(--color-brand-100) / <alpha-value>)',
          600: 'rgb(var(--color-brand-600) / <alpha-value>)',
          700: 'rgb(var(--color-brand-700) / <alpha-value>)',
        },
      },
      boxShadow: {
        soft: '0 12px 36px rgb(var(--shadow-soft) / var(--shadow-soft-alpha))',
      },
    },
  },
  plugins: [],
};
