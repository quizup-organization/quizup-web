import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Conteneur centré des pages (hors duel) : max-width 1280px, padding horizontal responsive.
 * Équivalent Tailwind du PageContainer de la maquette.
 */
interface PageContainerProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function PageContainer({ children, className, style }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-screen-xl px-3.5 py-6 pb-8 sm:px-5 lg:px-6",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
