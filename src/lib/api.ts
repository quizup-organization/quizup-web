import { createApiClient } from "./api-client";
import { config } from "./config";
import { getAccessToken } from "./auth";
import { apiErrorBus } from "./error-bus";

export const api = createApiClient({
  baseUrl: config.apiUrl,
  getAuthToken: () => getAccessToken(),
  onError: (error) => {
    // 404 : souvent transitoire (projections en lecture différée). 401 : géré (reconnexion) par l'UI.
    const status = error.statusCode ?? 0;
    if (import.meta.env.DEV) {
      if (status === 404) {
        console.debug(`[API] 404 (ignoré): ${error.message}`);
      } else {
        console.error(`[API] ${error.statusCode ?? "?"}: ${error.message}`);
      }
    }
    if (status !== 404) {
      apiErrorBus.publish({
        statusCode: error.statusCode,
        message: error.message || "Une erreur est survenue",
        detail: error.detail,
      });
    }
  },
});

