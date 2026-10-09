import { EntityCard } from "@/shared/components/entity-card";
import { TopicIcon } from "@/shared/components/topic-icon";
import { categoryColor, categoryLabel } from "@/shared/utils/categories";
import type { TopicCard } from "@/features/topics/domain/topic";
import { useTopicName } from "@/features/shell";

/**
 * Carte de sujet — bordure/dégradé teintés par la couleur du sujet, visuel 46 px,
 * nom en display et catégorie en surtitre. Aucune action (l'ouverture se fait au clic).
 */
export function TopicListCard({
  topic,
  onOpen,
}: {
  topic: TopicCard;
  onOpen: (topicId: string) => void;
}) {
  const resolveName = useTopicName();
  const accent = topic.color ?? categoryColor(topic.category ?? "");
  const label = topic.categoryLabel ?? categoryLabel(topic.category ?? "");

  return (
    <EntityCard
      dataSlot="topic-card"
      accent={accent}
      visual={
        <TopicIcon
          topic={topic}
          size={46}
          className="rounded-[16px] shadow-lg"
        />
      }
      title={resolveName(topic.names)}
      subtitle={label}
      onClick={() => onOpen(topic.topicId)}
    />
  );
}
