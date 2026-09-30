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
  me: "/api/me",
  suggestions: "/api/suggestions",
  clock: "/api/clock",
  home: "/api/home",
  topics: {
    list: "/api/topics",
    facets: "/api/topics/facets",
    categories: "/api/topic-categories",
    overview: (topicId: string) => `/api/topics/${topicId}/overview`,
    follow: (topicId: string) => `/api/topics/${topicId}/follow`,
    leaderboard: (topicId: string) => `/api/topics/${topicId}/leaderboard`,
  },
  profiles: {
    detail: (userId: string) => `/api/profiles/${userId}`,
    pseudonym: (userId: string) => `/api/profiles/${userId}/pseudonym`,
    bio: (userId: string) => `/api/profiles/${userId}/bio`,
    country: (userId: string) => `/api/profiles/${userId}/country`,
    avatarOptions: (userId: string) => `/api/profiles/${userId}/avatar-options`,
    language: (userId: string) => `/api/profiles/${userId}/language`,
    following: (userId: string) => `/api/profiles/${userId}/following`,
    followers: (userId: string) => `/api/profiles/${userId}/followers`,
    follow: (userId: string) => `/api/profiles/${userId}/follow`,
    games: (userId: string) => `/api/profiles/${userId}/games`,
    headToHead: (userId: string) => `/api/profiles/${userId}/head-to-head`,
    activity: (userId: string) => `/api/profiles/${userId}/activity`,
  },
  presence: {
    detail: (userId: string) => `/api/presence/${userId}`,
  },
  challenges: {
    list: "/api/challenges",
    pendingCount: "/api/challenges/pending-count",
    create: "/api/challenges",
    detail: (challengeId: string) => `/api/challenges/${challengeId}`,
    accept: (challengeId: string) => `/api/challenges/${challengeId}/accept`,
    decline: (challengeId: string) => `/api/challenges/${challengeId}/decline`,
    cancel: (challengeId: string) => `/api/challenges/${challengeId}/cancel`,
    runs: (challengeId: string) => `/api/challenges/${challengeId}/runs`,
  },
  games: {
    create: "/api/games",
    notifications: (gameId: string) => `/api/games/${gameId}/notifications`,
    answer: (gameId: string) => `/api/games/${gameId}/answer`,
    abandon: (gameId: string) => `/api/games/${gameId}/abandon`,
    cancel: (gameId: string) => `/api/games/${gameId}/cancel`,
  },
  matchmaking: {
    tickets: "/api/matchmaking/tickets",
    ticket: (ticketId: string) => `/api/matchmaking/tickets/${ticketId}`,
    cancel: (ticketId: string) => `/api/matchmaking/tickets/${ticketId}/cancel`,
    notifications: (ticketId: string) =>
      `/api/matchmaking/tickets/${ticketId}/notifications`,
  },
} as const;
