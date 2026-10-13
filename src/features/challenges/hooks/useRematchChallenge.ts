import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"
import { useImmersiveNavigate } from "@/features/shell"
import type { ApiError } from "@/shared/types/api"
import { challengesService } from "../lib/challenges"

/** Cadence de sondage du défi de revanche (accepté → salle, refusé → issue). */
const POLL_MS = 2_000

export type RematchState = "idle" | "pending" | "accepted" | "refused"

export interface RematchChallengeResult {
  /** Lance une revanche vers l'adversaire : bouton en attente puis navigation auto en salle. */
  start: (params: {
    topicId: string
    opponentId: string
    gameId: string
  }) => void
  /** Défi envoyé, en attente de la réponse de l'adversaire. */
  pending: boolean
  /** Défi refusé (ou expiré/annulé) : le bouton reste désactivé et affiche l'issue. */
  refused: boolean
}

/**
 * Revanche en défi nominatif : crée le défi puis **suit sa réponse** — accepté → navigation
 * automatique vers la salle (le client y fait son apparition), refusé/expiré → toast + bouton
 * définitivement désactivé. Le suivi s'arrête au démontage (navigation, fermeture).
 *
 * <p>L'identifiant du défi est un **état** : le sondage ne démarre qu'une fois la création
 * confirmée (sinon le premier tick, déclenché avant la réponse HTTP, ne se replanifiait pas).</p>
 */
export function useRematchChallenge(): RematchChallengeResult {
  const { t } = useTranslation()
  const immersiveNavigate = useImmersiveNavigate()
  const queryClient = useQueryClient()
  const [state, setState] = useState<RematchState>("idle")
  const [challengeId, setChallengeId] = useState<string | null>(null)

  const start = useCallback(
    (params: { topicId: string; opponentId: string; gameId: string }): void => {
      if (state !== "idle") return
      setState("pending")
      setChallengeId(null)
      challengesService
        .create(
          {
            topicId: params.topicId,
            opponentId: params.opponentId,
            gameId: params.gameId,
          },
          { skipErrorBus: true }
        )
        .then((created) => {
          setChallengeId(created.id)
          void queryClient.invalidateQueries({
            queryKey: queryKeys.challenges.mine(),
          })
        })
        .catch(() => {
          setState("idle")
          toast.error(t("game.toasts.rematchSendFailed"))
        })
    },
    [state, queryClient, t]
  )

  useEffect(() => {
    if (state !== "pending" || !challengeId) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const refuse = (message: string) => {
      setState("refused")
      toast.error(message)
    }

    const poll = async (): Promise<void> => {
      if (cancelled) return
      try {
        const challenge = await challengesService.get(challengeId, {
          skipErrorBus: true,
        })
        if (cancelled) return
        if (challenge.status === "ACCEPTED" && challenge.roomId) {
          setState("accepted")
          immersiveNavigate(`/rooms/${challenge.roomId}`)
          return
        }
        if (challenge.status === "DECLINED") {
          refuse(t("game.toasts.rematchRefused"))
          return
        }
        if (
          challenge.status === "EXPIRED" ||
          challenge.status === "CANCELLED"
        ) {
          refuse(t("game.toasts.rematchExpired"))
          return
        }
        timer = setTimeout(() => void poll(), POLL_MS)
      } catch (error) {
        if (cancelled) return
        if ((error as ApiError | undefined)?.statusCode === 404) {
          refuse(t("game.toasts.rematchExpired"))
          return
        }
        timer = setTimeout(() => void poll(), POLL_MS * 2)
      }
    }

    void poll()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [state, challengeId, immersiveNavigate, t])

  return {
    start,
    pending: state === "pending",
    refused: state === "refused",
  }
}
