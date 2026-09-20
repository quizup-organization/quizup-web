import type { CSSProperties } from "react";
import { cn } from "cn";
import { categoryColor } from "@/shared/utils/categories";
import { veil } from "@/theme/tokens";
import type { Topic } from "@/shared/types/domain";

/** Rapport hauteur/largeur d'un hexagone pointy-top, aligné sur animate-ui (`width × 1.1`). */
const HEX_H_RATIO = 1.1;

/** Sommets d'un hexagone « pointe en haut » (mêmes proportions que le fond animate-ui). */
const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

interface TopicHexProps {
  topic: Topic;
  onOpen: (topicId: string) => void;
  /** Largeur de l'hexagone en px. */
  size?: number;
  /** Affiche toujours le nom (sélecteur de thème) au lieu de ne le révéler qu'au survol. */
  showLabel?: boolean;
  className?: string;
}

/**
 * Tuile de sujet hexagonale (pointy-top) inspirée du fond `HexagonBackground` d'animate-ui :
 * liseré à la couleur de la catégorie, face intérieure `--card` et **halo coloré au survol**.
 * Desktop : le nom se révèle au survol/focus (emoji estompé). Tactile : le nom reste visible.
 */
export function TopicHex({
  topic,
  onOpen,
  size = 88,
  showLabel = false,
  className,
}: TopicHexProps) {
  const width = size;
  const height = size * HEX_H_RATIO;
  const margin = Math.max(4, Math.round(size * 0.06));
  const color = categoryColor(topic.category);

  return (
    <button
      type="button"
      data-slot="topic-hex"
      aria-label={topic.name}
      title={topic.name}
      onClick={() => onOpen(topic.id)}
      className={cn(
        "group relative mx-auto block focus:outline-none",
        className,
      )}
      style={{ width, height } as CSSProperties}
    >
      {/* Liseré à la couleur de la catégorie. */}
      <span
        aria-hidden
        className="absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-[1.03] group-focus-visible:scale-[1.03] motion-reduce:transition-none"
        style={{ clipPath: HEX_CLIP, backgroundColor: color }}
      />

      {/* Face intérieure + halo. */}
      <span
        aria-hidden
        className="absolute overflow-hidden bg-card transition-colors duration-300 ease-out motion-reduce:transition-none"
        style={{ inset: margin, clipPath: HEX_CLIP }}
      >
        <span
          className="absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
          style={{ background: veil(color, 20) }}
        />
      </span>

      {/* Contenu : emoji et nom superposés (le nom se révèle au survol). */}
      <span className="absolute grid place-items-center" style={{ inset: margin, clipPath: HEX_CLIP }}>
        <span
          aria-hidden
          className={cn(
            "col-start-1 row-start-1 transition-all duration-300 ease-out motion-reduce:transition-none",
            !showLabel &&
              "[@media(hover:hover)]:group-hover:scale-75 [@media(hover:hover)]:group-hover:opacity-0 [@media(hover:hover)]:group-focus-visible:scale-75 [@media(hover:hover)]:group-focus-visible:opacity-0",
            "[@media(hover:none)]:opacity-0",
            showLabel && "opacity-0",
          )}
          style={{ fontSize: Math.round(width * 0.31), lineHeight: 1 }}
        >
          {topic.emoji}
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1 line-clamp-2 max-w-[80%] text-center font-heading font-semibold leading-tight text-foreground transition-opacity duration-300 ease-out motion-reduce:transition-none",
            !showLabel &&
              "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:opacity-100",
          )}
          style={{ fontSize: Math.max(10, Math.round(width * 0.14)) }}
        >
          {topic.name}
        </span>
      </span>
    </button>
  );
}
