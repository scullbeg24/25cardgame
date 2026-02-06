import type { Card } from "../cards";
import {
  getTrumpRank,
  getWinningCardIndex,
  isAlwaysTrump,
  createDeck,
} from "../cards";

describe("cards", () => {
  describe("isAlwaysTrump", () => {
    it("returns false for 5 of hearts (only trump when hearts are trump)", () => {
      expect(isAlwaysTrump({ suit: "hearts", rank: "5" })).toBe(false);
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
    it("5 of hearts is not trump when diamonds are trump", () => {
      const fiveHearts = getTrumpRank(
        { suit: "hearts", rank: "5" },
        "diamonds"
      );
      expect(fiveHearts).toBe(0);
    });
    it("A of hearts is 3rd when clubs are trump", () => {
      const fiveClubs = getTrumpRank({ suit: "clubs", rank: "5" }, "clubs");
      const jackClubs = getTrumpRank({ suit: "clubs", rank: "J" }, "clubs");
      const aceHearts = getTrumpRank({ suit: "hearts", rank: "A" }, "clubs");
      const aceClubs = getTrumpRank({ suit: "clubs", rank: "A" }, "clubs");
      expect(fiveClubs).toBeGreaterThan(jackClubs);
      expect(jackClubs).toBeGreaterThan(aceHearts);
      expect(aceHearts).toBeGreaterThan(aceClubs);
    });
    it("5 of trump suit (Five of Trumps) beats Jack of trump when diamonds are trump", () => {
      const fiveDiamonds = getTrumpRank({ suit: "diamonds", rank: "5" }, "diamonds");
      const jackDiamonds = getTrumpRank({ suit: "diamonds", rank: "J" }, "diamonds");
      expect(fiveDiamonds).toBeGreaterThan(jackDiamonds);
    });
    it("5 of hearts is highest when hearts are trump", () => {
      const fiveHearts = getTrumpRank({ suit: "hearts", rank: "5" }, "hearts");
      const jackHearts = getTrumpRank({ suit: "hearts", rank: "J" }, "hearts");
      expect(fiveHearts).toBeGreaterThan(jackHearts);
    });
  });

  describe("getWinningCardIndex", () => {
    it("5 of hearts wins over jack of trump when hearts are trump", () => {
      const trick: Card[] = [
        { suit: "hearts", rank: "J" },
        { suit: "hearts", rank: "5" },
        { suit: "hearts", rank: "K" },
        { suit: "hearts", rank: "Q" },
      ];
      const winner = getWinningCardIndex(trick, "hearts", "hearts");
      expect(winner).toBe(1);
    });
    it("5 of trump suit wins over any other card when no 5♥ played", () => {
      const trick: Card[] = [
        { suit: "diamonds", rank: "J" },
        { suit: "diamonds", rank: "A" },
        { suit: "diamonds", rank: "5" },
        { suit: "diamonds", rank: "K" },
      ];
      const winner = getWinningCardIndex(trick, "diamonds", "diamonds");
      expect(winner).toBe(2);
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
