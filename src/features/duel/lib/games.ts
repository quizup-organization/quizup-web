import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { GameNotification, EventEnvelopeResponse } from "@/shared/types/notifications";
import type { ApiError, IdResponse } from "@/shared/types/api";
import type {
  CreateGameInput,
  CurrentGameView,
  GameChoice,
} from "../domain/game-dto";

/** Arène : création d'un duel, réponse, abandon/annulation, historique de notifications. */
export const gamesService = {
  create: (input: CreateGameInput): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.games.create, input),

  /** Partie en attente/en cours du joueur (`null` si aucune — 404 toléré). */
  current: async (): Promise<CurrentGameView | null> => {
    try {
      return await api.get<CurrentGameView>(ENDPOINTS.games.current);
    } catch (error) {
      if ((error as ApiError).statusCode === 404) return null;
      throw error;
    }
  },

  /** Entre dans la salle d'attente de l'arène (idempotent). */
  join: (gameId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.games.join(gameId)),

  /** Quitte la salle d'attente avant le démarrage (annule la partie). */
  leave: (gameId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.games.leave(gameId)),

  /**
   * Réponse à la question courante. Timeout court et pas de toast global : sur connexion
   * faible, l'arène garde la sélection et retente en arrière-plan (feedback transparent).
   */
  answer: (gameId: string, choice: GameChoice): Promise<void> =>
    api.post<void>(
      ENDPOINTS.games.answer(gameId),
      { choice },
      { skipErrorBus: true, timeoutMs: 4_000 },
    ),

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
