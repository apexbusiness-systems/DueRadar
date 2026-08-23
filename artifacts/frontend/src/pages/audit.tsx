import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useListAuditLogs, getListAuditLogsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { BookOpen, Plus, Edit2, Trash2, CheckCircle2, AlertTriangle, Upload, Bell, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  "obligation.created":   { label: "Created",          color: "text-[#00C8F0]",   bg: "bg-cyan-500/10 border-cyan-500/30",       icon: Plus },
  "obligation.updated":   { label: "Updated",          color: "text-[#F5A623]",   bg: "bg-amber-500/10 border-amber-500/30",     icon: Edit2 },
  "obligation.deleted":   { label: "Deleted",          color: "text-[#FF4040]",   bg: "bg-red-500/15 border-red-500/30",         icon: Trash2 },
  "obligation.completed": { label: "Completed",        color: "text-[#00E676]",   bg: "bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2 },
  "obligation.expired":   { label: "Expired",          color: "text-[#8898A8]",   bg: "bg-white/[0.04] border-white/[0.08]",     icon: AlertTriangle },
  "obligation.imported":  { label: "Imported via CSV", color: "text-indigo-400",  bg: "bg-indigo-500/10 border-indigo-500/30",   icon: Upload },
  "reminder_rule.created":{ label: "Reminder added",   color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/30",   icon: Bell },
  "member.removed":       { label: "Member removed",   color: "text-[#FF8C00]",   bg: "bg-orange-500/10 border-orange-500/30",   icon: UserMinus },
};

const FALLBACK = { label: "Action", color: "text-[#8898A8]", bg: "bg-white/[0.04] border-white/[0.08]", icon: BookOpen };

export default function AuditPage() {
  const { workspaceId } = useWorkspace();
  const auditQuery = useListAuditLogs(
    { workspaceId: workspaceId ?? 0, limit: 100 },
    {
      query: {
        queryKey: getListAuditLogsQueryKey({ workspaceId: workspaceId ?? 0, limit: 100 }),
        enabled: !!workspaceId,
      },
    },
  );
  const logs = Array.isArray(auditQuery.data) ? auditQuery.data : [];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#F0F4F8] tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl flex items-center justify-center">
              <BookOpen className="w-4.5 h-4.5 text-[#F5A623]" />
            </div>
            Activity Ledger
          </h1>
          <p className="text-[#8898A8] text-sm mt-1.5">
            Immutable record of every action taken on obligations and workspace members.
          </p>
        </div>

        <div className="bg-obsidian-surface rounded-2xl border border-white/[0.07] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          {auditQuery.isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/[0.05]" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center px-6">
              <div className="w-14 h-14 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-[#8898A8]" />
              </div>
              <p className="font-bold text-[#F0F4F8] text-lg mb-1">No activity yet</p>
              <p className="text-sm text-[#8898A8]">
                All changes to obligations will be recorded here automatically.
              </p>
            </div>
          ) : (
            <div>
              {/* Column headers */}
              <div className="grid grid-cols-4 border-b border-white/[0.07] bg-white/[0.02] px-6 py-3.5">
                <span className="text-xs font-semibold text-[#8898A8] uppercase tracking-wide">Action</span>
                <span className="text-xs font-semibold text-[#8898A8] uppercase tracking-wide">Obligation</span>
                <span className="text-xs font-semibold text-[#8898A8] uppercase tracking-wide">Actor</span>
                <span className="text-xs font-semibold text-[#8898A8] uppercase tracking-wide">When</span>
              </div>
              <div className="divide-y divide-white/[0.05]">
                {logs.map((log) => {
                  const config = ACTION_CONFIG[log.action] ?? FALLBACK;
                  const Icon = config.icon;
                  return (
                    <div
                      key={log.id}
                      className="grid grid-cols-4 items-center px-6 py-4 hover:bg-white/[0.03] transition-colors"
                      data-testid={`row-audit-${log.id}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border flex-shrink-0", config.bg)}>
                          <Icon className={cn("w-3.5 h-3.5", config.color)} />
                        </div>
                        <span className={cn("text-sm font-semibold", config.color)}>
                          {config.label}
                        </span>
                      </div>
                      <div className="pr-4">
                        <span className="text-sm text-[#F0F4F8] font-medium truncate block max-w-40">
                          {log.obligationTitle ?? (log.obligationId ? `#${log.obligationId}` : "-")}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-[#8898A8] truncate block max-w-36">
                          {log.actorName ?? log.actorClerkId ?? "System"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-[#8898A8] font-mono font-medium">
                          {format(new Date(log.createdAt), "MMM d, yyyy · HH:mm")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
