import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (would need auth in real scenario)
    await page.goto('/dashboard');
  });

  test('should display dashboard stats', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('[data-testid="total-premium"]')).toBeVisible();
  });

  test('should navigate to policies page', async ({ page }) => {
    await page.click('text=Policies');
    await expect(page).toHaveURL(/.*policies/);
  });

  test('should navigate to clients page', async ({ page }) => {
    await page.click('text=Clients');
    await expect(page).toHaveURL(/.*clients/);
  });
});
