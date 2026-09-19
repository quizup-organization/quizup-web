import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { presenceService, toPresence } from "@/lib/services/presence";
import { useStompSubscription } from "@/shared/hooks/useStompSubscription";
import type { PresenceResponse } from "@/shared/types/api";
import type { Presence } from "@/shared/types/domain";

/** Durée pendant laquelle la présence d'un joueur est considérée fraîche côté cache. */
const STALE_MS = 15_000;

/**
 * Présence d'un joueur : état initial en REST, puis transitions poussées par WebSocket
 * (`/topic/presence/{userId}`). La connexion STOMP `profile` est maintenue par
 * `PresenceConnection` (le `CONNECT` authentifié alimente la présence) — aucun polling.
 */
export function usePresence(userId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.presence.detail(userId),
    queryFn: () => presenceService.getById(userId),
    enabled: !!userId,
    staleTime: STALE_MS,
  });

  useStompSubscription(
    "profile",
    userId ? `/topic/presence/${userId}` : null,
    (message) => {
      try {
        const dto = JSON.parse(message.body) as PresenceResponse;
        queryClient.setQueryData<Presence>(
          queryKeys.presence.detail(userId),
          toPresence(dto),
        );
      } catch {
        /* message non exploitable : la prochaine lecture REST corrigera */
      }
    },
  );

  return query;
}
