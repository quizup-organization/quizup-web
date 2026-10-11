import { common } from "./common";

/**
 * Catalogue **français** — source de vérité des clés. Les autres langues sont typées
 * structurellement sur `Resources` : une clé manquante casse la compilation.
 */
export const fr = {
  common,
};

export type Resources = typeof fr;
