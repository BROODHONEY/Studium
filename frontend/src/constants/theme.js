/**
 * Shared design tokens — single source of truth for the palette.
 * Primary visual language: black / white / grey with neon-white glows.
 * Orange (#FFAA6E) is a subtle warm accent only — used sparingly.
 */
export const palette = {
  shell:       '#0d0d0d',
  sidebar:     '#111111',
  surface:     '#181818',
  raised:      '#202020',
  bg:          '#141414',
  overlay:     '#2A2A2A',
  border:      '#2E2E2E',
  borderHi:    '#3D3D3D',

  // Primary — white/grey neon
  primary:     '#E8E8E8',
  primaryHi:   '#FFFFFF',
  primaryLo:   'rgba(232,232,232,0.08)',
  primaryMid:  'rgba(232,232,232,0.14)',

  // Accent — light warm orange, used sparingly
  accent:      '#FFAA6E',
  accentHi:    '#FFC08A',
  accentLo:    'rgba(255,170,110,0.10)',

  // Secondary — mid grey
  secondary:   '#888888',
  secondaryHi: '#AAAAAA',
  secondaryLo: 'rgba(136,136,136,0.10)',

  tertiary:    '#555555',
  tertiaryHi:  '#777777',
  tertiaryLo:  'rgba(85,85,85,0.12)',

  text1:       '#F0F0F0',
  text2:       '#888888',
  text3:       '#444444',

  danger:      '#EF4444',
  dangerLo:    'rgba(239,68,68,0.10)',
  success:     '#22C55E',
  successLo:   'rgba(34,197,94,0.10)',
};

const AVATAR_COLORS = ['#4f46e5', '#0d9488', '#888', '#db2777', '#d97706', '#16a34a'];
export const getAvatarBg = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

export const getInitials = (name) =>
  name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
