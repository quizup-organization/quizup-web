import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "../components/AuthShell";
import { AuthField, AuthSeparator, GoogleIcon } from "../components/AuthField";
import { loginSchema, type LoginValues } from "../schemas";
import { useLogin } from "../hooks/useAuth";
import { loginRedirect } from "@/lib/auth";
import { config } from "@/lib/config";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const socialError = searchParams.has("error");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const login = useLogin();

  // Retour du login social (Google) : la session est établie, on enchaîne le PKCE.
  useEffect(() => {
    if (searchParams.get("social") === "success") {
      void loginRedirect("/");
    }
  }, [searchParams]);

  const onSubmit = async (values: LoginValues) => {
    await login.mutateAsync(values);
  };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em]">
            Connexion à ton compte
          </h1>
          <p className="text-[13px] leading-normal text-muted-foreground">
            Entre ton e-mail pour retrouver tes duels.
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

        <AuthField
          label="Mot de passe"
          htmlFor="password"
          aside={
            <Link to="/login" className="text-xs text-muted-foreground underline underline-offset-2">
              Mot de passe oublié ?
            </Link>
          }
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </AuthField>

        {(login.isError || socialError) && (
          <p className="text-center text-xs text-destructive">
            Identifiants invalides. Réessaie.
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || login.isPending}>
          {login.isPending ? "Connexion…" : "Se connecter"}
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

        <p className="text-center text-[12.5px] text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link to="/register" className="underline underline-offset-2">
            Créer un compte
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
