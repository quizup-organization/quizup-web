import type { TopicCard } from "@/features/topics/domain/topic";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/arc/scroll-area/scroll-area";
import { useDevice } from "@/shared/hooks/use-device";
import { useCompactTilesStore } from "@/shared/stores/useCompactTilesStore";
import { TopicListCard } from "./TopicListCard";
import { TopicTile } from "./TopicTile";

/**
 * Bandeau horizontal de sujets — cartes minimalistes, scroll natif géré par l'Arc `ScrollArea`
 * (barre fine en surimpression + fondus d'extrémité, molette verticale → horizontal sur desktop).
 * En compact, derrière le feature flag `useCompactTilesStore`, les cartes deviennent des
 * **tuiles springboard** (même largeur que la grille 4 colonnes).
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
  const compactTiles = useCompactTilesStore((state) => state.enabled);
  const compact = useDevice() === "compact";
  const springboard = compactTiles && compact;

  return (
    <ScrollArea
      orientation="horizontal"
      label={label ?? t("topics.carousel.region")}
      viewportClassName={springboard ? "flex gap-2 pb-3" : "flex gap-3 pb-3"}
    >
      {topics.map((topic) => (
        <div
          key={topic.topicId}
          className={
            springboard
              ? "w-[22vw] shrink-0"
              : "w-40 shrink-0 tablet:w-44 desktop:w-48"
          }
        >
          {springboard ? (
            <TopicTile topic={topic} onOpen={onOpen} />
          ) : (
            <TopicListCard topic={topic} onOpen={onOpen} />
          )}
        </div>
      ))}
    </ScrollArea>
  );
}
