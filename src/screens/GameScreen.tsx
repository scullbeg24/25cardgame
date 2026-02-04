import { useEffect, useRef, useState, useCallback } from "react";
import { View, StatusBar, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useGameStore } from "../store/gameStore";
import { useGameLogStore } from "../store/gameLogStore";
import type { Card, Suit } from "../game-logic/cards";
import { isTrump } from "../game-logic/cards";
import { selectAICard, getAIDelay, type TrickEntry } from "../game-logic/ai";
import { HUMAN_PLAYER_INDEX } from "../utils/constants";
import GameTable from "../components/GameTable";
import GameHeader from "../components/GameHeader";
import BottomPanel from "../components/BottomPanel";
import RobPrompt from "../components/RobPrompt";
import DealingAnimation from "../components/DealingAnimation";
import AlertModal from "../components/AlertModal";
import TrickWinBadge from "../components/TrickWinBadge";
import HandWinOverlay from "../components/HandWinOverlay";
import RobBadge from "../components/RobBadge";
import ScoreMilestoneBadge from "../components/ScoreMilestoneBadge";
import TrumpRevealAnimation from "../components/TrumpRevealAnimation";
import TopTrumpBadge, { isTopTrump } from "../components/TopTrumpBadge";
import PerfectTrickBadge, { isPerfectTrumpTrick } from "../components/PerfectTrickBadge";
import ComebackWinBadge from "../components/ComebackWinBadge";
import { colors } from "../theme";
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

export default function GameScreen() {
  const navigation = useNavigation<GameNavProp>();
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
  const [showScoreMilestone, setShowScoreMilestone] = useState(false);
  const [scoreMilestone, setScoreMilestone] = useState<10 | 15 | 20 | 25>(10);
  const [milestoneTeam, setMilestoneTeam] = useState<0 | 1>(0);
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
  } = useGameStore();

  const humanPlayer = players[HUMAN_PLAYER_INDEX];
  const tricksThisHand = {
    team1: Math.floor(scores.team1 / 5),
    team2: Math.floor(scores.team2 / 5),
  };

  // Prepare player data for components
  const playerScores = players.map((p, idx) => ({
    name: p.name,
    score: idx % 2 === 0 ? scores.team1 : scores.team2,
    tricksWon: idx % 2 === 0 ? tricksThisHand.team1 : tricksThisHand.team2,
    teamIndex: (idx % 2) as 0 | 1,
  }));

  // Prepare bottom panel player list (all 4 players)
  const bottomPanelPlayers = players.map((p, idx) => ({
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
      const winnerName = firstPlayerThisTrick === HUMAN_PLAYER_INDEX 
        ? "You" 
        : players[firstPlayerThisTrick]?.name ?? "Player";
      logTrickWon(winnerName, 5);
      
      // Show trick win badge near the winner
      const winnerTeamIndex = (firstPlayerThisTrick % 2) as 0 | 1;
      setTrickWinTeam(winnerTeamIndex);
      setTrickWinnerIndex(firstPlayerThisTrick);
      setShowTrickWinBadge(true);
      
      // Check for perfect trick (all trumps)
      if (prevTrickCards.current.length === 4 && isPerfectTrumpTrick(prevTrickCards.current, trumpSuit)) {
        setTimeout(() => setShowPerfectTrick(true), 500);
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
  
  // Track score changes for milestones
  useEffect(() => {
    const checkMilestone = (oldScore: number, newScore: number): 10 | 15 | 20 | 25 | null => {
      const milestones = [10, 15, 20, 25] as const;
      for (const m of milestones) {
        if (oldScore < m && newScore >= m) return m;
      }
      return null;
    };
    
    // Team 1 milestone
    const team1Milestone = checkMilestone(prevScoresRef.current.team1, scores.team1);
    if (team1Milestone) {
      setScoreMilestone(team1Milestone);
      setMilestoneTeam(0);
      setShowScoreMilestone(true);
    }
    
    // Team 2 milestone
    const team2Milestone = checkMilestone(prevScoresRef.current.team2, scores.team2);
    if (team2Milestone && !team1Milestone) {
      setScoreMilestone(team2Milestone);
      setMilestoneTeam(1);
      setShowScoreMilestone(true);
    }
    
    // Track score history for comeback detection
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
        const playerName = lastPlay.playerIndex === HUMAN_PLAYER_INDEX 
          ? "You" 
          : players[lastPlay.playerIndex]?.name ?? "Player";
        setTopTrumpCard(lastPlay.card);
        setTopTrumpPlayer(playerName);
        setTopTrumpIsYou(lastPlay.playerIndex === HUMAN_PLAYER_INDEX);
        setTopTrumpPlayerIndex(lastPlay.playerIndex);
        setShowTopTrump(true);
      }
    }
  }, [currentTrick.length, currentTrick, trumpSuit, players]);

  // Trigger dealing animation when game starts or new hand
  useEffect(() => {
    if (gamePhase === "playing" || gamePhase === "robbing") {
      if (!dealingComplete && players.every(p => p.hand.length > 0)) {
        setIsDealing(true);
      }
    }
  }, [gamePhase, players, dealingComplete]);

  const handleDealingComplete = () => {
    setIsDealing(false);
    setDealingComplete(true);
    // Show trump reveal animation and log
    if (trumpCard) {
      setShowTrumpReveal(true);
      logTrumpRevealed(trumpCard);
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
      
      // Log hand win
      logHandWon(winningTeam, Math.max(scores.team1, scores.team2));
      
      // Show hand win overlay
      setHandWinTeam(winningTeam);
      setHandWinScores({ team1: scores.team1, team2: scores.team2 });
      setShowHandWinOverlay(true);
      
      // Check for comeback win
      const wasTeamBehind = scoreHistory.current.some(s => {
        if (winningTeam === 1) return s.team2 - s.team1 >= 10;
        return s.team1 - s.team2 >= 10;
      });
      if (wasTeamBehind) {
        setComebackTeam(winningTeam === 1 ? 0 : 1);
        setTimeout(() => setShowComebackWin(true), 2000); // After hand win overlay
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

  useEffect(() => {
    if (gamePhase === "handComplete") {
      completeHand();
    }
  }, [gamePhase, completeHand]);

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
        const robberName = robberIndex === HUMAN_PLAYER_INDEX 
          ? "You" 
          : players[robberIndex]?.name ?? "Player";
        logRobOffered(robberName, trumpCard);
        prevRobberIndex.current = robberIndex;
      }
    } else if (gamePhase !== "robbing") {
      prevRobberIndex.current = -1;
    }
  }, [gamePhase, robberIndex, trumpCard, players, logRobOffered]);

  // Handle AI robbing decision
  useEffect(() => {
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
      // Show rob badge for AI
      setRobPlayerName(robber.name);
      setRobIsYou(false);
      setShowRobBadge(true);
    }, 800);
    
    return () => clearTimeout(t);
  }, [gamePhase, robberIndex, players, trumpCard, robPack, declineRob, logRobAccepted, logRobDeclined]);

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
      };

      const card = selectAICard(context, player.difficulty ?? "medium");
      playCard(currentPlayer, card);
      logCardPlayed(player.name, card);
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
    if (gamePhase !== "playing" || currentPlayer !== HUMAN_PLAYER_INDEX) return;
    
    const result = playCard(HUMAN_PLAYER_INDEX, card);
    
    // Handle invalid play - show alert to player
    if (result && !result.success && result.error) {
      const errorMessage = getInvalidPlayMessage(result.error);
      showAlert("Invalid Play", errorMessage);
      logInvalidPlay("You", result.error);
    } else if (!result || result.success !== false) {
      // Card was played successfully - log it
      logCardPlayed("You", card);
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
      // Show rob badge
      setRobPlayerName("You");
      setRobIsYou(true);
      setShowRobBadge(true);
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
  const isYourTurn = currentPlayer === HUMAN_PLAYER_INDEX;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        className="flex-1"
      >
        {/* Game Header with game log */}
        <GameHeader
          currentPlayerName={currentPlayerName}
          isYourTurn={isYourTurn}
          onInfoPress={() => navigation.navigate("Rules")}
          onMenuPress={() => navigation.navigate("Home")}
        />

        {/* Main game table area */}
        <View className="flex-1">
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
          />
        </View>

        {/* Dealing Animation Overlay */}
        {isDealing && (
          <DealingAnimation
            playerHands={players.map(p => p.hand)}
            onComplete={handleDealingComplete}
          />
        )}

        {/* Bottom Panel with Scoreboard, Trumps, and Cards */}
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
          visible={gamePhase === "robbing" && robberIndex === HUMAN_PLAYER_INDEX}
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
        
        {/* Score Milestone Badge - near scoreboard (bottom left) */}
        {showScoreMilestone && (
          <View
            style={{
              position: "absolute",
              bottom: 160,
              left: 20,
              zIndex: 50,
            }}
            pointerEvents="none"
          >
            <ScoreMilestoneBadge
              visible={showScoreMilestone}
              milestone={scoreMilestone}
              teamIndex={milestoneTeam}
              isYourTeam={milestoneTeam === 0}
              onHide={() => setShowScoreMilestone(false)}
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
          onComplete={() => setShowHandWinOverlay(false)}
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
      </LinearGradient>
    </View>
  );
}
