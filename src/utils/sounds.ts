/**
 * Sound effects - structure for expo-av
 * Add sound files to src/assets/sounds/ to enable
 * Mute when soundEnabled is false
 */

let soundEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export async function playCardPlay() {
  if (!soundEnabled) return;
  // Add: const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/card.mp3'));
  // await sound.playAsync();
}

export async function playTrickWon() {
  if (!soundEnabled) return;
  // Add sound file when available
}

export async function playButtonTap() {
  if (!soundEnabled) return;
  // Add sound file when available
}
