import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useTopicOverview } from "@/features/topic-detail"
import { useTopicName } from "@/features/shell"
import { useStartBotGame } from "@/features/rooms"
import { TOKEN } from "@/shared/theme/tokens"
import { SearchingScreen } from "../components/SearchingScreen"
import { NoOpponentDialog } from "../components/NoOpponentDialog"
import { TrainBotDialog } from "../components/TrainBotDialog"
import {
  useCancelMatchmaking,
  useMatchmakingTicket,
  useStartMatchmaking,
} from "../hooks/useMatchmaking"

/**
 * Écran de recherche d'appariement public (« Défier le monde »). Bascule automatique vers la
 * salle dès que l'appariement aboutit (adversaire humain). À l'échéance (30 s) sans adversaire,
 * le ticket **expire** et la page propose de relancer une recherche ou de s'entraîner contre un
 * robot (choix de difficulté) — aucun repli bot automatique.
 *
 * Quitter l'écran pendant la recherche **annule le ticket** : sans notification d'appariement,
 * c'est le seul moyen d'éviter une salle (et un adversaire) orphelins.
 */
export function MatchmakingPage() {
  const { t } = useTranslation()
  const { ticketId = "" } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const { ticket, isLoading, isError } = useMatchmakingTicket(ticketId)
  const cancel = useCancelMatchmaking(ticketId)
  const startMatchmaking = useStartMatchmaking()
  const startBot = useStartBotGame()
  const topicQuery = useTopicOverview(ticket.topicId ?? "")
  const resolveName = useTopicName()
  const [trainOpen, setTrainOpen] = useState(false)

  const statusRef = useRef(ticket.status)
  const cancelRef = useRef(cancel)
  const pendingCancel = useRef<number | null>(null)

  useEffect(() => {
    statusRef.current = ticket.status
  }, [ticket.status])

  useEffect(() => {
    cancelRef.current = cancel
  }, [cancel])

  useEffect(() => {
    // Au (re)montage : annule le cancel programmé par le cleanup de test de StrictMode.
    if (pendingCancel.current !== null) {
      window.clearTimeout(pendingCancel.current)
      pendingCancel.current = null
    }
    return () => {
      if (statusRef.current !== "SEARCHING") return
      pendingCancel.current = window.setTimeout(() => {
        pendingCancel.current = null
        void cancelRef.current.mutateAsync().catch(() => undefined)
      }, 0)
    }
  }, [])

  useEffect(() => {
    if (ticket.status === "MATCHED" && ticket.roomId) {
      void navigate(`/rooms/${ticket.roomId}`, { replace: true })
    }
  }, [ticket.status, ticket.roomId, navigate])

  if (ticket.status === "CANCELLED" || ticket.status === "FAILED" || isError) {
    return (
      <div
        className="grid h-full place-items-center p-6"
        style={{ background: TOKEN.duelBg }}
      >
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <div className="font-heading text-lg font-bold">
            {ticket.status === "FAILED"
              ? t("game.matchmaking.failed")
              : t("game.matchmaking.canceled")}
          </div>
          <Button className="w-full" onClick={() => void navigate("/topics")}>
            {t("game.common.backToTopics")}
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading && !ticket.topicId) {
    return (
      <div
        className="grid h-full place-items-center p-6 text-sm"
        style={{ background: TOKEN.duelBg, color: TOKEN.mutedFg }}
      >
        {t("game.matchmaking.searching")}
      </div>
    )
  }

  const topic = topicQuery.data?.topic
  const topicId = ticket.topicId
  const expired = ticket.status === "EXPIRED"

  return (
    <div
      className="qu-immersive-safe relative flex h-full flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <SearchingScreen
        deadlineAt={ticket.deadlineAt}
        topic={{
          name: resolveName(topic?.names, t("game.matchmaking.topicFallback")),
          emoji: topic?.emoji ?? undefined,
          color: topic?.color ?? undefined,
          imageUrl: topic?.imageUrl ?? undefined,
          category: topic?.category ?? undefined,
          categoryLabel: topic?.categoryLabel ?? undefined,
        }}
      />
      {!expired && (
        <div className="relative z-10 flex shrink-0 justify-center px-6 pt-1 pb-4">
          <Button
            variant="destructive"
            className="w-full max-w-[380px]"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate()}
          >
            {t("game.matchmaking.cancel")}
          </Button>
        </div>
      )}

      <NoOpponentDialog
        open={expired && !trainOpen}
        retryPending={startMatchmaking.isPending}
        onRetry={() => topicId && startMatchmaking.mutate(topicId)}
        onTrain={() => setTrainOpen(true)}
      />
      <TrainBotDialog
        open={trainOpen}
        pending={startBot.isPending}
        onClose={() => setTrainOpen(false)}
        onStart={(difficulty) =>
          topicId && startBot.mutate({ topicId, difficulty })
        }
      />
    </div>
  )
}
