export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Core palette ─────────────────────────────
        primary: {
          DEFAULT: '#6366F1',
          hi:      '#8B8EF8',
          lo:      'rgba(99,102,241,0.12)',
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366F1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        secondary: {
          DEFAULT: '#7072A2',
          hi:      '#9092C0',
          lo:      'rgba(112,114,162,0.12)',
        },
        tertiary: {
          DEFAULT: '#BD5F00',
          hi:      '#E07B20',
          lo:      'rgba(189,95,0,0.12)',
        },
        neutral: {
          DEFAULT: '#1A1A1A',
          50:  '#F4F4F8',
          100: '#EBEBF2',
          200: '#DCDCE8',
          300: '#C0C0D0',
          400: '#9090B0',
          500: '#55556E',
          600: '#3A3A50',
          700: '#2A2A36',
          800: '#1F1F28',
          900: '#18181F',
          950: '#111116',
        },
        // ── Surface aliases (legacy compat) ──────────
        surface: {
          DEFAULT: '#18181F',
          raised:  '#1F1F28',
          border:  '#2A2A36',
          subtle:  '#222230',
          1: '#111116',
          2: '#14141C',
          3: '#1F1F28',
          4: '#2A2A36',
        },
        // ── Brand alias ───────────────────────────────
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366F1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'primary': '0 0 0 1px rgba(99,102,241,0.3)',
        'primary-glow': '0 4px 24px rgba(99,102,241,0.18)',
        'modal': '0 32px 80px rgba(0,0,0,0.85)',
      },
    },
  },
  plugins: [],
}
