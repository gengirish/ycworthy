---
name: ycworthy-playwright
description: Write and run Playwright E2E tests for YCWorthy. Use when creating E2E tests, debugging test failures, adding test coverage, or running the test suite. Covers test structure, selector patterns, API mocking, and responsive testing.
---

# YCWorthy Playwright E2E Testing

## Quick Start

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install chromium

# Run all tests
npx playwright test

# Run with visible browser
npx playwright test --headed

# Run a single file
npx playwright test e2e/analyze.spec.ts

# Interactive UI mode
npx playwright test --ui

# View HTML report
npx playwright show-report
```

## Project Structure

```
e2e/
├── landing.spec.ts         # Hero, input, provider toggle
├── analyze.spec.ts         # URL submission, loading, results
├── history.spec.ts         # localStorage recent analyses
├── share.spec.ts           # Permalink generation and auto-analyze
├── responsive.spec.ts      # Mobile + tablet viewport tests
└── error-states.spec.ts    # Invalid URL, API errors, empty states
playwright.config.ts        # Playwright configuration
```

## Configuration

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
```

## Writing Tests

### Test Template

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should do expected behavior", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "YCWorthy" })).toBeVisible();
  });
});
```

### Selector Strategy (priority order)

1. `getByRole("button", { name: "Rate It" })` — accessible role
2. `getByText("YCWorthy")` — visible text
3. `getByPlaceholder("startup-url.com")` — placeholders
4. `locator("[data-testid='grade-ring']")` — last resort

### Landing Page Test

```typescript
test("should render hero and input", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "YCWorthy" })).toBeVisible();
  await expect(page.getByPlaceholder("startup-url.com")).toBeVisible();
  await expect(page.getByText("Claude")).toBeVisible();
  await expect(page.getByText("Gemini")).toBeVisible();
});
```

### Analysis Flow Test (Mocked API)

```typescript
test("should show results after analysis", async ({ page }) => {
  // Mock the API response
  await page.route("/api/analyze", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          company: "TestCo",
          tagline: "Testing startup evaluations",
          overall_grade: "B",
          overall_score: 75,
          verdict: "Solid but needs work.",
          yc_likelihood: "Possible",
          criteria: {
            problem: { grade: "A", score: 85, summary: "Clear problem." },
            market: { grade: "B", score: 72, summary: "Good market." },
            solution: { grade: "B", score: 70, summary: "Decent solution." },
            traction: { grade: "C", score: 60, summary: "Early stage." },
            founder: { grade: "A", score: 82, summary: "Strong fit." },
            timing: { grade: "B", score: 74, summary: "Good timing." },
          },
          red_flags: ["No revenue yet"],
          green_flags: ["Strong team"],
          yc_interview_question: "What is your unfair advantage?",
        },
        provider: "claude",
        duration_ms: 5000,
      }),
    })
  );

  await page.goto("/");
  await page.getByPlaceholder("startup-url.com").fill("example.com");
  await page.getByRole("button", { name: "Rate It" }).click();

  await expect(page.getByText("TestCo")).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Possible chance")).toBeVisible();
  await expect(page.getByText("Problem Clarity")).toBeVisible();
});
```

### Provider Toggle Test

```typescript
test("should switch provider", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Gemini").click();
  const geminiButton = page.getByText("Gemini").first();
  await expect(geminiButton).toHaveCSS("color", "rgb(74, 158, 255)");
});
```

### Responsive Test

```typescript
test("should render on mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "YCWorthy" })).toBeVisible();
  await expect(page.getByPlaceholder("startup-url.com")).toBeVisible();
});
```

### Share Link Test

```typescript
test("should auto-analyze from URL params", async ({ page }) => {
  await page.route("/api/analyze", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: mockResult, provider: "claude", duration_ms: 3000 }),
    })
  );

  await page.goto("/?url=https://example.com&provider=claude");
  await expect(page.getByText("Crawling website")).toBeVisible({ timeout: 5000 });
});
```

## npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## CI Integration

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium
- name: Run E2E tests
  run: npx playwright test
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Timeout on analysis | Mock `/api/analyze` — real AI calls are too slow for tests |
| Element not found | Check if component is behind `!result` conditional; use correct state |
| Flaky loading test | Increase timeout: `toBeVisible({ timeout: 10000 })` |
| History tests fail | Clear localStorage in `beforeEach`: `page.evaluate(() => localStorage.clear())` |
| CI failures | Ensure `webServer` command starts correctly; use `reuseExistingServer: false` |

## Key Rules

1. **Always mock `/api/analyze`** — never make real AI API calls in tests
2. **Use `getByRole` and `getByText`** over CSS selectors
3. **Test mobile viewport** at 375px width
4. **Clear localStorage** before history-related tests
5. **Add `data-testid`** only as last resort for complex components
6. **One test = one behavior** — keep tests focused and independent
