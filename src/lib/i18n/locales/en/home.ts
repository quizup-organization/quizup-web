import type { home as frHome } from "../fr/home";

export const home: typeof frHome = {
  seeAll: "See all",
  sectionHeader: {
    seeAll: "See all",
  },
  followedTopics: {
    title: "Topics you follow",
  },
  newTopics: {
    title: "New topics",
    empty: "No topic published yet.",
  },
  trending: {
    title: "Most played right now",
    browse: "Browse the catalog",
    error: "Could not load home.",
    retry: "Try again",
  },
  pendingDuels: {
    sectionTitle: "Your pending challenges",
    roomsSectionTitle: "Your pending rooms",
    somePlayer: "a player",
    playerFallback: "Player",
    received: "Challenge received from {{name}}",
    sent: "Challenge sent to {{name}}",
    room: "Room open · {{name}}",
    roomWaiting: "Room open · waiting",
    rematch: "Rematch",
    viewProfile: "View {{name}}'s profile",
    expiresIn: "Expires in",
    challengeExpiresIn: "Challenge expires in",
    expired: "Expired",
    decline: "Decline",
    accept: "Accept",
    openRoom: "Open room",
    cancel: "Cancel",
    goneTitle: "This challenge is no longer available",
    goneDescription: "It was cancelled or already resolved.",
  },
  resumeBanner: {
    title: "Game in progress",
    opponent: "against {{name}}",
    bot: "against the bot",
    join: "Join",
  },
};
