import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { LogOut } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormRow, FormSection } from "@/shared/components/form-section"
import { showSuccessToast } from "@/shared/utils/success-toast"
import { PageContainer } from "@/features/shell"
import { useMe } from "@/features/shell"
import { useLogout } from "@/features/auth"
import { InstallAppSection } from "../components/InstallAppSection"
import { SettingsAppearanceSection } from "../components/settings/SettingsAppearanceSection"
import { SettingsNotificationsSection } from "../components/settings/SettingsNotificationsSection"
import { SettingsProfileSection } from "../components/settings/SettingsProfileSection"
import { SettingsSoundSection } from "../components/settings/SettingsSoundSection"
import {
  useUpdateProfile,
  type UpdateProfilePatch,
} from "../hooks/useUpdateProfile"

/** Réglages : profil (par champ), compte, notifications, apparence et session. */
export function SettingsPage() {
  const { userId, data: me } = useMe()
  const { t } = useTranslation()
  const logout = useLogout()
  const update = useUpdateProfile()

  /** Enregistrement par champ : confirmation par toast (id stable ⇒ pas d'empilement). */
  const savePatch = (patch: UpdateProfilePatch) =>
    update
      .mutateAsync(patch)
      .then(() => {
        showSuccessToast(t("shell.settings.saveSuccess"), {
          id: "settings-save",
        })
      })
      .catch(() => {
        toast.error(t("shell.settings.saveError"), { id: "settings-save" })
      })

  return (
    <PageContainer className="max-w-[880px]">
      <SettingsProfileSection me={me} userId={userId} onSavePatch={savePatch} />

      <FormSection title={t("shell.settings.sections.account")}>
        <FormRow
          label={t("shell.settings.email.label")}
          description={t("shell.settings.email.description")}
          htmlFor="s-email"
        >
          <Input id="s-email" value={me?.email ?? ""} disabled />
        </FormRow>
      </FormSection>

      <SettingsNotificationsSection />

      <SettingsSoundSection />

      <InstallAppSection />

      <SettingsAppearanceSection me={me} onSavePatch={savePatch} />

      <FormSection title={t("shell.settings.sections.session")}>
        <FormRow
          label={t("shell.settings.session.label")}
          description={t("shell.settings.session.description")}
          controlClassName="flex tablet-up:justify-end"
        >
          <Button variant="outline" onClick={() => void logout()}>
            <LogOut /> {t("shell.settings.session.logout")}
          </Button>
        </FormRow>
      </FormSection>

      <p className="pt-1 text-center text-xs text-muted-foreground">
        <Link to="/profile" className="underline underline-offset-2">
          {t("shell.settings.backToProfile")}
        </Link>
      </p>

      <p className="pt-4 text-center text-2xs text-muted-foreground/70">
        QuizUp Web · v{__APP_VERSION__}
      </p>
    </PageContainer>
  )
}
