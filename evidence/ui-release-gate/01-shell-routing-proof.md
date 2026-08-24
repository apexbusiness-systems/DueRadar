# Consolidated Shell Routing Proof

## Single Source of Truth: `AppLayout.tsx`

The layout configuration in `App.tsx` has been audited and refactored to eliminate the dual-competing layouts. `AppLayout.tsx` has been established as the single, authenticated application shell. All authenticated dashboard and obligations routes are nested exclusively within `AppLayout`.

### Route Structure in `App.tsx`

```tsx
// Nested authenticated shell routes in App.tsx
<Route path="/dashboard">
  <AppLayout>
    <DashboardPage />
  </AppLayout>
</Route>
<Route path="/obligations">
  <AppLayout>
    <ObligationsPage />
  </AppLayout>
</Route>
<Route path="/obligations/new">
  <AppLayout>
    <ObligationNewPage />
  </AppLayout>
</Route>
<Route path="/obligations/:id">
  <AppLayout>
    <ObligationDetailPage />
  </AppLayout>
</Route>
<Route path="/import">
  <AppLayout>
    <ImportPage />
  </AppLayout>
</Route>
<Route path="/delivery">
  <AppLayout>
    <DeliveryPage />
  </AppLayout>
</Route>
<Route path="/audit">
  <AppLayout>
    <AuditPage />
  </AppLayout>
</Route>
<Route path="/workspace">
  <AppLayout>
    <WorkspacePage />
  </AppLayout>
</Route>
```

---

## Decommissioning Legacy `Chrome.tsx` Layout

The legacy layout components defined in `Chrome.tsx` (such as `Sidebar`, `StatusBar`, `PageHead`, `BtnResolve`, and `BtnGlass`) have been fully decoupled.
1. All main shell layouts now import and use `@/components/layout/AppLayout`.
2. Landing Page (`landing.tsx`) and Info Details Page (`info-detail.tsx`) have been updated to import `RadarMark` directly from `@/components/layout/AppLayout.tsx`.
3. Legacy button stubs (`BtnAmber` and `BtnGhost`) have been relocated directly inside `landing.tsx`.
4. Typescript compilation checks (`tsc --noEmit`) pass successfully with zero references to layout components in `Chrome.tsx`.
