import type { ReactNode } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/features/shell";
import { usePreloadImages } from "@/shared/hooks/usePreloadImages";
import { SectionHeader } from "../components/section-header";
import { ResumeBanner } from "../components/ResumeBanner";
import { PendingDuelsSection } from "../components/PendingDuelsSection";
import { TopicCarousel, useTopicFilterStore } from "@/features/topics";
import { useHome } from "../hooks/useHome";

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

export function HomePage() {
  const navigate = useNavigate();
  const setFollowedOnly = useTopicFilterStore((s) => s.setFollowedOnly);
  const { data, isLoading, isError, refetch } = useHome();

  const followedTopics = data?.followedTopics ?? [];
  const trendingTopics = data?.trendingTopics ?? [];

  // Visuels des premières cartes préchargés en priorité basse (navigation instantanée ensuite).
  const preloadUrls = useMemo(
    () =>
      [...(data?.followedTopics ?? []), ...(data?.trendingTopics ?? [])].map(
        (topic) => topic.imageUrl,
      ),
    [data?.followedTopics, data?.trendingTopics],
  );
  usePreloadImages(preloadUrls, { limit: 8, priority: "low" });

  return (
    <PageContainer>
      <ResumeBanner />
      <PendingDuelsSection />
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
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : followedTopics.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Suis des sujets pour les retrouver ici et défier d&apos;autres joueurs.
          </p>
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
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : isError ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Impossible de charger l&apos;accueil.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Réessayer
            </Button>
          </div>
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
