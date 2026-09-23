import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { TopicFollower } from "@/features/topics/domain/topic";
import type { IdResponse, PageResponse, SearchRequest } from "@/shared/types/search";

export const topicFollowsService = {
  search: (body: SearchRequest): Promise<PageResponse<TopicFollower>> =>
    api.post<PageResponse<TopicFollower>>(ENDPOINTS.topicFollows.search, body),

  getById: (followId: string): Promise<TopicFollower> =>
    api.get<TopicFollower>(ENDPOINTS.topicFollows.detail(followId)),

  follow: (topicId: string): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.topicFollows.create, { topicId }),

  unfollow: (followId: string): Promise<void> =>
    api.delete<void>(ENDPOINTS.topicFollows.delete(followId)),
};
