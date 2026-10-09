import { useState } from "react";
import { BellOff, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { AppDialog } from "@/shared/components/app-dialog";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeaderBar } from "@/shared/components/page-header-bar";
import { PageContainer } from "@/features/shell";
import { useUrlParam, useUrlParamNumber } from "@/shared/hooks/useUrlParam";
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
 * appariement prêt), avec filtre non-lues et pagination. Le filtre (`?filter=`) et la page
 * (`?page=`) sont persistés dans l'URL.
 */
export function NotificationsPage() {
  const [filter, setFilter] = useUrlParam<string>("filter", "all");
  const [page, setPage] = useUrlParamNumber("page", 0);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const unreadOnly = filter === "unread";
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
    setFilter(next === "unread" ? "unread" : "all");
    setPage(0);
  }

  return (
    <div className="flex flex-col">
      <PageHeaderBar justify>
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
      </PageHeaderBar>

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
          <EmptyState
            icon={<BellOff className="size-6 text-muted-foreground" />}
            title={unreadOnly ? "Aucune notification non lue" : "Aucune notification"}
            description="Défie un joueur depuis sa fiche ou un sujet : son acceptation et les issues arriveront ici."
          />
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
              onClick={() => setPage(Math.max(0, page - 1))}
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
              onClick={() => setPage(page + 1)}
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
        className="tablet-up:max-w-md"
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
