import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { UserFollower } from "@/features/player/domain/follow";
import type {
  IdResponse,
  PageCriteria,
  PageResponse,
  SearchRequest,
} from "@/shared/types/search";

/**
 * Lecture d'un suivi par id déterministe (`GET /{followId}`). Abonnements / abonnés / compteurs
 * passent par `POST /search` (filtres `followerId` / `followedId`), calcul côté client.
 */
export const userFollowsService = {
  search: (body: SearchRequest): Promise<PageResponse<UserFollower>> =>
    api.post<PageResponse<UserFollower>>(ENDPOINTS.userFollows.search, body),

  getById: (followId: string): Promise<UserFollower> =>
    api.get<UserFollower>(ENDPOINTS.userFollows.detail(followId)),

  follow: (followedId: string): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.userFollows.create, { followedId }),

  unfollow: (followId: string): Promise<void> =>
    api.delete<void>(ENDPOINTS.userFollows.delete(followId)),

  /** Joueurs suivis par `followerId` (mes abonnements). */
  searchFollowing: (
    followerId: string,
    page: PageCriteria = { number: 0, size: 50 },
  ): Promise<PageResponse<UserFollower>> =>
    api.post<PageResponse<UserFollower>>(ENDPOINTS.userFollows.search, {
      filters: [
        { property: "followerId", operator: "EQUALS", value: followerId },
      ],
      sorts: [{ property: "followedAt", direction: "DESC" }],
      page,
    }),

  /** Joueurs qui suivent `followedId` (ses abonnés). */
  searchFollowers: (
    followedId: string,
    page: PageCriteria = { number: 0, size: 50 },
  ): Promise<PageResponse<UserFollower>> =>
    api.post<PageResponse<UserFollower>>(ENDPOINTS.userFollows.search, {
      filters: [
        { property: "followedId", operator: "EQUALS", value: followedId },
      ],
      sorts: [{ property: "followedAt", direction: "DESC" }],
      page,
    }),
};
