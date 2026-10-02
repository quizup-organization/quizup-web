import { createElement } from "react";
import { Card } from "@heroui/react";
import { categoryIcon, categoryLabel } from "@/shared/utils/categories";
import type { TopicCard } from "@/features/topics/domain/topic";

/**
 * Carte de sujet horizontale minimaliste — visuel (image du sujet, sinon icône lucide de sa
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
      data-slot="topic-card"
      onClick={() => onOpen(topic.topicId)}
      className="flex cursor-pointer flex-row items-center gap-3 p-1 transition-[color,box-shadow] hover:ring-foreground/25"
    >
      {topic.imageUrl ? (
        <img
          src={topic.imageUrl}
          alt=""
          loading="lazy"
          className="aspect-square size-16 shrink-0 rounded-xl object-cover select-none sm:size-20"
        />
      ) : (
        <span className="grid aspect-square size-16 shrink-0 place-items-center rounded-xl bg-default sm:size-20">
          {createElement(categoryIcon(topic.category ?? ""), {
            className: "size-7 text-muted",
          })}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <Card.Title className="truncate font-heading text-sm">
          {topic.name}
        </Card.Title>
        <Card.Description className="truncate text-xs text-muted">
          {label}
        </Card.Description>
      </div>
    </Card>
  );
}
