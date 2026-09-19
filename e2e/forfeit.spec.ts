import { expect, test } from "@playwright/test";
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  challengePlayer,
  currentUserId,
  register,
  uniqueEmail,
} from "./helpers";

/**
 * Forfait (lot F) : dans un duel synchrone humain, la fermeture de la session temps réel d'un
 * joueur (connexion STOMP coupée au-delà du délai de grâce de présence) clôt la partie à son
 * détriment — l'adversaire gagne.
 */
test("forfait : un joueur déconnecté perd son duel synchrone", async ({ browser }) => {
  const errorsA: string[] = [];
  const errorsB: string[] = [];

  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  attachErrorCapture(pageB, errorsB);
  await register(pageB, uniqueEmail("forfeit-b"));
  const idB = await currentUserId(pageB);

  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();
  attachErrorCapture(pageA, errorsA);
  await register(pageA, uniqueEmail("forfeit-a"));

  const challengeUrl = await challengePlayer(pageA, idB);

  // B accepte → partie synchronisée créée, B rejoint l'arène.
  await pageB.goto(challengeUrl, { waitUntil: "domcontentloaded" });
  await pageB.getByRole("button", { name: /Accepter en direct/ }).click();
  await pageB.waitForURL(/\/duel\/[^/]+$/, { timeout: 45_000 });
  const gameId = pageB.url().split("/").pop();
  expect(gameId).toBeTruthy();

  // A rejoint la même arène.
  await pageA.goto(`${BASE}/duel/${gameId}`, { waitUntil: "domcontentloaded" });
  await pageA
    .locator("button.qu-answer")
    .first()
    .waitFor({ state: "visible", timeout: 45_000 });

  // B se déconnecte : sa session STOMP se ferme → forfait après le délai de grâce de présence.
  await ctxB.close();

  await pageA.getByText("FIN DU DUEL").first().waitFor({ timeout: 120_000 });
  await expect(pageA.getByText("Victoire").first()).toBeVisible();

  assertNoConsoleErrors(errorsA);

  await ctxA.close();
});
