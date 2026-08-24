# Telemetry Data & Live-State Verification

All hardcoded mockup metrics have been replaced with live, API-backed data hooks. If telemetry data is unavailable (loading, unauthenticated, or error), the application handles the failure state gracefully without displaying fake data.

## 1. Status Bar Telemetry (API-Backed)
The `StatusBar` component in `AppLayout.tsx` fetches metrics from two endpoints:
- `/api/dashboard/metrics` (yielding the total number of obligations monitored).
- `/api/dashboard/risk` (yielding the specific counts of `Critical`, `Due Soon`, and `Protected` items).

```tsx
// AppLayout.tsx Status Bar Data Hook Binding
const metricsQuery = useGetDashboardMetrics({
  query: {
    queryKey: getGetDashboardMetricsQueryKey({ workspaceId: workspaceId ?? 0 }),
    enabled: !!workspaceId,
  },
});

const riskQuery = useGetDashboardRisk({
  query: {
    queryKey: getGetDashboardRiskQueryKey({ workspaceId: workspaceId ?? 0 }),
    enabled: !!workspaceId,
  },
});
```

### Loading & Error State Fallbacks
- **Loading State**: Displays a spinning loader icon in place of counts when queries are fetching.
- **Unauthenticated / Error State**: Displays `ERR` next to labels and changes the status LED to flashing red with the text `SYSTEM ERROR`. This ensures that under network partitions or unauthorized sessions, the user is never shown fake or stale data.

---

## 2. Risk Cockpit Widget (Dashboard)
The Dashboard Cockpit widget in `dashboard.tsx` now reflects the same authenticated backend metrics:
- **Active Obligations Monitored**: Bound to `metrics?.totalActive`.
- **Overdue Count**: Bound to `riskData?.overdue`.
- **Due soon (≤7 days)**: Bound to `riskData?.dueSoon`.
- **No Owner Assigned**: Bound to `riskData?.noOwner`.
- **No Reminders Configured**: Bound to `riskData?.noReminders`.

When data is loading, placeholder skeletons are shown. If queries fail, the cards display `0` (or `Unavailable`) instead of mock numbers.
