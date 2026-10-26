/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#000080',
        primary: '#2563eb',
        turquoise: '#40e0d0',
        offwhite: '#f8fafc',
        gold: '#ffd700'
      },
      fontFamily: {
        sans: ['Tajawal', 'Cairo', 'sans-serif']
      },
      boxShadow: {
        panel: '0 12px 36px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};
