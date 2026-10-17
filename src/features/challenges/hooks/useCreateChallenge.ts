import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
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
 * Crée un **défi nominatif** (intention asynchrone : toast + suivi dans l'espace Social).
 * Le toast est **cliquable** et ouvre l'onglet « Défis & Salons » filtré sur les défis envoyés ;
 * l'acceptation mène toujours à la **salle** créée par la saga, jamais à la partie d'origine.
 */
export function useCreateChallenge() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: CreateChallengeParams) =>
      challengesService.create(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.challenges.mine(),
      })
      showSuccessToast(t("game.toasts.challengeSent"), {
        onClick: () => void navigate("/social?tab=challenges&type=sent"),
      })
    },
  })
}
