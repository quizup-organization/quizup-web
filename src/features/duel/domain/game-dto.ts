/** Choix de réponse à une question (enum backend `GameQuestionChoice`). */
export type GameChoice = "A" | "B" | "C" | "D";

/** Mode d'une partie (enum backend `GameMode`). */
export type GameMode = "SYNC" | "ASYNC";

/** Mode demandé à la création (`CreateGameRequest.Mode`). */
export type GameCreationMode = "BOT" | "ASYNC";

/** Difficulté d'un bot (enum backend `BotDifficulty`). */
export type BotDifficulty = "EASY" | "NORMAL" | "HARD";

/** Corps de `POST /api/games` (`CreateGameRequest`). */
export interface CreateGameInput {
  topicId: string;
  mode: GameCreationMode;
  difficulty?: BotDifficulty;
  opponentId?: string;
  ghostGameId?: string;
}
