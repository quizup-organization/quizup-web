import type { CSSProperties } from "react";
import { cn } from "cn";
import type { Topic } from "@/shared/types/domain";

/** Hauteur/largeur d'un hexagone (animate-ui : `hexagonSize × 1.1`). */
const HEX_H_RATIO = 1.1;

/**
 * Sommets d'un hexagone « pointe en haut » en unités du viewBox (100 × 110).
 * Le liseré est dessiné par le `<polygon>` (et non par un `clip-path` + face intérieure) :
 * il reste net et d'épaisseur uniforme à tous les niveaux de zoom.
 */
const HEX_POINTS = "50,0 100,27.5 100,82.5 50,110 0,82.5 0,27.5";

interface TopicHexProps {
  topic: Topic;
  onOpen: (topicId: string) => void;
  /** Largeur de l'hexagone en px. */
  size?: number;
  /** Épaisseur du liseré extérieur en px. */
  border?: number;
  className?: string;
}

/**
 * Tuile de sujet hexagonale (pointy-top) : liseré épuré, face colorée, **emoji + nom
 * toujours visibles au centre**. Léger éclaircissement de la face au survol/focus.
 */
export function TopicHex({ topic, onOpen, size = 88, border = 1, className }: TopicHexProps) {
  const width = size;
  const height = size * HEX_H_RATIO;

  return (
    <button
      type="button"
      data-slot="topic-hex"
      aria-label={topic.name}
      title={topic.name}
      onClick={() => onOpen(topic.id)}
      className={cn("group relative shrink-0 focus:outline-none", className)}
      style={{ width, height } as CSSProperties}
    >
      <svg
        aria-hidden
        viewBox="0 0 100 110"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <polygon
          points={HEX_POINTS}
          vectorEffect="non-scaling-stroke"
          strokeWidth={Math.max(1, border)}
          className="fill-white stroke-neutral-200 transition-colors duration-300 group-hover:fill-neutral-100 group-focus-visible:fill-neutral-100 motion-reduce:transition-none dark:fill-neutral-800 dark:stroke-neutral-700 dark:group-hover:fill-neutral-700 dark:group-focus-visible:fill-neutral-700"
        />
      </svg>

      {/* Contenu (emoji + nom) superposé à l'hexagone. */}
      <span className="absolute inset-0 z-10 grid place-items-center px-2 text-center">
        <span className="flex flex-col items-center justify-center gap-1.5">
          <span aria-hidden style={{ fontSize: Math.round(width * 0.24), lineHeight: 1 }}>
            {topic.emoji}
          </span>
          <span
            className="line-clamp-2 max-w-full font-heading font-semibold leading-tight"
            style={{ fontSize: Math.max(10, Math.round(width * 0.125)) }}
          >
            {topic.name}
          </span>
        </span>
      </span>
    </button>
  );
}
