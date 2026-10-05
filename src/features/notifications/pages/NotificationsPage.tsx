import { useState } from "react";
import { BellOff, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { AppDialog } from "@/shared/components/app-dialog";
import { PageContainer } from "@/features/shell";
import { NotificationRow } from "../components/NotificationRow";
import {
  useDeleteAllNotifications,
  useMarkAllNotificationsRead,
  useNotifications,
  useUnreadNotificationsCount,
} from "../hooks/useNotifications";

const PAGE_SIZE = 20;

/**
 * Page inbox : toutes les notifications personnelles (invitations, issues de défi, follows,
 * appariement prêt), avec filtre non-lues et pagination. Les agrégats éphémères
 * (salons, tickets) ne sont pas consultables : leur trace durable est ici.
 */
export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const { data, isLoading, isError } = useNotifications({
    unreadOnly,
    page,
    size: PAGE_SIZE,
  });
  const unread = useUnreadNotificationsCount();
  const markAll = useMarkAllNotificationsRead();
  const deleteAll = useDeleteAllNotifications();

  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const unreadCount = unread.data?.count ?? 0;
  const hasNotifications = items.length > 0 || unreadCount > 0;

  function changeFilter(next: string) {
    setUnreadOnly(next === "unread");
    setPage(0);
  }

  return (
    <div className="flex flex-col">
      <div className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Tabs value={unreadOnly ? "unread" : "all"} onValueChange={changeFilter}>
            <TabsList>
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="unread">
                Non lues{unreadCount > 0 ? ` (${unreadCount})` : ""}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={unreadCount === 0 || markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              <CheckCheck /> Tout marquer lu
            </Button>
            <Button
              variant="outline"
              disabled={!hasNotifications || deleteAll.isPending}
              onClick={() => setConfirmDeleteAll(true)}
            >
              <Trash2 /> Tout supprimer
            </Button>
          </div>
        </div>
      </div>

      <PageContainer style={{ paddingTop: 16 }}>
        {isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chargement…
          </p>
        )}

        {isError && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Impossible de charger les notifications.
          </p>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <Card className="items-center gap-3 py-12 text-center">
            <BellOff className="size-6 text-muted-foreground" />
            <div className="text-base font-semibold">
              {unreadOnly ? "Aucune notification non lue" : "Aucune notification"}
            </div>
            <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
              Défie un joueur depuis sa fiche ou un sujet : son acceptation et les issues
              arriveront ici.
            </p>
          </Card>
        )}

        {items.length > 0 && (
          <Card className="gap-0 overflow-hidden py-0">
            {items.map((notification) => (
              <NotificationRow
                key={notification.notificationId}
                notification={notification}
              />
            ))}
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={data?.first ?? true}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              Précédent
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data?.last ?? true}
              onClick={() => setPage((current) => current + 1)}
            >
              Suivant
            </Button>
          </div>
        )}
      </PageContainer>

      <AppDialog
        open={confirmDeleteAll}
        onClose={() => setConfirmDeleteAll(false)}
        title="Tout supprimer ?"
        className="sm:max-w-md"
        footer={
          <>
            <div className="flex-1" />
            <Button variant="ghost" onClick={() => setConfirmDeleteAll(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={deleteAll.isPending}
              onClick={() =>
                deleteAll.mutate(undefined, {
                  onSuccess: () => {
                    setConfirmDeleteAll(false);
                    setPage(0);
                  },
                })
              }
            >
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Toutes les notifications de ta boîte seront définitivement supprimées. Cette
          action est irréversible.
        </p>
      </AppDialog>
    </div>
  );
}
