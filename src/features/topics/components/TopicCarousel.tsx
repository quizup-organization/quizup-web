import type { Topic } from "@/shared/types/domain";
import { HexGrid } from "@/components/hex-grid";

/** Bandeau horizontal de sujets en nid d'abeille — scroll natif (overflow-x). */
export function TopicCarousel({
  topics,
  onOpen,
}: {
  topics: Topic[];
  onOpen: (topicId: string) => void;
}) {
  return <HexGrid topics={topics} onOpen={onOpen} size={88} gap={8} scroll />;
}
