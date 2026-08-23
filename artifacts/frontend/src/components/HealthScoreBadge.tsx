import { cn } from "@/lib/utils";

export function HealthScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) {
  const tone = score >= 70
    ? "bg-emerald-500/10 text-[#00E676] border-emerald-500/30"
    : score >= 40
      ? "bg-amber-500/10 text-[#F5A623] border-amber-500/30"
      : "bg-red-500/15 text-[#FF4040] border-red-500/30";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        tone,
      )}
    >
      {score}
    </span>
  );
}
