export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        neon: {
          purple: '#bf5af2',
          cyan:   '#32d9fa',
          green:  '#30d158',
          yellow: '#ffd60a',
          pink:   '#ff375f',
        },
        surface: {
          DEFAULT: '#0a0a0f',
          1: '#111118',
          2: '#18181f',
          3: '#1e1e28',
          4: '#252530',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(168,85,247,0.35)',
        'neon-cyan':   '0 0 20px rgba(50,217,250,0.25)',
      }
    },
  },
  plugins: [],
}
