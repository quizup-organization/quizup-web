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
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
      {topics.map((topic) => (
        <TopicListCard key={topic.topicId} topic={topic} onOpen={onOpen} />
      ))}
    </div>
  );
}
