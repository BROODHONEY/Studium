/**
 * Shared design tokens — single source of truth for the palette.
 * Import this instead of defining local `const C = { ... }` in each component.
 */
export const palette = {
  shell:       '#0E0E0E',
  sidebar:     '#141414',
  surface:     '#1A1A1A',
  raised:      '#222222',
  bg:          '#181818',
  overlay:     '#2E2E2E',
  border:      '#2A2A2A',
  borderHi:    '#383838',

  primary:     '#C0C1FF',
  primaryHi:   '#D4D5FF',
  primaryLo:   'rgba(192,193,255,0.10)',
  primaryMid:  'rgba(192,193,255,0.20)',

  secondary:   '#FFB38E',
  secondaryHi: '#FFC9A8',
  secondaryLo: 'rgba(255,179,142,0.12)',

  tertiary:    '#9E9E9E',
  tertiaryHi:  '#BDBDBD',
  tertiaryLo:  'rgba(158,158,158,0.12)',

  text1:       '#F0F0F0',
  text2:       '#9E9E9E',
  text3:       '#555555',

  danger:      '#EF4444',
  dangerLo:    'rgba(239,68,68,0.10)',
  success:     '#22C55E',
  successLo:   'rgba(34,197,94,0.10)',
};

/** Avatar background color derived from the first character of a name. */
const AVATAR_COLORS = ['#4f46e5', '#0d9488', '#C0C1FF', '#db2777', '#d97706', '#16a34a'];
export const getAvatarBg = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

/** Two-letter initials from a full name. */
export const getInitials = (name) =>
  name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
