import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  beginIntent,
  endIntent,
  isCurrentIntent,
} from "@/shared/utils/latest-intent";
import { reconcileUntil } from "@/shared/utils/optimistic-reconcile";
import type { RoomView } from "../domain/room";
import { roomsService } from "./rooms";

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
 * Réconcilie la liste des salons **jusqu'à convergence** : la projection peut encore exposer la
 * salle annulée ~2 s, mais on n'invalide qu'une fois qu'elle a réellement disparu — une relecture
 * périmée ferait réapparaître la carte (l'annulation semblerait nécessiter deux clics). Aucune
 * valeur périmée n'est écrite dans le cache ; en secours au timeout, invalidation simple.
 * Une nouvelle action sur la **même salle** remplace la boucle en cours (clics multiples).
 */
export async function reconcileRooms(
  queryClient: QueryClient,
  roomId: string,
): Promise<void> {
  const intentKey = `room:${roomId}`;
  const generation = beginIntent(intentKey);
  await reconcileUntil<RoomView[]>({
    read: () => roomsService.mine(),
    matches: (rooms) => !rooms.some((room) => room.roomId === roomId),
    isCurrent: () => isCurrentIntent(intentKey, generation),
    onConverged: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.mine() });
    },
    onTimeout: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.mine() });
    },
  });
  endIntent(intentKey, generation);
}
