import type { TopicCard } from "@/features/topics/domain/topic"
import { useTranslation } from "react-i18next"
import { ScrollArea } from "@/components/arc/scroll-area/scroll-area"
import { TopicTile } from "./TopicTile"

/**
 * Bandeau horizontal de sujets en **tuiles springboard**, à toutes les tailles — largeur
 * `30vw` en compact (~3 par ligne, comme la grille), puis calée sur la taille des tuiles de
 * grille (`w-28` en tablette, `w-32` en desktop). Scroll natif géré par l'Arc `ScrollArea`
 * (barre fine en surimpression + fondus d'extrémité ; la molette verticale fait défiler la page).
 */
export function TopicCarousel({
  topics,
  onOpen,
  label,
}: {
  topics: TopicCard[]
  onOpen: (topicId: string) => void
  /** Nom accessible du bandeau (une région par carrousel sur l'accueil). */
  label?: string
}) {
  const { t } = useTranslation()

  return (
    <ScrollArea
      orientation="horizontal"
      label={label ?? t("topics.carousel.region")}
      viewportClassName="flex gap-2 pb-1"
    >
      {topics.map((topic) => (
        <div
          key={topic.topicId}
          className="w-[30vw] shrink-0 tablet:w-28 desktop:w-32"
        >
          <TopicTile topic={topic} onOpen={onOpen} />
        </div>
      ))}
    </ScrollArea>
  )
}
