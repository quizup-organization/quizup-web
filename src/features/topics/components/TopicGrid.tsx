import type { TopicCard } from "@/features/topics/domain/topic";
import { useDevice } from "@/shared/hooks/use-device";
import { TopicListCard } from "./TopicListCard";
import { TopicTile } from "./TopicTile";

/**
 * Grille responsive des sujets — **tuiles springboard** (style iOS) en compact sur
 * **4 colonnes** (espacement resserré pour maximiser la taille des visuels) ; cartes
 * minimalistes en tablette/desktop.
 */
export function TopicGrid({
  topics,
  onOpen,
  showStatus = false,
}: {
  topics: TopicCard[];
  onOpen: (topicId: string) => void;
  /** Vue « Mes sujets » : badge de statut sur les sujets non publiés. */
  showStatus?: boolean;
}) {
  const compact = useDevice() === "compact";

  if (compact) {
    return (
      <div className="grid grid-cols-4 gap-x-0.5 gap-y-1">
        {topics.map((topic) => (
          <TopicTile
            key={topic.topicId}
            topic={topic}
            onOpen={onOpen}
            showStatus={showStatus}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 tablet:grid-cols-3 desktop:grid-cols-4">
      {topics.map((topic) => (
        <TopicListCard
          key={topic.topicId}
          topic={topic}
          onOpen={onOpen}
          showStatus={showStatus}
        />
      ))}
    </div>
  );
}
