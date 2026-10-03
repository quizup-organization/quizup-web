import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationRow } from "./NotificationRow";
import {
  useMarkAllNotificationsRead,
  useNotifications,
  useUnreadNotificationsCount,
} from "../hooks/useNotifications";

/** Cloche de la topbar : compteur non lus + panneau d'inbox + lien vers la page complète. */
export function NotificationBell() {
  const navigate = useNavigate();
  const { data: unread } = useUnreadNotificationsCount();
  const { data: page } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const count = unread?.count ?? 0;

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Notifications"
        className="relative flex size-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-heading text-[10px] font-bold text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] gap-0 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-heading text-sm font-bold">Notifications</span>
          <Button
            variant="ghost"
            size="sm"
            disabled={count === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck className="size-4" /> Tout lire
          </Button>
        </div>
        <div className="flex max-h-[420px] flex-col overflow-y-auto">
          {(page?.content.length ?? 0) === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune notification pour l&apos;instant.
            </p>
          )}
          {(page?.content ?? []).map((notification) => (
            <NotificationRow key={notification.notificationId} notification={notification} />
          ))}
        </div>
        <div className="border-t px-4 py-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/notifications")}
          >
            Voir toutes les notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
