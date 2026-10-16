import { cn } from "cn"

interface TitleRibbonProps {
  /** Libellé du titre porté (déjà composé : nom thématique ou « Grade · Sujet »). */
  label: string
  className?: string
}

/**
 * Ruban **doré** du titre porté — bande à pointes latérales, dégradé or et encre foncée, à
 * l'image du bandeau de récompense de la maquette `img_11.png`. Affiché sous le nom du joueur
 * (bandeau de profil) quand un titre thématique est porté, en remplacement de la mention du
 * titre dans la ligne d'info.
 */
export function TitleRibbon({ label, className }: TitleRibbonProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full drop-shadow-[0_2px_1.5px_rgb(0_0_0/0.3)]",
        className
      )}
    >
      <span
        className="inline-block max-w-full px-6 py-1 text-center font-heading text-sm leading-snug font-bold break-words"
        style={{
          background:
            "linear-gradient(180deg, #f6da80 0%, #e9bb45 45%, #cd9424 100%)",
          color: "#3f2a00",
          clipPath:
            "polygon(0 50%, 0.75rem 0, calc(100% - 0.75rem) 0, 100% 50%, calc(100% - 0.75rem) 100%, 0.75rem 100%)",
          boxShadow:
            "inset 0 1px 0 rgb(255 255 255 / 0.55), inset 0 -1px 0 rgb(96 62 0 / 0.4)",
        }}
      >
        {label}
      </span>
    </span>
  )
}
