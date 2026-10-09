import { Link, useNavigate } from "react-router-dom";
import {
  Ban,
  Bell,
  Check,
  Clock,
  Swords,
  Trash2,
  UserPlus,
  UserX,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { SwipeActionsRow } from "@/components/arc/swipe-actions/swipe-actions";
import { UserAvatar } from "@/shared/components/user-avatar";
import { usePlayerProfile } from "@/features/player";
import type {
  NotificationType,
  NotificationView,
} from "@/shared/types/notifications";
import {
  isExpired,
  isLobbyInvitation,
  isUnread,
  lobbyTargetPath,
  relativeTime,
} from "../domain/notification";
import { useLobbyInvitationActions } from "../hooks/useLobbyInvitationActions";
import {
  useDeleteNotification,
  useMarkNotificationRead,
} from "../hooks/useNotifications";

/** Pictogramme et teinte par type de notification (badge sur l'avatar de l'auteur). */
const GLYPHS: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  FOLLOW: { icon: UserPlus, className: "text-primary" },
  CHALLENGE_RECEIVED: { icon: Swords, className: "text-primary" },
  CHALLENGE_DECLINED: { icon: X, className: "text-destructive" },
  LOBBY_INVITATION: { icon: Swords, className: "text-primary" },
  LOBBY_ACCEPTED: { icon: Check, className: "text-[var(--duel-correct)]" },
  LOBBY_DECLINED: { icon: X, className: "text-destructive" },
  LOBBY_CANCELLED: { icon: Ban, className: "text-muted-foreground" },
  LOBBY_EXPIRED: { icon: Clock, className: "text-muted-foreground" },
  LOBBY_MISSED: { icon: UserX, className: "text-muted-foreground" },
};

/** Ligne d'inbox partagée par la cloche (panneau) et la page Notifications. */
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
  const removeNotification = useDeleteNotification();
  const actions = useLobbyInvitationActions();
  const name = player.data?.pseudonym ?? "Un joueur";
  const unread = isUnread(notification);
  const resumePath = lobbyTargetPath(notification);
  // Fallback défensif : une ancienne notification (type retiré) ne doit pas casser la ligne.
  const glyph = GLYPHS[notification.type] ?? {
    icon: Bell,
    className: "text-muted-foreground",
  };
  const Glyph = glyph.icon;
  const hasActions = isLobbyInvitation(notification) || resumePath !== null || unread;
  const text = label(notification, name);

  return (
    <SwipeActionsRow
      label={text}
      trailing={[
        {
          label: "Supprimer",
          icon: <Trash2 />,
          tone: "danger",
          onSelect: () => removeNotification.mutate(notification.notificationId),
        },
      ]}
    >
      <div
        className={cn(
          "flex items-start gap-3 transition-colors",
          unread ? "bg-primary/[0.04]" : "hover:bg-muted/40",
        )}
      >
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

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm leading-snug",
              unread ? "font-medium" : "text-muted-foreground",
            )}
          >
            {text}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground/80">
            {relativeTime(notification.createdAt)}
          </p>

          {hasActions && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {isLobbyInvitation(notification) && !isExpired(notification) && (
                <>
                  <Button
                    size="sm"
                    disabled={actions.pending}
                    onClick={() => {
                      onNavigate?.();
                      void actions.accept(notification);
                    }}
                  >
                    Accepter
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={actions.pending}
                    onClick={() => {
                      onNavigate?.();
                      void actions.refuse(notification);
                    }}
                  >
                    Refuser
                  </Button>
                </>
              )}
              {resumePath !== null && (
                <Button
                  size="sm"
                  onClick={() => {
                    onNavigate?.();
                    markRead.mutate(notification.notificationId);
                    navigate(resumePath);
                  }}
                >
                  {resumePath.startsWith("/duel/")
                    ? "Rejoindre la partie"
                    : "Rejoindre la salle"}
                </Button>
              )}
              {unread && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={markRead.isPending}
                  onClick={() => markRead.mutate(notification.notificationId)}
                >
                  Marquer lu
                </Button>
              )}
            </div>
          )}
        </div>

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
    case "LOBBY_INVITATION":
      return `${name} te défie !`;
    case "LOBBY_ACCEPTED":
      return `${name} a accepté ton défi.`;
    case "LOBBY_DECLINED":
      return `${name} a refusé ton défi.`;
    case "LOBBY_CANCELLED":
      return name === "Un joueur"
        ? "Le défi a été annulé."
        : `${name} a annulé le défi.`;
    case "LOBBY_EXPIRED":
      return "Le défi a expiré.";
    case "LOBBY_MISSED":
      return `${name} ne s'est pas présenté au duel.`;
    default:
      return "Notification";
  }
}
