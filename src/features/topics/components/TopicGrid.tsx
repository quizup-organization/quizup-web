import type { TopicCard } from "@/features/topics/domain/topic";
import { TopicListCard } from "./TopicListCard";

/** Grille responsive des sujets — mêmes cartes minimalistes que la page Personnes. */
export function TopicGrid({
  topics,
  onOpen,
}: {
  topics: TopicCard[];
  onOpen: (topicId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 tablet:grid-cols-3 desktop:grid-cols-4">
      {topics.map((topic) => (
        <TopicListCard key={topic.topicId} topic={topic} onOpen={onOpen} />
      ))}
    </div>
  );
}
