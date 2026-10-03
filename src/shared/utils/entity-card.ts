/**
 * Convertit un accent (hex) en `rgb(r g b / a)`.
 * On évite `color-mix()` dans les dégradés : certains navigateurs le rastérisent mal aux
 * zooms fractionnaires (120 %, 130 %). Repli `color-mix` uniquement pour un accent non-hex
 * (`var(--primary)`).
 */
function rgba(accent: string, alpha: number): string {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(accent.trim());
  if (!hex) {
    return `color-mix(in srgb, ${accent} ${Math.round(alpha * 100)}%, transparent)`;
  }
  let value = hex[1];
  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

/**
 * Fond dégradé teinté d'une carte de sujet, exposé en variable CSS `--qu-bg` et rendu sur un
 * pseudo-élément (bordure sans couture, pas de dégradé sous la bordure).
 */
export function entityCardBackground(accent: string): string {
  return [
    `radial-gradient(130% 130% at 0% 0%, ${rgba(accent, 0.22)} 0%, ${rgba(accent, 0.08)} 40%, ${rgba(accent, 0)} 62%)`,
    `linear-gradient(120deg, ${rgba(accent, 0.1)} 0%, ${rgba(accent, 0)} 70%)`,
  ].join(", ");
}
