import { useTranslation } from "react-i18next"
import { Bot } from "lucide-react"
import { TOKEN, veil } from "@/shared/theme/tokens"

interface TrainingNoteProps {
  /** Niveau courant, XP totale et palier suivant figés à l'instant de la partie (`/result`). */
  level: number
  xpTotal: number
  xpForNextLevel: number
}

/**
 * Entraînement (duel contre bot) : **aucune XP n'est attribuée**. La note remplace l'anneau de
 * niveau — qui matérialise un gain d'XP — et rappelle où en est le joueur, pour que l'écran de
 * fin ne soit jamais un zéro muet.
 */
export function TrainingNote({
  level,
  xpTotal,
  xpForNextLevel,
}: TrainingNoteProps) {
  const { t } = useTranslation()
  const remaining = Math.max(0, xpForNextLevel - xpTotal)

  return (
    <div
      className="flex w-full max-w-[420px] items-center gap-3 rounded-xl border"
      style={{
        borderColor: veil(TOKEN.gauge, 45),
        background: veil(TOKEN.duelSurface, 3),
        padding: "clamp(6px, 1.2dvh, 12px) clamp(10px, 2.5vw, 16px)",
      }}
    >
      <Bot size={18} aria-hidden style={{ color: TOKEN.gauge, flexShrink: 0 }} />
      <div className="flex min-w-0 flex-col">
        <span
          style={{
            color: TOKEN.gauge,
            fontSize: "clamp(9px, 1.3dvh, 11.5px)",
            fontWeight: 800,
            letterSpacing: "0.08em",
          }}
        >
          {t("game.result.training.title")}
        </span>
        <span
          style={{
            color: TOKEN.duelSurfaceMuted,
            fontSize: "clamp(8.5px, 1.15dvh, 11.5px)",
            lineHeight: 1.25,
          }}
        >
          {t("game.result.training.note")}
        </span>
        <span
          style={{
            color: TOKEN.duelSurfaceMuted,
            fontSize: "clamp(8px, 1.05dvh, 10.5px)",
          }}
        >
          {t("game.result.training.level", {
            level,
            remaining,
            next: level + 1,
          })}
        </span>
      </div>
    </div>
  )
}
