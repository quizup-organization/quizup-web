import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import type { RefObject } from "react";

const MAX_RESTORE_FRAMES = 12;

interface UseScrollRestorationOptions {
  containerRef: RefObject<HTMLElement | null>;
  /** Appelé une fois la position restaurée (recale l'en-tête, qui reste visible au retour). */
  onRestored?: () => void;
}

/**
 * Mémoire de scroll par entrée d'historique : un changement de **route** (`PUSH`/`REPLACE`)
 * repart en haut, `POP` restaure la position — avec quelques frames de patience si la route
 * lazy n'a pas encore sa hauteur définitive. Les changements de **query seule** (onglets,
 * filtres persistés dans l'URL) créent une nouvelle `key` sans changer de route : la position
 * est conservée. Le conteneur de scroll étant partagé entre les routes, le navigateur n'assure
 * pas ce comportement.
 */
export function useScrollRestoration({
  containerRef,
  onRestored,
}: UseScrollRestorationOptions): void {
  const { key, pathname } = useLocation();
  const navigationType = useNavigationType();
  const positionsRef = useRef(new Map<string, number>());
  const keyRef = useRef(key);
  const pathnameRef = useRef(pathname);
  const onRestoredRef = useRef(onRestored);

  useEffect(() => {
    onRestoredRef.current = onRestored;
  });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const record = () => {
      positionsRef.current.set(keyRef.current, element.scrollTop);
    };

    element.addEventListener("scroll", record, { passive: true });
    return () => element.removeEventListener("scroll", record);
  }, [containerRef]);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const previousKey = keyRef.current;
    const previousPathname = pathnameRef.current;
    keyRef.current = key;
    pathnameRef.current = pathname;
    if (previousKey === key) return;

    if (navigationType !== "POP") {
      // Changement de query seule (onglet/filtre) : on garde la position courante et on la
      // reporte sur la nouvelle `key` (le retour pourra ainsi la restaurer).
      if (previousPathname === pathname) {
        positionsRef.current.set(key, element.scrollTop);
        return;
      }
      element.scrollTop = 0;
      return;
    }

    const target = positionsRef.current.get(key) ?? 0;
    if (target <= 0) {
      element.scrollTop = 0;
      onRestoredRef.current?.();
      return;
    }

    element.dataset.scrollRestoring = "true";
    let frames = 0;
    let frameId = 0;

    const apply = () => {
      element.scrollTop = target;
      frames += 1;
      const settled = element.scrollHeight - element.clientHeight >= target;
      if (!settled && frames < MAX_RESTORE_FRAMES) {
        frameId = window.requestAnimationFrame(apply);
        return;
      }
      delete element.dataset.scrollRestoring;
      onRestoredRef.current?.();
    };

    apply();

    return () => {
      window.cancelAnimationFrame(frameId);
      delete element.dataset.scrollRestoring;
    };
  }, [key, pathname, navigationType, containerRef]);
}
