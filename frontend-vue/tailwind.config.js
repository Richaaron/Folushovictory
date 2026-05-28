/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1B2A4A',
          light: '#243656',
        },
        cream: {
          DEFAULT: '#F5F0E8',
          light: '#FAF8F3',
        },
        chalk: '#FAFAF7',
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8D08A',
          dark: '#A8872E',
        },
        sage: {
          DEFAULT: '#7A9E7E',
          light: '#A8C4AB',
        },
        burgundy: {
          DEFAULT: '#8B3A52',
          light: '#B45A74',
        },
        ink: {
          DEFAULT: '#1E1E2E',
          soft: '#3A3A4A',
        },
        parchment: {
          DEFAULT: '#F5F0E8',
          dark: '#E8E0D0',
        },
        royal: {
          purple: '#581C87',
          gold: '#D4AF37',
          dark: '#0F172A',
        },
        nebula: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        }
      },
      animation: {
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
