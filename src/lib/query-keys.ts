import type {
  TopicFacetsParams,
  TopicLeaderboardParams,
  TopicListParams,
} from "@/features/topics/domain/topic";
import type {
  PeopleDirection,
  PeopleParams,
  ProfileGamesParams,
} from "@/features/player/domain/profile";
import type { ActivityParams } from "@/features/player/domain/activity";
import type { ChallengeListParams } from "@/features/challenges/domain/challenge";

/**
 * Fabrique de clés de requête hiérarchiques (cache React Query) — une clé par ressource/vue.
 */
export const queryKeys = {
  me: () => ["me"] as const,
  home: () => ["home"] as const,
  suggestions: (q: string, limit: number) => ["suggestions", q, limit] as const,
  serverTime: () => ["server-time"] as const,
  topics: {
    all: ["topics"] as const,
    list: (params: TopicListParams) => ["topics", "list", params] as const,
    facets: (params: TopicFacetsParams) =>
      ["topics", "facets", params] as const,
    categories: () => ["topics", "categories"] as const,
    overview: (topicId: string) => ["topics", "overview", topicId] as const,
    leaderboard: (topicId: string, params: TopicLeaderboardParams) =>
      ["topics", "leaderboard", topicId, params] as const,
  },
  profiles: {
    all: ["profiles"] as const,
    detail: (userId: string) => ["profiles", "detail", userId] as const,
    people: (
      userId: string,
      direction: PeopleDirection,
      params: PeopleParams,
    ) => ["profiles", "people", userId, direction, params] as const,
    games: (userId: string, params: ProfileGamesParams) =>
      ["profiles", "games", userId, params] as const,
    headToHead: (userId: string, against: string) =>
      ["profiles", "head-to-head", userId, against] as const,
    activity: (userId: string, params: ActivityParams) =>
      ["profiles", "activity", userId, params] as const,
  },
  challenges: {
    all: ["challenges"] as const,
    list: (params: ChallengeListParams) =>
      ["challenges", "list", params] as const,
    detail: (challengeId: string) =>
      ["challenges", "detail", challengeId] as const,
    pendingCount: () => ["challenges", "pending-count"] as const,
  },
  games: {
    notifications: (gameId: string) =>
      ["games", "notifications", gameId] as const,
  },
  presence: {
    detail: (userId: string) => ["presence", "detail", userId] as const,
  },
} as const;
