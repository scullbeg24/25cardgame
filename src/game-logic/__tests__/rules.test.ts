import type { Card } from "../cards";
import { isLegalPlay, canRobPack, getValidMoves } from "../rules";

describe("rules", () => {
  describe("isLegalPlay", () => {
    it("allows any card when leading", () => {
      const hand: Card[] = [
        { suit: "hearts", rank: "5" },
        { suit: "diamonds", rank: "K" },
      ];
      const result = isLegalPlay(
        { suit: "diamonds", rank: "K" },
        hand,
        [],
        "clubs"
      );
      expect(result.valid).toBe(true);
    });
    it("rejects card not in hand", () => {
      const hand: Card[] = [{ suit: "hearts", rank: "5" }];
      const result = isLegalPlay(
        { suit: "diamonds", rank: "K" },
        hand,
        [],
        "clubs"
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain("not in your hand");
    });
    it("must follow suit when able (non-trump card)", () => {
      const ledCard: Card = { suit: "hearts", rank: "K" };
      const hand: Card[] = [
        { suit: "hearts", rank: "2" },
        { suit: "clubs", rank: "A" },
      ];
      const result = isLegalPlay(
        { suit: "clubs", rank: "A" },
        hand,
        [ledCard],
        "diamonds"
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain("follow");
    });

    it("allows playing trump even when holding the led suit", () => {
      const ledCard: Card = { suit: "hearts", rank: "K" };
      const hand: Card[] = [
        { suit: "hearts", rank: "2" },
        { suit: "diamonds", rank: "J" }, // Jack of trump
      ];
      const result = isLegalPlay(
        { suit: "diamonds", rank: "J" },
        hand,
        [ledCard],
        "diamonds" // diamonds is trump
      );
      expect(result.valid).toBe(true);
    });

    it("allows playing 5 of hearts when hearts are trump even when holding the led suit", () => {
      const ledCard: Card = { suit: "clubs", rank: "K" };
      const hand: Card[] = [
        { suit: "clubs", rank: "2" },
        { suit: "hearts", rank: "5" }, // 5 of hearts is Five of Trumps when hearts are trump
      ];
      const result = isLegalPlay(
        { suit: "hearts", rank: "5" },
        hand,
        [ledCard],
        "hearts" // hearts is trump
      );
      expect(result.valid).toBe(true);
    });
    it("must follow suit with 5 of hearts when hearts are not trump", () => {
      const ledCard: Card = { suit: "hearts", rank: "K" };
      const hand: Card[] = [
        { suit: "hearts", rank: "5" },
        { suit: "clubs", rank: "A" },
      ];
      const result = isLegalPlay(
        { suit: "clubs", rank: "A" },
        hand,
        [ledCard],
        "diamonds" // diamonds is trump, 5♥ is not trump
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain("follow");
    });
  });

  describe("canRobPack", () => {
    it("returns true when dealer has ace of trump", () => {
      const hand: Card[] = [
        { suit: "hearts", rank: "A" },
        { suit: "diamonds", rank: "2" },
      ];
      const trumpCard: Card = { suit: "hearts", rank: "5" };
      expect(canRobPack(hand, trumpCard)).toBe(true);
    });
    it("returns false when dealer does not have ace of trump", () => {
      const hand: Card[] = [
        { suit: "hearts", rank: "K" },
        { suit: "diamonds", rank: "2" },
      ];
      const trumpCard: Card = { suit: "hearts", rank: "5" };
      expect(canRobPack(hand, trumpCard)).toBe(false);
    });
  });

  describe("getValidMoves", () => {
    it("returns all cards when leading", () => {
      const hand: Card[] = [
        { suit: "hearts", rank: "5" },
        { suit: "diamonds", rank: "K" },
      ];
      const moves = getValidMoves(hand, [], "clubs");
      expect(moves.length).toBe(2);
    });
  });
});
