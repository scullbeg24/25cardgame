/**
 * Sound effects manager using expo-av
 * Provides sound effects for card game events
 */

import { Audio, AVPlaybackStatus } from "expo-av";

// Sound types available in the game
export type SoundType =
  | "cardPlay"
  | "cardDeal"
  | "trickWin"
  | "handWin"
  | "gameWin"
  | "gameLose"
  | "trumpReveal"
  | "rob"
  | "buttonTap"
  | "invalidMove"
  | "scoreMilestone"
  | "topTrump"
  | "perfectTrick";

// Sound configuration
interface SoundConfig {
  frequency: number;
  duration: number;
  volume: number;
  ramp?: "up" | "down" | "none";
}

// Sound configurations for each type (used for generated tones)
const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  cardPlay: { frequency: 800, duration: 80, volume: 0.3, ramp: "down" },
  cardDeal: { frequency: 600, duration: 50, volume: 0.2, ramp: "down" },
  trickWin: { frequency: 523, duration: 200, volume: 0.4, ramp: "up" },
  handWin: { frequency: 659, duration: 400, volume: 0.5, ramp: "up" },
  gameWin: { frequency: 784, duration: 600, volume: 0.6, ramp: "up" },
  gameLose: { frequency: 262, duration: 500, volume: 0.4, ramp: "down" },
  trumpReveal: { frequency: 440, duration: 300, volume: 0.4, ramp: "up" },
  rob: { frequency: 392, duration: 250, volume: 0.4, ramp: "none" },
  buttonTap: { frequency: 1000, duration: 40, volume: 0.2, ramp: "none" },
  invalidMove: { frequency: 200, duration: 200, volume: 0.3, ramp: "none" },
  scoreMilestone: { frequency: 587, duration: 300, volume: 0.4, ramp: "up" },
  topTrump: { frequency: 698, duration: 250, volume: 0.5, ramp: "up" },
  perfectTrick: { frequency: 880, duration: 350, volume: 0.5, ramp: "up" },
};

class SoundManager {
  private soundEnabled = true;
  private isInitialized = false;
  private soundPool: Map<string, Audio.Sound> = new Map();
  private isPlaying: Set<string> = new Set();

  /**
   * Initialize the audio system
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.isInitialized = true;
    } catch (error) {
      console.warn("Failed to initialize audio:", error);
    }
  }

  /**
   * Set whether sounds are enabled
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  /**
   * Check if sounds are enabled
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Generate a simple beep/tone sound data URI
   * Creates a sine wave tone as a WAV file
   */
  private generateToneDataUri(config: SoundConfig): string {
    const sampleRate = 44100;
    const numSamples = Math.floor((config.duration / 1000) * sampleRate);
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = numSamples * blockAlign;

    // Create WAV header
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    this.writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, "WAVE");

    // fmt chunk
    this.writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    this.writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);

    // Generate sine wave samples
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let amplitude = config.volume;

      // Apply envelope
      const progress = i / numSamples;
      if (config.ramp === "up") {
        amplitude *= Math.min(1, progress * 4) * (1 - progress * 0.5);
      } else if (config.ramp === "down") {
        amplitude *= 1 - progress;
      } else {
        // Simple fade in/out
        const fadeLen = 0.1;
        if (progress < fadeLen) amplitude *= progress / fadeLen;
        if (progress > 1 - fadeLen) amplitude *= (1 - progress) / fadeLen;
      }

      const sample = Math.sin(2 * Math.PI * config.frequency * t) * amplitude;
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      view.setInt16(44 + i * 2, intSample, true);
    }

    // Convert to base64
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return "data:audio/wav;base64," + btoa(binary);
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /**
   * Play a sound effect
   */
  async play(type: SoundType): Promise<void> {
    if (!this.soundEnabled) return;

    // Prevent overlapping plays of the same sound
    if (this.isPlaying.has(type)) return;

    try {
      await this.init();

      const config = SOUND_CONFIGS[type];
      const dataUri = this.generateToneDataUri(config);

      const { sound } = await Audio.Sound.createAsync(
        { uri: dataUri },
        { shouldPlay: true, volume: config.volume }
      );

      this.isPlaying.add(type);

      // Clean up when sound finishes
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          this.isPlaying.delete(type);
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch (error) {
      this.isPlaying.delete(type);
      // Silently fail - sound effects are non-critical
    }
  }

  /**
   * Play a sequence of sounds (for fanfares, etc.)
   */
  async playSequence(types: SoundType[], delayMs = 150): Promise<void> {
    if (!this.soundEnabled) return;

    for (let i = 0; i < types.length; i++) {
      await this.play(types[i]);
      if (i < types.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Clean up all sounds
   */
  async cleanup(): Promise<void> {
    for (const sound of this.soundPool.values()) {
      try {
        await sound.unloadAsync();
      } catch {
        // Ignore cleanup errors
      }
    }
    this.soundPool.clear();
    this.isPlaying.clear();
  }
}

// Singleton instance
const soundManager = new SoundManager();

// Export convenience functions
export function setSoundEnabled(enabled: boolean): void {
  soundManager.setSoundEnabled(enabled);
}

export function isSoundEnabled(): boolean {
  return soundManager.isSoundEnabled();
}

export async function playSound(type: SoundType): Promise<void> {
  return soundManager.play(type);
}

export async function playSoundSequence(types: SoundType[], delayMs?: number): Promise<void> {
  return soundManager.playSequence(types, delayMs);
}

// Named exports for common sounds
export const playCardPlay = () => playSound("cardPlay");
export const playCardDeal = () => playSound("cardDeal");
export const playTrickWon = () => playSound("trickWin");
export const playHandWon = () => playSound("handWin");
export const playGameWin = () => playSound("gameWin");
export const playGameLose = () => playSound("gameLose");
export const playTrumpReveal = () => playSound("trumpReveal");
export const playRob = () => playSound("rob");
export const playButtonTap = () => playSound("buttonTap");
export const playInvalidMove = () => playSound("invalidMove");
export const playScoreMilestone = () => playSound("scoreMilestone");
export const playTopTrump = () => playSound("topTrump");
export const playPerfectTrick = () => playSound("perfectTrick");

// Victory fanfare - plays a sequence of ascending tones
export async function playVictoryFanfare(): Promise<void> {
  await playSoundSequence(["trickWin", "handWin", "gameWin"], 200);
}

// Defeat sound - plays descending tones
export async function playDefeatSound(): Promise<void> {
  await playSound("gameLose");
}

export default soundManager;
