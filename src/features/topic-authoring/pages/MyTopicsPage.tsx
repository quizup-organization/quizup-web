import { Link, useNavigate } from "react-router-dom";
import { PackageOpen, Plus, SquarePen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/shared/components/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { PageContainer } from "@/features/shell";
import { PageHeaderBar } from "@/shared/components/page-header-bar";
import { TopicIcon } from "@/shared/components/topic-icon";
import { useUrlParam } from "@/shared/hooks/useUrlParam";
import { categoryLabel } from "@/shared/utils/categories";
import type { TopicCard, TopicStatus } from "@/features/topics";
import { useMyTopics } from "../hooks/useTopicAuthoring";

export const MIN_QUESTIONS_TO_PUBLISH = 7;

const STATUS_LABELS: Record<TopicStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

type TabValue = "published" | "draft";

function TopicRow({
  topic,
  onManage,
}: {
  topic: TopicCard;
  onManage: (topicId: string) => void;
}) {
  const label = topic.categoryLabel ?? categoryLabel(topic.category ?? "");
  const approved = Math.min(topic.questionsCount, MIN_QUESTIONS_TO_PUBLISH);

  return (
    <Card>
      <CardContent className="flex items-center gap-3.5">
        <TopicIcon topic={topic} size={52} className="rounded-[16px] shadow-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-heading text-sm font-bold">{topic.name}</p>
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
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link to={`/topics/${topic.topicId}`} />}>
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

/**
 * Atelier du joueur : brouillons et sujets publiés, filtrés par onglets — même bandeau que
 * l'inbox de notifications (tabs à gauche, action à droite).
 */
export function MyTopicsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useUrlParam<TabValue>("tab", "published");
  const query = useMyTopics(0, 100);
  const topics = query.data?.content ?? [];

  const published = topics.filter((topic) => topic.status === "PUBLISHED");
  const drafts = topics.filter((topic) => topic.status === "DRAFT");
  const visible = tab === "published" ? published : drafts;

  return (
    <div className="flex flex-col">
      <PageHeaderBar justify>
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as TabValue)}
        >
          <TabsList>
            <TabsTrigger value="published">
              Publiés{published.length > 0 ? ` (${published.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="draft">
              Brouillons{drafts.length > 0 ? ` (${drafts.length})` : ""}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button nativeButton={false} render={<Link to="/topics/new" />}>
          <Plus /> Créer un sujet
        </Button>
      </PageHeaderBar>

      <PageContainer style={{ paddingTop: 16 }}>
        {query.isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-23 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : query.isError ? (
          <EmptyState title="Impossible de charger tes sujets">
            <Button variant="outline" onClick={() => query.refetch()}>
              Réessayer
            </Button>
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<PackageOpen className="size-6 text-muted-foreground" />}
            title={tab === "published" ? "Aucun sujet publié" : "Aucun brouillon"}
            description={
              tab === "published"
                ? "Publie un brouillon dès qu'il compte 7 questions approuvées : il rejoindra le catalogue."
                : "Crée ton premier sujet, ajoute au moins 7 questions approuvées, puis publie-le."
            }
          >
            {tab === "draft" && (
              <Button nativeButton={false} render={<Link to="/topics/new" />}>
                <SquarePen /> Créer un sujet
              </Button>
            )}
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((topic) => (
              <TopicRow
                key={topic.topicId}
                topic={topic}
                onManage={(id) => navigate(`/topics/${id}/manage`)}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
