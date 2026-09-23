import type { SearchRequest } from "@/shared/types/search";

/**
 * Fabrique de clés de requête hiérarchiques (cache React Query).
 */
export const queryKeys = {
  topics: {
    all: ["topics"] as const,
    search: (params: SearchRequest) => ["topics", "search", params] as const,
    detail: (topicId: string) => ["topics", "detail", topicId] as const,
    categories: () => ["topics", "categories"] as const,
  },
  topicFollows: {
    state: (userId: string, topicId: string) =>
      ["topic-follows", "state", userId, topicId] as const,
    count: (topicId: string) => ["topic-follows", "count", topicId] as const,
    search: (params: SearchRequest) => ["topic-follows", "search", params] as const,
  },
  userFollows: {
    state: (followerId: string, followedId: string) =>
      ["user-follows", "state", followerId, followedId] as const,
    following: (userId: string) => ["user-follows", "following", userId] as const,
    followers: (userId: string) => ["user-follows", "followers", userId] as const,
    counts: (userId: string) => ["user-follows", "counts", userId] as const,
  },
  challenges: {
    all: ["challenges"] as const,
    search: (params: SearchRequest) => ["challenges", "search", params] as const,
  },
  profiles: {
    all: ["profiles"] as const,
    detail: (userId: string) => ["profiles", "detail", userId] as const,
    byIds: (userIds: string[]) =>
      ["profiles", "byIds", [...userIds].sort()] as const,
    progress: (userId: string) => ["profiles", "progress", userId] as const,
    topicProgress: (userId: string, topicId: string) =>
      ["profiles", "progress", userId, topicId] as const,
    search: (params: SearchRequest) => ["profiles", "search", params] as const,
  },
  activity: {
    detail: (userId: string) => ["activity", "detail", userId] as const,
  },
  leaderboard: {
    all: ["leaderboard"] as const,
    topic: (topicId: string, period: string, scope: string) =>
      ["leaderboard", topicId, period, scope] as const,
  },
  presence: {
    detail: (userId: string) => ["presence", "detail", userId] as const,
    batch: (userIds: string[]) => ["presence", "batch", userIds] as const,
  },
  games: {
    search: (params: SearchRequest) => ["games", "search", params] as const,
  },
} as const;
