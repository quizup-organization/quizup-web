export interface ScrollSample {
  /** Position verticale courante du conteneur (px). */
  scrollTop: number;
  /** Delta depuis le dernier échantillon (px, positif vers le bas). */
  delta: number;
}

const HIDE_AFTER_PX = 72;
const TOP_THRESHOLD_PX = 8;
const DIRECTION_THRESHOLD_PX = 4;

/**
 * Machine à états du masquage d'en-tête façon natif : caché en descendant après un seuil,
 * révélé dès que l'on remonte ou que l'on revient en haut. Le seuil de direction (hystérésis)
 * évite le scintillement du scroll inertiel.
 */
export function nextHeaderHidden(hidden: boolean, sample: ScrollSample): boolean {
  if (sample.scrollTop <= TOP_THRESHOLD_PX) return false;
  if (sample.delta >= DIRECTION_THRESHOLD_PX) {
    return sample.scrollTop > HIDE_AFTER_PX;
  }
  if (sample.delta <= -DIRECTION_THRESHOLD_PX) return false;
  return hidden;
}
