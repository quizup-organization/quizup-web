import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { cn } from "cn"
import rubanUrl from "@/assets/ruban.svg"
import {
  RIBBON_TITLE_SIZE,
  RIBBON_TITLE_CURVE,
  RIBBON_VIEWBOX,
  fitRibbonTitle,
} from "../domain/ribbon"

interface TitleRibbonProps {
  /** Libellé du titre porté (déjà composé : nom thématique ou « Grade · Sujet »). */
  label: string
  className?: string
}

/**
 * Ruban **doré** du titre porté — bannière `src/assets/ruban.svg` (bandeau, queues plissées, or
 * métallique) avec le titre **inséré et courbé** sur la ligne médiane du bandeau (`<textPath>`),
 * à l'image du bandeau de récompense de la maquette `img_11.png`. Affiché sous le nom du joueur
 * (bandeau de profil) quand un titre thématique est porté.
 *
 * L'overlay texte partage le `viewBox` de l'asset : le titre vit dans le repère du ruban (aucune
 * déformation possible à l'affichage, à toutes les tailles d'écran). Un libellé trop large est
 * d'abord réduit (corps), puis comprimé (`textLength` `spacingAndGlyphs`) — jamais étiré quand il
 * tient déjà.
 *
 * La mesure porte sur un nœud **libre** (jamais contraint par `textLength`) : la décision
 * d'ajustement reste stable d'un rendu à l'autre.
 */
export function TitleRibbon({ label, className }: TitleRibbonProps) {
  const curveId = `ruban-courbe-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const measureRef = useRef<SVGTextElement>(null)
  /** Largeur naturelle du libellé **au corps de base** (unités du viewBox), avant mesure. */
  const [width, setWidth] = useState<number | null>(null)

  const measure = useCallback((size: number) => {
    const node = measureRef.current
    if (!node || typeof node.getComputedTextLength !== "function") return
    // `getComputedTextLength` est exprimé dans le repère de l'asset : on normalise au corps de
    // base pour que la mesure ne dépende pas du corps courant (et donc ne redéclenche pas
    // d'ajustement en boucle).
    const length = (node.getComputedTextLength() * RIBBON_TITLE_SIZE) / size
    setWidth((current) =>
      current !== null && Math.abs(current - length) < 0.5 ? current : length
    )
  }, [])

  const fitted = fitRibbonTitle(width, label)

  // Mesure avant peinture : le titre n'est jamais peint à la mauvaise taille.
  useLayoutEffect(() => {
    measure(fitted.fontSize)
  }, [measure, label, fitted.fontSize])

  // Re-mesure quand Inter est prête : la première mesure peut porter sur la police de repli.
  useEffect(() => {
    const fonts = document.fonts as FontFaceSet | undefined
    if (!fonts || typeof fonts.ready !== "object") return
    let cancelled = false
    void fonts.ready.then(() => {
      if (!cancelled) measure(fitted.fontSize)
    })
    return () => {
      cancelled = true
    }
  }, [measure, label, fitted.fontSize])

  return (
    <span
      className={cn(
        "relative inline-block w-full max-w-[30rem] align-top",
        className
      )}
    >
      <img src={rubanUrl} alt="" aria-hidden className="block h-auto w-full" />
      <svg
        viewBox={RIBBON_VIEWBOX}
        role="img"
        aria-label={label}
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <path id={curveId} d={RIBBON_TITLE_CURVE} fill="none" />
        </defs>
        <text
          className="font-heading"
          fill="#4a2f00"
          stroke="#fff3b0"
          strokeWidth={0.8}
          paintOrder="stroke"
          fontWeight={700}
          fontSize={fitted.fontSize}
          dominantBaseline="central"
          aria-hidden
        >
          <textPath
            href={`#${curveId}`}
            startOffset="50%"
            textAnchor="middle"
            textLength={fitted.textLength ?? undefined}
            lengthAdjust={fitted.textLength ? "spacingAndGlyphs" : undefined}
          >
            {label}
          </textPath>
        </text>
        {/* Mesure libre du libellé (même corps, même police) — jamais contrainte par `textLength`. */}
        <text
          ref={measureRef}
          data-measure=""
          className="font-heading"
          fontWeight={700}
          fontSize={fitted.fontSize}
          x={0}
          y={0}
          opacity={0}
          aria-hidden
          pointerEvents="none"
        >
          {label}
        </text>
      </svg>
    </span>
  )
}
