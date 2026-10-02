import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@heroui/react";
import { PageContainer } from "@/features/shell";
import { SectionHeader } from "../components/section-header";
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

  return (
    <PageContainer>
      <Section
        title="Tes sujets suivis"
        action={
          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              setFollowedOnly(true);
              navigate("/topics");
            }}
          >
            Tout voir <ChevronRight />
          </Button>
        }
      >
        {isLoading ? (
          <p className="text-sm text-muted">Chargement…</p>
        ) : followedTopics.length === 0 ? (
          <p className="text-sm text-muted">
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
            onPress={() => {
              setFollowedOnly(false);
              navigate("/topics");
            }}
          >
            Explorer le catalogue <ChevronRight />
          </Button>
        }
      >
        {isLoading ? (
          <p className="text-sm text-muted">Chargement…</p>
        ) : isError ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted">
              Impossible de charger l&apos;accueil.
            </p>
            <Button variant="outline" size="sm" onPress={() => refetch()}>
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
