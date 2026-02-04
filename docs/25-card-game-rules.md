# Irish Card Game "25" - Complete Rules & Game Logic

## Game Overview
25 is a traditional Irish trick-taking card game, typically played by 4 players in teams of 2. The objective is to be the first team to score 25 points (or 5 "fives").

---

## Card Hierarchy & Trump System

### Trump Card Ranking (Highest to Lowest)
The trump suit has a unique and specific hierarchy:

**When HEARTS are Trump:**
1. 5 of Hearts (Five of Trumps) - HIGHEST
2. Jack of Hearts (Jack of Trumps)
3. Ace of Hearts (Ace of Trumps)
4. King of Hearts
5. Queen of Hearts
6. 10, 9, 8, 7, 6, 4, 3, 2 of Hearts (descending order)

**When DIAMONDS are Trump:**
1. 5 of Hearts (ALWAYS highest trump, even in diamonds)
2. 5 of Diamonds (Five of Trumps)
3. Jack of Diamonds (Jack of Trumps)
4. Ace of Hearts (ALWAYS third highest trump)
5. Ace of Diamonds (Ace of Trumps)
6. King of Diamonds
7. Queen of Diamonds
8. 10, 9, 8, 7, 6, 4, 3, 2 of Diamonds (descending order)

**When CLUBS or SPADES are Trump:**
1. 5 of Hearts (ALWAYS highest trump)
2. 5 of Trump Suit (Five of Trumps)
3. Jack of Trump Suit (Jack of Trumps)
4. Ace of Hearts (ALWAYS third highest trump)
5. Ace of Trump Suit (Ace of Trumps)
6. King of Trump Suit
7. Queen of Trump Suit
8. 2, 3, 4, 6, 7, 8, 9, 10 of Trump Suit (ASCENDING order for black suits)

**Key Points:**
- The 5 of Hearts is ALWAYS the highest trump, regardless of trump suit
- The Ace of Hearts is ALWAYS the third highest trump (except when hearts are trump, then it's third)
- In BLACK suits (Clubs/Spades), non-face trump cards rank in ASCENDING order (2 lowest, 10 highest)
- In RED suits (Hearts/Diamonds), non-face trump cards rank in DESCENDING order (10 lowest, 2 highest)

### Non-Trump Card Ranking

**Hearts (when NOT trump):**
- King (highest), Queen, Jack, 10, 9, 8, 7, 6, 4, 3, 2 (lowest)
- Note: 5 and Ace of Hearts are ALWAYS trump

**Diamonds (when NOT trump):**
- King (highest), Queen, Jack, 10, 9, 8, 7, 6, 5, 4, 3, 2 (lowest)
- If diamonds are trump, Ace of Hearts is still trump
- If diamonds NOT trump, only the 5 of diamonds appears (Ace removed for trump)

**Clubs (when NOT trump):**
- King (highest), Queen, Jack, Ace, 2, 3, 4, 6, 7, 8, 9, 10 (lowest)
- Note: Ranks DESCENDING after Jack

**Spades (when NOT trump):**
- King (highest), Queen, Jack, Ace, 2, 3, 4, 6, 7, 8, 9, 10 (lowest)
- Note: Ranks DESCENDING after Jack

---

## Game Setup

### Players & Teams
- 4 players in 2 teams
- Partners sit opposite each other
- Team 1: North & South
- Team 2: East & West

### Deck Composition
- Standard 52-card deck with specific cards removed based on trump
- Remove cards that become trump from non-trump suits

### Dealing
1. Determine dealer (random for first hand, then rotates clockwise)
2. Dealer shuffles and offers cut to player on their right
3. Deal 5 cards to each player (in batches: 2-3 or 3-2)
4. Next card is turned face-up to determine trump suit
5. Remaining cards form the "pack" (widow)

### Trump Declaration
- The face-up card determines the initial trump suit
- Dealer has the option to "Rob the Pack" (see below)

---

## Robbing the Pack

### When Dealer Can Rob
The dealer may "rob the pack" if they hold the Ace of the trump suit shown.

### How Robbing Works
1. Dealer reveals the Ace of trump from their hand
2. Dealer takes the face-up trump card into their hand
3. Dealer discards any card face-down to the pack
4. Play continues with the dealer having 5 cards

### Strategic Considerations
- Dealer must decide if the face-up trump is worth taking
- Cannot rob if they don't have the Ace of trump
- Some variations allow robbing with the 5 of Hearts

---

## Playing the Hand

### Lead Rules
1. Player to dealer's left leads first trick
2. Winner of each trick leads the next trick

### Following Suit Rules
**Standard Rule:**
- Players MUST follow suit if able
- If cannot follow suit, may play any card (including trump)

**Trump Suit Led:**
- Must play trump if holding any trump
- If no trump, may play any card

**Non-Trump Suit Led:**
- Must follow suit if holding that suit
- Exception: If holding ONLY the top three trumps (5♥, J♥/trump, A♥), player is NOT required to play them on a non-trump lead
- This is the "reneging privilege" for the three highest trumps

### Winning Tricks
- Highest trump played wins the trick
- If no trump played, highest card of led suit wins
- Winner takes all 4 cards and leads next trick

---

## Scoring System

### Points per Trick
- Each trick won = 5 points
- Maximum 25 points per hand (5 tricks × 5 points)

### Winning a Hand
- Team that reaches or exceeds 25 points wins the hand
- First team to win 5 hands wins the game

### Scoring Variations (Toggle Options)
**Traditional:**
- Play hands until one team wins 5 hands (best of 9)

**Points-Based:**
- Accumulate total points across multiple hands
- First to 100 or 200 points wins

**Single Hand:**
- Play one hand only, highest score wins

---

## Game Flow Logic

### Phase 1: Setup
1. Assign teams and seating
2. Shuffle deck
3. Deal cards (5 per player)
4. Reveal trump card
5. Offer rob option to dealer

### Phase 2: Play
1. Player left of dealer leads first card
2. Each player plays one card clockwise
3. Determine trick winner
4. Award 5 points to winning team
5. Trick winner leads next card
6. Repeat until all 5 tricks played

### Phase 3: Scoring
1. Calculate total points for hand
2. Award hand win (1 point toward 5-hand victory)
3. Check for game winner (5 hands won)
4. If no winner, deal new hand

### Phase 4: New Hand
1. Dealer position rotates clockwise
2. Return to Phase 1

---

## AI Logic Requirements

### Basic AI Strategy
1. **Leading:**
   - Lead highest trump if holding 2+ trumps
   - Lead lowest safe card if no strong trumps
   - Lead low in suits partner has shown strength

2. **Following:**
   - Play to win trick if partner hasn't won
   - Play lowest card if partner is winning
   - Use trump sparingly unless necessary

3. **Trump Management:**
   - Protect top three trumps when possible
   - Use middle trumps to win key tricks
   - Trump opponent's winning cards strategically

### Advanced AI (Optional)
1. Card counting (track played cards)
2. Partner signal recognition
3. Probability calculations for remaining cards
4. Adaptive difficulty levels

---

## Toggle Options for Flexibility

### Rule Variations
- [ ] Allow/Disallow robbing with 5 of Hearts
- [ ] Strict following vs. lenient following rules
- [ ] Enable/Disable the three-card reneging privilege
- [ ] Different scoring thresholds (15, 25, 45 points)

### Game Modes
- [ ] 2-player (each controlling 2 hands)
- [ ] 3-player (dummy hand or rotation)
- [ ] 4-player (traditional)
- [ ] Practice mode (unlimited undo)
- [ ] Tutorial mode (show valid moves, hints)

### Difficulty Settings
- [ ] Easy AI (random legal moves)
- [ ] Medium AI (basic strategy)
- [ ] Hard AI (advanced counting and probability)

### UI/UX Options
- [ ] Card animation speed
- [ ] Sound effects on/off
- [ ] Large text mode (accessibility)
- [ ] Color-blind friendly card designs
- [ ] Hint system for new players
- [ ] Show/hide score during play

---

## Technical Implementation Notes

### Data Structures Needed
```
Card: {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades',
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A',
  trumpRank?: number,
  nonTrumpRank?: number
}

GameState: {
  players: Player[],
  teams: Team[],
  currentTrick: Card[],
  trumpSuit: Suit,
  dealer: number,
  currentPlayer: number,
  trickWinner: number | null,
  scores: { team1: number, team2: number },
  handsWon: { team1: number, team2: number },
  pack: Card[],
  trumpCard: Card,
  robbed: boolean
}

Player: {
  id: number,
  name: string,
  hand: Card[],
  teamId: number,
  isAI: boolean,
  difficulty?: 'easy' | 'medium' | 'hard'
}
```

### Key Functions Required
1. `shuffleDeck()` - Shuffle 52 cards
2. `dealCards()` - Distribute 5 cards to each player
3. `determineTrump()` - Reveal trump card
4. `calculateCardRank(card, trump)` - Get card's rank value
5. `isLegalPlay(card, hand, led, trump)` - Validate moves
6. `determineTrickWinner(trick, led, trump)` - Find winning card
7. `calculateScore(tricksWon)` - Award points
8. `checkGameEnd()` - Determine if game over
9. `aiSelectCard(hand, trick, trump)` - AI decision making

---

## Edge Cases to Handle

1. **Robbing the Pack:**
   - What if dealer has Ace but doesn't want to rob?
   - Validate dealer actually has the Ace

2. **Trump Privileges:**
   - Correctly identify top 3 trumps in any suit
   - Allow reneging only when holding EXCLUSIVELY top trumps

3. **Invalid Plays:**
   - Prevent playing cards not in hand
   - Enforce following suit rules
   - Clear feedback when move is illegal

4. **Tie Scenarios:**
   - Rare in 25, but handle if needed for variations

5. **Disconnection (Multiplayer):**
   - Save game state
   - AI substitute for disconnected player
   - Reconnection logic

---

## Accessibility Considerations

### For Older Players
1. **Large Touch Targets:** Minimum 60px tap areas
2. **High Contrast:** Clear card visibility
3. **Large Text:** Minimum 18pt font
4. **Simple Navigation:** Minimal screens, clear buttons
5. **Audio Feedback:** Optional sounds for actions
6. **Tutorials:** Interactive guide for first-time players
7. **Undo Feature:** Allow take-backs in single-player
8. **Slow Animations:** Comfortable pacing, skippable

### Visual Design
- Clean, uncluttered interface
- Traditional card design (familiar suits/ranks)
- Clear score display
- Obvious "whose turn" indicator
- Confirmation for important actions
