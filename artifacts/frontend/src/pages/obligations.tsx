import { useState, useCallback } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListObligations,
  getListObligationsQueryKey,
  useDeleteObligation,
  useCompleteObligation,
} from "@workspace/api-client-react";
import { StatusBadge, DueDateBadge } from "@/components/ObligationBadge";
import { HealthScoreBadge } from "@/components/HealthScoreBadge";
import { Plus, Search, Download, Trash2, CheckCircle2, ClipboardList, Upload } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const CATEGORIES = ["All", "Licensing", "Insurance", "Contracts", "Software", "HR & Compliance", "Real Estate", "Other"];
const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Licensing: "bg-[#00C8F0]",
  Insurance: "bg-purple-500",
  Contracts: "bg-[#FF6B35]",
  Software: "bg-sky-400",
  "HR & Compliance": "bg-[#00E676]",
  "Real Estate": "bg-[#FF8C00]",
  Other: "bg-[#8898A8]",
};

export default function ObligationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("All");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { workspaceId } = useWorkspace();

  const params = {
    ...(workspaceId ? { workspaceId } : {}),
    ...(search ? { search } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(category !== "All" ? { category } : {}),
  } as Parameters<typeof useListObligations>[0];

  const obligationsQuery = useListObligations(params, {
    query: {
      queryKey: getListObligationsQueryKey(params),
      enabled: !!workspaceId,
    },
  });

  const deleteObligation = useDeleteObligation();
  const completeObligation = useCompleteObligation();
  const obligations = obligationsQuery.data ?? [];

  const handleDelete = useCallback(
    (id: number, title: string) => {
      if (!confirm(`Delete "${title}"?`)) return;
      deleteObligation.mutate(
        { obligationId: id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListObligationsQueryKey() });
            toast({ title: "Obligation deleted" });
          },
          onError: () => toast({ title: "Delete failed", variant: "destructive" }),
        },
      );
    },
    [deleteObligation, queryClient, toast],
  );

  const handleComplete = useCallback(
    (id: number) => {
      completeObligation.mutate(
        { obligationId: id, data: {} },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListObligationsQueryKey() });
            toast({ title: "Marked as completed" });
          },
          onError: () => toast({ title: "Failed", variant: "destructive" }),
        },
      );
    },
    [completeObligation, queryClient, toast],
  );

  const handleExport = useCallback(async () => {
    if (!workspaceId) {
      toast({ title: "Workspace not loaded yet", variant: "destructive" });
      return;
    }
    try {
      const qs = new URLSearchParams({ workspaceId: String(workspaceId) });
      if (search) qs.set("search", search);
      if (status !== "all") qs.set("status", status);
      if (category !== "All") qs.set("category", category);

      const r = await fetch(`/api/obligations/export/csv?${qs}`, { credentials: "include" });
      if (!r.ok) throw new Error("Export failed");
      const text = await r.text();
      const blob = new Blob([text], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "obligations.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "CSV exported" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  }, [workspaceId, search, status, category, toast]);

  const isFiltered = search || status !== "all" || category !== "All";

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#F0F4F8] tracking-tight">Due Register</h1>
            <p className="text-sm text-[#8898A8] mt-0.5">
              {!workspaceId
                ? "Loading..."
                : obligationsQuery.isLoading
                ? "Loading obligations..."
                : `${obligations.length} obligation${obligations.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 text-[#CBD5E1] border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:text-[#F0F4F8] rounded-xl"
              onClick={handleExport}
              disabled={!workspaceId}
              data-testid="button-export-csv"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Link href="/import">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 text-[#CBD5E1] border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:text-[#F0F4F8] rounded-xl"
                data-testid="link-import-csv"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
            </Link>
            <Link href="/obligations/new">
              <Button
                type="button"
                size="sm"
                className="gap-2 bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0F0800] font-bold rounded-xl shadow-[0_0_16px_rgba(245,166,35,0.2)] border-none"
                data-testid="button-new-obligation"
              >
                <Plus className="w-4 h-4" />
                New
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 mb-5">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8898A8]" />
            <Input
              placeholder="Search obligations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-white/[0.08] bg-obsidian-surface text-[#F0F4F8] placeholder:text-[#4A5568] shadow-sm focus-visible:ring-[#F5A623] h-9"
              data-testid="input-search"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40 rounded-xl border-white/[0.08] bg-obsidian-surface text-[#F0F4F8] shadow-sm h-9" data-testid="select-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0A0E18] border-white/[0.1] text-[#F0F4F8]">
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44 rounded-xl border-white/[0.08] bg-obsidian-surface text-[#F0F4F8] shadow-sm h-9" data-testid="select-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0A0E18] border-white/[0.1] text-[#F0F4F8]">
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table card */}
        <div className="bg-obsidian-surface rounded-2xl border border-white/[0.07] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          {!workspaceId || obligationsQuery.isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/[0.05]" />
              ))}
            </div>
          ) : obligations.length === 0 ? (
            <div className="py-20 px-6 text-center">
              <div className="w-14 h-14 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-7 h-7 text-[#8898A8]" />
              </div>
              <p className="font-bold text-[#F0F4F8] text-lg mb-1">No obligations found</p>
              <p className="text-[#8898A8] text-sm mb-6">
                {isFiltered
                  ? "Try adjusting your filters."
                  : "Add your first obligation to get started."}
              </p>
              {!isFiltered && (
                <div className="flex items-center justify-center gap-3">
                  <Link href="/obligations/new">
                    <Button type="button" size="sm" className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0F0800] font-bold rounded-xl gap-2 shadow-[0_0_16px_rgba(245,166,35,0.2)] border-none" data-testid="button-create-first">
                      <Plus className="w-4 h-4" /> Add obligation
                    </Button>
                  </Link>
                  <Link href="/import">
                    <Button type="button" variant="outline" size="sm" className="rounded-xl gap-2 border-white/[0.08] bg-white/[0.02] text-[#CBD5E1] hover:bg-white/[0.06] hover:text-[#F0F4F8]">
                      <Upload className="w-4 h-4" /> Import CSV
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-[#8898A8] uppercase tracking-wide">Obligation</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#8898A8] uppercase tracking-wide">Category</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#8898A8] uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#8898A8] uppercase tracking-wide">Due Date</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#8898A8] uppercase tracking-wide hidden lg:table-cell">Health</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-[#8898A8] uppercase tracking-wide hidden lg:table-cell">Owner</th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-[#8898A8] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {obligations.map((o) => {
                    const healthScore =
                      "healthScore" in o && typeof o.healthScore === "number" ? o.healthScore : 100;

                    return (
                    <tr
                      key={o.id}
                      className="hover:bg-white/[0.03] transition-colors group"
                      data-testid={`row-obligation-${o.id}`}
                    >
                      <td className="px-6 py-4">
                        <Link href={`/obligations/${o.id}`}>
                          <div className="cursor-pointer flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", CATEGORY_COLORS[o.category] ?? "bg-[#8898A8]")} />
                            <div>
                              <p className="font-semibold text-[#F0F4F8] group-hover:text-[#F5A623] truncate max-w-52">{o.title}</p>
                              <div className="mt-0.5">
                                <DueDateBadge dueDate={o.dueDate} status={o.status} />
                              </div>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-[#8898A8]">{o.category}</span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-[#CBD5E1] font-mono font-medium">{format(parseISO(o.dueDate), "MMM d, yyyy")}</span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell"><HealthScoreBadge score={healthScore} size="sm" /></td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        {o.ownerEmail ? (
                          <span className="text-sm text-[#8898A8] truncate max-w-36 block">{o.ownerEmail}</span>
                        ) : (
                          <span className="text-xs text-[#F5A623] bg-amber-500/10 border border-amber-500/25 rounded-full px-2 py-0.5">No owner</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {o.status === "active" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#00E676] hover:bg-emerald-500/15 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition-colors"
                                  onClick={() => handleComplete(o.id)}
                                  data-testid={`button-complete-${o.id}`}
                                  aria-label="Mark obligation complete"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Mark complete</TooltipContent>
                            </Tooltip>
                          )}
                          <Link href={`/obligations/${o.id}`}>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 rounded-lg text-xs font-semibold border-white/[0.08] bg-white/[0.02] text-[#CBD5E1] hover:bg-white/[0.06] hover:text-[#F0F4F8] focus-visible:ring-2 focus-visible:ring-[#F5A623]"
                              data-testid={`button-view-${o.id}`}
                            >
                              Details
                            </Button>
                          </Link>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4A5568] hover:bg-red-500/15 hover:text-[#FF4040] focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none transition-colors"
                                onClick={() => handleDelete(o.id, o.title)}
                                data-testid={`button-delete-${o.id}`}
                                aria-label="Delete obligation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Delete obligation</TooltipContent>
                          </Tooltip>
                        </div>
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
