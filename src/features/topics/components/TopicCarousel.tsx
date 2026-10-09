import type { TopicCard } from "@/features/topics/domain/topic";
import { TopicListCard } from "./TopicListCard";

/** Bandeau horizontal de sujets — cartes minimalistes, scroll natif (overflow-x). */
export function TopicCarousel({
  topics,
  onOpen,
}: {
  topics: TopicCard[];
  onOpen: (topicId: string) => void;
}) {
  return (
    <div className="qu-scroll-x flex scroll-fade-x gap-3 overflow-x-auto pb-1">
      {topics.map((topic) => (
        <div key={topic.topicId} className="w-40 shrink-0 tablet:w-44 desktop:w-48">
          <TopicListCard topic={topic} onOpen={onOpen} />
        </div>
      ))}
    </div>
  );
}
