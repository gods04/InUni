/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1d1f23',
        canvas: '#f5f6f8',
        line: '#e5e8ec',
        brand: {
          50: '#eef3f8',
          100: '#e1e9f2',
          600: '#5f7fa3',
          700: '#4d6b8d',
        },
      },
      boxShadow: {
        soft: '0 12px 36px rgba(29, 31, 35, 0.07)',
      },
    },
  },
  plugins: [],
};
