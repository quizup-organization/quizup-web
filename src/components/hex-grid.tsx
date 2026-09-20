import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { cn } from "cn";
import type { Topic } from "@/shared/types/domain";
import { TopicHex } from "./topic-hex";

/** Hauteur/largeur d'un hexagone (animate-ui : `hexagonSize × 1.1`). */
const HEX_H_RATIO = 1.1;

/**
 * Répartit les sujets en rangées de nid d'abeille : rangées paires `cols`, impaires `cols - 1`
 * (décalées d'un demi-hexagone).
 */
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
  /** Épaisseur du liseré des hexagones en px. */
  border?: number;
  /** Nombre de colonnes fixe (sinon calculé selon la largeur disponible). */
  columns?: number;
  /** Bandeau horizontal scrollable (Accueil) au lieu d'un retour à la ligne. */
  scroll?: boolean;
  className?: string;
}

/**
 * Mur de tuiles hexagonales jointives. Pas vertical entre rangées
 * (`0.75 × hauteur + (√3/2) × gap`) pour un espacement **uniforme** sur toutes les arêtes ;
 * rangées impaires décalées d'un demi-hexagone.
 */
export function HexGrid({
  topics,
  onOpen,
  size = 88,
  gap = 5,
  border = 1,
  columns,
  scroll = false,
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
  const rowOverlap = height * 0.25 - (Math.sqrt(3) / 2) * gap;

  const cols = useMemo(() => {
    if (columns) return columns;
    if (scroll) return Math.max(1, Math.ceil((topics.length + 1) / 2));
    if (!width) return 4;
    return Math.max(1, Math.floor((width + gap) / (size + gap)));
  }, [columns, scroll, topics.length, width, gap, size]);

  const rows = useMemo(() => chunkHoneycomb(topics, cols), [topics, cols]);

  return (
    <div ref={ref} className={cn(scroll && "qu-scroll-x overflow-x-auto pb-2", className)}>
      <div className={cn("flex flex-col", scroll ? "w-max" : "w-full")}>
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={cn("flex", !scroll && "w-full justify-center")}
            style={
              {
                marginTop: rowIndex === 0 ? 0 : -rowOverlap,
                marginLeft: scroll && rowIndex % 2 === 1 ? (size + gap) / 2 : 0,
                gap,
              } as CSSProperties
            }
          >
            {row.map((topic) => (
              <TopicHex
                key={topic.id}
                topic={topic}
                onOpen={onOpen}
                size={size}
                border={border}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
