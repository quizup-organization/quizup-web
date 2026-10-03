import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function Section({
  title,
  sub,
  right,
  children,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-5">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-base font-bold">{title}</h2>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          {right}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

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
      <Section
        title="Profil"
        sub="Ton nom affiché, ta bio et ton pays."
      >
        <div className="flex items-center gap-4">
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
              size={64}
            />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              Modifier
            </span>
          </button>
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/settings/avatar")}
            >
              Changer l'avatar
            </Button>
            <div className="mt-1.5 text-xs text-muted-foreground">
              {me?.progression.title ?? ""} · Niveau {level}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-pseudonym">Pseudonyme</Label>
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
              <p className="text-xs text-destructive">{errors.pseudonym.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-bio">Bio</Label>
            <Textarea
              id="s-bio"
              rows={2}
              maxLength={160}
              {...bioField}
              onBlur={(event) => {
                bioField.onBlur(event);
                void saveBio();
              }}
            />
            {errors.bio && (
              <p className="text-xs text-destructive">{errors.bio.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Pays</Label>
            <Select
              value={country}
              onValueChange={(value) => {
                const next = String(value);
                reset((prev) => ({ ...prev, country: next }));
                saveCountry(next);
              }}
            >
              <SelectTrigger className="w-[220px] max-w-full" aria-label="Pays">
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
          </div>
        </div>
      </Section>

      <Section title="Compte" sub="Adresse e-mail et connexion (quizup-identity).">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="s-email">Adresse e-mail</Label>
          <Input id="s-email" value={me?.email ?? ""} disabled />
        </div>
      </Section>

      <Section
        title="Notifications"
        sub="Choisis ce que tu veux recevoir (préférences enregistrées)."
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="s-notif-follower" className="font-normal">
              Nouveaux abonnés
            </Label>
            <Switch
              id="s-notif-follower"
              checked={preferenceEnabled("FOLLOW")}
              disabled={updatePreference.isPending}
              onCheckedChange={(checked) => togglePreference("FOLLOW", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="s-notif-challenge" className="font-normal">
              Défis reçus
            </Label>
            <Switch
              id="s-notif-challenge"
              checked={preferenceEnabled("LOBBY")}
              disabled={updatePreference.isPending}
              onCheckedChange={(checked) => togglePreference("LOBBY", checked)}
            />
          </div>
        </div>
      </Section>

      <Section title="Apparence & langue">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Thème</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
              <SelectTrigger className="w-[160px]" aria-label="Thème">
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
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Langue</Label>
            <Select
              value={me?.language ?? "fr"}
              onValueChange={(v) => void savePatch({ language: v as Language })}
            >
              <SelectTrigger className="w-[160px]" aria-label="Langue">
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
          </div>
        </div>
      </Section>

      <Section title="Session" sub="Tu peux te déconnecter à tout moment.">
        <div>
          <Button variant="outline" onClick={logout}>
            <LogOut /> Se déconnecter
          </Button>
        </div>
      </Section>

      <p className="text-center text-xs text-muted-foreground">
        <Link to="/profile" className="underline underline-offset-2">
          Retour au profil
        </Link>
      </p>
    </PageContainer>
  );
}
