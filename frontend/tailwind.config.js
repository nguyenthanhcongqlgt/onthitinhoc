/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf9',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#008a73',
          700: '#0b7a67',
          800: '#0f766e',
          900: '#134e4a',
          950: '#042f2e',
        },
        mint: {
          50: '#f4f9f7',
          100: '#e6f7f4',
          200: '#d1fae5',
          300: '#a7f3d0',
          400: '#6ee7b7',
          500: '#34d399',
          600: '#10b981',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        }
      }
    },
  },
  plugins: [],
}
