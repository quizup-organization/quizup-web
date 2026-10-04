import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { nextHeaderHidden } from "@/shared/utils/scroll-direction";

interface UseScrollHeaderResult {
  /** L'en-tête doit être translaté hors écran (scroll vers le bas). */
  hidden: boolean;
  /** Repart visible et recale la baseline (restauration de scroll, navigation). */
  reset: () => void;
}

/**
 * Détecte la direction du scroll du conteneur applicatif (le document ne défile pas) pour
 * masquer/révéler l'en-tête comme une app native. Les mises à jour sont limitées à la frame
 * (`requestAnimationFrame`) ; les scrolls de restauration sont ignorés
 * (`data-scroll-restoring`, posé par `useScrollRestoration`).
 */
export function useScrollHeader(
  containerRef: RefObject<HTMLElement | null>,
): UseScrollHeaderResult {
  const [hidden, setHidden] = useState(false);
  const hiddenRef = useRef(false);
  const previousRef = useRef(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollTop = element.scrollTop;
      if (element.dataset.scrollRestoring === "true") {
        previousRef.current = scrollTop;
        return;
      }
      const delta = scrollTop - previousRef.current;
      previousRef.current = scrollTop;
      const next = nextHeaderHidden(hiddenRef.current, { scrollTop, delta });
      if (next !== hiddenRef.current) {
        hiddenRef.current = next;
        setHidden(next);
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    element.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      element.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [containerRef]);

  const reset = useCallback(() => {
    previousRef.current = containerRef.current?.scrollTop ?? 0;
    hiddenRef.current = false;
    setHidden(false);
  }, [containerRef]);

  return { hidden, reset };
}
