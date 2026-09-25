/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        plum: {
          950: '#17131F', // Deepest background canvas
          900: '#241E2F', // Card surface container
          800: '#3B1E42', // Velvet plum shadow accent
          700: '#4A154B', // Fab Mood Bedspread deep velvet
          600: '#653C87', // Primary Brand Action & Sent bubble
          500: '#5F4B66', // Smokey Amethyst (Her incoming bubble)
          400: '#7D7E92', // Slate Heather border/neutral
          300: '#9A79BA', // Lavender label highlight
          200: '#B6AEC7', // Dusty Lavender chip
          100: '#D5CEE5', // Muted text & timestamps
          50:  '#ECE8F4', // Crisp pale lilac heading/text
        },
        slateHeather: {
          DEFAULT: '#6C6F82',
          light: '#8E92A4', // Vesper Violet tone
        }
      },
    },
  },
  plugins: [],
};
