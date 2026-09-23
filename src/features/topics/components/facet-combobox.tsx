import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "cn";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface FacetOption {
  value: string;
  label: string;
  count?: number;
  color?: string;
}

interface FacetComboboxProps {
  /** Libellé du filtre (ex. « Catégorie »). */
  label: string;
  options: FacetOption[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

/**
 * Filtre à facettes en combobox : pilule `Label · <sélection>` + popover avec item
 * « Toutes » et liste à coche multiple. Client-side (petite liste locale).
 */
export function FacetCombobox({
  label,
  options,
  value,
  onChange,
  className,
}: FacetComboboxProps) {
  const [open, setOpen] = useState(false);

  const summary =
    value.length === 0
      ? "Toutes"
      : value.length === 1
        ? (options.find((option) => option.value === value[0])?.label ?? "1")
        : `${value.length} sélectionnées`;

  function toggle(code: string) {
    onChange(
      value.includes(code)
        ? value.filter((item) => item !== code)
        : [...value, code],
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Filtrer par ${label.toLowerCase()}`}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-3xl border border-border bg-background px-3 text-sm font-medium whitespace-nowrap outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 aria-expanded:bg-muted",
          className,
        )}
      >
        <span className="text-muted-foreground">{label}</span>
        <span className="text-border">|</span>
        <span className="max-w-[140px] truncate">{summary}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[300px] overflow-hidden p-0">
        <div className="max-h-[320px] overflow-y-auto p-1.5">
          <button
            type="button"
            onClick={() => onChange([])}
            className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent"
          >
            <span className="flex-1">Toutes</span>
            {value.length === 0 && <Check className="size-4" />}
          </button>

          {options.map((option) => {
            const selected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.count != null && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {option.count}
                  </span>
                )}
                {selected && <Check className="size-4 shrink-0" />}
              </button>
            );
          })}

          {options.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Aucun résultat.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
