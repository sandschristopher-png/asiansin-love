/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        brand: ['var(--font-brand)', 'sans-serif'],
        logo: ['var(--font-logo)', 'cursive'], // ail+ badge only (Playwrite IT Moderna)
      },
    },
  },
  plugins: [],
};
