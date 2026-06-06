import { test, expect } from '@playwright/test';

test.describe('Authenticated Endpoints', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to dashboard, bypassing auth via VITE_TEST_BYPASS_AUTH
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  });

  test('Dashboard (Command Center) loads correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Command Center' })).toBeVisible({ timeout: 10000 });
  });

  test('Due Register (Obligations) loads correctly', async ({ page }) => {
    await page.goto('/obligations');
    await page.waitForLoadState('networkidle');
    // /obligations renders RiskRegisterPage with heading "Due Register"
    await expect(page.locator('text=Due Register').first()).toBeVisible({ timeout: 10000 });
  });

  test('Workspace Settings loads correctly', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Workspace', exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('Due Intake (Import) loads correctly', async ({ page }) => {
    await page.goto('/import');
    await page.waitForLoadState('networkidle');
    // /import renders RiskIntakePage with heading "Due Intake"
    await expect(page.locator('text=Due Intake').first()).toBeVisible({ timeout: 10000 });
  });

  test('Delivery History loads correctly', async ({ page }) => {
    await page.goto('/delivery');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Delivery History' })).toBeVisible({ timeout: 10000 });
  });

  test('Audit Log loads correctly', async ({ page }) => {
    await page.goto('/audit');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible({ timeout: 10000 });
  });
});
