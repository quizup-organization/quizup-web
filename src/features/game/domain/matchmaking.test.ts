import { describe, expect, it } from "vitest";
import { applyMatchmakingNotification, emptyMatchmaking } from "./matchmaking";

describe("applyMatchmakingNotification", () => {
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
