/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8F4F8',
          100: '#D1E9F1',
          200: '#A3D3E3',
          300: '#75BDD5',
          400: '#4A90E2',
          500: '#357ABD',
          600: '#2A6298',
          700: '#1F4972',
          800: '#14314C',
          900: '#0A1826',
        },
        accent: {
          green: '#B0DFC4',
          gold: '#D4AF37',
          pink: '#FFC0CB',
        },
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        info: '#17a2b8',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'custom': '0 4px 10px rgba(0, 0, 0, 0.05)',
        'custom-lg': '0 10px 30px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}