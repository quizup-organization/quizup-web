import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state"
import { PageContainer, useMe } from "@/features/shell"
import { useHome } from "../hooks/useHome"
import { OnboardingFlow } from "../components/OnboardingFlow"
import { hasCompletedOnboarding, sanitizeReturnTo } from "@/lib/onboarding"

/** Route dédiée du premier compte ; le shell applicatif n'est pas monté pendant le flow. */
export function OnboardingPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const returnTo = sanitizeReturnTo(params.get("returnTo"))
  const { data: me, isLoading: meLoading, isError: meError, refetch } = useMe()
  const { data: home, isLoading: homeLoading } = useHome()

  const topics = useMemo(() => {
    const seen = new Set<string>()
    return [...(home?.trendingTopics ?? []), ...(home?.newTopics ?? [])].filter(
      (topic) => {
        if (seen.has(topic.topicId)) return false
        seen.add(topic.topicId)
        return true
      }
    )
  }, [home?.newTopics, home?.trendingTopics])

  if (hasCompletedOnboarding(me)) {
    return <Navigate to={returnTo ?? "/"} replace />
  }

  if (meLoading || homeLoading) {
    return (
      <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">
        {t("common.app.loading")}
      </div>
    )
  }

  if (meError || !me) {
    return (
      <div className="grid min-h-svh place-items-center p-6">
        <EmptyState
          title={t("home.onboarding.loadError")}
          description={t("home.onboarding.loadError")}
        >
          <Button variant="outline" onClick={() => void refetch()}>
            {t("home.onboarding.retry")}
          </Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <PageContainer className="max-w-2xl">
        <OnboardingFlow topics={topics} returnTo={returnTo} />
      </PageContainer>
    </div>
  )
}
