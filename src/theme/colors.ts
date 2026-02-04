/**
 * Soft UI Color Palette - Green & Gold Theme
 * A premium, classic card game aesthetic
 */

export const colors = {
  // Backgrounds (Deep Forest Greens)
  background: {
    primary: '#0d2818',      // Deepest green - main background
    secondary: '#1a3a2a',    // Dark sage - secondary surfaces
    surface: '#234332',      // Muted green - card/panel surfaces
    elevated: '#2d5541',     // Slightly lighter - hover states
  },

  // Gold Accents (Classic Card Game)
  gold: {
    primary: '#d4af37',      // Classic gold - main accent
    light: '#f4d03f',        // Bright gold - highlights, active states
    dark: '#a67c00',         // Dark gold - shadows, pressed states
    muted: '#b8973a',        // Muted gold - subtle accents
  },

  // Text Colors
  text: {
    primary: '#f5f5dc',      // Cream/beige - main text
    secondary: '#b8c4a8',    // Muted sage - secondary text
    muted: '#7a8b6e',        // Dimmed - disabled/placeholder
    accent: '#d4af37',       // Gold - important info
    inverse: '#0d2818',      // Dark - on light backgrounds
  },

  // Card Colors
  card: {
    face: '#faf8f0',         // Warm white - card face
    back: '#1e3a5f',         // Deep blue - card back
    border: '#d4af37',       // Gold trim
    shadow: 'rgba(0, 0, 0, 0.3)',
  },

  // Suit Colors
  suits: {
    hearts: '#dc2626',
    diamonds: '#dc2626',
    clubs: '#1f2937',
    spades: '#1f2937',
  },

  // Team Colors (modernized)
  teams: {
    team1: {
      primary: '#3b82f6',    // Blue
      light: '#60a5fa',
      dark: '#1d4ed8',
      bg: 'rgba(59, 130, 246, 0.15)',
      bgActive: 'rgba(59, 130, 246, 0.3)',
    },
    team2: {
      primary: '#ef4444',    // Red
      light: '#f87171',
      dark: '#dc2626',
      bg: 'rgba(239, 68, 68, 0.15)',
      bgActive: 'rgba(239, 68, 68, 0.3)',
    },
  },

  // State Colors
  state: {
    active: '#d4af37',       // Gold glow for active player
    success: '#22c55e',      // Green for valid moves
    warning: '#f59e0b',      // Amber for warnings
    error: '#ef4444',        // Red for errors
  },

  // Soft UI Specific
  softUI: {
    lightShadow: 'rgba(52, 78, 65, 0.5)',   // Light shadow (top-left)
    darkShadow: 'rgba(0, 0, 0, 0.4)',       // Dark shadow (bottom-right)
    insetLight: 'rgba(255, 255, 255, 0.05)', // Inner highlight
    border: 'rgba(255, 255, 255, 0.08)',    // Subtle borders
  },

  // Table Colors
  table: {
    felt: '#1a5f3c',         // Green felt
    feltDark: '#0d3d26',     // Darker felt border
    wood: '#3d2817',         // Wood border
    woodLight: '#5a4332',    // Lighter wood
  },
} as const;

export type Colors = typeof colors;
