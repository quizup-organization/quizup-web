import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { lobbiesService, useDeclineLobby } from "@/features/duel";
import type { NotificationView } from "@/shared/types/notifications";
import { useNotificationStore } from "../stores/useNotificationStore";
import { useMarkNotificationRead } from "./useNotifications";

/**
 * Accepter = rejoindre le salon nominatif (idempotent) puis ouvrir la salle d'attente.
 * Refuser = commande `decline` réservée à l'invité. Dans les deux cas la notification est lue.
 */
export function useLobbyInvitationActions() {
  const navigate = useNavigate();
  const removeInvitation = useNotificationStore((s) => s.removeInvitation);
  const decline = useDeclineLobby();
  const markRead = useMarkNotificationRead();
  const join = useMutation({
    mutationFn: (lobbyId: string) => lobbiesService.join(lobbyId),
  });

  const accept = async (notification: NotificationView): Promise<void> => {
    const lobbyId = notification.sourceId;
    if (!lobbyId) return;
    await join.mutateAsync(lobbyId);
    removeInvitation(notification.notificationId);
    markRead.mutate(notification.notificationId);
    navigate(`/lobbies/${lobbyId}`);
  };

  const refuse = async (notification: NotificationView): Promise<void> => {
    const lobbyId = notification.sourceId;
    if (!lobbyId) return;
    await decline.mutateAsync(lobbyId);
    removeInvitation(notification.notificationId);
    markRead.mutate(notification.notificationId);
  };

  return { accept, refuse, pending: join.isPending || decline.isPending };
}
