import { describe, expect, it } from "vitest";
import type { LobbyNotification } from "@/shared/types/notifications";
import { applyLobbyNotification, emptyLobby } from "./lobby";

function fold(notifications: LobbyNotification[]) {
  return notifications.reduce(applyLobbyNotification, emptyLobby("lobby-1"));
}

describe("applyLobbyNotification", () => {
  it("reconstruit l'état complet d'un lobby apparié", () => {
    const lobby = fold([
      { type: "OPENED", lobbyId: "lobby-1", topicId: "topic-1", initiatorId: "u1" },
      { type: "JOINED", lobbyId: "lobby-1", challengerId: "u2", vsBot: false },
      { type: "COMPLETED", lobbyId: "lobby-1", gameId: "game-1", vsBot: false },
    ]);

    expect(lobby.status).toBe("COMPLETED");
    expect(lobby.gameId).toBe("game-1");
    expect(lobby.topicId).toBe("topic-1");
    expect(lobby.initiatorId).toBe("u1");
    expect(lobby.challengerId).toBe("u2");
  });

  it("reste idempotent en cas de rejeu (REST + WS)", () => {
    const notifications: LobbyNotification[] = [
      { type: "OPENED", lobbyId: "lobby-1", topicId: "topic-1", initiatorId: "u1" },
      { type: "COMPLETED", lobbyId: "lobby-1", gameId: "game-1", vsBot: false },
    ];
    const appliedOnce = fold(notifications);
    const appliedTwice = notifications.reduce(applyLobbyNotification, appliedOnce);

    expect(appliedTwice).toEqual(appliedOnce);
  });

  it("reflète l'annulation", () => {
    const lobby = fold([
      { type: "OPENED", lobbyId: "lobby-1", topicId: "topic-1", initiatorId: "u1" },
      { type: "CANCELLED", lobbyId: "lobby-1" },
    ]);

    expect(lobby.status).toBe("CANCELLED");
    expect(lobby.gameId).toBeNull();
  });

  it("préserve l'état sur une notification inconnue (garde défensive)", () => {
    const base = fold([
      { type: "OPENED", lobbyId: "lobby-1", topicId: "topic-1", initiatorId: "u1" },
    ]);
    const unknown = { type: "UNKNOWN_TYPE" } as unknown as LobbyNotification;

    expect(applyLobbyNotification(base, unknown)).toEqual(base);
  });
});
