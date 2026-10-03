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
}

/** Encre lisible (blanc/noir) pour une icône sur fond coloré. */
function readableInk(color: string): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (!hex) return "#ffffff";
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };
  const r = channel(parseInt(hex[1].slice(0, 2), 16));
  const g = channel(parseInt(hex[1].slice(2, 4), 16));
  const b = channel(parseInt(hex[1].slice(4, 6), 16));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return 1.05 / (luminance + 0.05) >= 3 ? "#ffffff" : "#1c1c1c";
}

export function TopicIcon({ topic, size = 44, className }: TopicIconProps) {
  const category = topic.category ?? "";
  const background =
    topic.color ?? (category ? categoryColor(category) : null) ?? "var(--muted)";

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-2xl select-none",
        className,
      )}
      style={
        {
          width: size,
          height: size,
          backgroundColor: background,
          fontSize: size * 0.5,
          lineHeight: 1,
        } as CSSProperties
      }
    >
      {topic.imageUrl ? (
        <img
          src={topic.imageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : category ? (
        createElement(categoryIcon(category), {
          className: "size-1/2",
          style: { color: readableInk(background) },
        })
      ) : (
        <span aria-hidden>{topic.emoji ?? ""}</span>
      )}
    </span>
  );
}
