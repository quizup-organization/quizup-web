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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
      {topics.map((topic) => (
        <TopicListCard key={topic.topicId} topic={topic} onOpen={onOpen} />
      ))}
    </div>
  );
}
