/**
 * Soft UI Shadow Styles
 * Neumorphic shadows for depth and dimension
 */

import { colors } from './colors';

// Soft UI shadow configurations
export const shadows = {
  // Extruded (raised) elements - buttons, cards, panels
  extruded: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 8, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 10,
    },
  },

  // Inset (pressed) elements - input fields, inactive buttons
  inset: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: -2, height: -2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 0,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: -3, height: -3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 0,
    },
  },

  // Gold glow for active states
  goldGlow: {
    shadowColor: colors.gold.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  // Subtle card shadow
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },

  // Table shadow
  table: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

// Border radius values for consistency
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
} as const;

// Spacing values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export type Shadows = typeof shadows;
export type BorderRadius = typeof borderRadius;
