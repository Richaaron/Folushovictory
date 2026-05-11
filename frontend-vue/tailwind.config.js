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
        royal: {
          purple: '#581C87',
          gold: '#D4AF37',
          dark: '#0F172A',
        }
      }
    },
  },
  plugins: [],
}
