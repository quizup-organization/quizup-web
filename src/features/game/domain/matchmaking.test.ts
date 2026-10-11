import { describe, expect, it } from "vitest";
import { applyMatchmakingNotification, emptyMatchmaking } from "./matchmaking";

describe("applyMatchmakingNotification", () => {
  it("SEARCHING porte l'échéance de recherche", () => {
    const ticket = applyMatchmakingNotification(emptyMatchmaking("ticket-1"), {
      type: "SEARCHING",
      ticketId: "ticket-1",
      topicId: "topic-1",
      deadlineAt: "2026-01-01T10:00:05Z",
    });

    expect(ticket.status).toBe("SEARCHING");
    expect(ticket.topicId).toBe("topic-1");
    expect(ticket.deadlineAt).toBe("2026-01-01T10:00:05Z");
  });

  it("MATCHED expose la salle côté client (statut serveur COMPLETED)", () => {
    const ticket = applyMatchmakingNotification(emptyMatchmaking("ticket-1"), {
      type: "MATCHED",
      ticketId: "ticket-1",
      roomId: "room-1",
      opponentId: "opponent-1",
      vsBot: false,
    });

    expect(ticket.status).toBe("MATCHED");
    expect(ticket.roomId).toBe("room-1");
    expect(ticket.opponentId).toBe("opponent-1");
  });

  it("CANCELLED reste un état client terminal", () => {
    const ticket = applyMatchmakingNotification(emptyMatchmaking("ticket-1"), {
      type: "CANCELLED",
      ticketId: "ticket-1",
    });

    expect(ticket.status).toBe("CANCELLED");
  });
});
