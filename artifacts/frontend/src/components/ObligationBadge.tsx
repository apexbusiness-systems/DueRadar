import { cn } from "@/lib/utils";
import { differenceInDays, parseISO } from "date-fns";

type ObligationStatus = "active" | "expired" | "completed" | "paused";

const STATUS_CONFIG: Record<ObligationStatus, { bg: string; text: string; dot: string; label: string }> = {
  active:    { bg: "bg-blue-50 border border-blue-200",   text: "text-blue-700",   dot: "bg-blue-500",   label: "Active" },
  expired:   { bg: "bg-red-50 border border-red-200",     text: "text-red-700",    dot: "bg-red-500",    label: "Expired" },
  completed: { bg: "bg-emerald-50 border border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: "Completed" },
  paused:    { bg: "bg-slate-100 border border-slate-200", text: "text-slate-500",  dot: "bg-slate-400",  label: "Paused" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = status as ObligationStatus;
  const config = STATUS_CONFIG[s] ?? STATUS_CONFIG.paused;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
        config.bg,
        config.text,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

export function DueDateBadge({ dueDate, status }: { dueDate: string; status: string }) {
  if (status !== "active") return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let due: Date;
  try {
    due = parseISO(dueDate);
  } catch {
    return null;
  }
  const days = differenceInDays(due, today);

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        {Math.abs(days)}d overdue
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Due today
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        {days}d left
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="text-xs text-slate-500 font-medium">
        {days}d left
      </span>
    );
  }
  return null;
}
