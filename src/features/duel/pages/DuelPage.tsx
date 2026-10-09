import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { LogOut } from "lucide-react"
import { AppDialog } from "@/shared/components/app-dialog"
import { BottomSheet } from "@/components/arc/bottom-sheet/bottom-sheet"
import { useGoBack } from "@/shared/hooks/useGoBack"
import { useIsTouchLayout } from "@/shared/hooks/use-device"
import { SHEET_DETENTS } from "@/shared/theme/sheets"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { personColor } from "@/features/people"
import { profilesService } from "@/features/player"
import { useMe, useTopicName } from "@/features/shell"
import { useTopicOverview } from "@/features/topic"
import { getSessionUserId as getUserId } from "@/features/auth"
import { queryKeys } from "@/lib/query-keys"
import type { ApiError } from "@/shared/types/api"
import { gamesService } from "../lib/games"
import { categoryColor, categoryLabel } from "@/shared/utils/categories"
import { titleForLevel } from "@/shared/utils/level"
import { TOKEN } from "@/shared/theme/tokens"
import type { BotDifficulty, GameChoice } from "@/features/duel/domain/game-dto"
import { MatchHeader } from "../components/MatchHeader"
import { CircleTransition } from "../components/CircleTransition"
import { QuestionBody } from "../components/QuestionBody"
import { QuestionReviewDialog } from "../components/QuestionReviewDialog"
import { ResultScreen } from "../components/ResultScreen"
import { RoundIntro } from "../components/RoundIntro"
import { ScoreGauge, type GaugeState } from "../components/ScoreGauge"
import { VersusScreen } from "../components/VersusScreen"
import {
  CATCH_UP_INTERVAL_MS,
  LATE_JOIN_MS,
  PENDING_ECHO_GRACE_MS,
  ROUND_SECONDS,
} from "../lib/duel-constants"
import { sceneAt } from "../domain/arena-timeline"
import { useAnswerQuestion, useStartDuel } from "../hooks/useDuel"
import { useGameResult } from "../hooks/useGameResult"
import { useGameState } from "../hooks/useGameState"
import { useStartMatchmaking } from "../hooks/useMatchmaking"
import { useCreateLobby } from "../hooks/useLobbies"
import { useServerClock } from "../hooks/useServerClock"
import { preloadImage } from "@/shared/utils/image-preload"
import { firstAnswerPct, localizedQuestion } from "../domain/game"

function isGameChoice(value: string): value is GameChoice {
  return value === "A" || value === "B" || value === "C" || value === "D"
}

function toAnswerList(
  record: Record<string, string> | null | undefined
): { choice: string; label: string }[] {
  if (!record) return []
  return Object.keys(record)
    .sort()
    .map((choice) => ({ choice, label: record[choice] }))
}

/**
 * Arène de duel. Tout l'état dynamique est dérivé du read model `GameState` (fold des
 * notifications REST + WebSocket), projeté en une **scène unique** par `sceneAt` : plus de
 * booléens de phase ad hoc, les animations suivent les fenêtres temporelles du serveur.
 *
 * <p>`key={gameId}` garantit qu'un changement de partie (revanche, rejouer) repart d'un état
 * local vierge — sinon un état terminal (`arrivedFinished`, sélection en attente) fuitait d'une
 * partie à l'autre et court-circuitait les intros.</p>
 */
export function DuelPage() {
  const { gameId = "" } = useParams<{ gameId: string }>()
  return <DuelArena key={gameId} gameId={gameId} />
}

function DuelArena({ gameId }: { gameId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = getUserId() ?? ""
  const { data: me } = useMe()
  const startDuel = useStartDuel()
  const startMatchmaking = useStartMatchmaking()
  const isTouch = useIsTouchLayout()
  const { serverNow, synced, resync } = useServerClock()
  const { game, isLoading, isError, isRetrying, isLagging, refresh } =
    useGameState(gameId)
  const answer = useAnswerQuestion(gameId)
  const topicQuery = useTopicOverview(game.topicId ?? "")
  const exitResult = useGoBack(game.topicId ? `/topics/${game.topicId}` : "/")

  const [now, setNow] = useState(() => serverNow())
  const [quitOpen, setQuitOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  // Sélection locale optimiste : affichée dès le clic, remplacée par l'écho serveur
  // (`PLAYER_ANSWERED`). `sentAt` sert au rattrapage REST si l'écho tarde.
  const [pending, setPending] = useState<{
    round: number
    choice: GameChoice
    sentAt: number
  } | null>(null)

  // Précharge toutes les images de questions dès la création de la partie : sur une connexion
  // faible, elles sont déjà en cache quand chaque round se révèle.
  useEffect(() => {
    game.questionImageUrls.forEach((url) => preloadImage(url))
  }, [game.questionImageUrls])

  // Fin de partie (finie ou annulée) : on rafraîchit tout ce que la partie a pu faire évoluer —
  // progression/niveau (`/api/me`), « partie en cours » (bandeau de reprise global), accueil
  // (tendances), sujets (progression du thème + classement) et profils (historique, face-à-face).
  // La projection Axon d'XP/rangs étant différée, une seconde passe rattrape le décalage.
  const settledFor = useRef<string | null>(null)
  useEffect(() => {
    if (game.status === "IN_PROGRESS" || settledFor.current === gameId) return
    settledFor.current = gameId
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.me() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.home() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.games.current() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.topics.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all })
    }
    refresh()
    const timer = window.setTimeout(refresh, 2500)
    return () => window.clearTimeout(timer)
  }, [game.status, gameId, queryClient])

  const isPlayer1 = game.player1Id === userId
  const myScore = isPlayer1 ? game.player1Score : game.player2Score
  const theirScore = isPlayer1 ? game.player2Score : game.player1Score

  const scene = useMemo(() => sceneAt(game, now), [game, now])
  const resultReady = scene.kind === "result"

  const roundIndex =
    scene.kind === "question" || scene.kind === "reveal"
      ? scene.round
      : scene.kind === "roundIntro"
        ? scene.round
        : 0
  const currentRound =
    scene.kind === "question" || scene.kind === "reveal"
      ? scene.roundState
      : null

  const opponentId = isPlayer1 ? game.player2Id : game.player1Id
  // Revue disponible uniquement si au moins un round a été joué (abandon avant tout round ⇒ rien
  // à revoir, on masque l'accès aux détails).
  const canReview = Object.keys(game.rounds).length > 0
  const opponentName =
    (isPlayer1 ? game.player2Name : game.player1Name) || "Adversaire"
  const opponentColor = opponentId ? personColor(opponentId) : TOKEN.primary

  // Avatars réels des deux joueurs (profil = source des options d'avatar).
  const opponentProfileQuery = useQuery({
    queryKey: queryKeys.profiles.detail(opponentId ?? ""),
    queryFn: () => profilesService.profile(opponentId as string),
    enabled: !!opponentId,
    staleTime: 10 * 60 * 1000,
  })
  const playerAvatar = {
    userId: userId || undefined,
    avatarOptions: me?.avatarOptions ?? undefined,
  }
  const opponentAvatar = {
    userId: opponentId ?? undefined,
    avatarOptions: opponentProfileQuery.data?.avatarOptions ?? undefined,
  }

  const opponent = game.player2Type

  const playerLevel = me?.progression.level ?? 1
  const playerName = me?.pseudonym ?? "Toi"
  const language = me?.language ?? "fr"
  const resolveName = useTopicName()
  const topic = topicQuery.data?.topic
  const topicName = resolveName(topic?.names, "")

  // Écran de résultat : bilan BFF (activé seulement quand l'écran est affiché) ; la revanche
  // passe par un défi nominatif (flux défi/lobby existant).
  const resultQuery = useGameResult(gameId, { enabled: resultReady })
  const createChallenge = useCreateLobby()

  // Horloge : `now` rafraîchi par intervalle — pilote les fenêtres d'animation et le décompte
  // dérivés des instants serveur. Inutile sur l'écran de résultat.
  useEffect(() => {
    if (scene.kind === "result") return
    const interval = setInterval(() => setNow(serverNow()), 50)
    return () => clearInterval(interval)
  }, [scene.kind, serverNow])

  // Reprise après suspension d'onglet / coupure réseau : l'horloge est re-mesurée et
  // l'historique rejoué — sans cela, un onglet mobile gelé restait sur un état périmé.
  useEffect(() => {
    const onResume = () => {
      resync()
      refresh()
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") onResume()
    }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", onResume)
    window.addEventListener("pageshow", onResume)
    window.addEventListener("online", onResume)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("focus", onResume)
      window.removeEventListener("pageshow", onResume)
      window.removeEventListener("online", onResume)
    }
  }, [resync, refresh])

  const localized = useMemo(
    () => localizedQuestion(currentRound, language),
    [currentRound, language]
  )
  const answers = useMemo(() => toAnswerList(localized.answers), [localized])
  const questionText = localized.questionText
  const imageUrl = currentRound?.imageUrl ?? null
  const difficulty = currentRound?.difficulty ?? null
  // Client arrivé après le début de la question (reprise/rechargement) : on saute le délai de
  // lecture et les animations d'entrée pour rendre la question immédiatement.
  const joinedLate = scene.kind === "question" && scene.elapsedMs > LATE_JOIN_MS
  const correctAnswer = currentRound?.correctAnswer ?? null

  const yourAnswer = currentRound?.playerAnswers[userId] ?? null
  const opponentAnswer = opponentId
    ? (currentRound?.playerAnswers[opponentId] ?? null)
    : null
  const yourPick = yourAnswer?.choice ?? null
  const theirPick = opponentAnswer?.choice ?? null
  const roundChoice = yourPick
  const roundTheirChoice = theirPick
  const yourCorrect = yourAnswer?.correct ?? null
  const theirCorrect = opponentAnswer?.correct ?? null
  const gain =
    yourAnswer || opponentAnswer
      ? { you: yourAnswer?.points ?? 0, them: opponentAnswer?.points ?? 0 }
      : null
  const firstAnswerPctValue = useMemo(
    () => firstAnswerPct(currentRound),
    [currentRound]
  )

  // Sélection optimiste du round courant, tant que le serveur n'a rien enregistré.
  const pendingAnswer =
    pending &&
    pending.round === roundIndex &&
    scene.kind === "question" &&
    !yourPick
      ? pending
      : null
  const pendingChoice = pendingAnswer?.choice ?? null

  // La saisie suit la phase serveur (`ANSWERABLE`) : l'horloge cliente n'a plus le pouvoir de
  // verrouiller le joueur (une dérive d'horloge ne doit jamais rendre la question injouable).
  const isAnswerable =
    scene.kind === "question" &&
    !scene.locked &&
    !scene.overdue &&
    !yourPick &&
    pendingAnswer == null

  // Rattrapage REST : une transition serveur attendue n'est pas arrivée, ou l'écho de ma
  // réponse tarde → on rejoue l'historique au lieu d'attendre le reconnect WS (jusqu'à 30 s).
  const pendingEchoOverdue =
    pendingAnswer != null && now - pendingAnswer.sentAt > PENDING_ECHO_GRACE_MS
  const needsCatchUp = synced && (scene.overdue || pendingEchoOverdue)

  useEffect(() => {
    if (!needsCatchUp) return
    refresh()
    const interval = setInterval(refresh, CATCH_UP_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [needsCatchUp, refresh])

  const timeLeftDisplay =
    scene.kind === "question" || scene.kind === "reveal"
      ? scene.timeLeft
      : ROUND_SECONDS

  // Diagnostic dev : trace les transitions de scène et les resynchronisations pour pouvoir
  // confirmer/infirmer une désynchro sans accès à la console de l'utilisateur.
  const lastSceneRef = useRef("")
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const label =
      scene.kind === "question" ||
      scene.kind === "reveal" ||
      scene.kind === "roundIntro"
        ? `${scene.kind}:${scene.round}`
        : scene.kind
    if (lastSceneRef.current === label) return
    lastSceneRef.current = label
    console.debug("[duel] scène", label, {
      overdue: scene.overdue,
      lagging: isLagging,
      status: game.status,
    })
  }, [scene, isLagging, game.status])

  const handleAnswer = (choice: string) => {
    if (!isAnswerable || !isGameChoice(choice)) return
    setPending({ round: roundIndex, choice, sentAt: serverNow() })
    answer.mutate(choice, {
      onError: (error) => {
        // Après les retries automatiques : réseau/timeout, 5xx ou 409 (réponse peut-être
        // déjà enregistrée) → réconcilier par l'historique, sans rien afficher.
        const status = (error as ApiError | undefined)?.statusCode
        if (
          status === 409 ||
          status == null ||
          status === 408 ||
          status >= 500
        ) {
          refresh()
        }
      },
    })
  }

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center bg-background">
        <p className="text-sm text-muted-foreground">
          {isRetrying
            ? "Connexion instable — reprise…"
            : "Préparation du duel…"}
        </p>
      </div>
    )
  }

  if (isError || game.player1Id == null) {
    return (
      <div className="grid h-full place-items-center bg-background p-6">
        <Card className="items-center gap-3 text-center">
          <div className="text-base font-semibold">Partie introuvable</div>
          <Button variant="outline" onClick={() => navigate("/topics")}>
            Retour aux sujets
          </Button>
        </Card>
      </div>
    )
  }

  const topicId = game.topicId

  // Transitoire : la partie démarre immédiatement (présence garantie par le salon), le temps
  // que la trame `GAME_STARTED` (firstRoundAt) arrive.
  if (scene.kind === "waiting") {
    return (
      <div className="grid h-full place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Préparation du duel…</p>
      </div>
    )
  }

  async function abandon() {
    // Abandon toujours valide : le BFF route `cancel` si la partie n'a pas démarré.
    await gamesService.abandon(gameId).catch(() => undefined)
    navigate(`/topics/${topicId}`)
  }

  const quitContent = (
    <span className="text-sm leading-relaxed text-muted-foreground">
      L&apos;abandon donne la victoire à ton adversaire. Tu peux aussi simplement
      fermer cette fenêtre pour reprendre le duel là où tu l&apos;as laissé.
    </span>
  )
  const quitActions = (
    <>
      <Button variant="ghost" onClick={() => setQuitOpen(false)}>
        Continuer
      </Button>
      <Button
        onClick={() => {
          setQuitOpen(false)
          void abandon()
        }}
      >
        <LogOut size={15} /> Abandonner
      </Button>
    </>
  )
  // Mobile : bottom sheet (cohérent avec les autres modales de l'arène) ; desktop : dialog.
  const quitDialog = isTouch ? (
    <BottomSheet
      open={quitOpen}
      onOpenChange={(next) => {
        if (!next) setQuitOpen(false)
      }}
      title="Abandonner la partie ?"
      description="Tu déclareras forfait et la partie se terminera immédiatement."
      detents={SHEET_DETENTS.confirm}
      closeLabel="Fermer"
      surfaceStyle={{
        background: TOKEN.duelBg,
        color: TOKEN.duelSurface,
        borderColor: "transparent",
      }}
      footerStyle={{
        background: TOKEN.duelBg,
        borderTopColor: TOKEN.border,
      }}
      footer={<div className="flex w-full gap-2 [&>button]:flex-1">{quitActions}</div>}
    >
      {quitContent}
    </BottomSheet>
  ) : (
    <AppDialog
      open={quitOpen}
      onClose={() => setQuitOpen(false)}
      title="Abandonner la partie ?"
      sub="Tu déclareras forfait et la partie se terminera immédiatement."
      footer={quitActions}
    >
      {quitContent}
    </AppDialog>
  )

  if (scene.kind === "vs" || scene.kind === "swoosh") {
    return (
      <div
        className="qu-immersive-safe relative flex h-full flex-col overflow-hidden"
        style={{ background: TOKEN.duelBg }}
      >
        <button
          onClick={() => setQuitOpen(true)}
          aria-label="Abandonner la partie"
          className="absolute top-[calc(0.875rem+env(safe-area-inset-top))] left-4 z-20 flex h-8 items-center gap-1.5 rounded-md border border-border bg-foreground/5 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut size={14} /> Abandonner
        </button>
        <VersusScreen
          player={{
            name: playerName,
            title: titleForLevel(playerLevel),
            level: playerLevel,
            country: me?.country ?? undefined,
            userId: playerAvatar.userId,
            avatarOptions: playerAvatar.avatarOptions,
          }}
          opponent={{
            name: opponentName,
            color: opponentColor,
            userId: opponentAvatar.userId,
            avatarOptions: opponentAvatar.avatarOptions,
          }}
          topic={{
            name: topicName,
            emoji: topic?.emoji ?? undefined,
            color: topic?.color ?? undefined,
            imageUrl: topic?.imageUrl ?? undefined,
          }}
        />
        {scene.kind === "swoosh" && (
          <CircleTransition elapsedMs={scene.elapsedMs} />
        )}
        {quitDialog}
      </div>
    )
  }

  if (scene.kind === "result") {
    // Une partie annulée n'a pas d'issue sportive : écran dédié (plus de faux « Égalité 0-0 »).
    if (game.status === "CANCELED") {
      const title =
        game.canceledReason === "NO_SHOW_START"
          ? "Adversaire absent"
          : game.canceledReason === "GAME_EXPIRED"
            ? "Partie expirée"
            : "Partie annulée"
      const description =
        game.canceledReason === "NO_SHOW_START"
          ? "La partie n'a jamais démarré : un joueur ne s'est pas présenté."
          : game.canceledReason === "GAME_EXPIRED"
            ? "La partie a expiré sans être terminée."
            : "Un joueur a quitté la partie avant la fin."
      return (
        <div
          className="qu-immersive-safe grid h-full place-items-center p-6"
          style={{ background: TOKEN.duelBg }}
        >
          <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
            <p className="font-heading text-lg font-bold">{title}</p>
            <p className="text-sm" style={{ color: TOKEN.mutedFg }}>
              {description}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => navigate(`/topics/${topicId}`)}>
                Retour au sujet
              </Button>
              <Button
                variant="outline"
                disabled={startDuel.isPending || startMatchmaking.isPending}
                onClick={() => {
                  if (opponent === "HUMAN") {
                    startMatchmaking.mutate(topicId as string)
                  } else {
                    startDuel.mutate({
                      topicId: topicId as string,
                      difficulty:
                        (game.botDifficulty as BotDifficulty) ?? "NORMAL",
                    })
                  }
                }}
              >
                {opponent === "HUMAN" ? "Nouvel adversaire" : "Rejouer"}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    const won = game.winnerId != null && game.winnerId === userId
    const outcome: "win" | "loss" | "draw" =
      game.winnerId == null ? "draw" : won ? "win" : "loss"
    const opponentLevel = opponentProfileQuery.data?.progression.level ?? null

    return (
      <>
        <ResultScreen
          playerName={playerName}
          opponentName={opponentName}
          playerAvatar={playerAvatar}
          opponentAvatar={opponentAvatar}
          playerLevel={resultQuery.data?.progression.level ?? playerLevel}
          opponentLevel={resultQuery.data?.opponentLevel ?? opponentLevel}
          playerTitle={
            resultQuery.data?.progression.title ?? me?.progression.title ?? ""
          }
          opponentTitle={
            resultQuery.data?.opponentTitle ??
            opponentProfileQuery.data?.progression.title ??
            ""
          }
          scores={{ you: myScore, them: theirScore }}
          outcome={outcome}
          topicName={topicName}
          result={resultQuery.data ?? null}
          botGame={opponent === "BOT"}
          onChallengeRematch={() => {
            if (opponentId) {
              createChallenge.mutate({ topicId: topicId as string, opponentId })
            }
          }}
          rematchPending={createChallenge.isPending}
          onOpenReview={() => setReviewOpen(true)}
          canReview={canReview}
          onNewOpponent={() => startMatchmaking.mutate(topicId as string)}
          onReplayBot={() =>
            startDuel.mutate({
              topicId: topicId as string,
              difficulty: (game.botDifficulty as BotDifficulty) ?? "NORMAL",
            })
          }
          newOpponentPending={startMatchmaking.isPending}
          replayPending={startDuel.isPending}
          onExit={exitResult}
        />
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
      </>
    )
  }

  const gauge: { you: GaugeState; them: GaugeState } = {
    you:
      scene.kind === "reveal" && correctAnswer != null
        ? roundChoice === correctAnswer
          ? "correct"
          : "wrong"
        : yourCorrect === true
          ? "correct"
          : yourCorrect === false
            ? "wrong"
            : "idle",
    them:
      scene.kind === "reveal" && correctAnswer != null
        ? roundTheirChoice === correctAnswer
          ? "correct"
          : "wrong"
        : theirCorrect === true
          ? "correct"
          : theirCorrect === false
            ? "wrong"
            : "idle",
  }

  return (
    <div
      className="qu-immersive-safe flex h-full flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <MatchHeader
        playerName={playerName}
        opponentName={opponentName}
        playerAvatar={playerAvatar}
        opponentAvatar={opponentAvatar}
        scores={{ you: myScore, them: theirScore }}
        scoreStates={{ you: gauge.you, them: gauge.them }}
        timeLeft={timeLeftDisplay}
        gain={gain}
        round={roundIndex}
        firstAnswerPct={firstAnswerPctValue}
        onQuit={() => setQuitOpen(true)}
      />
      <div
        className="mx-auto flex w-full max-w-(--duel-stage-w) flex-1"
        style={{
          minHeight: 0,
          overflow: "hidden",
          paddingTop: "clamp(4px, 1.2dvh, 8px)",
          paddingBottom: "clamp(8px, 3dvh, 26px)",
        }}
      >
        <ScoreGauge
          score={myScore}
          state={gauge.you}
          side="left"
          label={`Score de ${playerName}`}
        />
        {scene.kind === "roundIntro" ? (
          <RoundIntro
            topicName={topicName}
            topicEmoji={topic?.emoji ?? undefined}
            topicImageUrl={topic?.imageUrl ?? undefined}
            categoryLabel={
              topic
                ? categoryLabel(
                    topic.category ?? "",
                    topic.categoryLabel ?? undefined
                  )
                : ""
            }
            categoryColor={
              topic ? categoryColor(topic.category ?? "") : TOKEN.primary
            }
            round={scene.round}
            bonus={scene.bonus}
            elapsedMs={scene.elapsedMs}
          />
        ) : answers.length > 0 && questionText ? (
          <QuestionBody
            key={roundIndex}
            questionText={questionText}
            imageUrl={imageUrl}
            difficulty={difficulty}
            answers={answers}
            phase={scene.kind === "reveal" ? "reveal" : "question"}
            yourPick={yourPick}
            theirPick={theirPick}
            correctAnswer={correctAnswer}
            yourCorrect={yourCorrect}
            pendingChoice={pendingChoice}
            inputEnabled={isAnswerable}
            onAnswer={handleAnswer}
            round={roundIndex}
            instant={joinedLate}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </div>
        )}
        <ScoreGauge
          score={theirScore}
          state={gauge.them}
          side="right"
          label={`Score de ${opponentName}`}
        />
      </div>
      {quitDialog}
    </div>
  )
}
