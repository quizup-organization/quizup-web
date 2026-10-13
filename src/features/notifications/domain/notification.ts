import type { TFunction } from "i18next"
import type { NotificationView } from "@/shared/types/notifications"

export type { NotificationView } from "@/shared/types/notifications"
export type { NotificationCategory } from "@/shared/types/notifications"
export type { NotificationPreferenceView } from "@/shared/types/notifications"

/**
 * Une invitation de défi encore actionnable : défi nominatif reçu (`CHALLENGE_RECEIVED`) avec
 * une source connue.
 */
export function isChallengeInvitation(notification: NotificationView): boolean {
  return (
    notification.type === "CHALLENGE_RECEIVED" && notification.sourceId !== null
  )
}

/**
 * La source de la notification est expirée (date d'expiration serveur dépassée) : les actions
 * d'invitation sont masquées pour éviter une acceptance tardive.
 */
export function isExpired(notification: NotificationView): boolean {
  if (!notification.expiresAt) return false
  const expiresAt = Date.parse(notification.expiresAt)
  return Number.isFinite(expiresAt) && expiresAt <= Date.now()
}

export function isUnread(notification: NotificationView): boolean {
  return notification.readAt === null
}

/**
 * Route de reprise d'un défi accepté : l'arène dès que la partie est créée (`gameId`), sinon la
 * salle encore ouverte (`sourceId` = roomId). `null` pour les autres types.
 */
export function roomTargetPath(notification: NotificationView): string | null {
  if (notification.type !== "ROOM_ACCEPTED") return null
  if (notification.gameId) return `/game/${notification.gameId}`
  if (notification.sourceId) return `/rooms/${notification.sourceId}`
  return null
}

/**
 * Destination au clic d'une notification : profil pour un abonné, duel/salle pour un défi
 * accepté ; `null` pour les invitations (la ligne ré-affiche la modale Accepter/Refuser) et les
 * événements purement informatiques.
 */
export function notificationTargetPath(
  notification: NotificationView
): string | null {
  switch (notification.type) {
    case "FOLLOW":
      return notification.actorId ? `/players/${notification.actorId}` : null
    case "ROOM_ACCEPTED":
      return roomTargetPath(notification)
    default:
      return null
  }
}

export interface NotificationToastContent {
  title: string
  description: string
  /** Destination au clic (toujours définie pour les toasts affichés). */
  path: string | null
  /** Variante colorée du toast (titres/icônes alignés sur les variants sonner du `Toaster`). */
  tone?: "success" | "danger"
}

/**
 * Contenu du toast d'une notification temps réel, ou `null` si aucun toast n'est pertinent
 * (invitation `CHALLENGE_RECEIVED`, couverte par la modale live).
 */
export function notificationToast(
  notification: NotificationView,
  t: TFunction
): NotificationToastContent | null {
  switch (notification.type) {
    case "FOLLOW":
      return {
        title: t("notifications.toast.followTitle"),
        description: t("notifications.toast.followDescription"),
        path: notification.actorId
          ? `/players/${notification.actorId}`
          : "/notifications",
      }
    case "CHALLENGE_DECLINED":
      return {
        title: t("notifications.toast.declinedTitle"),
        description: t("notifications.toast.declinedDescription"),
        path: "/notifications",
        tone: "danger",
      }
    case "ROOM_ACCEPTED": {
      const path = roomTargetPath(notification)
      return path
        ? {
            title: t("notifications.toast.acceptedTitle"),
            description: t("notifications.toast.acceptedDescription"),
            path,
            tone: "success",
          }
        : null
    }
    default:
      return null
  }
}

/** Horodatage relatif court (« à l'instant », « il y a 5 min », « il y a 3 j »). */
export function relativeTime(
  iso: string,
  t: TFunction,
  locale: string
): string {
  const elapsedMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(elapsedMs / 60_000)
  if (minutes < 1) return t("notifications.time.justNow")
  if (minutes < 60) return t("notifications.time.minutes", { count: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t("notifications.time.hours", { count: hours })
  const days = Math.floor(hours / 24)
  if (days < 7) return t("notifications.time.days", { count: days })
  return new Date(iso).toLocaleDateString(locale)
}
