import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { lobbiesService, useDeclineLobby } from "@/features/duel";
import { queryKeys } from "@/lib/query-keys";
import type { NotificationView } from "@/shared/types/notifications";
import { useNotificationStore } from "../stores/useNotificationStore";
import { useMarkNotificationRead } from "./useNotifications";

/**
 * Accepter = rejoindre le salon nominatif (idempotent) puis ouvrir la salle d'attente.
 * Refuser = commande `decline` réservée à l'invité. Dans les deux cas la notification est lue.
 *
 * Un salon peut avoir expiré/purgé depuis la réception : l'échec est absorbé (pas de
 * `Uncaught (in promise)`), la notification est nettoyée et l'inbox rafraîchie. Le message
 * utilisateur est produit par le toaster d'erreurs API (mapping `lobby:notFound`).
 */
export function useLobbyInvitationActions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const removeInvitation = useNotificationStore((s) => s.removeInvitation);
  const decline = useDeclineLobby();
  const markRead = useMarkNotificationRead();
  const join = useMutation({
    mutationFn: (lobbyId: string) => lobbiesService.join(lobbyId),
  });

  const cleanUpObsolete = (notification: NotificationView) => {
    removeInvitation(notification.notificationId);
    markRead.mutate(notification.notificationId);
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  };

  const accept = async (notification: NotificationView): Promise<void> => {
    const lobbyId = notification.sourceId;
    if (!lobbyId) return;
    try {
      await join.mutateAsync(lobbyId);
    } catch {
      cleanUpObsolete(notification);
      return;
    }
    removeInvitation(notification.notificationId);
    markRead.mutate(notification.notificationId);
    navigate(`/lobbies/${lobbyId}`);
  };

  const refuse = async (notification: NotificationView): Promise<void> => {
    const lobbyId = notification.sourceId;
    if (!lobbyId) return;
    try {
      await decline.mutateAsync(lobbyId);
    } catch {
      cleanUpObsolete(notification);
      return;
    }
    removeInvitation(notification.notificationId);
    markRead.mutate(notification.notificationId);
  };

  return { accept, refuse, pending: join.isPending || decline.isPending };
}
