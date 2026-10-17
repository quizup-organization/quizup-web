import type {
  BadgeFamily,
  BadgeMetric,
  BadgeTier,
  MasteryGrade,
} from "./progression"

/** Type de déblocage célébré (`AchievementView.Kind` du BFF). */
export type AchievementKind = "BADGE" | "LEVEL" | "TITLE"

/**
 * Déblocage poussé en direct par le BFF (`/topic/achievements/{userId}`) : badge gagné, niveau
 * de compte franchi ou titre thématique débloqué. **Éphémère** (aucune persistance) : le client
 * en fait une file de célébrations, reportée tant qu'un écran immersif est affiché.
 */
export interface Achievement {
  kind: AchievementKind
  /** Badge : code du catalogue, libellé, famille et palier. */
  code?: string | null
  label?: string | null
  family?: BadgeFamily | null
  tier?: BadgeTier | null
  /** Badge : métrique et cible de l'objectif qui a permis l'acquisition. */
  metric?: BadgeMetric | null
  target?: number | null
  /** Niveau de compte franchi (titre de compte associé). */
  level?: number | null
  accountTitle?: string | null
  /** Titre thématique : sujet et grade franchi. */
  topicId?: string | null
  grade?: MasteryGrade | null
  at: string
}

/** Clé d'unicité d'un déblocage (dédoublonnage : rediffusion à la reconnexion STOMP). */
export function achievementKey(achievement: Achievement): string {
  return [
    achievement.kind,
    achievement.code ?? "",
    achievement.level ?? "",
    achievement.topicId ?? "",
    achievement.grade ?? "",
  ].join(":")
}
