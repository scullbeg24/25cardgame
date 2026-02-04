/**
 * User preferences - persisted via AsyncStorage
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@25cardgame/settings";

export type AnimationSpeed = "slow" | "normal" | "fast" | "off";
export type CardSize = "small" | "medium" | "large";
export type AIDifficulty = "easy" | "medium" | "hard";

export interface RuleVariations {
  allowRobWithFiveHearts?: boolean;
  allowRenege?: boolean;
  pointsToWinHand?: number;
}

export interface SettingsState {
  soundEnabled: boolean;
  animationSpeed: AnimationSpeed;
  cardSize: CardSize;
  showHints: boolean;
  allowUndo: boolean;
  aiDifficulty: AIDifficulty;
  ruleVariations: RuleVariations;
}

const defaultSettings: SettingsState = {
  soundEnabled: true,
  animationSpeed: "normal",
  cardSize: "medium",
  showHints: true,
  allowUndo: false,
  aiDifficulty: "medium",
  ruleVariations: {},
};

interface SettingsStore extends SettingsState {
  setSoundEnabled: (v: boolean) => void;
  setAnimationSpeed: (v: AnimationSpeed) => void;
  setCardSize: (v: CardSize) => void;
  setShowHints: (v: boolean) => void;
  setAllowUndo: (v: boolean) => void;
  setAIDifficulty: (v: AIDifficulty) => void;
  setRuleVariations: (v: Partial<RuleVariations>) => void;
  load: () => Promise<void>;
  save: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...defaultSettings,

  setSoundEnabled: (v) => set({ soundEnabled: v }),
  setAnimationSpeed: (v) => set({ animationSpeed: v }),
  setCardSize: (v) => set({ cardSize: v }),
  setShowHints: (v) => set({ showHints: v }),
  setAllowUndo: (v) => set({ allowUndo: v }),
  setAIDifficulty: (v) => set({ aiDifficulty: v }),
  setRuleVariations: (v) =>
    set((s) => ({ ruleVariations: { ...s.ruleVariations, ...v } })),

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        set((s) => ({ ...s, ...parsed }));
      }
    } catch {
      // ignore
    }
  },

  save: async () => {
    try {
      const state = get();
      const toSave: SettingsState = {
        soundEnabled: state.soundEnabled,
        animationSpeed: state.animationSpeed,
        cardSize: state.cardSize,
        showHints: state.showHints,
        allowUndo: state.allowUndo,
        aiDifficulty: state.aiDifficulty,
        ruleVariations: state.ruleVariations,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // ignore
    }
  },
}));
