/** Libellé de la tuile « aucun » (attribut retiré). */
export const NONE_LABEL = "Aucun";

/** Onglet « Style » (sélecteur de style, géré par la page). */
export const STYLE_GROUP_ID = "style";

/** Variantes numérotées (`numberedVariants("variant", 3)` → variant01…variant03). */
export function numberedVariants(prefix: string, count: number): readonly string[] {
  return Array.from(
    { length: count },
    (_, index) => `${prefix}${String(index + 1).padStart(2, "0")}`,
  );
}

/** Libellé lisible pour les variantes génériques (`variant03` → « Variante 3 »). */
export function humanizeVariant(variant: string): string {
  const match = /^(variant|happy|sad)(\d+)$/.exec(variant);
  if (!match) return variant;
  const [, prefix, digits] = match;
  const label = prefix === "happy" ? "Sourire" : prefix === "sad" ? "Triste" : "Variante";
  return `${label} ${Number(digits)}`;
}
