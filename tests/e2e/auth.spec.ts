import { test, expect } from '@playwright/test';

test.describe('Authenticated Endpoints', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  });

  test('Dashboard loads correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
  });

  test('Obligations list loads correctly', async ({ page }) => {
    await page.goto('/obligations');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Obligations' })).toBeVisible({ timeout: 10000 });
  });

  test('Workspace Settings loads correctly', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Workspace', exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('CSV Import loads correctly', async ({ page }) => {
    await page.goto('/import');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'CSV Import' })).toBeVisible({ timeout: 10000 });
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
