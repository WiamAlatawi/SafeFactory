import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { usePipeline } from "@/lib/pipeline-store";
import { formatPct } from "@/lib/inference";

export const Route = createFileRoute("/app/")({
  component: Overview,
});

const modules = [
  {
    to: "/app/prediction",
    title: "Failure Prediction",
    desc: "Enter equipment readings to assess failure risk.",
    icon: Activity,
  },
  {
    to: "/app/diagnosis",
    title: "Failure Diagnosis",
    desc: "Understand the root cause and operational impact.",
    icon: Stethoscope,
  },
  {
    to: "/app/risk",
    title: "Risk Assessment",
    desc: "Composite view of environmental and mechanical risk.",
    icon: ShieldAlert,
  },
  {
    to: "/app/priority",
    title: "Maintenance Priority",
    desc: "Determine the right time to act and the cost of delay.",
    icon: Wrench,
  },
];

function StatCard({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: string;
  hint?: string;
  color?: string;
}) {
  return (
    <div className="glass card-hover rounded-2xl p-5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-2 font-display text-lg font-normal ${color ?? "text-foreground"}`}>
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}

function Overview() {
  const { prediction, diagnosis, risk, priority } = usePipeline();
  const hasAny = prediction || risk || priority;

  const statusLabel = prediction
    ? prediction.status === "healthy"
      ? "No failure expected"
      : prediction.status === "watch"
        ? "Monitor — early signals"
        : prediction.status === "at_risk"
          ? "At risk — action advised"
          : "Requires immediate review"
    : "—";

  const statusColor = prediction
    ? prediction.status === "healthy"
      ? "text-success"
      : prediction.status === "watch"
        ? "text-warning"
        : "text-danger"
    : "text-muted-foreground";

  const priorityLabel = priority
    ? priority.priority === "Immediate"
      ? "Do Today"
      : priority.priority === "High"
        ? "Do This Week"
        : "Monitor"
    : "—";

  const focusItems: { text: string; tone: "ok" | "warn" | "neutral" }[] = [];
  if (!hasAny) {
    focusItems.push({
      text: "No analysis has been run yet. Start with Failure Prediction.",
      tone: "neutral",
    });
  } else {
    if (prediction?.failure) {
      focusItems.push({
        text: `Failure pattern detected — ${diagnosis?.fullName ?? "diagnosis available"}.`,
        tone: "warn",
      });
    } else if (prediction?.status === "watch") {
      focusItems.push({
        text: "Equipment is approaching an abnormal pattern. Monitor closely.",
        tone: "warn",
      });
    } else if (prediction?.status === "healthy") {
      focusItems.push({
        text: "Latest prediction: no failure expected. Continue standard monitoring.",
        tone: "ok",
      });
    }
    if (priority?.priority === "Immediate" || priority?.priority === "High") {
      focusItems.push({
        text: `Maintenance priority: ${priorityLabel}. ${priority.rationale}`,
        tone: "warn",
      });
    }
    if (risk?.level === "High" || risk?.level === "Critical") {
      focusItems.push({
        text: `Composite risk level is ${risk.level} (${risk.score}/100). Review risk assessment.`,
        tone: "warn",
      });
    }
    if (prediction && !prediction.failure && !priority) {
      focusItems.push({
        text: "Run a maintenance priority assessment to determine next action.",
        tone: "neutral",
      });
    }
    if (prediction || diagnosis || risk || priority) {
      focusItems.push({
        text: "Executive report is available to export.",
        tone: "ok",
      });
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title={
          hasAny ? (
            <>
              Latest assessment{" "}
              <span className="text-gradient">summary.</span>
            </>
          ) : (
            <>
              Begin your first{" "}
              <span className="text-gradient">equipment analysis.</span>
            </>
          )
        }
        description={
          hasAny
            ? "Based on the most recent analysis run in this session."
            : "Enter equipment readings in Failure Prediction to generate your first assessment."
        }
        actions={
          <Button asChild className="rounded-full">
            <Link to="/app/prediction">
              {hasAny ? "New analysis" : "Start analysis"}{" "}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {/* Status cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Equipment Status"
          value={statusLabel}
          hint={prediction ? `Confidence: ${formatPct(prediction.confidence)}` : undefined}
          color={prediction ? statusColor : "text-muted-foreground"}
        />
        <StatCard
          label="Predicted Failure Risk"
          value={prediction ? formatPct(prediction.probability) : "—"}
          hint={prediction ? (prediction.failure ? "Above alert threshold" : "Within safe band") : undefined}
          color={prediction ? (prediction.probability > 0.55 ? "text-danger" : prediction.probability > 0.2 ? "text-warning" : "text-success") : "text-muted-foreground"}
        />
        <StatCard
          label="Current Risk Level"
          value={risk ? `${risk.level} — ${risk.score}/100` : "—"}
          hint={!risk ? "Run risk assessment to populate" : undefined}
          color={risk ? (risk.level === "Critical" || risk.level === "High" ? "text-danger" : risk.level === "Medium" ? "text-warning" : "text-success") : "text-muted-foreground"}
        />
        <StatCard
          label="Maintenance Priority"
          value={priorityLabel}
          hint={priority ? priority.window : undefined}
          color={priority ? (priority.priority === "Immediate" ? "text-danger" : priority.priority === "High" ? "text-warning" : "text-success") : "text-muted-foreground"}
        />
        <StatCard
          label="Report Status"
          value={hasAny ? "Available" : "—"}
          hint={hasAny ? undefined : undefined}
          color={hasAny ? "text-success" : "text-muted-foreground"}
        />
        <StatCard
          label="Analyses Completed"
          value={`${[prediction, diagnosis, risk, priority].filter(Boolean).length} / 4`}
          hint="Modules run in this session"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Focus */}
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Bot className="h-4 w-4 text-brand" /> Today's Focus
          </div>
          <div className="space-y-2.5">
            {focusItems.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm backdrop-blur-sm ${
                  item.tone === "warn"
                    ? "border-warning/30 bg-warning/8"
                    : item.tone === "ok"
                      ? "border-success/30 bg-success/8"
                      : "border-white/30 bg-white/30"
                }`}
              >
                <CheckCircle2
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    item.tone === "warn"
                      ? "text-warning"
                      : item.tone === "ok"
                        ? "text-success"
                        : "text-muted-foreground"
                  }`}
                />
                <span className={item.tone === "neutral" ? "text-muted-foreground" : "text-foreground"}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
          {hasAny && (
            <div className="mt-3 text-xs text-muted-foreground">
              <Link to="/app/report" className="text-brand underline-offset-2 hover:underline">
                Open Executive Report →
              </Link>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="glass rounded-3xl p-6">
          <div className="text-sm text-muted-foreground mb-4">Quick actions</div>
          <div className="space-y-2">
            {[
              { to: "/app/prediction", label: "Run failure prediction", done: !!prediction },
              { to: "/app/risk",       label: "Assess risk",            done: !!risk },
              { to: "/app/priority",   label: "Determine priority",     done: !!priority },
              { to: "/app/report",     label: "View executive report",  done: false },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-all hover:-translate-y-px ${
                  a.done
                    ? "border-success/25 bg-success/8"
                    : "border-white/30 bg-white/30 hover:border-brand/30 hover:bg-brand/6"
                }`}
              >
                <span className={a.done ? "text-success" : "text-foreground"}>{a.label}</span>
                {a.done
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  : <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                }
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Module shortcuts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...modules, {
          to: "/app/report",
          title: "Executive Report",
          desc: "Management-ready brief from all completed analyses.",
          icon: FileText,
        }].map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.to}
              to={m.to}
              className="glass card-hover group rounded-3xl p-5"
            >
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand/12 text-brand ring-1 ring-brand/20 transition-all group-hover:bg-brand/20">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-sm font-semibold text-foreground">{m.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{m.desc}</div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
                Open <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
