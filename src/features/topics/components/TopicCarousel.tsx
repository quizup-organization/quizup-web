import { ScrollShadow } from "@heroui/react";
import type { TopicCard } from "@/features/topics/domain/topic";
import { TopicListCard } from "./TopicListCard";

/** Bandeau horizontal de sujets — cartes minimalistes, ombres de scroll HeroUI. */
export function TopicCarousel({
  topics,
  onOpen,
}: {
  topics: TopicCard[];
  onOpen: (topicId: string) => void;
}) {
  return (
    <ScrollShadow orientation="horizontal" className="flex gap-3 pb-1">
      {topics.map((topic) => (
        <div key={topic.topicId} className="w-56 shrink-0">
          <TopicListCard topic={topic} onOpen={onOpen} />
        </div>
      ))}
    </ScrollShadow>
  );
}
