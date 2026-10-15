import { describe, expect, it } from "vitest"

/**
 * Garde-fou statique : un bouton `destructive` doit porter une **intention destructive**.
 *
 * Incident à l'origine du garde-fou : une passe d'harmonisation « toutes les annulations en
 * rouge » avait coloré des actions **primaires** — le bouton « Lancer » d'une popup de duel et
 * le « Rejoindre » d'une bannière de reprise — ce qui inverse le sens de l'action à l'écran.
 *
 * Règle : le libellé (`t("…")`, clé en anglais technique) ou le handler (`onClick`) du bouton
 * doit évoquer une action destructive (annuler, abandonner, effacer, réinitialiser, supprimer,
 * retirer, vider, se désabonner, se déconnecter, refuser).
 */
const SOURCES = import.meta.glob("../**/*.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>

const DESTRUCTIVE_INTENT = new RegExp(
  [
    "cancel",
    "annul",
    "reset",
    "reinitial",
    "remove",
    "retir",
    "delete",
    "supprim",
    "clear",
    "effac",
    "purge",
    "vider",
    "unfollow",
    "desabonn",
    "logout",
    "deconnect",
    "abandon",
    "forfeit",
    "quit",
    "decline",
    "refus",
    "leave",
  ].join("|"),
  "i"
)

/** Fenêtres de code des boutons destructifs : de leur ouverture à leur libellé. */
function destructiveWindows(source: string): string[] {
  const windows: string[] = []
  const lines = source.split("\n")

  lines.forEach((line, index) => {
    const isDestructive =
      /variant="destructive"/.test(line) || /variant: "destructive"/.test(line)
    if (!isDestructive) return

    let start = index
    for (let position = index; position >= 0; position -= 1) {
      const candidate = lines[position] ?? ""
      if (/<Button|buttonVariants\(/.test(candidate)) {
        start = position
        break
      }
    }
    windows.push(lines.slice(start, index + 25).join("\n"))
  })

  return windows
}

describe("garde-fou : boutons destructifs", () => {
  it("chaque bouton `destructive` porte une intention destructive", () => {
    const offenders: string[] = []

    for (const [file, source] of Object.entries(SOURCES)) {
      if (!source.includes('"destructive"')) continue
      for (const window of destructiveWindows(source)) {
        const label = window.match(/t\("([^"]+)"\)/g)?.join(" ") ?? ""
        const handler = window.match(/onClick=\{([^}]+)\}/)?.[1] ?? ""
        if (!DESTRUCTIVE_INTENT.test(`${label} ${handler}`)) {
          offenders.push(
            `${file}\n      ${window.trim().split("\n").join(" ").slice(0, 120)}`
          )
        }
      }
    }

    expect(
      offenders,
      `Bouton(s) « destructive » sans intention destructive (utiliser l'action primaire) :\n  - ${offenders.join(
        "\n  - "
      )}`
    ).toEqual([])
  })
})
