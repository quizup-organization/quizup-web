import { useTranslation } from "react-i18next"
import { TOKEN } from "@/shared/theme/tokens"
import { RESULT_WHITE } from "./palette"

interface PlayerMetaProps {
  name: string
  title: string
  level: number | null
  color: string
}

/** Nom, titre de progression et niveau d'un joueur (2ᵉ ligne de la maquette). */
export function PlayerMeta({ name, title, level, color }: PlayerMetaProps) {
  const { t } = useTranslation()
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <span
        className="max-w-full truncate"
        style={{
          color,
          fontSize: "clamp(13px, 1.9dvh, 16px)",
          fontWeight: 700,
        }}
      >
        {name}
      </span>
      <span
        className="max-w-full truncate"
        style={{
          color: TOKEN.duelSurfaceMuted,
          fontSize: 11,
          lineHeight: 1.3,
        }}
      >
        {title || "\u00A0"}
      </span>
      <span
        style={{
          color: RESULT_WHITE,
          fontSize: "clamp(11px, 1.6dvh, 12.5px)",
          fontWeight: 600,
        }}
      >
        {level != null
          ? t("game.result.level", { level })
          : t("game.result.levelUnknown")}
      </span>
    </div>
  )
}
