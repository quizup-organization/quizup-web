import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { NotificationPreferenceView } from "@/shared/types/notifications";
import {
  removeNotificationFromCaches,
  scheduleNotificationsReconcile,
} from "../lib/notification-cache";
import { notificationsService } from "../lib/notifications";
import { useNotificationStore } from "../stores/useNotificationStore";

export interface NotificationListParams {
  unreadOnly: boolean;
  page: number;
  size: number;
}

/** Page d'inbox (paramétrable : la cloche = 20 dernières, la page = filtre + pagination). */
export function useNotifications(params?: Partial<NotificationListParams>) {
  const resolved: NotificationListParams = {
    unreadOnly: params?.unreadOnly ?? false,
    page: params?.page ?? 0,
    size: params?.size ?? 20,
  };
  return useQuery({
    queryKey: queryKeys.notifications.list(resolved),
    queryFn: () => notificationsService.list(resolved),
    refetchInterval: 15_000,
  });
}

/** Compteur de notifications non lues (badge de la cloche). */
export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsService.unreadCount(),
    refetchInterval: 15_000,
  });
}

/** Marque une notification comme lue. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.markRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/**
 * Supprime une notification (swipe-to-delete) avec retrait optimiste immédiat de **toutes** les
 * vues inbox (page, cloche, compteur non lus) et du store d'invitations live. En cas d'échec,
 * les caches sont restaurés ; la réconciliation avec la projection Axon est différée (2 s).
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const removeInvitation = useNotificationStore((s) => s.removeInvitation);
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.remove(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueriesData({
        queryKey: queryKeys.notifications.all,
      });
      removeNotificationFromCaches(queryClient, notificationId);
      removeInvitation(notificationId);
      return { previous };
    },
    onError: (_error, _notificationId, context) => {
      context?.previous.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
    },
    onSettled: () => scheduleNotificationsReconcile(queryClient),
  });
}

/** Marque toute l'inbox comme lue. */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/** Préférences persistées (défaut : tout activé). */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.notifications.preferences(),
    queryFn: () => notificationsService.preferences(),
  });
}

/** Active/désactive une catégorie de notification (optimiste : le switch bascule aussitôt). */
export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      category,
      enabled,
    }: {
      category: Parameters<typeof notificationsService.updatePreference>[0];
      enabled: boolean;
    }) => notificationsService.updatePreference(category, enabled),
    onMutate: async ({ category, enabled }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.preferences(),
      });
      const previous = queryClient.getQueryData<NotificationPreferenceView[]>(
        queryKeys.notifications.preferences(),
      );
      queryClient.setQueryData<NotificationPreferenceView[]>(
        queryKeys.notifications.preferences(),
        (current) => {
          if (!current) return current;
          const exists = current.some(
            (preference) => preference.category === category,
          );
          return exists
            ? current.map((preference) =>
                preference.category === category
                  ? { ...preference, enabled }
                  : preference,
              )
            : [...current, { category, enabled }];
        },
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(
          queryKeys.notifications.preferences(),
          context.previous,
        );
      }
    },
    onSettled: () => {
      // Projection Axon différée : réconciliation après un délai.
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.preferences(),
        });
      }, 2_000);
    },
  });
}
