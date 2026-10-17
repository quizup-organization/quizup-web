import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SelectRow } from "@/shared/components/select-row"
import { TopicIcon } from "@/shared/components/topic-icon"
import { showSuccessToast } from "@/shared/utils/success-toast"
import { equippedTitle, type PlayerTitles } from "../domain/progression"
import { useEquipTitle } from "../hooks/useEquipTitle"
import { useEquippedTitleLabel } from "../hooks/useEquippedTitleLabel"
import { GRADE_KEYS } from "./labels"
import { TitlePickerDialog } from "./TitlePickerDialog"

interface TitleSectionProps {
  userId: string
  titles: PlayerTitles
}

/**
 * Réglages — **titre affiché** : ligne d'état (titre porté et visuel de son sujet, ou aucun) et
 * sélection dans la **popup dédiée** (`TitlePickerDialog`, même forme que « Choisis un joueur »).
 * Le retrait vit ici, **hors popup** ; la progression des grades de maîtrise vit dans l'onglet
 * « Titres » de chaque sujet (activation possible depuis là aussi).
 */
export function TitleSection({ userId, titles }: TitleSectionProps) {
  const { t } = useTranslation()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSession, setPickerSession] = useState(0)
  const equipTitle = useEquipTitle(userId)
  const label = useEquippedTitleLabel(titles)
  const equipped = equippedTitle(titles)

  /** Rouvre la popup sur un état vierge (le composant reste monté pour l'animation de fermeture). */
  function openPicker() {
    setPickerSession((session) => session + 1)
    setPickerOpen(true)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {t("progression.titlesHint")}
      </p>

      <SelectRow
        visual={
          equipped ? (
            <TopicIcon topic={equipped.topic} size={36} />
          ) : (
            <span
              className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
              aria-hidden
            >
              <Crown className="size-4" />
            </span>
          )
        }
        title={label ?? t("progression.titlesNone")}
        subtitle={equipped ? t(GRADE_KEYS[equipped.grade]) : null}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={openPicker}>{t("progression.titlesPick")}</Button>
        {equipped && (
          <Button
            variant="destructive"
            disabled={equipTitle.isPending}
            onClick={() =>
              equipTitle.mutate(null, {
                onSuccess: () =>
                  showSuccessToast(t("progression.toasts.titleRemoved")),
              })
            }
          >
            {t("progression.titleRemove")}
          </Button>
        )}
      </div>

      <TitlePickerDialog
        key={pickerSession}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        userId={userId}
        titles={titles}
      />
    </div>
  )
}
