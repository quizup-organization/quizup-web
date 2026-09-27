import { useQueryClient } from "@tanstack/react-query";
import { getSessionUserId as getUserId } from "@/features/auth";
import { queryKeys } from "@/lib/query-keys";
import { useStompSubscription } from "@/shared/hooks/useStompSubscription";

/**
 * Notifications temps réel du joueur courant (WS `/topic/social/{userId}`) : défis et follows →
 * rafraîchit les listes, les compteurs et le joueur courant.
 */
export function useRealtimeNotifications(): void {
  const userId = getUserId();
  const queryClient = useQueryClient();

  useStompSubscription(
    "social",
    userId ? `/topic/social/${userId}` : null,
    () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.challenges.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      queryClient.invalidateQueries({ queryKey: ["profiles", "people"] });
    },
  );
}
