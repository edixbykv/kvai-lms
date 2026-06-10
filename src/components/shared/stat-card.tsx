import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "primary",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  accent?: "primary" | "blue" | "amber" | "violet" | "rose";
  hint?: string;
}) {
  const accents: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          {typeof trend === "number" && (
            <div className={cn("mt-2 inline-flex items-center gap-1 text-xs font-medium", trend >= 0 ? "text-green-600" : "text-red-600")}>
              {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(trend)}% vs last month
            </div>
          )}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
