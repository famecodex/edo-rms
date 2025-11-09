/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        edoBlue: '#1D4ED8',
        edoPurple: '#7C3AED',
        edoGreen: '#10B981'
      },
      boxShadow: {
        soft: '0 6px 20px rgba(17,24,39,0.06)'
      }
    }
  },
  plugins: []
};
