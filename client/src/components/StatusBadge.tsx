import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  
  const styles = {
    paid: "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-500/10",
    pending: "bg-amber-100 text-amber-700 border-amber-200 shadow-sm shadow-amber-500/10",
    draft: "bg-slate-100 text-slate-700 border-slate-200 shadow-sm shadow-slate-500/10",
    overdue: "bg-rose-100 text-rose-700 border-rose-200 shadow-sm shadow-rose-500/10",
  };

  const selectedStyle = styles[normalizedStatus as keyof typeof styles] || styles.draft;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
        selectedStyle
      )}
    >
      {normalizedStatus}
    </span>
  );
}
