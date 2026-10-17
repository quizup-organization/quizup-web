// @vitest-environment jsdom
import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, within } from "@testing-library/react"
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
  games: 1,
  grade: "PRATIQUANT",
  gradeProgressPercent: 20,
  gradeRemainingXp: 1300,
  nextGrade: "CONFIRME",
}

/** Carte dépliable qui contient le déclencheur (le panneau est rendu même replié). */
function cardOf(trigger: HTMLElement): HTMLElement {
  const card = trigger.closest("article")
  if (!card) throw new Error("carte de titre introuvable")
  return card
}

function renderTab(overrides: Partial<typeof progress> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TopicTitlesTab
        topic={topic}
        titles={null}
        progress={{ ...progress, ...overrides }}
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

  it("réserve l'XP aux grades verrouillés dans le panneau déplié", () => {
    renderTab()

    // Le grade courant est atteint : aucune barre ni condition d'XP sur sa carte.
    expect(screen.queryByText(/XP avant Confirmé/)).toBeNull()
    // Grades verrouillés : seuil et restant, dans leur propre carte.
    expect(screen.getAllByText(/Plus que/)).toHaveLength(4)
    // Progression chiffrée + pourcentage, comme la fiche d'un badge.
    expect(screen.getAllByText(/1\s?200\s*\/\s*2\s?500\s*XP/)).toHaveLength(1)
    expect(screen.getAllByText("48 %")).toHaveLength(1)
    expect(screen.getByText(/1\s?200\s*\/\s*6\s?000\s*XP/)).toBeInTheDocument()
    // Fond de barre contrasté sur la carte dépliée (teintée) : 20 % de foreground.
    expect(document.querySelector('[class*="bg-foreground/20"]')).not.toBeNull()
  })

  it("n'affiche ni barre ni condition sur un grade débloqué", () => {
    renderTab()

    for (const label of ["Novice", "Apprenti", "Pratiquant"]) {
      const card = within(cardOf(screen.getByRole("button", { name: label })))
      expect(card.queryByText(/XP/)).toBeNull()
      expect(card.queryByText(/Plus que/)).toBeNull()
      expect(card.queryByText(/XP avant/)).toBeNull()
      expect(card.queryByText(/%/)).toBeNull()
    }

    // La carte du grade courant reste lisible : état et action, sans progression d'XP.
    expect(
      within(
        cardOf(screen.getByRole("button", { name: "Pratiquant" }))
      ).getByText("Affiché")
    ).toBeInTheDocument()
  })

  it("nomme l'action « Utiliser ce titre »", () => {
    renderTab()

    expect(
      screen.getAllByRole("button", { name: "Utiliser ce titre" })
    ).toHaveLength(2)
  })

  it("ne rappelle pas la rareté du titre dans le panneau déplié", () => {
    renderTab()

    expect(screen.queryByText("Fer")).toBeNull()
    expect(screen.queryByText("Argent")).toBeNull()
    expect(screen.queryByText("Diamant")).toBeNull()
  })

  it("distingue l'état porté de l'état acquis", () => {
    renderTab()

    expect(screen.getByText("Affiché")).toBeInTheDocument()
    expect(screen.getAllByText("Débloqué")).toHaveLength(2)
  })

  it("sans partie humaine : toute l'échelle est verrouillée et Fer annonce sa condition", () => {
    renderTab({
      xp: 120,
      games: 0,
      grade: "NOVICE",
      gradeProgressPercent: 0,
      gradeRemainingXp: 300,
      nextGrade: "APPRENTI",
    })

    const fer = screen.getByRole("button", { name: "Novice" })
    expect(fer.querySelector(".lucide-lock")).not.toBeNull()

    fireEvent.click(fer)
    expect(
      within(cardOf(fer)).getByText(
        "Joue une première partie contre un humain pour le débloquer"
      )
    ).toBeInTheDocument()

    for (const grade of [
      "Apprenti",
      "Pratiquant",
      "Confirmé",
      "Expert",
      "Maître",
      "Légende",
    ]) {
      expect(
        screen
          .getByRole("button", { name: grade })
          .querySelector(".lucide-lock")
      ).not.toBeNull()
    }

    // Les autres titres affichent directement leur seuil d'XP, sans répéter la condition Fer.
    expect(
      within(
        cardOf(screen.getByRole("button", { name: "Apprenti" }))
      ).getByText("Plus que 180 XP")
    ).toBeInTheDocument()
    expect(screen.queryByText(/Débloque d'abord le titre Fer/)).toBeNull()
  })

  it("après une partie humaine à 0 XP : Fer est acquis et affiche sa propre condition", () => {
    renderTab({
      xp: 0,
      games: 1,
      grade: "NOVICE",
      gradeProgressPercent: 0,
      gradeRemainingXp: 300,
      nextGrade: "APPRENTI",
    })

    const fer = screen.getByRole("button", { name: "Novice" })
    expect(fer.querySelector(".lucide-check")).not.toBeNull()
    expect(
      screen.getByText("Débloqué par ta première partie contre un humain")
    ).toBeInTheDocument()
    // La condition Fer n'est plus « XP avant Apprenti » (celle de Bronze).
    expect(screen.queryByText(/XP avant Apprenti/)).toBeNull()
    // Fer ne porte aucune barre ni compteur d'XP : il se débloque par une partie humaine.
    expect(within(cardOf(fer)).queryByText(/XP/)).toBeNull()
    expect(within(cardOf(fer)).queryByText("0 %")).toBeNull()
    // Bronze, lui, affiche bien son seuil d'XP.
    const apprenti = screen.getByRole("button", { name: "Apprenti" })
    expect(
      within(cardOf(apprenti)).getByText("Plus que 300 XP")
    ).toBeInTheDocument()
    expect(apprenti.querySelector(".lucide-lock")).not.toBeNull()
  })
})
