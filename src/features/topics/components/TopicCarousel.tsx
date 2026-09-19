import type { Topic } from "@/shared/types/domain";
import { TopicCard } from "./TopicCard";

/** Bandeau horizontal de sujets — scroll natif (overflow-x + snap), sans dépendance. */
export function TopicCarousel({
  topics,
  onOpen,
}: {
  topics: Topic[];
  onOpen: (topicId: string) => void;
}) {
  return (
    <div className="qu-scroll-x flex snap-x gap-4 overflow-x-auto pt-1 pb-2">
      {topics.map((topic) => (
        <div key={topic.id} className="w-[272px] shrink-0 snap-start sm:w-[288px]">
          <TopicCard topic={topic} onOpen={onOpen} />
        </div>
      ))}
    </div>
  );
}
