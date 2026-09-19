import type { Topic } from "@/shared/types/domain";
import { TopicCard } from "./TopicCard";

/** Grille responsive des sujets. */
export function TopicGrid({
  topics,
  onOpen,
}: {
  topics: Topic[];
  onOpen: (topicId: string) => void;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(256px,1fr))] gap-4">
      {topics.map((topic) => (
        <TopicCard key={topic.id} topic={topic} onOpen={onOpen} />
      ))}
    </div>
  );
}
