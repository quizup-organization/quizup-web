import { useMemo, useRef, useState, type TouchEvent } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { BottomSheet } from "@/components/arc/bottom-sheet/bottom-sheet"
import { Button } from "@/components/ui/button"
import type { AvatarIdentity } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import { SHEET_DETENTS } from "@/shared/theme/sheets"
import { buildReviewRounds } from "../domain/review"
import type { GameState } from "../domain/game"
import { ReviewQuestion } from "./ReviewQuestion"

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

/**
 * Revue des questions d'un duel terminé, en **bottom sheet Arc UI** (tactile) : replay exact de
 * l'arène via {@link ReviewQuestion} (chrono et scores figés). Navigation par balayage horizontal
 * ou flèches ; en desktop, la même revue est rendue par le carousel de la page résultat.
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
    [game, userId, opponentId],
  )
  const total = reviewRounds.length
  const safeIndex = Math.min(index, Math.max(0, total - 1))
  const current = reviewRounds[safeIndex] ?? null

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

  return (
    <BottomSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close()
      }}
      title="Questions"
      hideTitle
      hideClose
      detents={SHEET_DETENTS.review}
      closeLabel="Fermer la revue"
      className="mx-auto"
      surfaceStyle={{
        background: TOKEN.duelBg,
        color: TOKEN.duelSurface,
        borderColor: "transparent",
        // Plus large que le plafond par défaut (36rem) quand la place le permet : en tablette
        // et en paysage, le replay d'arène respire au lieu de rester dans une colonne étroite.
        width: "min(100%, 52rem)",
      }}
      bodyStyle={{ padding: 0 }}
      footerStyle={{
        background: TOKEN.duelBg,
        borderTopColor: TOKEN.border,
      }}
      footer={footer}
    >
      <div
        className="flex h-full min-h-0 flex-col"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {current ? (
          <ReviewQuestion
            review={current}
            userId={userId}
            opponentId={opponentId}
            playerName={playerName}
            opponentName={opponentName}
            playerAvatar={playerAvatar}
            opponentAvatar={opponentAvatar}
            language={language}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-sm" style={{ color: TOKEN.duelSurfaceMuted }}>
              Aucune question à revoir.
            </p>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
