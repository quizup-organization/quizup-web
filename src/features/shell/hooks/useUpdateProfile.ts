import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profilesService } from "@/features/player";
import type { Language, PlayerProfile } from "@/features/player/domain/profile";
import { queryKeys } from "@/lib/query-keys";
import type { Me } from "../domain/me";
import { useMe } from "./useMe";

/** Patch partiel du profil : seuls les champs fournis sont envoyés (une commande par champ). */
export interface UpdateProfilePatch {
  pseudonym?: string;
  bio?: string | null;
  country?: string | null;
  avatarOptions?: string | null;
  language?: Language;
}

/** Délai avant réconciliation : les projections Axon sont en lecture différée. */
const RECONCILE_DELAY_MS = 2000;

interface UpdateProfileContext {
  previousMe?: Me;
  previousProfile?: PlayerProfile;
}

/**
 * Mutation de profil par champ : dispatch les services uniquement pour les champs fournis,
 * patche optimistement `me` + la fiche joueur, puis réconcilie après le délai de projection.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { userId } = useMe();

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
        patch.language !== undefined
          ? profilesService.updateLanguage(userId, patch.language)
          : Promise.resolve(),
      ]);
    },
    onMutate: async (patch) => {
      if (!userId) return {};
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
      if (patch.language !== undefined) changes.language = patch.language;

      queryClient.setQueryData<Me>(queryKeys.me(), (old) =>
        old ? { ...old, ...changes } : old,
      );
      queryClient.setQueryData<PlayerProfile>(
        queryKeys.profiles.detail(userId),
        (old) => (old ? { ...old, ...changes } : old),
      );
      return { previousMe, previousProfile };
    },
    onError: (_error, _patch, context) => {
      if (!userId || !context) return;
      queryClient.setQueryData(queryKeys.me(), context.previousMe);
      queryClient.setQueryData(
        queryKeys.profiles.detail(userId),
        context.previousProfile,
      );
    },
    onSettled: () => {
      window.setTimeout(() => {
        if (!userId) return;
        queryClient.invalidateQueries({ queryKey: queryKeys.me() });
        queryClient.invalidateQueries({
          queryKey: queryKeys.profiles.detail(userId),
        });
      }, RECONCILE_DELAY_MS);
    },
  });
}
