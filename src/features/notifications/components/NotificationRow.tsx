import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  Mail,
  MailOpen,
  Swords,
  Trash2,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import {
  SwipeActionsRow,
  type SwipeAction,
} from "@/components/arc/swipe-actions/swipe-actions";
import { UserAvatar } from "@/shared/components/user-avatar";
import { usePlayerProfile } from "@/features/player";
import type {
  NotificationType,
  NotificationView,
} from "@/shared/types/notifications";
import {
  isExpired,
  isChallengeInvitation,
  isUnread,
  notificationTargetPath,
  relativeTime,
} from "../domain/notification";
import {
  useDeleteNotification,
  useMarkNotificationRead,
  useMarkNotificationUnread,
} from "../hooks/useNotifications";
import { useNotificationStore } from "../stores/useNotificationStore";

/** Pictogramme et teinte par type de notification (badge sur l'avatar de l'auteur). */
const GLYPHS: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  FOLLOW: { icon: UserPlus, className: "text-primary" },
  CHALLENGE_RECEIVED: { icon: Swords, className: "text-primary" },
  CHALLENGE_DECLINED: { icon: X, className: "text-destructive" },
  ROOM_ACCEPTED: { icon: Check, className: "text-[var(--duel-correct)]" },
};

/**
 * Ligne d'inbox **informative** (cloche + page Notifications) : le texte vaut lecture et navigue
 * vers la cible de la notification (profil, duel/salon, accueil pour une invitation) ; l'avatar
 * ouvre le profil ; le swipe propose « Marquer comme lue/non lue » (vers la gauche) et
 * « Supprimer » (vers la droite), reflétés dans le menu « … » desktop. Les actions d'une
 * invitation (Accepter/Refuser) vivent sur les cartes de l'accueil et dans la modale live.
 */
export function NotificationRow({
  notification,
  onNavigate,
}: {
  notification: NotificationView;
  /** Appelé avant toute navigation (fermeture de la popup de la cloche). */
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const player = usePlayerProfile(notification.actorId ?? "");
  const markRead = useMarkNotificationRead();
  const markUnread = useMarkNotificationUnread();
  const removeNotification = useDeleteNotification();
  const selectInvitation = useNotificationStore((s) => s.selectInvitation);
  const name = player.data?.pseudonym ?? "Un joueur";
  const unread = isUnread(notification);
  const target = notificationTargetPath(notification);
  // Fallback défensif : une ancienne notification (type retiré) ne doit pas casser la ligne.
  const glyph = GLYPHS[notification.type] ?? {
    icon: Bell,
    className: "text-muted-foreground",
  };
  const Glyph = glyph.icon;
  const text = label(notification, name);

  // Le libellé décrit le résultat ; `keepRow` fait revenir la ligne (lecture, pas triage).
  const readToggle: SwipeAction = unread
    ? {
        label: "Marquer comme lue",
        icon: <MailOpen />,
        keepRow: true,
        onSelect: () => markRead.mutate(notification.notificationId),
      }
    : {
        label: "Marquer comme non lue",
        icon: <Mail />,
        keepRow: true,
        onSelect: () => markUnread.mutate(notification.notificationId),
      };

  /**
   * Le texte vaut lecture : il ré-affiche la modale Accepter/Refuser pour une invitation encore
   * actionnable, sinon il navigue quand la notification a une destination.
   */
  function open() {
    if (unread) markRead.mutate(notification.notificationId);
    if (isChallengeInvitation(notification) && !isExpired(notification)) {
      onNavigate?.();
      selectInvitation(notification);
      return;
    }
    if (!target) return;
    onNavigate?.();
    navigate(target);
  }

  return (
    <SwipeActionsRow
      label={text}
      leading={[readToggle]}
      trailing={[
        {
          label: "Supprimer",
          icon: <Trash2 />,
          tone: "danger",
          onSelect: () => removeNotification.mutate(notification.notificationId),
        },
      ]}
      // Fond « non lu » sur **toute la surface** qui coulisse (et qui suit le swipe), au lieu
      // d'un rectangle imbriqué dans la ligne.
      contentStyle={
        unread
          ? {
              background:
                "color-mix(in srgb, var(--primary) 6%, var(--surface))",
            }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          {notification.actorId ? (
            <Link
              to={`/players/${notification.actorId}`}
              aria-label={`Voir le profil de ${name}`}
              className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <UserAvatar
                name={name}
                userId={notification.actorId}
                avatarOptions={player.data?.avatarOptions ?? undefined}
                size={40}
              />
            </Link>
          ) : (
            <span className="grid size-10 place-items-center rounded-full bg-muted">
              <Glyph className="size-4 text-muted-foreground" />
            </span>
          )}
          {notification.actorId && (
            <span
              className={cn(
                "absolute -right-0.5 -bottom-0.5 grid size-[18px] place-items-center rounded-full border-2 border-card bg-card",
                glyph.className,
              )}
            >
              <Glyph className="size-[10px]" />
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={open}
          className={cn(
            "min-w-0 flex-1 text-left",
            target && "cursor-pointer",
          )}
        >
          <span
            className={cn(
              "block text-sm leading-snug",
              unread ? "font-medium" : "text-muted-foreground",
            )}
          >
            {text}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground/80">
            {relativeTime(notification.createdAt)}
          </span>
        </button>

        {unread && (
          <span
            className="mt-2 size-2 shrink-0 rounded-full bg-primary"
            aria-label="Non lue"
          />
        )}
      </div>
    </SwipeActionsRow>
  );
}

function label(notification: NotificationView, name: string): string {
  switch (notification.type) {
    case "FOLLOW":
      return `${name} s'est abonné à toi.`;
    case "CHALLENGE_RECEIVED":
      return `${name} te défie !`;
    case "CHALLENGE_DECLINED":
      return `${name} a refusé ton défi.`;
    case "ROOM_ACCEPTED":
      return `${name} a accepté ton défi.`;
    default:
      return "Notification";
  }
}
