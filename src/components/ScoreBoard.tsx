import { View, Text } from "react-native";
import type { ScoreMode } from "../utils/constants";

interface ScoreBoardProps {
  scoringMode: ScoreMode;
  // Team mode data
  team1Score?: number;
  team2Score?: number;
  team1HandsWon?: number;
  team2HandsWon?: number;
  tricksThisHand?: { team1: number; team2: number };
  team1Players?: string[];
  team2Players?: string[];
  // Individual mode data
  playerNames?: string[];
  playerScores?: number[];
  playerHandsWon?: number[];
  humanPlayerIndex?: number;
  // Common
  lastTrickWinner?: number | null;
  targetScore?: number;
}

export default function ScoreBoard({
  scoringMode,
  team1Score = 0,
  team2Score = 0,
  team1HandsWon = 0,
  team2HandsWon = 0,
  tricksThisHand = { team1: 0, team2: 0 },
  team1Players = [],
  team2Players = [],
  playerNames = [],
  playerScores = [],
  playerHandsWon = [],
  humanPlayerIndex = 0,
  lastTrickWinner,
  targetScore = 25,
}: ScoreBoardProps) {
  const POINTS_TO_WIN = targetScore;
  const renderHandsDots = (won: number, teamColor: string) =>
    Array.from({ length: 5 }, (_, i) => (
      <View
        key={i}
        className={`w-3 h-3 rounded-full mx-0.5 ${
          i < won ? teamColor : "bg-neutral-700/50"
        }`}
      />
    ));

  const renderProgressBar = (score: number, color: string) => (
    <View className="w-full h-2 bg-neutral-700/50 rounded-full mt-2 overflow-hidden">
      <View
        className={`h-full ${color} rounded-full`}
        style={{ width: `${Math.min((score / POINTS_TO_WIN) * 100, 100)}%` }}
      />
    </View>
  );

  if (scoringMode === "individual") {
    // Individual mode: compact leaderboard
    const leaderboard = playerNames
      .map((name, idx) => ({
        name: idx === humanPlayerIndex ? "You" : name,
        score: playerScores[idx] ?? 0,
        hands: playerHandsWon[idx] ?? 0,
        isYou: idx === humanPlayerIndex,
        isWinner: lastTrickWinner === idx,
      }))
      .sort((a, b) => b.score - a.score || b.hands - a.hands);

    return (
      <View className="px-4 py-3">
        {leaderboard.map((entry, i) => (
          <View
            key={i}
            className={`flex-row justify-between items-center py-1.5 px-3 rounded-lg mb-1 ${
              entry.isWinner ? "bg-yellow-800/30 border border-yellow-500/50" :
              entry.isYou ? "bg-blue-800/20" : "bg-neutral-800/40"
            }`}
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-neutral-500 text-xs font-bold w-5">#{i + 1}</Text>
              <Text
                className={`text-sm font-semibold ${entry.isYou ? "text-blue-300" : "text-neutral-200"}`}
                numberOfLines={1}
              >
                {entry.name}
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <View className="flex-row">
                {Array.from({ length: 5 }, (_, j) => (
                  <View
                    key={j}
                    className={`w-2 h-2 rounded-full mx-0.5 ${
                      j < entry.hands
                        ? (entry.isYou ? "bg-blue-400" : "bg-red-400")
                        : "bg-neutral-700/50"
                    }`}
                  />
                ))}
              </View>
              <Text className="text-white text-lg font-bold min-w-[30px] text-right">
                {entry.score}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  }

  // Team mode: original 2-column layout
  const getTeamForPlayer = (playerIndex: number) => playerIndex % 2 === 0 ? 1 : 2;
  const winnerTeam = lastTrickWinner !== null && lastTrickWinner !== undefined
    ? getTeamForPlayer(lastTrickWinner)
    : null;

  return (
    <View className="px-4 py-3 flex-row justify-between items-stretch">
      {/* Team 1 - Blue */}
      <View
        className={`flex-1 items-center p-3 rounded-xl mr-2 ${
          winnerTeam === 1 ? "bg-blue-800/40 border-2 border-blue-400" : "bg-neutral-800/60"
        }`}
      >
        <View className="flex-row items-center mb-1">
          <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
          <Text className="text-blue-300 text-sm font-semibold">Your Team</Text>
        </View>
        <Text className="text-blue-200 text-xs mb-1">
          {team1Players.join(" & ")}
        </Text>
        <Text className="text-white text-3xl font-bold">
          {team1Score}
          <Text className="text-neutral-500 text-lg">/{POINTS_TO_WIN}</Text>
        </Text>
        {renderProgressBar(team1Score, "bg-blue-500")}
        <View className="flex-row mt-2">{renderHandsDots(team1HandsWon, "bg-blue-400")}</View>
        <Text className="text-neutral-400 text-xs mt-1">
          {tricksThisHand.team1} trick{tricksThisHand.team1 !== 1 ? "s" : ""} won
        </Text>
        {winnerTeam === 1 && (
          <Text className="text-blue-300 text-xs mt-1 font-semibold">★ Leading</Text>
        )}
      </View>

      {/* VS Divider */}
      <View className="justify-center px-2">
        <Text className="text-neutral-500 text-lg font-bold">vs</Text>
      </View>

      {/* Team 2 - Red */}
      <View
        className={`flex-1 items-center p-3 rounded-xl ml-2 ${
          winnerTeam === 2 ? "bg-red-800/40 border-2 border-red-400" : "bg-neutral-800/60"
        }`}
      >
        <View className="flex-row items-center mb-1">
          <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
          <Text className="text-red-300 text-sm font-semibold">Opponents</Text>
        </View>
        <Text className="text-red-200 text-xs mb-1">
          {team2Players.join(" & ")}
        </Text>
        <Text className="text-white text-3xl font-bold">
          {team2Score}
          <Text className="text-neutral-500 text-lg">/{POINTS_TO_WIN}</Text>
        </Text>
        {renderProgressBar(team2Score, "bg-red-500")}
        <View className="flex-row mt-2">{renderHandsDots(team2HandsWon, "bg-red-400")}</View>
        <Text className="text-neutral-400 text-xs mt-1">
          {tricksThisHand.team2} trick{tricksThisHand.team2 !== 1 ? "s" : ""} won
        </Text>
        {winnerTeam === 2 && (
          <Text className="text-red-300 text-xs mt-1 font-semibold">★ Leading</Text>
        )}
      </View>
    </View>
  );
}
