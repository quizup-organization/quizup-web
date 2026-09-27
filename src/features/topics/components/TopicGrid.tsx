import type { TopicCard } from "@/features/topics/domain/topic";
import { HexGrid } from "@/shared/components/hex-grid";

/** Grille en nid d'abeille des sujets. */
export function TopicGrid({
  topics,
  onOpen,
}: {
  topics: TopicCard[];
  onOpen: (topicId: string) => void;
}) {
  return <HexGrid topics={topics} onOpen={onOpen} />;
}
