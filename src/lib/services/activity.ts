import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { ActivityResponse } from "@/shared/types/api";
import type { Activity } from "@/shared/types/domain";

/** Activité journalière (streak + graphe de contribution). */
export const activityService = {
  get: (userId: string): Promise<Activity> =>
    api.get<ActivityResponse>(ENDPOINTS.profiles.activity(userId)),
};
