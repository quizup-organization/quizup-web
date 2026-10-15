import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Flame, Gauge, Smile, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppDialog } from "@/shared/components/app-dialog"
import type { BotDifficulty } from "@/features/game/domain/game-dto"
import type { TranslationKey } from "@/lib/i18n/types"

const DIFFICULTIES: readonly {
  value: BotDifficulty
  icon: LucideIcon
  labelKey: TranslationKey
  hintKey: TranslationKey
}[] = [
  {
    value: "EASY",
    icon: Smile,
    labelKey: "game.playMode.difficulties.easy.label",
    hintKey: "game.playMode.difficulties.easy.hint",
  },
  {
    value: "NORMAL",
    icon: Gauge,
    labelKey: "game.playMode.difficulties.normal.label",
    hintKey: "game.playMode.difficulties.normal.hint",
  },
  {
    value: "HARD",
    icon: Flame,
    labelKey: "game.playMode.difficulties.hard.label",
    hintKey: "game.playMode.difficulties.hard.hint",
  },
]

interface TrainBotDialogProps {
  open: boolean
  onClose: () => void
  onStart: (difficulty: BotDifficulty) => void
  pending?: boolean
}

/**
 * Choix de difficulté pour l'entraînement contre un robot, ouvert depuis la popup
 * « Aucun adversaire trouvé ». Démarre une **salle bot** (le bot la rejoint automatiquement) :
 * duel sans XP, la progression venant des duels entre joueurs.
 */
export function TrainBotDialog({
  open,
  onClose,
  onStart,
  pending = false,
}: TrainBotDialogProps) {
  const { t } = useTranslation()
  const [difficulty, setDifficulty] = useState<BotDifficulty>("NORMAL")

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={t("game.matchmaking.trainTitle")}
      sub={t("game.matchmaking.trainSub")}
      sheetOnTouch
      footer={
        <div className="flex w-full gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t("game.playMode.cancel")}
          </Button>
          <Button
            className="flex-1"
            disabled={pending}
            onClick={() => onStart(difficulty)}
          >
            {t("game.matchmaking.trainStart")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-2.5">
        {DIFFICULTIES.map((option) => {
          const selected = difficulty === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setDifficulty(option.value)}
              className="flex items-start gap-3 rounded-lg border p-3 text-left transition-colors"
              style={{
                borderColor: selected ? "var(--primary)" : "var(--border)",
                background: selected
                  ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                  : "var(--card)",
              }}
            >
              <option.icon
                size={20}
                className="mt-0.5 shrink-0"
                color={selected ? "var(--primary)" : "var(--muted-foreground)"}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  {t(option.labelKey)}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t(option.hintKey)}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </AppDialog>
  )
}
