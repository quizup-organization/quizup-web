import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { BotDifficulty, ServerTimeResponse } from "@/shared/types/api";
import type { Game, GameChoice } from "@/features/duel/domain/game-dto";
import type {
  GameNotification,
  NotificationEnvelope,
} from "@/shared/types/notifications";
import type { IdResponse, PageResponse, SearchRequest } from "@/shared/types/search";

export const gamesService = {
  search: (body: SearchRequest): Promise<PageResponse<Game>> =>
    api.post<PageResponse<Game>>(ENDPOINTS.games.search, body),

  /** Historique des notifications (même contrat que le push WebSocket). */
  getNotifications: (
    gameId: string,
  ): Promise<NotificationEnvelope<GameNotification>[]> =>
    api.get<NotificationEnvelope<GameNotification>[]>(
      ENDPOINTS.games.notifications(gameId),
    ),

  createBotGame: (body: {
    topicId: string;
    playerId: string;
    playerName: string;
    difficulty: BotDifficulty;
  }): Promise<IdResponse> => api.post<IdResponse>(ENDPOINTS.games.create, body),

  createAsyncGame: (body: {
    topicId: string;
    playerId: string;
    playerName: string;
    opponentId?: string;
    opponentName?: string;
    ghostGameId?: string;
  }): Promise<IdResponse> => api.post<IdResponse>(ENDPOINTS.games.async, body),

  answer: (
    gameId: string,
    playerId: string,
    choice: GameChoice,
  ): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.games.answer(gameId), { playerId, choice }),

  /** Annulation : transition d'état sur l'agrégat → `POST /{id}/cancel` (pas un DELETE). */
  cancel: (gameId: string): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.games.cancel(gameId)),

  abandon: (gameId: string): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.games.abandon(gameId)),

  serverTime: (): Promise<ServerTimeResponse> =>
    api.get<ServerTimeResponse>(ENDPOINTS.games.time),
};
