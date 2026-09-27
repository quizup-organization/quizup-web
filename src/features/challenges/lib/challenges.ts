import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { IdResponse, Page } from "@/shared/types/api";
import type {
  ChallengeCard,
  ChallengeDetail,
  ChallengeListParams,
  PendingCount,
} from "../domain/challenge";

const MAX_PAGE_SIZE = 100;

/** Défis 1v1 : liste enrichie, détail, compteur et transitions. */
export const challengesService = {
  list: (params: ChallengeListParams = {}): Promise<Page<ChallengeCard>> =>
    api.get<Page<ChallengeCard>>(ENDPOINTS.challenges.list, {
      params: {
        box: params.box ?? "ALL",
        status: params.status,
        page: params.page ?? 0,
        size: Math.min(params.size ?? 20, MAX_PAGE_SIZE),
      },
    }),

  pendingCount: (): Promise<PendingCount> =>
    api.get<PendingCount>(ENDPOINTS.challenges.pendingCount),

  detail: (challengeId: string): Promise<ChallengeDetail> =>
    api.get<ChallengeDetail>(ENDPOINTS.challenges.detail(challengeId)),

  create: (challengedId: string, topicId: string): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.challenges.create, { challengedId, topicId }),

  accept: (challengeId: string): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.challenges.accept(challengeId)),

  decline: (challengeId: string): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.challenges.decline(challengeId)),

  cancel: (challengeId: string): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.challenges.cancel(challengeId)),

  registerRun: (challengeId: string, gameId: string): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.challenges.runs(challengeId), { gameId }),
};
