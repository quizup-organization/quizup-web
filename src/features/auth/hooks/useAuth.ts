import { useMutation } from "@tanstack/react-query";
import { authService } from "@/lib/services/auth";
import { loginRedirect } from "@/lib/auth";
import type { LoginValues, RegisterValues } from "../schemas";

/**
 * Connexion : POST JSON (session temporaire) puis Authorization Code + PKCE.
 * Le retour se fait sur `/callback`.
 */
export function useLogin() {
  return useMutation({
    mutationFn: async (values: LoginValues) => {
      await authService.login(values.email, values.password);
      await loginRedirect("/");
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (values: RegisterValues) => {
      await authService.register(values.email, values.password);
      await loginRedirect("/");
    },
  });
}
