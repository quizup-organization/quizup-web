import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getSessionUserId as getUserId } from "@/features/auth"
import { reconcileGameViews } from "@/features/challenges"
import { useImmersiveNavigate } from "@/features/shell"
import { queryKeys } from "@/lib/query-keys"
import { playNotificationChime } from "@/shared/audio"
import { useStompSubscription } from "@/shared/hooks/useStompSubscription"
import { useSoundStore } from "@/shared/stores/useSoundStore"
import { triggerScreenNudge } from "@/shared/utils/nudge"
import type {
  NotificationDeletedPayload,
  NotificationView,
} from "@/shared/types/notifications"
import { showToast } from "@/shared/utils/toast"
import { DEFAULT_TOAST_ICON, TOAST_ICONS } from "../lib/toast-icons"
import { useNotificationStore } from "../stores/useNotificationStore"
import {
  isChallengeInvitation,
  notificationToast,
} from "../domain/notification"
import { removeNotificationFromCaches } from "../lib/notification-cache"
import { useMarkNotificationRead } from "./useNotifications"

interface NotificationViewEnvelope {
  eventType?: string
  payload?: NotificationView | NotificationDeletedPayload
}

const DELETED_EVENT_TYPE = "NOTIFICATION_DELETED"

/**
 * Flux temps réel de l'inbox (`/topic/notifications/{userId}`) : met en file les invitations
 * de défi (modale), déclenche un **toast cliquable** par notification (hors écrans immersifs,
 * où il polluerait la partie) — le clic marque la notification lue et navigue vers sa cible —
 * retire les notifications supprimées (autres onglets) et rafraîchit la page et le compteur.
 */
export function useNotificationStream(immersive = false): void {
  const userId = getUserId()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const navigate = useImmersiveNavigate()
  const pushInvitation = useNotificationStore((s) => s.pushInvitation)
  const removeInvitation = useNotificationStore((s) => s.removeInvitation)
  const soundEnabled = useSoundStore((s) => s.enabled)
  const markRead = useMarkNotificationRead()

  useStompSubscription(
    "notifications",
    userId ? `/topic/notifications/${userId}` : null,
    (message) => {
      let envelope: NotificationViewEnvelope
      try {
        envelope = JSON.parse(message.body) as NotificationViewEnvelope
      } catch {
        return
      }
      const notificationId = envelope.payload?.notificationId
      if (!notificationId) return
      if (envelope.eventType === DELETED_EVENT_TYPE) {
        removeInvitation(notificationId)
        removeNotificationFromCaches(queryClient, notificationId)
        // Une invitation de défi supprimée (annulation) doit aussi disparaître de l'accueil.
        reconcileGameViews(queryClient)
        return
      }
      const notification = envelope.payload as NotificationView
      if (soundEnabled && !immersive) {
        playNotificationChime(notification.type)
      }
      if (notification.type === "WIZZ" && !immersive) {
        // Relance (« wizz ») : secousse d'écran façon MSN, même règle que les toasts
        // (les écrans immersifs restent calmes — la trace inbox et le push OS subsistent).
        triggerScreenNudge()
      }
      if (isChallengeInvitation(notification)) {
        pushInvitation(notification)
      } else if (!immersive) {
        const content = notificationToast(notification, t)
        // Déjà à destination (ex. dans la salle) : inutile de proposer d'y aller.
        const alreadyThere =
          content?.path != null && window.location.pathname === content.path
        if (content && !alreadyThere) {
          // Toast entièrement cliquable (gabarit unique) : ouvre la cible du clic.
          showToast({
            tone: content.tone ?? null,
            icon: TOAST_ICONS[notification.type] ?? DEFAULT_TOAST_ICON,
            title: content.title,
            description: content.description,
            id: `notification-${notification.notificationId}`,
            duration: 6_000,
            onClick: () => {
              // Le clic vaut lecture de la notification (badge/cloche à jour).
              if (notification.readAt === null) {
                markRead.mutate(notification.notificationId)
              }
              if (content.path) navigate(content.path)
            },
          })
        }
      }
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      })
      // Défis et salons de l'accueil suivent aussi le temps réel : l'acceptation d'un défi crée
      // la salle, et un salon annulé/expiré doit disparaître de la section sans attendre le poll.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.challenges.mine(),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.mine() })
    }
  )
}
