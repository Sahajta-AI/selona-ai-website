import { expect, type Page } from "@playwright/test";

// Every editor API route; each must answer 401 without a sign-in.
export const EDITOR_API_ROUTES: [string, string][] = [];

export async function signIn(page: Page, which: 1 | 2 = 1) {
  const email = which === 1 ? process.env.E2E_EMAIL : process.env.E2E_EMAIL_2;
  const key = which === 1 ? process.env.E2E_KEY : process.env.E2E_KEY_2;
  if (!email || !key) throw new Error("Set E2E_EMAIL/E2E_KEY (see .env.e2e.local)");
  await page.goto("/editor/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Access key").fill(key);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/sign-in/);
}
