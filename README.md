# 25 - Irish Card Game

A mobile app for the traditional Irish card game "25", built with React Native (Expo).

## Tech Stack

- **React Native** with **Expo** (SDK 54)
- **TypeScript**
- **NativeWind** (Tailwind CSS for React Native)
- **Zustand** (state management)
- **React Navigation** (native stack)
- **react-native-reanimated** & **react-native-gesture-handler** (animations)
- **react-native-svg** (card graphics)
- **AsyncStorage** (game state persistence)

## Getting Started

```bash
# Install dependencies (already done)
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Project Structure

```
src/
├── components/     # Card, CardHand, GameTable, ScoreBoard, etc.
├── screens/        # Home, GameSetup, Game, Rules, Settings, GameOver
├── game-logic/     # cards, deck, rules, scoring, ai, gameEngine
├── store/          # gameStore, settingsStore
├── utils/          # constants, animations, sounds
└── assets/         # card images, sounds, fonts
```

## Development Phases

1. **Phase 1** (Complete): Project setup, dependencies, NativeWind, navigation
2. **Phase 2**: Game logic (cards, deck, rules, scoring)
3. **Phase 3**: State management (Zustand stores)
4. **Phase 4**: AI implementation
5. **Phase 5**: UI components
6. **Phase 6**: Screens
7. **Phase 7**: Game flow integration
8. **Phase 8**: Polish & accessibility
9. **Phase 9**: Testing

## Rules

See [docs/25-card-game-rules.md](docs/25-card-game-rules.md) for complete game rules.
