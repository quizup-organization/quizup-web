import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  reconcileGameViews,
  useAcceptChallenge,
  useDeclineChallenge,
  type AcceptChallengeResult,
} from "@/features/game"
import { useImmersiveNavigate } from "@/features/shell"
import { queryKeys } from "@/lib/query-keys"
import type { NotificationView } from "@/shared/types/notifications"
import { useNotificationStore } from "../stores/useNotificationStore"
import { useMarkNotificationRead } from "./useNotifications"

/**
 * Accepter un défi nominatif (la salle est créée par la saga → on y va directement) ou le
 * refuser (commande réservée à l'invité). Dans les deux cas la notification est lue.
 *
 * Un défi peut avoir expiré/purgé depuis la réception : l'échec est absorbé (pas de
 * `Uncaught (in promise)`), la notification est nettoyée et l'inbox rafraîchie.
 */
export function useChallengeInvitationActions() {
  const { t } = useTranslation()
  const navigate = useImmersiveNavigate()
  const queryClient = useQueryClient()
  const removeInvitation = useNotificationStore((s) => s.removeInvitation)
  const markRead = useMarkNotificationRead()
  const { accept: acceptChallenge, pending: acceptChallengePending } =
    useAcceptChallenge()
  const { decline: declineChallenge, pending: declineChallengePending } =
    useDeclineChallenge()

  const cleanUpObsolete = (notification: NotificationView) => {
    removeInvitation(notification.notificationId)
    markRead.mutate(notification.notificationId)
    void queryClient.invalidateQueries({
      queryKey: queryKeys.notifications.all,
    })
    reconcileGameViews(queryClient)
  }

  const accept = async (notification: NotificationView): Promise<void> => {
    const sourceId = notification.sourceId
    if (!sourceId) return
    let result: AcceptChallengeResult
    try {
      result = await acceptChallenge(sourceId)
    } catch {
      cleanUpObsolete(notification)
      return
    }
    if (result.status === "gone") {
      // Défi annulé/expiré entre la réception et le clic : on ferme la modale sans commande.
      cleanUpObsolete(notification)
      toast.info(t("notifications.challenge.goneTitle"), {
        description: t("notifications.challenge.goneDescription"),
      })
      return
    }
    removeInvitation(notification.notificationId)
    markRead.mutate(notification.notificationId)
    reconcileGameViews(queryClient)
    navigate(result.roomId ? `/rooms/${result.roomId}` : "/notifications")
  }

  const refuse = async (notification: NotificationView): Promise<void> => {
    const sourceId = notification.sourceId
    if (!sourceId) return
    try {
      await declineChallenge(sourceId)
    } catch {
      cleanUpObsolete(notification)
      return
    }
    removeInvitation(notification.notificationId)
    markRead.mutate(notification.notificationId)
    reconcileGameViews(queryClient)
  }

  return {
    accept,
    refuse,
    pending: acceptChallengePending || declineChallengePending,
  }
}
