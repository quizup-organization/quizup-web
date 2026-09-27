import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { Me } from "../domain/me";

/** Joueur courant (`GET /api/me`) : profil, progression, compteurs. */
export const meService = {
  get: (): Promise<Me> => api.get<Me>(ENDPOINTS.me),
};
