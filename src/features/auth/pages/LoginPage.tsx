import { useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthShell } from "../components/AuthShell"
import { AuthField, AuthSeparator, GoogleIcon } from "../components/AuthField"
import { buildRequestCodeSchema, type RequestCodeValues } from "../schemas"
import { useRequestCode } from "../hooks/useAuth"
import { loginRedirect } from "../lib/oidc"
import {
  clearContinue,
  rememberContinue,
  resumeContinue,
} from "../lib/continue-url"
import { readReturnTo } from "../lib/return-to"
import { selectEndReason, useSessionStore } from "../stores/useSessionStore"
import { config } from "@/lib/config"

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const socialError = searchParams.has("error")
  const endReason = useSessionStore(selectEndReason)
  const requestCodeSchema = useMemo(() => buildRequestCodeSchema(t), [t])
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestCodeValues>({
    resolver: zodResolver(requestCodeSchema),
    defaultValues: { email: "" },
  })
  const requestCode = useRequestCode()

  // Retour du login social (Google) : la session est établie, on enchaîne le PKCE
  // (en conservant la cible mémorisée avant login, ex. lien de salon ou client tiers).
  useEffect(() => {
    if (searchParams.get("social") === "success") {
      if (resumeContinue()) return
      void loginRedirect(readReturnTo() ?? "/")
    }
  }, [searchParams])

  // Client tiers (Grafana, ArgoCD, mobile…) : identity transmet la demande
  // d'autorisation d'origine (`?continue=`) ; elle est reprise après authentification.
  useEffect(() => {
    const target = searchParams.get("continue")
    if (target) {
      rememberContinue(target)
    } else {
      clearContinue()
    }
  }, [searchParams])

  const onSubmit = async (values: RequestCodeValues) => {
    await requestCode.mutateAsync(values)
    void navigate("/login/code", { state: { email: values.email } })
  }

  return (
    <AuthShell>
      <form
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        className="flex flex-col gap-5"
      >
        {endReason && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center text-xs text-destructive">
            {endReason === "unknownUser"
              ? t("auth.login.sessionUnknownUser")
              : t("auth.login.sessionExpired")}
          </p>
        )}
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em]">
            {t("auth.login.title")}
          </h1>
          <p className="text-sm leading-normal text-muted-foreground">
            {t("auth.login.subtitle")}
          </p>
        </div>

        <AuthField label={t("auth.login.emailLabel")} htmlFor="email">
          <Input
            id="email"
            type="email"
            placeholder={t("auth.login.emailPlaceholder")}
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </AuthField>

        {(requestCode.isError || socialError) && (
          <p className="text-center text-xs text-destructive">
            {t("auth.login.requestError")}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || requestCode.isPending}
        >
          {requestCode.isPending
            ? t("auth.login.submitPending")
            : t("auth.login.submit")}
        </Button>

        <AuthSeparator>{t("auth.login.separator")}</AuthSeparator>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = `${config.oidcAuthority}/oauth2/authorization/google`
          }}
        >
          <GoogleIcon /> {t("auth.login.google")}
        </Button>
      </form>
    </AuthShell>
  )
}
