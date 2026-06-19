/**
 * Typed, validated access to Vite build-time environment variables.
 *
 * Import this module instead of accessing import.meta.env directly so that
 * missing required variables are caught at startup rather than silently
 * becoming undefined at runtime.
 */

function requireEnv(key: string): string {
  const value = import.meta.env[key] as string | undefined;
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Check artifacts/frontend/.env.example for required variables.`,
    );
  }
  return value;
}

// ── Production guard ─────────────────────────────────────────────────────────
// Fail the build/startup if test auth bypass is active in a production build.
if (
  import.meta.env.MODE === "production" &&
  import.meta.env.VITE_TEST_BYPASS_AUTH === "true"
) {
  throw new Error(
    "FATAL: VITE_TEST_BYPASS_AUTH=true must never be set in a production build. " +
      "Remove this variable from your production environment and rebuild.",
  );
}

// ── Parsed env ───────────────────────────────────────────────────────────────

export const env = {
  CLERK_PUBLISHABLE_KEY: requireEnv("VITE_CLERK_PUBLISHABLE_KEY"),
  CLERK_PROXY_URL: import.meta.env.VITE_CLERK_PROXY_URL as string | undefined,
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  /**
   * Only truthy in explicit E2E test runs where VITE_TEST_BYPASS_AUTH=true
   * is injected by the test harness AND NODE_ENV is NOT production.
   * Production builds will have thrown above before this is reached.
   */
  TEST_BYPASS_AUTH: import.meta.env.VITE_TEST_BYPASS_AUTH === "true",
  MODE: import.meta.env.MODE as string,
};
