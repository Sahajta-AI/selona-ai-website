import { test, expect } from "@playwright/test";

// Google sign-in can't finish without the real Google client (BLOCKED until the
// morning); this checks everything up to Google and the refusals on the way back.
test("Google sign-in sends people to Google with a one-time state, or stays off until set up", async ({ page, request }) => {
  await page.goto("/editor/sign-in");
  const button = page.getByRole("link", { name: "Sign in with Google" });
  const res = await request.get("/api/editor/google", { maxRedirects: 0 });
  expect(res.status()).toBe(303);
  const to = new URL(res.headers()["location"], page.url());
  if (await button.count()) {
    expect(to.origin).toBe("https://accounts.google.com");
    expect(to.searchParams.get("scope")).toBe("openid email");
    expect(to.searchParams.get("redirect_uri")).toMatch(/\/api\/editor\/google\/callback$/);
    expect(to.searchParams.get("state")?.length).toBeGreaterThan(20);
    expect(res.headers()["set-cookie"]).toContain("selona_oauth_state=");
  } else {
    expect(to.pathname).toBe("/editor/sign-in");
  }
});

test("a Google reply with a wrong state is refused", async ({ request }) => {
  const res = await request.get("/api/editor/google/callback?code=abc&state=forged", { maxRedirects: 0 });
  expect(res.status()).toBe(303);
  expect(res.headers()["location"]).toContain("/editor/sign-in?e=google");
  expect(res.headers()["set-cookie"] ?? "").not.toContain("selona_editor=");
});
