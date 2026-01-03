/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Microsoft YaHei"', 'var(--font-inter)', 'sans-serif'],
        serif: ['"Microsoft YaHei"', 'var(--font-cinzel)', 'serif'],
        cinzel: ['var(--font-cinzel)', 'serif'],
        fzytk: ['var(--font-fzytk)', 'sans-serif'],
      },
      colors: {
        background: '#1a1a1a',
        primary: {
            DEFAULT: '#c69c6d',
            hover: '#d4af37',
        },
        secondary: '#2a2a2a',
      },
      backgroundImage: {
        'hero-pattern': "url('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2544&auto=format&fit=crop')",
      }
    },
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui'), require('tailwindcss-animate')],
}
