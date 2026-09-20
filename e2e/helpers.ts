import { expect, type Page } from "@playwright/test";

export const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5173";

/** Code fixe du profil `local` (cf. QUIZUP_AUTH_DEV_FIXED_CODE) pour les tests E2E. */
export const DEV_LOGIN_CODE = "000000";

let sequence = 0;

/** E-mail unique par exécution (les comptes sont créés au premier login). */
export function uniqueEmail(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}@quizup.dev`;
}

/** Capture les erreurs console / exceptions de page pour les assertions de propreté. */
export function attachErrorCapture(page: Page, errors: string[]): void {
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
}

/** Les 404 sont tolérés (projections en lecture différée) ; le reste doit être vide. */
export function assertNoConsoleErrors(errors: string[]): void {
  const real = errors.filter((e) => !/favicon|ResizeObserver|404/.test(e));
  expect(real, real.join("\n")).toHaveLength(0);
}

/** Connexion passwordless via l'UI (OTP) puis arrivée sur l'accueil authentifié. */
export async function register(page: Page, email: string): Promise<void> {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill("#email", email);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === "/login/code", { timeout: 60_000 });
  await page.fill("#code", DEV_LOGIN_CODE);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === "/", { timeout: 60_000 });
  await expect(page.getByText("Les plus joués en ce moment")).toBeVisible({
    timeout: 30_000,
  });
}

/** Identifiant utilisateur lu dans la session OIDC persistée. */
export function currentUserId(page: Page): Promise<string> {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith("oidc.user:"));
    if (!key) return "";
    const user = JSON.parse(localStorage.getItem(key) ?? "{}") as {
      profile?: { user_id?: string; sub?: string };
    };
    return user.profile?.user_id ?? user.profile?.sub ?? "";
  });
}

/**
 * Joue les tours jusqu'à l'écran de fin : attend une carte activée (le chrono ne démarre
 * qu'à la révélation serveur), clique, recommence.
 */
export async function playUntil(page: Page, endText: string, maxRounds = 10): Promise<void> {
  const isDone = () => page.getByText(endText).first().isVisible().catch(() => false);

  for (let i = 0; i <= maxRounds; i++) {
    if (await isDone()) return;

    const enabled = page.locator("button.qu-answer:not([disabled])").first();
    const done = page.getByText(endText).first();
    const outcome = await Promise.race([
      enabled.waitFor({ state: "visible", timeout: 30_000 }).then(() => "answer"),
      done.waitFor({ state: "visible", timeout: 30_000 }).then(() => "done"),
    ]).catch(() => "timeout");

    if (outcome === "done" || (await isDone())) return;
    if (outcome === "timeout") break;

    await enabled.click({ timeout: 15_000 });
    await page.waitForTimeout(1_200);
  }

  await expect(page.getByText(endText).first()).toBeVisible({ timeout: 60_000 });
}

/** Défie un joueur depuis sa fiche publique et renvoie l'URL du lobby créé. */
export async function challengePlayer(page: Page, opponentId: string): Promise<string> {
  await page.goto(`${BASE}/players/${opponentId}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Défier/ }).click();

  const dialog = page.locator('div[role="dialog"]');
  await expect(dialog.getByText("Choisir un thème")).toBeVisible({ timeout: 15_000 });
  await dialog.locator(".grid button").first().click();
  await page.waitForURL(/\/challenges\/[^/]+$/, { timeout: 30_000 });
  return page.url();
}
