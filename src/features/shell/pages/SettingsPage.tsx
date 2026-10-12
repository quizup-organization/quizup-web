import { useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedSwitch } from "@/components/spectrumui/animated-switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PushNotificationSetting,
  useNotificationPreferences,
  useUpdateNotificationPreference,
  type NotificationCategory,
} from "@/features/notifications";
import { InstallAppSection } from "../components/InstallAppSection";
import { UserAvatar } from "@/shared/components/user-avatar";
import { MediaUpload } from "@/shared/components/media-upload";
import { countryFlag, countryLabel } from "@/shared/utils/country";
import { useLocale } from "@/lib/i18n/useLocale";
import {
  FormRow as SettingsRow,
  FormSection as SettingsSection,
} from "@/shared/components/form-section";
import { PageContainer } from "@/features/shell";
import { useMe } from "@/features/shell";
import { useLogout } from "@/features/auth";
import { useTheme } from "../providers/theme-context";
import type { Theme } from "../stores/useThemeStore";
import { useBottomNavStore } from "../stores/useBottomNavStore";
import { useIsTouchLayout } from "@/shared/hooks/use-device";
import type { BottomNavVariant } from "@/components/ui/bottom-nav-bar";
import {
  useUpdateProfile,
  type UpdateProfilePatch,
} from "../hooks/useUpdateProfile";
import type { Language } from "@/features/player/domain/profile";

const COUNTRY_CODES = ["FR", "BE", "CH", "CA", "SN", "JP"] as const;

const LANGS = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

type ProfileValues = z.infer<ReturnType<typeof buildProfileSchema>>;

function buildProfileSchema(t: TFunction) {
  return z.object({
    pseudonym: z
      .string()
      .min(1, t("shell.settings.pseudonym.required"))
      .max(40, t("shell.settings.pseudonym.max")),
    bio: z.string().max(160, t("shell.settings.bio.max")),
    country: z.string(),
  });
}

export function SettingsPage() {
  const { userId, data: me } = useMe();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const logout = useLogout();
  const { theme, setTheme } = useTheme();
  const isTouch = useIsTouchLayout();
  const locale = useLocale();
  const bottomNavVariant = useBottomNavStore((state) => state.variant);
  const setBottomNavVariant = useBottomNavStore((state) => state.setVariant);
  const preferences = useNotificationPreferences();
  const updatePreference = useUpdateNotificationPreference();

  const themes: { value: Theme; label: string }[] = [
    { value: "light", label: t("shell.settings.theme.light") },
    { value: "dark", label: t("shell.settings.theme.dark") },
    { value: "system", label: t("shell.settings.theme.system") },
  ];

  const countries = COUNTRY_CODES.map((code) => ({
    value: code,
    label: `${countryFlag(code)} ${countryLabel(code, locale)}`,
  }));

  const bottomNavVariants: { value: BottomNavVariant; label: string }[] = [
    { value: "floating", label: t("shell.settings.bottomNav.floating") },
    { value: "fixed", label: t("shell.settings.bottomNav.fixed") },
  ];

  const preferenceEnabled = (category: NotificationCategory): boolean =>
    preferences.data?.find((preference) => preference.category === category)
      ?.enabled ?? true;

  const togglePreference = (category: NotificationCategory, enabled: boolean) => {
    updatePreference.mutate({ category, enabled });
  };

  const profileSchema = useMemo(() => buildProfileSchema(t), [t]);

  const {
    register,
    reset,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    defaultValues: { pseudonym: "", bio: "", country: "FR" },
  });

  // Initialisation unique par joueur : on ne réinitialise pas le formulaire à chaque
  // mise à jour optimiste du profil (sinon la saisie en cours serait écrasée).
  const initializedFor = useRef<string | null>(null);
  useEffect(() => {
    if (me && initializedFor.current !== me.userId) {
      initializedFor.current = me.userId;
      reset({
        pseudonym: me.pseudonym ?? "",
        bio: me.bio ?? "",
        country: me.country ?? "FR",
      });
    }
  }, [me, reset]);

  const update = useUpdateProfile();

  /** Enregistrement par champ : confirmation par toast (id stable ⇒ pas d'empilement). */
  const savePatch = (patch: UpdateProfilePatch) =>
    update
      .mutateAsync(patch)
      .then(() => {
        toast.success(t("shell.settings.saveSuccess"), { id: "settings-save" });
      })
      .catch(() => {
        toast.error(t("shell.settings.saveError"), { id: "settings-save" });
      });

  /** Pseudonyme : validé puis enregistré au blur, uniquement s'il a changé. */
  async function savePseudonym() {
    if (!(await trigger("pseudonym"))) return;
    const value = getValues("pseudonym");
    if (value === (me?.pseudonym ?? "")) return;
    await savePatch({ pseudonym: value });
  }

  /** Bio : validée puis enregistrée au blur (vide ⇒ null), uniquement si changée. */
  async function saveBio() {
    if (!(await trigger("bio"))) return;
    const value = getValues("bio");
    if (value === (me?.bio ?? "")) return;
    await savePatch({ bio: value || null });
  }

  /** Pays : enregistrement immédiat (select), uniquement s'il a changé. */
  function saveCountry(value: string) {
    if (value === (me?.country ?? "FR")) return;
    void savePatch({ country: value || null });
  }

  const level = me?.progression.level ?? 1;
  const country =
    me?.country && COUNTRY_CODES.some((code) => code === me.country)
      ? me.country
      : "FR";
  const pseudonymField = register("pseudonym");
  const bioField = register("bio");

  return (
    <PageContainer className="max-w-[880px]">
      <SettingsSection title={t("shell.settings.sections.profile")}>
        <SettingsRow
          label={t("shell.settings.avatar.label")}
          description={t("shell.settings.avatar.description", {
            title: me?.progression.title ?? "",
            level,
          })}
          controlClassName="flex tablet-up:justify-end"
        >
          <button
            type="button"
            onClick={() => navigate("/settings/avatar")}
            aria-label={t("shell.settings.avatar.changeAria")}
            className="group relative shrink-0 rounded-full"
          >
            <UserAvatar
              name={me?.pseudonym ?? t("shell.settings.fallbackPlayer")}
              userId={userId ?? undefined}
              avatarOptions={me?.avatarOptions ?? undefined}
              size={56}
            />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-2xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              {t("shell.settings.avatar.edit")}
            </span>
          </button>
        </SettingsRow>

        <SettingsRow
          stacked
          label={t("shell.settings.banner.label")}
          description={t("shell.settings.banner.description")}
        >
          <MediaUpload
            value={me?.bannerUrl ?? null}
            onChange={(url) => void savePatch({ bannerUrl: url })}
            aspectClassName="aspect-video"
            disabled={update.isPending}
            allowUrlInput={false}
          />
        </SettingsRow>

        <SettingsRow
          label={t("shell.settings.pseudonym.label")}
          description={t("shell.settings.pseudonym.description")}
          htmlFor="s-pseudonym"
        >
          <Input
            id="s-pseudonym"
            maxLength={40}
            {...pseudonymField}
            onBlur={(event) => {
              pseudonymField.onBlur(event);
              void savePseudonym();
            }}
          />
          {errors.pseudonym && (
            <p className="mt-1.5 text-xs text-destructive">
              {errors.pseudonym.message}
            </p>
          )}
        </SettingsRow>

        <SettingsRow
          stacked
          label={t("shell.settings.bio.label")}
          description={t("shell.settings.bio.description")}
          htmlFor="s-bio"
        >
          <Textarea
            id="s-bio"
            rows={3}
            maxLength={160}
            {...bioField}
            onBlur={(event) => {
              bioField.onBlur(event);
              void saveBio();
            }}
          />
          {errors.bio && (
            <p className="mt-1.5 text-xs text-destructive">{errors.bio.message}</p>
          )}
        </SettingsRow>

        <SettingsRow
          label={t("shell.settings.country.label")}
          description={t("shell.settings.country.description")}
        >
          <Select
            items={countries}
            value={country}
            onValueChange={(value) => {
              const next = value ?? "";
              reset((prev) => ({ ...prev, country: next }));
              saveCountry(next);
            }}
          >
            <SelectTrigger className="w-full" aria-label={t("shell.settings.country.aria")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {countries.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t("shell.settings.sections.account")}>
        <SettingsRow
          label={t("shell.settings.email.label")}
          description={t("shell.settings.email.description")}
          htmlFor="s-email"
        >
          <Input id="s-email" value={me?.email ?? ""} disabled />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title={t("shell.settings.sections.notifications")}
        sub={t("shell.settings.notificationPreferences.sub")}
      >
        <SettingsRow
          label={t("shell.settings.notificationPreferences.follows.label")}
          description={t(
            "shell.settings.notificationPreferences.follows.description",
          )}
          controlClassName="flex tablet-up:justify-end"
        >
          <AnimatedSwitch
            label={t("shell.settings.notificationPreferences.follows.label")}
            checked={preferenceEnabled("FOLLOW")}
            disabled={updatePreference.isPending}
            onCheckedChange={(checked) => togglePreference("FOLLOW", checked)}
          />
        </SettingsRow>

        <SettingsRow
          label={t("shell.settings.notificationPreferences.challenges.label")}
          description={t(
            "shell.settings.notificationPreferences.challenges.description",
          )}
          controlClassName="flex tablet-up:justify-end"
        >
          <AnimatedSwitch
            label={t("shell.settings.notificationPreferences.challenges.label")}
            checked={preferenceEnabled("ROOM")}
            disabled={updatePreference.isPending}
            onCheckedChange={(checked) => togglePreference("ROOM", checked)}
          />
        </SettingsRow>

        <PushNotificationSetting />
      </SettingsSection>

      <InstallAppSection />

      <SettingsSection title={t("shell.settings.sections.appearance")}>
        <SettingsRow
          label={t("shell.settings.theme.label")}
          description={t("shell.settings.theme.description")}
        >
          <Select items={themes} value={theme} onValueChange={(v) => setTheme(v as Theme)}>
            <SelectTrigger className="w-full" aria-label={t("shell.settings.theme.aria")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {themes.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>

        {isTouch && (
          <SettingsRow
            label={t("shell.settings.bottomNav.label")}
            description={t("shell.settings.bottomNav.description")}
          >
            <Select
              items={bottomNavVariants}
              value={bottomNavVariant}
              onValueChange={(v) => setBottomNavVariant(v as BottomNavVariant)}
            >
              <SelectTrigger
                className="w-full"
                aria-label={t("shell.settings.bottomNav.aria")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bottomNavVariants.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
        )}

        <SettingsRow
          label={t("shell.settings.language.label")}
          description={t("shell.settings.language.description")}
        >
          <Select
            items={LANGS}
            value={me?.language ?? "fr"}
            onValueChange={(v) => void savePatch({ language: v as Language })}
          >
            <SelectTrigger className="w-full" aria-label={t("shell.settings.language.aria")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t("shell.settings.sections.session")}>
        <SettingsRow
          label={t("shell.settings.session.label")}
          description={t("shell.settings.session.description")}
          controlClassName="flex tablet-up:justify-end"
        >
          <Button variant="outline" onClick={logout}>
            <LogOut /> {t("shell.settings.session.logout")}
          </Button>
        </SettingsRow>
      </SettingsSection>

      <p className="pt-1 text-center text-xs text-muted-foreground">
        <Link to="/profile" className="underline underline-offset-2">
          {t("shell.settings.backToProfile")}
        </Link>
      </p>

      <p className="pt-4 text-center text-2xs text-muted-foreground/70">
        QuizUp Web · v{__APP_VERSION__}
      </p>
    </PageContainer>
  );
}
