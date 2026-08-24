import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListDeliveryHistory,
  getListDeliveryHistoryQueryKey,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { Bell, CheckCircle2, XCircle, Clock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; icon: React.ComponentType<{ className?: string }> }> = {
  sent:    { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-[#00E676]", dot: "bg-[#00E676]", icon: CheckCircle2 },
  failed:  { bg: "bg-red-500/15 border-red-500/30",         text: "text-[#FF4040]", dot: "bg-[#FF4040]", icon: XCircle },
  pending: { bg: "bg-amber-500/10 border-amber-500/30",     text: "text-[#F5A623]", dot: "bg-[#F5A623]", icon: Clock },
};

export default function DeliveryPage() {
  const { workspaceId } = useWorkspace();
  const deliveryQuery = useListDeliveryHistory(
    { workspaceId: workspaceId ?? 0, limit: 100 },
    {
      query: {
        queryKey: getListDeliveryHistoryQueryKey({ workspaceId: workspaceId ?? 0, limit: 100 }),
        enabled: !!workspaceId,
      },
    },
  );
  const records = Array.isArray(deliveryQuery.data) ? deliveryQuery.data : [];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#F0F4F8] tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 bg-purple-500/15 border border-purple-500/30 rounded-xl flex items-center justify-center">
              <Bell className="w-4.5 h-4.5 text-purple-400" />
            </div>
            Signal Log
          </h1>
          <p className="text-[#8898A8] text-sm mt-1.5">
            All reminder notifications sent by the system, including email and in-app alerts.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Sent", val: records.filter(r => r.status === "sent").length, color: "text-[#00E676]" },
            { label: "Failed", val: records.filter(r => r.status === "failed").length, color: "text-[#FF4040]" },
            { label: "Pending", val: records.filter(r => r.status === "pending").length, color: "text-[#F5A623]" },
          ].map((s) => (
            <div key={s.label} className="bg-obsidian-surface rounded-2xl border border-white/[0.07] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              <p className="text-xs text-[#8898A8] font-medium mb-1">{s.label}</p>
              <p className={`text-3xl font-black font-mono ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-obsidian-surface rounded-2xl border border-white/[0.07] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          {deliveryQuery.isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/[0.05]" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="py-20 text-center px-6">
              <div className="w-14 h-14 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-[#8898A8]" />
              </div>
              <p className="font-bold text-[#F0F4F8] text-lg mb-1">No deliveries yet</p>
              <p className="text-sm text-[#8898A8]">
                Reminders will appear here once the scheduler runs. The processor checks every hour.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-[#8898A8] uppercase tracking-wide">Obligation</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#8898A8] uppercase tracking-wide">Recipient</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#8898A8] uppercase tracking-wide">Channel</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#8898A8] uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#8898A8] uppercase tracking-wide">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {records.map((r) => {
                    const s = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-white/[0.03] transition-colors"
                        data-testid={`row-delivery-${r.id}`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-[#F0F4F8] text-sm truncate max-w-52">
                            {r.obligationTitle ?? `Obligation #${r.obligationId}`}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-[#8898A8] truncate max-w-44 block">{r.recipientEmail}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-[#CBD5E1] capitalize">{r.channel.replace("_", " ")}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", s.bg, s.text)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-[#8898A8] font-mono font-medium">
                            {format(new Date(r.sentAt), "MMM d, yyyy · HH:mm")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
