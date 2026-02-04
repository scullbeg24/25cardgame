/**
 * Reusable animation configs
 * Speed can be adjusted via settings (animationSpeed)
 */

import type { AnimationSpeed } from "../store/settingsStore";

export function getSpringConfig(speed: AnimationSpeed) {
  switch (speed) {
    case "slow":
      return { damping: 15, stiffness: 100 };
    case "fast":
      return { damping: 25, stiffness: 300 };
    case "off":
      return { damping: 100, stiffness: 1000 };
    default:
      return { damping: 20, stiffness: 200 };
  }
}
