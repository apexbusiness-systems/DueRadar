import { useUser } from "@clerk/react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetDashboardMetrics,
  getGetDashboardMetricsQueryKey,
  useGetUpcomingObligations,
  getGetUpcomingObligationsQueryKey,
  useGetDashboardRisk,
  useGetWorkspace,
  getGetWorkspaceQueryKey,
} from "@workspace/api-client-react";
import { DueDateBadge } from "@/components/ObligationBadge";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  Plus,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  Shield,
  UserX,
  BellOff,
  Flame,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";

// ── Metric Card ──────────────────────────────────────────────────────────────

type MetricCardProps = {
  title: string;
  value?: number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  isLoading?: boolean;
  href?: string;
  urgency?: "critical" | "warning" | "normal";
};

function MetricCard({ title, value, icon: Icon, accentColor, bgColor, borderColor, isLoading, href, urgency }: MetricCardProps) {
  const content = (
    <div
      className={cn(
        "group relative bg-obsidian-surface rounded-2xl border border-white/[0.07] overflow-hidden transition-all duration-200 hover:border-white/[0.15] hover:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 cursor-pointer",
        borderColor,
      )}
      data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className={cn("h-1 w-full", accentColor)} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-[#8898A8]">{title}</p>
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.08]", bgColor)}>
            <Icon className={cn("w-4 h-4", accentColor.replace("bg-", "text-"))} />
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-9 w-16 mt-1 bg-white/[0.05]" />
        ) : (
          <div className="flex items-end justify-between">
            <p className={cn(
              "text-4xl font-black tracking-tight leading-none font-mono",
              urgency === "critical" && (value ?? 0) > 0 ? "text-[#FF4040]" :
              urgency === "warning" && (value ?? 0) > 0 ? "text-[#F5A623]" :
              "text-[#F0F4F8]",
            )}>
              {value ?? 0}
            </p>
            {href && (
              <ArrowUpRight className="w-4 h-4 text-[#4A5568] group-hover:text-[#F5A623] transition-colors mb-1" />
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

// ── Risk Score Badge ─────────────────────────────────────────────────────────

function getRiskLevel(score: number): { label: string; color: string; bg: string; border: string } {
  if (score <= 15) return { label: "Low Risk", color: "text-[#00E676]", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
  if (score <= 40) return { label: "Moderate", color: "text-[#F5A623]", bg: "bg-amber-500/10", border: "border-amber-500/30" };
  if (score <= 65) return { label: "Elevated", color: "text-[#FF8C00]", bg: "bg-orange-500/10", border: "border-orange-500/30" };
  return { label: "High Risk", color: "text-[#FF4040]", bg: "bg-red-500/15", border: "border-red-500/30" };
}

// ── Risk Cockpit ─────────────────────────────────────────────────────────────

function RiskCockpit({ workspaceId }: { workspaceId: number }) {
  const riskQuery = useGetDashboardRisk(
    { workspaceId },
    {},
  );

  if (riskQuery.isLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl bg-white/[0.05]" />;
  }

  if (riskQuery.isError || !riskQuery.data) return null;

  const risk = riskQuery.data;
  const level = getRiskLevel(risk.riskScore);

  const allCritical = [
    ...risk.overdueItems.map((o) => ({ ...o, tag: "overdue" as const })),
    ...risk.criticalItems.map((o) => ({ ...o, tag: "critical" as const })),
  ].slice(0, 6);

  // If everything is fine, show a clean all-clear
  const allClear =
    risk.overdueCount === 0 &&
    risk.criticalCount === 0 &&
    risk.missingOwnerCount === 0 &&
    risk.missingBackupCount === 0 &&
    risk.noReminderCount === 0;

  return (
    <div className="bg-obsidian-surface rounded-2xl border border-white/[0.07] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)] mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/[0.04] border border-white/[0.08] rounded-xl flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#F5A623]" />
          </div>
          <div>
            <h2 className="font-bold text-[#F0F4F8]">Risk Cockpit</h2>
            <p className="text-xs text-[#8898A8]">{risk.totalActive} active obligation{risk.totalActive !== 1 ? "s" : ""} monitored</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border", level.bg, level.color, level.border)}>
          <span className="text-lg font-black font-mono">{risk.riskScore}</span>
          <span className="text-xs font-semibold">{level.label}</span>
        </div>
      </div>

      {allClear ? (
        <div className="px-6 py-8 text-center">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-[#00E676]" />
          </div>
          <p className="font-bold text-[#F0F4F8] mb-1">All clear - no active risks</p>
          <p className="text-sm text-[#8898A8]">Every active obligation has an owner, backup, and reminder rules.</p>
        </div>
      ) : (
        <div className="p-6">
          {/* Risk counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              {
                label: "Overdue",
                count: risk.overdueCount,
                icon: Flame,
                color: risk.overdueCount > 0 ? "text-[#FF4040]" : "text-[#4A5568]",
                bg: risk.overdueCount > 0 ? "bg-red-500/10 border-red-500/30" : "bg-white/[0.02] border-white/[0.06]",
              },
              {
                label: "Due ≤7 days",
                count: risk.criticalCount,
                icon: AlertTriangle,
                color: risk.criticalCount > 0 ? "text-[#FF8C00]" : "text-[#4A5568]",
                bg: risk.criticalCount > 0 ? "bg-orange-500/10 border-orange-500/30" : "bg-white/[0.02] border-white/[0.06]",
              },
              {
                label: "No Owner",
                count: risk.missingOwnerCount,
                icon: UserX,
                color: risk.missingOwnerCount > 0 ? "text-[#F5A623]" : "text-[#4A5568]",
                bg: risk.missingOwnerCount > 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-white/[0.02] border-white/[0.06]",
              },
              {
                label: "No Reminders",
                count: risk.noReminderCount,
                icon: BellOff,
                color: risk.noReminderCount > 0 ? "text-purple-400" : "text-[#4A5568]",
                bg: risk.noReminderCount > 0 ? "bg-purple-500/10 border-purple-500/30" : "bg-white/[0.02] border-white/[0.06]",
              },
            ].map(({ label, count, icon: Icon, color, bg }) => (
              <div key={label} className={cn("rounded-xl border p-3 flex items-center gap-3", bg)}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/[0.04] border border-white/[0.08]">
                  <Icon className={cn("w-4 h-4", color)} />
                </div>
                <div>
                  <p className={cn("text-2xl font-black leading-none font-mono", color)}>{count}</p>
                  <p className="text-xs text-[#8898A8] mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Missing backup warning */}
          {risk.missingBackupCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-[#CBD5E1] bg-amber-500/10 rounded-xl px-3 py-2 mb-4 border border-amber-500/25">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F5A623] flex-shrink-0" />
              <span>{risk.missingBackupCount} active obligation{risk.missingBackupCount !== 1 ? "s" : ""} have no backup owner assigned</span>
              <Link href="/obligations" className="ml-auto text-[#F5A623] font-semibold hover:underline whitespace-nowrap">Fix →</Link>
            </div>
          )}

          {/* Critical items list */}
          {allCritical.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#8898A8] uppercase tracking-wide mb-2">Items Requiring Action</p>
              {allCritical.map((o) => (
                <Link key={`${o.tag}-${o.id}`} href={`/obligations/${o.id}`}>
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.04] group cursor-pointer transition-colors border border-transparent hover:border-white/[0.08]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {o.tag === "overdue" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#FF4040] bg-red-500/15 border border-red-500/30 rounded-full px-2 py-0.5 flex-shrink-0">
                          <Flame className="w-2.5 h-2.5" /> OVERDUE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#FF8C00] bg-orange-500/15 border border-orange-500/30 rounded-full px-2 py-0.5 flex-shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5" /> ≤7 DAYS
                        </span>
                      )}
                      <span className="text-sm font-semibold text-[#F0F4F8] truncate group-hover:text-[#F5A623]">
                        {o.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className="text-xs text-[#8898A8] font-mono">{format(parseISO(o.dueDate), "MMM d")}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#4A5568] group-hover:text-[#F5A623]" />
                    </div>
                  </div>
                </Link>
              ))}
              {(risk.overdueItems.length + risk.criticalItems.length) > 6 && (
                <Link href="/obligations?status=active">
                  <div className="text-center py-1.5">
                    <span className="text-xs text-[#8898A8] hover:text-[#F5A623] hover:underline">
                      +{(risk.overdueItems.length + risk.criticalItems.length) - 6} more - view all
                    </span>
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Category colors ──────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Licensing: "bg-[#00C8F0]",
  Insurance: "bg-purple-500",
  Contracts: "bg-[#FF6B35]",
  Software: "bg-sky-400",
  "HR & Compliance": "bg-[#00E676]",
  "Real Estate": "bg-[#FF8C00]",
  Other: "bg-[#8898A8]",
};

// ── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useUser();
  const { workspaceId, isLoading: wsLoading } = useWorkspace();

  const metricsQuery = useGetDashboardMetrics(
    { workspaceId: workspaceId ?? 0 },
    {
      query: {
        queryKey: getGetDashboardMetricsQueryKey({ workspaceId: workspaceId ?? 0 }),
        enabled: !!workspaceId,
      },
    },
  );

  const upcomingQuery = useGetUpcomingObligations(
    { workspaceId: workspaceId ?? 0, days: 30 },
    {
      query: {
        queryKey: getGetUpcomingObligationsQueryKey({ workspaceId: workspaceId ?? 0, days: 30 }),
        enabled: !!workspaceId,
      },
    },
  );

  const metrics = metricsQuery.data;
  const upcoming = upcomingQuery.data ?? [];
  const isLoading = wsLoading || metricsQuery.isLoading;

  const workspaceQuery = useGetWorkspace(workspaceId ?? 0, {
    query: {
      queryKey: getGetWorkspaceQueryKey(workspaceId ?? 0),
      enabled: !!workspaceId,
    },
  });
  const workspace = workspaceQuery.data;
  const isDemo = workspace?.slug?.startsWith("demo-") || workspace?.name?.toLowerCase().includes("demo");

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#F0F4F8] tracking-tight">Dashboard</h1>
              {isDemo && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 border border-amber-500/30 text-[#F5A623] uppercase tracking-wider"
                  data-testid="sandbox-banner"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-ping" />
                  Sandbox
                </span>
              )}
            </div>
            <p className="text-[#8898A8] text-sm mt-1">
              {user?.firstName ? `Welcome back, ${user.firstName}.` : "Welcome back."}{" "}
              Here's what needs your attention.
            </p>
          </div>
          <Link href="/obligations/new">
            <Button
              type="button"
              className="gap-2 bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0F0800] font-bold shadow-[0_0_16px_rgba(245,166,35,0.2)] rounded-xl border-none"
              data-testid="button-new-obligation"
            >
              <Plus className="w-4 h-4" />
              New Obligation
            </Button>
          </Link>
        </div>

        {/* Risk Cockpit */}
        {workspaceId && <RiskCockpit workspaceId={workspaceId} />}

        {/* Metrics grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <MetricCard
            title="Total Active"
            value={metrics?.totalActive}
            icon={Clock}
            accentColor="bg-[#00C8F0]"
            bgColor="bg-cyan-500/10"
            borderColor="border-white/[0.07]"
            isLoading={isLoading}
            href="/obligations?status=active"
          />
          <MetricCard
            title="Overdue"
            value={metrics?.overdue}
            icon={AlertTriangle}
            accentColor="bg-[#FF4040]"
            bgColor="bg-red-500/15"
            borderColor="border-white/[0.07]"
            isLoading={isLoading}
            urgency="critical"
            href="/obligations?status=expired"
          />
          <MetricCard
            title="Due in 30 Days"
            value={metrics?.dueSoon}
            icon={Clock}
            accentColor="bg-[#F5A623]"
            bgColor="bg-amber-500/10"
            borderColor="border-white/[0.07]"
            isLoading={isLoading}
            urgency="warning"
          />
          <MetricCard
            title="Completed"
            value={metrics?.completed}
            icon={CheckCircle2}
            accentColor="bg-[#00E676]"
            bgColor="bg-emerald-500/10"
            borderColor="border-white/[0.07]"
            isLoading={isLoading}
          />
          <MetricCard
            title="Expired"
            value={metrics?.expired}
            icon={XCircle}
            accentColor="bg-[#8898A8]"
            bgColor="bg-white/[0.04]"
            borderColor="border-white/[0.07]"
            isLoading={isLoading}
          />
          <MetricCard
            title="Reminders (30d)"
            value={metrics?.remindersSentLast30Days}
            icon={Bell}
            accentColor="bg-purple-400"
            bgColor="bg-purple-500/10"
            borderColor="border-white/[0.07]"
            isLoading={isLoading}
            href="/delivery"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming table - 2/3 width */}
          <div className="lg:col-span-2">
            <div className="bg-obsidian-surface rounded-2xl border border-white/[0.07] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
                <div>
                  <h2 className="font-bold text-[#F0F4F8]">Upcoming Deadlines</h2>
                  <p className="text-xs text-[#8898A8] mt-0.5">Next 30 days</p>
                </div>
                <Link href="/obligations?status=active">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-[#8898A8] hover:text-[#F0F4F8] hover:bg-white/[0.04]"
                    data-testid="link-view-all-obligations"
                  >
                    View all <ChevronRight className="w-3.5 h-3.5 text-[#8898A8]" />
                  </Button>
                </Link>
              </div>

              {upcomingQuery.isLoading || wsLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/[0.05]" />
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="py-16 px-6 text-center">
                  <div className="w-12 h-12 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-[#00E676]" />
                  </div>
                  <p className="font-semibold text-[#F0F4F8] mb-1">You're all caught up</p>
                  <p className="text-sm text-[#8898A8]">No obligations due in the next 30 days.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {upcoming.map((o) => (
                    <Link key={o.id} href={`/obligations/${o.id}`}>
                      <div
                        className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                        data-testid={`row-obligation-${o.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={cn("w-2 h-2 rounded-full flex-shrink-0", CATEGORY_COLORS[o.category] ?? "bg-[#8898A8]")} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#F0F4F8] truncate group-hover:text-[#F5A623]">
                              {o.title}
                            </p>
                            <p className="text-xs text-[#8898A8] mt-0.5 truncate">
                              {o.category}{o.ownerEmail ? ` · ${o.ownerEmail}` : " · No owner set"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                          <DueDateBadge dueDate={o.dueDate} status={o.status} />
                          <span className="text-xs text-[#8898A8] font-mono hidden sm:block">
                            {format(parseISO(o.dueDate), "MMM d")}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#4A5568] group-hover:text-[#F5A623] transition-colors" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* By category */}
            {metrics?.byCategory && metrics.byCategory.length > 0 ? (
              <div className="bg-obsidian-surface rounded-2xl border border-white/[0.07] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
                <div className="px-6 py-4 border-b border-white/[0.07]">
                  <h2 className="font-bold text-[#F0F4F8]">By Category</h2>
                </div>
                <div className="p-4 space-y-1">
                  {metrics.byCategory.map((item) => (
                    <Link
                      key={item.category}
                      href={`/obligations?category=${encodeURIComponent(item.category)}`}
                    >
                      <div
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                        data-testid={`card-category-${item.category}`}
                      >
                        <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", CATEGORY_COLORS[item.category] ?? "bg-[#8898A8]")} />
                        <span className="text-sm font-medium text-[#CBD5E1] flex-1 truncate group-hover:text-[#F0F4F8]">{item.category}</span>
                        <span className="text-sm font-bold text-[#F0F4F8] font-mono ml-2">{item.count}</span>
                        <ChevronRight className="w-3 h-3 text-[#4A5568] group-hover:text-[#F5A623] transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Quick actions */}
            <div className="bg-obsidian-surface rounded-2xl border border-white/[0.07] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              <div className="px-6 py-4 border-b border-white/[0.07]">
                <h2 className="font-bold text-[#F0F4F8]">Quick Actions</h2>
              </div>
              <div className="p-4 space-y-1">
                {[
                  { label: "Add obligation", href: "/obligations/new", icon: Plus, desc: "Track a new deadline" },
                  { label: "Import CSV", href: "/import", icon: TrendingUp, desc: "Bulk import from spreadsheet" },
                  { label: "View audit log", href: "/audit", icon: CheckCircle2, desc: "See recent changes" },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.href} href={action.href}>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group">
                        <div className="w-8 h-8 bg-white/[0.04] border border-white/[0.08] rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-3.5 h-3.5 text-[#F5A623]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#F0F4F8] group-hover:text-[#F5A623]">{action.label}</p>
                          <p className="text-xs text-[#8898A8]">{action.desc}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#4A5568] group-hover:text-[#F5A623] ml-auto transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
