import { describe, expect, it } from "vitest";
import { applyLobbyNotification, emptyLobby } from "./lobby";

describe("applyLobbyNotification", () => {
  it("défi nominatif : le créateur voit la cible avant la jointure", () => {
    const lobby = applyLobbyNotification(emptyLobby("lobby-1"), {
      type: "LOBBY_CREATED",
      lobbyId: "lobby-1",
      topicId: "topic-1",
      initiatorId: "me",
      opponentId: "opponent-1",
      expiresAt: "2030-01-01T00:00:00Z",
    });

    expect(lobby.status).toBe("CREATED");
    expect(lobby.opponentId).toBe("opponent-1");
  });

  it("le succès expose la partie et sort du cycle de vie", () => {
    const lobby = applyLobbyNotification(emptyLobby("lobby-1"), {
      type: "LOBBY_COMPLETED",
      lobbyId: "lobby-1",
      gameId: "game-1",
    });

    expect(lobby.status).toBe("CLOSED");
    expect(lobby.outcome).toBe("COMPLETED");
    expect(lobby.gameId).toBe("game-1");
  });

  it("un refus est un terminal CLOSED/DECLINED", () => {
    const lobby = applyLobbyNotification(emptyLobby("lobby-1"), {
      type: "LOBBY_DECLINED",
      lobbyId: "lobby-1",
      opponentId: "opponent-1",
    });

    expect(lobby.status).toBe("CLOSED");
    expect(lobby.outcome).toBe("DECLINED");
  });

  it("une annulation est un terminal CLOSED/CANCELLED", () => {
    const lobby = applyLobbyNotification(emptyLobby("lobby-1"), {
      type: "LOBBY_CANCELLED",
      lobbyId: "lobby-1",
      reason: "PLAYER_CANCELLED",
    });

    expect(lobby.status).toBe("CLOSED");
    expect(lobby.outcome).toBe("CANCELLED");
  });
});
