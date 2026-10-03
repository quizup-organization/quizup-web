import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { notificationsService } from "../lib/notifications";

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

/** Active/désactive une catégorie de notification. */
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.preferences(),
      });
    },
  });
}
