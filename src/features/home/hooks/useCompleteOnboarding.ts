import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import type { Me } from "@/features/shell/domain/me"
import { onboardingService } from "../lib/onboarding"

/** Pose le flag serveur une seule fois ; la vue `me` est mise à jour pour le guard. */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient()
  return useMutation<Me, Error, void>({
    mutationFn: () => onboardingService.complete(),
    onSuccess: (me) => {
      // Pas d'invalidation immédiate : la projection profile peut être en retard sur la réponse
      // du BFF (qui force déjà `onboardingCompleted=true`) et réécrire un flag faux dans le cache.
      queryClient.setQueryData(queryKeys.me(), {
        ...me,
        onboardingCompleted: true,
      })
    },
  })
}
