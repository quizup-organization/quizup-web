import type { TopicNames } from "@/features/topics/domain/topic"
import type {
  GameHistorySort,
  GameOpponentType,
  GameOutcomeFilter,
} from "./history"
import type { Presence } from "./presence"

/** Sens de lecture d'une liste de personnes (enum backend `FollowDirection`). */
export type PeopleDirection = "following" | "followers"

/** Tri des listes de personnes (enum backend `PeopleSort`). */
export type PeopleSort = "RECENT" | "LEVEL" | "ALPHA"

/** Langue supportée (`Language` SDK, code ISO 639-1). */
export type Language = "fr" | "en"

/** Badge de progression (`ProgressionView.BadgeView`). */
export interface Badge {
  code: string
  label: string
}

/** Progression d'un joueur (`ProgressionView`). */
export interface Progression {
  xpTotal: number
  level: number
  title: string
  xpForNextLevel: number
  levelProgressPercent: number
  badges: Badge[]
}

/** Statistiques de duels d'un joueur (`DuelStatsView`). */
export interface DuelStats {
  played: number
  wins: number
  losses: number
  draws: number
  winPercent: number
  bestScore: number
  currentWinStreak: number
  bestWinStreak: number
}

/** Référence minimale d'un joueur (`UserRefView`) — adversaire, participant. */
export interface UserRef {
  userId: string
  pseudonym: string | null
  avatarOptions: string | null
  suspended?: boolean
}

/** Carte joueur (`PlayerCardView`) — listes Abonnements / Abonnés. */
export interface PlayerCard {
  userId: string
  pseudonym: string | null
  avatarOptions: string | null
  level: number
  title: string | null
  following: boolean
  presence: Presence | null
  suspended?: boolean
}

/** Fiche joueur complète (`PlayerProfileView`). */
export interface PlayerProfile {
  userId: string
  pseudonym: string | null
  bio: string | null
  country: string | null
  avatarOptions: string | null
  bannerUrl: string | null
  isMe: boolean
  following: boolean
  presence: Presence | null
  progression: Progression
  stats: DuelStats
  followersCount: number
  equippedTitle?: string | null
  followingCount: number
  suspended?: boolean
}

export interface PeopleParams {
  q?: string
  sort?: PeopleSort
  page?: number
  size?: number
}

export interface ProfileGamesParams {
  topicId?: string
  opponentId?: string
  /** Type du joueur 2 (`BOT` = entraînement) — `undefined` = tous. */
  opponentType?: GameOpponentType
  /** Issue **relative au joueur consulté** — `undefined`/`ALL` = toutes. */
  outcome?: GameOutcomeFilter
  sort?: GameHistorySort
  page?: number
  size?: number
}

/** Part d'un sujet dans l'activité du joueur (`TopicStatView`) — donut « Sujets joués ». */
export interface TopicStat {
  topicId: string
  names: TopicNames | null
  emoji: string | null
  color: string | null
  imageUrl: string | null
  games: number
  xp: number
  level: number
}
