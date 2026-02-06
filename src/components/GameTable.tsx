import { View, Text, type ViewStyle } from "react-native";
import Card from "./Card";
import PlayerInfoCard from "./PlayerInfoCard";
import type { Card as CardType } from "../game-logic/cards";
import type { TrickCard } from "../store/gameStore";
import { colors, shadows, borderRadius } from "../theme";

interface PlayerData {
  name: string;
  score: number;
  tricksWon: number;
  teamIndex?: 0 | 1;
}

interface GameTableProps {
  currentTrick: TrickCard[];
  playerNames: string[];
  currentPlayer: number;
  trumpSuit: string;
  trumpCard?: CardType | null;
  lastTrickWinner?: number | null;
  leadPlayer: number;
  dealer?: number;
  playerScores?: PlayerData[];
  playerCardCounts?: number[];
}

// Team index: 0 = your team (players 0, 2), 1 = opponent (players 1, 3)
const getTeamIndex = (playerIndex: number): 0 | 1 => {
  return playerIndex % 2 === 0 ? 0 : 1;
};

// Get the played card for a specific player from the current trick
const getPlayerCard = (currentTrick: TrickCard[], playerIndex: number): TrickCard | undefined => {
  return currentTrick.find(tc => tc.playerIndex === playerIndex);
};

export default function GameTable({
  currentTrick,
  playerNames,
  currentPlayer,
  lastTrickWinner,
  leadPlayer,
  dealer = 0,
  playerScores = [],
}: GameTableProps) {

  return (
    <View style={{ flex: 1, margin: 8 }}>
      {/* Table outer edge - wood with gold accent */}
      <View 
        style={{
          flex: 1,
          borderRadius: 20,
          padding: 4,
          backgroundColor: colors.table.wood,
          ...shadows.table,
          borderWidth: 2,
          borderColor: colors.gold.dark,
        }}
      >
        {/* Table felt surface */}
        <View 
          style={{
            flex: 1,
            borderRadius: 16,
            backgroundColor: colors.table.felt,
            borderWidth: 2,
            borderColor: colors.table.feltDark,
          }}
        >
          {/* North player (index 0) - top */}
          <View style={{ alignItems: "center", paddingTop: 8 }}>
            <PlayerBadge
              playerIndex={0}
              playerNames={playerNames}
              playerScores={playerScores}
              currentPlayer={currentPlayer}
              dealer={dealer}
              leadPlayer={leadPlayer}
            />
            {/* North's played card - below their badge */}
            <PlayedCard
              trick={currentTrick}
              playerIndex={0}
              playerNames={playerNames}
              lastTrickWinner={lastTrickWinner}
              style={{ marginTop: 8 }}
            />
          </View>

          {/* Middle row: West - Center - East */}
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            {/* West player (index 3) - left side */}
            <View style={{ alignItems: "center", paddingLeft: 8, width: 100 }}>
              <PlayerBadge
                playerIndex={3}
                playerNames={playerNames}
                playerScores={playerScores}
                currentPlayer={currentPlayer}
                dealer={dealer}
                leadPlayer={leadPlayer}
              />
              {/* West's played card - to the right of their badge */}
              <PlayedCard
                trick={currentTrick}
                playerIndex={3}
                playerNames={playerNames}
                lastTrickWinner={lastTrickWinner}
                style={{ marginTop: 6 }}
              />
            </View>

            {/* Center area - empty when no cards, or show waiting indicator */}
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              {currentTrick.length === 0 && (
                <View 
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.1)",
                    borderWidth: 1,
                    borderColor: colors.gold.dark + "40",
                    borderStyle: "dashed",
                  }}
                >
                  <Text style={{ color: colors.text.muted, fontSize: 9 }}>Play</Text>
                </View>
              )}
            </View>

            {/* East player (index 1) - right side */}
            <View style={{ alignItems: "center", paddingRight: 8, width: 100 }}>
              <PlayerBadge
                playerIndex={1}
                playerNames={playerNames}
                playerScores={playerScores}
                currentPlayer={currentPlayer}
                dealer={dealer}
                leadPlayer={leadPlayer}
              />
              {/* East's played card - to the left of their badge */}
              <PlayedCard
                trick={currentTrick}
                playerIndex={1}
                playerNames={playerNames}
                lastTrickWinner={lastTrickWinner}
                style={{ marginTop: 6 }}
              />
            </View>
          </View>

          {/* South player (index 2) - You - bottom */}
          <View style={{ alignItems: "center", paddingBottom: 8 }}>
            {/* Your played card - above your badge */}
            <PlayedCard
              trick={currentTrick}
              playerIndex={2}
              playerNames={playerNames}
              lastTrickWinner={lastTrickWinner}
              style={{ marginBottom: 8 }}
            />
            <PlayerBadge
              playerIndex={2}
              playerNames={playerNames}
              playerScores={playerScores}
              currentPlayer={currentPlayer}
              dealer={dealer}
              leadPlayer={leadPlayer}
              isYou
            />
          </View>
        </View>
      </View>
    </View>
  );
}

// Helper component for player badge
function PlayerBadge({
  playerIndex,
  playerNames,
  playerScores,
  currentPlayer,
  dealer,
  leadPlayer,
  isYou = false,
}: {
  playerIndex: number;
  playerNames: string[];
  playerScores: PlayerData[];
  currentPlayer: number;
  dealer: number;
  leadPlayer: number;
  isYou?: boolean;
}) {
  const isCurrent = currentPlayer === playerIndex;
  const teamIndex = getTeamIndex(playerIndex);
  const isDealer = dealer === playerIndex;
  
  const playerData = playerScores[playerIndex] || {
    name: playerNames[playerIndex] || `Player ${playerIndex + 1}`,
    score: 0,
    tricksWon: 0,
  };

  return (
    <PlayerInfoCard
      name={playerData.name}
      score={playerData.score}
      tricksWon={playerData.tricksWon}
      isCurrentPlayer={isCurrent}
      isYou={isYou}
      teamIndex={teamIndex}
      position={playerIndex === 0 ? "top" : playerIndex === 1 ? "right" : playerIndex === 2 ? "bottom" : "left"}
      isLeader={leadPlayer === playerIndex}
      isDealer={isDealer}
    />
  );
}

// Helper component for played card
function PlayedCard({
  trick,
  playerIndex,
  playerNames,
  lastTrickWinner,
  style,
}: {
  trick: TrickCard[];
  playerIndex: number;
  playerNames: string[];
  lastTrickWinner?: number | null;
  style?: ViewStyle;
}) {
  const playedCard = getPlayerCard(trick, playerIndex);
  
  if (!playedCard) {
    // Empty placeholder to maintain layout
    return <View style={[{ width: 70, height: 98 }, style]} />;
  }

  const teamIndex = getTeamIndex(playerIndex);
  const teamColor = teamIndex === 0 ? colors.teams.team1 : colors.teams.team2;
  const isWinner = lastTrickWinner === playerIndex;

  return (
    <View style={[{ alignItems: "center" }, style]}>
      <View style={{ transform: [{ scale: isWinner ? 1.05 : 1 }] }}>
        <Card card={playedCard.card} faceUp size="small" />
      </View>
      {/* Small label showing who played */}
      <View 
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 2,
          paddingHorizontal: 5,
          paddingVertical: 1,
          borderRadius: 6,
          backgroundColor: teamColor.bg,
        }}
      >
        <View 
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: teamColor.primary,
            marginRight: 3,
          }}
        />
        <Text style={{ color: teamColor.light, fontSize: 8 }}>
          {playerIndex === 2 ? "You" : playerNames[playerIndex]}
        </Text>
        {isWinner && (
          <Text style={{ color: colors.gold.primary, fontSize: 8, marginLeft: 2 }}>★</Text>
        )}
      </View>
    </View>
  );
}
