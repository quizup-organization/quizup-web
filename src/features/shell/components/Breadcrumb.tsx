import { Breadcrumbs } from "@heroui/react";
import { cn } from "cn";

export interface Crumb {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: Crumb[];
  isMobile?: boolean;
}

/**
 * Fil d'Ariane de la topbar — Breadcrumbs HeroUI. Chaque cran intermédiaire est cliquable,
 * le dernier est la page courante. Sur mobile, seul le cran courant est affiché.
 */
export function Breadcrumb({ items, isMobile }: BreadcrumbProps) {
  const shown = isMobile ? items.slice(-1) : items;
  return (
    <Breadcrumbs className="flex-nowrap">
      {shown.map((crumb, index) => {
        const last = index === shown.length - 1;
        return (
          <Breadcrumbs.Item
            key={`${crumb.label}-${index}`}
            className="min-w-0"
          >
            {last || !crumb.onClick ? (
              <span
                className={cn(
                  "truncate font-heading",
                  last ? "text-base font-bold" : "text-sm font-semibold",
                )}
              >
                {crumb.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={crumb.onClick}
                className="truncate font-heading text-sm font-semibold hover:underline"
              >
                {crumb.label}
              </button>
            )}
          </Breadcrumbs.Item>
        );
      })}
    </Breadcrumbs>
  );
}
