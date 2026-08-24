# Open Issues & Release Recommendation

This document outlines the remaining open issues identified during the UI UX Release Gate evaluation, along with recommended resolutions.

## 1. Clerk Authentication CAPTCHA / Bot-Detection
- **Issue**: Automated E2E test runs are blocked from completing the user registration flow because Clerk's hosted sign-up interface triggers Cloudflare Turnstile bot protection.
- **Impact**: We cannot run E2E flows headlessly on local or CI containers.
- **Recommendation**: 
  1. Add a dedicated test email domain (e.g. `@test.com`) to the Clerk project exclusion list.
  2. Toggle off Clerk's automated bot protection in the development environment dashboard.

---

## 2. Missing Pre-Seeded Test Credentials
- **Issue**: No active credentials exist for a pre-registered test account (e.g. `admin@test.com`) that can bypass signup and perform a direct password authentication.
- **Impact**: Automated setups cannot test login flows directly without signing up.
- **Recommendation**: Create a static test user in Clerk (e.g., email `admin@test.com`, password `Admin143!`) and assign it to the workspace context so that the `auth.setup.ts` script can execute the login flow without relying on new registrations.
