import { memo, useCallback } from "react";
import { Check } from "lucide-react";
import { cn } from "cn";
import { Card, CardContent } from "@/components/ui/card";
import {
  ColorSelector,
  ColorSelectorItem,
  ColorSelectorLabel,
  ColorSelectorList,
} from "@/components/motion/color-selector";
import { avatarDataUri } from "@/shared/avatar/avatar";
import {
  AVATAR_EDITOR_GROUPS,
  NONE_LABEL,
  type AvatarEditorSection,
  type AvatarOptions,
} from "@/shared/avatar/micah-options";

interface AvatarEditorProps {
  /** Options en cours d'édition (contrôlé : l'aperçu est porté par le bandeau). */
  draft: AvatarOptions;
  onDraftChange: (draft: AvatarOptions) => void;
  /** Groupe actif (onglets gérés par la page). */
  groupId: string;
  className?: string;
}

const TRANSPARENT_STYLE = {
  backgroundImage:
    "linear-gradient(135deg, transparent 44%, #ef4444 44%, #ef4444 56%, transparent 56%), linear-gradient(45deg, #e4e4e7 25%, #ffffff 25%, #ffffff 50%, #e4e4e7 50%, #e4e4e7 75%, #ffffff 75%)",
  backgroundSize: "100% 100%, 10px 10px",
};

type PickOption = (key: keyof AvatarOptions, value: string) => void;

/**
 * Sections du groupe actif : chaque section (Yeux, Cheveux…) est englobée dans une `Card`.
 * Contrôlé : toute modification remonte via `onDraftChange`.
 */
export function AvatarEditor({
  draft,
  onDraftChange,
  groupId,
  className,
}: AvatarEditorProps) {
  const group =
    AVATAR_EDITOR_GROUPS.find((g) => g.id === groupId) ?? AVATAR_EDITOR_GROUPS[0];

  const setOption = useCallback<PickOption>(
    (key, optionValue) => {
      onDraftChange({ ...draft, [key]: optionValue } as AvatarOptions);
    },
    [draft, onDraftChange],
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {group.sections.map((section) => (
        <Card key={section.id} size="sm">
          <CardContent className="flex flex-col gap-3">
            <SectionBlock section={section} draft={draft} onPick={setOption} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SectionBlock({
  section,
  draft,
  onPick,
}: {
  section: AvatarEditorSection;
  draft: AvatarOptions;
  onPick: PickOption;
}) {
  const field = section.variantField;
  const variants = section.allowsNone
    ? ["none", ...(section.variants ?? [])]
    : [...(section.variants ?? [])];

  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <section.icon className="size-3.5" />
        {section.label}
      </h3>

      {field && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {variants.map((variant) => {
            const selected = draft[field] === variant;
            const tile: AvatarOptions = { ...draft, [field]: variant };
            return (
              <VariantTile
                key={variant}
                dataUri={avatarDataUri(tile, 72)}
                label={variant === "none" ? NONE_LABEL : (section.labels?.[variant] ?? variant)}
                selected={selected}
                field={field}
                value={variant}
                onPick={onPick}
              />
            );
          })}
        </div>
      )}

      {section.colorField && (
        <ColorSelector
          value={draft[section.colorField] ?? ""}
          onValueChange={(value) => onPick(section.colorField!, value)}
        >
          <ColorSelectorLabel className="mb-4 text-[11px] font-normal text-muted-foreground">
            {section.colorLabel ?? "Couleur"}
          </ColorSelectorLabel>
          <ColorSelectorList className="gap-2 p-0">
            {(section.colors ?? []).map((color) => (
              <ColorSelectorItem
                key={color || "transparent"}
                value={color}
                color={color || "transparent"}
                label={color || "Transparent"}
                dotStyle={color ? undefined : TRANSPARENT_STYLE}
              />
            ))}
          </ColorSelectorList>
        </ColorSelector>
      )}
    </section>
  );
}

const VariantTile = memo(function VariantTile({
  dataUri,
  label,
  selected,
  field,
  value,
  onPick,
}: {
  dataUri: string;
  label: string;
  selected: boolean;
  field: keyof AvatarOptions;
  value: string;
  onPick: PickOption;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(field, value)}
      aria-pressed={selected}
      title={label}
      className={cn(
        "group relative flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/40"
          : "border-border hover:border-foreground/30 hover:bg-muted/50",
      )}
    >
      <img src={dataUri} alt="" className="size-14" />
      <span
        className={cn(
          "max-w-full truncate text-[11px] leading-tight",
          selected ? "font-semibold text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      {selected && (
        <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" />
        </span>
      )}
    </button>
  );
});
