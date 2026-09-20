import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { cn } from "cn";
import type { Topic } from "@/shared/types/domain";
import { TopicHex } from "./topic-hex";

const HEX_H_RATIO = 2 / Math.sqrt(3);

/** Répartit les sujets en rangées de nid d'abeille : rangées paires `cols`, impaires `cols - 1`. */
function chunkHoneycomb<T>(items: T[], cols: number): T[][] {
  const rows: T[][] = [];
  let index = 0;
  let even = true;
  while (index < items.length) {
    const take = even ? cols : Math.max(1, cols - 1);
    rows.push(items.slice(index, index + take));
    index += take;
    even = !even;
  }
  return rows;
}

interface HexGridProps {
  topics: Topic[];
  onOpen: (topicId: string) => void;
  /** Largeur d'un hexagone en px. */
  size?: number;
  /** Espace entre hexagones en px. */
  gap?: number;
  /** Nombre de colonnes fixe (sinon calculé selon la largeur disponible). */
  columns?: number;
  /** Bandeau horizontal scrollable (Accueil) au lieu d'un retour à la ligne. */
  scroll?: boolean;
  /** Affiche toujours le nom sous l'hexagone (sélecteur de thème). */
  showLabel?: boolean;
  className?: string;
}

/**
 * Nid d'abeille de tuiles sujets : hexagones pointy-top, rangées impaires décalées d'un
 * demi-hexagone. Sur desktop (survol) les hexagones s'imbriquent verticalement ; sur tactile
 * (nom affiché sous l'hexagone) les rangées ne se chevauchent pas pour laisser la place au nom.
 */
export function HexGrid({
  topics,
  onOpen,
  size = 88,
  gap = 8,
  columns,
  scroll = false,
  showLabel = false,
  className,
}: HexGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const height = size * HEX_H_RATIO;

  const cols = useMemo(() => {
    if (columns) return columns;
    if (scroll) return Math.max(1, Math.ceil((topics.length + 1) / 2));
    if (!width) return 4;
    return Math.max(1, Math.floor((width + gap) / (size + gap)));
  }, [columns, scroll, topics.length, width, gap, size]);

  const rows = useMemo(() => chunkHoneycomb(topics, cols), [topics, cols]);

  return (
    <div ref={ref} className={cn(scroll && "qu-scroll-x overflow-x-auto pb-2", className)}>
      <div className={cn("flex flex-col", scroll && "w-max")}>
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={cn(
              "flex",
              rowIndex > 0 && "[@media(hover:hover)]:mt-[calc(var(--hex-overlap)*-1)]",
            )}
            style={
              {
                gap,
                marginLeft: rowIndex % 2 === 1 ? (size + gap) / 2 : 0,
                "--hex-overlap": `${height * 0.25}px`,
              } as CSSProperties
            }
          >
            {row.map((topic) => (
              <TopicHex
                key={topic.id}
                topic={topic}
                onOpen={onOpen}
                size={size}
                showLabel={showLabel}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
