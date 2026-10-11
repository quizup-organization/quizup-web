import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { EntityCard } from "@/shared/components/entity-card";
import { TopicIcon } from "@/shared/components/topic-icon";
import { categoryColor, categoryLabel } from "@/shared/utils/categories";
import type { TranslationKey } from "@/lib/i18n/types";
import type { TopicCard, TopicStatus } from "@/features/topics/domain/topic";
import { useTopicName } from "@/features/shell";

const STATUS_KEYS: Record<TopicStatus, TranslationKey> = {
  DRAFT: "topics.status.draft",
  PUBLISHED: "topics.status.published",
  ARCHIVED: "topics.status.archived",
};

/**
 * Carte de sujet — bordure/dégradé teintés par la couleur du sujet, visuel 46 px,
 * nom en display et catégorie en surtitre. Aucune action (l'ouverture se fait au clic).
 * Dans la vue « Mes sujets » (`showStatus`), un badge distingue les sujets non publiés.
 */
export function TopicListCard({
  topic,
  onOpen,
  showStatus = false,
}: {
  topic: TopicCard;
  onOpen: (topicId: string) => void;
  showStatus?: boolean;
}) {
  const { t } = useTranslation();
  const resolveName = useTopicName();
  const accent = topic.color ?? categoryColor(topic.category ?? "");
  const label = topic.categoryLabel ?? categoryLabel(topic.category ?? "");
  const statusBadge =
    showStatus && topic.status !== "PUBLISHED" ? (
      <Badge variant="outline" className="shrink-0">
        {t(STATUS_KEYS[topic.status])}
      </Badge>
    ) : undefined;

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
      trailing={statusBadge}
      onClick={() => onOpen(topic.topicId)}
    />
  );
}
