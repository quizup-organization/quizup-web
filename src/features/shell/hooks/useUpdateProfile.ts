import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { profilesService } from "@/features/player";
import type { Language, PlayerProfile } from "@/features/player/domain/profile";
import { queryKeys } from "@/lib/query-keys";
import {
  beginIntent,
  endIntent,
  isCurrentIntent,
} from "@/shared/utils/latest-intent";
import { reconcileUntil } from "@/shared/utils/optimistic-reconcile";
import type { Me } from "../domain/me";
import { meService } from "../lib/me";
import { useMe } from "./useMe";

/** Patch partiel du profil : seuls les champs fournis sont envoyés (une commande par champ). */
export interface UpdateProfilePatch {
  pseudonym?: string;
  bio?: string | null;
  country?: string | null;
  avatarOptions?: string | null;
  bannerUrl?: string | null;
  language?: Language;
}

/**
 * La langue pilote **toute** l'interface : une lecture encore en retard (projection profile,
 * cache BFF) ferait rebasculer l'UI en arrière. On converge sans écrire de valeur périmée dans
 * le cache — on relit jusqu'à retrouver la langue choisie, sinon la vérité serveur gagne.
 * `isCurrent` coupe la boucle dès qu'une édition plus récente l'a remplacée.
 */
async function reconcileLanguage(
  queryClient: QueryClient,
  userId: string,
  expected: Language,
  isCurrent: () => boolean,
): Promise<void> {
  await reconcileUntil<Me>({
    read: () => meService.get(),
    matches: (me) => me.language === expected,
    isCurrent,
    onConverged: (me) => {
      queryClient.setQueryData(queryKeys.me(), me);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.profiles.detail(userId),
      });
    },
    onTimeout: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.profiles.detail(userId),
      });
    },
  });
}

/** Vrai quand la fiche relue reflète tous les champs du patch. */
function matchesPatch(view: PlayerProfile, patch: UpdateProfilePatch): boolean {
  return (
    (patch.pseudonym === undefined || view.pseudonym === patch.pseudonym) &&
    (patch.bio === undefined || view.bio === patch.bio) &&
    (patch.country === undefined || view.country === patch.country) &&
    (patch.avatarOptions === undefined ||
      view.avatarOptions === patch.avatarOptions) &&
    (patch.bannerUrl === undefined || view.bannerUrl === patch.bannerUrl)
  );
}

interface UpdateProfileContext {
  generation: number;
  previousMe?: Me;
  previousProfile?: PlayerProfile;
}

/**
 * Mutation de profil par champ : dispatch les services uniquement pour les champs fournis,
 * patche optimistement `me` + la fiche joueur, puis réconcilie après le délai de projection.
 * Chaque mutation démarre une intention (`latest-intent`, clé par utilisateur) : une
 * réconciliation périmée ne réécrit ni ne restaure un état plus ancien.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { userId } = useMe();
  const intentKey = `profile:${userId ?? "anonymous"}`;

  return useMutation<void, Error, UpdateProfilePatch, UpdateProfileContext>({
    mutationFn: async (patch) => {
      if (!userId) return;
      await Promise.all([
        patch.pseudonym !== undefined
          ? profilesService.updatePseudonym(userId, patch.pseudonym)
          : Promise.resolve(),
        patch.bio !== undefined
          ? profilesService.updateBio(userId, patch.bio)
          : Promise.resolve(),
        patch.country !== undefined
          ? profilesService.updateCountry(userId, patch.country)
          : Promise.resolve(),
        patch.avatarOptions !== undefined
          ? profilesService.updateAvatarOptions(userId, patch.avatarOptions)
          : Promise.resolve(),
        patch.bannerUrl !== undefined
          ? profilesService.updateBanner(userId, patch.bannerUrl)
          : Promise.resolve(),
        patch.language !== undefined
          ? profilesService.updateLanguage(userId, patch.language)
          : Promise.resolve(),
      ]);
    },
    onMutate: async (patch) => {
      const generation = beginIntent(intentKey);
      if (!userId) return { generation };
      await queryClient.cancelQueries({ queryKey: queryKeys.me() });
      await queryClient.cancelQueries({
        queryKey: queryKeys.profiles.detail(userId),
      });
      const previousMe = queryClient.getQueryData<Me>(queryKeys.me());
      const previousProfile = queryClient.getQueryData<PlayerProfile>(
        queryKeys.profiles.detail(userId),
      );

      const changes: UpdateProfilePatch = {};
      if (patch.pseudonym !== undefined) changes.pseudonym = patch.pseudonym;
      if (patch.bio !== undefined) changes.bio = patch.bio;
      if (patch.country !== undefined) changes.country = patch.country;
      if (patch.avatarOptions !== undefined)
        changes.avatarOptions = patch.avatarOptions;
      if (patch.bannerUrl !== undefined) changes.bannerUrl = patch.bannerUrl;
      if (patch.language !== undefined) changes.language = patch.language;

      queryClient.setQueryData<Me>(queryKeys.me(), (old) =>
        old ? { ...old, ...changes } : old,
      );
      queryClient.setQueryData<PlayerProfile>(
        queryKeys.profiles.detail(userId),
        (old) => (old ? { ...old, ...changes } : old),
      );
      return { generation, previousMe, previousProfile };
    },
    onError: (_error, _patch, context) => {
      // Une intention plus récente a déjà patché les vues : ne jamais restaurer un snapshot périmé.
      if (
        !userId ||
        !context ||
        !isCurrentIntent(intentKey, context.generation)
      ) {
        return;
      }
      queryClient.setQueryData(queryKeys.me(), context.previousMe);
      queryClient.setQueryData(
        queryKeys.profiles.detail(userId),
        context.previousProfile,
      );
    },
    onSettled: (_data, error, patch, context) => {
      if (error || !userId || !context) return;
      const { generation } = context;
      if (patch.language !== undefined) {
        void reconcileLanguage(
          queryClient,
          userId,
          patch.language,
          () => isCurrentIntent(intentKey, generation),
        ).finally(() => endIntent(intentKey, generation));
        return;
      }
      void reconcileUntil<PlayerProfile>({
        read: () => profilesService.profile(userId),
        matches: (view) => matchesPatch(view, patch),
        isCurrent: () => isCurrentIntent(intentKey, generation),
        onConverged: (view) => {
          queryClient.setQueryData(queryKeys.profiles.detail(userId), view);
          void queryClient.invalidateQueries({ queryKey: queryKeys.me() });
        },
        onTimeout: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.me() });
          void queryClient.invalidateQueries({
            queryKey: queryKeys.profiles.detail(userId),
          });
        },
      }).finally(() => endIntent(intentKey, generation));
    },
  });
}
