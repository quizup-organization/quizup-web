import { Children, isValidElement, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "cn";
import { BouncyAccordion } from "@/components/motion/bouncy-accordion";

interface FilterSectionsProps {
  /** `value` de la seule section ouverte au montage (aucune si absent). */
  defaultOpen?: string;
  children: ReactNode;
}

/**
 * Groupe de sections de filtres : accordéon beui (`BouncyAccordion`) à **ouverture unique**.
 * Les `FilterSection` enfants servent de descripteurs : leurs props sont projetées en items
 * (le composant ne rend jamais les enfants directement).
 */
export function FilterSections({ defaultOpen, children }: FilterSectionsProps) {
  const items = Children.toArray(children).flatMap((child) => {
    if (!isValidElement<FilterSectionProps>(child)) return [];
    const {
      value,
      title,
      description,
      summary,
      children: content,
    } = child.props;
    return [
      {
        id: value,
        title: (
          <>
            <span className="font-heading text-sm font-semibold">{title}</span>
            {(summary || description) && (
              <span className="truncate text-xs font-normal text-muted-foreground">
                {summary ?? description}
              </span>
            )}
          </>
        ),
        description: <div className="flex flex-col gap-1">{content}</div>,
      },
    ];
  });

  return (
    <BouncyAccordion
      items={items}
      defaultValue={defaultOpen ?? null}
      collapsible
      classNames={{
        item: "bg-muted/40",
        title:
          "flex min-w-0 flex-col gap-0.5 overflow-visible whitespace-normal text-sm",
        description: "text-sm leading-normal",
      }}
    />
  );
}

interface FilterSectionProps {
  /** Identifiant unique de la section dans le `FilterSections` parent. */
  value: string;
  title: string;
  description?: string;
  /** Valeur courante affichée sous le titre (reste lisible section repliée). */
  summary?: string;
  children: ReactNode;
}

/** Descripteur de section : consommé par `FilterSections` (ne rend rien seul). */
export function FilterSection(_props: FilterSectionProps): null {
  return null;
}

interface FilterOptionProps {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}

/** Option unique d'un drawer de filtres (ligne pleine largeur, cible 44 px). */
export function FilterOption({
  selected,
  onSelect,
  children,
}: FilterOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex min-h-11 w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors",
        selected ? "bg-primary/10 text-primary" : "hover:bg-accent",
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
        {children}
      </span>
      {selected && <Check className="size-4 shrink-0" />}
    </button>
  );
}
