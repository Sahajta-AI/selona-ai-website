import { test, expect, type Page } from "@playwright/test";
import { EDITOR_API_ROUTES, signIn } from "./editor-helpers";

// Proof 2: an allowed email signs in, anyone else is refused, and every editor
// page and API route refuses without a sign-in (checked on the server).
test.describe("sign-in", () => {
  // A fresh network address per test run, so the attempt limit is tested in isolation.
  test.use({ extraHTTPHeaders: { "x-forwarded-for": `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.1` } });

  test("an allowed email signs in with its access key", async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL(/\/editor/);
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  test("an email that isn't on the list sees 'You don't have access'", async ({ page }) => {
    await tryKey(page, "someone.else@example.com", "not-a-real-key");
    await expect(page.getByRole("heading", { name: "You don't have access" })).toBeVisible();
  });

  test("a wrong key is refused", async ({ page }) => {
    await tryKey(page, process.env.E2E_EMAIL!, "wrong-key");
    await expect(page.locator("main [role=alert]")).toContainText("don't match");
    expect((await page.context().cookies()).some((c) => c.name === "selona_editor")).toBe(false);
  });

  test("attempts are limited: the 6th try in 15 minutes is blocked", async ({ page }) => {
    const email = `limit-${Date.now()}@example.com`;
    for (let i = 0; i < 5; i++) await tryKey(page, email, "wrong");
    await tryKey(page, email, "wrong");
    await expect(page.locator("main [role=alert]")).toContainText("Too many tries");
  });

  test("wrong keys from one network address don't lock the owner out elsewhere", async ({ request }) => {
    // Vercel replaces this header with the real address, so two addresses can only be simulated locally
    test.skip(!/localhost|127\.0\.0\.1/.test(test.info().project.use.baseURL ?? ""), "needs two network addresses");
    const at = (ip: string, key: string) =>
      request.post("/api/editor/sign-in", { form: { email: process.env.E2E_EMAIL!, key }, headers: { "x-forwarded-for": ip }, maxRedirects: 0 });
    const stranger = `10.${Math.floor(Math.random() * 250)}.1.1`;
    for (let i = 0; i < 6; i++) await at(stranger, "wrong");
    expect((await at(stranger, process.env.E2E_KEY!)).headers().location).toContain("e=locked");
    const owner = await at(`10.${Math.floor(Math.random() * 250)}.2.2`, process.env.E2E_KEY!);
    expect(owner.headers().location).not.toContain("sign-in");
  });

  test("the editor redirects to sign-in when not signed in", async ({ page }) => {
    await page.goto("/editor");
    await expect(page).toHaveURL(/\/editor\/sign-in/);
  });

  test("after signing in, you come back to the page and review you opened", async ({ page }) => {
    await page.goto("/editor?review=1&path=%2Fpricing");
    await expect(page).toHaveURL(/\/editor\/sign-in\?next=/);
    await page.getByLabel("Email").fill(process.env.E2E_EMAIL!);
    await page.getByLabel("Access key").fill(process.env.E2E_KEY!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/editor\?review=1&path=%2Fpricing/);
    // already signed in: the sign-in page sends you on too
    await page.goto("/editor/sign-in?next=%2Feditor%3Fpath%3D%252Fcontact");
    await expect(page).toHaveURL(/\/editor\?path=%2Fcontact/);
  });

  test("every editor API route refuses without sign-in", async ({ request }) => {
    for (const [method, path] of EDITOR_API_ROUTES) {
      const res = await request.fetch(path, { method, data: method === "GET" ? undefined : {}, maxRedirects: 0 });
      expect(res.status(), `${method} ${path}`).toBe(401);
    }
  });

  test("a forged session cookie is refused", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "selona_editor", value: "eyJlbWFpbCI6InJhaHVsQHNlbG9uYS5haSIsImV4cCI6OTk5OTk5OTk5OTk5OX0.forged", url: baseURL! }]);
    await page.goto("/editor");
    await expect(page).toHaveURL(/\/editor\/sign-in/);
  });

  test("editor pages are marked noindex", async ({ request }) => {
    const res = await request.get("/editor/sign-in");
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
  });
});

async function tryKey(page: Page, email: string, key: string) {
  await page.goto("/editor/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Access key").fill(key);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForLoadState("networkidle");
}
