import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getSessionUserId as getUserId } from "@/features/auth";
import { queryKeys } from "@/lib/query-keys";
import { useStompSubscription } from "@/shared/hooks/useStompSubscription";
import type {
  NotificationDeletedPayload,
  NotificationView,
} from "@/shared/types/notifications";
import { useNotificationStore } from "../stores/useNotificationStore";
import { isLobbyInvitation, lobbyTargetPath } from "../domain/notification";
import { removeNotificationFromCaches } from "../lib/notification-cache";

interface NotificationViewEnvelope {
  eventType?: string;
  payload?: NotificationView | NotificationDeletedPayload;
}

const DELETED_EVENT_TYPE = "NOTIFICATION_DELETED";

/**
 * Flux temps réel de l'inbox (`/topic/notifications/{userId}`) : met en file les invitations
 * de défi (modale), propose de rejoindre l'arène quand un défi est accepté (toast actionnable),
 * retire les notifications supprimées (autres onglets) et rafraîchit la page et le compteur.
 */
export function useNotificationStream(): void {
  const userId = getUserId();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const pushInvitation = useNotificationStore((s) => s.pushInvitation);
  const removeInvitation = useNotificationStore((s) => s.removeInvitation);

  useStompSubscription(
    "notifications",
    userId ? `/topic/notifications/${userId}` : null,
    (message) => {
      let envelope: NotificationViewEnvelope;
      try {
        envelope = JSON.parse(message.body) as NotificationViewEnvelope;
      } catch {
        return;
      }
      const notificationId = envelope.payload?.notificationId;
      if (!notificationId) return;
      if (envelope.eventType === DELETED_EVENT_TYPE) {
        removeInvitation(notificationId);
        removeNotificationFromCaches(queryClient, notificationId);
        return;
      }
      const notification = envelope.payload as NotificationView;
      if (isLobbyInvitation(notification)) {
        pushInvitation(notification);
      } else if (notification.type === "LOBBY_ACCEPTED") {
        // Déjà dans la salle : la redirection vers l'arène est automatique.
        const alreadyInRoom =
          notification.sourceId !== null &&
          window.location.pathname === `/lobbies/${notification.sourceId}`;
        const path = lobbyTargetPath(notification);
        if (path && !alreadyInRoom) {
          toast("Ton défi a été accepté", {
            id: `accepted-${notification.notificationId}`,
            action: { label: "Rejoindre", onClick: () => navigate(path) },
          });
        }
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  );
}
