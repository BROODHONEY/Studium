/**
 * Shared design tokens — single source of truth for the palette.
 * Import this instead of defining local `const C = { ... }` in each component.
 */
export const palette = {
  shell:       '#131313',
  sidebar:     '#141414',
  surface:     '#1E1E1E',
  raised:      '#252525',
  bg:          '#181818',
  overlay:     '#2E2E2E',
  border:      '#333333',
  borderHi:    '#444444',

  primary:     '#FF6B35',
  primaryHi:   '#FF8C5A',
  primaryLo:   'rgba(255,107,53,0.10)',
  primaryMid:  'rgba(255,107,53,0.20)',

  secondary:   '#C0C1FF',
  secondaryHi: '#D4D5FF',
  secondaryLo: 'rgba(192,193,255,0.12)',

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
const AVATAR_COLORS = ['#4f46e5', '#0d9488', '#FF6B35', '#db2777', '#d97706', '#16a34a'];
export const getAvatarBg = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

/** Two-letter initials from a full name. */
export const getInitials = (name) =>
  name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';


