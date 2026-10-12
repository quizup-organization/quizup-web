import type { TopicCard } from "@/features/topics/domain/topic";
import { useDevice } from "@/shared/hooks/use-device";
import { TopicListCard } from "./TopicListCard";
import { TopicTile } from "./TopicTile";

/**
 * Grille responsive des sujets — **tuiles springboard** (style iOS) en compact : 3 colonnes
 * sous 540 px, 4 colonnes de 540 à 639 px ; cartes minimalistes en tablette/desktop.
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
      <div className="grid grid-cols-3 gap-x-2 gap-y-3 compact-wide:grid-cols-4">
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
