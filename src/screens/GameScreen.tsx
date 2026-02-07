import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, StatusBar, Dimensions, Pressable, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useGameStore } from "../store/gameStore";
import { useGameLogStore } from "../store/gameLogStore";
import type { Card, Suit } from "../game-logic/cards";
import { isTrump } from "../game-logic/cards";
import { selectAICard, getAIDelay, type TrickEntry } from "../game-logic/ai";
import { getHumanPlayerIndex } from "../utils/constants";
import {
  playCardPlay,
  playCardDeal,
  playTrickWon,
  playHandWon,
  playTrumpReveal,
  playRob,
  playInvalidMove,
  playTopTrump,
  playPerfectTrick,
} from "../utils/sounds";
import GameTable from "../components/GameTable";
import BottomPanel from "../components/BottomPanel";
import RobPrompt from "../components/RobPrompt";
import DealingAnimation from "../components/DealingAnimation";
import AlertModal from "../components/AlertModal";
import TrickWinBadge from "../components/TrickWinBadge";
import HandWinOverlay from "../components/HandWinOverlay";
import RobBadge from "../components/RobBadge";
import TrumpRevealAnimation from "../components/TrumpRevealAnimation";
import TopTrumpBadge, { isTopTrump } from "../components/TopTrumpBadge";
import PerfectTrickBadge, { isPerfectTrumpTrick } from "../components/PerfectTrickBadge";
import ComebackWinBadge from "../components/ComebackWinBadge";
import NavigationHeader from "../components/NavigationHeader";
import GameLog from "../components/GameLog";
import { colors, borderRadius } from "../theme";
import type { RootStackParamList } from "./HomeScreen";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type GameNavProp = NativeStackNavigationProp<RootStackParamList, "Game">;

export default function GameScreen() {
  const navigation = useNavigation<GameNavProp>();
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastTrickWinner, setLastTrickWinner] = useState<number | null>(null);
  const [isDealing, setIsDealing] = useState(false);
  const [dealingComplete, setDealingComplete] = useState(false);
  const [dealAnimationDone, setDealAnimationDone] = useState(false);

  // Alert modal state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  // Badge and animation states
  const [showTrickWinBadge, setShowTrickWinBadge] = useState(false);
  const [trickWinTeam, setTrickWinTeam] = useState<0 | 1>(0);
  const [showHandWinOverlay, setShowHandWinOverlay] = useState(false);
  const [handWinLabel, setHandWinLabel] = useState("");
  const [handWinIsYours, setHandWinIsYours] = useState(false);
  const [handWinScore, setHandWinScore] = useState(0);
  const [showRobBadge, setShowRobBadge] = useState(false);
  const [robPlayerName, setRobPlayerName] = useState("");
  const [robIsYou, setRobIsYou] = useState(false);
  const [showTrumpReveal, setShowTrumpReveal] = useState(false);
  const [showTopTrump, setShowTopTrump] = useState(false);
  const [topTrumpCard, setTopTrumpCard] = useState<Card | null>(null);
  const [topTrumpPlayer, setTopTrumpPlayer] = useState("");
  const [topTrumpIsYou, setTopTrumpIsYou] = useState(false);
  const [topTrumpPlayerIndex, setTopTrumpPlayerIndex] = useState(0);
  const [showPerfectTrick, setShowPerfectTrick] = useState(false);
  const [showComebackWin, setShowComebackWin] = useState(false);
  const [comebackTeam, setComebackTeam] = useState<0 | 1>(0);
  const [trickWinnerIndex, setTrickWinnerIndex] = useState(0);
  const [handWinOverlayComplete, setHandWinOverlayComplete] = useState(true);
  const [pendingHandComplete, setPendingHandComplete] = useState(false);
  const [showHandHistory, setShowHandHistory] = useState(false);

  // Score history for comeback detection
  const scoreHistory = useRef<Array<{ team1: number; team2: number }>>([]);
  const prevScoresRef = useRef({ team1: 0, team2: 0 });

  // Game log functions
  const {
    logGameStart,
    logHandStart,
    logCardPlayed,
    logTrickWon,
    logTrumpRevealed,
    logRobOffered,
    logRobAccepted,
    logRobDeclined,
    logInvalidPlay,
    logHandWon,
    clearLogs,
  } = useGameLogStore();

  const {
    players,
    numPlayers,
    scoringMode,
    trumpSuit,
    trumpCard,
    currentTrick,
    currentPlayer,
    dealer,
    gamePhase,
    scores,
    handsWon,
    validMoves,
    firstPlayerThisTrick,
    robberIndex,
    trumpCardIsAce,
    robbedByPlayer,
    targetScore,
    playCard,
    completeTrick,
    completeHand,
    robPack,
    declineRob,
  } = useGameStore();

  const humanPlayerIndex = getHumanPlayerIndex(numPlayers);
  const humanPlayer = players[humanPlayerIndex];

  // Prepare player data for components
  const playerScores = players.map((p, idx) => {
    if (scoringMode === "team") {
      const teamIdx = idx % 2 === 0 ? 0 : 1;
      const teamScore = teamIdx === 0 ? scores.team1 : scores.team2;
      return {
        name: p.name,
        score: teamScore,
        tricksWon: Math.floor(teamScore / 5),
        teamIndex: teamIdx,
      };
    } else {
      return {
        name: p.name,
        score: scores.individual[idx] ?? 0,
        tricksWon: Math.floor((scores.individual[idx] ?? 0) / 5),
        teamIndex: idx, // individual color index
      };
    }
  });

  // Track last trick winner for visual feedback and logging
  const prevTrickLength = useRef(currentTrick.length);
  const prevTrickCards = useRef<Card[]>([]);

  useEffect(() => {
    if (currentTrick.length === 0 && gamePhase === "playing" && prevTrickLength.current === numPlayers) {
      setLastTrickWinner(firstPlayerThisTrick);
      // Log trick win
      const winnerName = firstPlayerThisTrick === humanPlayerIndex
        ? "You"
        : players[firstPlayerThisTrick]?.name ?? "Player";
      logTrickWon(winnerName, 5);

      // Play trick win sound
      playTrickWon();

      // Show trick win badge near the winner
      const winnerTeamIndex = scoringMode === "team" ? ((firstPlayerThisTrick % 2) as 0 | 1) : 0;
      setTrickWinTeam(winnerTeamIndex);
      setTrickWinnerIndex(firstPlayerThisTrick);
      setShowTrickWinBadge(true);

      // Check for perfect trick (all trumps)
      if (prevTrickCards.current.length === numPlayers && isPerfectTrumpTrick(prevTrickCards.current, trumpSuit)) {
        setTimeout(() => {
          setShowPerfectTrick(true);
          playPerfectTrick();
        }, 500);
      }

      const timer = setTimeout(() => setLastTrickWinner(null), 2000);
      return () => clearTimeout(timer);
    }

    // Store trick cards for perfect trick detection
    if (currentTrick.length > 0) {
      prevTrickCards.current = currentTrick.map(tc => tc.card);
    }
    prevTrickLength.current = currentTrick.length;
  }, [currentTrick.length, gamePhase, firstPlayerThisTrick, players, logTrickWon, trumpSuit, currentTrick, numPlayers, humanPlayerIndex, scoringMode]);

  // Track score history for comeback detection (team mode only)
  useEffect(() => {
    if (scoringMode === "team") {
      if (scores.team1 !== prevScoresRef.current.team1 || scores.team2 !== prevScoresRef.current.team2) {
        scoreHistory.current.push({ team1: scores.team1, team2: scores.team2 });
      }
      prevScoresRef.current = { team1: scores.team1, team2: scores.team2 };
    }
  }, [scores.team1, scores.team2, scoringMode]);

  // Detect top trump plays
  useEffect(() => {
    if (currentTrick.length > 0) {
      const lastPlay = currentTrick[currentTrick.length - 1];
      if (lastPlay && isTopTrump(lastPlay.card, trumpSuit)) {
        const playerName = lastPlay.playerIndex === humanPlayerIndex
          ? "You"
          : players[lastPlay.playerIndex]?.name ?? "Player";
        setTopTrumpCard(lastPlay.card);
        setTopTrumpPlayer(playerName);
        setTopTrumpIsYou(lastPlay.playerIndex === humanPlayerIndex);
        setTopTrumpPlayerIndex(lastPlay.playerIndex);
        setShowTopTrump(true);
        playTopTrump();
      }
    }
  }, [currentTrick.length, currentTrick, trumpSuit, players, humanPlayerIndex]);

  // Trigger dealing animation when game starts or new hand
  // Only start dealing after HandWinOverlay animation has completed
  useEffect(() => {
    if (gamePhase === "playing" || gamePhase === "robbing") {
      if (!dealingComplete && players.every(p => p.hand.length > 0) && handWinOverlayComplete) {
        setIsDealing(true);
      }
    }
  }, [gamePhase, players, dealingComplete, handWinOverlayComplete]);

  const handleDealingComplete = () => {
    setIsDealing(false);
    setDealingComplete(true);
    // Show trump reveal animation and log
    if (trumpCard) {
      setShowTrumpReveal(true);
      logTrumpRevealed(trumpCard);
      playTrumpReveal();
    }
    // 1.5s pause before rob phase can begin
    setTimeout(() => setDealAnimationDone(true), 1500);
  };

  // Reset dealing state when a new hand starts (scores reset to 0)
  useEffect(() => {
    const isScoreReset = scoringMode === "team"
      ? (scores.team1 === 0 && scores.team2 === 0)
      : scores.individual.every(s => s === 0);
    if (isScoreReset) {
      setDealingComplete(false);
      setDealAnimationDone(false);
    }
  }, [scores, scoringMode]);

  // Log game start on mount (clear previous logs)
  const hasLoggedGameStart = useRef(false);
  useEffect(() => {
    if (!hasLoggedGameStart.current && humanPlayer && players.length > 0) {
      clearLogs();
      logGameStart(humanPlayer.name);
      // Log first hand
      const dealerName = players[dealer]?.name ?? "Dealer";
      logHandStart(1, dealerName);
      hasLoggedGameStart.current = true;
    }
  }, [humanPlayer, players, dealer, clearLogs, logGameStart, logHandStart]);

  // Track hand number and log when new hand starts
  const getTotalHandsWon = () => {
    if (handsWon.mode === "team") return handsWon.team1 + handsWon.team2;
    return handsWon.individual.reduce((a, b) => a + b, 0);
  };
  const handNumber = useRef(getTotalHandsWon() + 1);
  const prevTotalHandsWon = useRef(getTotalHandsWon());

  useEffect(() => {
    const totalHands = getTotalHandsWon();
    const prevTotal = prevTotalHandsWon.current;

    // Check if a hand was won
    if (totalHands > prevTotal && gamePhase !== "gameOver") {
      let winnerLabel: string;
      let winningScore: number;
      let isYourWin: boolean;

      if (scoringMode === "team") {
        const winningTeam: 1 | 2 = handsWon.team1 > (prevTotalHandsWon.current === 0 ? -1 : handsWon.team1 - 1) && handsWon.team1 > 0 ? 1 : 2;
        winnerLabel = winningTeam === 1 ? "Your Team" : "Opponents";
        winningScore = winningTeam === 1 ? scores.team1 : scores.team2;
        isYourWin = winningTeam === 1;

        // Comeback detection (team mode only)
        if (winningScore >= targetScore) {
          const wasTeamBehind = scoreHistory.current.some(s => {
            if (winningTeam === 1) return s.team2 - s.team1 >= 10;
            return s.team1 - s.team2 >= 10;
          });
          if (wasTeamBehind) {
            setComebackTeam(winningTeam === 1 ? 0 : 1);
            setTimeout(() => setShowComebackWin(true), 2000);
          }
        }

        setHandWinLabel(winnerLabel);
        setHandWinIsYours(isYourWin);
        setHandWinScore(winningScore);
      } else {
        // Individual mode - find who won the most recent hand
        // Look at handsWon.individual to find who just incremented
        let winnerIdx = 0;
        let maxHands = 0;
        for (let i = 0; i < numPlayers; i++) {
          if ((handsWon.individual[i] ?? 0) > maxHands) {
            maxHands = handsWon.individual[i];
            winnerIdx = i;
          }
        }
        winnerLabel = winnerIdx === humanPlayerIndex ? "You" : (players[winnerIdx]?.name ?? "Player");
        winningScore = scores.individual[winnerIdx] ?? 0;
        isYourWin = winnerIdx === humanPlayerIndex;
        setHandWinLabel(winnerLabel);
        setHandWinIsYours(isYourWin);
        setHandWinScore(winningScore);
      }

      // Log hand win
      logHandWon(winnerLabel, winningScore);

      // Only celebrate when score >= 25
      if (winningScore >= targetScore) {
        playHandWon();
        setHandWinOverlayComplete(false);
        setShowHandWinOverlay(true);
      } else {
        // Hand won by fallback - no celebration
        setHandWinOverlayComplete(true);
      }

      // Reset score history for next hand
      scoreHistory.current = [];

      // Update hand number for next hand
      handNumber.current = totalHands + 1;

      // Log new hand starting (after overlay dismisses)
      setTimeout(() => {
        const dealerName = players[dealer]?.name ?? "Dealer";
        logHandStart(handNumber.current, dealerName);
      }, 2200);
    }

    prevTotalHandsWon.current = totalHands;
  }, [handsWon, gamePhase, dealer, players, logHandWon, logHandStart, scores, scoringMode, numPlayers, humanPlayerIndex]);

  // Delay trick completion so players can see the played cards
  const trickCompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (gamePhase === "trickComplete") {
      trickCompleteTimeoutRef.current = setTimeout(() => {
        completeTrick();
      }, 1500);

      return () => {
        if (trickCompleteTimeoutRef.current) {
          clearTimeout(trickCompleteTimeoutRef.current);
        }
      };
    }
  }, [gamePhase, completeTrick]);

  // When hand is complete, wait for the HandWinOverlay to finish before dealing next hand
  useEffect(() => {
    if (gamePhase === "handComplete") {
      setPendingHandComplete(true);
    }
  }, [gamePhase]);

  // Only complete the hand once the HandWinOverlay animation has finished
  useEffect(() => {
    if (pendingHandComplete && handWinOverlayComplete && !showHandWinOverlay) {
      setPendingHandComplete(false);
      completeHand();
    }
  }, [pendingHandComplete, handWinOverlayComplete, showHandWinOverlay, completeHand]);

  useEffect(() => {
    if (gamePhase === "gameOver") {
      navigation.replace("GameOver");
    }
  }, [gamePhase, navigation]);

  // Log when robbing phase starts and notify human player
  const prevRobberIndex = useRef<number>(-1);
  useEffect(() => {
    if (gamePhase === "robbing" && robberIndex !== -1 && trumpCard) {
      if (prevRobberIndex.current !== robberIndex) {
        const robberName = robberIndex === humanPlayerIndex
          ? "You"
          : players[robberIndex]?.name ?? "Player";
        logRobOffered(robberName, trumpCard);
        prevRobberIndex.current = robberIndex;
      }
    } else if (gamePhase !== "robbing") {
      prevRobberIndex.current = -1;
    }
  }, [gamePhase, robberIndex, trumpCard, players, logRobOffered, humanPlayerIndex]);

  // Handle AI robbing decision - gated on dealAnimationDone for 1.5s post-deal pause
  useEffect(() => {
    if (gamePhase !== "robbing" || robberIndex === -1 || !dealAnimationDone) return;

    const robber = players[robberIndex];
    if (!robber?.isAI || !trumpCard) return;

    const t = setTimeout(() => {
      // AI always robs (it's generally advantageous)
      const hand = robber.hand;
      if (hand.length === 0) {
        declineRob();
        logRobDeclined(robber.name);
        return;
      }

      // Find the weakest card to discard - prefer non-trump, lowest value
      const nonTrumpCards = hand.filter(
        (c) => c.suit !== trumpCard.suit && !(c.suit === "hearts" && (c.rank === "A" || c.rank === "5"))
      );
      const cardToDiscard = nonTrumpCards.length > 0
        ? nonTrumpCards.reduce((weakest, c) => {
            const rankOrder: Record<string, number> = { "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "7": 6, "8": 7, "9": 8, "10": 9, "J": 10, "Q": 11, "K": 12, "A": 13 };
            return (rankOrder[c.rank] ?? 0) < (rankOrder[weakest.rank] ?? 0) ? c : weakest;
          })
        : hand.find((c) => !(c.suit === trumpCard.suit && c.rank === "A")) ?? hand[0];

      robPack(cardToDiscard);
      logRobAccepted(robber.name, trumpCard);
      // Show rob badge for AI and play sound
      setRobPlayerName(robber.name);
      setRobIsYou(false);
      setShowRobBadge(true);
      playRob();
    }, 1500);

    return () => clearTimeout(t);
  }, [gamePhase, robberIndex, players, trumpCard, robPack, declineRob, logRobAccepted, logRobDeclined, dealAnimationDone]);

  // AI card play
  useEffect(() => {
    if (
      gamePhase !== "playing" ||
      !players[currentPlayer]?.isAI ||
      !trumpCard
    ) {
      return;
    }

    const player = players[currentPlayer];
    const delay = getAIDelay(player.difficulty ?? "medium");

    aiTimeoutRef.current = setTimeout(() => {
      const first = currentTrick[0];
      const ledSuitVal =
        first && "card" in first
          ? first.card.suit
          : first
          ? (first as { suit: import("../game-logic/cards").Suit }).suit
          : null;
      const context = {
        hand: player.hand,
        currentTrick: currentTrick as TrickEntry[],
        trumpSuit,
        ledSuit: ledSuitVal,
        currentPlayerIndex: currentPlayer,
        firstPlayerThisTrick: useGameStore.getState().firstPlayerThisTrick,
        scores,
        ruleOptions: useGameStore.getState().ruleOptions,
        numPlayers,
      };

      const card = selectAICard(context, player.difficulty ?? "medium");
      playCard(currentPlayer, card);
      logCardPlayed(player.name, card);
      playCardPlay();
    }, delay);

    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [
    gamePhase,
    currentPlayer,
    players,
    currentTrick,
    trumpSuit,
    scores,
    playCard,
    logCardPlayed,
    numPlayers,
  ]);

  // Show alert helper function
  const showAlert = useCallback((title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  }, []);

  const handleCardSelect = (card: Card) => {
    if (gamePhase !== "playing" || currentPlayer !== humanPlayerIndex) return;

    const result = playCard(humanPlayerIndex, card);

    // Handle invalid play - show alert to player
    if (!result.success && result.error) {
      const errorMessage = getInvalidPlayMessage(result.error);
      showAlert("Invalid Play", errorMessage);
      logInvalidPlay("You", result.error);
      playInvalidMove();
    } else if (result.success) {
      logCardPlayed("You", card);
      playCardPlay();
    }
  };

  // Get user-friendly error message for invalid plays
  const getInvalidPlayMessage = (error: string): string => {
    const messages: Record<string, string> = {
      "You must play trump when trump was led":
        "Trump was led this trick. You must play a trump card if you have one in your hand.",
      "You must follow the led suit or play trump":
        "You must follow the suit that was led, or play a trump card.",
      "Card is not in your hand":
        "This card is not in your hand. Please select a valid card.",
      "Not your turn":
        "It's not your turn yet. Please wait for other players.",
    };
    return messages[error] || error;
  };

  // Handle human robbing with logging
  const handleRob = useCallback((cardToDiscard: Card) => {
    if (trumpCard) {
      robPack(cardToDiscard);
      logRobAccepted("You", trumpCard);
      setRobPlayerName("You");
      setRobIsYou(true);
      setShowRobBadge(true);
      playRob();
    }
  }, [robPack, trumpCard, logRobAccepted]);

  const handleDeclineRob = useCallback(() => {
    declineRob();
    logRobDeclined("You");
  }, [declineRob, logRobDeclined]);

  if (!humanPlayer) {
    return null;
  }

  const currentPlayerName = players[currentPlayer]?.name || "Player";
  const isYourTurn = currentPlayer === humanPlayerIndex;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />

      {/* Navigation header with Back, Hand History, and Home buttons */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background.secondary }}>
        <NavigationHeader
          title={isYourTurn ? "Your Turn" : `${currentPlayerName}'s Turn`}
          rightAction={
            <Pressable
              onPress={() => setShowHandHistory(true)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: pressed ? colors.background.primary : colors.background.surface,
                borderRadius: borderRadius.round,
                borderWidth: 1,
                borderColor: colors.gold.dark,
              })}
              accessibilityLabel="View hand play log"
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 14 }}>📋</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gold.primary }}>
                Log
              </Text>
            </Pressable>
          }
        />
      </SafeAreaView>

      {/* Game Log Modal */}
      <Modal
        visible={showHandHistory}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHandHistory(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: 20,
          }}
          activeOpacity={1}
          onPress={() => setShowHandHistory(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 500 }}
          >
            <GameLog collapsible={false} maxHeight={400} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Main game table area */}
      <View style={{ flex: 1 }}>
        <GameTable
          currentTrick={currentTrick}
          playerNames={players.map((p) => p.name)}
          currentPlayer={currentPlayer}
          trumpSuit={trumpSuit}
          trumpCard={trumpCard}
          lastTrickWinner={lastTrickWinner}
          leadPlayer={firstPlayerThisTrick}
          dealer={dealer}
          playerScores={playerScores}
          playerCardCounts={players.map((p) => p.hand.length)}
          numPlayers={numPlayers}
          scoringMode={scoringMode}
          robbedByPlayer={robbedByPlayer}
        />
      </View>

      {/* Dealing Animation Overlay */}
      {isDealing && (
        <DealingAnimation
          playerHands={players.map(p => p.hand)}
          onComplete={handleDealingComplete}
          numPlayers={numPlayers}
          playerNames={players.map(p => p.name)}
        />
      )}

      {/* Bottom Panel with Cards and Score */}
      <BottomPanel
        players={playerScores.map((ps, idx) => ({
          name: idx === humanPlayerIndex ? "You" : ps.name,
          score: ps.score,
          tricksWon: ps.tricksWon,
          teamIndex: scoringMode === "team" ? (idx % 2 as 0 | 1) : idx,
        }))}
        trumpCard={trumpCard}
        trumpSuit={trumpSuit}
        cards={dealingComplete || !isDealing ? humanPlayer.hand : []}
        validMoves={validMoves}
        onCardSelect={handleCardSelect}
        isYourTurn={isYourTurn && gamePhase === "playing"}
      />

      {/* Rob the Ace Prompt Modal - gated on dealAnimationDone */}
      <RobPrompt
        visible={gamePhase === "robbing" && robberIndex === humanPlayerIndex && dealAnimationDone}
        hand={players[robberIndex]?.hand ?? []}
        trumpCard={trumpCard!}
        onRob={handleRob}
        onDecline={handleDeclineRob}
        isForcedRob={trumpCardIsAce}
        robberName={players[robberIndex]?.name}
      />

      {/* Invalid Play Alert Modal */}
      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type="error"
        onOk={() => setAlertVisible(false)}
        okText="Got it"
      />

      {/* Trump Reveal Animation */}
      <TrumpRevealAnimation
        visible={showTrumpReveal}
        trumpCard={trumpCard}
        onComplete={() => setShowTrumpReveal(false)}
      />

      {/* Trick Win Badge */}
      {showTrickWinBadge && (
        <View
          style={{
            position: "absolute",
            top: SCREEN_HEIGHT * 0.35,
            left: SCREEN_WIDTH / 2 - 40,
            zIndex: 50,
          }}
          pointerEvents="none"
        >
          <TrickWinBadge
            visible={showTrickWinBadge}
            teamIndex={trickWinTeam}
            isYourTeam={trickWinnerIndex === humanPlayerIndex || (scoringMode === "team" && trickWinTeam === 0)}
            onHide={() => setShowTrickWinBadge(false)}
          />
        </View>
      )}

      {/* Top Trump Badge */}
      {showTopTrump && (
        <View
          style={{
            position: "absolute",
            top: SCREEN_HEIGHT * 0.35,
            left: SCREEN_WIDTH / 2 - 40,
            zIndex: 50,
          }}
          pointerEvents="none"
        >
          <TopTrumpBadge
            visible={showTopTrump}
            card={topTrumpCard}
            trumpSuit={trumpSuit}
            playerName={topTrumpPlayer}
            isYou={topTrumpIsYou}
            onHide={() => setShowTopTrump(false)}
          />
        </View>
      )}

      {/* Perfect Trick Badge */}
      {showPerfectTrick && (
        <View
          style={{
            position: "absolute",
            top: SCREEN_HEIGHT * 0.35,
            left: SCREEN_WIDTH / 2 - 40,
            zIndex: 50,
          }}
          pointerEvents="none"
        >
          <PerfectTrickBadge
            visible={showPerfectTrick}
            onHide={() => setShowPerfectTrick(false)}
          />
        </View>
      )}

      {/* Rob Badge */}
      <RobBadge
        visible={showRobBadge}
        playerName={robPlayerName}
        isYou={robIsYou}
        onComplete={() => setShowRobBadge(false)}
      />

      {/* Hand Win Overlay */}
      <HandWinOverlay
        visible={showHandWinOverlay}
        winnerLabel={handWinLabel}
        isYourWin={handWinIsYours}
        scoringMode={scoringMode}
        handsWon={handsWon}
        finalScore={handWinScore}
        playerNames={players.map(p => p.name)}
        individualScores={scores.individual}
        humanPlayerIndex={humanPlayerIndex}
        onComplete={() => {
          setShowHandWinOverlay(false);
          setHandWinOverlayComplete(true);
        }}
      />

      {/* Comeback Win Badge */}
      {showComebackWin && (
        <View
          style={{
            position: "absolute",
            top: SCREEN_HEIGHT * 0.35,
            left: SCREEN_WIDTH / 2 - 40,
            zIndex: 60,
          }}
          pointerEvents="none"
        >
          <ComebackWinBadge
            visible={showComebackWin}
            teamIndex={comebackTeam}
            isYourTeam={comebackTeam === 0}
            onHide={() => setShowComebackWin(false)}
          />
        </View>
      )}
    </View>
  );
}
