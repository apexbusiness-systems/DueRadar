import { test as setup, expect } from '@playwright/test';
import path from 'path';

export const authFile = path.join('playwright', '.auth', 'user.json');

setup('authenticate via Clerk', async ({ page }) => {
  // Capture page logs and errors
  page.on('console', msg => console.log('[PAGE CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('[PAGE ERROR]', err.message));

  // Log all failed network requests/responses
  page.on('requestfailed', request => {
    console.log('[REQ FAILED]', request.method(), request.url(), request.failure()?.errorText);
  });
  page.on('response', async response => {
    if (response.status() >= 400) {
      console.log('[RESP ERROR]', response.status(), response.url());
      try {
        const bodyText = await response.text();
        console.log('[RESP BODY]', bodyText.substring(0, 1000));
      } catch {
        console.log('[RESP BODY UNREADABLE]');
      }
    }
  });

  await page.context().clearCookies();

  console.log('Navigating to sign-up...');
  await page.goto('/sign-up');
  await page.waitForLoadState('networkidle');

  // Fill in email
  const signUpEmailInput = page
    .locator('input[type="email"], input[name="email_address"]')
    .or(page.getByPlaceholder(/email address/i))
    .locator('visible=true')
    .first();
  await expect(signUpEmailInput).toBeVisible({ timeout: 15000 });
  await signUpEmailInput.fill('admin+clerk_test@example.com');

  // Fill in password
  const signUpPasswordInput = page
    .locator('input[type="password"], input[name="password"]')
    .or(page.getByPlaceholder(/password/i))
    .locator('visible=true')
    .first();
  await expect(signUpPasswordInput).toBeVisible({ timeout: 15000 });
  await signUpPasswordInput.fill('Ap3xSyst3ms!2026');

  // Click continue to sign-up
  const signUpContinueBtn = page
    .locator('button:visible')
    .filter({ hasText: /continue|sign up/i })
    .filter({ hasNotText: 'Google' })
    .first();
  await expect(signUpContinueBtn).toBeVisible({ timeout: 10000 });
  await signUpContinueBtn.click();

  // Wait a moment and check if we are on OTP verification or if there's an error
  await page.waitForTimeout(5000);

  // If we see OTP input, enter 424242
  const codeInput = page.locator('input[name="code"], input[autocomplete="one-time-code"]').first();
  if (await codeInput.isVisible()) {
    console.log('OTP code input found. Entering test code 424242...');
    await codeInput.fill('424242');
    await expect(page).toHaveURL(/\/(dashboard|app|workspace)/, { timeout: 30000 });
  } else {
    console.log('Not on OTP page. Proceeding to sign-in fallback...');
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    const signInEmailInput = page
      .locator('input[type="email"], input[name="identifier"]')
      .or(page.getByPlaceholder(/email address/i))
      .locator('visible=true')
      .first();
    await expect(signInEmailInput).toBeVisible({ timeout: 15000 });
    await signInEmailInput.fill('admin+clerk_test@example.com');

    const passwordInput = page
      .locator('input[type="password"], input[name="password"]')
      .or(page.getByPlaceholder(/password/i))
      .locator('visible=true')
      .first();

    if (await passwordInput.isVisible()) {
      console.log('Password input is visible on first page. Filling password...');
      await passwordInput.fill('Ap3xSyst3ms!2026');
      const submitBtn = page
        .locator('button:visible')
        .filter({ hasText: /continue|sign in/i })
        .filter({ hasNotText: 'Google' })
        .first();
      await expect(submitBtn).toBeVisible({ timeout: 10000 });
      await submitBtn.click();
    } else {
      console.log('Password input not visible yet. Clicking continue...');
      const signInContinueBtn = page
        .locator('button:visible')
        .filter({ hasText: /continue/i })
        .filter({ hasNotText: 'Google' })
        .first();
      await expect(signInContinueBtn).toBeVisible({ timeout: 10000 });
      await signInContinueBtn.click();

      await expect(passwordInput).toBeVisible({ timeout: 15000 });
      await passwordInput.fill('Ap3xSyst3ms!2026');

      const signInBtn = page
        .locator('button:visible')
        .filter({ hasText: /continue|sign in/i })
        .filter({ hasNotText: 'Google' })
        .first();
      await expect(signInBtn).toBeVisible({ timeout: 10000 });
      await signInBtn.click();
    }

    // Wait and check if we are redirected to verification or OTP page (client-trust or verification)
    await page.waitForTimeout(5000);
    const codeInput = page.locator('input[name="code"], input[autocomplete="one-time-code"]').first();
    if (await codeInput.isVisible()) {
      console.log('Device verification / OTP page detected. Entering test code 424242...');
      await codeInput.fill('424242');
    }

    await expect(page).toHaveURL(/\/(dashboard|app|workspace)/, { timeout: 30000 });
  }

  // Save authentication state
  await page.context().storageState({ path: authFile });
  console.log('[auth.setup] Authentication state saved to', authFile);
});
