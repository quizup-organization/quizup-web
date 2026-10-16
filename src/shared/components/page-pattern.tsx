import type { CSSProperties } from "react"
import { cn } from "cn"

interface PagePatternProps {
  /** Couleur du motif (variable CSS ou hex). Défaut : couleur de texte du thème. */
  tint?: string
  /** Opacité forcée (0–1). Par défaut, pilotée par `.page-pattern` (plus visible en clair). */
  opacity?: number
  /** Taille de la tuile répétée (`mask-size`). Défaut défini par `.qu-pattern` (330 px, motif à ×1,5). */
  size?: string
  className?: string
}

/**
 * Fond de page : texture d'icônes issue de `assets/background.svg` via l'utilitaire
 * `.qu-pattern` (le SVG sert de masque, la teinte vient de `background-color`). Couche
 * décorative fixe, posée derrière le contenu de la colonne principale. La tuile est à **×1,5**
 * (330 px : icônes ~15 px) et l'opacité par défaut est **uniforme clair/sombre**
 * (`.page-pattern`, ajustable via `--qu-pattern-opacity`).
 */
export function PagePattern({
  tint = "var(--foreground)",
  opacity,
  size,
  className,
}: PagePatternProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "page-pattern qu-pattern pointer-events-none absolute inset-0 z-0",
        className
      )}
      style={{
        backgroundColor: tint,
        ...(opacity != null ? { opacity } : {}),
        ...(size ? ({ "--qu-pattern-size": size } as CSSProperties) : {}),
      }}
    />
  )
}
