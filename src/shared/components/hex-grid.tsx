import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { cn } from "cn";
import type { Topic } from "@/features/topics/domain/topic";
import { TopicHex } from "./topic-hex";

/** Hauteur/largeur d'un hexagone (animate-ui : `hexagonSize × 1.1`). */
const HEX_H_RATIO = 1.1;

/** Taille de référence d'une tuile sujet — **source unique** (Accueil et Sujets identiques). */
export const HEX_TILE_SIZE = 96;

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
  /** Largeur d'un hexagone en px (taille fixe). */
  size?: number;
  /** Espace entre hexagones en px. */
  gap?: number;
  /** Épaisseur du liseré des hexagones en px. */
  border?: number;
  /** Nombre de colonnes fixe (sinon calculé puis étiré selon la largeur disponible). */
  columns?: number;
  /** Bandeau horizontal scrollable (Accueil) au lieu d'un retour à la ligne. */
  scroll?: boolean;
  className?: string;
}

/**
 * Mur de tuiles hexagonales jointives, **responsive** : le nombre de colonnes est déduit de la
 * largeur disponible ; les tuiles gardent une **taille fixe** ({@link HEX_TILE_SIZE}) — donc
 * identiques entre l'Accueil (bandeau scroll) et la page Sujets — et le bloc est centré. Les
 * rangées impaires sont décalées d'un demi-hexagone (y compris une dernière rangée partielle).
 */
export function HexGrid({
  topics,
  onOpen,
  size = HEX_TILE_SIZE,
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

  const cols = useMemo(() => {
    if (columns) return columns;
    if (scroll) return Math.max(1, Math.ceil((topics.length + 1) / 2));
    if (!width) return 4;
    return Math.max(1, Math.floor((width + gap) / (size + gap)));
  }, [columns, scroll, topics.length, width, gap, size]);

  // Tuiles de taille **fixe** (identiques sur l'Accueil et la page Sujets) ; le nombre de
  // colonnes s'adapte à la largeur, le bloc est centré.
  const tileSize = size;

  const height = tileSize * HEX_H_RATIO;
  const rowOverlap = height * 0.25 - (Math.sqrt(3) / 2) * gap;
  const blockWidth = cols * tileSize + (cols - 1) * gap;
  const halfStep = (tileSize + gap) / 2;

  const rows = useMemo(() => chunkHoneycomb(topics, cols), [topics, cols]);

  return (
    <div ref={ref} className={cn(scroll && "qu-scroll-x overflow-x-auto", className)}>
      <div className={cn("flex flex-col", scroll ? "w-max p-1" : "w-full items-center")}>
        <div
          className="flex flex-col"
          style={scroll ? undefined : { width: blockWidth }}
        >
          {rows.map((row, rowIndex) => {
            const count = row.length;
            const rowWidth = count * tileSize + (count - 1) * gap;
            const isOdd = rowIndex % 2 === 1;
            // Rangées impaires : décalage d'un demi-hexagone (interlock avec la rangée du dessus).
            // Rangées paires partielles : centrées dans le bloc.
            const marginLeft = isOdd
              ? halfStep
              : scroll
                ? 0
                : Math.max(0, (blockWidth - rowWidth) / 2);

            return (
              <div
                key={rowIndex}
                className="flex"
                style={{
                  marginTop: rowIndex === 0 ? 0 : -rowOverlap,
                  marginLeft,
                  gap,
                } as CSSProperties}
              >
                {row.map((topic) => (
                  <TopicHex
                    key={topic.id}
                    topic={topic}
                    onOpen={onOpen}
                    size={tileSize}
                    border={border}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
