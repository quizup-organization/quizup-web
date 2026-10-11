import { describe, expect, it } from "vitest";
import {
  applyRoomNotification,
  emptyRoom,
  preparationStep,
  PREPARATION_STEPS,
  waitingStatusLabel,
} from "./room";

const ROOM_ID = "room-1";
const TOPIC_ID = "topic-1";
const INITIATOR = "initiator-1";
const PARTICIPANT = "participant-1";

describe("applyRoomNotification", () => {
  it("crée la salle (sujet, initiateur, échéance)", () => {
    const room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_CREATED",
      roomId: ROOM_ID,
      topicId: TOPIC_ID,
      initiatorId: INITIATOR,
      opponentId: null,
      vsBot: false,
      expiresAt: "2026-01-02T00:00:00Z",
    });

    expect(room.status).toBe("WAITING_PLAYERS");
    expect(room.topicId).toBe(TOPIC_ID);
    expect(room.initiatorId).toBe(INITIATOR);
    expect(room.vsBot).toBe(false);
    expect(room.expiresAt).toBe("2026-01-02T00:00:00Z");
  });

  it("marque une salle bot", () => {
    const room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_CREATED",
      roomId: ROOM_ID,
      topicId: TOPIC_ID,
      initiatorId: INITIATOR,
      opponentId: "bot-1",
      vsBot: true,
      expiresAt: null,
    });

    expect(room.vsBot).toBe(true);
    expect(room.opponentId).toBe("bot-1");
  });

  it("marque la présence de l'initiateur sans enregistrer de participant", () => {
    const created = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_CREATED",
      roomId: ROOM_ID,
      topicId: TOPIC_ID,
      initiatorId: INITIATOR,
      opponentId: null,
      vsBot: false,
      expiresAt: null,
    });

    const room = applyRoomNotification(created, {
      type: "ROOM_ENTERED",
      roomId: ROOM_ID,
      playerId: INITIATOR,
    });

    expect(room.initiatorPresent).toBe(true);
    expect(room.participantId).toBeNull();
  });

  it("enregistre le second joueur à son apparition", () => {
    let room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_CREATED",
      roomId: ROOM_ID,
      topicId: TOPIC_ID,
      initiatorId: INITIATOR,
      opponentId: null,
      vsBot: false,
      expiresAt: null,
    });
    room = applyRoomNotification(room, {
      type: "ROOM_ENTERED",
      roomId: ROOM_ID,
      playerId: INITIATOR,
    });
    room = applyRoomNotification(room, {
      type: "ROOM_ENTERED",
      roomId: ROOM_ID,
      playerId: PARTICIPANT,
    });

    expect(room.participantId).toBe(PARTICIPANT);
    expect(room.participantPresent).toBe(true);
  });

  it("éteint la présence à la sortie sans fermer la salle", () => {
    let room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_CREATED",
      roomId: ROOM_ID,
      topicId: TOPIC_ID,
      initiatorId: INITIATOR,
      opponentId: null,
      vsBot: false,
      expiresAt: null,
    });
    room = applyRoomNotification(room, {
      type: "ROOM_ENTERED",
      roomId: ROOM_ID,
      playerId: INITIATOR,
    });
    room = applyRoomNotification(room, {
      type: "ROOM_ENTERED",
      roomId: ROOM_ID,
      playerId: PARTICIPANT,
    });
    room = applyRoomNotification(room, {
      type: "ROOM_LEFT",
      roomId: ROOM_ID,
      playerId: PARTICIPANT,
    });

    expect(room.status).toBe("WAITING_PLAYERS");
    expect(room.participantPresent).toBe(false);
    expect(room.initiatorPresent).toBe(true);
  });

  it("arme le compte à rebours quand les deux sont présents", () => {
    const room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_ALL_PRESENT",
      roomId: ROOM_ID,
      readyDeadlineAt: "2026-01-01T10:00:03Z",
    });

    expect(room.status).toBe("FETCHING_PLAYERS");
    expect(room.readyDeadlineAt).toBe("2026-01-01T10:00:03Z");
  });

  it("suit l'avancement de la préparation (profils puis questions)", () => {
    let room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_ALL_PRESENT",
      roomId: ROOM_ID,
      readyDeadlineAt: "2026-01-01T10:00:03Z",
    });
    room = applyRoomNotification(room, {
      type: "ROOM_PLAYERS_LOADED",
      roomId: ROOM_ID,
    });
    expect(room.status).toBe("FETCHING_QUESTIONS");

    room = applyRoomNotification(room, {
      type: "ROOM_QUESTIONS_LOADED",
      roomId: ROOM_ID,
    });
    expect(room.status).toBe("CREATING_GAME");
  });

  it("clôt sur partie créée", () => {
    const room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_COMPLETED",
      roomId: ROOM_ID,
      gameId: "game-1",
    });

    expect(room.status).toBe("COMPLETED");
    expect(room.gameId).toBe("game-1");
  });

  it("clôt sur annulation", () => {
    const room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_CANCELLED",
      roomId: ROOM_ID,
      reason: "PLAYER_CANCELLED",
    });

    expect(room.status).toBe("CANCELLED");
  });

  it("clôt sur expiration", () => {
    const room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_EXPIRED",
      roomId: ROOM_ID,
    });

    expect(room.status).toBe("EXPIRED");
  });

  it("passe en échec quand la partie n'a pas pu être préparée", () => {
    const room = applyRoomNotification(emptyRoom(ROOM_ID), {
      type: "ROOM_FAILED",
      roomId: ROOM_ID,
      reason: "TOPIC_NOT_AVAILABLE_IN_LANGUAGE",
    });

    expect(room.status).toBe("FAILED");
  });
});

describe("preparationStep", () => {
  it("mappe chaque statut sur son étape", () => {
    expect(preparationStep("WAITING_PLAYERS")).toBe(0);
    expect(preparationStep("FETCHING_PLAYERS")).toBe(1);
    expect(preparationStep("FETCHING_QUESTIONS")).toBe(2);
    expect(preparationStep("CREATING_GAME")).toBe(3);
  });

  it("marque la préparation terminée quand la partie est créée", () => {
    expect(preparationStep("COMPLETED")).toBe(PREPARATION_STEPS.length);
  });

  it("retombe sur la première étape pour un état terminal sans partie", () => {
    expect(preparationStep("CANCELLED")).toBe(0);
    expect(preparationStep("EXPIRED")).toBe(0);
    expect(preparationStep("FAILED")).toBe(0);
  });
});

describe("waitingStatusLabel", () => {
  it("priorise le compte à rebours", () => {
    expect(
      waitingStatusLabel({
        readyDeadlineAt: "2026-01-01T10:00:03Z",
        playerPresent: true,
        opponentPresent: true,
        opponentLabel: "Bob",
      }),
    ).toBe("La partie démarre…");
  });

  it("signale la présence complète sans échéance", () => {
    expect(
      waitingStatusLabel({
        readyDeadlineAt: null,
        playerPresent: true,
        opponentPresent: true,
        opponentLabel: "Bob",
      }),
    ).toBe("Tout le monde est prêt…");
  });

  it("nomme l'adversaire attendu", () => {
    expect(
      waitingStatusLabel({
        readyDeadlineAt: null,
        playerPresent: true,
        opponentPresent: false,
        opponentLabel: "Bob",
      }),
    ).toBe("En attente de Bob…");
  });

  it("reste générique sans adversaire connu", () => {
    expect(
      waitingStatusLabel({
        readyDeadlineAt: null,
        playerPresent: true,
        opponentPresent: false,
        opponentLabel: null,
      }),
    ).toBe("En attente d'un adversaire…");
  });
});
