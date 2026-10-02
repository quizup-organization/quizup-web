import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button, Label, ListBox, Popover } from "@heroui/react";

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
  /** Catégorie sélectionnée (`null` = toutes). */
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

const ALL = "__all__";

/**
 * Filtre à facettes en combobox HeroUI : bouton secondaire `Label · <sélection>`
 * + popover avec `ListBox` (item « Toutes » et coche unique). Client-side (petite liste locale).
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
    value === null
      ? "Toutes"
      : (options.find((option) => option.value === value)?.label ?? "1");

  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Button variant="secondary" className={className}>
        <span className="text-muted">{label}</span>
        <span className="mx-0.5 h-4 w-px bg-separator" aria-hidden />
        <span className="max-w-[140px] truncate">{summary}</span>
        <ChevronDown className="size-4 text-muted" />
      </Button>

      <Popover.Content placement="bottom start" className="w-[300px] overflow-hidden p-1.5">
        <Popover.Dialog>
          <ListBox
            aria-label={`Filtrer par ${label.toLowerCase()}`}
            selectionMode="single"
            selectedKeys={[value ?? ALL]}
            onSelectionChange={(keys) => {
              if (keys === "all") return;
              const [key] = keys;
              if (key == null) return;
              onChange(key === ALL ? null : String(key));
              setOpen(false);
            }}
          >
            <ListBox.Item id={ALL} textValue="Toutes">
              <Label>Toutes</Label>
              <ListBox.ItemIndicator />
            </ListBox.Item>

            {options.map((option) => (
              <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: option.color }}
                  aria-hidden
                />
                <Label className="min-w-0 flex-1 truncate">{option.label}</Label>
                {option.count != null && (
                  <span className="text-xs tabular-nums text-muted">
                    {option.count}
                  </span>
                )}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>

          {options.length === 0 && (
            <div className="py-6 text-center text-sm text-muted">
              Aucun résultat.
            </div>
          )}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
