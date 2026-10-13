import type { ReactNode } from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageContainer } from "@/features/shell"
import { usePreloadImages } from "@/shared/hooks/usePreloadImages"
import { SectionHeader } from "../components/section-header"
import { PendingDuelsSection } from "../components/PendingDuelsSection"
import { TopicCarousel } from "@/features/topics"
import { useHome } from "../hooks/useHome"

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mb-8">
      <SectionHeader title={title}>{action ?? null}</SectionHeader>
      {children}
    </section>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useHome()

  const followedTopics = data?.followedTopics ?? []
  const trendingTopics = data?.trendingTopics ?? []
  const newTopics = data?.newTopics ?? []

  // Visuels des premières cartes préchargés en priorité basse (navigation instantanée ensuite).
  const preloadUrls = useMemo(
    () =>
      [
        ...(data?.followedTopics ?? []),
        ...(data?.newTopics ?? []),
        ...(data?.trendingTopics ?? []),
      ].map((topic) => topic.imageUrl),
    [data?.followedTopics, data?.newTopics, data?.trendingTopics]
  )
  usePreloadImages(preloadUrls, { limit: 8, priority: "low" })

  return (
    <PageContainer>
      <PendingDuelsSection />
      {/* Section masquée tant que l'utilisateur n'a suivi aucun sujet (pas d'état vide). */}
      {!isLoading && followedTopics.length > 0 && (
        <Section
          title={t("home.followedTopics.title")}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/topics?followed=true")}
            >
              {t("home.seeAll")} <ChevronRight />
            </Button>
          }
        >
          <TopicCarousel
            topics={followedTopics}
            onOpen={(id) => navigate(`/topics/${id}`)}
            label={t("home.followedTopics.title")}
          />
        </Section>
      )}

      <Section
        title={t("home.newTopics.title")}
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/topics?sort=RECENT")}
          >
            {t("home.seeAll")} <ChevronRight />
          </Button>
        }
      >
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            {t("common.app.loading")}
          </p>
        ) : newTopics.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("home.newTopics.empty")}
          </p>
        ) : (
          <TopicCarousel
            topics={newTopics}
            onOpen={(id) => navigate(`/topics/${id}`)}
            label={t("home.newTopics.title")}
          />
        )}
      </Section>

      <Section
        title={t("home.trending.title")}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate("/topics")}>
            {t("home.trending.browse")} <ChevronRight />
          </Button>
        }
      >
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            {t("common.app.loading")}
          </p>
        ) : isError ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {t("home.trending.error")}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t("home.trending.retry")}
            </Button>
          </div>
        ) : (
          <TopicCarousel
            topics={trendingTopics}
            onOpen={(id) => navigate(`/topics/${id}`)}
            label={t("home.trending.title")}
          />
        )}
      </Section>
    </PageContainer>
  )
}
