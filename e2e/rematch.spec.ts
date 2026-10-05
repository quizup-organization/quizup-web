import { expect, test, type Page } from "@playwright/test";
import {
  assertNoConsoleErrors,
  attachErrorCapture,
  createPrivateLobby,
  playUntil,
  register,
  uniqueEmail,
} from "./helpers";

/** Attend que l'arène bascule vers la partie de revanche et renvoie son `gameId`. */
async function waitForNewDuel(page: Page, previousId: string): Promise<string> {
  await page.waitForURL(
    (url) =>
      /\/duel\/[^/]+$/.test(url.pathname) &&
      url.pathname !== `/duel/${previousId}`,
    { timeout: 60_000 },
  );
  return page.url().split("/").pop() ?? "";
}

/**
 * Revanche après un duel humain : les deux joueurs terminent la partie, l'un demande une
 * revanche, l'autre accepte — une nouvelle partie est créée et les deux arènes basculent.
 */
test("revanche : demande, acceptation puis nouvelle arène", async ({ browser }) => {
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

  const { joinUrl } = await createPrivateLobby(pageA);
  await pageB.goto(joinUrl, { waitUntil: "domcontentloaded" });

  await pageA.waitForURL(/\/duel\/[^/]+$/, { timeout: 45_000 });
  await pageB.waitForURL(/\/duel\/[^/]+$/, { timeout: 45_000 });

  const gameId = pageA.url().split("/").pop() ?? "";
  expect(gameId).toBeTruthy();
  expect(pageB.url().split("/").pop()).toBe(gameId);

  await Promise.all([
    playUntil(pageA, "FIN DU DUEL"),
    playUntil(pageB, "FIN DU DUEL"),
  ]);

  // Les deux écrans de résultat signalent leur présence → la revanche devient proposable.
  await expect(pageA.getByRole("button", { name: "Revanche" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(pageB.getByRole("button", { name: "Revanche" })).toBeVisible({
    timeout: 30_000,
  });

  await pageA.getByRole("button", { name: "Revanche" }).click();
  await expect(pageB.getByText("te propose une revanche")).toBeVisible({
    timeout: 30_000,
  });
  await pageB.getByRole("button", { name: "Accepter" }).click();

  const [newIdA, newIdB] = await Promise.all([
    waitForNewDuel(pageA, gameId),
    waitForNewDuel(pageB, gameId),
  ]);

  expect(newIdA).toBeTruthy();
  expect(newIdA).toBe(newIdB);
  expect(newIdA).not.toBe(gameId);

  assertNoConsoleErrors([...errorsA, ...errorsB]);

  await ctxA.close();
  await ctxB.close();
});
