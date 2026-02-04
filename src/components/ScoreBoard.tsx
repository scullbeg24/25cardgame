import { View, Text } from "react-native";

interface ScoreBoardProps {
  team1Score: number;
  team2Score: number;
  team1HandsWon: number;
  team2HandsWon: number;
  tricksThisHand?: { team1: number; team2: number };
  team1Players?: string[];
  team2Players?: string[];
  lastTrickWinner?: number | null;
}

const POINTS_TO_WIN = 25;

export default function ScoreBoard({
  team1Score,
  team2Score,
  team1HandsWon,
  team2HandsWon,
  tricksThisHand = { team1: 0, team2: 0 },
  team1Players = ["North", "You"],
  team2Players = ["East", "West"],
  lastTrickWinner,
}: ScoreBoardProps) {
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
