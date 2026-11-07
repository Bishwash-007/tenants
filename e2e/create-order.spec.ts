import { test, expect } from "@playwright/test"

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
  await page.waitForTimeout(1200)
}

test("create an order from tables", async ({ page }) => {
  await login(page)

  // Start on the Tables screen
  await page.goto("/b/" + BRANCH + "/tables")
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1200)

  // Click "Add order" on a table card
  const addOrderLink = page.getByRole("link", { name: /add order/i }).first()
  await expect(addOrderLink).toBeVisible()
  await addOrderLink.click()
  await page.waitForTimeout(1200)

  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1000)

  // Browse and add 3-4 items from the menu
  for (let i = 0; i < 4; i++) {
    const addBtn = page.getByRole("button", { name: /^add$/i }).first()
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(1200)
    }
  }

  // Place the order
  const placeBtn = page.getByRole("button", { name: /place order/i })
  if (await placeBtn.isVisible().catch(() => false)) {
    await placeBtn.click()
    await page.waitForTimeout(2000)
  }

  await page.waitForTimeout(1200)
  await page.screenshot({ path: "walkthrough/create-order-from-tables.png", fullPage: true })
})
