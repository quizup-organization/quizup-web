import { useMutation } from "@tanstack/react-query";
import { authService } from "@/lib/services/auth";
import { loginRedirect } from "@/lib/auth";
import type { RequestCodeValues, VerifyCodeValues } from "../schemas";

/**
 * Demande l'envoi d'un code de connexion par email.
 */
export function useRequestCode() {
  return useMutation({
    mutationFn: (values: RequestCodeValues) => authService.requestCode(values.email),
  });
}

/**
 * Vérifie le code (établit la session temporaire) puis enchaîne Authorization Code + PKCE.
 * Le retour se fait sur `/callback`.
 */
export function useVerifyCode() {
  return useMutation({
    mutationFn: async (values: VerifyCodeValues) => {
      await authService.verifyCode(values.email, values.code);
      await loginRedirect("/");
    },
  });
}
