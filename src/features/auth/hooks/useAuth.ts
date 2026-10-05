import { useMutation } from "@tanstack/react-query";
import { authService } from "../lib/auth";
import { loginRedirect } from "../lib/oidc";
import { readReturnTo } from "../lib/return-to";
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
 * Le retour se fait sur `/callback`, qui restaure la cible mémorisée avant login (lien de salon).
 */
export function useVerifyCode() {
  return useMutation({
    mutationFn: async (values: VerifyCodeValues) => {
      await authService.verifyCode(values.email, values.code);
      await loginRedirect(readReturnTo() ?? "/");
    },
  });
}
