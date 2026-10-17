import { useTranslation } from "react-i18next"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/motion/tabs"
import { useMe } from "@/features/shell"
import { PageHeaderBar } from "@/shared/components/page-header-bar"
import { useUrlParam } from "@/shared/hooks/useUrlParam"
import type { PeopleDirection } from "@/features/player/domain/profile"
import { PendingTab } from "../components/PendingTab"
import { PeopleTab } from "../components/PeopleTab"
import { useSocialPending } from "../hooks/useSocialPending"

export type SocialTab = PeopleDirection | "challenges"

const SOCIAL_TABS: SocialTab[] = ["following", "followers", "challenges"]

function isSocialTab(value: string): value is SocialTab {
  return (SOCIAL_TABS as string[]).includes(value)
}

/**
 * Espace **Social** : abonnements et abonnés, puis un onglet fusionné **Défis & Salons**
 * (défis reçus/envoyés et salons ouverts). L'ancien lien `?tab=rooms` retombe sur cet onglet.
 * L'onglet vit dans l'URL (`?tab=`) ; la pastille de la navigation porte le total en attente.
 */
export function SocialPage() {
  const { t } = useTranslation()
  const [rawTab, setTab] = useUrlParam<string>("tab", "following")
  const tab: SocialTab =
    rawTab === "rooms"
      ? "challenges"
      : isSocialTab(rawTab)
        ? rawTab
        : "following"
  const me = useMe()
  const pending = useSocialPending()

  const people = tab === "following" || tab === "followers"
  const pendingCount = pending.total

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-0">
      <PageHeaderBar>
        <TabsList>
          <TabsTrigger value="following">
            {t("social.tabs.following", {
              count: me.data?.followingCount ?? 0,
            })}
          </TabsTrigger>
          <TabsTrigger value="followers">
            {t("social.tabs.followers", {
              count: me.data?.followersCount ?? 0,
            })}
          </TabsTrigger>
          <TabsTrigger value="challenges">
            {pendingCount > 0
              ? t("social.tabs.pendingWithCount", { count: pendingCount })
              : t("social.tabs.pending")}
          </TabsTrigger>
        </TabsList>
      </PageHeaderBar>

      {people ? (
        <PeopleTab direction={tab} />
      ) : (
        <TabsContent value={tab} className="mt-0">
          <PendingTab />
        </TabsContent>
      )}
    </Tabs>
  )
}
