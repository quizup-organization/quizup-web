import { describe, expect, it } from "vitest";
import type { GameNotification } from "@/shared/types/notifications";
import {
  applyGameNotification,
  displayTimeLeft,
  emptyGame,
  frozenTimeLeft,
  type GameRoundState,
} from "./game";

function fold(notifications: GameNotification[]) {
  return notifications.reduce(applyGameNotification, emptyGame("game-1"));
}

const created: GameNotification = {
  type: "GAME_CREATED",
  gameId: "game-1",
  topicId: "topic-1",
  player1Id: "u1",
  player1Name: "Alice",
  player2Id: "u2",
  player2Name: "Bob",
  player2Type: "HUMAN",
  mode: "SYNC",
  botDifficulty: null,
};

const roundStarted: GameNotification = {
  type: "ROUND_STARTED",
  gameId: "game-1",
  round: "ROUND_1",
  questionId: "q1",
  questionText: "Question ?",
  imageUrl: "https://example.com/illustration.png",
  difficulty: "MEDIUM",
  answers: { A: "un", B: "deux" },
  bonus: false,
  shownAt: "2026-09-18T10:00:00Z",
  revealAt: "2026-09-18T10:00:02Z",
};

describe("applyGameNotification", () => {
  it("reconstruit l'état d'une manche et les scores", () => {
    const game = fold([
      created,
      { type: "GAME_STARTED", gameId: "game-1", mode: "SYNC", firstRoundAt: "2026-09-18T10:00:00Z" },
      roundStarted,
      {
        type: "QUESTION_REVEALED",
        gameId: "game-1",
        round: "ROUND_1",
        revealedAt: "2026-09-18T10:00:02Z",
        answerDeadlineAt: "2026-09-18T10:00:12Z",
      },
      {
        type: "PLAYER_ANSWERED",
        gameId: "game-1",
        round: "ROUND_1",
        playerId: "u1",
        choice: "A",
        correct: true,
        pointsEarned: 120,
        answeredAt: "2026-09-18T10:00:04Z",
        timeMs: 2000,
      },
      {
        type: "ROUND_CLOSED",
        gameId: "game-1",
        closedRound: "ROUND_1",
        nextRound: "ROUND_2",
        correctAnswer: "A",
        closedAt: "2026-09-18T10:00:12Z",
        nextRoundAt: "2026-09-18T10:00:14Z",
      },
    ]);

    expect(game.status).toBe("IN_PROGRESS");
    expect(game.player1Score).toBe(120);
    expect(game.player2Score).toBe(0);
    const round = game.rounds["ROUND_1"];
    expect(round.questionId).toBe("q1");
    expect(round.imageUrl).toBe("https://example.com/illustration.png");
    expect(round.difficulty).toBe("MEDIUM");
    expect(round.phase).toBe("CLOSED");
    expect(round.correctAnswer).toBe("A");
    expect(round.playerAnswers["u1"]?.correct).toBe(true);
  });

  it("reste idempotent en cas de rejeu d'une notification", () => {
    const answered: GameNotification = {
      type: "PLAYER_ANSWERED",
      gameId: "game-1",
      round: "ROUND_1",
      playerId: "u1",
      choice: "A",
      correct: true,
      pointsEarned: 120,
      answeredAt: "2026-09-18T10:00:04Z",
      timeMs: 2000,
    };
    const base = fold([created, roundStarted]);
    const appliedOnce = applyGameNotification(base, answered);
    const appliedTwice = applyGameNotification(appliedOnce, answered);

    expect(appliedOnce.player1Score).toBe(120);
    // Le fold lui-même n'accumule pas deux fois si on repasse la même notif : la dédup par
    // séquence est faite par le stream. Ici on vérifie que réappliquer écrit la même réponse.
    expect(appliedTwice.rounds["ROUND_1"]?.playerAnswers["u1"]).toEqual(
      appliedOnce.rounds["ROUND_1"]?.playerAnswers["u1"],
    );
  });

  it("fixe les scores autoritaires à la fin", () => {
    const game = fold([
      created,
      { type: "GAME_ENDED", gameId: "game-1", winnerId: "u2", player1FinalScore: 300, player2FinalScore: 420 },
    ]);

    expect(game.status).toBe("FINISHED");
    expect(game.winnerId).toBe("u2");
    expect(game.player1Score).toBe(300);
    expect(game.player2Score).toBe(420);
  });

  it("préserve l'état sur une notification inconnue (garde défensive)", () => {
    const base = fold([created, roundStarted]);
    const unknown = { type: "UNKNOWN_TYPE" } as unknown as GameNotification;

    expect(applyGameNotification(base, unknown)).toEqual(base);
  });

  it("passe en AWAITING_OPPONENT après un run enregistré (async)", () => {
    const game = fold([
      created,
      { type: "GAME_RUN_RECORDED", gameId: "game-1", playerId: "u1", score: 500 },
    ]);

    expect(game.status).toBe("AWAITING_OPPONENT");
  });
});

function closedRound(overrides: Partial<GameRoundState>): GameRoundState {
  return {
    round: "ROUND_1",
    questionId: "q1",
    questionText: "Question ?",
    imageUrl: null,
    difficulty: null,
    answers: {},
    bonus: false,
    phase: "CLOSED",
    shownAt: null,
    revealAt: null,
    revealedAt: null,
    answerDeadlineAt: null,
    closedAt: null,
    nextRoundAt: null,
    correctAnswer: null,
    playerAnswers: {},
    ...overrides,
  };
}

describe("chrono", () => {
  it("gèle au temps de clôture (pas de saut à 0 quand les deux ont répondu)", () => {
    const round = closedRound({
      revealedAt: "2026-09-18T10:00:00Z",
      answerDeadlineAt: "2026-09-18T10:00:10Z",
      closedAt: "2026-09-18T10:00:04Z",
    });

    expect(frozenTimeLeft(round)).toBe(6);
  });

  it("gèle à 0 en cas d'expiration", () => {
    const round = closedRound({
      answerDeadlineAt: "2026-09-18T10:00:10Z",
      closedAt: "2026-09-18T10:00:12Z",
    });

    expect(frozenTimeLeft(round)).toBe(0);
  });

  it("affiche plein à l'intro, gelé à la révélation, décompté en question", () => {
    const round = closedRound({
      answerDeadlineAt: "2026-09-18T10:00:10Z",
      closedAt: "2026-09-18T10:00:04Z",
    });

    expect(displayTimeLeft("intro", 3, round)).toBe(10);
    expect(displayTimeLeft("reveal", 3, round)).toBe(6);
    expect(displayTimeLeft("question", 7.4, round)).toBe(7.4);
  });
});
