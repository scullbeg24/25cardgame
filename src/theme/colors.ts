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
    team3: {
      primary: '#22c55e',    // Green
      light: '#4ade80',
      dark: '#16a34a',
      bg: 'rgba(34, 197, 94, 0.15)',
      bgActive: 'rgba(34, 197, 94, 0.3)',
    },
    team4: {
      primary: '#a855f7',    // Purple
      light: '#c084fc',
      dark: '#7c3aed',
      bg: 'rgba(168, 85, 247, 0.15)',
      bgActive: 'rgba(168, 85, 247, 0.3)',
    },
    team5: {
      primary: '#f59e0b',    // Amber
      light: '#fbbf24',
      dark: '#d97706',
      bg: 'rgba(245, 158, 11, 0.15)',
      bgActive: 'rgba(245, 158, 11, 0.3)',
    },
    team6: {
      primary: '#06b6d4',    // Cyan
      light: '#22d3ee',
      dark: '#0891b2',
      bg: 'rgba(6, 182, 212, 0.15)',
      bgActive: 'rgba(6, 182, 212, 0.3)',
    },
    team7: {
      primary: '#ec4899',    // Pink
      light: '#f472b6',
      dark: '#db2777',
      bg: 'rgba(236, 72, 153, 0.15)',
      bgActive: 'rgba(236, 72, 153, 0.3)',
    },
    team8: {
      primary: '#84cc16',    // Lime
      light: '#a3e635',
      dark: '#65a30d',
      bg: 'rgba(132, 204, 22, 0.15)',
      bgActive: 'rgba(132, 204, 22, 0.3)',
    },
    team9: {
      primary: '#f97316',    // Orange
      light: '#fb923c',
      dark: '#ea580c',
      bg: 'rgba(249, 115, 22, 0.15)',
      bgActive: 'rgba(249, 115, 22, 0.3)',
    },
  },

  // State Colors
  state: {
    active: '#d4af37',       // Gold glow for active player
    success: '#22c55e',      // Green for valid moves
    warning: '#f59e0b',      // Amber for warnings
    error: '#ef4444',        // Red for errors
    info: '#3b82f6',         // Blue for informational states
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

export type TeamColorSet = {
  readonly primary: string;
  readonly light: string;
  readonly dark: string;
  readonly bg: string;
  readonly bgActive: string;
};

const teamColorKeys = [
  'team1', 'team2', 'team3', 'team4', 'team5',
  'team6', 'team7', 'team8', 'team9',
] as const;

/** Get team colors by 0-indexed team ID. Falls back to team1 for out-of-range IDs. */
export function getTeamColors(teamId: number): TeamColorSet {
  const key = teamColorKeys[teamId];
  if (key && key in colors.teams) {
    return colors.teams[key as keyof typeof colors.teams];
  }
  // Fallback for unexpected team IDs
  return colors.teams.team1;
}
