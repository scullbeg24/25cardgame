import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, StatusBar, Dimensions, Pressable, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useGameStore } from "../store/gameStore";
import { useOnlineGameStore } from "../store/onlineGameStore";
import { useRoomStore } from "../store/roomStore";
import { useGameController } from "../hooks/useGameController";
import { useGameLogStore } from "../store/gameLogStore";
import { startPresence, stopPresence } from "../services/presenceService";
import type { Card, Suit } from "../game-logic/cards";
import { isTrump } from "../game-logic/cards";
import { selectAICard, getAIDelay, type TrickEntry } from "../game-logic/ai";
import { HUMAN_PLAYER_INDEX } from "../utils/constants";
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

// Calculate badge position based on player index
// Players: 0=North (top), 1=East (right), 2=South/You (bottom), 3=West (left)
const getPlayerBadgePosition = (playerIndex: number) => {
  const centerY = SCREEN_HEIGHT * 0.35;
  const centerX = SCREEN_WIDTH / 2;
  
  switch (playerIndex) {
    case 0: // North - top
      return { top: SCREEN_HEIGHT * 0.15, left: centerX - 30 };
    case 1: // East - right
      return { top: centerY, left: SCREEN_WIDTH - 80 };
    case 2: // South/You - bottom (near center since cards are at bottom)
      return { top: SCREEN_HEIGHT * 0.45, left: centerX - 30 };
    case 3: // West - left
      return { top: centerY, left: 20 };
    default:
      return { top: centerY, left: centerX - 30 };
  }
};

type GameNavProp = NativeStackNavigationProp<RootStackParamList, "Game">;
type GameRouteProp = RouteProp<RootStackParamList, "Game">;

export default function GameScreen() {
  const navigation = useNavigation<GameNavProp>();
  const route = useRoute<GameRouteProp>();
  const mode = route.params?.mode ?? "local";
  const routeRoomId = route.params?.roomId;

  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastTrickWinner, setLastTrickWinner] = useState<number | null>(null);
  const [isDealing, setIsDealing] = useState(false);
  const [dealingComplete, setDealingComplete] = useState(false);
  
  // Alert modal state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  
  // Badge and animation states
  const [showTrickWinBadge, setShowTrickWinBadge] = useState(false);
  const [trickWinTeam, setTrickWinTeam] = useState<0 | 1>(0);
  const [showHandWinOverlay, setShowHandWinOverlay] = useState(false);
  const [handWinTeam, setHandWinTeam] = useState<1 | 2>(1);
  const [handWinScores, setHandWinScores] = useState({ team1: 0, team2: 0 });
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

  // ─── Game state: local vs online ────────────────────────────
  const gc = useGameController(mode);
  const localStore = useGameStore();

  // In local mode, use local store directly. In online, use game controller.
  const {
    players,
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
    playCard,
    completeTrick,
    completeHand,
    robPack,
    declineRob,
  } = mode === "online" ? gc : localStore;

  const humanPlayerIndex = mode === "online" ? gc.humanPlayerIndex : HUMAN_PLAYER_INDEX;
  const isOnline = mode === "online";

  // Initialize online game when entering online mode
  useEffect(() => {
    if (!isOnline || !routeRoomId) return;
    const roomStore = useRoomStore.getState();
    const onlineGame = useOnlineGameStore.getState();

    // Start presence tracking
    startPresence(routeRoomId);

    if (roomStore.isHost) {
      // Host: initialize the game engine
      const room = roomStore.currentRoom;
      if (!room) return;

      const playerNames = Object.values(room.players)
        .sort((a, b) => a.slot - b.slot)
        .map((p) => p.name);

      onlineGame.initAsHost(
        routeRoomId,
        playerNames,
        roomStore.mySlot ?? 0,
        room.settings.numPlayers,
        room.settings.targetScore,
      );
    } else {
      // Client: subscribe to game state
      onlineGame.initAsClient(routeRoomId, roomStore.mySlot ?? 0);
    }

    return () => {
      stopPresence();
      useOnlineGameStore.getState().cleanup();
    };
  }, [isOnline, routeRoomId]);

  const humanPlayer = players[humanPlayerIndex];
  const tricksThisHand = {
    team1: Math.floor(scores.team1 / 5),
    team2: Math.floor(scores.team2 / 5),
  };

  // Prepare player data for components
  const playerScores = isOnline
    ? players.map((p, idx) => ({
        name: p.name,
        score: gc.individualScores[idx] ?? 0,
        tricksWon: 0, // Not tracked per-player in online individual mode
        teamIndex: (idx % 2) as 0 | 1,
      }))
    : players.map((p, idx) => ({
        name: p.name,
        score: idx % 2 === 0 ? scores.team1 : scores.team2,
        tricksWon: idx % 2 === 0 ? tricksThisHand.team1 : tricksThisHand.team2,
        teamIndex: (idx % 2) as 0 | 1,
      }));

  // Prepare bottom panel player list
  const bottomPanelPlayers = isOnline
    ? players.map((p, idx) => ({
        name: idx === humanPlayerIndex ? "You" : p.name,
        score: gc.individualScores[idx] ?? 0,
        tricksWon: 0,
        teamIndex: (idx % 2) as 0 | 1,
      }))
    : players.map((p, idx) => ({
        name: idx === 2 ? "You" : p.name,
        score: idx % 2 === 0 ? scores.team1 : scores.team2,
        tricksWon: idx % 2 === 0 ? tricksThisHand.team1 : tricksThisHand.team2,
        teamIndex: (idx % 2) as 0 | 1,
      }));

  // Track last trick winner for visual feedback and logging
  const prevTrickLength = useRef(currentTrick.length);
  const prevTrickCards = useRef<Card[]>([]);
  
  useEffect(() => {
    if (currentTrick.length === 0 && gamePhase === "playing" && prevTrickLength.current === 4) {
      setLastTrickWinner(firstPlayerThisTrick);
      // Log trick win
      const winnerName = firstPlayerThisTrick === humanPlayerIndex
        ? "You"
        : players[firstPlayerThisTrick]?.name ?? "Player";
      logTrickWon(winnerName, 5);
      
      // Play trick win sound
      playTrickWon();
      
      // Show trick win badge near the winner
      const winnerTeamIndex = (firstPlayerThisTrick % 2) as 0 | 1;
      setTrickWinTeam(winnerTeamIndex);
      setTrickWinnerIndex(firstPlayerThisTrick);
      setShowTrickWinBadge(true);
      
      // Check for perfect trick (all trumps)
      if (prevTrickCards.current.length === 4 && isPerfectTrumpTrick(prevTrickCards.current, trumpSuit)) {
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
  }, [currentTrick.length, gamePhase, firstPlayerThisTrick, players, logTrickWon, trumpSuit, currentTrick]);
  
  // Track score history for comeback detection (no milestone badges)
  useEffect(() => {
    if (scores.team1 !== prevScoresRef.current.team1 || scores.team2 !== prevScoresRef.current.team2) {
      scoreHistory.current.push({ team1: scores.team1, team2: scores.team2 });
    }
    prevScoresRef.current = { team1: scores.team1, team2: scores.team2 };
  }, [scores.team1, scores.team2]);
  
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
  }, [currentTrick.length, currentTrick, trumpSuit, players]);

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
  };

  // Reset dealing state when a new hand starts
  useEffect(() => {
    if (scores.team1 === 0 && scores.team2 === 0) {
      setDealingComplete(false);
    }
  }, [scores.team1, scores.team2]);

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
  const handNumber = useRef(handsWon.team1 + handsWon.team2 + 1);
  const prevHandsWon = useRef({ team1: handsWon.team1, team2: handsWon.team2 });
  useEffect(() => {
    const totalHands = handsWon.team1 + handsWon.team2;
    const prevTotal = prevHandsWon.current.team1 + prevHandsWon.current.team2;
    
    // Check if a hand was won
    if (totalHands > prevTotal && gamePhase !== "gameOver") {
      // Determine which team won
      const winningTeam: 1 | 2 = handsWon.team1 > prevHandsWon.current.team1 ? 1 : 2;
      const winningScore = winningTeam === 1 ? scores.team1 : scores.team2;
      
      // Log hand win
      logHandWon(winningTeam, winningScore);
      
      // Only celebrate (overlay, sound, comeback badge) when a team reaches 25 points
      if (winningScore >= 25) {
        playHandWon();
        setHandWinTeam(winningTeam);
        setHandWinScores({ team1: scores.team1, team2: scores.team2 });
        setHandWinOverlayComplete(false);
        setShowHandWinOverlay(true);
        
        const wasTeamBehind = scoreHistory.current.some(s => {
          if (winningTeam === 1) return s.team2 - s.team1 >= 10;
          return s.team1 - s.team2 >= 10;
        });
        if (wasTeamBehind) {
          setComebackTeam(winningTeam === 1 ? 0 : 1);
          setTimeout(() => setShowComebackWin(true), 2000);
        }
      } else {
        // Hand won by fallback (pack exhausted) - no celebration, advance immediately
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
    
    prevHandsWon.current = { team1: handsWon.team1, team2: handsWon.team2 };
  }, [handsWon.team1, handsWon.team2, gamePhase, dealer, players, logHandWon, logHandStart, scores]);

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
      // Mark that we need to complete the hand after overlay finishes
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
      if (isOnline) {
        const gs = gc.individualScores;
        // Find winner (highest score or whoever reached target)
        let winnerIdx = 0;
        let maxScore = 0;
        gs.forEach((s, i) => {
          if (s > maxScore) {
            maxScore = s;
            winnerIdx = i;
          }
        });
        navigation.replace("GameOver", {
          mode: "online",
          roomId: routeRoomId,
          winnerIndex: winnerIdx,
          playerNames: players.map((p) => p.name),
          scores: gs,
          targetScore: useOnlineGameStore.getState().gameState?.targetScore ?? 25,
        });
      } else {
        navigation.replace("GameOver", { mode: "local" });
      }
    }
  }, [gamePhase, navigation, isOnline]);

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
  }, [gamePhase, robberIndex, trumpCard, players, logRobOffered]);

  // Handle AI robbing decision (local mode only)
  useEffect(() => {
    if (isOnline) return; // No AI in online mode
    if (gamePhase !== "robbing" || robberIndex === -1) return;

    const robber = players[robberIndex];
    if (!robber?.isAI || !trumpCard) return;
    
    const t = setTimeout(() => {
      // AI always robs (it's generally advantageous)
      // Find the lowest value card to discard
      const hand = robber.hand;
      if (hand.length === 0) {
        declineRob();
        logRobDeclined(robber.name);
        return;
      }
      
      // Find a card to discard - prefer lowest non-trump card
      // For simplicity, just pick the first card that isn't the Ace of trump
      const cardToDiscard = hand.find(
        (c) => !(c.suit === trumpCard.suit && c.rank === "A")
      ) ?? hand[0];
      
      robPack(cardToDiscard);
      logRobAccepted(robber.name, trumpCard);
      // Show rob badge for AI and play sound
      setRobPlayerName(robber.name);
      setRobIsYou(false);
      setShowRobBadge(true);
      playRob();
    }, 800);
    
    return () => clearTimeout(t);
  }, [gamePhase, robberIndex, players, trumpCard, robPack, declineRob, logRobAccepted, logRobDeclined]);

  // AI turn logic (local mode only)
  useEffect(() => {
    if (isOnline) return; // No AI in online mode
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
    if (result && !result.success && result.error) {
      const errorMessage = getInvalidPlayMessage(result.error);
      showAlert("Invalid Play", errorMessage);
      logInvalidPlay("You", result.error);
      playInvalidMove();
    } else if (!result || result.success !== false) {
      // Card was played successfully - log it and play sound
      logCardPlayed("You", card);
      playCardPlay();
    }
  };
  
  // Get user-friendly error message for invalid plays
  const getInvalidPlayMessage = (error: string): string => {
    const messages: Record<string, string> = {
      "You must play trump when trump was led": 
        "Trump was led this trick. You must play a trump card if you have one in your hand.",
      "You must follow the led suit": 
        "You must follow the suit that was led. Play a card of the same suit if you have one.",
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
      // Show rob badge and play sound
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

      {/* Game Log Modal - view full log (minimized during regular play) */}
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

      {/* Main game table area - MUST take the center space */}
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
          numPlayers={players.length}
        />
      </View>

      {/* Dealing Animation Overlay */}
      {isDealing && (
        <DealingAnimation
          playerHands={players.map(p => p.hand)}
          onComplete={handleDealingComplete}
        />
      )}

      {/* Bottom Panel with Cards and Score */}
      <BottomPanel
        players={bottomPanelPlayers}
        trumpCard={trumpCard}
        trumpSuit={trumpSuit}
        cards={dealingComplete || !isDealing ? humanPlayer.hand : []}
        validMoves={validMoves}
        onCardSelect={handleCardSelect}
        isYourTurn={isYourTurn && gamePhase === "playing"}
      />

        {/* Rob the Ace Prompt Modal */}
        <RobPrompt
          visible={gamePhase === "robbing" && robberIndex === humanPlayerIndex}
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
        
        {/* Trick Win Badge - positioned near winning player */}
        {showTrickWinBadge && (
          <View
            style={{
              position: "absolute",
              ...getPlayerBadgePosition(trickWinnerIndex),
              zIndex: 50,
            }}
            pointerEvents="none"
          >
            <TrickWinBadge
              visible={showTrickWinBadge}
              teamIndex={trickWinTeam}
              isYourTeam={trickWinTeam === 0}
              onHide={() => setShowTrickWinBadge(false)}
            />
          </View>
        )}
        
        {/* Top Trump Badge - near the player who played it */}
        {showTopTrump && (
          <View
            style={{
              position: "absolute",
              ...getPlayerBadgePosition(topTrumpPlayerIndex),
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
        
        {/* Perfect Trick Badge - center of table */}
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
          winningTeam={handWinTeam}
          isYourTeam={handWinTeam === 1}
          handsWon={handsWon}
          finalScore={handWinScores}
          onComplete={() => {
            setShowHandWinOverlay(false);
            setHandWinOverlayComplete(true); // Signal that overlay animation is done
          }}
        />
        
        {/* Comeback Win Badge - near center */}
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
