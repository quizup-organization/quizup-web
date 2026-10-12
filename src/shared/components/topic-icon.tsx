import { createElement, type CSSProperties } from "react";
import { cn } from "cn";
import { categoryColor, categoryIcon } from "@/shared/utils/categories";

/**
 * Pastille de sujet. Contenu : image de couverture si fournie, sinon **icône lucide de la
 * catégorie** (le sujet a une catégorie), sinon emoji (surfaces hors catalogue : palette ⌘K,
 * duel), sinon rien. Fond : couleur éditoriale du sujet, repli couleur de catégorie — jamais
 * de rond gris vide.
 */
interface TopicIconProps {
  topic: {
    emoji: string | null;
    color: string | null;
    imageUrl?: string | null;
    category?: string | null;
  };
  size?: number;
  className?: string;
  /** Remplit la largeur du conteneur en carré (`aspect-square`) — tuiles springboard fluides. */
  fluid?: boolean;
  /** `eager` + `fetchPriority="high"` pour les visuels au-dessus de la ligne de flottaison. */
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
}

export function TopicIcon({
  topic,
  size = 44,
  className,
  fluid = false,
  loading = "lazy",
  fetchPriority = "auto",
}: TopicIconProps) {
  const category = topic.category ?? "";
  const hasImage = Boolean(topic.imageUrl);
  const background =
    topic.color ?? (category ? categoryColor(category) : null) ?? "var(--muted)";

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-2xl select-none",
        fluid && "@container aspect-square w-full",
        className,
      )}
      style={
        {
          width: fluid ? "100%" : size,
          height: fluid ? "auto" : size,
          // Un visuel de sujet couvre la pastille : aucun fond coloré (l'image seule décide).
          backgroundColor: hasImage ? "transparent" : background,
          fontSize: fluid ? undefined : size * 0.5,
          lineHeight: 1,
        } as CSSProperties
      }
    >
      {topic.imageUrl ? (
        <img
          src={topic.imageUrl}
          alt=""
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : category ? (
        createElement(categoryIcon(category), {
          className: "size-1/2",
          style: { color: "#ffffff" },
        })
      ) : (
        <span aria-hidden className={cn(fluid && "text-[50cqw]")}>
          {topic.emoji ?? ""}
        </span>
      )}
    </span>
  );
}
