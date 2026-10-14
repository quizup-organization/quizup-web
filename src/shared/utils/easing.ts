/**
 * Courbes d'animation partagées (compteurs, jauges, anneaux) — côté JS : les transitions CSS
 * équivalentes vivent dans `index.css` (`cubic-bezier` de mêmes bornes).
 */

/** `ease-in-out` cubique : faible au départ, accélération franche, atterrissage doux. */
export function easeInOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t))
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - (-2 * clamped + 2) ** 3 / 2
}
