import type { NotificationView } from "@/shared/types/notifications";

export type { NotificationView } from "@/shared/types/notifications";
export type { NotificationCategory } from "@/shared/types/notifications";
export type { NotificationPreferenceView } from "@/shared/types/notifications";

/**
 * Une invitation de défi encore actionnable : défi nominatif (`CHALLENGE_RECEIVED`) ou ancienne
 * invitation de salon (`LOBBY_INVITATION`, lignes historiques).
 */
export function isLobbyInvitation(notification: NotificationView): boolean {
  return (
    (notification.type === "CHALLENGE_RECEIVED" ||
      notification.type === "LOBBY_INVITATION") &&
    notification.sourceId !== null
  );
}

/**
 * La source de la notification est expirée (date d'expiration serveur dépassée) : les actions
 * d'invitation sont masquées pour éviter un appel sur un salon purgé (404).
 */
export function isExpired(notification: NotificationView): boolean {
  if (!notification.expiresAt) return false;
  const expiresAt = Date.parse(notification.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt <= Date.now();
}

export function isUnread(notification: NotificationView): boolean {
  return notification.readAt === null;
}

/**
 * Route de reprise d'un défi accepté : l'arène dès que la partie est créée (`gameId`), sinon la
 * salle d'attente encore ouverte (`sourceId` = lobbyId). `null` pour les autres types.
 */
export function lobbyTargetPath(notification: NotificationView): string | null {
  if (notification.type !== "LOBBY_ACCEPTED") return null;
  if (notification.gameId) return `/duel/${notification.gameId}`;
  if (notification.sourceId) return `/lobbies/${notification.sourceId}`;
  return null;
}

export interface NotificationToastContent {
  title: string;
  description: string;
  /** Destination au clic (toujours définie pour les toasts affichés). */
  path: string | null;
}

/**
 * Contenu du toast d'une notification temps réel, ou `null` si aucun toast n'est pertinent :
 * invitations (`CHALLENGE_RECEIVED`/`LOBBY_INVITATION`, couvertes par la modale live) et types
 * historiques retirés (`LOBBY_CANCELLED`/`LOBBY_EXPIRED`).
 */
export function notificationToast(
  notification: NotificationView,
): NotificationToastContent | null {
  switch (notification.type) {
    case "FOLLOW":
      return {
        title: "Nouvel abonné",
        description: "Un joueur s'est abonné à toi.",
        path: notification.actorId
          ? `/players/${notification.actorId}`
          : "/notifications",
      };
    case "CHALLENGE_DECLINED":
    case "LOBBY_DECLINED":
      return {
        title: "Défi refusé",
        description: "Ton adversaire a refusé ton défi.",
        path: "/notifications",
      };
    case "LOBBY_MISSED":
      return {
        title: "Adversaire absent",
        description: "Ton adversaire ne s'est pas présenté au duel.",
        path: "/notifications",
      };
    case "LOBBY_ACCEPTED": {
      const path = lobbyTargetPath(notification);
      return path
        ? {
            title: "Ton défi a été accepté",
            description: "Touche pour rejoindre la salle.",
            path,
          }
        : null;
    }
    default:
      return null;
  }
}

/** Horodatage relatif court (« à l'instant », « il y a 5 min », « il y a 3 j »). */
export function relativeTime(iso: string): string {
  const elapsedMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}
