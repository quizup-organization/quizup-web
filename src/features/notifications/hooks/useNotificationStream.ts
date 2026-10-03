import { useQueryClient } from "@tanstack/react-query";
import { getSessionUserId as getUserId } from "@/features/auth";
import { queryKeys } from "@/lib/query-keys";
import { useStompSubscription } from "@/shared/hooks/useStompSubscription";
import { useNotificationStore } from "../stores/useNotificationStore";
import { isLobbyInvitation } from "../domain/notification";
import type { NotificationView } from "@/shared/types/notifications";

interface NotificationViewEnvelope {
  payload?: NotificationView;
}

/**
 * Flux temps réel de l'inbox (`/topic/notifications/{userId}`) : met en file les invitations
 * de défi (modale) et rafraîchit la page et le compteur.
 */
export function useNotificationStream(): void {
  const userId = getUserId();
  const queryClient = useQueryClient();
  const pushInvitation = useNotificationStore((s) => s.pushInvitation);

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
      const notification = envelope.payload;
      if (!notification?.notificationId) return;
      if (isLobbyInvitation(notification)) {
        pushInvitation(notification);
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  );
}
