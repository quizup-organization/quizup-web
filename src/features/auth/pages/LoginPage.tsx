import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "../components/AuthShell";
import { AuthField, AuthSeparator, GoogleIcon } from "../components/AuthField";
import { requestCodeSchema, type RequestCodeValues } from "../schemas";
import { useRequestCode } from "../hooks/useAuth";
import { loginRedirect } from "../lib/oidc";
import { config } from "@/lib/config";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const socialError = searchParams.has("error");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestCodeValues>({
    resolver: zodResolver(requestCodeSchema),
    defaultValues: { email: "" },
  });
  const requestCode = useRequestCode();

  // Retour du login social (Google) : la session est établie, on enchaîne le PKCE.
  useEffect(() => {
    if (searchParams.get("social") === "success") {
      void loginRedirect("/");
    }
  }, [searchParams]);

  const onSubmit = async (values: RequestCodeValues) => {
    await requestCode.mutateAsync(values);
    navigate("/login/code", { state: { email: values.email } });
  };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em]">
            Connexion à ton compte
          </h1>
          <p className="text-[13px] leading-normal text-muted-foreground">
            Entre ton e-mail : on t'envoie un code de connexion.
          </p>
        </div>

        <AuthField label="E-mail" htmlFor="email">
          <Input
            id="email"
            type="email"
            placeholder="toi@exemple.fr"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </AuthField>

        {(requestCode.isError || socialError) && (
          <p className="text-center text-xs text-destructive">
            Impossible d'envoyer le code. Réessaie.
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || requestCode.isPending}>
          {requestCode.isPending ? "Envoi…" : "Recevoir un code"}
        </Button>

        <AuthSeparator>Ou continuer avec</AuthSeparator>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = `${config.oidcAuthority}/oauth2/authorization/google`;
          }}
        >
          <GoogleIcon /> Continuer avec Google
        </Button>
      </form>
    </AuthShell>
  );
}
