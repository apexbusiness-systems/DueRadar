import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate via Clerk', async ({ page }) => {
  // Clear any cookies/storage
  await page.context().clearCookies();
  
  // Go to sign-in page
  await page.goto('/sign-in');
  await page.waitForLoadState('networkidle');

  // Locate and fill email
  const emailInput = page.getByPlaceholder(/email address/i).or(page.locator('input[type="email"], input[name="identifier"]')).first();
  await expect(emailInput).toBeVisible({ timeout: 15000 });
  await emailInput.fill('test+clerk_test@example.com');

  // Locate and fill password
  const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"], input[name="password"]')).first();
  await expect(passwordInput).toBeVisible({ timeout: 15000 });
  await passwordInput.fill('testpassword123');

  // Submit sign-in
  const continueBtn = page.getByRole('button', { name: /^Continue\s*▸?$/i }).first();
  await continueBtn.click();

  // Try to wait for redirect to dashboard
  try {
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 8000 });
  } catch (err) {
    // If sign-in did not redirect within 8 seconds, fall back to sign-up
    console.log('Sign-in did not redirect to dashboard. Proceeding to signup...');
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');

    const signUpEmailInput = page.getByPlaceholder(/email address/i).or(page.locator('input[type="email"], input[name="email_address"]')).first();
    await expect(signUpEmailInput).toBeVisible({ timeout: 15000 });
    await signUpEmailInput.fill('test+clerk_test@example.com');

    const signUpPasswordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"], input[name="password"]')).first();
    await expect(signUpPasswordInput).toBeVisible({ timeout: 15000 });
    await signUpPasswordInput.fill('testpassword123');

    const signUpContinueBtn = page.getByRole('button', { name: /^Continue\s*▸?$/i }).first();
    await signUpContinueBtn.click();

    // Check for Turnstile captcha iframe
    const turnstile = page.locator('iframe[src*="challenges.cloudflare.com"]');
    try {
      await expect(turnstile).toBeVisible({ timeout: 5000 });
      console.log('Turnstile challenge detected. Attempting to click Turnstile iframe...');
      await turnstile.click();
      await page.waitForTimeout(5000);
    } catch (e) {
      console.log('No Turnstile challenge detected.');
    }

    // Signup OTP code input
    const codeInput = page.locator('input[name="code"], input[autocomplete="one-time-code"]').first();
    await expect(codeInput).toBeVisible({ timeout: 15000 });
    await codeInput.fill('424242');

    // Wait for redirect to dashboard after sign-up
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 25000 });
  }

  // Save authentication state
  await page.context().storageState({ path: authFile });
  console.log('Authentication state saved successfully.');
});
