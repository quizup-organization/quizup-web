import { describe, expect, it } from "vitest";
import { currentStreak, streakLetter } from "./streak";

const game = (outcome: string) => ({ outcome });

describe("currentStreak", () => {
  it("est nul sans résultat", () => {
    expect(currentStreak([])).toBeNull();
    expect(currentStreak([game("IN_PROGRESS"), game("CANCELLED")])).toBeNull();
  });

  it("compte les issues identiques consécutives depuis la plus récente", () => {
    expect(
      currentStreak([game("WIN"), game("WIN"), game("WIN"), game("LOSS")]),
    ).toEqual({ outcome: "WIN", count: 3 });
  });

  it("s'arrête au premier résultat différent", () => {
    expect(currentStreak([game("LOSS"), game("WIN"), game("LOSS")])).toEqual({
      outcome: "LOSS",
      count: 1,
    });
  });

  it("ignore les parties non terminées sans casser la série", () => {
    expect(
      currentStreak([
        game("IN_PROGRESS"),
        game("DRAW"),
        game("WAITING"),
        game("DRAW"),
        game("WIN"),
      ]),
    ).toEqual({ outcome: "DRAW", count: 2 });
  });
});

describe("streakLetter", () => {
  it("utilise les initiales FR (V/D/N) et EN (W/L/D)", () => {
    expect(streakLetter("WIN", "fr")).toBe("V");
    expect(streakLetter("LOSS", "fr")).toBe("D");
    expect(streakLetter("DRAW", "fr")).toBe("N");
    expect(streakLetter("WIN", "en")).toBe("W");
    expect(streakLetter("LOSS", "en")).toBe("L");
    expect(streakLetter("DRAW", "en")).toBe("D");
  });
});
