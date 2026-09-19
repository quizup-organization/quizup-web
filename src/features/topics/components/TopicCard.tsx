import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TopicIcon } from "@/components/topic-icon";
import { veil } from "@/theme/tokens";
import { categoryColor, categoryLabel } from "@/shared/utils/categories";
import type { Topic } from "@/shared/types/domain";

interface TopicCardProps {
  topic: Topic;
  onOpen: (topicId: string) => void;
}

/** Carte de sujet minimaliste — icône + catégorie + nom (aucune action). */
export function TopicCard({ topic, onOpen }: TopicCardProps) {
  return (
    <Card
      size="sm"
      onClick={() => onOpen(topic.id)}
      className="cursor-pointer transition-[color,box-shadow] hover:ring-foreground/25"
      style={{
        background: `linear-gradient(110deg, var(--card) 50%, ${veil(topic.color, 12)} 100%)`,
      }}
    >
      <CardHeader className="items-center">
        <div className="flex min-w-0 items-center gap-3">
          <TopicIcon topic={topic} size={44} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: categoryColor(topic.category) }}
              />
              <span className="truncate">
                {categoryLabel(topic.category, topic.category)}
              </span>
            </div>
            <CardTitle className="truncate font-heading text-[15px]">
              {topic.name}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
