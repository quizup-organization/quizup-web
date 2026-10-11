import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { RoomView } from "../domain/room";

/** La projection Axon peut encore exposer la salle ~2 s après l'annulation. */
const RECONCILE_DELAY_MS = 2_000;

/** Retrait optimiste de la salle des listes observables (« Tes salons en attente »). */
export function removeRoomFromCaches(
  queryClient: QueryClient,
  roomId: string,
): void {
  queryClient.setQueryData<RoomView[]>(
    queryKeys.rooms.mine(),
    (current) => current?.filter((room) => room.roomId !== roomId),
  );
}

/**
 * Réconciliation différée avec la projection Axon (2 s). Sans ce délai, une invalidation
 * immédiate refetch la salle encore ouverte côté lecture et la carte réapparaît : l'annulation
 * semble alors nécessiter deux clics.
 */
export function scheduleRoomsReconcile(queryClient: QueryClient): void {
  setTimeout(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.mine() });
  }, RECONCILE_DELAY_MS);
}
