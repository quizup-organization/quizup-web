import { memo, useCallback, useMemo, useState } from "react";
import { Check, Dices, RotateCcw } from "lucide-react";
import { cn } from "cn";
import { AppDialog } from "@/shared/components/app-dialog";
import { Button } from "@/components/ui/button";
import { avatarDataUri, parseAvatarOptions, randomAvatarOptions } from "@/shared/avatar/avatar";
import {
    AVATAR_EDITOR_GROUPS,
    DEFAULT_AVATAR_OPTIONS,
    NONE_LABEL,
    shapeClassName,
    type AvatarEditorGroup,
    type AvatarEditorSection,
    type AvatarOptions,
    type AvatarShape,
} from "@/shared/avatar/micah-options";

interface AvatarEditorDialogProps {
    open: boolean;
    onClose: () => void;
    /** Options persistées (JSON) du profil, si l'avatar a déjà été personnalisé. */
    value?: string;
    onSave: (options: AvatarOptions) => void;
}

const SHAPES: AvatarShape[] = ["circle", "rounded", "square"];
const SHAPE_LABELS: Record<AvatarShape, string> = {
    circle: "Cercle",
    rounded: "Arrondi",
    square: "Carré",
};

const TRANSPARENT_STYLE = {
    backgroundImage:
        "linear-gradient(135deg, transparent 44%, #ef4444 44%, #ef4444 56%, transparent 56%), linear-gradient(45deg, #e4e4e7 25%, #ffffff 25%, #ffffff 50%, #e4e4e7 50%, #e4e4e7 75%, #ffffff 75%)",
    backgroundSize: "100% 100%, 10px 10px",
};

type PickOption = (key: keyof AvatarOptions, value: string) => void;

/**
 * Éditeur d'avatar DiceBear (style micah) — aperçu live, rail vertical de groupes
 * et panneaux à vignettes étiquetées + nuanciers.
 */
export function AvatarEditorDialog({ open, onClose, value, onSave }: AvatarEditorDialogProps) {
    const [draft, setDraft] = useState<AvatarOptions>(
        () => parseAvatarOptions(value) ?? { ...DEFAULT_AVATAR_OPTIONS },
    );
    // Référence des options à l'ouverture : sert à marquer ce qui a été modifié.
    const [baseline] = useState<AvatarOptions>(draft);
    const [groupId, setGroupId] = useState<string>(AVATAR_EDITOR_GROUPS[0].id);

    const setOption = useCallback<PickOption>((key, optionValue) => {
        setDraft((prev) => ({ ...prev, [key]: optionValue }) as AvatarOptions);
    }, []);

    const previewSrc = useMemo(
        () => avatarDataUri({ ...draft, shape: draft.shape ?? "circle" }, 320),
        [draft],
    );

    const group = AVATAR_EDITOR_GROUPS.find((g) => g.id === groupId) ?? AVATAR_EDITOR_GROUPS[0];

    const isChanged = useCallback(
        (field?: keyof AvatarOptions) => (field ? draft[field] !== baseline[field] : false),
        [draft, baseline],
    );
    const sectionChanged = (item: AvatarEditorSection) =>
        isChanged(item.variantField) || isChanged(item.colorField);
    const groupChanged = (item: AvatarEditorGroup) => item.sections.some(sectionChanged);

    return (
        <AppDialog
            open={open}
            onClose={onClose}
            title="Changer l'avatar"
            sub="Compose ton personnage, puis enregistre."
            className="sm:max-w-5xl"
            sticky
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button
                        onClick={() => {
                            onSave(draft);
                            onClose();
                        }}
                    >
                        Enregistrer
                    </Button>
                </>
            }
        >
            <div className="grid gap-5 lg:grid-cols-[220px_168px_1fr]">
                {/* Colonne aperçu */}
                <div className="flex flex-col gap-3 lg:sticky lg:top-0 lg:self-start">
                    <div className="flex flex-col items-center gap-3 rounded-xl border bg-muted/40 p-4">
                        <img
                            src={previewSrc}
                            alt="Aperçu de l'avatar"
                            className={cn("size-44 bg-background", shapeClassName(draft.shape))}
                        />
                        <div className="flex flex-wrap justify-center gap-1.5">
                            {SHAPES.map((shape) => (
                                <button
                                    key={shape}
                                    type="button"
                                    onClick={() => setOption("shape", shape)}
                                    aria-pressed={draft.shape === shape}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                                        draft.shape === shape
                                            ? "border-primary bg-primary/10 text-foreground"
                                            : "border-border text-muted-foreground hover:bg-muted",
                                    )}
                                >
                                    <span className={cn("size-3.5 bg-muted-foreground/50", shapeClassName(shape))} />
                                    {SHAPE_LABELS[shape]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                                setDraft((prev) => ({ ...randomAvatarOptions(), shape: prev.shape ?? "circle" }))
                            }
                        >
                            <Dices /> Aléatoire
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                                setDraft((prev) => ({
                                    ...DEFAULT_AVATAR_OPTIONS,
                                    shape: prev.shape ?? "circle",
                                }))
                            }
                        >
                            <RotateCcw /> Réinitialiser
                        </Button>
                    </div>

                    <p className="text-center text-[10px] leading-tight text-muted-foreground">
                        Avatars{" "}
                        <a
                            href="https://www.dicebear.com/styles/micah/"
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2"
                        >
                            DiceBear — style Micah
                        </a>{" "}
                        par Micah Lanier (CC BY 4.0)
                    </p>
                </div>

                {/* Rail vertical des groupes */}
                <nav
                    aria-label="Catégories d'avatar"
                    className="flex gap-1 overflow-x-auto lg:sticky lg:top-0 lg:flex-col lg:self-start lg:overflow-visible"
                >
                    {AVATAR_EDITOR_GROUPS.map((item) => {
                        const active = item.id === group.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setGroupId(item.id)}
                                aria-current={active ? "true" : undefined}
                                className={cn(
                                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:w-full",
                                    active
                                        ? "bg-primary/10 text-foreground"
                                        : "text-muted-foreground hover:bg-muted",
                                )}
                            >
                                <item.icon className="size-4 shrink-0" />
                                <span className="whitespace-nowrap">{item.label}</span>
                                {groupChanged(item) && (
                                    <span className="ml-auto size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Contenu du groupe actif */}
                <div className="flex min-w-0 flex-col gap-8">
                    {group.sections.map((item) => (
                        <SectionBlock key={item.id} section={item} draft={draft} onPick={setOption} />
                    ))}
                </div>
            </div>
        </AppDialog>
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
    const variants = section.allowsNone ? ["none", ...(section.variants ?? [])] : [...(section.variants ?? [])];

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
                        const tile: AvatarOptions = { ...draft, shape: "circle", [field]: variant };
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
                <div className="flex flex-col gap-2">
                    <span className="text-[11px] text-muted-foreground">
                        {section.colorLabel ?? "Couleur"}
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {(section.colors ?? []).map((color) => (
                            <ColorSwatch
                                key={color || "transparent"}
                                color={color}
                                selected={draft[section.colorField!] === color}
                                field={section.colorField!}
                                onPick={onPick}
                            />
                        ))}
                    </div>
                </div>
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

const ColorSwatch = memo(function ColorSwatch({
    color,
    selected,
    field,
    onPick,
}: {
    color: string;
    selected: boolean;
    field: keyof AvatarOptions;
    onPick: PickOption;
}) {
    return (
        <button
            type="button"
            onClick={() => onPick(field, color)}
            aria-label={color || "Transparent"}
            aria-pressed={selected}
            className={cn(
                "grid size-8 place-items-center rounded-full border transition-transform hover:scale-110",
                selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
            style={color ? { backgroundColor: color } : TRANSPARENT_STYLE}
        >
            {selected && (
                <Check className="size-4" style={{ color: color ? "#ffffff" : "#71717a" }} strokeWidth={3} />
            )}
        </button>
    );
});


