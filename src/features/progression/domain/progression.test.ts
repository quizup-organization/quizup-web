import { describe, expect, it } from "vitest"
import {
  BADGE_TIERS,
  badgeProgressPercent,
  countBadges,
  earnedBadges,
  equippedTitle,
  filterBadgeFamilies,
  isBadgeStateFilter,
  TIER_COLORS,
  TITLE_CARD_ACCENT,
  titleLabel,
  type BadgeCollection,
  type BadgeFamilyGroup,
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
      titles: null,
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

const FAMILIES: BadgeFamilyGroup[] = [
  {
    family: "VOLUME",
    badges: [
      badge({ earned: true, progress: 10 }),
      badge({
        code: "DUELIST_ARGENT",
        label: "Bretteur",
        progress: 12,
        target: 50,
      }),
    ],
  },
  {
    family: "EXPLOIT",
    badges: [
      badge({
        code: "FIRST_WIN",
        label: "Première victoire",
        metric: "HUMAN_WINS",
        earned: true,
        progress: 1,
        target: 1,
      }),
    ],
  },
]

const labelOf = (item: BadgeItem) => item.label

describe("filterBadgeFamilies", () => {
  it("renvoie la collection telle quelle sans filtre", () => {
    expect(
      filterBadgeFamilies(FAMILIES, { query: "", state: "ALL", labelOf })
    ).toBe(FAMILIES)
  })

  it("ne garde que les paliers acquis", () => {
    const result = filterBadgeFamilies(FAMILIES, {
      query: "",
      state: "EARNED",
      labelOf,
    })

    expect(result.map((group) => group.family)).toEqual(["VOLUME", "EXPLOIT"])
    expect(result[0].badges.map((item) => item.code)).toEqual([
      "DUELIST_BRONZE",
    ])
  })

  it("ne garde que les paliers à débloquer, familles vides retirées", () => {
    const result = filterBadgeFamilies(FAMILIES, {
      query: "",
      state: "TO_UNLOCK",
      labelOf,
    })

    expect(result.map((group) => group.family)).toEqual(["VOLUME"])
    expect(result[0].badges.map((item) => item.code)).toEqual([
      "DUELIST_ARGENT",
    ])
  })

  it("cherche sur le libellé affiché, accents et casse ignorés", () => {
    const result = filterBadgeFamilies(FAMILIES, {
      query: "PREMIERE",
      state: "ALL",
      labelOf,
    })

    expect(result.map((group) => group.family)).toEqual(["EXPLOIT"])
    // Insensible à la casse comme aux accents : « bretteur » retrouve « Bretteur ».
    expect(
      filterBadgeFamilies(FAMILIES, {
        query: "bretteur",
        state: "ALL",
        labelOf,
      })[0].badges.map((item) => item.code)
    ).toEqual(["DUELIST_ARGENT"])
  })

  it("renvoie une collection vide quand rien ne correspond", () => {
    expect(
      filterBadgeFamilies(FAMILIES, {
        query: "inexistant",
        state: "ALL",
        labelOf,
      })
    ).toEqual([])
  })
})

describe("isBadgeStateFilter", () => {
  it("n'accepte que les états connus (valeur d'URL sinon)", () => {
    expect(isBadgeStateFilter("EARNED")).toBe(true)
    expect(isBadgeStateFilter("BOGUS")).toBe(false)
    expect(isBadgeStateFilter(null)).toBe(false)
  })
})

describe("palette des paliers", () => {
  it("donne une teinte franche et **distincte** à chaque palier", () => {
    const fills = BADGE_TIERS.map((tier) => TIER_COLORS[tier].fill)

    expect(new Set(fills).size).toBe(fills.length)
    // Argent et platine ne partagent plus la même famille de teinte.
    expect(TIER_COLORS.ARGENT.fill).not.toBe(TIER_COLORS.PLATINE.fill)
    expect(TIER_COLORS.PLATINE.fill).not.toBe(TIER_COLORS.DIAMANT.fill)
  })

  it("teinte les disques verrouillés en **opaque** (jamais de semi-transparent)", () => {
    for (const tier of BADGE_TIERS) {
      const { soft } = TIER_COLORS[tier]
      expect(soft, tier).toContain("var(--card)")
      expect(soft, tier).not.toContain("transparent")
    }
  })

  it("donne au mot du palier une teinte **lisible** (verrou du ratio AA)", () => {
    for (const tier of BADGE_TIERS) {
      const { fill, text } = TIER_COLORS[tier]
      // 70 % de teinte + 30 % de texte de premier plan : contraste AA garanti dans les deux
      // thèmes (calculs : Or 4,5:1 en clair, Platine 4,6:1, Argent 5,5:1, Diamant 5,4:1…).
      // Remonter le ratio rendrait le mot illisible sur fond clair — ne pas y revenir sans
      // revérifier les contrastes.
      expect(text, tier).toContain(fill)
      expect(text, tier).toContain("70%")
      expect(text, tier).toContain("var(--foreground)")
      expect(text, tier).not.toContain("transparent")
    }
    // Une teinte texte distincte par palier, comme les aplats.
    const texts = BADGE_TIERS.map((tier) => TIER_COLORS[tier].text)
    expect(new Set(texts).size).toBe(texts.length)
  })

  it("pose un fond plein sur une carte de titre débloquée", () => {
    expect(TITLE_CARD_ACCENT.unlocked.background).toContain("var(--surface)")
    expect(TITLE_CARD_ACCENT.unlocked.background).not.toContain("transparent")
  })

  it("porte la coche d'un grade atteint sur un disque vert à encre blanche", () => {
    const { background, color } = TITLE_CARD_ACCENT.acquiredCheck
    expect(background).toContain("var(--success-600)")
    // Teinte **assombrie** (80 % de vert + noir) : l'encre blanche doit tenir le contraste d'un
    // symbole (≥ 3:1) dans les deux thèmes — même logique de lisibilité que les paliers.
    expect(background).toContain("80%")
    expect(background).toContain("black")
    expect(color).toBe("#FFFFFF")
  })
})

describe("countBadges", () => {
  it("compte les badges d'une collection filtrée", () => {
    expect(countBadges(FAMILIES)).toBe(3)
    expect(
      countBadges(
        filterBadgeFamilies(FAMILIES, {
          query: "",
          state: "EARNED",
          labelOf,
        })
      )
    ).toBe(2)
  })
})
