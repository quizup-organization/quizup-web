import type { TopicCard } from "@/features/topics/domain/topic";
import { HexGrid } from "@/shared/components/hex-grid";

/** Bandeau horizontal de sujets en nid d'abeille — scroll natif (overflow-x). */
export function TopicCarousel({
  topics,
  onOpen,
}: {
  topics: TopicCard[];
  onOpen: (topicId: string) => void;
}) {
  return <HexGrid topics={topics} onOpen={onOpen} scroll />;
}
