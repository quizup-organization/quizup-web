import { expect, test } from "@playwright/test"
import {
  assertNoConsoleErrors,
  attachErrorCapture,
  createPrivateRoom,
  playUntil,
  register,
  uniqueEmail,
} from "./helpers"

/**
 * Revanche après un duel humain : elle passe par un **défi nominatif à TTL court** (5 s). Le
 * challenger l'envoie depuis l'écran de résultat (bouton avec compte à rebours), l'adversaire
 * reçoit une popup en direct, l'accepte, et la salle temps réel est créée (RoomSaga).
 */
test("revanche : défi envoyé, acceptation par l'adversaire puis salle", async ({
  browser,
}) => {
  const errorsA: string[] = []
  const errorsB: string[] = []

  const ctxB = await browser.newContext()
  const pageB = await ctxB.newPage()
  attachErrorCapture(pageB, errorsB)
  await register(pageB, uniqueEmail("rematch-b"))

  const ctxA = await browser.newContext()
  const pageA = await ctxA.newPage()
  attachErrorCapture(pageA, errorsA)
  await register(pageA, uniqueEmail("rematch-a"))

  const { joinUrl } = await createPrivateRoom(pageA)
  await pageB.goto(joinUrl, { waitUntil: "domcontentloaded" })

  await pageA.waitForURL(/\/game\/[^/]+$/, { timeout: 45_000 })
  await pageB.waitForURL(/\/game\/[^/]+$/, { timeout: 45_000 })

  await Promise.all([
    playUntil(pageA, "FIN DU DUEL"),
    playUntil(pageB, "FIN DU DUEL"),
  ])

  // Le challenger envoie une revanche depuis l'écran de résultat : le bouton affiche le
  // compte à rebours de la fenêtre courte (5 s côté serveur).
  await pageA.getByRole("button", { name: "Revanche" }).click()
  await expect(
    pageA.getByRole("button", { name: /En attente/ })
  ).toBeVisible({ timeout: 10_000 })

  // L'adversaire reçoit une **popup** (et non un toast) et accepte dans la fenêtre de 5 s.
  await expect(pageB.getByText("Demande de revanche")).toBeVisible({
    timeout: 10_000,
  })
  await pageB.getByRole("button", { name: "Accepter" }).click()
  await pageB.waitForURL(/\/rooms\/[^/]+$/, { timeout: 45_000 })

  assertNoConsoleErrors([...errorsA, ...errorsB])

  await ctxA.close()
  await ctxB.close()
})
