import type { TopicCard } from "@/features/topics/domain/topic"
import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { ScrollArea } from "@/components/arc/scroll-area/scroll-area"
import { TopicPosterCard } from "./TopicPosterCard"

/**
 * Bandeau horizontal de sujets en **affiches portrait 2:3** (Accueil, style streaming) —
 * largeur `62vw` plafonnée à 250 px en compact, puis `w-48` en tablette et `w-52` en desktop.
 * Avec `ranked`, chaque affiche reçoit son rang (1-based) en chiffre de contour dans une
 * gouttière gauche ; la liste des plus joués est déjà ordonnée par le BFF.
 * Scroll natif géré par l'Arc `ScrollArea` (barre fine en surimpression, 12 px réservés sous les
 * affiches, fondus d'extrémité).
 */
export function TopicCarousel({
  topics,
  onOpen,
  label,
  ranked = false,
}: {
  topics: TopicCard[]
  onOpen: (topicId: string) => void
  /** Nom accessible du bandeau (une région par carrousel sur l'accueil). */
  label?: string
  /** Affiche le classement 1 → n à gauche des affiches (Top 10 des plus joués). */
  ranked?: boolean
}) {
  const { t } = useTranslation()

  return (
    <ScrollArea
      orientation="horizontal"
      label={label ?? t("topics.carousel.region")}
      fade={ranked ? 12 : 28}
      viewportClassName="flex gap-3 pb-3"
    >
      {topics.map((topic, index) => (
        <div key={topic.topicId} className={cn("shrink-0", ranked && "pl-14")}>
          <TopicPosterCard
            topic={topic}
            onOpen={onOpen}
            rank={ranked ? index + 1 : undefined}
            priority={index === 0}
            className="w-[62vw] max-w-[250px] tablet:w-48 desktop:w-52"
          />
        </div>
      ))}
    </ScrollArea>
  )
}
