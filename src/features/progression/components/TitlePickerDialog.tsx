import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppDialog } from "@/shared/components/app-dialog"
import { SelectRow } from "@/shared/components/select-row"
import { TopicIcon } from "@/shared/components/topic-icon"
import { useDevice } from "@/shared/hooks/use-device"
import { SHEET_DETENTS } from "@/shared/theme/sheets"
import { showSuccessToast } from "@/shared/utils/success-toast"
import { titleRankOf, type PlayerTitles } from "../domain/progression"
import { useEquipTitle } from "../hooks/useEquipTitle"
import { useTitleLabel } from "../hooks/useTitleLabel"
import { GRADE_KEYS } from "./labels"
import { RankBadge } from "./RankBadge"

interface TitlePickerDialogProps {
  open: boolean
  onClose: () => void
  userId: string
  /** Titres **débloqués** (un par sujet joué) + la clé du titre porté. */
  titles: PlayerTitles
}

/** Repli casse/accents du filtre de recherche. */
function fold(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

/**
 * Choix du **titre porté** — même forme que la sélection d'un joueur de défi : popup (bottom
 * sheet en tactile), recherche (toolbar desktop / bottomBar compact), lignes de sélection
 * (`SelectRow` : icône du sujet, libellé composé, progression vers le grade suivant) et
 * validation explicite (« Afficher ce titre »). Le titre porté est pré-sélectionné à
 * l'ouverture ; le retrait du titre vit **hors** de cette popup (Réglages).
 */
export function TitlePickerDialog({
  open,
  onClose,
  userId,
  titles,
}: TitlePickerDialogProps) {
  const { t, i18n } = useTranslation()
  const compact = useDevice() === "compact"
  const labelOf = useTitleLabel()
  const equipTitle = useEquipTitle(userId)
  const [query, setQuery] = useState("")
  // Titre porté pré-sélectionné : le composant est **remonté** à chaque ouverture (« clé de
  // session » côté appelant), l'état initial se recale donc seul — jamais d'effet de synchro.
  const [selectedKey, setSelectedKey] = useState<string | null>(
    () => titles.equippedKey
  )

  const needle = fold(query.trim())
  const rows = needle
    ? titles.titles.filter((title) => fold(labelOf(title)).includes(needle))
    : titles.titles
  const canEquip =
    selectedKey !== null &&
    selectedKey !== titles.equippedKey &&
    !equipTitle.isPending

  const searchField = (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur()
        }}
        enterKeyHint="search"
        placeholder={t("progression.titlesSearchPlaceholder")}
        className="pl-9"
      />
    </div>
  )

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={t("progression.titlesTitle")}
      sub={t("progression.titlesHint")}
      className="sm:max-w-md"
      sheetOnTouch
      sheetDetents={SHEET_DETENTS.duel}
      bodyClassName="flex flex-col"
      footerClassName="compact:flex-row compact:items-center"
      toolbar={compact ? undefined : searchField}
      bottomBar={compact ? searchField : undefined}
      footer={
        <>
          <Button variant="destructive" onClick={onClose}>
            {t("shared.actions.cancel")}
          </Button>
          <div className="flex-1" />
          <Button
            disabled={!canEquip}
            onClick={() => {
              if (!selectedKey) return
              equipTitle.mutate(selectedKey, {
                onSuccess: () => {
                  showSuccessToast(t("progression.toasts.titleEquipped"))
                  onClose()
                },
              })
            }}
          >
            {t("progression.titleEquip")}
          </Button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {titles.titles.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {t("progression.titlesEmpty")}
          </p>
        ) : rows.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {t("progression.titlesSearchEmpty")}
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain">
            {rows.map((title) => (
              <SelectRow
                key={title.key}
                visual={<TopicIcon topic={title.topic} size={36} />}
                title={labelOf(title)}
                subtitle={
                  <span className="flex items-center gap-1.5">
                    <RankBadge rank={titleRankOf(title)} />
                    <span className="truncate">
                      {title.nextGrade
                        ? t("progression.titleToNextGrade", {
                            remaining: title.gradeRemainingXp.toLocaleString(
                              i18n.language
                            ),
                            grade: t(GRADE_KEYS[title.nextGrade]),
                          })
                        : t(GRADE_KEYS.LEGENDE)}
                    </span>
                  </span>
                }
                selected={selectedKey === title.key}
                onSelect={() => {
                  // Replie le clavier mobile après sélection (footer accessible).
                  ;(document.activeElement as HTMLElement | null)?.blur()
                  setSelectedKey(title.key)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </AppDialog>
  )
}
