import type { CSSProperties } from "react"
import { useTranslation } from "react-i18next"
import type { AvatarIdentity } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import { useReviewQuestion } from "../hooks/useReviewQuestion"
import type { ReviewRound } from "../domain/review"
import { MatchHeader } from "./MatchHeader"
import { QuestionBody } from "./QuestionBody"
import { ScoreGauge } from "./ScoreGauge"

interface ReviewQuestionProps {
  review: ReviewRound
  userId: string
  opponentId: string | null
  playerName: string
  opponentName: string
  playerAvatar?: AvatarIdentity
  opponentAvatar?: AvatarIdentity
  language: string
  /**
   * Variante **carousel desktop** : hauteur fixe et tokens compacts (questions/réponses plus
   * petits), jauges latérales masquées (les scores restent dans l'en-tête) — le replay tient
   * dans la colonne étroite.
   */
  compact?: boolean
}

/** Tokens compacts de la slide de carousel : mêmes composants que l'arène, tailles réduites. */
const COMPACT_VARS = {
  height: "100%",
  "--duel-question-size": "18px",
  "--duel-question-size-image": "16px",
  "--duel-answers-w": "100%",
  "--duel-answer-grid-h": "none",
  "--duel-answer-card-h": "44px",
  "--duel-image-max-h": "clamp(80px, 16dvh, 150px)",
  "--duel-ring-size": "64px",
  "--duel-stage-w": "100%",
} as CSSProperties

/**
 * Replay **exact** d'une manche de duel, figé en phase `reveal` : même `MatchHeader`, mêmes
 * jauges et même `QuestionBody`, chrono et scores arrêtés. Partagé par le bottom sheet tactile
 * (revue mobile) et les slides du carousel desktop — une seule source de rendu.
 */
export function ReviewQuestion({
  review,
  userId,
  opponentId,
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  language,
  compact = false,
}: ReviewQuestionProps) {
  const { t } = useTranslation()
  const view = useReviewQuestion({ review, userId, opponentId, language })

  return (
    <div
      className={
        compact ? "flex min-h-0 flex-col" : "flex h-full min-h-0 flex-col"
      }
      style={{
        padding: compact
          ? "clamp(6px, 1dvh, 10px) clamp(6px, 1.6vw, 10px)"
          : "clamp(8px, 1.6dvh, 14px) clamp(12px, 4vw, 22px)",
        ...(compact ? COMPACT_VARS : {}),
      }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl"
        style={{ border: `1px solid ${TOKEN.border}` }}
      >
        <MatchHeader
          playerName={playerName}
          opponentName={opponentName}
          playerAvatar={playerAvatar}
          opponentAvatar={opponentAvatar}
          scores={review.scoresAfter}
          scoreStates={view.gauge}
          timeLeft={view.timeLeft}
          gain={null}
          round={review.index}
          firstAnswerPct={view.firstAnswerPct}
          instant
          playerNote={view.playerNote}
          opponentNote={view.opponentNote}
          playerFirst={view.first?.playerId === userId}
          opponentFirst={
            opponentId != null && view.first?.playerId === opponentId
          }
        />
        <div
          className="flex flex-1"
          style={{
            minHeight: 0,
            overflow: "hidden",
            paddingTop: "clamp(4px, 1.2dvh, 8px)",
            paddingBottom: compact
              ? "clamp(4px, 1.2dvh, 10px)"
              : "clamp(8px, 3dvh, 26px)",
          }}
        >
          {!compact && (
            <ScoreGauge
              score={review.scoresAfter.you}
              state={view.gauge.you}
              side="left"
              label={t("game.arena.scoreOf", { name: playerName })}
              instant
            />
          )}
          {view.answers.length > 0 && view.questionText ? (
            <QuestionBody
              key={review.index}
              questionText={view.questionText}
              imageUrl={review.round.imageUrl}
              answers={view.answers}
              phase="reveal"
              yourPick={view.yourPick}
              theirPick={view.theirPick}
              correctAnswer={view.correctAnswer}
              yourCorrect={view.yourCorrect}
              inputEnabled={false}
              onAnswer={() => undefined}
              round={review.index}
              instant
              answersLayout={compact ? "grid" : "auto"}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm" style={{ color: TOKEN.duelSurfaceMuted }}>
                {t("common.app.loading")}
              </p>
            </div>
          )}
          {!compact && (
            <ScoreGauge
              score={review.scoresAfter.them}
              state={view.gauge.them}
              side="right"
              label={t("game.arena.scoreOf", { name: opponentName })}
              instant
            />
          )}
        </div>
      </div>
    </div>
  )
}
