/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        galaxy: {
          900: '#0a0015',
          800: '#12002a',
          700: '#1a0040',
          600: '#2d0060',
        },
        kawaii: {
          purple: '#c084fc',
          pink: '#f9a8d4',
          blue: '#93c5fd',
          teal: '#5eead4',
          yellow: '#fde68a',
          white: '#f0e6ff',
        },
      },
      fontFamily: {
        cute: ['"Nunito"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(192, 132, 252, 0.4)',
        'glow-pink': '0 0 20px rgba(249, 168, 212, 0.4)',
        'glow-blue': '0 0 20px rgba(147, 197, 253, 0.3)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        twinkle: 'twinkle 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
}
