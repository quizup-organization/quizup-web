import type { ApiError } from "@/shared/types/search";

interface ApiClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  onError?: (error: ApiError, options: RequestOptions) => void;
  getAuthToken?: () => string | null;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  absolute?: boolean;
  skipErrorBus?: boolean;
}

/**
 * Client fetch typé : base URL, sérialisation JSON, gestion d'erreur centralisée
 * et injection optionnelle du Bearer token. Cf. best-practices/.frontend/api-integration.md.
 */
export function createApiClient(clientConfig: ApiClientConfig) {
  const { baseUrl, defaultHeaders = {}, onError, getAuthToken } = clientConfig;

  async function request<T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { params, body, headers: reqHeaders, absolute, skipErrorBus, ...fetchOptions } =
      options;

    const url = absolute ? new URL(path) : new URL(path, baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...defaultHeaders,
      ...(reqHeaders as Record<string, string> | undefined),
    };
    const token = getAuthToken?.();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...fetchOptions,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: response.statusText,
        statusCode: response.status,
      }));
      error.statusCode = error.statusCode ?? response.status;
      if (!skipErrorBus) onError?.(error, options);
      throw error;
    }

    if (response.status === 204 || response.status === 205) return undefined as T;

    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  return {
    get<T>(path: string, opts?: RequestOptions) {
      return request<T>("GET", path, opts);
    },
    post<T>(path: string, body?: unknown, opts?: RequestOptions) {
      return request<T>("POST", path, { ...opts, body });
    },
    put<T>(path: string, body?: unknown, opts?: RequestOptions) {
      return request<T>("PUT", path, { ...opts, body });
    },
    patch<T>(path: string, body?: unknown, opts?: RequestOptions) {
      return request<T>("PATCH", path, { ...opts, body });
    },
    delete<T>(path: string, opts?: RequestOptions) {
      return request<T>("DELETE", path, opts);
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
