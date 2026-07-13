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
      keyframes: {
        'tag-pop': {
          '0%':   { opacity: '0', transform: 'translateY(10px) scale(0.6)' },
          '12%':  { opacity: '1', transform: 'translateY(-6px) scale(1.08)' },
          '20%':  { opacity: '1', transform: 'translateY(0) scale(1)' },
          '70%':  { opacity: '1', transform: 'translateY(0) scale(1)' },
          '85%':  { opacity: '0', transform: 'translateY(-12px) scale(0.9)' },
          '100%': { opacity: '0', transform: 'translateY(-12px) scale(0.9)' },
        },
      },
      animation: {
        'tag-pop': 'tag-pop 4.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

