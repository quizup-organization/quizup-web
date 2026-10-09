import type { ReactNode } from "react";
import { cn } from "cn";

interface PageHeaderBarProps {
  children: ReactNode;
  /** Répartit le contenu (gauche) et les actions (droite) sur la même ligne. */
  justify?: boolean;
  className?: string;
}

/**
 * Bandeau de tête de page pleine largeur (onglets, actions) : même largeur max et même
 * gouttière (`--page-gutter-x`) que `PageContainer`, pour des marges alignées sur tous les
 * écrans. À utiliser pour tout nouvel en-tête de page.
 */
export function PageHeaderBar({ children, justify = false, className }: PageHeaderBarProps) {
  return (
    <div className={cn("border-b bg-background", className)}>
      <div
        className={cn(
          "mx-auto flex w-full max-w-screen-xl flex-wrap items-center gap-3 px-(--page-gutter-x) py-3",
          justify && "justify-between",
        )}
      >
        {children}
      </div>
    </div>
  );
}
