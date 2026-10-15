import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { AppDialog } from "@/shared/components/app-dialog"

interface NoOpponentDialogProps {
  open: boolean
  /** Relance une recherche (nouveau ticket sur le même sujet). */
  onRetry: () => void
  /** Bascule sur l'entraînement contre un robot (ouvre le choix de difficulté). */
  onTrain: () => void
  retryPending?: boolean
}

/**
 * Popup affichée quand la fenêtre de recherche (10 s) s'écoule sans adversaire : le joueur
 * choisit de relancer une recherche ou de s'entraîner contre un robot. **Non refutable** :
 * modale **centrée sur tous les devices** (jamais une bottom sheet, qui se laisse glisser),
 * sans croix ni clic extérieur ni Échap — comme l'invitation de défi.
 */
export function NoOpponentDialog({
  open,
  onRetry,
  onTrain,
  retryPending = false,
}: NoOpponentDialogProps) {
  const { t } = useTranslation()

  return (
    <AppDialog
      open={open}
      onClose={() => undefined}
      title={t("game.matchmaking.noOpponentTitle")}
      sub={t("game.matchmaking.noOpponentSub")}
      dismissible={false}
      showCloseButton={false}
      footer={
        <div className="flex w-full flex-col gap-2">
          <Button className="w-full" disabled={retryPending} onClick={onRetry}>
            {t("game.matchmaking.retry")}
          </Button>
          <Button variant="outline" className="w-full" onClick={onTrain}>
            {t("game.matchmaking.train")}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground">
        {t("game.matchmaking.noOpponentBody")}
      </p>
    </AppDialog>
  )
}
