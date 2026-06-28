/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 5s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'rainbow': 'rainbow 3s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'border-spin': 'border-spin 4s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        rainbow: {
          '0%': { borderColor: '#ff0000', filter: 'hue-rotate(0deg)' },
          '100%': { borderColor: '#ff0000', filter: 'hue-rotate(360deg)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(167, 139, 250, 0.5), 0 0 20px rgba(167, 139, 250, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(167, 139, 250, 0.8), 0 0 30px rgba(167, 139, 250, 0.5)' },
        },
        'border-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
