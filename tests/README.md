# Tests

- `tests/unit` — content helpers (no browser).
- `tests/e2e/parity.spec.ts` — proof 1: every page's text, title and description match the baseline captured from 506e2ae exactly, and full-page screenshots at 1440px and 390px match within 2% (pixel noise).

Run against any copy of the site:

```bash
BASE_URL=https://<preview-url> npx playwright test
```

`PW_CHROME=/path/to/chrome` uses a different Chromium binary when Playwright's own isn't installed.
