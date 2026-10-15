/**
 * Contrat partagé de la progression : collection de badges et titres thématiques.
 * Purement descriptif + règles pures (aucune dépendance React ni infra) — cf.
 * `best-practices/.frontend/folder-structure.md`.
 */

import type { TopicRef } from "@/features/topics/domain/topic"

/** Famille d'un badge (`BadgeFamily` backend). */
export type BadgeFamily =
  | "VOLUME"
  | "MASTERY"
  | "EXPLOIT"
  | "SERIES"
  | "PRECISION"
  | "SPEED"
  | "EXPLORATION"
  | "COLLECTION"

/** Palier d'un badge (`BadgeTier` backend). */
export type BadgeTier = "BRONZE" | "ARGENT" | "OR"

/** Compteur mesuré par un badge (`BadgeMetric` backend). */
export type BadgeMetric =
  | "HUMAN_DUELS"
  | "HUMAN_WINS"
  | "TOPIC_MASTERY"
  | "DISTINCT_TOPICS"
  | "WIN_STREAK"
  | "PERFECT_DUELS"
  | "FAST_ANSWERS"
  | "EARNED_BADGES"
  | "ONE_SHOT"

/** Grade de maîtrise d'un sujet (`MasteryGrade` backend). */
export type MasteryGrade =
  | "NOVICE"
  | "APPRENTI"
  | "PRATIQUANT"
  | "CONFIRME"
  | "EXPERT"
  | "MAITRE"
  | "LEGENDE"

/** Un palier de badge (`BadgeCollectionView.BadgeItemView`). */
export interface BadgeItem {
  code: string
  /** Libellé source du catalogue (français) — repli si le client n'a pas la traduction. */
  label: string
  tier: BadgeTier
  metric: BadgeMetric
  target: number
  earned: boolean
  /** Compteur courant, plafonné à `target`. */
  progress: number
}

export interface BadgeFamilyGroup {
  family: BadgeFamily
  badges: BadgeItem[]
}

/** Collection complète (`BadgeCollectionView`). */
export interface BadgeCollection {
  earnedCount: number
  totalCount: number
  families: BadgeFamilyGroup[]
}

/** Titre débloqué (`TitlesView.TitleView`). */
export interface UnlockedTitle {
  /** Clé stable `topicId:GRADE` — celle attendue par `PUT /api/profiles/{id}/title`. */
  key: string
  topicId: string
  grade: MasteryGrade
  gradeProgressPercent: number
  gradeRemainingXp: number
  nextGrade: MasteryGrade | null
  topic: TopicRef
}

/** Titres d'un joueur (`TitlesView`). */
export interface PlayerTitles {
  equippedKey: string | null
  titles: UnlockedTitle[]
}

/** Ordre d'affichage des familles (du plus « volume » au plus rare). */
export const BADGE_FAMILIES: readonly BadgeFamily[] = [
  "VOLUME",
  "MASTERY",
  "EXPLOIT",
  "SERIES",
  "PRECISION",
  "SPEED",
  "EXPLORATION",
  "COLLECTION",
]

/** Ordre croissant des paliers. */
export const BADGE_TIERS: readonly BadgeTier[] = ["BRONZE", "ARGENT", "OR"]

/** Ordre croissant des grades de maîtrise. */
export const MASTERY_GRADES: readonly MasteryGrade[] = [
  "NOVICE",
  "APPRENTI",
  "PRATIQUANT",
  "CONFIRME",
  "EXPERT",
  "MAITRE",
  "LEGENDE",
]

/** Progression d'un badge en pourcentage (0–100) — barre des paliers verrouillés. */
export function badgeProgressPercent(badge: BadgeItem): number {
  if (badge.target <= 0) return 0
  const ratio = (badge.progress / badge.target) * 100
  return Math.max(0, Math.min(100, Math.round(ratio)))
}

/** Le titre porté, résolu dans la liste des titres débloqués (`null` si aucun ou introuvable). */
export function equippedTitle(
  titles: PlayerTitles | undefined | null
): UnlockedTitle | null {
  if (!titles?.equippedKey) return null
  return titles.titles.find((title) => title.key === titles.equippedKey) ?? null
}

/**
 * Libellé d'un titre : grade + nom du sujet (« Confirmé · Histoire »), ou le grade seul si le
 * nom n'est pas résolu. Le serveur ne compose jamais ce libellé.
 */
export function titleLabel(
  gradeLabel: string,
  topicName: string | null | undefined
): string {
  const name = topicName?.trim()
  return name ? `${gradeLabel} · ${name}` : gradeLabel
}

/**
 * Titre **thématique** porté par le sujet pour ce grade (ex. « Historien confirmé »), dans la
 * langue du lecteur, avec repli FR. `null` si le sujet n'en définit pas (l'appelant retombe alors
 * sur {@link titleLabel}).
 */
export function topicTitleFor(
  titles: Record<string, Record<string, string>> | null | undefined,
  grade: MasteryGrade,
  language: string
): string | null {
  return titles?.[language]?.[grade] ?? titles?.fr?.[grade] ?? null
}

/** Les badges acquis d'une collection, toutes familles confondues. */
export function earnedBadges(collection: BadgeCollection): BadgeItem[] {
  return collection.families.flatMap((group) =>
    group.badges.filter((badge) => badge.earned)
  )
}
