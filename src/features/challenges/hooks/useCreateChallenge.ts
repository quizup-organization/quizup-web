import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { queryKeys } from "@/lib/query-keys"
import { showSuccessToast } from "@/shared/utils/success-toast"
import { challengesService } from "../lib/challenges"

/** Paramètres de création : `gameId` renseigné = revanche d'une partie terminée. */
export interface CreateChallengeParams {
  topicId: string
  opponentId: string
  gameId?: string | null
}

/**
 * Crée un **défi nominatif** (intention asynchrone : toast + suivi par la section d'accueil).
 * L'acceptation mène toujours à la **salle** créée par la saga, jamais à la partie d'origine.
 */
export function useCreateChallenge() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: CreateChallengeParams) =>
      challengesService.create(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.challenges.mine(),
      })
      showSuccessToast(t("game.toasts.challengeSent"))
    },
  })
}
