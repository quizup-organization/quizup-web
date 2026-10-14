import { useTranslation } from "react-i18next"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageContainer } from "@/features/shell"
import { useMe } from "@/features/shell"
import { PageHeaderBar } from "@/shared/components/page-header-bar"
import { useGoBack } from "@/shared/hooks/useGoBack"
import { BadgeCollectionSection } from "../components/BadgeCollectionSection"
import { TitleSection } from "../components/TitleSection"
import { useBadgeCollection } from "../hooks/useBadgeCollection"
import { usePlayerTitles } from "../hooks/usePlayerTitles"

/**
 * Page « Progression » (`/progression`) : le **titre porté** (choix parmi les titres débloqués) et
 * la **collection de badges** (tout le catalogue, paliers verrouillés compris, avec leur
 * progression). Les deux vues viennent de `quizup-profile` via le BFF, sans calcul client.
 */
export function ProgressionPage() {
  const { t } = useTranslation()
  const goBack = useGoBack("/profile")
  const { data: me } = useMe()
  const userId = me?.userId ?? ""

  const collection = useBadgeCollection(userId)
  const titles = usePlayerTitles(userId)

  const loading = collection.isLoading || titles.isLoading

  return (
    <>
      <PageHeaderBar>
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ChevronLeft /> {t("common.app.back")}
        </Button>
        <h1 className="font-heading text-base font-semibold">
          {t("progression.title")}
        </h1>
      </PageHeaderBar>

      <PageContainer>
        <p className="mb-6 text-sm text-muted-foreground">
          {t("progression.subtitle")}
        </p>

        {loading ? (
          <p className="text-sm text-muted-foreground">
            {t("common.app.loading")}
          </p>
        ) : (
          <div className="space-y-10">
            {userId !== "" && titles.data && (
              <TitleSection userId={userId} titles={titles.data} />
            )}
            {collection.data && (
              <BadgeCollectionSection collection={collection.data} />
            )}
          </div>
        )}
      </PageContainer>
    </>
  )
}
