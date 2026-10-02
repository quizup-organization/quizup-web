/** Choix de réponse à une question (enum backend `GameQuestionChoice`). */
export type GameChoice = "A" | "B" | "C" | "D";

/** Difficulté d'un bot (enum backend `BotDifficulty`). */
export type BotDifficulty = "EASY" | "NORMAL" | "HARD";

/** Corps de `POST /api/games` (`CreateGameRequest`) — duel contre un bot uniquement. */
export interface CreateGameInput {
  topicId: string;
  difficulty?: BotDifficulty;
}
