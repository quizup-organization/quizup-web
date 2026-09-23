import type { Topic } from "@/features/topics/domain/topic";
import { HexGrid } from "@/shared/components/hex-grid";

/** Grille en nid d'abeille des sujets. */
export function TopicGrid({
  topics,
  onOpen,
}: {
  topics: Topic[];
  onOpen: (topicId: string) => void;
}) {
  return <HexGrid topics={topics} onOpen={onOpen} />;
}
