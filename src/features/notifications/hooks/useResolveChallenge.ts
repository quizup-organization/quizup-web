import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { Page } from "@/shared/types/api";
import type { NotificationView } from "@/shared/types/notifications";
import { useNotificationStore } from "../stores/useNotificationStore";
import { useMarkNotificationRead } from "./useNotifications";

/**
 * Tranche une invitation de défi depuis une autre surface (cartes d'accueil) : marque lue et
 * retire du store live la notification `CHALLENGE_RECEIVED` liée au défi, pour que le badge et
 * l'inbox restent cohérents quand l'action ne passe pas par la modale live.
 */
export function useResolveChallenge() {
  const queryClient = useQueryClient();
  const removeInvitation = useNotificationStore((s) => s.removeInvitation);
  const markRead = useMarkNotificationRead();

  return (challengeId: string) => {
    const entries = queryClient.getQueriesData({
      queryKey: queryKeys.notifications.all,
    });
    for (const [, data] of entries) {
      if (!data || typeof data !== "object" || !("content" in data)) continue;
      const page = data as Page<NotificationView>;
      const match = page.content.find(
        (notification) =>
          notification.type === "CHALLENGE_RECEIVED" &&
          notification.sourceId === challengeId,
      );
      if (!match) continue;
      removeInvitation(match.notificationId);
      markRead.mutate(match.notificationId);
      return;
    }
  };
}
