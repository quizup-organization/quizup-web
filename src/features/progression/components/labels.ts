import type { TranslationKey } from "@/lib/i18n/types"
import type {
  BadgeFamily,
  BadgeMetric,
  BadgeTier,
  MasteryGrade,
} from "../domain/progression"

/**
 * Clés i18n typées des énumérations de progression : le backend n'expose que les **noms**
 * (`CONFIRME`, `BRONZE`…), la traduction vit ici.
 */
export const GRADE_KEYS: Record<MasteryGrade, TranslationKey> = {
  NOVICE: "progression.grade.NOVICE",
  APPRENTI: "progression.grade.APPRENTI",
  PRATIQUANT: "progression.grade.PRATIQUANT",
  CONFIRME: "progression.grade.CONFIRME",
  EXPERT: "progression.grade.EXPERT",
  MAITRE: "progression.grade.MAITRE",
  LEGENDE: "progression.grade.LEGENDE",
}

export const TIER_KEYS: Record<BadgeTier, TranslationKey> = {
  BRONZE: "progression.tier.BRONZE",
  ARGENT: "progression.tier.ARGENT",
  OR: "progression.tier.OR",
}

export const FAMILY_KEYS: Record<BadgeFamily, TranslationKey> = {
  VOLUME: "progression.family.VOLUME",
  MASTERY: "progression.family.MASTERY",
  EXPLOIT: "progression.family.EXPLOIT",
  EXPLORATION: "progression.family.EXPLORATION",
  COLLECTION: "progression.family.COLLECTION",
}

export const METRIC_KEYS: Record<BadgeMetric, TranslationKey> = {
  HUMAN_DUELS: "progression.metric.HUMAN_DUELS",
  HUMAN_WINS: "progression.metric.HUMAN_WINS",
  TOPIC_MASTERY: "progression.metric.TOPIC_MASTERY",
  DISTINCT_TOPICS: "progression.metric.DISTINCT_TOPICS",
  EARNED_BADGES: "progression.metric.EARNED_BADGES",
  ONE_SHOT: "progression.metric.ONE_SHOT",
}

/** Traductions des codes de badge connus du web. */
const BADGE_KEYS: Record<string, TranslationKey> = {
  FIRST_WIN: "progression.badge.FIRST_WIN",
  LIGHTNING: "progression.badge.LIGHTNING",
  PERFECT: "progression.badge.PERFECT",
  STREAK_MASTER: "progression.badge.STREAK_MASTER",
  DUELIST_BRONZE: "progression.badge.DUELIST_BRONZE",
  DUELIST_ARGENT: "progression.badge.DUELIST_ARGENT",
  DUELIST_OR: "progression.badge.DUELIST_OR",
  WINNER_BRONZE: "progression.badge.WINNER_BRONZE",
  WINNER_ARGENT: "progression.badge.WINNER_ARGENT",
  WINNER_OR: "progression.badge.WINNER_OR",
  MASTER_BRONZE: "progression.badge.MASTER_BRONZE",
  MASTER_ARGENT: "progression.badge.MASTER_ARGENT",
  MASTER_OR: "progression.badge.MASTER_OR",
  COLLECTOR_BRONZE: "progression.badge.COLLECTOR_BRONZE",
  COLLECTOR_ARGENT: "progression.badge.COLLECTOR_ARGENT",
  COLLECTOR_OR: "progression.badge.COLLECTOR_OR",
  EXPLORER_BRONZE: "progression.badge.EXPLORER_BRONZE",
  EXPLORER_ARGENT: "progression.badge.EXPLORER_ARGENT",
  EXPLORER_OR: "progression.badge.EXPLORER_OR",
}

/**
 * Clé de traduction d'un badge, ou `null` si le web ne connaît pas encore le code : l'appelant
 * retombe alors sur le libellé **source** renvoyé par le serveur — un badge ajouté côté backend
 * s'affiche donc sans release du web.
 */
export function badgeLabelKey(code: string): TranslationKey | null {
  return BADGE_KEYS[code] ?? null
}
