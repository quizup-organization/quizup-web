import type { CSSProperties } from "react"
import { cn } from "cn"

interface PagePatternProps {
  /** Couleur du motif (variable CSS ou hex). Défaut : `--qu-pattern-tint` du thème. */
  tint?: string
  /** Opacité forcée (0–1). Par défaut, pilotée par `.page-pattern` (contraste doux). */
  opacity?: number
  /** Taille de la tuile répétée (`mask-size`). Défaut défini par `.qu-pattern` (280 px). */
  size?: string
  className?: string
}

/**
 * Fond de page : **papier peint doodle officiel de WhatsApp** (`assets/background.svg`, planche de
 * 374 × 666) utilisé via l'utilitaire `.qu-pattern` — le SVG sert de masque, la teinte vient de
 * `background-color`. Couche décorative fixe, posée derrière le contenu de la colonne principale.
 * Rendu « conversation » : tuile de **280 px** (gribouillis ~36 px, la maille d'une conversation
 * WhatsApp) et opacité par défaut douce (`.page-pattern` : 8 % en clair, 8 % en sombre — ajustable
 * via `--qu-pattern-opacity`). La teinte vient de `--qu-pattern-tint` (brun chaud sur le canvas
 * beige clair, texte clair en sombre), jamais d'un gris/noir plaqué sur le beige. Le fichier
 * n'étant **pas** un motif raccord (tracés coupés au bord de la planche), la densité et le
 * contraste sont les deux seuls réglages : `--qu-pattern-size` / `--qu-pattern-opacity`.
 */
export function PagePattern({
  tint = "var(--qu-pattern-tint)",
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
