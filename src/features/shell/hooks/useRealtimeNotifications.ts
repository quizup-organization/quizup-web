import { useQueryClient } from "@tanstack/react-query";
import { getSessionUserId as getUserId } from "@/features/auth";
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
      // Rafraîchit les listes/compteurs de suivi, mais **pas** l'état `state`
      // (optimiste, mis à jour par la mutation) : un refetch de la projection
      // encore différée ferait repasser le bouton « Suivre » et provoquerait un doublon.
      queryClient.invalidateQueries({
        queryKey: queryKeys.userFollows.following(userId ?? ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.userFollows.followers(userId ?? ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.userFollows.counts(userId ?? ""),
      });
    },
  );
}
