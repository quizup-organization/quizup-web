import { useState } from "react";
import { ImageIcon } from "lucide-react";
import type { Language } from "@/features/player/domain/profile";
import { AppDialog } from "@/shared/components/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedSwitch } from "@/components/spectrumui/animated-switch";
import type { QuestionEditor } from "../domain/topic-authoring";
import {
  MAX_QUESTION_TEXT,
  QUESTION_CHOICES,
  draftErrors,
  draftFromQuestion,
  emptyDraft,
  type ContentDraft,
  type QuestionDraft,
} from "../lib/question-draft";
import { useSaveQuestion } from "../hooks/useTopicAuthoring";

interface QuestionEditorDialogProps {
  topicId: string;
  /** Question éditée, ou `null` pour une création. */
  question: QuestionEditor | null;
  onClose: () => void;
}

export function QuestionEditorDialog({
  topicId,
  question,
  onClose,
}: QuestionEditorDialogProps) {
  const [draft, setDraft] = useState<QuestionDraft>(() =>
    question ? draftFromQuestion(question) : emptyDraft(),
  );
  const [language, setLanguage] = useState<Language>("fr");
  const [errors, setErrors] = useState<string[]>([]);
  const save = useSaveQuestion(topicId);

  const updateContent = (target: Language, patch: Partial<ContentDraft>) => {
    setDraft((current) => ({
      ...current,
      [target]: { ...current[target], ...patch },
    }));
  };

  const updateAnswer = (
    target: Language,
    choice: (typeof QUESTION_CHOICES)[number],
    text: string,
  ) => {
    setDraft((current) => ({
      ...current,
      [target]: {
        ...current[target],
        answers: { ...current[target].answers, [choice]: text },
      },
    }));
  };

  const submit = () => {
    const validationErrors = draftErrors(draft);
    setErrors(validationErrors);
    if (validationErrors.length > 0) {
      return;
    }
    save.mutate({ question, draft }, { onSuccess: onClose });
  };

  const content = draft[language];

  return (
    <AppDialog
      open
      onClose={onClose}
      title={question ? "Modifier la question" : "Nouvelle question"}
      sub="Quatre réponses, une seule correcte — partagée entre les langues."
      toolbar={
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={language === "fr" ? "default" : "outline"}
            onClick={() => setLanguage("fr")}
          >
            Français
          </Button>
          <Button
            type="button"
            size="sm"
            variant={language === "en" ? "default" : "outline"}
            onClick={() => setLanguage("en")}
          >
            Anglais
          </Button>
        </div>
      }
      footer={
        <div className="flex w-full justify-end gap-2 compact:flex-row">
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      }
    >
      {errors.length > 0 && (
        <ul className="mb-4 list-disc space-y-1 rounded-lg border border-destructive/40 bg-destructive/5 px-6 py-3 text-sm text-destructive">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      {language === "en" && !content.enabled ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-10 text-center">
          <div>
            <p className="text-sm font-semibold">Ajouter une version anglaise</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Optionnelle : un duel peut se jouer en anglais uniquement si les questions y
              sont traduites.
            </p>
          </div>
          <AnimatedSwitch
            label="Ajouter une version anglaise"
            checked={content.enabled}
            onCheckedChange={(checked) => updateContent("en", { enabled: checked })}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="question-text">Question</Label>
              <span className="text-xs text-muted-foreground">
                {content.text.length}/{MAX_QUESTION_TEXT}
              </span>
            </div>
            <Textarea
              id="question-text"
              rows={3}
              value={content.text}
              maxLength={MAX_QUESTION_TEXT}
              onChange={(event) => updateContent(language, { text: event.target.value })}
              placeholder={
                language === "fr"
                  ? "Quelle est la capitale de la France ?"
                  : "What is the capital of France?"
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Réponses — sélectionne la bonne</Label>
            {QUESTION_CHOICES.map((choice) => (
              <div key={choice} className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="correct-answer"
                  className="size-4 shrink-0 accent-primary"
                  checked={draft.correctAnswer === choice}
                  onChange={() =>
                    setDraft((current) => ({ ...current, correctAnswer: choice }))
                  }
                  aria-label={`Bonne réponse ${choice}`}
                />
                <span className="w-4 text-sm font-semibold text-muted-foreground">
                  {choice}
                </span>
                <Input
                  value={content.answers[choice]}
                  onChange={(event) =>
                    updateAnswer(language, choice, event.target.value)
                  }
                  placeholder={`Réponse ${choice}`}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="question-image">Image (URL, optionnelle)</Label>
            <div className="flex items-center gap-3">
              <Input
                id="question-image"
                value={draft.imageUrl}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, imageUrl: event.target.value }))
                }
                placeholder="https://…"
              />
              <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                {draft.imageUrl ? (
                  <img
                    src={draft.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-4 text-muted-foreground" />
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </AppDialog>
  );
}
