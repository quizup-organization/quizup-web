import { describe, expect, it } from "vitest";
import { applyGameNotification, emptyGame, type GameState } from "./game";
import { rematchView } from "./rematch";

const USER_ID = "u1";
const OPPONENT_ID = "u2";

function finishedGame(overrides: Partial<GameState> = {}): GameState {
  return {
    ...emptyGame("game-1"),
    status: "FINISHED",
    player1Id: USER_ID,
    player2Id: OPPONENT_ID,
    player2Type: "HUMAN",
    joinedPlayerIds: [USER_ID, OPPONENT_ID],
    ...overrides,
  };
}

describe("rematchView", () => {
  it("autorise une demande quand la partie humaine est terminée et l'adversaire présent", () => {
    const view = rematchView(finishedGame(), USER_ID, OPPONENT_ID);

    expect(view.canRequest).toBe(true);
    expect(view.outgoingPending).toBe(false);
    expect(view.incomingRequest).toBe(false);
    expect(view.accepted).toBe(false);
    expect(view.declined).toBe(false);
    expect(view.cancelledReason).toBeNull();
    expect(view.newGameId).toBeNull();
    expect(view.opponentPresent).toBe(true);
    expect(view.opponentId).toBe(OPPONENT_ID);
  });

  it("interdit la demande contre un bot", () => {
    const view = rematchView(
      finishedGame({ player2Type: "BOT" }),
      USER_ID,
      OPPONENT_ID,
    );

    expect(view.canRequest).toBe(false);
  });

  it("interdit la demande tant que la partie n'est pas terminée", () => {
    const view = rematchView(
      finishedGame({ status: "IN_PROGRESS" }),
      USER_ID,
      OPPONENT_ID,
    );

    expect(view.canRequest).toBe(false);
  });

  it("interdit la demande si l'adversaire n'est plus présent", () => {
    const view = rematchView(
      finishedGame({ joinedPlayerIds: [USER_ID] }),
      USER_ID,
      OPPONENT_ID,
    );

    expect(view.opponentPresent).toBe(false);
    expect(view.canRequest).toBe(false);
  });

  it("interdit la demande sans adversaire identifié", () => {
    const view = rematchView(finishedGame(), USER_ID, null);

    expect(view.opponentPresent).toBe(false);
    expect(view.canRequest).toBe(false);
    expect(view.opponentId).toBeNull();
  });

  it("distingue ma demande (sortante) de celle de l'adversaire (entrante)", () => {
    const mine = applyGameNotification(finishedGame(), {
      type: "REMATCH_REQUESTED",
      gameId: "game-1",
      requesterId: USER_ID,
    });
    const theirs = applyGameNotification(finishedGame(), {
      type: "REMATCH_REQUESTED",
      gameId: "game-1",
      requesterId: OPPONENT_ID,
    });

    expect(rematchView(mine, USER_ID, OPPONENT_ID).outgoingPending).toBe(true);
    expect(rematchView(mine, USER_ID, OPPONENT_ID).incomingRequest).toBe(false);
    expect(rematchView(theirs, USER_ID, OPPONENT_ID).outgoingPending).toBe(false);
    expect(rematchView(theirs, USER_ID, OPPONENT_ID).incomingRequest).toBe(true);
    expect(rematchView(theirs, USER_ID, OPPONENT_ID).canRequest).toBe(false);
  });

  it("marque l'acceptation dès qu'un joueur a accepté", () => {
    const accepted = applyGameNotification(
      applyGameNotification(finishedGame(), {
        type: "REMATCH_REQUESTED",
        gameId: "game-1",
        requesterId: OPPONENT_ID,
      }),
      { type: "REMATCH_ACCEPTED", gameId: "game-1", playerId: USER_ID },
    );

    expect(rematchView(accepted, USER_ID, OPPONENT_ID).accepted).toBe(true);
  });

  it("reflète le refus, l'annulation et la partie de revanche créée", () => {
    const declined = applyGameNotification(finishedGame(), {
      type: "REMATCH_DECLINED",
      gameId: "game-1",
      playerId: OPPONENT_ID,
    });
    const cancelled = applyGameNotification(declined, {
      type: "REMATCH_CANCELLED",
      gameId: "game-1",
      reason: "OPPONENT_LEFT",
    });
    const started = applyGameNotification(cancelled, {
      type: "REMATCH_STARTED",
      gameId: "game-1",
      newGameId: "game-2",
    });
    const view = rematchView(started, USER_ID, OPPONENT_ID);

    expect(view.declined).toBe(true);
    expect(view.cancelledReason).toBe("OPPONENT_LEFT");
    expect(view.newGameId).toBe("game-2");
    expect(view.canRequest).toBe(false);
  });
});
