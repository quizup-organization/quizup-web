import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, Save } from "lucide-react";
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
import { ToBuildTag } from "../components/to-build-tag";
import { UserAvatar } from "@/shared/components/user-avatar";
import { AvatarEditorDialog } from "@/shared/components/avatar-editor-dialog";
import { PageContainer } from "../components/PageContainer";
import { useCurrentPlayer } from "../hooks/useCurrentPlayer";
import { useLogout } from "@/features/auth";
import { useTheme } from "../providers/theme-context";
import type { Theme } from "../stores/useThemeStore";
import { profilesService } from "@/features/player";
import { queryKeys } from "@/lib/query-keys";
import type { Profile } from "@/features/player/domain/profile";
import { titleForLevel } from "@/shared/utils/level";

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
  displayName: z.string().min(1, "Nom requis").max(40, "40 caractères max"),
  bio: z.string().max(160, "160 caractères max"),
  country: z.string(),
});

type ProfileValues = z.infer<typeof profileSchema>;

interface UpdateProfileInput {
  displayName: string;
  bio?: string;
  country?: string;
  avatarOptions?: string | null;
}

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
  const { userId, profile, progression } = useCurrentPlayer();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const [notifFollower, setNotifFollower] = useState(true);
  const [notifChallenge, setNotifChallenge] = useState(true);
  const [lang, setLang] = useState("fr");
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: "", bio: "", country: "FR" },
  });

  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName ?? "",
        bio: profile.bio ?? "",
        country: profile.country ?? "FR",
      });
    }
  }, [profile, reset]);

  const update = useMutation({
    mutationFn: (values: UpdateProfileInput) =>
      profilesService.update(userId as string, {
        displayName: values.displayName,
        bio: values.bio || undefined,
        country: values.country || undefined,
        avatarOptions: values.avatarOptions ?? null,
      }),
    onMutate: async (values: UpdateProfileInput) => {
      if (!userId) return { previous: undefined };
      await queryClient.cancelQueries({
        queryKey: queryKeys.profiles.detail(userId),
      });
      const previous = queryClient.getQueryData<Profile>(
        queryKeys.profiles.detail(userId),
      );
      queryClient.setQueryData<Profile>(
        queryKeys.profiles.detail(userId),
        (old) =>
          old
            ? {
                ...old,
                displayName: values.displayName,
                bio: values.bio || undefined,
                country: values.country || undefined,
                avatarOptions: values.avatarOptions ?? undefined,
              }
            : old,
      );
      return { previous };
    },
    onError: (_error, _values, context) => {
      if (userId && context) {
        queryClient.setQueryData(
          queryKeys.profiles.detail(userId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profiles.detail(userId) });
      }
    },
  });

  const level = progression?.level ?? 1;
  const country = profile?.country && COUNTRIES.some((c) => c.value === profile.country)
    ? profile.country
    : "FR";

  return (
    <PageContainer className="max-w-[880px]">
      <Section
        title="Profil"
        sub="Ton nom affiché, ta bio et ton pays."
        right={
          update.isSuccess ? (
            <span className="text-xs font-semibold text-[color:var(--duel-correct-accent)]">
              Enregistré ✓
            </span>
          ) : undefined
        }
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setAvatarEditorOpen(true)}
            aria-label="Changer l'avatar"
            className="group relative shrink-0 rounded-full"
          >
            <UserAvatar
              name={profile?.displayName ?? "Joueur"}
              userId={userId ?? undefined}
              avatarOptions={profile?.avatarOptions}
              size={64}
            />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              Modifier
            </span>
          </button>
          <div>
            <Button variant="secondary" size="sm" onClick={() => setAvatarEditorOpen(true)}>
              Changer l'avatar
            </Button>
            <div className="mt-1.5 text-xs text-muted-foreground">
              {titleForLevel(level)} · Niveau {level}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit((values) =>
            update.mutateAsync({
              ...values,
              avatarOptions: profile?.avatarOptions ?? null,
            }),
          )}
          className="flex flex-col gap-3.5"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-name">Nom affiché</Label>
            <Input id="s-name" maxLength={40} {...register("displayName")} />
            {errors.displayName && (
              <p className="text-xs text-destructive">{errors.displayName.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-bio">Bio</Label>
            <Textarea id="s-bio" rows={2} maxLength={160} {...register("bio")} />
            {errors.bio && (
              <p className="text-xs text-destructive">{errors.bio.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Pays</Label>
            <Select
              value={country}
              onValueChange={(value) => reset((prev) => ({ ...prev, country: String(value) }))}
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
          <div>
            <Button type="submit" disabled={update.isPending}>
              <Save /> Enregistrer
            </Button>
          </div>
        </form>
      </Section>

      <Section title="Compte" sub="Adresse e-mail et connexion (quizup-identity).">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="s-email">Adresse e-mail</Label>
          <Input id="s-email" value={profile?.email ?? ""} readOnly />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" size="sm" disabled>
            Changer le mot de passe
          </Button>
          <Button variant="outline" size="sm" disabled>
            Fournisseurs sociaux
          </Button>
          <ToBuildTag />
        </div>
      </Section>

      <Section
        title="Notifications"
        sub="Choisis ce que tu veux recevoir."
        right={<ToBuildTag />}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="s-notif-follower" className="font-normal">
              Nouveaux abonnés
            </Label>
            <Switch
              id="s-notif-follower"
              checked={notifFollower}
              onCheckedChange={setNotifFollower}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="s-notif-challenge" className="font-normal">
              Défis reçus
            </Label>
            <Switch
              id="s-notif-challenge"
              checked={notifChallenge}
              onCheckedChange={setNotifChallenge}
            />
          </div>
        </div>
      </Section>

      <Section title="Apparence & langue" right={<ToBuildTag />}>
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
            <Select value={lang} onValueChange={(v) => setLang(String(v))}>
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

      {avatarEditorOpen && (
        <AvatarEditorDialog
          open
          onClose={() => setAvatarEditorOpen(false)}
          value={profile?.avatarOptions}
          onSave={(options) =>
            update.mutateAsync({
              displayName:
                getValues("displayName") || profile?.displayName || profile?.email || "Joueur",
              bio: getValues("bio") || profile?.bio || undefined,
              country: getValues("country") || profile?.country || undefined,
              avatarOptions: JSON.stringify(options),
            })
          }
        />
      )}
    </PageContainer>
  );
}
