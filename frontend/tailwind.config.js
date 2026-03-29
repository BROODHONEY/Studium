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
          DEFAULT:'#7c3aed',
          bright: '#a78bfa',
          text:   '#c4b5fd',
          pale:   '#ede9fe',
        },
        // ── Keep brand alias for existing components ─
        brand: {
          50:  '#ede9fe',
          100: '#ddd6fe',
          200: '#c4b5fd',
          300: '#a78bfa',
          400: '#8b5cf6',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0764',
          950: '#2e1065',
        },
        // ── Semantic ─────────────────────────────────
        neon: {
          purple: '#7c3aed',
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
