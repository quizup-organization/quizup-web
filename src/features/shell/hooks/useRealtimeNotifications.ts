import { useQueryClient } from "@tanstack/react-query";
import { getUserId } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { useStompSubscription } from "@/shared/hooks/useStompSubscription";

/**
 * Notifications temps réel du joueur courant (WS `/topic/social/{userId}`) :
 * défis reçus/acceptés → rafraîchit la liste des défis, le badge et les follows.
 */
export function useRealtimeNotifications(): void {
  const userId = getUserId();
  const queryClient = useQueryClient();

  useStompSubscription(
    "social",
    userId ? `/topic/social/${userId}` : null,
    () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.challenges.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.userFollows.all });
    },
  );
}
