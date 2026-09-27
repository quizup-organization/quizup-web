import { describe, expect, it } from "vitest";
import type { TicketNotification } from "@/shared/types/notifications";
import { applyTicketNotification, emptyTicket } from "./ticket";

function fold(notifications: TicketNotification[]) {
  return notifications.reduce(
    applyTicketNotification,
    emptyTicket("ticket-1"),
  );
}

describe("applyTicketNotification", () => {
  it("reconstruit l'état complet d'un ticket apparié", () => {
    const ticket = fold([
      { type: "SEARCHING", ticketId: "ticket-1", topicId: "topic-1" },
      {
        type: "MATCHED",
        ticketId: "ticket-1",
        gameId: "game-1",
        initiatorId: "u1",
        challengerId: "u2",
        vsBot: false,
      },
    ]);

    expect(ticket.status).toBe("MATCHED");
    expect(ticket.gameId).toBe("game-1");
    expect(ticket.topicId).toBe("topic-1");
    expect(ticket.initiatorId).toBe("u1");
    expect(ticket.challengerId).toBe("u2");
  });

  it("reste idempotent en cas de rejeu (REST + WS)", () => {
    const notifications: TicketNotification[] = [
      { type: "SEARCHING", ticketId: "ticket-1", topicId: "topic-1" },
      {
        type: "MATCHED",
        ticketId: "ticket-1",
        gameId: "game-1",
        initiatorId: "u1",
        challengerId: "u2",
        vsBot: false,
      },
    ];
    const appliedOnce = fold(notifications);
    const appliedTwice = notifications.reduce(applyTicketNotification, appliedOnce);

    expect(appliedTwice).toEqual(appliedOnce);
  });

  it("reflète l'annulation", () => {
    const ticket = fold([
      { type: "SEARCHING", ticketId: "ticket-1", topicId: "topic-1" },
      { type: "CANCELLED", ticketId: "ticket-1" },
    ]);

    expect(ticket.status).toBe("CANCELLED");
    expect(ticket.gameId).toBeNull();
  });

  it("préserve l'état sur une notification inconnue (garde défensive)", () => {
    const base = fold([
      { type: "SEARCHING", ticketId: "ticket-1", topicId: "topic-1" },
    ]);
    const unknown = { type: "UNKNOWN_TYPE" } as unknown as TicketNotification;

    expect(applyTicketNotification(base, unknown)).toEqual(base);
  });
});
