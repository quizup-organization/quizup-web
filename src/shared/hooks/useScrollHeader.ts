import { useCallback, useEffect, useRef, useState } from "react"
import type { RefObject } from "react"
import { isRelayout, nextHeaderHidden } from "@/shared/utils/scroll-direction"

interface UseScrollHeaderResult {
  /** L'en-tête doit être translaté hors écran (scroll vers le bas). */
  hidden: boolean
  /** Repart visible et recale la baseline (restauration de scroll, navigation). */
  reset: () => void
}

/**
 * Détecte la direction du scroll du conteneur applicatif (le document ne défile pas) pour
 * masquer/révéler l'en-tête comme une app native. Les mises à jour sont limitées à la frame
 * (`requestAnimationFrame`) ; les scrolls de restauration sont ignorés
 * (`data-scroll-restoring`, posé par `useScrollRestoration`).
 *
 * Un contenu **remis en page** (changement d'onglet, filtrage, liste plus courte) fait émettre un
 * `scroll` au navigateur — rognage de la position ou ré-ancrage — qui n'est pas un geste :
 * l'en-tête ne bascule pas, sinon un simple clic sur un onglet ferait apparaître la topbar et la
 * nav basse.
 */
export function useScrollHeader(
  containerRef: RefObject<HTMLElement | null>
): UseScrollHeaderResult {
  const [hidden, setHidden] = useState(false)
  const hiddenRef = useRef(false)
  const previousRef = useRef(0)
  const previousHeightRef = useRef<number | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    let frame = 0
    previousRef.current = element.scrollTop
    previousHeightRef.current = element.scrollHeight

    const update = () => {
      frame = 0
      const scrollTop = element.scrollTop
      const scrollHeight = element.scrollHeight
      if (element.dataset.scrollRestoring === "true") {
        previousRef.current = scrollTop
        previousHeightRef.current = scrollHeight
        return
      }
      const delta = scrollTop - previousRef.current
      const relayout = isRelayout({
        scrollHeight,
        previousScrollHeight: previousHeightRef.current,
      })
      previousRef.current = scrollTop
      previousHeightRef.current = scrollHeight
      // Remise en page du contenu : la baseline est recalée, l'état de l'en-tête inchangé.
      if (relayout) return
      const next = nextHeaderHidden(hiddenRef.current, { scrollTop, delta })
      if (next !== hiddenRef.current) {
        hiddenRef.current = next
        setHidden(next)
      }
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    element.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      element.removeEventListener("scroll", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [containerRef])

  const reset = useCallback(() => {
    previousRef.current = containerRef.current?.scrollTop ?? 0
    previousHeightRef.current = containerRef.current?.scrollHeight ?? null
    hiddenRef.current = false
    setHidden(false)
  }, [containerRef])

  return { hidden, reset }
}
