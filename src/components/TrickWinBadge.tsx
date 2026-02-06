/**
 * Badge that shows when a team wins a trick (+5 points)
 * Compact and positioned near the winning player
 */

import { View } from "react-native";
import { FloatingBadge } from "./Badge";

interface TrickWinBadgeProps {
  visible: boolean;
  teamIndex: number;
  isYourTeam: boolean;
  onHide?: () => void;
}

export default function TrickWinBadge({
  visible,
  teamIndex,
  isYourTeam,
  onHide,
}: TrickWinBadgeProps) {
  const variant = teamIndex === 0 ? "team1" : "team2";

  return (
    <FloatingBadge
      text="+5"
      variant={isYourTeam ? "gold" : variant}
      visible={visible}
      onHide={onHide}
    />
  );
}
