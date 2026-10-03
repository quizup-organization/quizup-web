import { describe, expect, it } from "vitest";
import { relativeTime } from "./notification";

describe("relativeTime", () => {
  it("affiche « à l'instant » pour une date récente", () => {
    expect(relativeTime(new Date().toISOString())).toBe("à l'instant");
  });

  it("affiche les minutes puis les heures", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    const threeHoursAgo = new Date(Date.now() - 3 * 3_600_000).toISOString();

    expect(relativeTime(fiveMinutesAgo)).toBe("il y a 5 min");
    expect(relativeTime(threeHoursAgo)).toBe("il y a 3 h");
  });

  it("affiche les jours sur une semaine", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString();

    expect(relativeTime(twoDaysAgo)).toBe("il y a 2 j");
  });
});
