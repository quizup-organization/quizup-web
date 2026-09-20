import type { Topic } from "@/shared/types/domain";
import { HexGrid } from "@/components/hex-grid";

/** Grille en nid d'abeille des sujets. */
export function TopicGrid({
  topics,
  onOpen,
}: {
  topics: Topic[];
  onOpen: (topicId: string) => void;
}) {
  return <HexGrid topics={topics} onOpen={onOpen} size={96} />;
}
