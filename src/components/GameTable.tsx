import { View, Text, type ViewStyle } from "react-native";
import Card from "./Card";
import PlayerInfoCard from "./PlayerInfoCard";
import type { Card as CardType } from "../game-logic/cards";
import type { TrickCard } from "../store/gameStore";
import { colors, shadows, borderRadius } from "../theme";
import { getTeamColors } from "../theme/colors";

interface PlayerData {
  name: string;
  score: number;
  tricksWon: number;
  teamIndex: number;
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
  playerTeamIds?: number[];
  humanPlayerIndex?: number;
}

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
  playerTeamIds = [],
  humanPlayerIndex = 0,
}: GameTableProps) {
  const playerCount = playerNames.length;

  // Build seat mapping: rotate so human is always at seat index 2 (South/bottom).
  // Seats for 4 players: 0=North(top), 1=East(right), 2=South(bottom), 3=West(left)
  // We map seat positions relative to the human player.
  const getSeatOrder = (count: number, humanIdx: number): number[] => {
    const seats: number[] = [];
    for (let i = 0; i < count; i++) {
      seats.push((humanIdx + i) % count);
    }
    // seats[0] = human, seats[1] = next clockwise, etc.
    // For 4 players we want: South=human, West=next, North=across, East=prev
    // Remap: seat0(South)=seats[0], seat3(West)=seats[1], seat0(North)=seats[2], seat1(East)=seats[3]
    return seats;
  };

  // For 4 players, keep the classic N/S/E/W layout
  if (playerCount === 4) {
    const order = getSeatOrder(4, humanPlayerIndex);
    // order[0]=human(South), order[1]=left(West), order[2]=across(North), order[3]=right(East)
    const southPlayer = order[0]; // human - bottom
    const westPlayer = order[1];  // left
    const northPlayer = order[2]; // top (across)
    const eastPlayer = order[3];  // right

    return (
      <View style={{ flex: 1, margin: 8 }}>
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
          <View
            style={{
              flex: 1,
              borderRadius: 16,
              backgroundColor: colors.table.felt,
              borderWidth: 2,
              borderColor: colors.table.feltDark,
            }}
          >
            {/* North player - top */}
            <View style={{ alignItems: "center", paddingTop: 8 }}>
              <PlayerBadge
                playerIndex={northPlayer}
                playerNames={playerNames}
                playerScores={playerScores}
                currentPlayer={currentPlayer}
                dealer={dealer}
                leadPlayer={leadPlayer}
                playerTeamIds={playerTeamIds}
                humanPlayerIndex={humanPlayerIndex}
                seatPosition="top"
              />
              <PlayedCard
                trick={currentTrick}
                playerIndex={northPlayer}
                playerNames={playerNames}
                lastTrickWinner={lastTrickWinner}
                playerTeamIds={playerTeamIds}
                humanPlayerIndex={humanPlayerIndex}
                style={{ marginTop: 8 }}
              />
            </View>

            {/* Middle row: West - Center - East */}
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
              <View style={{ alignItems: "center", paddingLeft: 8, width: 100 }}>
                <PlayerBadge
                  playerIndex={westPlayer}
                  playerNames={playerNames}
                  playerScores={playerScores}
                  currentPlayer={currentPlayer}
                  dealer={dealer}
                  leadPlayer={leadPlayer}
                  playerTeamIds={playerTeamIds}
                  humanPlayerIndex={humanPlayerIndex}
                  seatPosition="left"
                />
                <PlayedCard
                  trick={currentTrick}
                  playerIndex={westPlayer}
                  playerNames={playerNames}
                  lastTrickWinner={lastTrickWinner}
                  playerTeamIds={playerTeamIds}
                  humanPlayerIndex={humanPlayerIndex}
                  style={{ marginTop: 6 }}
                />
              </View>

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

              <View style={{ alignItems: "center", paddingRight: 8, width: 100 }}>
                <PlayerBadge
                  playerIndex={eastPlayer}
                  playerNames={playerNames}
                  playerScores={playerScores}
                  currentPlayer={currentPlayer}
                  dealer={dealer}
                  leadPlayer={leadPlayer}
                  playerTeamIds={playerTeamIds}
                  humanPlayerIndex={humanPlayerIndex}
                  seatPosition="right"
                />
                <PlayedCard
                  trick={currentTrick}
                  playerIndex={eastPlayer}
                  playerNames={playerNames}
                  lastTrickWinner={lastTrickWinner}
                  playerTeamIds={playerTeamIds}
                  humanPlayerIndex={humanPlayerIndex}
                  style={{ marginTop: 6 }}
                />
              </View>
            </View>

            {/* South player (You) - bottom */}
            <View style={{ alignItems: "center", paddingBottom: 8 }}>
              <PlayedCard
                trick={currentTrick}
                playerIndex={southPlayer}
                playerNames={playerNames}
                lastTrickWinner={lastTrickWinner}
                playerTeamIds={playerTeamIds}
                humanPlayerIndex={humanPlayerIndex}
                style={{ marginBottom: 8 }}
              />
              <PlayerBadge
                playerIndex={southPlayer}
                playerNames={playerNames}
                playerScores={playerScores}
                currentPlayer={currentPlayer}
                dealer={dealer}
                leadPlayer={leadPlayer}
                playerTeamIds={playerTeamIds}
                humanPlayerIndex={humanPlayerIndex}
                isYou
                seatPosition="bottom"
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  // For other player counts: grid layout
  // Top row: opponents, Bottom: human player's card, Center: played cards
  const otherPlayers = Array.from({ length: playerCount }, (_, i) => i).filter(
    (i) => i !== humanPlayerIndex
  );

  return (
    <View style={{ flex: 1, margin: 8 }}>
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
        <View
          style={{
            flex: 1,
            borderRadius: 16,
            backgroundColor: colors.table.felt,
            borderWidth: 2,
            borderColor: colors.table.feltDark,
            padding: 8,
          }}
        >
          {/* Top area: other players in a wrapping row */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 6,
              paddingBottom: 4,
            }}
          >
            {otherPlayers.map((idx) => (
              <View key={idx} style={{ alignItems: "center" }}>
                <PlayerBadge
                  playerIndex={idx}
                  playerNames={playerNames}
                  playerScores={playerScores}
                  currentPlayer={currentPlayer}
                  dealer={dealer}
                  leadPlayer={leadPlayer}
                  playerTeamIds={playerTeamIds}
                  humanPlayerIndex={humanPlayerIndex}
                />
              </View>
            ))}
          </View>

          {/* Center: played cards in a grid */}
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {currentTrick.length === 0 ? (
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
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                {currentTrick.map((tc) => (
                  <PlayedCard
                    key={tc.playerIndex}
                    trick={currentTrick}
                    playerIndex={tc.playerIndex}
                    playerNames={playerNames}
                    lastTrickWinner={lastTrickWinner}
                    playerTeamIds={playerTeamIds}
                    humanPlayerIndex={humanPlayerIndex}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Bottom: your badge */}
          <View style={{ alignItems: "center", paddingTop: 4 }}>
            <PlayerBadge
              playerIndex={humanPlayerIndex}
              playerNames={playerNames}
              playerScores={playerScores}
              currentPlayer={currentPlayer}
              dealer={dealer}
              leadPlayer={leadPlayer}
              playerTeamIds={playerTeamIds}
              humanPlayerIndex={humanPlayerIndex}
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
  playerTeamIds,
  humanPlayerIndex,
  isYou = false,
  seatPosition,
}: {
  playerIndex: number;
  playerNames: string[];
  playerScores: PlayerData[];
  currentPlayer: number;
  dealer: number;
  leadPlayer: number;
  playerTeamIds: number[];
  humanPlayerIndex: number;
  isYou?: boolean;
  seatPosition?: "top" | "left" | "right" | "bottom";
}) {
  const isCurrent = currentPlayer === playerIndex;
  const teamIndex = playerTeamIds[playerIndex] ?? 0;
  const isDealer = dealer === playerIndex;

  const playerData = playerScores[playerIndex] || {
    name: playerNames[playerIndex] || `Player ${playerIndex + 1}`,
    score: 0,
    tricksWon: 0,
  };

  // Use explicit seat position if provided, otherwise infer from isYou
  const position = seatPosition ?? (isYou ? "bottom" : "top");

  return (
    <PlayerInfoCard
      name={playerData.name}
      score={playerData.score}
      tricksWon={playerData.tricksWon}
      isCurrentPlayer={isCurrent}
      isYou={isYou}
      teamIndex={teamIndex}
      position={position}
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
  playerTeamIds,
  humanPlayerIndex,
  style,
}: {
  trick: TrickCard[];
  playerIndex: number;
  playerNames: string[];
  lastTrickWinner?: number | null;
  playerTeamIds: number[];
  humanPlayerIndex: number;
  style?: ViewStyle;
}) {
  const playedCard = getPlayerCard(trick, playerIndex);

  if (!playedCard) {
    // Empty placeholder to maintain layout
    return <View style={[{ width: 70, height: 98 }, style]} />;
  }

  const teamIndex = playerTeamIds[playerIndex] ?? 0;
  const teamColor = getTeamColors(teamIndex);
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
          {playerIndex === humanPlayerIndex ? "You" : playerNames[playerIndex]}
        </Text>
        {isWinner && (
          <Text style={{ color: colors.gold.primary, fontSize: 8, marginLeft: 2 }}>★</Text>
        )}
      </View>
    </View>
  );
}
