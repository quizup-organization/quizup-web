import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  lobbiesService,
  reconcileDuelViews,
  useAcceptChallenge,
  useDeclineChallenge,
  useDeclineLobby,
} from "@/features/duel";
import { queryKeys } from "@/lib/query-keys";
import type { NotificationView } from "@/shared/types/notifications";
import { useNotificationStore } from "../stores/useNotificationStore";
import { useMarkNotificationRead } from "./useNotifications";

/**
 * Accepter un défi = accepter le **défi nominatif** (la salle est créée par la saga → on y va
 * directement) ou rejoindre un ancien salon nominatif (`LOBBY_INVITATION`).
 * Refuser = commande réservée à l'invité. Dans les deux cas la notification est lue.
 *
 * Un défi/salon peut avoir expiré/purgé depuis la réception : l'échec est absorbé (pas de
 * `Uncaught (in promise)`), la notification est nettoyée et l'inbox rafraîchie.
 */
export function useLobbyInvitationActions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const removeInvitation = useNotificationStore((s) => s.removeInvitation);
  const decline = useDeclineLobby();
  const markRead = useMarkNotificationRead();
  const { accept: acceptChallenge, pending: acceptChallengePending } =
    useAcceptChallenge();
  const { decline: declineChallenge, pending: declineChallengePending } =
    useDeclineChallenge();
  const join = useMutation({
    mutationFn: (lobbyId: string) => lobbiesService.join(lobbyId),
  });

  const cleanUpObsolete = (notification: NotificationView) => {
    removeInvitation(notification.notificationId);
    markRead.mutate(notification.notificationId);
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    reconcileDuelViews(queryClient);
  };

  const accept = async (notification: NotificationView): Promise<void> => {
    const sourceId = notification.sourceId;
    if (!sourceId) return;
    const isChallenge = notification.type === "CHALLENGE_RECEIVED";
    let roomId: string | null = null;
    try {
      if (isChallenge) {
        roomId = await acceptChallenge(sourceId);
      } else {
        await join.mutateAsync(sourceId);
      }
    } catch {
      cleanUpObsolete(notification);
      return;
    }
    removeInvitation(notification.notificationId);
    markRead.mutate(notification.notificationId);
    reconcileDuelViews(queryClient);
    if (!isChallenge) {
      navigate(`/lobbies/${sourceId}`);
      return;
    }
    navigate(roomId ? `/lobbies/${roomId}` : "/notifications");
  };

  const refuse = async (notification: NotificationView): Promise<void> => {
    const sourceId = notification.sourceId;
    if (!sourceId) return;
    const isChallenge = notification.type === "CHALLENGE_RECEIVED";
    try {
      if (isChallenge) {
        await declineChallenge(sourceId);
      } else {
        await decline.mutateAsync(sourceId);
      }
    } catch {
      cleanUpObsolete(notification);
      return;
    }
    removeInvitation(notification.notificationId);
    markRead.mutate(notification.notificationId);
    reconcileDuelViews(queryClient);
  };

  return {
    accept,
    refuse,
    pending:
      join.isPending ||
      decline.isPending ||
      acceptChallengePending ||
      declineChallengePending,
  };
}
