import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "../components/AuthShell";
import { AuthField, AuthSeparator, GoogleIcon } from "../components/AuthField";
import { registerSchema, type RegisterValues } from "../schemas";
import { useRegister } from "../hooks/useAuth";
import { config } from "@/lib/config";

export function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirm: "" },
  });
  const signup = useRegister();

  const onSubmit = async (values: RegisterValues) => {
    await signup.mutateAsync(values);
  };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em]">
            Créer ton compte
          </h1>
          <p className="text-[13px] leading-normal text-muted-foreground">
            Remplis le formulaire pour rejoindre QuizUp.
          </p>
        </div>

        <AuthField
          label="E-mail"
          htmlFor="email"
          description="On s'en sert pour te contacter. Jamais partagé."
        >
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

        <AuthField label="Mot de passe" htmlFor="password" description="Au moins 8 caractères.">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </AuthField>

        <AuthField
          label="Confirmer le mot de passe"
          htmlFor="confirm"
          description="Confirme ton mot de passe."
        >
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            {...register("confirm")}
          />
          {errors.confirm && (
            <p className="text-xs text-destructive">{errors.confirm.message}</p>
          )}
        </AuthField>

        {signup.isError && (
          <p className="text-center text-xs text-destructive">
            Inscription impossible (e-mail déjà utilisé ?).
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || signup.isPending}>
          {signup.isPending ? "Création…" : "Créer le compte"}
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
          Déjà un compte ?{" "}
          <Link to="/login" className="underline underline-offset-2">
            Se connecter
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
