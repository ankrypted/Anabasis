/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        neon: {
          orange: '#FF6B00',
          glow: '#FF8A3D',
        },
      },
      boxShadow: {
        neon: '0 0 20px rgba(255,107,0,0.6), 0 0 60px rgba(255,107,0,0.35)',
        'neon-sm': '0 0 10px rgba(255,107,0,0.55)',
      },
      dropShadow: {
        neon: '0 0 8px rgba(255,107,0,0.8)',
      },
    },
  },
  plugins: [],
}

