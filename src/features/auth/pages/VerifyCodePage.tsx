import { useCallback, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthOTPVerify from "@/components/ui/auth-otp-verify";
import { AuthShell } from "../components/AuthShell";
import { useRequestCode, useVerifyCode } from "../hooks/useAuth";

/**
 * Vérification du code de connexion (OTP email). Le composant `AuthOTPVerify`
 * (registre shadcn `@hextaui`) gère la saisie, le renvoi et le cooldown ; la page
 * câble les mutations (vérification puis pipeline OIDC, renvoi du code).
 */
export function VerifyCodePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  const verifyCode = useVerifyCode();
  const requestCode = useRequestCode();

  useEffect(() => {
    if (!email) {
      navigate("/login", { replace: true });
    }
  }, [email, navigate]);

  const handleSubmit = useCallback(
    (code: string) => {
      if (!email) return;
      verifyCode.mutate({ email, code });
    },
    [email, verifyCode],
  );

  const handleResend = useCallback(() => {
    if (!email) return;
    requestCode.mutate({ email });
  }, [email, requestCode]);

  return (
    <AuthShell>
      <AuthOTPVerify
        deliveryAddress={email}
        availableMethods={["email"]}
        autoSubmit={false}
        isLoading={verifyCode.isPending || requestCode.isPending}
        onSubmit={handleSubmit}
        onResend={handleResend}
        errors={{
          general: verifyCode.isError
            ? "Code invalide ou expiré. Réessaie."
            : requestCode.isError
              ? "Impossible de renvoyer le code. Réessaie."
              : undefined,
        }}
        className="border-0 bg-transparent shadow-none ring-0"
      />

      <p className="mt-4 text-center text-[12.5px] text-muted-foreground">
        <Link to="/login" className="underline underline-offset-2">
          Changer d'e-mail
        </Link>
      </p>
    </AuthShell>
  );
}
