/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF9F0D',
          amber: '#FFA500',
          yellow: '#FFB800',
          dark: '#121212',
          darker: '#0B0B0B',
          card: '#181818',
          surface: '#F8F9FA',
          border: '#E5E7EB',
          muted: '#6B7280',
          darkText: '#111827',
        },
        midnight: {
          950: '#0B0B0B',
          900: '#121212',
          850: '#181818',
          800: '#222222',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'brand': '0 4px 20px -2px rgba(255, 159, 13, 0.35)',
        'soft': '0 2px 12px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 4px 16px -2px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
