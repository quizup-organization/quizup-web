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
import { isLobbyInvitation, notificationToast } from "../domain/notification";
import { removeNotificationFromCaches } from "../lib/notification-cache";

interface NotificationViewEnvelope {
  eventType?: string;
  payload?: NotificationView | NotificationDeletedPayload;
}

const DELETED_EVENT_TYPE = "NOTIFICATION_DELETED";

/**
 * Flux temps réel de l'inbox (`/topic/notifications/{userId}`) : met en file les invitations
 * de défi (modale), déclenche un **toast cliquable** par notification (hors écrans immersifs,
 * où il polluerait la partie), retire les notifications supprimées (autres onglets) et
 * rafraîchit la page et le compteur.
 */
export function useNotificationStream(immersive = false): void {
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
      } else if (!immersive) {
        const content = notificationToast(notification);
        // Déjà à destination (ex. dans la salle) : inutile de proposer d'y aller.
        const alreadyThere =
          content?.path != null && window.location.pathname === content.path;
        if (content && !alreadyThere) {
          // Toast entièrement cliquable (pas de bouton) : ouvre la cible du clic.
          toast.custom(
            (toastId) => (
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(toastId);
                  if (content.path) navigate(content.path);
                }}
                className="flex w-full cursor-pointer flex-col items-start text-left"
              >
                <span className="text-sm leading-5 font-medium">
                  {content.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {content.description}
                </span>
              </button>
            ),
            {
              id: `notification-${notification.notificationId}`,
              duration: 6_000,
            },
          );
        }
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  );
}
