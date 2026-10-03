import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
  type NotificationCategory,
} from "@/features/notifications";
import { UserAvatar } from "@/shared/components/user-avatar";
import {
  FormRow as SettingsRow,
  FormSection as SettingsSection,
} from "@/shared/components/form-section";
import { PageContainer } from "@/features/shell";
import { useMe } from "@/features/shell";
import { useLogout } from "@/features/auth";
import { useTheme } from "../providers/theme-context";
import type { Theme } from "../stores/useThemeStore";
import {
  useUpdateProfile,
  type UpdateProfilePatch,
} from "../hooks/useUpdateProfile";
import type { Language } from "@/features/player/domain/profile";

const COUNTRIES = [
  { value: "FR", label: "🇫🇷 France" },
  { value: "BE", label: "🇧🇪 Belgique" },
  { value: "CH", label: "🇨🇭 Suisse" },
  { value: "CA", label: "🇨🇦 Canada" },
  { value: "SN", label: "🇸🇳 Sénégal" },
  { value: "JP", label: "🇯🇵 Japon" },
];

const LANGS = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
  { value: "system", label: "Système" },
];

const profileSchema = z.object({
  pseudonym: z.string().min(1, "Pseudonyme requis").max(40, "40 caractères max"),
  bio: z.string().max(160, "160 caractères max"),
  country: z.string(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function SettingsPage() {
  const { userId, data: me } = useMe();
  const navigate = useNavigate();
  const logout = useLogout();
  const { theme, setTheme } = useTheme();
  const preferences = useNotificationPreferences();
  const updatePreference = useUpdateNotificationPreference();

  const preferenceEnabled = (category: NotificationCategory): boolean =>
    preferences.data?.find((preference) => preference.category === category)
      ?.enabled ?? true;

  const togglePreference = (category: NotificationCategory, enabled: boolean) => {
    updatePreference.mutate({ category, enabled });
  };

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
        toast.success("Modifications enregistrées", { id: "settings-save" });
      })
      .catch(() => undefined);

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
    me?.country && COUNTRIES.some((c) => c.value === me.country)
      ? me.country
      : "FR";
  const pseudonymField = register("pseudonym");
  const bioField = register("bio");

  return (
    <PageContainer className="max-w-[880px]">
      <SettingsSection title="Profil">
        <SettingsRow
          label="Photo de profil"
          description={`${me?.progression.title ?? ""} · Niveau ${level} — modifiable à tout moment.`}
          controlClassName="flex sm:justify-end"
        >
          <button
            type="button"
            onClick={() => navigate("/settings/avatar")}
            aria-label="Changer l'avatar"
            className="group relative shrink-0 rounded-full"
          >
            <UserAvatar
              name={me?.pseudonym ?? "Joueur"}
              userId={userId ?? undefined}
              avatarOptions={me?.avatarOptions ?? undefined}
              size={56}
            />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              Modifier
            </span>
          </button>
        </SettingsRow>

        <SettingsRow
          label="Pseudonyme"
          description="Le nom affiché dans les duels et les classements."
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
          label="Bio"
          description="Présente-toi en quelques mots (160 caractères max). Visible sur ton profil public."
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
          label="Pays"
          description="Utilisé pour les classements par pays."
        >
          <Select
            items={COUNTRIES}
            value={country}
            onValueChange={(value) => {
              const next = value ?? "";
              reset((prev) => ({ ...prev, country: next }));
              saveCountry(next);
            }}
          >
            <SelectTrigger className="w-full" aria-label="Pays">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Compte">
        <SettingsRow
          label="Adresse e-mail"
          description="Ton identifiant de connexion — non modifiable."
          htmlFor="s-email"
        >
          <Input id="s-email" value={me?.email ?? ""} disabled />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title="Notifications"
        sub="Choisis ce que tu veux recevoir (préférences enregistrées)."
      >
        <SettingsRow
          label="Nouveaux abonnés"
          description="Quand un joueur s'abonne à toi."
          controlClassName="flex sm:justify-end"
        >
          <Switch
            aria-label="Nouveaux abonnés"
            checked={preferenceEnabled("FOLLOW")}
            disabled={updatePreference.isPending}
            onCheckedChange={(checked) => togglePreference("FOLLOW", checked)}
          />
        </SettingsRow>

        <SettingsRow
          label="Défis reçus"
          description="Invitations et issues de tes défis."
          controlClassName="flex sm:justify-end"
        >
          <Switch
            aria-label="Défis reçus"
            checked={preferenceEnabled("LOBBY")}
            disabled={updatePreference.isPending}
            onCheckedChange={(checked) => togglePreference("LOBBY", checked)}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Apparence & langue">
        <SettingsRow label="Thème" description="Apparence de l'interface.">
          <Select items={THEMES} value={theme} onValueChange={(v) => setTheme(v as Theme)}>
            <SelectTrigger className="w-full" aria-label="Thème">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow
          label="Langue"
          description="Langue des questions et de l'interface."
        >
          <Select
            items={LANGS}
            value={me?.language ?? "fr"}
            onValueChange={(v) => void savePatch({ language: v as Language })}
          >
            <SelectTrigger className="w-full" aria-label="Langue">
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

      <SettingsSection title="Session">
        <SettingsRow
          label="Déconnexion"
          description="Tu peux te déconnecter à tout moment."
          controlClassName="flex sm:justify-end"
        >
          <Button variant="outline" onClick={logout}>
            <LogOut /> Se déconnecter
          </Button>
        </SettingsRow>
      </SettingsSection>

      <p className="pt-1 text-center text-xs text-muted-foreground">
        <Link to="/profile" className="underline underline-offset-2">
          Retour au profil
        </Link>
      </p>
    </PageContainer>
  );
}
