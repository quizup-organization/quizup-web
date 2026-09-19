import { expect, test } from "@playwright/test";
import {
  BASE,
  assertNoConsoleErrors,
  attachErrorCapture,
  challengePlayer,
  currentUserId,
  playUntil,
  register,
  uniqueEmail,
} from "./helpers";

/**
 * Duel asynchrone (lot G/L) : A enregistre un run solo, B rejoue les mêmes questions contre
 * le fantôme. Valide la création du run, le replay, le résultat autoritaire et la présence.
 */
test("duel asynchrone : record puis replay", async ({ browser }) => {
  const errorsA: string[] = [];
  const errorsB: string[] = [];

  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  attachErrorCapture(pageB, errorsB);
  await register(pageB, uniqueEmail("async-b"));
  const idB = await currentUserId(pageB);
  expect(idB).not.toBe("");

  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();
  attachErrorCapture(pageA, errorsA);
  await register(pageA, uniqueEmail("async-a"));

  const challengeUrl = await challengePlayer(pageA, idB);

  // A enregistre son run.
  await pageA.getByRole("button", { name: /Jouer mon run/ }).click();
  await pageA.waitForURL(/\/duel\/[^/]+$/, { timeout: 30_000 });
  await playUntil(pageA, "Run enregistré");

  // B rejoue le run de A.
  await pageB.goto(challengeUrl, { waitUntil: "domcontentloaded" });
  await pageB.getByRole("button", { name: /Rejouer le run de/ }).click();
  await pageB.waitForURL(/\/duel\/[^/]+$/, { timeout: 30_000 });
  await playUntil(pageB, "FIN DE LA SESSION");
  await expect(pageB.getByText(/Victoire|Défaite|Égalité/).first()).toBeVisible();

  // Les deux runs enregistrés → le lobby propose le résultat autoritaire.
  await pageA.goto(challengeUrl, { waitUntil: "domcontentloaded" });
  const seeResult = pageA.getByRole("button", { name: /Voir le résultat/ });
  await expect(seeResult).toBeVisible({ timeout: 30_000 });
  await seeResult.click();
  await pageA.waitForURL(/\/duel\/[^/]+$/, { timeout: 30_000 });
  await expect(pageA.getByText(/Victoire|Défaite|Égalité/).first()).toBeVisible({
    timeout: 30_000,
  });

  // Présence : B est connecté → « En ligne » sur sa fiche vue par A.
  await pageA.goto(`${BASE}/players/${idB}`, { waitUntil: "domcontentloaded" });
  await expect(pageA.getByText("En ligne").first()).toBeVisible({ timeout: 15_000 });

  assertNoConsoleErrors([...errorsA, ...errorsB]);

  await ctxA.close();
  await ctxB.close();
});
