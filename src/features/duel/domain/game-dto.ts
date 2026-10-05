import type { TopicRef } from "@/features/topics/domain/topic";
import type { UserRef } from "@/features/player/domain/profile";

/** Choix de réponse à une question (enum backend `GameQuestionChoice`). */
export type GameChoice = "A" | "B" | "C" | "D";

/** Difficulté d'un bot (enum backend `BotDifficulty`). */
export type BotDifficulty = "EASY" | "NORMAL" | "HARD";

/** Corps de `POST /api/games` (`CreateGameRequest`) — duel contre un bot uniquement. */
export interface CreateGameInput {
  topicId: string;
  difficulty?: BotDifficulty;
}

export type GamePlayerType = "HUMAN" | "BOT";

export type CurrentGameStatus = "CREATED" | "READY" | "IN_PROGRESS";

/**
 * Partie en attente/en cours du joueur (`CurrentGameView`) — bannière « Rejoindre ».
 * `opponent` vaut `null` pour un duel contre le bot.
 */
export interface CurrentGameView {
  gameId: string;
  topic: TopicRef;
  opponent: UserRef | null;
  opponentType: GamePlayerType;
  status: CurrentGameStatus;
  createdAt: string;
}
