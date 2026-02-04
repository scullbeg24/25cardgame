import type { Card } from "../cards";
import {
  getTrumpRank,
  getWinningCardIndex,
  isAlwaysTrump,
  createDeck,
} from "../cards";

describe("cards", () => {
  describe("isAlwaysTrump", () => {
    it("returns true for 5 of hearts", () => {
      expect(isAlwaysTrump({ suit: "hearts", rank: "5" })).toBe(true);
    });
    it("returns true for A of hearts", () => {
      expect(isAlwaysTrump({ suit: "hearts", rank: "A" })).toBe(true);
    });
    it("returns false for other cards", () => {
      expect(isAlwaysTrump({ suit: "hearts", rank: "K" })).toBe(false);
      expect(isAlwaysTrump({ suit: "diamonds", rank: "5" })).toBe(false);
    });
  });

  describe("getTrumpRank", () => {
    it("5 of hearts is highest when diamonds are trump", () => {
      const fiveHearts = getTrumpRank(
        { suit: "hearts", rank: "5" },
        "diamonds"
      );
      const jackDiamonds = getTrumpRank(
        { suit: "diamonds", rank: "J" },
        "diamonds"
      );
      expect(fiveHearts).toBeGreaterThan(jackDiamonds);
    });
    it("A of hearts is 3rd when clubs are trump", () => {
      const fiveHearts = getTrumpRank({ suit: "hearts", rank: "5" }, "clubs");
      const jackClubs = getTrumpRank({ suit: "clubs", rank: "J" }, "clubs");
      const aceHearts = getTrumpRank({ suit: "hearts", rank: "A" }, "clubs");
      const aceClubs = getTrumpRank({ suit: "clubs", rank: "A" }, "clubs");
      expect(fiveHearts).toBeGreaterThan(jackClubs);
      expect(jackClubs).toBeGreaterThan(aceHearts);
      expect(aceHearts).toBeGreaterThan(aceClubs);
    });
  });

  describe("getWinningCardIndex", () => {
    it("5 of hearts wins over jack of trump", () => {
      const trick: Card[] = [
        { suit: "diamonds", rank: "J" },
        { suit: "hearts", rank: "5" },
        { suit: "diamonds", rank: "K" },
        { suit: "diamonds", rank: "Q" },
      ];
      const winner = getWinningCardIndex(trick, "diamonds", "diamonds");
      expect(winner).toBe(1);
    });
    it("highest led suit wins when no trump played", () => {
      const trick: Card[] = [
        { suit: "diamonds", rank: "2" },
        { suit: "diamonds", rank: "K" },
        { suit: "diamonds", rank: "10" },
        { suit: "diamonds", rank: "7" },
      ];
      const winner = getWinningCardIndex(trick, "diamonds", "clubs");
      expect(winner).toBe(1);
    });
  });

  describe("createDeck", () => {
    it("creates 52 cards", () => {
      const deck = createDeck();
      expect(deck.length).toBe(52);
    });
    it("has 13 cards per suit", () => {
      const deck = createDeck();
      const hearts = deck.filter((c) => c.suit === "hearts");
      expect(hearts.length).toBe(13);
    });
  });
});
