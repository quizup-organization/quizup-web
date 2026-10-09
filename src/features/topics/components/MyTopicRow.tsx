import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TopicIcon } from "@/shared/components/topic-icon";
import { useTopicName } from "@/features/shell";
import { categoryLabel } from "@/shared/utils/categories";
import {
  MIN_QUESTIONS_TO_PUBLISH,
  type TopicCard,
  type TopicStatus,
} from "../domain/topic";

const STATUS_LABELS: Record<TopicStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

/**
 * Ligne « Mes sujets » (atelier d'auteur) : statut, progression de brouillon et actions
 * Voir (publié) / Gérer (édition des questions et publication).
 */
export function MyTopicRow({
  topic,
  onManage,
}: {
  topic: TopicCard;
  onManage: (topicId: string) => void;
}) {
  const resolveName = useTopicName();
  const label = topic.categoryLabel ?? categoryLabel(topic.category ?? "");
  const approved = Math.min(topic.questionsCount, MIN_QUESTIONS_TO_PUBLISH);

  return (
    <Card>
      <CardContent className="flex items-center gap-3.5">
        <TopicIcon topic={topic} size={52} className="rounded-[16px] shadow-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-heading text-sm font-bold">
              {resolveName(topic.names)}
            </p>
            <Badge
              variant="outline"
              className={
                topic.status === "PUBLISHED"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                  : undefined
              }
            >
              {STATUS_LABELS[topic.status]}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{label}</p>
          {topic.status === "DRAFT" && (
            <div className="mt-2 flex items-center gap-2">
              <Progress
                value={(approved / MIN_QUESTIONS_TO_PUBLISH) * 100}
                className="h-1.5 w-32"
              />
              <span className="text-xs text-muted-foreground">
                {topic.questionsCount}/{MIN_QUESTIONS_TO_PUBLISH} approuvées
              </span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {topic.status === "PUBLISHED" && (
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link to={`/topics/${topic.topicId}`} />}
            >
              Voir
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onManage(topic.topicId)}>
            Gérer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
