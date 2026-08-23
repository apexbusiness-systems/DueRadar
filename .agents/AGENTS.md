# DueRadar — Standing Non-Negotiables & Rules

1. **No new dependencies, vendors, or recurring cost** without a separate, explicit approval request called out at the point it's needed. Flag it; do not install it.
2. **Surgical diffs only.** Contain blast radius. No unrelated refactors, renames, or "while I'm in here" cleanups outside the item's stated file list.
3. **The dark cinematic design system (`--rr-*` tokens in `index.css`) is canonical.** Do not resolve the fragmentation by stripping it down to the generic light theme — extend it across the live app.
4. **Never ship a mock-data or hardcoded-content surface as if it were live** except inside tests.
5. **Every visible interactive element must be exactly one of:** working and verified · locally handled and verified · disabled with honest copy · explicitly unavailable with a named reason. No dead no-op buttons.
6. **Must not introduce new typecheck errors, and must pass CI, before any item is marked done.** Run `pnpm run typecheck` (not `npm` — root `preinstall` enforces pnpm).
7. **Do not touch the API server (`artifacts/api-server`), auth (Clerk), FlowC integration, or DB schema.** UI/UX-scoped only unless explicitly instructed.
8. **Report actual verification evidence** (typecheck output, build status, real screenshots) — never claim visual QA that was not performed.
