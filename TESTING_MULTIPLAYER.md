# Testing Multiplayer - Quick Start Guide

## Prerequisites

Before testing, ensure you've completed Firebase setup (see `FIREBASE_SETUP.md`).

---

## Testing on Physical Devices (Recommended)

### Option 1: Two Physical Devices

**Best for:** Real-world testing

1. Build the app on both devices:
   ```bash
   # iOS
   npx expo run:ios
   
   # Android
   npx expo run:android
   ```

2. Create accounts on both devices:
   - Device 1: `player1@test.com` / `password123` / username: `player1`
   - Device 2: `player2@test.com` / `password123` / username: `player2`

3. Add each other as friends:
   - Device 1: Home → Friends → Add → Search "player2" → Send request
   - Device 2: Friends → Requests → Accept

4. Create and join a room:
   - Device 1: Home → Play Online → Create Room → Share code
   - Device 2: Home → Play Online → Join Room → Enter code

5. Play!
   - Both players: Click "Ready"
   - Device 1 (host): Click "Start Game"

---

## Testing on Simulators/Emulators

### Option 2: iOS Simulator + Android Emulator

**Best for:** Quick testing without physical devices

1. Start both simulators:
   ```bash
   # Terminal 1 - iOS
   npx expo run:ios
   
   # Terminal 2 - Android
   npx expo run:android
   ```

2. Follow steps 2-5 from "Two Physical Devices" above

### Option 3: Two iOS Simulators

**Best for:** Mac users

1. Open Xcode → Window → Devices and Simulators
2. Create a second simulator (iPhone 15 Pro)
3. Start first simulator:
   ```bash
   npx expo run:ios
   ```
4. In Xcode, boot the second simulator
5. Drag and drop the app from first simulator to second
6. Follow steps 2-5 from "Two Physical Devices" above

---

## Testing Checklist

### Authentication Tests
- [ ] Register new account
- [ ] Login with existing account
- [ ] View profile
- [ ] Edit display name
- [ ] Logout
- [ ] Login again (persistence)

### Friend System Tests
- [ ] Search for user by username
- [ ] Send friend request
- [ ] Receive friend request
- [ ] Accept friend request
- [ ] See friend in friends list
- [ ] Online status shows (green dot)
- [ ] Remove friend
- [ ] Decline friend request

### Room & Lobby Tests
- [ ] Create room (generates code)
- [ ] Share room code
- [ ] Join room with code
- [ ] See both players in lobby
- [ ] Ready up (both players)
- [ ] Start game (host only)
- [ ] Leave room before game starts

### Gameplay Tests
- [ ] Game starts (cards dealt)
- [ ] Trump card visible
- [ ] Play card (your turn)
- [ ] Wait for opponent's turn
- [ ] See opponent's card appear
- [ ] Trick winner determined
- [ ] Score updates
- [ ] Next trick starts
- [ ] Robbing phase works
- [ ] Hand completes
- [ ] Game completes
- [ ] Winner declared

### Disconnection Tests
- [ ] Disconnect wifi during game (turn on airplane mode)
- [ ] See disconnection warning
- [ ] Reconnect
- [ ] Game resumes
- [ ] Other player sees your disconnect
- [ ] Forfeit after timeout

### Edge Cases
- [ ] Try to join full room
- [ ] Try to join invalid code
- [ ] Try to start game with not all ready
- [ ] Try to play out of turn
- [ ] Try to play illegal card

---

## Common Test Scenarios

### Scenario 1: Full Game Flow (2 Players)

1. **Setup**
   - Player 1 creates account
   - Player 2 creates account
   - They add each other as friends

2. **Create Room**
   - Player 1: Home → Play Online → Create Room
   - Player 1 shares code with Player 2 (write it down)

3. **Join Room**
   - Player 2: Home → Play Online → Join Room → Enter code
   - Both see each other in lobby

4. **Start Game**
   - Player 1: Click "Ready"
   - Player 2: Click "Ready"
   - Player 1 (host): Click "Start Game"

5. **Play Game**
   - Take turns playing cards
   - Complete all tricks
   - Finish hand
   - Continue until game over

6. **Expected Result**
   - Winner is displayed
   - Stats are updated
   - Return to home

### Scenario 2: Robbing Test

1. Start a game (see Scenario 1)
2. If trump card is 5, K, or A:
   - Eligible player sees rob prompt
   - Can rob (take trump, discard card)
   - Or decline
3. Game continues to playing phase

### Scenario 3: Disconnection Recovery

1. Start a game mid-way through
2. Player 1: Enable airplane mode for 10 seconds
3. Player 2: Sees "Player 1 disconnected" banner
4. Player 1: Disable airplane mode
5. **Expected:** Game reconnects, continues from where it left off

---

## Debugging Tips

### Check Firebase Console

1. **Authentication**: See registered users
2. **Firestore**: View users, friendships, gameRooms
3. **Realtime Database**: See live game state

### Console Logs

Watch for these log messages:
- "Firebase initialized successfully"
- "Multiplayer game initialized: game_xxx"
- Connection status changes
- Card play events

### Common Issues

**"Room not found"**
- Room code might be wrong
- Room might have been deleted
- Check Firestore → gameRooms collection

**"Not your turn"**
- Game state might be out of sync
- Check Realtime Database → games → {gameId}
- Verify currentPlayer index

**Cards not syncing**
- Check internet connection
- Check Firebase Realtime Database rules
- Look for errors in console

---

## Performance Testing

### Latency Test

1. Start game on two devices
2. Player 1 plays card
3. Measure time until Player 2 sees card

**Expected:** < 1 second

### Concurrent Games

1. Create multiple rooms with different accounts
2. Play simultaneously
3. Verify no cross-contamination

**Expected:** Each game independent

---

## Test Data Cleanup

After testing, clean up:

1. **Firebase Console → Authentication**
   - Delete test users

2. **Firestore → users**
   - Delete test user documents

3. **Firestore → friendships**
   - Delete test friendships

4. **Firestore → gameRooms**
   - Delete test rooms

5. **Realtime Database → games**
   - Delete test game states

---

## Automated Testing (Future)

For automated tests, consider:

```typescript
// Example test structure
describe('Multiplayer Game', () => {
  it('should create room with unique code', async () => {
    const room = await createRoom(userId, username, displayName);
    expect(room.roomCode).toHaveLength(6);
  });
  
  it('should sync card plays between players', async () => {
    // Test implementation
  });
});
```

---

## Success Metrics

Your multiplayer implementation is working correctly if:

✅ Both players can register and login
✅ Friend requests work in both directions
✅ Room creation generates unique codes
✅ Room joining works with valid codes
✅ Both players see each other in lobby
✅ Game starts when all ready
✅ Cards sync in real-time (< 1s latency)
✅ Trick winners determined correctly
✅ Scores update for both players
✅ Disconnections are detected
✅ Reconnection restores game state
✅ Game completes successfully

---

## Need Help?

If you encounter issues:

1. Check console logs for errors
2. Verify Firebase setup (see `FIREBASE_SETUP.md`)
3. Review security rules in Firebase Console
4. Check network connectivity
5. Try clearing cache: `npx expo start -c`
6. Rebuild: `npx expo prebuild --clean && npx expo run:ios`

Happy testing! 🎮
