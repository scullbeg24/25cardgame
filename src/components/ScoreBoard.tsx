import { View, Text } from "react-native";
import { getTeamColors } from "../theme/colors";
import type { TeamScores, TeamHandsWon } from "../game-logic/types";

interface TeamData {
  teamId: number;
  score: number;
  handsWon: number;
  tricksWon: number;
  players: string[];
  isYourTeam: boolean;
}

interface ScoreBoardProps {
  teams: TeamData[];
  lastTrickWinner?: number | null;
  playerTeamIds?: number[];
}

const POINTS_TO_WIN = 25;

export default function ScoreBoard({
  teams,
  lastTrickWinner,
  playerTeamIds = [],
}: ScoreBoardProps) {
  const winnerTeamId =
    lastTrickWinner !== null && lastTrickWinner !== undefined
      ? playerTeamIds[lastTrickWinner] ?? null
      : null;

  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, justifyContent: "space-between", alignItems: "stretch" }}>
      {teams.map((team, i) => {
        const tc = getTeamColors(team.teamId);
        const isLeading = winnerTeamId === team.teamId;

        return (
          <View key={team.teamId} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            {i > 0 && (
              <View style={{ justifyContent: "center", paddingHorizontal: 8 }}>
                <Text style={{ color: "#737373", fontSize: 18, fontWeight: "bold" }}>vs</Text>
              </View>
            )}
            <View
              style={{
                flex: 1,
                alignItems: "center",
                padding: 12,
                borderRadius: 12,
                backgroundColor: isLeading ? tc.bgActive : "rgba(38, 38, 38, 0.6)",
                borderWidth: isLeading ? 2 : 0,
                borderColor: isLeading ? tc.light : "transparent",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: tc.primary,
                    marginRight: 8,
                  }}
                />
                <Text style={{ color: tc.light, fontSize: 14, fontWeight: "600" }}>
                  {team.isYourTeam ? "Your Team" : `Team ${team.teamId + 1}`}
                </Text>
              </View>
              <Text style={{ color: tc.light, fontSize: 12, marginBottom: 4 }}>
                {team.players.join(" & ")}
              </Text>
              <Text style={{ color: "#fff", fontSize: 30, fontWeight: "bold" }}>
                {team.score}
                <Text style={{ color: "#737373", fontSize: 18 }}>/{POINTS_TO_WIN}</Text>
              </Text>
              {/* Progress bar */}
              <View
                style={{
                  width: "100%",
                  height: 8,
                  backgroundColor: "rgba(64, 64, 64, 0.5)",
                  borderRadius: 4,
                  marginTop: 8,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    backgroundColor: tc.primary,
                    borderRadius: 4,
                    width: `${Math.min((team.score / POINTS_TO_WIN) * 100, 100)}%`,
                  }}
                />
              </View>
              {/* Hands dots */}
              <View style={{ flexDirection: "row", marginTop: 8 }}>
                {Array.from({ length: 5 }, (_, j) => (
                  <View
                    key={j}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      marginHorizontal: 2,
                      backgroundColor: j < team.handsWon ? tc.light : "rgba(64, 64, 64, 0.5)",
                    }}
                  />
                ))}
              </View>
              <Text style={{ color: "#a3a3a3", fontSize: 12, marginTop: 4 }}>
                {team.tricksWon} trick{team.tricksWon !== 1 ? "s" : ""} won
              </Text>
              {isLeading && (
                <Text style={{ color: tc.light, fontSize: 12, fontWeight: "600", marginTop: 4 }}>
                  ★ Leading
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
