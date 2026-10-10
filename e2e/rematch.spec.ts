import { expect, test } from "@playwright/test";
import {
  assertNoConsoleErrors,
  attachErrorCapture,
  createPrivateRoom,
  playUntil,
  register,
  uniqueEmail,
} from "./helpers";

/**
 * Revanche après un duel humain : elle passe désormais par un **défi nominatif** (la partie
 * n'embarque plus la revanche). Le challenger envoie le défi depuis l'écran de résultat,
 * l'adversaire le reçoit en direct, l'accepte, et la salle temps réel est créée (RoomSaga).
 */
test("revanche : défi envoyé, acceptation par l'adversaire puis salle", async ({
  browser,
}) => {
  const errorsA: string[] = [];
  const errorsB: string[] = [];

  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  attachErrorCapture(pageB, errorsB);
  await register(pageB, uniqueEmail("rematch-b"));

  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();
  attachErrorCapture(pageA, errorsA);
  await register(pageA, uniqueEmail("rematch-a"));

  const { joinUrl } = await createPrivateRoom(pageA);
  await pageB.goto(joinUrl, { waitUntil: "domcontentloaded" });

  await pageA.waitForURL(/\/game\/[^/]+$/, { timeout: 45_000 });
  await pageB.waitForURL(/\/game\/[^/]+$/, { timeout: 45_000 });

  await Promise.all([
    playUntil(pageA, "FIN DU DUEL"),
    playUntil(pageB, "FIN DU DUEL"),
  ]);

  // Le challenger envoie un défi nominatif depuis l'écran de résultat.
  await pageA.getByRole("button", { name: "Revanche" }).click();
  await expect(pageA.getByText("Défi envoyé")).toBeVisible({ timeout: 30_000 });

  // L'adversaire reçoit l'invitation en direct et l'accepte : la salle est créée.
  await expect(pageB.getByText("Défi reçu")).toBeVisible({ timeout: 30_000 });
  await pageB.getByRole("button", { name: "Accepter" }).click();
  await pageB.waitForURL(/\/rooms\/[^/]+$/, { timeout: 45_000 });

  assertNoConsoleErrors([...errorsA, ...errorsB]);

  await ctxA.close();
  await ctxB.close();
});
