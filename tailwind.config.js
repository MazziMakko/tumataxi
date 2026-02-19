/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Pillar 4: Sovereign — Emerald & Copper Ore accents
        emerald: {
          DEFAULT: '#10b981',
          dim: 'rgba(16, 185, 129, 0.15)',
        },
        copper: {
          DEFAULT: '#b87333',
          ore: '#b87333',
          dim: 'rgba(184, 115, 51, 0.2)',
        },
        // Black Gold - Tuma Taxi Brand
        primary: {
          DEFAULT: '#FFD700',
          50: '#fffde7',
          100: '#fff9c4',
          200: '#fff59d',
          300: '#fff176',
          400: '#ffed4e',
          500: '#FFD700',
          600: '#ffc107',
          700: '#ffb300',
          800: '#ffa000',
          900: '#ff8f00',
        },
        secondary: {
          DEFAULT: '#000000',
          50: '#fafafa',
          100: '#fafafa',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
