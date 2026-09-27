import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { topicsService } from "../lib/topics";
import type {
  TopicFacetsParams,
  TopicListParams,
} from "../domain/topic";

const LIST_STALE_MS = 5 * 60 * 1000;
const CATEGORIES_STALE_MS = 60 * 60 * 1000;

/** Catalogue paginé : recherche, facettes catégorie, tri et filtre « suivis » côté BFF. */
export function useTopicsList(params: TopicListParams) {
  return useQuery({
    queryKey: queryKeys.topics.list(params),
    queryFn: () => topicsService.list(params),
    staleTime: LIST_STALE_MS,
    placeholderData: (previous) => previous,
  });
}

/** Facettes du catalogue (total + compteurs par catégorie) pour les filtres courants. */
export function useTopicFacets(params: TopicFacetsParams) {
  return useQuery({
    queryKey: queryKeys.topics.facets(params),
    queryFn: () => topicsService.facets(params),
    staleTime: LIST_STALE_MS,
    placeholderData: (previous) => previous,
  });
}

/** Catégories exposées par le BFF (nom + libellé FR). */
export function useTopicCategories() {
  return useQuery({
    queryKey: queryKeys.topics.categories(),
    queryFn: () => topicsService.categories(),
    staleTime: CATEGORIES_STALE_MS,
  });
}
