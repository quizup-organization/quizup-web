import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useGoBack } from "@/shared/hooks/useGoBack"
import { useIsTouchLayout } from "@/shared/hooks/use-device"
import { profilesService } from "@/features/player"
import { useMe, useTopicName } from "@/features/shell"
import { getSessionUserId } from "@/features/auth"
import { queryKeys } from "@/lib/query-keys"
import { TOKEN } from "@/shared/theme/tokens"
import { useGameResult } from "../hooks/useGameResult"
import { useGameReview } from "../hooks/useGameReview"
import { useStartBotGame } from "../hooks/useGame"
import { useRematchChallenge } from "../hooks/useRematchChallenge"
import { useStartMatchmaking } from "../hooks/useMatchmaking"
import { buildReviewRounds } from "../domain/review"
import { ResultScreen } from "../components/ResultScreen"
import { QuestionReviewDialog } from "../components/QuestionReviewDialog"
import { ReviewCarousel } from "../components/ReviewCarousel"

/**
 * Page résultat dédiée (`/game/:gameId/result`) : s'appuie sur `GET /api/games/{id}/result`
 * (bilan autoritaire, sujet et adversaire enrichis) et sur **un seul** chargement REST de
 * l'historique pour la revue — aucun abonnement WebSocket, aucune horloge, aucun calcul
 * d'arène. Desktop : pile résultat à gauche, carousel de questions à droite ; tactile : pile
 * + bottom sheet DETAILS.
 */
export function GameResultPage() {
  const { gameId = "" } = useParams<{ gameId: string }>()
  return <GameResult key={gameId} gameId={gameId} />
}

function GameResult({ gameId }: { gameId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isTouch = useIsTouchLayout()
  const { data: me, userId: sessionUserId } = useMe()
  const userId = sessionUserId ?? getSessionUserId() ?? ""
  const resolveName = useTopicName()
  const [reviewOpen, setReviewOpen] = useState(false)

  const resultQuery = useGameResult(gameId)
  const reviewQuery = useGameReview(gameId)
  const result = resultQuery.data
  const game = reviewQuery.data

  // Garde : une partie encore en cours (ou annulée — no-show/expirée) n'a pas de page résultat
  // sportive → retour à l'arène (qui gère l'écran dédié des annulations).
  useEffect(() => {
    if (game?.status === "IN_PROGRESS" || game?.status === "CANCELED") {
      navigate(`/game/${gameId}`, { replace: true })
    }
  }, [game?.status, gameId, navigate])

  // Fin de partie : rafraîchit progression/accueil/sujets/profils. La projection Axon d'XP/rangs
  // étant différée, une seconde passe (2,5 s) rattrape le décalage.
  const settledFor = useRef<string | null>(null)
  useEffect(() => {
    if (settledFor.current === gameId) return
    settledFor.current = gameId
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.me() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.home() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.games.active() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.topics.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all })
    }
    refresh()
    const timer = window.setTimeout(refresh, 2500)
    return () => window.clearTimeout(timer)
  }, [gameId, queryClient])

  const isPlayer1 = game?.player1Id === userId
  const opponentId =
    result?.opponentId ??
    (isPlayer1 ? (game?.player2Id ?? null) : (game?.player1Id ?? null))
  const opponentName =
    result?.opponent?.pseudonym ??
    (isPlayer1 ? game?.player2Name : game?.player1Name) ??
    "Adversaire"
  const playerName = me?.pseudonym ?? "Toi"
  const language = me?.language ?? "fr"

  // Avatar adverse : porté par la vue résultat (profil enrichi côté BFF) ; repli profil direct.
  const opponentProfileQuery = useQuery({
    queryKey: queryKeys.profiles.detail(opponentId ?? ""),
    queryFn: () => profilesService.profile(opponentId as string),
    enabled: !!opponentId && !result?.opponent,
    staleTime: 10 * 60 * 1000,
  })

  const playerAvatar = {
    userId: userId || undefined,
    avatarOptions: me?.avatarOptions ?? undefined,
  }
  const opponentAvatar = {
    userId: opponentId ?? undefined,
    avatarOptions:
      result?.opponent?.avatarOptions ??
      opponentProfileQuery.data?.avatarOptions ??
      undefined,
  }

  const reviewRounds = useMemo(
    () => (game ? buildReviewRounds(game, userId, opponentId) : []),
    [game, userId, opponentId],
  )

  const topicId = result?.topic?.topicId ?? game?.topicId ?? null
  const exitResult = useGoBack(topicId ? `/topics/${topicId}` : "/")
  const rematch = useRematchChallenge()
  const startMatchmaking = useStartMatchmaking()
  const startDuel = useStartBotGame()

  if (resultQuery.isError || reviewQuery.isError) {
    return (
      <div
        className="qu-immersive-safe grid h-full place-items-center p-6"
        style={{ background: TOKEN.duelBg }}
      >
        <Card className="items-center gap-3 text-center">
          <div className="text-base font-semibold">Partie introuvable</div>
          <Button variant="outline" onClick={() => navigate("/topics")}>
            Retour aux sujets
          </Button>
        </Card>
      </div>
    )
  }

  if (!result || !game) {
    return (
      <div
        className="qu-immersive-safe grid h-full place-items-center"
        style={{ background: TOKEN.duelBg }}
      >
        <p className="text-sm text-muted-foreground">Préparation du résultat…</p>
      </div>
    )
  }

  const outcome: "win" | "loss" | "draw" =
    result.winnerId == null
      ? "draw"
      : result.winnerId === userId
        ? "win"
        : "loss"
  const forfeit: "you" | "opponent" | null = game.forfeiterId
    ? game.forfeiterId === userId
      ? "you"
      : "opponent"
    : null
  const topicName = result.topic ? resolveName(result.topic.names, "") : ""

  return (
    <>
      <ResultScreen
        playerName={playerName}
        opponentName={opponentName}
        playerAvatar={playerAvatar}
        opponentAvatar={opponentAvatar}
        playerLevel={result.progression.level}
        opponentLevel={result.opponentLevel}
        playerTitle={result.progression.title}
        opponentTitle={result.opponentTitle}
        scores={{ you: result.myScore, them: result.opponentScore }}
        outcome={outcome}
        forfeit={forfeit}
        topicName={topicName}
        result={result}
        botGame={result.botGame}
        onChallengeRematch={() => {
          if (opponentId && topicId) {
            rematch.start({ topicId, opponentId })
          }
        }}
        rematchPending={rematch.pending}
        rematchRefused={rematch.refused}
        onOpenReview={() => setReviewOpen(true)}
        canReview={reviewRounds.length > 0}
        reviewPane={
          !isTouch ? (
            <ReviewCarousel
              rounds={reviewRounds}
              userId={userId}
              opponentId={opponentId}
              playerName={playerName}
              opponentName={opponentName}
              playerAvatar={playerAvatar}
              opponentAvatar={opponentAvatar}
              language={language}
            />
          ) : undefined
        }
        onNewOpponent={() => {
          if (topicId) startMatchmaking.mutate(topicId)
        }}
        onReplayBot={() => {
          if (topicId) {
            startDuel.mutate({
              topicId,
              difficulty: result.botDifficulty ?? "NORMAL",
            })
          }
        }}
        newOpponentPending={startMatchmaking.isPending}
        replayPending={startDuel.isPending}
        onExit={exitResult}
      />

      {isTouch && (
        <QuestionReviewDialog
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          game={game}
          userId={userId}
          opponentId={opponentId}
          playerName={playerName}
          opponentName={opponentName}
          playerAvatar={playerAvatar}
          opponentAvatar={opponentAvatar}
          language={language}
        />
      )}
    </>
  )
}
