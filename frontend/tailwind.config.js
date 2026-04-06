export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Palette from login page ──────────────────
        void:    '#000000',
        page:    '#080808',
        surface: {
          DEFAULT: '#000000',
          raised:  '#111111',
          border:  '#1c1c1c',
          subtle:  '#2a2a2a',
          // legacy aliases used by older components
          1: '#080808',
          2: '#0d0d0d',
          3: '#111111',
          4: '#1a1a1a',
        },
        // ── Purple accent ────────────────────────────
        accent: {
          deep:   '#1a0e2e',
          bg:     '#2d1a4a',
          low:    '#3d1f6b',
          mid:    '#581c87',
          DEFAULT:'#6366F1',
          bright: '#818cf8',
          text:   '#a5b4fc',
          pale:   '#e0e7ff',
        },
        // ── Keep brand alias for existing components ─
        brand: {
          50:  '#e0e7ff',
          100: '#c7d2fe',
          200: '#a5b4fc',
          300: '#818cf8',
          400: '#818cf8',
          500: '#6366F1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // ── Semantic ─────────────────────────────────
        neon: {
          purple: '#6366F1',
          cyan:   '#32d9fa',
          green:  '#30d158',
          yellow: '#ffd60a',
          pink:   '#ff375f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'accent': '0 0 0 1px rgba(124,58,237,0.3)',
        'neon-purple': '0 0 16px rgba(124,58,237,0.2)',
      }
    },
  },
  plugins: [],
}
