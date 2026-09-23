import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { PresenceResponse } from "@/shared/types/api";
import type { Presence } from "@/features/player/domain/presence";
import type { PageResponse, SearchRequest } from "@/shared/types/search";

export function toPresence(dto: PresenceResponse): Presence {
  return {
    userId: dto.userId,
    online: dto.status === "ONLINE",
    lastSeenAt: dto.lastSeenAt,
  };
}

export const presenceService = {
  getById: (userId: string): Promise<Presence> =>
    api
      .get<PresenceResponse>(ENDPOINTS.presence.detail(userId))
      .then(toPresence),

  /** Recherche paginée standard (`filters`/`sorts`/`page`), mappée en view-models. */
  search: (request: SearchRequest): Promise<PageResponse<Presence>> =>
    api
      .post<PageResponse<PresenceResponse>>(ENDPOINTS.presence.search, request)
      .then((page) => ({
        ...page,
        content: page.content.map(toPresence),
      })),

  /** Présences de plusieurs joueurs via un filtre `userId IN [...]`. */
  searchByIds: (userIds: string[]): Promise<Presence[]> =>
    presenceService
      .search({
        filters: [{ property: "userId", operator: "IN", values: userIds }],
        page: { number: 0, size: Math.max(userIds.length, 1) },
      })
      .then((page) => page.content),
};
