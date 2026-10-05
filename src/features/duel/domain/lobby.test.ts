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

  it("l'entrée en salle suit la présence de chaque joueur", () => {
    let lobby = applyLobbyNotification(emptyLobby("lobby-1"), {
      type: "LOBBY_CREATED",
      lobbyId: "lobby-1",
      topicId: "topic-1",
      initiatorId: "me",
      opponentId: "opponent-1",
      expiresAt: null,
    });

    lobby = applyLobbyNotification(lobby, {
      type: "LOBBY_ROOM_ENTERED",
      lobbyId: "lobby-1",
      playerId: "me",
    });
    expect(lobby.initiatorPresent).toBe(true);
    expect(lobby.participantPresent).toBe(false);

    lobby = applyLobbyNotification(lobby, {
      type: "LOBBY_ROOM_ENTERED",
      lobbyId: "lobby-1",
      playerId: "opponent-1",
    });
    expect(lobby.participantPresent).toBe(true);
  });

  it("les deux présents exposent l'échéance de lancement", () => {
    const lobby = applyLobbyNotification(emptyLobby("lobby-1"), {
      type: "LOBBY_ALL_PRESENT",
      lobbyId: "lobby-1",
      readyDeadlineAt: "2030-01-01T00:00:20Z",
    });

    expect(lobby.readyDeadlineAt).toBe("2030-01-01T00:00:20Z");
  });

  it("un absent est un terminal CLOSED/MISSED", () => {
    const lobby = applyLobbyNotification(emptyLobby("lobby-1"), {
      type: "LOBBY_MISSED",
      lobbyId: "lobby-1",
      absentPlayerId: "opponent-1",
      reason: "OPPONENT_OFFLINE",
    });

    expect(lobby.status).toBe("CLOSED");
    expect(lobby.outcome).toBe("MISSED");
    expect(lobby.missedReason).toBe("OPPONENT_OFFLINE");
    expect(lobby.absentPlayerId).toBe("opponent-1");
  });
});
