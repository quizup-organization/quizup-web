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
    subtitle: "Two steps to start your first game.",
    stepperLabel: "Onboarding progress",
    steps: {
      interests: "Interests",
      ready: "Ready to play",
    },
    interestsTitle: "What are your interests?",
    interestsSubtitle:
      "Choose up to 3 categories. A topic will be picked at random from these categories for your first duel.",
    selectedCategories: "{{count}} / 3 categories",
    continue: "Continue",
    clear: "Clear selection",
    skip: "Skip",
    readyTitle: "How you progress",
    eloTitle: "Elo",
    eloDescription:
      "Your global skill. It goes up or down after every duel against a human.",
    xpTitle: "XP and mastery",
    xpDescription:
      "Your progress per topic: titles, badges and topic leaderboards.",
    botNote:
      "Training against a bot gives no XP or streak. You can disable it in Settings → Gameplay.",
    randomTopic:
      "Your first topic will be picked at random from your interests.",
    loadingTopics: "Preparing topics…",
    start: "Start my first duel",
    explore: "Explore home",
    joinRoom: "Join the room",
    loadError: "Could not load your profile. Please try again.",
    retry: "Try again",
    saveError: "Could not save your onboarding. Please try again.",
    categoriesError: "Could not load categories.",
    noCategories: "No category available right now.",
    noTopics: "No topic available right now.",
    topicCount_one: "{{count}} topic",
    topicCount_other: "{{count}} topics",
  },
}
