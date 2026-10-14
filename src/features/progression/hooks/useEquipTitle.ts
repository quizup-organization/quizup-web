import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { reconcileUntil } from "@/shared/utils/optimistic-reconcile"
import type { PlayerTitles } from "../domain/progression"
import { progressionService } from "../lib/progression"

/**
 * Titre porté affiché sur le profil (`PUT /api/profiles/{id}/title`).
 *
 * Optimiste : la clé du titre est posée dans le cache des titres (c'est lui qui porte l'affichage)
 * puis **réconciliée** par relecture du service jusqu'à ce que le serveur reflète l'intention — le
 * titre est validé côté BFF (grade réellement atteint), donc une relecture périmée écraserait
 * l'état optimiste (cf. `best-practices/.frontend/server-state.md`).
 */
export function useEquipTitle(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (titleKey: string | null) =>
      progressionService.equipTitle(userId, titleKey),

    onMutate: async (titleKey) => {
      if (userId === "") return {}
      await queryClient.cancelQueries({
        queryKey: queryKeys.profiles.titles(userId),
      })
      const previous = queryClient.getQueryData<PlayerTitles>(
        queryKeys.profiles.titles(userId)
      )
      queryClient.setQueryData<PlayerTitles>(
        queryKeys.profiles.titles(userId),
        (old) => (old ? { ...old, equippedKey: titleKey } : old)
      )
      return { previous }
    },

    onError: (_error, _titleKey, context) => {
      if (userId === "" || !context) return
      queryClient.setQueryData(
        queryKeys.profiles.titles(userId),
        context.previous
      )
    },

    onSettled: (_data, error, titleKey) => {
      if (error || userId === "") return
      void reconcileUntil<PlayerTitles>({
        read: () => progressionService.titles(userId),
        matches: (view) => view.equippedKey === titleKey,
        onConverged: (view) => {
          queryClient.setQueryData(queryKeys.profiles.titles(userId), view)
          void queryClient.invalidateQueries({ queryKey: queryKeys.me() })
        },
        onTimeout: () => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.profiles.titles(userId),
          })
          void queryClient.invalidateQueries({ queryKey: queryKeys.me() })
        },
      })
    },
  })
}
