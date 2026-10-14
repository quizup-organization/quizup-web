import { describe, expect, it } from "vitest"
import {
  badgeProgressPercent,
  earnedBadges,
  equippedTitle,
  titleLabel,
  type BadgeCollection,
  type BadgeItem,
  type PlayerTitles,
  type UnlockedTitle,
} from "./progression"

function badge(overrides: Partial<BadgeItem> = {}): BadgeItem {
  return {
    code: "DUELIST_BRONZE",
    label: "Duelliste",
    tier: "BRONZE",
    metric: "HUMAN_DUELS",
    target: 10,
    earned: false,
    progress: 0,
    ...overrides,
  }
}

function title(overrides: Partial<UnlockedTitle> = {}): UnlockedTitle {
  return {
    key: "topic-1:CONFIRME",
    topicId: "topic-1",
    grade: "CONFIRME",
    gradeProgressPercent: 40,
    gradeRemainingXp: 1_400,
    nextGrade: "EXPERT",
    topic: {
      topicId: "topic-1",
      names: { fr: "Histoire" },
      category: null,
      emoji: null,
      color: null,
      imageUrl: null,
    },
    ...overrides,
  }
}

describe("badgeProgressPercent", () => {
  it("rapporte la progression à la cible", () => {
    expect(badgeProgressPercent(badge({ progress: 7, target: 10 }))).toBe(70)
  })

  it("plafonne à 100 et ignore une cible nulle", () => {
    expect(badgeProgressPercent(badge({ progress: 12, target: 10 }))).toBe(100)
    expect(badgeProgressPercent(badge({ progress: 3, target: 0 }))).toBe(0)
  })
})

describe("equippedTitle", () => {
  it("résout le titre porté dans les titres débloqués", () => {
    const titles: PlayerTitles = {
      equippedKey: "topic-1:CONFIRME",
      titles: [title()],
    }

    expect(equippedTitle(titles)?.key).toBe("topic-1:CONFIRME")
  })

  it("rend null sans titre porté…", () => {
    expect(equippedTitle({ equippedKey: null, titles: [title()] })).toBeNull()
  })

  it("…ou si la clé portée n'est plus dans la liste", () => {
    expect(
      equippedTitle({ equippedKey: "topic-9:LEGENDE", titles: [title()] })
    ).toBeNull()
  })
})

describe("titleLabel", () => {
  it("compose grade et nom du sujet", () => {
    expect(titleLabel("Confirmé", "Histoire")).toBe("Confirmé · Histoire")
  })

  it("retombe sur le grade seul sans nom résolu", () => {
    expect(titleLabel("Confirmé", null)).toBe("Confirmé")
    expect(titleLabel("Confirmé", "   ")).toBe("Confirmé")
  })
})

describe("earnedBadges", () => {
  it("ne garde que les badges acquis, toutes familles confondues", () => {
    const collection: BadgeCollection = {
      earnedCount: 2,
      totalCount: 4,
      families: [
        {
          family: "VOLUME",
          badges: [badge({ earned: true }), badge({ code: "DUELIST_ARGENT" })],
        },
        {
          family: "EXPLOIT",
          badges: [badge({ code: "FIRST_WIN", tier: "BRONZE", earned: true })],
        },
      ],
    }

    expect(earnedBadges(collection).map((item) => item.code)).toEqual([
      "DUELIST_BRONZE",
      "FIRST_WIN",
    ])
  })
})
