import { config } from "./config";

/**
 * Tous les endpoints data passent par le **BFF** (`/api/**`) ; seul l'échange OIDC est
 * adressé directement à l'issuer `quizup-identity`.
 */
export const ENDPOINTS = {
  auth: {
    loginCodes: `${config.oidcAuthority}/api/auth/login-codes`,
    sessions: `${config.oidcAuthority}/api/auth/sessions`,
    currentSession: `${config.oidcAuthority}/api/auth/sessions/current`,
  },
  topics: {
    search: "/api/topics/search",
    categories: "/api/topic-categories",
    detail: (topicId: string) => `/api/topics/${topicId}`,
  },
  topicFollows: {
    search: "/api/topic-follows/search",
    create: "/api/topic-follows",
    detail: (followId: string) => `/api/topic-follows/${followId}`,
    delete: (followId: string) => `/api/topic-follows/${followId}`,
  },
  userFollows: {
    search: "/api/user-follows/search",
    create: "/api/user-follows",
    detail: (followId: string) => `/api/user-follows/${followId}`,
    delete: (followId: string) => `/api/user-follows/${followId}`,
  },
  challenges: {
    search: "/api/challenges/search",
    create: "/api/challenges",
    detail: (challengeId: string) => `/api/challenges/${challengeId}`,
    accept: (challengeId: string) => `/api/challenges/${challengeId}/accept`,
    decline: (challengeId: string) => `/api/challenges/${challengeId}/decline`,
    cancel: (challengeId: string) => `/api/challenges/${challengeId}/cancel`,
    runs: (challengeId: string) => `/api/challenges/${challengeId}/runs`,
  },
  profiles: {
    detail: (userId: string) => `/api/profiles/${userId}`,
    update: (userId: string) => `/api/profiles/${userId}`,
    search: "/api/profiles/search",
    progress: (userId: string) => `/api/profiles/${userId}/progress`,
    topicProgress: (userId: string, topicId: string) =>
      `/api/profiles/${userId}/progress/${topicId}`,
    activity: (userId: string) => `/api/profiles/${userId}/activity`,
    followers: (userId: string) => `/api/profiles/${userId}/followers/search`,
    following: (userId: string) => `/api/profiles/${userId}/following/search`,
  },
  presence: {
    detail: (userId: string) => `/api/presence/${userId}`,
    search: "/api/presence/search",
  },
  leaderboard: {
    topic: (topicId: string, period: string, scope: string, limit = 50) =>
      `/api/topics/${topicId}/leaderboard?period=${period}&scope=${scope}&limit=${limit}`,
    me: (topicId: string, period: string, scope: string) =>
      `/api/topics/${topicId}/leaderboard/me?period=${period}&scope=${scope}`,
  },
  games: {
    create: "/api/games",
    search: "/api/games/search",
    time: "/api/clock",
    notifications: (gameId: string) => `/api/games/${gameId}/notifications`,
    answer: (gameId: string) => `/api/games/${gameId}/answer`,
    cancel: (gameId: string) => `/api/games/${gameId}/cancel`,
    abandon: (gameId: string) => `/api/games/${gameId}/abandon`,
  },
  matchmaking: {
    queue: "/api/matchmaking/queue",
    ticket: (ticketId: string) => `/api/matchmaking/queue/${ticketId}`,
    cancel: (ticketId: string) => `/api/matchmaking/queue/${ticketId}/cancel`,
  },
  lobbies: {
    notifications: (lobbyId: string) => `/api/lobbies/${lobbyId}/notifications`,
  },
} as const;
