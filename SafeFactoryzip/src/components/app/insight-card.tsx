import type { ReactNode } from "react";

export function InsightCard({
  tone = "neutral",
  icon,
  title,
  children,
}: {
  tone?: "healthy" | "watch" | "at_risk" | "critical" | "neutral";
  icon?: ReactNode;
  title: ReactNode;
  children: ReactNode;
}) {
  const toneClasses: Record<string, string> = {
    healthy:  "bg-success/8  border-success/25",
    watch:    "bg-brand/8    border-brand/25",
    at_risk:  "bg-warning/10 border-warning/30",
    critical: "bg-danger/10  border-danger/30",
    neutral:  "bg-white/40   border-white/30",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border backdrop-blur-xl ${toneClasses[tone]} p-6 transition-all duration-200 card-hover`}
      style={{ boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)" }}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/60 border border-white/40 text-foreground shadow-sm backdrop-blur-sm">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-base font-semibold tracking-tight text-foreground md:text-lg">{title}</div>
          <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="glass card-hover rounded-2xl p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-normal tracking-tight text-foreground">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
