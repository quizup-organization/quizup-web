import { useState } from "react";
import { Dices, Shapes, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { AvatarEditor } from "@/shared/components/avatar-editor";
import { UserAvatar } from "@/shared/components/user-avatar";
import { parseAvatarOptions, randomAvatarOptions, seedAvatarOptions } from "@/shared/avatar/avatar";
import {
  STYLE_GROUP_ID,
  defaultOptionsFor,
  getAvatarStyle,
  resolveAvatarStyleId,
  type AvatarOptions,
  type AvatarStyleId,
} from "@/shared/avatar/styles";
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
  const seed = userId ?? name;
  // Démarre de l'avatar **courant** : options persistées, sinon l'avatar dérivé du seed
  // (celui affiché par `UserAvatar`) — « Réinitialiser » remet le preset par défaut du style.
  const [draft, setDraft] = useState<AvatarOptions>(
    () => parseAvatarOptions(me.avatarOptions) ?? seedAvatarOptions(seed),
  );
  const [baseline] = useState(draft);
  const style = getAvatarStyle(resolveAvatarStyleId(draft.style));
  const [groupId, setGroupId] = useState(
    () => getAvatarStyle(resolveAvatarStyleId(draft.style)).groups[0]?.id ?? STYLE_GROUP_ID,
  );

  const isDirty = !sameOptions(draft, baseline);

  function handleStyleChange(styleId: AvatarStyleId) {
    if (styleId === style.id) return;
    setDraft(seedAvatarOptions(seed, styleId));
    setGroupId(getAvatarStyle(styleId).groups[0]?.id ?? STYLE_GROUP_ID);
  }

  function handleRandom() {
    setDraft(randomAvatarOptions(style.id));
  }

  function handleReset() {
    setDraft(defaultOptionsFor(style.id));
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

  const tabs = [
    { id: STYLE_GROUP_ID, label: "Style", icon: Shapes },
    ...style.groups.map((group) => ({ id: group.id, label: group.label, icon: group.icon })),
  ];

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
          <div className="mx-auto w-full max-w-screen-xl px-4 py-3 sm:px-6">
            <Tabs value={groupId} onValueChange={setGroupId}>
              <TabsList>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    <tab.icon />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <PageContainer className="flex-1 pb-8">
        <AvatarEditor
          draft={draft}
          groupId={groupId}
          groups={style.groups}
          seed={seed}
          onDraftChange={setDraft}
          onStyleChange={handleStyleChange}
        />
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
