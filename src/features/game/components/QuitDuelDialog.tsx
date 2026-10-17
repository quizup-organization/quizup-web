import { useTranslation } from "react-i18next"
import { LogOut } from "lucide-react"
import { BottomSheet } from "@/components/arc/bottom-sheet/bottom-sheet"
import { Button } from "@/components/ui/button"
import { AppDialog } from "@/shared/components/app-dialog"
import { useIsTouchLayout } from "@/shared/hooks/use-device"
import { SHEET_DETENTS } from "@/shared/theme/sheets"
import { TOKEN } from "@/shared/theme/tokens"

interface QuitDuelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Abandon = forfait : la fermeture de la modale est gérée par l'appelant. */
  onAbandon: () => void
}

/**
 * Confirmation d'abandon d'un duel : bottom sheet sur tactile (cohérent avec les autres modales
 * de l'arène), dialog centré sur desktop.
 */
export function QuitDuelDialog({
  open,
  onOpenChange,
  onAbandon,
}: QuitDuelDialogProps) {
  const { t } = useTranslation()
  const isTouch = useIsTouchLayout()

  const content = (
    <span className="text-sm leading-relaxed text-muted-foreground">
      {t("game.arena.abandonBody")}
    </span>
  )
  const actions = (
    <>
      <Button variant="ghost" onClick={() => onOpenChange(false)}>
        {t("game.arena.continue")}
      </Button>
      <Button
        variant="destructive"
        onClick={() => {
          onOpenChange(false)
          onAbandon()
        }}
      >
        <LogOut size={15} /> {t("game.arena.abandon")}
      </Button>
    </>
  )

  if (!isTouch) {
    return (
      <AppDialog
        open={open}
        onClose={() => onOpenChange(false)}
        title={t("game.arena.abandonTitle")}
        sub={t("game.arena.abandonDescription")}
        footer={actions}
      >
        {content}
      </AppDialog>
    )
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onOpenChange(false)
      }}
      title={t("game.arena.abandonTitle")}
      description={t("game.arena.abandonDescription")}
      detents={SHEET_DETENTS.confirm}
      closeLabel={t("game.arena.close")}
      surfaceStyle={{
        background: TOKEN.duelBg,
        color: TOKEN.duelSurface,
        borderColor: "transparent",
      }}
      footerStyle={{
        background: TOKEN.duelBg,
        borderTopColor: TOKEN.border,
      }}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 [&>button]:flex-1">
          {actions}
        </div>
      }
    >
      {content}
    </BottomSheet>
  )
}
