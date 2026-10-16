import type { player as frPlayer } from "../fr/player"

export const player: typeof frPlayer = {
  profile: {
    emptyTitle: "No game yet",
    emptyDescription: "This player hasn't played a duel yet.",
    loading: "Loading player…",
    notFound: "Player not found",
    backToSocial: "Back to social",
    fallbackName: "Player",
    meta: "{{title}} · Level {{level}}",
    level: "Level {{level}}",
    challenge: "Challenge",
    challengeTitle: "Challenge {{name}}",
    challengeSub: "Pick a topic: they'll receive an invitation.",
    follow: "Follow",
    following: "Following",
    followAria: "Follow",
    unfollowAria: "Unfollow",
    stats: {
      played: "Games",
      followers: "Followers",
      following: "Following",
    },
    versusTitle: "Your duels against {{name}}",
  },
  banner: {
    editAvatar: "Edit avatar",
  },
  share: {
    title: "Share my profile",
    sub: "Send the link: your guest creates an account if needed and discovers your profile.",
    message: "Join me on QuizUp and discover my profile “{{name}}”!",
  },
}
