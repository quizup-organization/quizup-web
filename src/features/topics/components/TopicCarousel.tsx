import type { TopicCard } from "@/features/topics/domain/topic"
import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { ScrollArea } from "@/components/arc/scroll-area/scroll-area"
import { TopicMediaCard, type TopicMediaFormat } from "./TopicMediaCard"

/** Largeur unique des cartes de l'Accueil, quel que soit le format. */
const CARD_WIDTH = "w-[58vw] max-w-[230px] tablet:w-48 desktop:w-52"

/**
 * Bandeau horizontal de sujets de l'Accueil, en cartes façon FranceTV — **même largeur** pour
 * tous les formats : cartes portrait `poster` (Top 10, 3:5 en compact puis affiche 2:3 avec le
 * titre sous l'affiche) ou cartes paysage 16:9 (`landscape`). Avec `ranked` sur un rail
 * `poster`, chaque affiche reçoit son rang (1-based) dans une gouttière gauche ; la carte
 * chevauche légèrement le chiffre. Scroll natif géré par l'Arc `ScrollArea` (barre fine en
 * surimpression, 12 px réservés sous les cartes).
 */
export function TopicCarousel({
  topics,
  onOpen,
  label,
  format = "landscape",
  ranked = false,
}: {
  topics: TopicCard[]
  onOpen: (topicId: string) => void
  /** Nom accessible du bandeau (une région par carrousel sur l'accueil). */
  label?: string
  /** `poster` : cartes 3:5 compact / affiches 2:3 du Top 10 ; `landscape` : cartes 16:9. */
  format?: TopicMediaFormat
  /** Affiche le classement 1 → n à gauche des affiches (Top 10 des plus joués). */
  ranked?: boolean
}) {
  const { t } = useTranslation()
  const withRank = ranked && format === "poster"

  return (
    <ScrollArea
      orientation="horizontal"
      label={label ?? t("topics.carousel.region")}
      fade={withRank ? 12 : 28}
      viewportClassName={withRank ? "flex gap-6 pl-2 pb-3" : "flex gap-4 pb-3"}
    >
      {topics.map((topic, index) => {
        const rank = withRank ? index + 1 : undefined
        return (
          <div
            key={topic.topicId}
            className={cn(
              "shrink-0",
              rank !== undefined && "pl-12 tablet-up:pl-14"
            )}
          >
            <TopicMediaCard
              topic={topic}
              onOpen={onOpen}
              format={format}
              rank={rank}
              priority={index === 0}
              className={CARD_WIDTH}
            />
          </div>
        )
      })}
    </ScrollArea>
  )
}
