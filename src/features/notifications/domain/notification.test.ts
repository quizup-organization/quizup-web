import { describe, expect, it } from "vitest";
import type { NotificationView } from "@/shared/types/notifications";
import { isExpired, lobbyTargetPath, relativeTime } from "./notification";

function invitation(expiresAt: string | null): NotificationView {
  return {
    notificationId: "n1",
    type: "LOBBY_INVITATION",
    actorId: "u2",
    sourceId: "lobby-1",
    topicId: "topic-1",
    gameId: null,
    expiresAt,
    readAt: null,
    createdAt: new Date().toISOString(),
  };
}

describe("lobbyTargetPath", () => {
  const accepted = (gameId: string | null, sourceId: string | null): NotificationView => ({
    notificationId: "n2",
    type: "LOBBY_ACCEPTED",
    actorId: "u2",
    sourceId,
    topicId: "topic-1",
    gameId,
    expiresAt: null,
    readAt: null,
    createdAt: new Date().toISOString(),
  });

  it("pointe vers l'arène quand la partie est créée", () => {
    expect(lobbyTargetPath(accepted("game-1", "lobby-1"))).toBe("/duel/game-1");
  });

  it("pointe vers la salle d'attente sinon", () => {
    expect(lobbyTargetPath(accepted(null, "lobby-1"))).toBe("/lobbies/lobby-1");
  });

  it("est nul pour les autres types", () => {
    expect(lobbyTargetPath(invitation(null))).toBeNull();
  });
});

describe("isExpired", () => {
  it("vrai quand la date d'expiration est passée", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isExpired(invitation(past))).toBe(true);
  });

  it("faux quand l'expiration est future ou absente", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isExpired(invitation(future))).toBe(false);
    expect(isExpired(invitation(null))).toBe(false);
  });
});

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
