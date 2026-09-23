import { config } from "./config";

/**
 * Tous les endpoints passent par la gateway (sauf l'échange OIDC, adressé directement
 * à l'issuer `quizup-identity`).
 */
export const ENDPOINTS = {
  auth: {
    loginCodes: `${config.oidcAuthority}/api/auth/login-codes`,
    sessions: `${config.oidcAuthority}/api/auth/sessions`,
    currentSession: `${config.oidcAuthority}/api/auth/sessions/current`,
  },
  topics: {
    search: "/theme-service/api/topics/search",
    categories: "/theme-service/api/topics/categories",
    detail: (topicId: string) => `/theme-service/api/topics/${topicId}`,
  },
  topicFollows: {
    search: "/social-service/api/topic-follows/search",
    create: "/social-service/api/topic-follows",
    detail: (followId: string) =>
      `/social-service/api/topic-follows/${followId}`,
    delete: (followId: string) => `/social-service/api/topic-follows/${followId}`,
  },
  userFollows: {
    search: "/social-service/api/user-follows/search",
    create: "/social-service/api/user-follows",
    detail: (followId: string) =>
      `/social-service/api/user-follows/${followId}`,
    delete: (followId: string) => `/social-service/api/user-follows/${followId}`,
  },
  challenges: {
    search: "/social-service/api/challenges/search",
    create: "/social-service/api/challenges",
    detail: (challengeId: string) =>
      `/social-service/api/challenges/${challengeId}`,
    accept: (challengeId: string) =>
      `/social-service/api/challenges/${challengeId}/accept`,
    decline: (challengeId: string) =>
      `/social-service/api/challenges/${challengeId}/decline`,
    cancel: (challengeId: string) =>
      `/social-service/api/challenges/${challengeId}/cancel`,
    runs: (challengeId: string) =>
      `/social-service/api/challenges/${challengeId}/runs`,
  },
  profiles: {
    detail: (userId: string) => `/profile-service/api/profiles/${userId}`,
    update: (userId: string) => `/profile-service/api/profiles/${userId}`,
    search: "/profile-service/api/profiles/search",
    progress: (userId: string) =>
      `/profile-service/api/profiles/${userId}/progress`,
    topicProgress: (userId: string, topicId: string) =>
      `/profile-service/api/profiles/${userId}/progress/${topicId}`,
    activity: (userId: string) =>
      `/profile-service/api/profiles/${userId}/activity`,
  },
  presence: {
    detail: (userId: string) => `/profile-service/api/presence/${userId}`,
    search: "/profile-service/api/presence/search",
  },
  leaderboard: {
    topic: (topicId: string, period: string, scope: string, limit = 50) =>
      `/leaderboard-service/api/leaderboard/topics/${topicId}?period=${period}&scope=${scope}&limit=${limit}`,
    me: (topicId: string, period: string, scope: string) =>
      `/leaderboard-service/api/leaderboard/topics/${topicId}/me?period=${period}&scope=${scope}`,
  },
  games: {
    create: "/game-service/api/games",
    async: "/game-service/api/games/async",
    search: "/game-service/api/games/search",
    time: "/game-service/api/games/time",
    notifications: (gameId: string) =>
      `/game-service/api/games/${gameId}/notifications`,
    answer: (gameId: string) => `/game-service/api/games/${gameId}/answer`,
    cancel: (gameId: string) => `/game-service/api/games/${gameId}/cancel`,
    abandon: (gameId: string) => `/game-service/api/games/${gameId}/abandon`,
  },
  matchmaking: {
    queue: "/matchmaking-service/api/matchmaking/queue",
    ticket: (ticketId: string) =>
      `/matchmaking-service/api/matchmaking/queue/${ticketId}`,
    cancel: (ticketId: string) =>
      `/matchmaking-service/api/matchmaking/queue/${ticketId}/cancel`,
  },
  lobbies: {
    notifications: (lobbyId: string) =>
      `/matchmaking-service/api/lobbies/${lobbyId}/notifications`,
  },
} as const;
