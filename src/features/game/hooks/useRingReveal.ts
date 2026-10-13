import { useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"

/** Durée du reveal (remplissage de l'anneau + compteur) : posé, plus long qu'une transition d'arène. */
const REVEAL_MS = 900
/** Part du reveal réservée au fondu d'apparition des valeurs des callouts. */
const VALUE_FADE = 0.25

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

interface RingReveal {
  /** Remplissage animé du segment corail (0 → cible, en %). */
  percent: number
  /** « XP gagnée » comptée de 0 jusqu'à la cible. */
  gained: number
  /** Opacité des valeurs (0 → 1) : fondu court en tête de reveal. */
  valueOpacity: number
}

/**
 * Reveal de l'anneau de niveau : dès que la récompense est projetée (`enabled`), le remplissage
 * et le compteur montent de 0 à leur cible (~0,9 s, ease-out), **une fois par affichage**. Le hook
 * pilote les deux d'une même horloge `requestAnimationFrame` pour que l'arc, les tracés pointés et
 * la valeur « XP gagnée » restent solidaires. `prefers-reduced-motion` (via `useReducedMotion`,
 * comme `useResultSound`) pose l'état final immédiatement — le garde-fou CSS global ne couvre pas
 * une animation pilotée en JS.
 */
export function useRingReveal(
  targetPercent: number,
  targetGained: number,
  enabled: boolean
): RingReveal {
  const reduced = useReducedMotion() ?? false
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!enabled || reduced) return
    let start: number | null = null
    let frame = 0
    const tick = (now: number) => {
      if (start == null) start = now
      const raw = Math.min(1, (now - start) / REVEAL_MS)
      setProgress(easeOutCubic(raw))
      if (raw < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [enabled, reduced])

  const eased = reduced ? 1 : progress

  return {
    percent: targetPercent * eased,
    gained: Math.round(targetGained * eased),
    valueOpacity: Math.min(1, eased / VALUE_FADE),
  }
}
