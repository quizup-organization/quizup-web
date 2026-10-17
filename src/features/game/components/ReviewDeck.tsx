import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronLeft, ChevronRight, Flag } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import type { AvatarIdentity } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import { localizedQuestion } from "../domain/game"
import { buildReviewRounds } from "../domain/review"
import type { GameState } from "../domain/game"
import { ReportQuestionDialog } from "./report/ReportQuestionDialog"
import { ReviewQuestion } from "./ReviewQuestion"

interface ReviewDeckProps {
  game: GameState
  userId: string
  opponentId: string | null
  playerName: string
  opponentName: string
  playerAvatar?: AvatarIdentity
  opponentAvatar?: AvatarIdentity
  language: string
  /** Libellé d'accessibilité de la région carousel. */
  label?: string
  className?: string
  /**
   * Notifie l'ouverture/fermeture du formulaire de signalement. La surface qui héberge la revue
   * (bottom sheet tactile) en profite pour se **suspendre** pendant l'ouverture du sheet de
   * signalement, qui est un second bottom sheet frère (pas imbriqué).
   */
  onReportOpenChange?: (open: boolean) => void
}

/**
 * Revue des questions d'un duel terminé : carousel **shadcn natif** (embla) dont chaque slide
 * rejoue une manche ({@link ReviewQuestion}, composition d'arène figée). Une **seule** source de
 * rendu pour les deux surfaces — inline dans la colonne droite desktop et dans la bottom sheet
 * tactile — le contenu est donc strictement identique de part et d'autre. Navigation par glisser
 * (embla), flèches clavier, ou boutons libellés « Précédent » / « Suivant » du pied, avec barre de
 * progression et compteur.
 */
export function ReviewDeck({
  game,
  userId,
  opponentId,
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  language,
  label,
  className,
  onReportOpenChange,
}: ReviewDeckProps) {
  const { t } = useTranslation()
  const rounds = useMemo(
    () => buildReviewRounds(game, userId, opponentId),
    [game, userId, opponentId]
  )
  const [api, setApi] = useState<CarouselApi>()
  const [index, setIndex] = useState(0)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportedQuestionIds, setReportedQuestionIds] = useState<Set<string>>(
    new Set()
  )
  const total = rounds.length

  useEffect(() => {
    if (!api) return
    const onSelect = () => setIndex(api.selectedScrollSnap())
    onSelect()
    api.on("select", onSelect)
    api.on("reInit", onSelect)
    return () => {
      api.off("select", onSelect)
      api.off("reInit", onSelect)
    }
  }, [api])

  if (total === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm" style={{ color: TOKEN.duelSurfaceMuted }}>
          {t("game.review.empty")}
        </p>
      </div>
    )
  }

  const safeIndex = Math.min(index, total - 1)
  const navStyle = { color: TOKEN.duelSurface } as const
  const currentRound = rounds[safeIndex]
  const currentQuestionId = currentRound?.round.questionId ?? null
  const currentLocalized = currentRound
    ? localizedQuestion(currentRound.round, language)
    : { questionText: "", answers: {} }
  const alreadyReported =
    currentQuestionId != null && reportedQuestionIds.has(currentQuestionId)

  const openReport = () => {
    setReportOpen(true)
    onReportOpenChange?.(true)
  }
  const closeReport = () => {
    setReportOpen(false)
    onReportOpenChange?.(false)
  }

  return (
    <div
      className={cn(
        "qu-review-deck flex h-full min-h-0 w-full flex-col",
        className
      )}
      style={{ gap: "clamp(6px, 1.4dvh, 12px)" }}
    >
      <Carousel
        setApi={setApi}
        opts={{ align: "start" }}
        aria-label={label}
        className="min-h-0 flex-1"
      >
        <CarouselContent className="h-full items-stretch">
          {rounds.map((review) => (
            <CarouselItem key={review.index} className="h-full">
              <ReviewQuestion
                review={review}
                userId={userId}
                opponentId={opponentId}
                playerName={playerName}
                opponentName={opponentName}
                playerAvatar={playerAvatar}
                opponentAvatar={opponentAvatar}
                language={language}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div
        className="flex shrink-0 flex-col"
        style={{
          gap: "clamp(6px, 1.4dvh, 12px)",
          padding: "0 clamp(12px, 4vw, 22px) clamp(4px, 1dvh, 10px)",
        }}
      >
        <div
          className="flex items-center gap-2"
          style={{ padding: "0 clamp(12px, 4vw, 22px)" }}
        >
          <div
            className="h-[3px] flex-1 overflow-hidden rounded-full"
            style={{ background: TOKEN.gaugeTrack }}
          >
            <div
              style={{
                width: `${((safeIndex + 1) / total) * 100}%`,
                height: "100%",
                background: TOKEN.timer,
                transition: "width .3s ease",
              }}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              alreadyReported
                ? t("game.report.reported")
                : t("game.report.aria")
            }
            title={
              alreadyReported
                ? t("game.report.reported")
                : t("game.report.action")
            }
            disabled={!currentQuestionId || alreadyReported}
            onClick={openReport}
            style={{ color: TOKEN.duelSurfaceMuted }}
          >
            {alreadyReported ? <Check size={16} /> : <Flag size={16} />}
          </Button>
        </div>
        <div
          className="flex items-center justify-between"
          style={{ gap: "clamp(6px, 2vw, 14px)" }}
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={safeIndex <= 0}
            onClick={() => api?.scrollPrev()}
            style={navStyle}
          >
            <ChevronLeft size={18} />
            {t("game.review.previous")}
          </Button>
          <span
            className="flex-1 text-center"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: TOKEN.duelSurface,
            }}
          >
            {t("game.review.counter", {
              current: safeIndex + 1,
              total,
            })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={safeIndex >= total - 1}
            onClick={() => api?.scrollNext()}
            style={navStyle}
          >
            {t("game.review.next")}
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {currentQuestionId && (
        <ReportQuestionDialog
          open={reportOpen}
          onClose={closeReport}
          gameId={game.gameId}
          questionId={currentQuestionId}
          questionText={currentLocalized.questionText}
          imageUrl={currentRound?.round.imageUrl}
          language={language}
          onReported={() =>
            setReportedQuestionIds((current) => {
              const next = new Set(current)
              next.add(currentQuestionId)
              return next
            })
          }
        />
      )}
    </div>
  )
}
