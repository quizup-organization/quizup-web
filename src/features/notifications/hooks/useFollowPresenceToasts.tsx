import { toast } from "sonner";
import { getSessionUserId as getUserId } from "@/features/auth";
import type { FollowPresence } from "@/features/player/domain/presence";
import { UserAvatar } from "@/shared/components/user-avatar";
import { useStompSubscription } from "@/shared/hooks/useStompSubscription";

/**
 * Toasts éphémères « X est en ligne » : le BFF pousse sur `/topic/follow-presence/{userId}`
 * quand un joueur suivi passe en ligne (aucune persistance). Le clic ferme le toast ; aucun
 * toast sur les écrans immersifs (duel/salons) pour ne pas polluer la partie.
 */
export function useFollowPresenceToasts(immersive = false): void {
  const userId = getUserId();

  useStompSubscription(
    "profile",
    userId ? `/topic/follow-presence/${userId}` : null,
    (message) => {
      if (immersive) return;
      let presence: FollowPresence;
      try {
        presence = JSON.parse(message.body) as FollowPresence;
      } catch {
        return;
      }
      if (!presence.actorId) return;
      const name = presence.pseudonym ?? "Un joueur";
      toast.custom(
        (toastId) => (
          <button
            type="button"
            onClick={() => toast.dismiss(toastId)}
            className="flex w-full cursor-pointer items-center gap-2.5 text-left"
          >
            <UserAvatar
              name={name}
              userId={presence.actorId}
              avatarOptions={presence.avatarOptions ?? undefined}
              size={28}
            />
            <span className="text-sm leading-5 font-medium">
              {name} est en ligne
            </span>
          </button>
        ),
        { id: `follow-online-${presence.actorId}`, duration: 5_000 },
      );
    },
  );
}
