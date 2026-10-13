import { useQueryClient } from "@tanstack/react-query"
import { CircleCheck, CircleX } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { toast } from "sonner"
import { getSessionUserId as getUserId } from "@/features/auth"
import { reconcileGameViews } from "@/features/challenges"
import { useImmersiveNavigate } from "@/features/shell"
import { queryKeys } from "@/lib/query-keys"
import { useStompSubscription } from "@/shared/hooks/useStompSubscription"
import type {
  NotificationDeletedPayload,
  NotificationView,
} from "@/shared/types/notifications"
import { useNotificationStore } from "../stores/useNotificationStore"
import { useNotificationSoundStore } from "../stores/useNotificationSoundStore"
import {
  isChallengeInvitation,
  notificationToast,
} from "../domain/notification"
import { removeNotificationFromCaches } from "../lib/notification-cache"
import { playNotificationSound } from "../lib/notification-sound"
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
  const soundEnabled = useNotificationSoundStore((s) => s.enabled)
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
        playNotificationSound()
      }
      if (isChallengeInvitation(notification)) {
        pushInvitation(notification)
      } else if (!immersive) {
        const content = notificationToast(notification, t)
        // Déjà à destination (ex. dans la salle) : inutile de proposer d'y aller.
        const alreadyThere =
          content?.path != null && window.location.pathname === content.path
        if (content && !alreadyThere) {
          // Toast entièrement cliquable (pas de bouton) : ouvre la cible du clic.
          toast.custom(
            (toastId) => (
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(toastId)
                  // Le clic vaut lecture de la notification (badge/cloche à jour).
                  if (notification.readAt === null) {
                    markRead.mutate(notification.notificationId)
                  }
                  if (content.path) navigate(content.path)
                }}
                className="flex w-full cursor-pointer items-start gap-3 text-left"
              >
                {/* Issue d'un défi : icône + titre colorés (accepté = succès, refusé = danger). */}
                {content.tone === "success" && (
                  <CircleCheck
                    className="mt-0.5 size-5 shrink-0 text-toast-success"
                    aria-hidden
                  />
                )}
                {content.tone === "danger" && (
                  <CircleX
                    className="mt-0.5 size-5 shrink-0 text-toast-danger"
                    aria-hidden
                  />
                )}
                <span className="flex min-w-0 flex-1 flex-col items-start">
                  <span
                    className={cn(
                      "text-sm leading-5 font-medium",
                      content.tone === "success" && "text-toast-success",
                      content.tone === "danger" && "text-toast-danger"
                    )}
                  >
                    {content.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {content.description}
                  </span>
                </span>
              </button>
            ),
            {
              id: `notification-${notification.notificationId}`,
              duration: 6_000,
            }
          )
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
