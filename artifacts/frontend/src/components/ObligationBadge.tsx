import { cn } from "@/lib/utils";
import { differenceInDays, parseISO } from "date-fns";

type ObligationStatus = "active" | "expired" | "completed" | "paused";

const STATUS_CONFIG: Record<ObligationStatus, { bg: string; text: string; dot: string; label: string }> = {
  active:    { bg: "bg-cyan-500/10 border border-cyan-500/30",   text: "text-[#00C8F0]",   dot: "bg-[#00C8F0]",   label: "Active" },
  expired:   { bg: "bg-red-500/15 border border-red-500/30",     text: "text-[#FF4040]",    dot: "bg-[#FF4040]",    label: "Expired" },
  completed: { bg: "bg-emerald-500/10 border border-emerald-500/30", text: "text-[#00E676]", dot: "bg-[#00E676]", label: "Completed" },
  paused:    { bg: "bg-white/[0.04] border border-white/[0.08]", text: "text-[#8898A8]",  dot: "bg-[#8898A8]",  label: "Paused" },
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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-[#FF4040] text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF4040] animate-pulse" />
        {Math.abs(days)}d overdue
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-[#F5A623] text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" />
        Due today
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[#FFB84D] text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" />
        {days}d left
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="text-xs text-[#8898A8] font-medium">
        {days}d left
      </span>
    );
  }
  return null;
}
