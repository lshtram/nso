/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': 'var(--background)',
        'foreground': 'var(--foreground)',
        'charcoal': 'var(--charcoal)',
        'off-white': 'var(--off-white)',
        'chrome-yellow': 'var(--chrome-yellow)',
        'accent-slate': 'var(--accent-slate)',
        'sage': 'var(--sage)',
      },
    },
  },
  plugins: [],
}
