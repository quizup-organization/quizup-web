/**
 * Contrat partagé de la progression : collection de badges et titres thématiques.
 * Purement descriptif + règles pures (aucune dépendance React ni infra) — cf.
 * `best-practices/.frontend/folder-structure.md`.
 */

import type { TopicRef } from "@/features/topics/domain/topic"

/** Famille d'un badge (`BadgeFamily` backend). */
export type BadgeFamily =
  | "VOLUME"
  | "VICTORY"
  | "MASTERY"
  | "EXPLOIT"
  | "SERIES"
  | "ASSIDUITY"
  | "SOCIAL"
  | "CHALLENGES"
  | "VISION"
  | "PRECISION"
  | "SPEED"
  | "EXPLORATION"
  | "COLLECTION"

/** Palier d'un badge (`BadgeTier` backend) — le métal donne la rareté à l'affichage. */
export type BadgeTier =
  "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "EMERAUDE" | "DIAMANT"

/** Compteur mesuré par un badge (`BadgeMetric` backend). */
export type BadgeMetric =
  | "HUMAN_DUELS"
  | "HUMAN_WINS"
  | "TOPIC_MASTERY"
  | "DISTINCT_TOPICS"
  | "WIN_STREAK"
  | "PERFECT_DUELS"
  | "FAST_ANSWERS"
  | "DAILY_STREAK"
  | "FOLLOWERS_GAINED"
  | "CHALLENGES_SENT"
  | "IMAGE_CORRECT"
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

/** Ordre d'affichage des familles (du plus « volume » au plus rare) — **une famille = une échelle**. */
export const BADGE_FAMILIES: readonly BadgeFamily[] = [
  "VOLUME",
  "VICTORY",
  "MASTERY",
  "EXPLOIT",
  "SERIES",
  "ASSIDUITY",
  "SOCIAL",
  "CHALLENGES",
  "VISION",
  "PRECISION",
  "SPEED",
  "EXPLORATION",
  "COLLECTION",
]

/** Ordre croissant des paliers. */
export const BADGE_TIERS: readonly BadgeTier[] = [
  "BRONZE",
  "ARGENT",
  "OR",
  "PLATINE",
  "EMERAUDE",
  "DIAMANT",
]

/**
 * Aplat d'un palier de badge : **une teinte franche par palier** (aucun dégradé, aucun doublon de
 * teinte entre deux paliers) plus l'encre de l'icône de famille qui garantit le contraste sur cet
 * aplat.
 */
export interface TierColor {
  /** Aplat du disque : plein quand le palier est acquis, teinté quand il est verrouillé. */
  fill: string
  /** Icône de famille posée sur l'aplat plein (contraste ≥ 3:1). */
  onFill: string
  /** Teinte du palier (disque verrouillé) — **mélange opaque** contre la surface du badge. */
  soft: string
  /**
   * Encre du **mot du palier** posé sur la surface (tuile, fiche, sous-titre de modale) :
   * teinte du palier mélangée au texte de premier plan — assombrie en clair, éclaircie en sombre,
   * donc **lisible AA dans les deux thèmes** (le `fill` brut échoue en clair : Or 2,2:1,
   * Platine 2,3:1, Argent/Diamant ~2,9:1).
   */
  text: string
}

const tierColor = (fill: string, onFill: string): TierColor => ({
  fill,
  onFill,
  // Jamais de semi-transparent : la teinte est mélangée à la surface (`--card`), elle reste pleine.
  soft: `color-mix(in oklab, ${fill} 15%, var(--card))`,
  // 70 % de teinte : le maximum qui garde la couleur reconnaissable tout en passant AA partout
  // (Or 4,5:1 en clair, Platine 4,6:1, Argent 5,5:1, Diamant 5,4:1 — Bronze et Émeraude au-delà).
  text: `color-mix(in oklab, ${fill} 70%, var(--foreground))`,
})

/**
 * Palette des paliers (du plus modeste au plus rare) — une teinte par palier, pour qu'aucun ne se
 * confonde avec son voisin : orange cuivré → acier → or → **cyan glacé** → émeraude → **violet**.
 */
export const TIER_COLORS: Record<BadgeTier, TierColor> = {
  BRONZE: tierColor("#B4723C", "#FFFFFF"),
  ARGENT: tierColor("#8E9AA6", "#1E242B"),
  OR: tierColor("#D8A62B", "#3A2A00"),
  PLATINE: tierColor("#5BB8CE", "#08313C"),
  EMERAUDE: tierColor("#12876F", "#FFFFFF"),
  DIAMANT: tierColor("#9B8CF0", "#1B1140"),
}

/** Ordre croissant des grades de maîtrise. */
/**
 * Seuils d'XP **dans un sujet** par grade de maîtrise (miroir de `MasteryGrade` backend —
 * `Novice 0 · Apprenti 300 · Pratiquant 1 000 · Confirmé 2 500 · Expert 6 000 · Maître 14 000 ·
 * Légende 30 000`). Constante d'affichage, comme les couleurs de catégorie.
 */
export const MASTERY_GRADE_THRESHOLDS: Record<MasteryGrade, number> = {
  NOVICE: 0,
  APPRENTI: 300,
  PRATIQUANT: 1000,
  CONFIRME: 2500,
  EXPERT: 6000,
  MAITRE: 14000,
  LEGENDE: 30000,
}

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

/** État d'un badge dans la collection (filtre client de l'onglet Badges). */
export type BadgeStateFilter = "ALL" | "EARNED" | "TO_UNLOCK"

export const BADGE_STATE_FILTERS: readonly BadgeStateFilter[] = [
  "ALL",
  "EARNED",
  "TO_UNLOCK",
]

/** Garde du filtre d'état : une valeur d'URL inconnue retombe sur « tous ». */
export function isBadgeStateFilter(
  value: string | null
): value is BadgeStateFilter {
  return (
    value !== null && (BADGE_STATE_FILTERS as readonly string[]).includes(value)
  )
}

/** Repli sans accent ni casse (miroir de `@/lib/helpers.normalize`, non importable du domaine). */
function foldLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

export interface BadgeFilterOptions {
  /** Recherche libre sur le libellé affiché (accent/casse ignorés). */
  query: string
  state: BadgeStateFilter
  /** Libellé affiché d'un badge (traduction connue ou repli serveur) — résolu par l'appelant. */
  labelOf: (badge: BadgeItem) => string
}

/**
 * Filtre **client** de la collection (le catalogue complet est déjà chargé) : recherche sur le
 * libellé et état du badge, en conservant l'ordre des familles et des paliers. Les familles sans
 * résultat sont retirées ; sans filtre, la collection est renvoyée telle quelle.
 */
export function filterBadgeFamilies(
  families: BadgeFamilyGroup[],
  options: BadgeFilterOptions
): BadgeFamilyGroup[] {
  const needle = foldLabel(options.query)
  if (!needle && options.state === "ALL") return families

  return families.flatMap((group) => {
    const badges = group.badges.filter((badge) => {
      if (options.state === "EARNED" && !badge.earned) return false
      if (options.state === "TO_UNLOCK" && badge.earned) return false
      return !needle || foldLabel(options.labelOf(badge)).includes(needle)
    })
    return badges.length > 0 ? [{ family: group.family, badges }] : []
  })
}

/** Le nombre de badges d'une collection filtrée (compteur du bandeau de filtres). */
export function countBadges(families: BadgeFamilyGroup[]): number {
  return families.reduce((total, group) => total + group.badges.length, 0)
}

/**
 * Accent d'une carte de **titre** — même code couleur que les badges : le **vert** (`success-600`)
 * marque un grade **atteint** (pastille à coche **blanche** en tête de carte) ; le titre **porté**
 * garde l'accent primaire (état distinct). Mélanges **opaques** (contre `--surface`), sans ombre.
 */
export const TITLE_CARD_ACCENT = {
  equipped: {
    borderColor: "color-mix(in oklab, var(--primary) 40%, transparent)",
  },
  unlocked: {
    borderColor: "color-mix(in oklab, var(--success-600) 40%, transparent)",
    background: "color-mix(in oklab, var(--success-600) 8%, var(--surface))",
  },
  /**
   * Pastille d'état d'un grade **atteint** (tête de carte, fiche sujet) : disque vert portant une
   * **coche blanche**. La teinte `success-600` est assombrie (mélange opaque au noir) pour que
   * l'encre blanche tienne le contraste d'un symbole (≥ 3:1) dans les deux thèmes — même logique
   * de lisibilité que les paliers de badges.
   */
  acquiredCheck: {
    background: "color-mix(in oklab, var(--success-600) 80%, black)",
    color: "#FFFFFF",
  },
} as const
