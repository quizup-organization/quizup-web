import { useTranslation } from "react-i18next"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/motion/tabs"
import { PageContainer, useMe } from "@/features/shell"
import { PageHeaderBar } from "@/shared/components/page-header-bar"
import { useUrlParam } from "@/shared/hooks/useUrlParam"
import type { PeopleDirection } from "@/features/player/domain/profile"
import { ChallengesTab } from "../components/ChallengesTab"
import { PeopleTab } from "../components/PeopleTab"
import { RoomsTab } from "../components/RoomsTab"
import { useSocialPending } from "../hooks/useSocialPending"

export type SocialTab = PeopleDirection | "challenges" | "rooms"

const SOCIAL_TABS: SocialTab[] = [
  "following",
  "followers",
  "challenges",
  "rooms",
]

function isSocialTab(value: string): value is SocialTab {
  return (SOCIAL_TABS as string[]).includes(value)
}

/**
 * Espace **Social** : abonnements et abonnés, défis nominatifs en attente (reçus en deck de tri,
 * envoyés en liste) et salons ouverts. L'onglet vit dans l'URL (`?tab=`) ; la pastille de la
 * navigation porte le total en attente.
 */
export function SocialPage() {
  const { t } = useTranslation()
  const [rawTab, setTab] = useUrlParam<string>("tab", "following")
  const tab: SocialTab = isSocialTab(rawTab) ? rawTab : "following"
  const me = useMe()
  const pending = useSocialPending()

  const people = tab === "following" || tab === "followers"
  const challengeCount = pending.received.length + pending.sent.length

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
            {challengeCount > 0
              ? t("social.tabs.challengesWithCount", { count: challengeCount })
              : t("social.tabs.challenges")}
          </TabsTrigger>
          <TabsTrigger value="rooms">
            {pending.rooms.length > 0
              ? t("social.tabs.roomsWithCount", {
                  count: pending.rooms.length,
                })
              : t("social.tabs.rooms")}
          </TabsTrigger>
        </TabsList>
      </PageHeaderBar>

      {people ? (
        <PeopleTab direction={tab} />
      ) : (
        <PageContainer>
          <TabsContent value={tab} className="mt-0">
            {tab === "challenges" ? <ChallengesTab /> : <RoomsTab />}
          </TabsContent>
        </PageContainer>
      )}
    </Tabs>
  )
}
