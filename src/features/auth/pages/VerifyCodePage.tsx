import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "../components/AuthShell";
import { AuthField } from "../components/AuthField";
import { verifyCodeSchema, type VerifyCodeValues } from "../schemas";
import { useRequestCode, useVerifyCode } from "../hooks/useAuth";

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyCodePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;
  const [cooldown, setCooldown] = useState(0);

  const verifyCode = useVerifyCode();
  const requestCode = useRequestCode();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyCodeValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { email: email ?? "", code: "" },
  });

  useEffect(() => {
    if (!email) {
      navigate("/login", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = async (values: VerifyCodeValues) => {
    await verifyCode.mutateAsync(values);
  };

  const onResend = async () => {
    if (!email || requestCode.isPending) return;
    await requestCode.mutateAsync({ email });
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em]">
            Vérifie ta boîte mail
          </h1>
          <p className="text-[13px] leading-normal text-muted-foreground">
            Saisis le code à 6 chiffres envoyé à {email ?? "ton adresse"}.
          </p>
        </div>

        <input type="hidden" {...register("email")} />

        <AuthField label="Code de connexion" htmlFor="code">
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            className="text-center text-lg tracking-[0.4em]"
            {...register("code")}
          />
          {errors.code && (
            <p className="text-xs text-destructive">{errors.code.message}</p>
          )}
        </AuthField>

        {verifyCode.isError && (
          <p className="text-center text-xs text-destructive">
            Code invalide ou expiré. Réessaie.
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={verifyCode.isPending}>
          {verifyCode.isPending ? "Vérification…" : "Se connecter"}
        </Button>

        <div className="flex items-center justify-center gap-2 text-[12.5px] text-muted-foreground">
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0 || requestCode.isPending}
            className="underline underline-offset-2 disabled:no-underline disabled:opacity-60"
          >
            {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : "Renvoyer le code"}
          </button>
          <span aria-hidden>·</span>
          <Link to="/login" className="underline underline-offset-2">
            Changer d'e-mail
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
