export const colors = {
  primary: '#FF6B35',
  primaryDark: '#E55A25',
  primaryLight: '#FF8C5A',

  background: '#0D1B2A',
  surface: '#1E2D3D',
  card: '#243447',
  cardElevated: '#2A3D54',

  accent: '#00C9A7',
  accentDark: '#00A88C',

  success: '#4ECDC4',
  warning: '#FFE66D',
  danger: '#FF6B6B',
  info: '#74B9FF',

  textPrimary: '#FFFFFF',
  textSecondary: '#8899AA',
  textMuted: '#556677',
  textDark: '#0D1B2A',

  border: '#2A3F54',
  borderLight: '#3A5068',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Status colors
  statusPending: '#FFE66D',
  statusAccepted: '#74B9FF',
  statusEnRoute: '#00C9A7',
  statusArrived: '#A29BFE',
  statusCompleted: '#4ECDC4',
  statusCancelled: '#FF6B6B',

  // Role colors
  roleOwner: '#FF6B35',
  roleMechanic: '#00C9A7',
  roleAdmin: '#A29BFE',
} as const;

export type Color = keyof typeof colors;
