import { useMemo, useRef, useState, type TouchEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AvatarIdentity } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import {
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

/** Seuil (px) de glissé vertical vers le bas pour fermer le panneau. */
const DISMISS_THRESHOLD = 120

function toAnswerList(
  answers: Record<string, string>
): { choice: string; label: string }[] {
  return Object.keys(answers)
    .sort()
    .map((choice) => ({ choice, label: answers[choice] ?? "" }))
}

/**
 * Revue des questions d'un duel terminé : panneau plein écran glissé depuis le bas
 * (framer-motion) qui rejoue **exactement** la composition de l'arène, figée en phase
 * `reveal` — même `MatchHeader`, mêmes jauges et même `QuestionBody`, chrono et scores
 * cumulés arrêtés. Navigation par flèches ←/→ ou balayage horizontal. Aucun fetch :
 * tout est dérivé de l'état de partie déjà chargé par l'arène.
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 32, stiffness: 320 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(_event, info) => {
            if (info.offset.y > DISMISS_THRESHOLD) close()
          }}
          className="qu-immersive-safe fixed inset-0 z-40 flex h-full flex-col"
          style={{ background: TOKEN.duelBg, color: TOKEN.duelSurface }}
        >
          <div
            className="shrink-0"
            style={{
              padding: "clamp(8px, 1.8dvh, 14px) clamp(12px, 4vw, 22px) 0",
            }}
          >
            <div className="relative flex items-center justify-center">
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: TOKEN.duelSurface,
                }}
              >
                QUESTIONS
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer la revue"
                className="qu-btn absolute right-0 flex size-8 items-center justify-center rounded-full"
                style={{ color: TOKEN.duelSurfaceMuted }}
              >
                <X size={18} />
              </button>
            </div>
            <div
              className="mt-2 h-[3px] w-full overflow-hidden rounded-full"
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
          </div>

          <div
            className="flex min-h-0 flex-1 flex-col"
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
                    firstAnswerPct={null}
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
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-6">
                  <p
                    className="text-sm"
                    style={{ color: TOKEN.duelSurfaceMuted }}
                  >
                    Aucune question à revoir.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              gap: "clamp(6px, 2vw, 14px)",
              padding: "clamp(6px, 1.4dvh, 12px) clamp(12px, 4vw, 22px)",
            }}
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}
