import type {
  GameNotification,
  RoundQuestionTranslation,
} from "@/shared/types/notifications";
import { ROUND_SECONDS } from "../lib/duel-constants";

export type GameStatus = "CREATED" | "IN_PROGRESS" | "FINISHED" | "CANCELED";

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
  translations: Record<string, RoundQuestionTranslation>;
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
 * Résout le texte et les réponses dans la langue du joueur, avec repli sur la langue source
 * (langue absente du snapshot ou ancienne partie sans traductions).
 */
export function localizedQuestion(
  round: GameRoundState | null | undefined,
  language: string,
): { questionText: string; answers: Record<string, string> } {
  if (!round) {
    return { questionText: "", answers: {} };
  }
  const translation = round.translations[language];
  return {
    questionText: translation?.text ?? round.questionText,
    answers: translation?.answers ?? round.answers,
  };
}

/**
 * État de la revanche d'un duel terminé, foldé depuis le flux de notifications de la partie.
 * Le serveur fait autorité : l'UI ne fait que refléter ces transitions.
 */
export interface RematchState {
  /** Joueur ayant demandé la revanche (`null` si aucune demande en cours). */
  requesterId: string | null;
  /** Joueurs ayant accepté (dédoublonné). */
  acceptedIds: string[];
  declined: boolean;
  cancelledReason: string | null;
  /** Partie de revanche créée (`REMATCH_STARTED`). */
  newGameId: string | null;
}

function emptyRematch(): RematchState {
  return {
    requesterId: null,
    acceptedIds: [],
    declined: false,
    cancelledReason: null,
    newGameId: null,
  };
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
  botDifficulty: string | null;
  /** Images des questions (ordre des rounds), préchargées dès la création de la partie. */
  questionImageUrls: string[];
  /** Instant serveur du premier round (intro VS/swoosh recalée dessus). */
  firstRoundAt: string | null;
  status: GameStatus;
  joinedPlayerIds: string[];
  rounds: Record<string, GameRoundState>;
  player1Score: number;
  player2Score: number;
  winnerId: string | null;
  forfeiterId: string | null;
  canceledReason: string | null;
  rematch: RematchState;
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
    botDifficulty: null,
    questionImageUrls: [],
    firstRoundAt: null,
    status: "CREATED",
    joinedPlayerIds: [],
    rounds: {},
    player1Score: 0,
    player2Score: 0,
    winnerId: null,
    forfeiterId: null,
    canceledReason: null,
    rematch: emptyRematch(),
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
    translations: {},
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
        botDifficulty: notification.botDifficulty,
        questionImageUrls: notification.questionImageUrls ?? [],
        status: "CREATED",
      };

    case "PLAYER_JOINED":
      return {
        ...state,
        joinedPlayerIds: state.joinedPlayerIds.includes(notification.playerId)
          ? state.joinedPlayerIds
          : [...state.joinedPlayerIds, notification.playerId],
      };

    case "PLAYER_LEFT":
      return {
        ...state,
        joinedPlayerIds: state.joinedPlayerIds.filter(
          (id) => id !== notification.playerId,
        ),
      };

    case "GAME_STARTED":
      return {
        ...state,
        status: "IN_PROGRESS",
        firstRoundAt: notification.firstRoundAt,
      };

    case "ROUND_STARTED":
      return withRound(state, notification.round, (round) => ({
        ...round,
        questionId: notification.questionId,
        questionText: notification.questionText,
        imageUrl: notification.imageUrl ?? null,
        difficulty: notification.difficulty ?? null,
        answers: notification.answers,
        translations: notification.translations ?? {},
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

    case "GAME_FORFEITED":
      return { ...state, forfeiterId: notification.forfeiterId };

    case "GAME_ENDED":
      return {
        ...state,
        status: "FINISHED",
        winnerId: notification.winnerId,
        player1Score: notification.player1FinalScore,
        player2Score: notification.player2FinalScore,
        // Le serveur purge la présence à la fin : elle sera reconstruite par les `join`
        // de l'écran de résultat (revanche).
        joinedPlayerIds: [],
      };

    case "GAME_CANCELLED":
      return { ...state, status: "CANCELED", canceledReason: notification.reason };

    case "REMATCH_REQUESTED":
      return {
        ...state,
        rematch: {
          requesterId: notification.requesterId,
          acceptedIds: [],
          declined: false,
          cancelledReason: null,
          newGameId: null,
        },
      };

    case "REMATCH_ACCEPTED":
      return {
        ...state,
        rematch: {
          ...state.rematch,
          acceptedIds: state.rematch.acceptedIds.includes(notification.playerId)
            ? state.rematch.acceptedIds
            : [...state.rematch.acceptedIds, notification.playerId],
        },
      };

    case "REMATCH_DECLINED":
      return {
        ...state,
        rematch: { ...state.rematch, declined: true },
      };

    case "REMATCH_CANCELLED":
      return {
        ...state,
        rematch: {
          ...state.rematch,
          cancelledReason: notification.reason,
          requesterId: null,
          acceptedIds: [],
        },
      };

    case "REMATCH_STARTED":
      return {
        ...state,
        rematch: { ...state.rematch, newGameId: notification.newGameId },
      };

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

/**
 * Deadline de réponse d'un round (ms epoch) : l'échéance autoritaire `answerDeadlineAt` si le
 * serveur l'a poussée, sinon une projection `revealAt + ROUND_SECONDS` — le serveur arme le
 * chrono à `revealAt` (`GameAggregate`). Permet au décompte de démarrer à l'heure même quand la
 * trame `QUESTION_REVEALED` est en retard sur une connexion faible.
 */
export function answerDeadlineMs(
  round: GameRoundState | null | undefined,
): number | null {
  if (!round) return null;
  if (round.answerDeadlineAt) {
    const parsed = Date.parse(round.answerDeadlineAt);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (round.revealAt) {
    const revealAt = Date.parse(round.revealAt);
    if (Number.isFinite(revealAt)) return revealAt + ROUND_SECONDS * 1000;
  }
  return null;
}

/**
 * Une transition attendue par l'horloge serveur n'est pas arrivée (trame STOMP perdue ou
 * retardée) : le client doit rejouer l'historique REST au lieu d'attendre le reconnect.
 */
export function roundTransitionOverdue(
  round: GameRoundState | null | undefined,
  now: number,
  graceMs: number,
): boolean {
  if (!round) return false;
  if (round.phase === "QUESTION_SHOWN") {
    const revealAt = round.revealAt ? Date.parse(round.revealAt) : NaN;
    return Number.isFinite(revealAt) && now > revealAt + graceMs;
  }
  if (round.phase === "ANSWERABLE") {
    const deadline = answerDeadlineMs(round);
    return deadline != null && now > deadline + graceMs;
  }
  if (round.phase === "CLOSED") {
    const nextRoundAt = round.nextRoundAt ? Date.parse(round.nextRoundAt) : NaN;
    return Number.isFinite(nextRoundAt) && now > nextRoundAt + graceMs;
  }
  return false;
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
