/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1A2138',
          light: '#2A3354',
          lighter: '#3D4870',
        },
        gold: {
          DEFAULT: '#C9A24B',
          light: '#DDBE78',
          dark: '#A98534',
        },
      },
      fontFamily: {
        sans: ['Rubik', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
