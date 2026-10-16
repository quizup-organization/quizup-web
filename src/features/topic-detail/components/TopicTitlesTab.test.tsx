// @vitest-environment jsdom
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { TopicCard } from "@/features/topics/domain/topic"
import { TopicTitlesTab } from "./TopicTitlesTab"

vi.mock("@/features/shell", () => ({
  useMe: () => ({ data: { userId: "user-1" } }),
  PageContainer: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
}))

const topic: TopicCard = {
  topicId: "t1",
  names: { fr: "Histoire" },
  description: null,
  category: null,
  categoryLabel: null,
  emoji: null,
  color: null,
  imageUrl: null,
  bannerUrl: null,
  followersCount: 0,
  questionsCount: 20,
  followed: false,
  status: "PUBLISHED",
}

/** Grades atteints : Novice → Pratiquant (1 200 XP) ; le titre porté est « Pratiquant ». */
const progress = {
  xp: 1200,
  grade: "PRATIQUANT",
  gradeProgressPercent: 20,
  gradeRemainingXp: 1300,
  nextGrade: "CONFIRME",
}

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TopicTitlesTab
        topic={topic}
        titles={null}
        progress={progress}
        equippedKey="t1:PRATIQUANT"
      />
    </QueryClientProvider>
  )
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("TopicTitlesTab", () => {
  it("ne porte que le titre sur la carte repliée (aucune XP, aucun état)", () => {
    renderTab()

    // Le nom accessible du déclencheur vaut le seul titre : la description repliée a disparu.
    expect(
      screen.getByRole("button", { name: "Pratiquant" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Expert" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /XP/ })).toBeNull()
  })

  it("marque les grades atteints d'une coche (cadenas sinon)", () => {
    renderTab()

    expect(
      screen
        .getByRole("button", { name: "Pratiquant" })
        .querySelector(".lucide-check")
    ).not.toBeNull()
    expect(
      screen
        .getByRole("button", { name: "Expert" })
        .querySelector(".lucide-lock")
    ).not.toBeNull()
  })

  it("ne montre l'XP que dans le panneau déplié", () => {
    renderTab()

    // Grade courant : marche vers le suivant et barre. Grades verrouillés : seuil et restant.
    expect(screen.getByText(/XP avant Confirmé/)).toBeInTheDocument()
    expect(screen.getAllByText(/Plus que/)).toHaveLength(4)
  })

  it("distingue l'état porté de l'état acquis", () => {
    renderTab()

    expect(screen.getByText("Affiché")).toBeInTheDocument()
    expect(screen.getAllByText("Débloqué")).toHaveLength(2)
  })
})
