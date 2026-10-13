/** @type {import('tailwindcss').Config} */
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: Object.fromEntries(
        ['bg','surface','surface-2','fg','muted','line','accent','accent-fg','accent-soft','inc','inc-soft','nec','nec-soft','unn','unn-soft'].map((n) => [n, v(n)])
      ),
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        num: ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      borderRadius: { card: '14px' },
    },
  },
  plugins: [],
};
