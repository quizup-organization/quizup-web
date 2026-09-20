import type { CSSProperties, ReactNode } from "react";
import { cn } from "cn";
import { categoryColor } from "@/shared/utils/categories";
import type { Topic } from "@/shared/types/domain";

/** Rapport hauteur/largeur d'un hexagone « pointe en haut » (pointy-top). */
const HEX_H_RATIO = 2 / Math.sqrt(3);

/** Sommets d'un hexagone pointy-top normalisé (viewBox 100 × 115.47). */
const HEX_POINTS = "50,0 100,28.87 100,86.6 50,115.47 0,86.6 0,28.87";

interface HexFaceProps {
  color: string;
  width: number;
  height: number;
  className?: string;
  children: ReactNode;
}

function HexFace({ color, width, height, className, children }: HexFaceProps) {
  return (
    <div className={cn("absolute inset-0", className)}>
      <svg viewBox="0 0 100 115.47" width={width} height={height} className="block">
        <polygon
          points={HEX_POINTS}
          fill="var(--card)"
          stroke={color}
          strokeWidth={6}
          strokeLinejoin="round"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">{children}</span>
    </div>
  );
}

interface TopicHexProps {
  topic: Topic;
  onOpen: (topicId: string) => void;
  /** Largeur de l'hexagone en px. */
  size?: number;
  /** Affiche toujours le nom sous l'hexagone (pas de flip) — sélecteur de thème. */
  showLabel?: boolean;
  className?: string;
}

/**
 * Tuile de sujet hexagonale (pointy-top) : emoji, bordure à la couleur de la catégorie.
 * Desktop : flip au survol/focus pour révéler le nom. Tactile : nom affiché sous l'hexagone.
 */
export function TopicHex({ topic, onOpen, size = 88, showLabel = false, className }: TopicHexProps) {
  const width = size;
  const height = size * HEX_H_RATIO;
  const color = categoryColor(topic.category);

  return (
    <button
      type="button"
      data-slot="topic-hex"
      aria-label={topic.name}
      title={topic.name}
      onClick={() => onOpen(topic.id)}
      className={cn("group mx-auto flex flex-col items-center gap-1.5 focus:outline-none", className)}
      style={{ width } as CSSProperties}
    >
      <div className="relative" style={{ width, height, perspective: 700 }}>
        <div
          className={cn(
            "relative h-full w-full transition-transform duration-300 [transform-style:preserve-3d] motion-reduce:transition-none",
            !showLabel &&
              "[@media(hover:hover)]:group-hover:[transform:rotateY(180deg)] [@media(hover:hover)]:group-focus-visible:[transform:rotateY(180deg)] motion-reduce:[@media(hover:hover)]:group-hover:[transform:none] motion-reduce:[@media(hover:hover)]:group-focus-visible:[transform:none]",
          )}
        >
          <HexFace color={color} width={width} height={height} className="[backface-visibility:hidden]">
            <span aria-hidden style={{ fontSize: width * 0.36, lineHeight: 1 }}>
              {topic.emoji}
            </span>
          </HexFace>

          {!showLabel && (
            <HexFace
              color={color}
              width={width}
              height={height}
              className="[backface-visibility:hidden] [transform:rotateY(180deg)]"
            >
              <span
                className="line-clamp-2 px-2 text-center font-heading font-semibold"
                style={{ fontSize: Math.max(10, width * 0.15), color }}
              >
                {topic.name}
              </span>
            </HexFace>
          )}
        </div>
      </div>

      <span
        className={cn(
          "line-clamp-2 text-center text-[11px] font-semibold leading-tight",
          !showLabel && "[@media(hover:hover)]:hidden",
        )}
      >
        {topic.name}
      </span>
    </button>
  );
}
