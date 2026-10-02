import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { GameNotification, EventEnvelopeResponse } from "@/shared/types/notifications";
import type { IdResponse } from "@/shared/types/api";
import type { CreateGameInput, GameChoice } from "../domain/game-dto";

/** Arène : création d'un duel, réponse, abandon/annulation, historique de notifications. */
export const gamesService = {
  create: (input: CreateGameInput): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.games.create, input),

  /** Entre dans la salle d'attente de l'arène (idempotent). */
  join: (gameId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.games.join(gameId)),

  /** Quitte la salle d'attente avant le démarrage (annule la partie). */
  leave: (gameId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.games.leave(gameId)),

  answer: (gameId: string, choice: GameChoice): Promise<void> =>
    api.post<void>(ENDPOINTS.games.answer(gameId), { choice }),

  /** Abandon toujours valide : le BFF route `cancel` si la partie n'a pas démarré. */
  abandon: (gameId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.games.abandon(gameId)),

  cancel: (gameId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.games.cancel(gameId)),

  /** Historique des notifications (même contrat que le push WebSocket). */
  getNotifications: (
    gameId: string,
  ): Promise<EventEnvelopeResponse<GameNotification>[]> =>
    api.get<EventEnvelopeResponse<GameNotification>[]>(
      ENDPOINTS.games.notifications(gameId),
    ),
};
