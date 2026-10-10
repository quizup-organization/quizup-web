import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { GameNotification, EventEnvelopeResponse } from "@/shared/types/notifications";
import type { IdResponse } from "@/shared/types/api";
import type {
  ActiveGameView,
  CreateGameInput,
  GameChoice,
  GameResultView,
} from "../domain/game-dto";

/** Arène : création d'un duel, réponse, abandon/annulation, historique de notifications. */
export const gamesService = {
  create: (input: CreateGameInput): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.games.create, input),

  /**
   * Parties en cours du joueur (reprise) — liste vide si aucune (jamais de 404).
   * Sonde de fond : pas de toast global en cas d'échec réseau/transitoire.
   */
  active: (): Promise<ActiveGameView[]> =>
    api.get<ActiveGameView[]>(ENDPOINTS.games.active, { skipErrorBus: true }),

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

  /** Abandon = forfait : la partie se clôt à l'avantage de l'adversaire (fin de partie). */
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
