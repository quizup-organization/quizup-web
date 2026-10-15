import type { topic as frTopic } from "../fr/topic"

export const topic: typeof frTopic = {
  detail: {
    loading: "Loading topic…",
    notFound: "Topic not found",
    backToCatalog: "Back to catalog",
    play: "Start a duel",
    edit: "Edit topic",
    follow: "Follow",
    following: "Following",
    share: "Share",
    progress: "Completed questions",
    stats: {
      level: "Your level",
      followers: "Followers",
      questions: "Questions",
    },
    titles: {
      playFirst: "Play your first game to unlock it",
      tab: "Titles",
      subtitle:
        "Climb this topic's grades to unlock its thematic titles and wear one on your profile.",
      xpRequired: "{{xp}} XP",
      remaining: "{{xp}} XP to go",
      maxGrade: "Top grade reached",
    },
    tabs: {
      leaderboard: "Leaderboard",
      progression: "Games",
    },
    emptyTitle: "No duel on this topic yet",
    emptyDescription:
      "Give it a go: seven rounds are enough to make the leaderboard.",
  },
  leaderboard: {
    title: "Leaderboard",
    periodTitle: "Period",
    period: {
      allTime: "All-time",
      monthly: "Monthly",
    },
    periodCaption: {
      allTime: "all time",
      monthly: "this month",
    },
    monthTitle: "Month",
    monthAria: "Choose a month",
    scopeTitle: "Scope",
    scope: {
      world: "World",
      following: "Following",
      country: "Country",
    },
    filtersTitle: "Leaderboard filters",
    view: "View leaderboard",
    level: "Level {{level}}",
    playerFallback: "Player",
    loading: "Loading…",
    error: "Leaderboard unavailable.",
    empty: "No ranked player yet.",
  },
  matchList: {
    outcomes: {
      win: "Win",
      loss: "Loss",
      draw: "Draw",
      waiting: "Waiting",
      inProgress: "In progress",
      cancelled: "Cancelled",
    },
    bot: "Bot",
    opponent: "Opponent",
    against: "against {{name}}",
    openAria: "View the duel result against {{name}}",
  },
  share: {
    title: "Share this topic",
    sub: "Send the link: your guest creates an account if needed and lands right on the topic.",
    message: "Discover the topic “{{name}}” on QuizUp!",
  },
}
