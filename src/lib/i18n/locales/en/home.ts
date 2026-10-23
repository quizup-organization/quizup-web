import type { home as frHome } from "../fr/home"

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
    title: "Top 10 right now",
    browse: "Browse the catalog",
    browseCompact: "Catalog",
    error: "Could not load home.",
    retry: "Try again",
  },
  resumeBanner: {
    title: "Game in progress",
    opponent: "against {{name}}",
    bot: "against the bot",
    join: "Join",
  },
  onboarding: {
    title: "Welcome to QuizUp",
    step: "Step {{current}} of {{total}}",
    topicsTitle: "Choose 3 topics to get started",
    topicsSubtitle:
      "You can follow more later. Your answers and progress stay tied to each topic.",
    searchPlaceholder: "Search a topic",
    selected: "{{count}} / 3 selected",
    continue: "Continue",
    clear: "Clear selection",
    skip: "Skip",
    progressionTitle: "How you progress",
    eloTitle: "Elo",
    eloDescription:
      "Your global rating. It goes up or down after every duel against a human.",
    xpTitle: "XP and mastery",
    xpDescription:
      "Your progress per topic: titles, badges and topic leaderboards.",
    botNote:
      "Training against a bot gives no XP or streak. You can disable it in Settings → Gameplay.",
    start: "Start my first duel",
    explore: "Explore home",
    joinRoom: "Join the room",
    loadError: "Could not load your profile. Please try again.",
    retry: "Try again",
    saveError: "Could not save your onboarding. Please try again.",
    noTopics: "No topic available right now.",
  },
}
