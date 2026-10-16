import i18n from "@/lib/i18n"
import type { ApiErrorEvent } from "@/lib/error-bus"

const ROOM_NOT_FOUND = "urn:quizup:room:notFound"
const CHALLENGE_NOT_PENDING = "urn:quizup:challenge:notPending"
const ROOM_WIZZ_COOLDOWN = "urn:quizup:room:wizzCooldown"
const ROOM_WIZZ_UNAVAILABLE = "urn:quizup:room:wizzUnavailable"

/**
 * Traduit une erreur API en message de toast. Quelques problèmes métier ont un message dédié
 * (salle expirée/purgée, défi plus actionnable) ; les autres gardent le message/détail du backend.
 */
export function apiErrorToast(error: ApiErrorEvent): {
  title: string
  description?: string
} {
  if (error.type === ROOM_NOT_FOUND) {
    return {
      title: i18n.t("shared.apiErrors.challengeUnavailable"),
      description: i18n.t("shared.apiErrors.roomGone"),
    }
  }

  if (error.type === CHALLENGE_NOT_PENDING) {
    return {
      title: i18n.t("shared.apiErrors.challengeUnavailable"),
      description: i18n.t("shared.apiErrors.challengeResolved"),
    }
  }

  if (error.type === ROOM_WIZZ_COOLDOWN) {
    return {
      title: i18n.t("shared.apiErrors.wizzCooldownTitle"),
      description: i18n.t("shared.apiErrors.wizzCooldown"),
    }
  }

  if (error.type === ROOM_WIZZ_UNAVAILABLE) {
    return {
      title: i18n.t("shared.apiErrors.wizzUnavailableTitle"),
      description: i18n.t("shared.apiErrors.wizzUnavailable"),
    }
  }

  return { title: error.message, description: error.detail }
}
