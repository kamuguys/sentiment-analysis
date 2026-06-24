/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        sidebar: '#020617',
        card: '#111827',
        primary: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        muted: '#94A3B8'
      },
      borderRadius: {
        'xl-2': '1rem'
      }
    },
  },
  plugins: [],
}
