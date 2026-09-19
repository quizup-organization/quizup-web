import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/features/shell/components/PageContainer";
import { SectionHeader } from "@/components/section-header";
import { TopicCarousel } from "@/features/topics/components/TopicCarousel";
import { useFollowedTopicIds } from "@/features/topics/hooks/useTopics";
import { useTopicFilterStore } from "@/features/topics/stores/useTopicFilterStore";
import { topicsService, toTopicView } from "@/lib/services/topics";
import { queryKeys } from "@/lib/query-keys";
import type { SearchRequest } from "@/shared/types/search";

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-8">
      <SectionHeader title={title}>{action ?? null}</SectionHeader>
      {children}
    </section>
  );
}

const TRENDING_REQUEST: SearchRequest = {
  filters: [{ property: "status", operator: "EQUALS", value: "PUBLISHED" }],
  sorts: [{ property: "followersCounter", direction: "DESC" }],
  page: { number: 0, size: 12 },
};

export function HomePage() {
  const navigate = useNavigate();
  const setFollowedOnly = useTopicFilterStore((s) => s.setFollowedOnly);
  const { data: followedIds = [] } = useFollowedTopicIds();

  const followedRequest: SearchRequest = {
    filters: [
      { property: "status", operator: "EQUALS", value: "PUBLISHED" },
      { property: "topicId", operator: "IN", values: followedIds },
    ],
    sorts: [{ property: "followersCounter", direction: "DESC" }],
    page: { number: 0, size: 12 },
  };

  const followedQuery = useQuery({
    queryKey: queryKeys.topics.search(followedRequest),
    queryFn: () => topicsService.search(followedRequest),
    enabled: followedIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const trendingQuery = useQuery({
    queryKey: queryKeys.topics.search(TRENDING_REQUEST),
    queryFn: () => topicsService.search(TRENDING_REQUEST),
    staleTime: 5 * 60 * 1000,
  });

  const followedTopics = (followedQuery.data?.content ?? []).map(toTopicView);
  const trendingTopics = (trendingQuery.data?.content ?? []).map(toTopicView);

  return (
    <PageContainer>
      <Section
        title="Tes sujets suivis"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFollowedOnly(true);
              navigate("/topics");
            }}
          >
            Tout voir <ChevronRight />
          </Button>
        }
      >
        {followedIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Suis des sujets pour les retrouver ici et défier d&apos;autres joueurs.
          </p>
        ) : followedQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <TopicCarousel
            topics={followedTopics}
            onOpen={(id) => navigate(`/topics/${id}`)}
          />
        )}
      </Section>

      <Section
        title="Les plus joués en ce moment"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFollowedOnly(false);
              navigate("/topics");
            }}
          >
            Explorer le catalogue <ChevronRight />
          </Button>
        }
      >
        {trendingQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <TopicCarousel
            topics={trendingTopics}
            onOpen={(id) => navigate(`/topics/${id}`)}
          />
        )}
      </Section>
    </PageContainer>
  );
}
