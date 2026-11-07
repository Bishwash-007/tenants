import { expect, test } from "@playwright/test"

const TENANT = "testcafe"
const EMAIL = "owner@testcafe.test"
const PASSWORD = "password123"
const BRANCH = "3df0a0d8-c54e-4ba7-add7-f846c9cf3608"

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await page.getByLabel("Workspace").fill(TENANT)
  await page.getByLabel("Email").fill(EMAIL)
  await page.getByLabel("Password").fill(PASSWORD)
  await page.getByRole("button", { name: /sign in/i }).click()
  await page.waitForURL("**/overview**", { timeout: 20000 })
}

test.describe("Bliss dashboard walkthrough", () => {
  test("landing and onboarding", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Run your cafe")).toBeVisible()
    await page.screenshot({ path: "walkthrough/00-landing.png", fullPage: true })

    await page.goto("/onboarding")
    await expect(page.getByText("Onboard your cafe")).toBeVisible()
    await page.screenshot({ path: "walkthrough/01-onboarding.png", fullPage: true })
  })

  test("authed walkthrough", async ({ page }) => {
    await login(page)

    const screens: Array<[string, string]> = [
      ["/b/" + BRANCH + "/overview", "02-overview"],
      ["/b/" + BRANCH + "/orders", "03-orders"],
      ["/b/" + BRANCH + "/kds", "04-kds"],
      ["/b/" + BRANCH + "/tables", "05-tables"],
      ["/b/" + BRANCH + "/menu", "06-menu"],
      ["/b/" + BRANCH + "/inventory", "07-inventory"],
      ["/b/" + BRANCH + "/staff", "08-staff"],
      ["/crm/customers", "09-customers"],
      ["/crm/promotions", "10-promotions"],
      ["/branches", "11-branches"],
      ["/billing", "12-billing"],
      ["/settings/payments", "13-settings"],
    ]

    for (const [url, name] of screens) {
      await page.goto(url)
      await page.waitForLoadState("networkidle").catch(() => undefined)
      await page.screenshot({ path: `walkthrough/${name}.png`, fullPage: true })
    }

    // POS / new order
    await page.goto("/b/" + BRANCH + "/orders/new")
    await page.waitForLoadState("networkidle").catch(() => undefined)
    await page.screenshot({ path: "walkthrough/14-pos.png", fullPage: true })

    // Bill sheet (Magnesium table)
    await page.goto("/b/" + BRANCH + "/tables")
    await page.waitForLoadState("networkidle").catch(() => undefined)
    const card = page.locator("div.rounded-xl.border").filter({ hasText: "Magnesium" })
    await card.getByRole("button", { name: /bill & checkout/i }).click()
    await expect(page.getByText("Orders in this bill")).toBeVisible()
    await page.screenshot({ path: "walkthrough/15-bill-sheet.png", fullPage: true })
  })
})