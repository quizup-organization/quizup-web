import type { TopicCard } from "@/features/topics/domain/topic";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/arc/scroll-area/scroll-area";
import { useDevice } from "@/shared/hooks/use-device";
import { TopicListCard } from "./TopicListCard";
import { TopicTile } from "./TopicTile";

/**
 * Bandeau horizontal de sujets — cartes minimalistes, scroll natif géré par l'Arc `ScrollArea`
 * (barre fine en surimpression + fondus d'extrémité, molette verticale → horizontal sur desktop).
 * En compact, les cartes deviennent des **tuiles springboard** (largeur alignée sur une
 * grille 3 colonnes : `30vw`).
 */
export function TopicCarousel({
  topics,
  onOpen,
  label,
}: {
  topics: TopicCard[];
  onOpen: (topicId: string) => void;
  /** Nom accessible du bandeau (une région par carrousel sur l'accueil). */
  label?: string;
}) {
  const { t } = useTranslation();
  const compact = useDevice() === "compact";

  return (
    <ScrollArea
      orientation="horizontal"
      label={label ?? t("topics.carousel.region")}
      viewportClassName={compact ? "flex gap-1.5 pb-3" : "flex gap-3 pb-3"}
    >
      {topics.map((topic) => (
        <div
          key={topic.topicId}
          className={
            compact
              ? "w-[30vw] shrink-0"
              : "w-44 shrink-0 tablet:w-48 desktop:w-52"
          }
        >
          {compact ? (
            <TopicTile topic={topic} onOpen={onOpen} />
          ) : (
            <TopicListCard topic={topic} onOpen={onOpen} />
          )}
        </div>
      ))}
    </ScrollArea>
  );
}
