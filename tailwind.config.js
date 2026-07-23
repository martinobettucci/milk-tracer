/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm coral/peach accent — cozy nursery feel. Used app-wide as `milk-*`.
        milk: {
          50: '#fff6f1',
          100: '#ffe8dd',
          200: '#ffd0bd',
          300: '#ffb094',
          400: '#ff8f6b',
          500: '#f97350',
          600: '#e85d3d',
          700: '#c4472c',
          800: '#9e3a25',
          900: '#7f3020',
        },
        // Warm neutral surfaces (cream in light, toasted-stone in dark).
        cream: {
          50: '#fffdfb',
          100: '#fdf7f0',
          200: '#f7ece0',
          900: '#241d18',
          950: '#1b1512',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(79, 70, 229, 0.25)',
      },
    },
  },
  plugins: [],
}
