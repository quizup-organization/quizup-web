/**
 * Géométrie et ajustement du **ruban de titre** (`src/assets/ruban/ruban-*.svg`).
 * Purement descriptif : toutes les mesures sont exprimées dans le repère (`viewBox`) des assets,
 * donc indépendantes de la taille d'affichage.
 *
 * <p>Les sept assets de rang partagent le même repère et le même bandeau droit : le titre est
 * superposé en `(470, 100)`, centré, dans la largeur utile de `540` unités.</p>
 */

import type { Rank } from "./progression"

/** `viewBox` commun des assets de ruban (marge incluse : queues latérales et ombre). */
export const RIBBON_VIEWBOX = "0 0 940 240"

/** Centre du bandeau dans le repère de l'asset (`x` du texte baké d'origine). */
export const RIBBON_TITLE_X = 470

/** Ligne médiane du bandeau dans le repère de l'asset (`y` du texte baké d'origine). */
export const RIBBON_TITLE_Y = 100

/** Corps de base et plancher du titre, en unités du viewBox (placeholder des assets : 58). */
export const RIBBON_TITLE_SIZE = 58
export const RIBBON_TITLE_MIN_SIZE = 40

/**
 * Police du titre : **Bodoni Moda** (auto-hébergée via Fontsource), didone au contraste marqué,
 * choisie pour son rendu « gravé ». La variable Fontsource s'appelle `Bodoni Moda Variable`,
 * les replis couvrent les assets ouverts hors web (démo, SVG exporté).
 */
export const RIBBON_TITLE_FONT =
  "'Bodoni Moda Variable', 'Bodoni Moda', 'Bodoni MT', Didot, 'Times New Roman', serif"

/**
 * Largeur utile du titre : le bandeau fait 640 unités (`x 150→790`), on conserve une marge de
 * chaque côté (valeur `data-max-width` des assets).
 */
export const RIBBON_TITLE_MAX_WIDTH = 540

/**
 * Encre du titre par rang : couples `fill`/`stroke` relevés dans les assets d'origine, pour que
 * le libellé superposé garde exactement le rendu du ruban.
 */
export interface RibbonInk {
  fill: string
  stroke: string
}

export const RIBBON_INK: Record<Rank, RibbonInk> = {
  FER: { fill: "#101215", stroke: "#d9dce1" },
  BRONZE: { fill: "#35190a", stroke: "#f8dfc4" },
  ARGENT: { fill: "#262b34", stroke: "#ffffff" },
  OR: { fill: "#4a2f00", stroke: "#fff3b0" },
  PLATINE: { fill: "#1a2342", stroke: "#ffffff" },
  EMERAUDE: { fill: "#04281a", stroke: "#dffff0" },
  DIAMANT: { fill: "#0a2a44", stroke: "#ffffff" },
}

/**
 * Largeur moyenne d'un caractère de Bodoni Moda au corps de base, mesurée sur des libellés
 * représentatifs (~0,51 em). Sert uniquement d'estimation avant la mesure réelle.
 */
const RIBBON_TITLE_AVG_WIDTH = 0.51

/** Estimation de la largeur d'un libellé avant toute mesure (premier rendu, police en cours). */
export function estimateRibbonTitleWidth(
  label: string,
  fontSize = RIBBON_TITLE_SIZE
): number {
  return label.length * fontSize * RIBBON_TITLE_AVG_WIDTH
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
