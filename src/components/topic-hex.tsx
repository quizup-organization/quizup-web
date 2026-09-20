import type { CSSProperties } from "react";
import { cn } from "cn";
import type { Topic } from "@/shared/types/domain";

/** Hauteur/largeur d'un hexagone (animate-ui : `hexagonSize × 1.1`). */
const HEX_H_RATIO = 1.1;

/** Sommets d'un hexagone « pointe en haut ». */
const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

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
 * Tuile de sujet hexagonale (pointy-top) : liseré épuré, face intérieure, **emoji + nom
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
      className={cn(
        "group relative shrink-0 focus:outline-none",
        "[clip-path:polygon(50%_0%,_100%_25%,_100%_75%,_50%_100%,_0%_75%,_0%_25%)]",
        "before:absolute before:top-0 before:left-0 before:h-full before:w-full before:bg-neutral-200 before:transition-colors before:duration-300 before:content-[''] dark:before:bg-neutral-700",
        "motion-reduce:before:transition-none",
        className,
      )}
      style={{ width, height } as CSSProperties}
    >
      {/* Face intérieure + contenu. */}
      <span
        className="absolute z-10 grid place-items-center bg-white transition-colors duration-300 group-hover:bg-neutral-100 group-focus-visible:bg-neutral-100 motion-reduce:transition-none dark:bg-neutral-800 dark:group-hover:bg-neutral-700 dark:group-focus-visible:bg-neutral-700"
        style={{ inset: border, clipPath: HEX_CLIP }}
      >
        <span className="flex flex-col items-center justify-center gap-1.5 px-2 text-center">
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
