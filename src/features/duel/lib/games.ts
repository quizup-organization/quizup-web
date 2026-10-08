import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { GameNotification, EventEnvelopeResponse } from "@/shared/types/notifications";
import type { IdResponse } from "@/shared/types/api";
import type {
  CreateGameInput,
  CurrentGameView,
  GameChoice,
  GameResultView,
} from "../domain/game-dto";

/** Arène : création d'un duel, réponse, abandon/annulation, historique de notifications. */
export const gamesService = {
  create: (input: CreateGameInput): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.games.create, input),

  /**
   * Partie en attente/en cours du joueur (`null` si aucune — 204 sans corps).
   * Sonde de fond : pas de toast global en cas d'échec réseau/transitoire.
   */
  current: async (): Promise<CurrentGameView | null> => {
    const view = await api.get<CurrentGameView | undefined>(
      ENDPOINTS.games.current,
      { skipErrorBus: true },
    );
    return view ?? null;
  },

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

  /** Bilan autoritaire d'un duel terminé (récompense + progression). */
  result: (gameId: string): Promise<GameResultView> =>
    api.get<GameResultView>(ENDPOINTS.games.result(gameId)),

  /** Historique des notifications (même contrat que le push WebSocket). */
  getNotifications: (
    gameId: string,
  ): Promise<EventEnvelopeResponse<GameNotification>[]> =>
    api.get<EventEnvelopeResponse<GameNotification>[]>(
      ENDPOINTS.games.notifications(gameId),
    ),
};
