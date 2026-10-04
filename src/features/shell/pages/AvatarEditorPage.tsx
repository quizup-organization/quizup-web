import { useState } from "react";
import { Dices, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarEditor } from "@/shared/components/avatar-editor";
import { UserAvatar } from "@/shared/components/user-avatar";
import { parseAvatarOptions, randomAvatarOptions, seedAvatarOptions } from "@/shared/avatar/avatar";
import {
  AVATAR_EDITOR_GROUPS,
  DEFAULT_AVATAR_OPTIONS,
  type AvatarOptions,
} from "@/shared/avatar/micah-options";
import { useGoBack } from "@/shared/hooks/useGoBack";
import { PageContainer } from "../components/PageContainer";
import type { Me } from "../domain/me";
import { useMe } from "../hooks/useMe";
import { useUpdateProfile } from "../hooks/useUpdateProfile";

/**
 * Édition de l'avatar en **page dédiée** (`/settings/avatar`) : aperçu live dans un
 * bandeau collant, onglets par groupe, sections en cards et enregistrement explicite
 * (Valider/Annuler) — la confirmation passe par un toast.
 */
export function AvatarEditorPage() {
  const meQuery = useMe();

  if (meQuery.isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Chargement du profil…</p>
      </PageContainer>
    );
  }

  if (!meQuery.data) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">
          Impossible de charger ton profil.
        </p>
      </PageContainer>
    );
  }

  return (
    <AvatarEditorContent
      key={meQuery.data.userId}
      me={meQuery.data}
      userId={meQuery.userId}
    />
  );
}

function AvatarEditorContent({ me, userId }: { me: Me; userId: string | null }) {
  const update = useUpdateProfile();
  const goBack = useGoBack("/settings");
  const name = me.pseudonym ?? "Joueur";
  // Démarre de l'avatar **courant** : options persistées, sinon l'avatar dérivé du seed
  // (celui affiché par `UserAvatar`) — « Réinitialiser » remet le preset par défaut.
  const [draft, setDraft] = useState<AvatarOptions>(
    () => parseAvatarOptions(me.avatarOptions) ?? seedAvatarOptions(userId ?? name),
  );
  const [baseline] = useState(draft);
  const [groupId, setGroupId] = useState(AVATAR_EDITOR_GROUPS[0].id);

  const isDirty = !sameOptions(draft, baseline);

  function handleRandom() {
    setDraft(randomAvatarOptions());
  }

  function handleReset() {
    setDraft({ ...DEFAULT_AVATAR_OPTIONS });
  }

  function handleSave() {
    if (!isDirty || update.isPending) return;
    void update
      .mutateAsync({ avatarOptions: JSON.stringify(draft) })
      .then(() => {
        toast.success("Avatar enregistré");
        goBack();
      })
      .catch(() => undefined);
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-[var(--qu-topbar-offset,0rem)] z-20 flex flex-col">
        <div
          data-slot="avatar-preview-banner"
          className="border-b bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60"
        >
          <div className="mx-auto flex w-full max-w-screen-xl items-center justify-center gap-4 px-4 py-4 sm:px-6">
            <UserAvatar
              name={name}
              userId={userId ?? undefined}
              avatarOptions={JSON.stringify(draft)}
              size={112}
            />
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={update.isPending}
                onClick={handleRandom}
              >
                <Dices /> Aléatoire
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={update.isPending}
                onClick={handleReset}
              >
                <RotateCcw /> Réinitialiser
              </Button>
            </div>
          </div>
        </div>

        <div className="border-b bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto w-full max-w-screen-xl overflow-x-auto px-4 py-3 sm:px-6">
            <Tabs value={groupId} onValueChange={setGroupId}>
              <TabsList>
                {AVATAR_EDITOR_GROUPS.map((group) => (
                  <TabsTrigger key={group.id} value={group.id}>
                    <group.icon />
                    {group.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <PageContainer className="flex-1 pb-8">
        <AvatarEditor draft={draft} groupId={groupId} onDraftChange={setDraft} />
      </PageContainer>

      <div className="sticky bottom-0 z-20 border-t bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-screen-xl items-center justify-end gap-2 px-4 py-3 sm:px-6">
          <Button variant="ghost" disabled={update.isPending} onClick={goBack}>
            Annuler
          </Button>
          <Button disabled={!isDirty || update.isPending} onClick={handleSave}>
            {update.isPending ? "Enregistrement…" : "Valider"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function sameOptions(a: AvatarOptions, b: AvatarOptions): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) {
      return false;
    }
  }
  return true;
}
