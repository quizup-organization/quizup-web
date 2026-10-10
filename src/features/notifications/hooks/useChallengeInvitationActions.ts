import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  reconcileGameViews,
  useAcceptChallenge,
  useDeclineChallenge,
} from "@/features/game";
import { queryKeys } from "@/lib/query-keys";
import type { NotificationView } from "@/shared/types/notifications";
import { useNotificationStore } from "../stores/useNotificationStore";
import { useMarkNotificationRead } from "./useNotifications";

/**
 * Accepter un défi nominatif (la salle est créée par la saga → on y va directement) ou le
 * refuser (commande réservée à l'invité). Dans les deux cas la notification est lue.
 *
 * Un défi peut avoir expiré/purgé depuis la réception : l'échec est absorbé (pas de
 * `Uncaught (in promise)`), la notification est nettoyée et l'inbox rafraîchie.
 */
export function useChallengeInvitationActions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const removeInvitation = useNotificationStore((s) => s.removeInvitation);
  const markRead = useMarkNotificationRead();
  const { accept: acceptChallenge, pending: acceptChallengePending } =
    useAcceptChallenge();
  const { decline: declineChallenge, pending: declineChallengePending } =
    useDeclineChallenge();

  const cleanUpObsolete = (notification: NotificationView) => {
    removeInvitation(notification.notificationId);
    markRead.mutate(notification.notificationId);
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    reconcileGameViews(queryClient);
  };

  const accept = async (notification: NotificationView): Promise<void> => {
    const sourceId = notification.sourceId;
    if (!sourceId) return;
    let roomId: string | null;
    try {
      roomId = await acceptChallenge(sourceId);
    } catch {
      cleanUpObsolete(notification);
      return;
    }
    removeInvitation(notification.notificationId);
    markRead.mutate(notification.notificationId);
    reconcileGameViews(queryClient);
    navigate(roomId ? `/rooms/${roomId}` : "/notifications");
  };

  const refuse = async (notification: NotificationView): Promise<void> => {
    const sourceId = notification.sourceId;
    if (!sourceId) return;
    try {
      await declineChallenge(sourceId);
    } catch {
      cleanUpObsolete(notification);
      return;
    }
    removeInvitation(notification.notificationId);
    markRead.mutate(notification.notificationId);
    reconcileGameViews(queryClient);
  };

  return {
    accept,
    refuse,
    pending: acceptChallengePending || declineChallengePending,
  };
}
