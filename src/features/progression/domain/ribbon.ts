/**
 * Géométrie et ajustement du **ruban doré** du titre porté (`src/assets/ruban.svg`).
 * Purement descriptif : toutes les mesures sont exprimées dans le repère (`viewBox`) de l'asset,
 * donc indépendantes de la taille d'affichage.
 */

/** `viewBox` de l'asset (marge incluse : queues latérales et plissé débordent du bandeau). */
export const RIBBON_VIEWBOX = "20 330 940 330"

/**
 * Ligne médiane du bandeau, échantillonnée sur le tracé intérieur de l'asset : la bande monte
 * d'environ 42 unités entre ses extrémités (y≈474) et son centre (y≈432). Le titre la suit,
 * courbé, centré par `startOffset="50%"`.
 */
export const RIBBON_TITLE_CURVE = "M 190 474 Q 500 390 810 474"

/** Corps de base et plancher du titre, en unités du viewBox (placeholder de l'asset : 64). */
export const RIBBON_TITLE_SIZE = 62
export const RIBBON_TITLE_MIN_SIZE = 44

/**
 * Largeur utile du titre : le bandeau fait 667 unités intérieures (`x 164→831`), on conserve
 * une marge de chaque côté (valeur `data-max-width` de l'asset).
 */
export const RIBBON_TITLE_MAX_WIDTH = 590

/** Estimation de la largeur d'un libellé avant toute mesure (premier rendu, police en cours). */
export function estimateRibbonTitleWidth(
  label: string,
  fontSize = RIBBON_TITLE_SIZE
): number {
  return label.length * fontSize * 0.55
}

export interface RibbonTitleFit {
  /** Corps du titre, en unités du viewBox. */
  fontSize: number
  /** Longueur forcée (`textLength`) quand même le corps plancher ne suffit pas. */
  textLength: number | null
}

/**
 * Ajuste le titre au bandeau : **réduction linéaire du corps** d'abord (les glyphes gardent leur
 * forme), puis **compression** `spacingAndGlyphs` en dernier recours — la tenue dans le ruban est
 * alors garantie quelle que soit la longueur. Un titre qui tient déjà n'est jamais étiré
 * (`textLength` reste nul : pas d'interlettrage artificiel).
 *
 * `width` est la largeur mesurée **au corps de base** (mesure `getComputedTextLength` normalisée).
 */
export function fitRibbonTitle(
  width: number | null,
  label: string
): RibbonTitleFit {
  const base = width ?? estimateRibbonTitleWidth(label)
  if (!Number.isFinite(base) || base <= RIBBON_TITLE_MAX_WIDTH) {
    return { fontSize: RIBBON_TITLE_SIZE, textLength: null }
  }
  const fontSize = Math.max(
    RIBBON_TITLE_MIN_SIZE,
    Math.floor((RIBBON_TITLE_SIZE * RIBBON_TITLE_MAX_WIDTH) / base)
  )
  const scaled = (base * fontSize) / RIBBON_TITLE_SIZE
  return {
    fontSize,
    textLength: scaled > RIBBON_TITLE_MAX_WIDTH ? RIBBON_TITLE_MAX_WIDTH : null,
  }
}
