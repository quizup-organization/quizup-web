import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CloseButton } from "@/shared/components/close-button"
import { BottomSheet } from "@/components/arc/bottom-sheet/bottom-sheet"
import { Button } from "@/components/ui/button"
import { useIsTouchLayout } from "@/shared/hooks/use-device"
import type { AvatarIdentity } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import { SHEET_DETENTS } from "@/shared/theme/sheets"
import {
  firstAnswerPct,
  firstResponder,
  frozenTimeLeft,
  localizedQuestion,
  type GameState,
} from "../domain/game"
import { buildReviewRounds } from "../domain/review"
import { MatchHeader } from "./MatchHeader"
import { QuestionBody } from "./QuestionBody"
import { ScoreGauge, type GaugeState } from "./ScoreGauge"

interface QuestionReviewDialogProps {
  open: boolean
  onClose: () => void
  game: GameState
  userId: string
  opponentId: string | null
  playerName: string
  opponentName: string
  playerAvatar?: AvatarIdentity
  opponentAvatar?: AvatarIdentity
  language: string
}

/** Seuil (px) de balayage horizontal pour changer de question. */
const SWIPE_THRESHOLD = 40

/** Temps de réponse en secondes, à une décimale (« 3,2 s »). */
function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace(".", ",")} s`
}

function toAnswerList(
  answers: Record<string, string>
): { choice: string; label: string }[] {
  return Object.keys(answers)
    .sort()
    .map((choice) => ({ choice, label: answers[choice] ?? "" }))
}

/**
 * Revue des questions d'un duel terminé : replay **exact** de l'arène, figé en phase `reveal`
 * (même `MatchHeader`, mêmes jauges et même `QuestionBody`, chrono et scores arrêtés).
 * Navigation par flèches ←/→ (clavier en desktop) ou balayage horizontal (tactile).
 * Conteneur : **bottom sheet** Arc UI en tactile, **modale centrée** en desktop.
 * Aucun fetch : tout est dérivé de l'état de partie déjà chargé par l'arène.
 */
export function QuestionReviewDialog({
  open,
  onClose,
  game,
  userId,
  opponentId,
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  language,
}: QuestionReviewDialogProps) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const isTouch = useIsTouchLayout()

  /** Ferme le panneau et réarme la première question pour la prochaine ouverture. */
  const close = () => {
    setIndex(0)
    onClose()
  }

  const reviewRounds = useMemo(
    () => buildReviewRounds(game, userId, opponentId),
    [game, userId, opponentId]
  )
  const total = reviewRounds.length
  const safeIndex = Math.min(index, Math.max(0, total - 1))
  const current = reviewRounds[safeIndex] ?? null
  const localized = useMemo(
    () => localizedQuestion(current?.round, language),
    [current, language]
  )
  const answers = useMemo(() => toAnswerList(localized.answers), [localized])

  const previous = () => setIndex(Math.max(0, safeIndex - 1))
  const next = () => setIndex(Math.min(total - 1, safeIndex + 1))

  // Desktop : navigation clavier ←/→ et Échap pour fermer.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setIndex((current) => Math.max(0, current - 1))
      } else if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(total - 1, current + 1))
      } else if (event.key === "Escape") {
        setIndex(0)
        onClose()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, total, onClose])

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }
  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStartX.current
    touchStartX.current = null
    if (start == null) return
    const end = event.changedTouches[0]?.clientX ?? start
    const delta = end - start
    if (Math.abs(delta) <= SWIPE_THRESHOLD) return
    if (delta < 0) next()
    else previous()
  }

  const yourAnswer = current?.round.playerAnswers[userId] ?? null
  const theirAnswer = opponentId
    ? (current?.round.playerAnswers[opponentId] ?? null)
    : null
  const yourPick = yourAnswer?.choice ?? null
  const theirPick = theirAnswer?.choice ?? null
  const correctAnswer = current?.round.correctAnswer ?? null

  // Même règle que l'arène en phase `reveal` : le choix égal à la bonne réponse est correct,
  // tous les autres (dont l'absence de réponse) sont fautifs.
  const gauge: { you: GaugeState; them: GaugeState } = {
    you:
      correctAnswer != null
        ? yourPick === correctAnswer
          ? "correct"
          : "wrong"
        : yourAnswer?.correct === true
          ? "correct"
          : yourAnswer?.correct === false
            ? "wrong"
            : "idle",
    them:
      correctAnswer != null
        ? theirPick === correctAnswer
          ? "correct"
          : "wrong"
        : theirAnswer?.correct === true
          ? "correct"
          : theirAnswer?.correct === false
            ? "wrong"
            : "idle",
  }

  // Repère « premier à répondre » sur la barre du chrono, et temps de réponse de chaque joueur
  // affiché sous son avatar. Figés, comme le reste de la revue.
  const frozenFirstPct = current ? firstAnswerPct(current.round) : null
  const first = firstResponder(current?.round ?? null, userId, opponentId)
  const playerNote =
    current?.yourTimeMs != null ? formatSeconds(current.yourTimeMs) : undefined
  const opponentNote =
    current?.theirTimeMs != null
      ? formatSeconds(current.theirTimeMs)
      : undefined

  const description =
    total > 0 ? `Question ${safeIndex + 1} sur ${total}` : undefined

  const footer = (
    <div className="flex flex-col" style={{ gap: "clamp(6px, 1.4dvh, 12px)" }}>
      <div
        className="h-[3px] w-full overflow-hidden rounded-full"
        style={{ background: TOKEN.gaugeTrack }}
      >
        <div
          style={{
            width: `${total === 0 ? 0 : ((safeIndex + 1) / total) * 100}%`,
            height: "100%",
            background: TOKEN.timer,
            transition: "width .3s ease",
          }}
        />
      </div>
      <div
        className="flex items-center justify-center"
        style={{ gap: "clamp(6px, 2vw, 14px)" }}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Question précédente"
          disabled={total === 0 || safeIndex <= 0}
          onClick={previous}
          style={{ color: TOKEN.duelSurface }}
        >
          <ChevronLeft size={18} />
        </Button>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: TOKEN.duelSurface,
          }}
        >
          QUESTION {safeIndex + 1} : {total}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Question suivante"
          disabled={total === 0 || safeIndex >= total - 1}
          onClick={next}
          style={{ color: TOKEN.duelSurface }}
        >
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  )

  const body = (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{
        padding: "clamp(8px, 1.6dvh, 14px) clamp(12px, 4vw, 22px)",
      }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl"
        style={{ border: `1px solid ${TOKEN.border}` }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {current ? (
          <>
            <MatchHeader
              playerName={playerName}
              opponentName={opponentName}
              playerAvatar={playerAvatar}
              opponentAvatar={opponentAvatar}
              scores={current.scoresAfter}
              scoreStates={gauge}
              timeLeft={frozenTimeLeft(current.round)}
              gain={null}
              round={current.index}
              firstAnswerPct={frozenFirstPct}
              instant
              playerNote={playerNote}
              opponentNote={opponentNote}
              playerFirst={first?.playerId === userId}
              opponentFirst={
                opponentId != null && first?.playerId === opponentId
              }
            />
            <div
              className="flex flex-1"
              style={{
                minHeight: 0,
                overflow: "hidden",
                paddingTop: "clamp(4px, 1.2dvh, 8px)",
                paddingBottom: "clamp(8px, 3dvh, 26px)",
              }}
            >
              <ScoreGauge
                score={current.scoresAfter.you}
                state={gauge.you}
                side="left"
                label={`Score de ${playerName}`}
                instant
              />
              {answers.length > 0 && localized.questionText ? (
                <QuestionBody
                  key={current.index}
                  questionText={localized.questionText}
                  imageUrl={current.round.imageUrl}
                  difficulty={current.round.difficulty}
                  answers={answers}
                  phase="reveal"
                  yourPick={yourPick}
                  theirPick={theirPick}
                  correctAnswer={correctAnswer}
                  yourCorrect={yourAnswer?.correct ?? null}
                  inputEnabled={false}
                  onAnswer={() => undefined}
                  round={current.index}
                  instant
                />
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <p
                    className="text-sm"
                    style={{ color: TOKEN.duelSurfaceMuted }}
                  >
                    Chargement…
                  </p>
                </div>
              )}
              <ScoreGauge
                score={current.scoresAfter.them}
                state={gauge.them}
                side="right"
                label={`Score de ${opponentName}`}
                instant
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-sm" style={{ color: TOKEN.duelSurfaceMuted }}>
              Aucune question à revoir.
            </p>
          </div>
        )}
      </div>
    </div>
  )

  if (isTouch) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) close()
        }}
        title="Questions"
        description={description}
        detents={SHEET_DETENTS.review}
        closeLabel="Fermer la revue"
        surfaceStyle={{
          background: TOKEN.duelBg,
          color: TOKEN.duelSurface,
          borderColor: "transparent",
        }}
        bodyStyle={{ padding: 0 }}
        footerStyle={{
          background: TOKEN.duelBg,
          borderTopColor: TOKEN.border,
        }}
        footer={footer}
      >
        {body}
      </BottomSheet>
    )
  }

  if (!open) return null

  return (
    // Overlay ancré au mockup tablette (`[data-slot=duel-frame]`, `relative`) : la revue
    // reste dans l'écran de jeu au lieu d'une modale qui flotte sur la page.
    <div
      data-slot="review-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Revue des questions"
      className="absolute inset-0 z-50 flex flex-col bg-black/60 p-3 backdrop-blur-sm"
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          background: TOKEN.duelBg,
          borderColor: TOKEN.border,
          color: TOKEN.duelSurface,
        }}
      >
        <div
          className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3"
          style={{ borderColor: TOKEN.border }}
        >
          <div className="min-w-0">
            <h2 className="font-heading text-base font-medium">Questions</h2>
            <p className="text-xs" style={{ color: TOKEN.duelSurfaceMuted }}>
              {description} · navigation ←/→
            </p>
          </div>
          <CloseButton aria-label="Fermer la revue" onClick={close} />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">{body}</div>

        <div
          className="shrink-0 border-t px-4 py-2.5"
          style={{ background: TOKEN.duelBg, borderColor: TOKEN.border }}
        >
          {footer}
        </div>
      </div>
    </div>
  )
}
