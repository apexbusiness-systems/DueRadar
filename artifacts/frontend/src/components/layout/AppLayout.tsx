import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import {
  LayoutDashboard,
  ClipboardList,
  Upload,
  Bell,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  useGetDashboardMetrics,
  getGetDashboardMetricsQueryKey,
  useGetDashboardRisk,
  getGetDashboardRiskQueryKey,
  useGetWorkspace,
  getGetWorkspaceQueryKey,
} from "@workspace/api-client-react";

/* ── RadarMark SVG ── */
export function RadarMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <circle cx="15" cy="15" r="13" stroke="rgba(245,166,35,.4)" strokeWidth="1" />
      <circle cx="15" cy="15" r="8" stroke="rgba(245,166,35,.6)" strokeWidth="1" />
      <circle cx="15" cy="15" r="3" fill="#F5A623" />
      <line x1="15" y1="2" x2="15" y2="6" stroke="rgba(245,166,35,.5)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="15" y1="24" x2="15" y2="28" stroke="rgba(245,166,35,.5)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="2" y1="15" x2="6" y2="15" stroke="rgba(245,166,35,.5)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="24" y1="15" x2="28" y2="15" stroke="rgba(245,166,35,.5)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/* ── Live Telemetry Status Bar ── */
export function StatusBar() {
  const [clock, setClock] = useState("");
  const { workspaceId } = useWorkspace();

  const metricsQuery = useGetDashboardMetrics(
    { workspaceId: workspaceId ?? 0 },
    {
      query: {
        queryKey: getGetDashboardMetricsQueryKey({ workspaceId: workspaceId ?? 0 }),
        enabled: !!workspaceId,
      },
    },
  );

  const riskQuery = useGetDashboardRisk(
    { workspaceId: workspaceId ?? 0 },
    {
      query: {
        queryKey: getGetDashboardRiskQueryKey({ workspaceId: workspaceId ?? 0 }),
        enabled: !!workspaceId,
      },
    },
  );

  const workspaceQuery = useGetWorkspace(workspaceId ?? 0, {
    query: {
      queryKey: getGetWorkspaceQueryKey(workspaceId ?? 0),
      enabled: !!workspaceId,
    },
  });

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, "0");
      setClock(`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const isLoading = metricsQuery.isLoading || riskQuery.isLoading || workspaceQuery.isLoading;
  const isError = metricsQuery.isError || riskQuery.isError;
  const workspace = workspaceQuery.data;
  const isDemo = workspace?.slug?.startsWith("demo-") || workspace?.name?.toLowerCase().includes("demo");

  const critical = riskQuery.data?.criticalCount ?? 0;
  const dueSoon = metricsQuery.data?.dueSoon ?? 0;
  const totalMonitored = metricsQuery.data?.totalActive ?? 0;
  const protectedCount = Math.max(0, totalMonitored - critical - dueSoon);

  return (
    <div
      className="h-9 flex items-center gap-3 px-4 shrink-0 overflow-x-auto text-[#8898A8] border-b border-white/[0.08]"
      style={{
        background: "#0A0E18",
      }}
      data-testid="status-bar"
    >
      {/* LED Status Indicator */}
      <div
        className="w-[7.5px] h-[7.5px] rounded-full shrink-0"
        style={{
          background: isError ? "#FF4040" : isDemo ? "#F5A623" : "#00E676",
          boxShadow: isError ? "0 0 8px #FF4040" : isDemo ? "0 0 8px #F5A623" : "0 0 8px #00E676",
          animation: "pulse-led 2.5s ease-in-out infinite",
        }}
        aria-hidden="true"
      />
      <span className="text-[11px] font-medium tracking-[0.06em] uppercase whitespace-nowrap">
        {isError ? (
          <span className="text-[#FF4040]">System Error</span>
        ) : isDemo ? (
          <span className="text-[#F5A623] font-bold" data-testid="sandbox-badge">Sandbox Mode</span>
        ) : (
          <span className="text-[#8898A8]">Live Monitoring</span>
        )}
      </span>

      <span className="text-white/10 select-none">|</span>

      {/* Critical Badge */}
      <span
        className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2 py-0.5 rounded-full border bg-red-500/10 border-red-500/20 text-[#FF4040] whitespace-nowrap"
        title={`${critical} critical obligations due in 7 days or overdue`}
      >
        <span className="w-[4px] h-[4px] rounded-full bg-current" />
        <span className="font-mono">{isLoading ? "..." : isError ? "ERR" : critical}</span> Critical
      </span>

      {/* Due Soon Badge */}
      <span
        className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/20 text-[#F5A623] whitespace-nowrap"
        title={`${dueSoon} obligations due in 30 days`}
      >
        <span className="w-[4px] h-[4px] rounded-full bg-current" />
        <span className="font-mono">{isLoading ? "..." : isError ? "ERR" : dueSoon}</span> Due Soon
      </span>

      {/* Protected Badge */}
      <span
        className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-[#00E676] whitespace-nowrap"
        title={`${protectedCount} obligations protected with active reminder schedules`}
      >
        <span className="w-[4px] h-[4px] rounded-full bg-current" />
        <span className="font-mono">{isLoading ? "..." : isError ? "ERR" : protectedCount}</span> Protected
      </span>

      {/* Clock & Monitor Stats */}
      <span className="ml-auto text-[11px] font-medium tracking-[0.04em] whitespace-nowrap hidden sm:inline-flex items-center gap-2">
        <span className="font-mono text-[#F0F4F8]">{clock}</span>
        <span className="text-white/10 select-none">·</span>
        <span>
          <strong className="text-[#F0F4F8] font-mono">{isLoading ? "..." : isError ? "ERR" : totalMonitored}</strong> monitored
        </span>
      </span>
    </div>
  );
}

const NAV_SECTIONS = [
  {
    label: "Command",
    items: [
      { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
      { href: "/obligations", label: "Due Register", icon: ClipboardList },
      { href: "/import", label: "Due Intake", icon: Upload },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/delivery", label: "Signal Log", icon: Bell },
      { href: "/audit", label: "Activity Ledger", icon: BookOpen },
      { href: "/workspace", label: "Mission Control", icon: Settings },
    ],
  },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ?? "U";

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user?.emailAddresses[0]?.emailAddress ?? "Ops Lead";

  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  return (
    <div className="flex h-screen bg-obsidian-bg text-radar-fg overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-30 w-60 bg-[#07090F] border-r border-white/[0.07] text-white flex flex-col transition-transform duration-200 relative shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Amber edge glow */}
        <div
          className="absolute right-0 top-[15%] bottom-[15%] w-px pointer-events-none"
          style={{ background: "linear-gradient(180deg, transparent, rgba(245,166,35,.35), transparent)" }}
        />

        {/* Brand header */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.07]">
          <RadarMark size={30} />
          <div className="leading-none min-w-0">
            <div className="text-[15px] font-bold text-[#F0F4F8] tracking-tight">
              Due<span className="text-[#F5A623]">Radar</span>
            </div>
            <small className="block text-[9px] font-semibold text-[#8898A8] mt-0.5 uppercase tracking-[0.14em] truncate">
              Warning System
            </small>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="text-[#4A5568] text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
                {section.label}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/obligations"
                    ? location.startsWith("/obligations")
                    : location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer mb-1 relative border",
                        active
                          ? "bg-[rgba(245,166,35,.15)] text-[#FFB84D] font-semibold border-[rgba(245,166,35,.3)] shadow-[0_0_12px_rgba(245,166,35,.08)]"
                          : "text-[#8898A8] border-transparent hover:bg-white/[0.04] hover:text-[#F0F4F8]",
                      )}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#F5A623] rounded-full shadow-[0_0_8px_#F5A623]" />
                      )}
                      <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-[#F5A623]" : "text-[#8898A8] group-hover:text-[#F0F4F8]")} />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight className="w-3 h-3 text-[#F5A623]/60" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-colors group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 text-xs font-black flex-shrink-0 shadow-md">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#F0F4F8] truncate leading-tight">{displayName}</p>
              <p className="text-[10px] text-[#8898A8] truncate leading-tight mt-0.5">{email}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-[#8898A8] hover:text-red-400 hover:bg-red-400/10 flex-shrink-0 transition-colors"
              onClick={() => signOut()}
              data-testid="button-sign-out"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-obsidian-bg">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-[#07090F]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            data-testid="button-mobile-menu"
            className="text-[#8898A8] hover:text-[#F0F4F8] hover:bg-white/[0.06]"
            aria-label="Toggle mobile menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <RadarMark size={24} />
            <span className="font-bold text-sm text-[#F0F4F8]">DueRadar</span>
          </div>
        </header>

        {/* Live Telemetry Status Bar */}
        <StatusBar />

        <main className="flex-1 overflow-y-auto bg-obsidian-bg text-radar-fg">{children}</main>
      </div>
    </div>
  );
}
