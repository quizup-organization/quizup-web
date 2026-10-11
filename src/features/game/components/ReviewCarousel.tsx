import { useTranslation } from "react-i18next"
import { Carousel } from "@/components/arc/carousel/carousel"
import type { AvatarIdentity } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import type { ReviewRound } from "../domain/review"
import { ReviewQuestion } from "./ReviewQuestion"

interface ReviewCarouselProps {
  rounds: ReviewRound[]
  userId: string
  opponentId: string | null
  playerName: string
  opponentName: string
  playerAvatar?: AvatarIdentity
  opponentAvatar?: AvatarIdentity
  language: string
}

/**
 * Revue des questions d'un duel terminé sur **desktop** : un carousel Arc UI où chaque slide est
 * le replay exact d'une manche ({@link ReviewQuestion}). Slide active centrée, voisines réduites
 * et estompées ; navigation par glisser, molette, flèches ou contrôles.
 */
export function ReviewCarousel({
  rounds,
  userId,
  opponentId,
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  language,
}: ReviewCarouselProps) {
  const { t } = useTranslation()
  if (rounds.length === 0) {
    return (
      <p className="text-sm" style={{ color: TOKEN.duelSurfaceMuted }}>
        {t("game.review.empty")}
      </p>
    )
  }

  return (
    <Carousel
      label={t("game.review.carouselLabel")}
      className="qu-review-carousel w-full"
      slideSize="100cqw"
      slideLabel={(index, count) =>
        t("game.review.slideLabel", { current: index + 1, total: count })
      }
      wheelNavigation
    >
      {rounds.map((review) => (
        <ReviewQuestion
          key={review.index}
          review={review}
          userId={userId}
          opponentId={opponentId}
          playerName={playerName}
          opponentName={opponentName}
          playerAvatar={playerAvatar}
          opponentAvatar={opponentAvatar}
          language={language}
          compact
        />
      ))}
    </Carousel>
  )
}
