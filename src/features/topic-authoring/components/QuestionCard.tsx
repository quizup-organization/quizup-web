import { useTranslation } from "react-i18next"
import {
  CheckCircle2,
  ImageIcon,
  Pencil,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { TranslationKey } from "@/lib/i18n/types"
import type { QuestionEditor, QuestionStatus } from "../domain/topic-authoring"

const STATUS_LABEL_KEYS: Record<QuestionStatus, TranslationKey> = {
  PENDING: "authoring.status.pending",
  APPROVED: "authoring.status.approved",
  REJECTED: "authoring.status.rejected",
}

const STATUS_CLASSES: Record<QuestionStatus, string> = {
  PENDING: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  APPROVED: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  REJECTED: "border-destructive/40 bg-destructive/10 text-destructive",
}

interface QuestionCardProps {
  question: QuestionEditor
  busy: boolean
  onEdit: () => void
  onApprove: () => void
  onReject: () => void
}

/** Ligne de question dans l'atelier d'un sujet : contenu FR, statut et actions de modération. */
export function QuestionCard({
  question,
  busy,
  onEdit,
  onApprove,
  onReject,
}: QuestionCardProps) {
  const { t } = useTranslation()
  const french = question.contents.find((content) => content.language === "fr")
  const languages = question.contents.map((content) =>
    content.language.toUpperCase()
  )
  const correctAnswer = question.contents
    .find((content) => content.language === "fr")
    ?.answers.find((answer) => answer.choice === question.correctAnswer)?.text

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3.5">
      <div className="flex items-start gap-3">
        {question.imageUrl ? (
          <img
            src={question.imageUrl}
            alt=""
            className="size-11 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted">
            <ImageIcon className="size-4 text-muted-foreground" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {french?.text ?? question.contents[0]?.text}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {correctAnswer
              ? t("authoring.question.correctAnswerText", {
                  choice: question.correctAnswer,
                  text: correctAnswer,
                })
              : t("authoring.question.correctAnswer", {
                  choice: question.correctAnswer,
                })}
          </p>
        </div>
        <Badge variant="outline" className={STATUS_CLASSES[question.status]}>
          {question.status === "APPROVED" && <CheckCircle2 />}
          {question.status === "REJECTED" && <XCircle />}
          {t(STATUS_LABEL_KEYS[question.status])}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary">{languages.join(" · ")}</Badge>
          {question.difficulty && (
            <Badge variant="secondary">{question.difficulty}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={onEdit} disabled={busy}>
            <Pencil /> {t("authoring.question.edit")}
          </Button>
          {question.status !== "APPROVED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={onApprove}
              disabled={busy}
            >
              <ThumbsUp /> {t("authoring.question.approve")}
            </Button>
          )}
          {question.status !== "REJECTED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={busy}
            >
              <ThumbsDown /> {t("authoring.question.reject")}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
