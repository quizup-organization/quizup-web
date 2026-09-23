import type { Topic } from "@/features/topics/domain/topic";
import { HexGrid } from "@/shared/components/hex-grid";

/** Bandeau horizontal de sujets en nid d'abeille — scroll natif (overflow-x). */
export function TopicCarousel({
  topics,
  onOpen,
}: {
  topics: Topic[];
  onOpen: (topicId: string) => void;
}) {
  return <HexGrid topics={topics} onOpen={onOpen} scroll />;
}
