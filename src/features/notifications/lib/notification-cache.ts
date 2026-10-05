import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { Page } from "@/shared/types/api";
import type { NotificationView } from "@/shared/types/notifications";

interface UnreadCountView {
  count: number;
}

function isNotificationPage(value: unknown): value is Page<NotificationView> {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as Page<NotificationView>).content)
  );
}

/** Projection Axon différée : on réconcilie les vues après un délai, jamais immédiatement. */
const RECONCILE_DELAY_MS = 2_000;

/**
 * Retire une notification de toutes les vues inbox en cache (page `/notifications` + panneau de
 * la cloche) et décrémente le compteur non lus si elle était non lue. Utilisé par la mutation de
 * suppression (optimiste) et par le push WS `NOTIFICATION_DELETED` (autres onglets).
 */
export function removeNotificationFromCaches(
  queryClient: QueryClient,
  notificationId: string,
): void {
  const entries = queryClient.getQueriesData({
    queryKey: queryKeys.notifications.all,
  });
  let wasUnread = false;

  for (const [key, data] of entries) {
    if (!isNotificationPage(data)) continue;
    const item = data.content.find((n) => n.notificationId === notificationId);
    if (!item) continue;
    if (!item.readAt) wasUnread = true;
    const totalElements = Math.max(0, data.totalElements - 1);
    const totalPages = data.size > 0 ? Math.ceil(totalElements / data.size) : 0;
    queryClient.setQueryData<Page<NotificationView>>(key, {
      ...data,
      content: data.content.filter((n) => n.notificationId !== notificationId),
      totalElements,
      totalPages,
      first: data.page === 0,
      last: data.page >= totalPages - 1,
    });
  }

  if (wasUnread) {
    queryClient.setQueryData<UnreadCountView>(
      queryKeys.notifications.unreadCount(),
      (current) => (current ? { count: Math.max(0, current.count - 1) } : current),
    );
  }
}

/**
 * Vide toutes les vues inbox en cache (pages `/notifications` + panneau de la cloche) et remet
 * le compteur non lus à zéro. Utilisé par la suppression totale (optimiste).
 */
export function clearNotificationsFromCaches(queryClient: QueryClient): void {
  const entries = queryClient.getQueriesData({
    queryKey: queryKeys.notifications.all,
  });

  for (const [key, data] of entries) {
    if (!isNotificationPage(data)) continue;
    queryClient.setQueryData<Page<NotificationView>>(key, {
      ...data,
      content: [],
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });
  }

  queryClient.setQueryData<UnreadCountView>(
    queryKeys.notifications.unreadCount(),
    { count: 0 },
  );
}

/** Recharge l'inbox après le délai de projection Axon (2 s). */
export function scheduleNotificationsReconcile(queryClient: QueryClient): void {
  setTimeout(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  }, RECONCILE_DELAY_MS);
}
