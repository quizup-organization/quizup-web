import { createElement } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryIcon, categoryLabel } from "@/shared/utils/categories";
import type { TopicCard } from "@/features/topics/domain/topic";

/**
 * Carte de sujet minimaliste — visuel 36 px (image du sujet, sinon icône lucide de sa
 * catégorie), nom du sujet et catégorie. Aucune action (l'ouverture se fait au clic).
 */
export function TopicListCard({
  topic,
  onOpen,
}: {
  topic: TopicCard;
  onOpen: (topicId: string) => void;
}) {
  const label = topic.categoryLabel ?? categoryLabel(topic.category ?? "");

  return (
    <Card
      size="sm"
      data-slot="topic-card"
      onClick={() => onOpen(topic.topicId)}
      className="cursor-pointer transition-[color,box-shadow] hover:ring-foreground/25"
    >
      <CardHeader className="items-center">
        <div className="flex min-w-0 items-center gap-2.5">
          {topic.imageUrl ? (
            <img
              src={topic.imageUrl}
              alt=""
              loading="lazy"
              className="size-9 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted">
              {createElement(categoryIcon(topic.category ?? ""), {
                className: "size-4.5 text-muted-foreground",
              })}
            </span>
          )}
          <div className="min-w-0">
            <CardTitle className="truncate font-heading text-[15px]">
              {topic.name}
            </CardTitle>
            <p className="truncate text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
