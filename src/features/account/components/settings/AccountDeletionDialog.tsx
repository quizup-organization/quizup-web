import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppDialog } from "@/shared/components/app-dialog"
import { clearSession } from "@/features/auth"
import type { ApiError } from "@/shared/types/api"
import {
  useDeleteAccount,
  useRequestAccountDeletionCode,
} from "../../hooks/useAccountDeletion"

interface AccountDeletionDialogProps {
  open: boolean
  onClose: () => void
  email?: string | null
}

const CONFIRMATION = "SUPPRIMER"

/**
 * Suppression définitive : rappel des conséquences, code OTP envoyé par email puis saisie
 * de `SUPPRIMER`. La session locale est purgée après succès et l'utilisateur revient au
 * login avec un message dédié.
 */
export function AccountDeletionDialog({
  open,
  onClose,
  email,
}: AccountDeletionDialogProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const requestCode = useRequestAccountDeletionCode()
  const deleteAccount = useDeleteAccount()
  const [step, setStep] = useState<"warning" | "confirm">("warning")
  const [code, setCode] = useState("")
  const [confirmation, setConfirmation] = useState("")

  const requestError = requestCode.error as ApiError | null
  const deleteError = deleteAccount.error as ApiError | null
  const isValid =
    /^\d{6}$/.test(code) && confirmation.trim().toUpperCase() === CONFIRMATION

  const sendCode = () => {
    requestCode.mutate(undefined, {
      onSuccess: () => setStep("confirm"),
    })
  }

  const submit = () => {
    if (!isValid) return
    deleteAccount.mutate(
      { code, confirmation },
      {
        onSuccess: () => {
          void clearSession().then(() =>
            navigate("/login?deleted=1", { replace: true })
          )
        },
      }
    )
  }

  return (
    <AppDialog
      open={open}
      onClose={
        requestCode.isPending || deleteAccount.isPending
          ? () => undefined
          : onClose
      }
      title={t("shell.settings.danger.dialog.title")}
      sub={t("shell.settings.danger.dialog.subtitle")}
      sheetOnTouch
      dismissible={!requestCode.isPending && !deleteAccount.isPending}
      footer={
        step === "warning" ? (
          <>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={requestCode.isPending}
            >
              {t("shell.settings.danger.dialog.cancel")}
            </Button>
            <Button
              onClick={sendCode}
              disabled={requestCode.isPending}
            >
              {requestCode.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t("shell.settings.danger.dialog.sendCode")}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={requestCode.isPending || deleteAccount.isPending}
            >
              {t("shell.settings.danger.dialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={submit}
              disabled={!isValid || deleteAccount.isPending}
            >
              {deleteAccount.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t("shell.settings.danger.dialog.delete")}
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{t("shell.settings.danger.dialog.warning")}</p>
        </div>

        {step === "warning" ? (
          <p className="text-sm text-muted-foreground">
            {t("shell.settings.danger.dialog.codeHint", { email: email ?? "" })}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {t("shell.settings.danger.dialog.codeSent", { email: email ?? "" })}
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="account-deletion-code">
                {t("shell.settings.danger.dialog.codeLabel")}
              </Label>
              <Input
                id="account-deletion-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="account-deletion-confirmation">
                {t("shell.settings.danger.dialog.confirmationLabel", {
                  word: CONFIRMATION,
                })}
              </Label>
              <Input
                id="account-deletion-confirmation"
                autoComplete="off"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder={CONFIRMATION}
              />
            </div>
            <Button
              type="button"
              variant="link"
              className="self-start px-0"
              onClick={sendCode}
              disabled={requestCode.isPending}
            >
              {t("shell.settings.danger.dialog.resend")}
            </Button>
          </>
        )}

        {(requestError || deleteError) && (
          <p className="text-sm text-destructive">
            {deleteError?.detail ??
              requestError?.detail ??
              t("shell.settings.danger.dialog.error")}
          </p>
        )}
      </div>
    </AppDialog>
  )
}
