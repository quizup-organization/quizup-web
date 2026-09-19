import type { GameNotification } from "@/shared/types/notifications";
import { ROUND_SECONDS } from "../lib/duel-constants";

export type GameStatus =
  | "CREATED"
  | "IN_PROGRESS"
  | "AWAITING_OPPONENT"
  | "FINISHED"
  | "CANCELED";

export type GameRoundPhase = "QUESTION_SHOWN" | "ANSWERABLE" | "CLOSED";

export interface PlayerAnswer {
  choice: string;
  correct: boolean;
  points: number;
  timeMs: number;
}

export interface GameRoundState {
  round: string;
  questionId: string | null;
  questionText: string;
  imageUrl: string | null;
  difficulty: string | null;
  answers: Record<string, string>;
  bonus: boolean;
  phase: GameRoundPhase;
  shownAt: string | null;
  revealAt: string | null;
  revealedAt: string | null;
  answerDeadlineAt: string | null;
  closedAt: string | null;
  nextRoundAt: string | null;
  correctAnswer: string | null;
  playerAnswers: Record<string, PlayerAnswer>;
}

/**
 * Read model client d'une partie — reconstruit exclusivement par fold des notifications
 * (historique REST + push WebSocket). Les scores sont recalculés depuis les réponses
 * (chaque notification n'est appliquée qu'une fois, grâce à `sequenceNumber`).
 */
export interface GameState {
  gameId: string;
  topicId: string | null;
  player1Id: string | null;
  player1Name: string | null;
  player2Id: string | null;
  player2Name: string | null;
  player2Type: string | null;
  mode: string | null;
  botDifficulty: string | null;
  status: GameStatus;
  joinedPlayerIds: string[];
  rounds: Record<string, GameRoundState>;
  player1Score: number;
  player2Score: number;
  winnerId: string | null;
  canceledReason: string | null;
}

export function emptyGame(gameId: string): GameState {
  return {
    gameId,
    topicId: null,
    player1Id: null,
    player1Name: null,
    player2Id: null,
    player2Name: null,
    player2Type: null,
    mode: null,
    botDifficulty: null,
    status: "CREATED",
    joinedPlayerIds: [],
    rounds: {},
    player1Score: 0,
    player2Score: 0,
    winnerId: null,
    canceledReason: null,
  };
}

function emptyRound(round: string): GameRoundState {
  return {
    round,
    questionId: null,
    questionText: "",
    imageUrl: null,
    difficulty: null,
    answers: {},
    bonus: false,
    phase: "QUESTION_SHOWN",
    shownAt: null,
    revealAt: null,
    revealedAt: null,
    answerDeadlineAt: null,
    closedAt: null,
    nextRoundAt: null,
    correctAnswer: null,
    playerAnswers: {},
  };
}

function withRound(
  state: GameState,
  round: string,
  update: (current: GameRoundState) => GameRoundState,
): GameState {
  const current = state.rounds[round] ?? emptyRound(round);
  return {
    ...state,
    rounds: { ...state.rounds, [round]: update(current) },
  };
}

/** Fold idempotent : la déduplication par séquence est assurée en amont par le stream. */
export function applyGameNotification(
  state: GameState,
  notification: GameNotification,
): GameState {
  switch (notification.type) {
    case "GAME_CREATED":
      return {
        ...state,
        topicId: notification.topicId,
        player1Id: notification.player1Id,
        player1Name: notification.player1Name,
        player2Id: notification.player2Id,
        player2Name: notification.player2Name,
        player2Type: notification.player2Type,
        mode: notification.mode,
        botDifficulty: notification.botDifficulty,
        status: "CREATED",
      };

    case "PLAYER_JOINED":
      return {
        ...state,
        joinedPlayerIds: state.joinedPlayerIds.includes(notification.playerId)
          ? state.joinedPlayerIds
          : [...state.joinedPlayerIds, notification.playerId],
      };

    case "GAME_STARTED":
      return { ...state, status: "IN_PROGRESS", mode: notification.mode };

    case "ROUND_STARTED":
      return withRound(state, notification.round, (round) => ({
        ...round,
        questionId: notification.questionId,
        questionText: notification.questionText,
        imageUrl: notification.imageUrl ?? null,
        difficulty: notification.difficulty ?? null,
        answers: notification.answers,
        bonus: notification.bonus,
        phase: "QUESTION_SHOWN",
        shownAt: notification.shownAt,
        revealAt: notification.revealAt,
      }));

    case "QUESTION_REVEALED":
      return withRound(state, notification.round, (round) => ({
        ...round,
        phase: "ANSWERABLE",
        revealedAt: notification.revealedAt,
        answerDeadlineAt: notification.answerDeadlineAt,
      }));

    case "PLAYER_ANSWERED": {
      const isPlayer1 = notification.playerId === state.player1Id;
      return {
        ...withRound(state, notification.round, (round) => ({
          ...round,
          playerAnswers: {
            ...round.playerAnswers,
            [notification.playerId]: {
              choice: notification.choice,
              correct: notification.correct,
              points: notification.pointsEarned,
              timeMs: notification.timeMs,
            },
          },
        })),
        player1Score: isPlayer1
          ? state.player1Score + notification.pointsEarned
          : state.player1Score,
        player2Score: isPlayer1
          ? state.player2Score
          : state.player2Score + notification.pointsEarned,
      };
    }

    case "ROUND_CLOSED":
      return withRound(state, notification.closedRound, (round) => ({
        ...round,
        phase: "CLOSED",
        correctAnswer: notification.correctAnswer,
        closedAt: notification.closedAt,
        nextRoundAt: notification.nextRoundAt,
      }));

    case "GAME_ENDED":
      return {
        ...state,
        status: "FINISHED",
        winnerId: notification.winnerId,
        player1Score: notification.player1FinalScore,
        player2Score: notification.player2FinalScore,
      };

    case "GAME_CANCELLED":
      return { ...state, status: "CANCELED", canceledReason: notification.reason };

    case "GAME_RUN_RECORDED":
      return { ...state, status: "AWAITING_OPPONENT" };

    default: {
      // Exhaustivité : ajouter un type non géré casse la compilation.
      const unreachable: never = notification;
      void unreachable;
      return state;
    }
  }
}

/**
 * Chrono gelé d'un round clos : temps restant réel au moment de la clôture (0 si expiré).
 * Dérivé du serveur (`answerDeadlineAt` − `closedAt`) — pas du dernier tick client.
 */
export function frozenTimeLeft(round: GameRoundState | null): number {
  if (!round?.answerDeadlineAt || !round?.closedAt) return 0;
  const deadline = Date.parse(round.answerDeadlineAt);
  const closed = Date.parse(round.closedAt);
  if (!Number.isFinite(deadline) || !Number.isFinite(closed)) return 0;
  return Math.min(ROUND_SECONDS, Math.max(0, (deadline - closed) / 1000));
}

export type ArenaTimePhase = "intro" | "question" | "reveal";

/**
 * Valeur affichée par le chrono (barre + numéro partagent la même source) :
 * - `reveal` : **gelée** au temps de clôture du round (plus de saut à 0) ;
 * - `intro` (initiale ou par round) : pleine (`ROUND_SECONDS`), reset simultané ;
 * - `question` : `timeLeft` (plein tant que la saisie n'est pas ouverte, puis décompte).
 */
export function displayTimeLeft(
  phase: ArenaTimePhase,
  timeLeft: number,
  round: GameRoundState | null,
): number {
  if (phase === "reveal") return frozenTimeLeft(round);
  if (phase === "intro") return ROUND_SECONDS;
  return timeLeft;
}
