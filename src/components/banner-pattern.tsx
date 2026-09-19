import type { CSSProperties } from "react";
import { cn } from "cn";

/**
 * Texture d'icônes en filigrane des bandeaux (fiche thème, profil).
 * Couche absolue posée dans un conteneur `relative overflow-hidden` ; le motif vient de
 * `assets/background.svg` via l'utilité `.qu-pattern` (masque) et se teinte par `tint`.
 * Purement décoratif (`aria-hidden`).
 */
interface BannerPatternProps {
    /** Couleur du motif (hex de sujet ou variable CSS). Défaut : couleur de texte héritée. */
    tint?: string;
    /** Opacité du filigrane (0–1). Défaut : 0.07. */
    opacity?: number;
    /** Taille de la tuile répétée (`mask-size`). Défaut défini par `.qu-pattern`. */
    size?: string;
    className?: string;
}

export function BannerPattern({ tint = "currentColor", opacity = 0.07, size, className }: BannerPatternProps) {
    return (
        <span
            aria-hidden
            className={cn("qu-pattern pointer-events-none absolute inset-0 z-0", className)}
            style={{
                backgroundColor: tint,
                opacity,
                ...(size ? ({ "--qu-pattern-size": size } as CSSProperties) : {}),
            }}
        />
    );
}
