import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, DollarSign, Info, Wrench } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/app/app-shell";
import { Metric } from "@/components/app/insight-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, runPriority, type PriorityInputs } from "@/lib/inference";
import { usePipeline } from "@/lib/pipeline-store";

export const Route = createFileRoute("/app/priority")({ component: PriorityPage });

const DEFAULTS: PriorityInputs = {
  temperature: 72,
  vibration: 4.2,
  pressure: 118,
  acoustic: 68,
  inspectionDuration: 3,
  downtimeCost: 2200,
  technicianAvailability: 0.6,
  riskScore: 58,
  vibrationDeviation: 1.9,
  highRiskIndicator: 0,
};

function priorityCategory(p: string): {
  label: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
} {
  if (p === "Immediate")
    return {
      label: "Do Today",
      desc: "Immediate intervention required to prevent failure.",
      color: "text-danger",
      bg: "bg-danger/8",
      border: "border-danger/30",
    };
  if (p === "High")
    return {
      label: "Do This Week",
      desc: "Address before the end of the current work week.",
      color: "text-warning",
      bg: "bg-warning/8",
      border: "border-warning/30",
    };
  return {
    label: "Monitor",
    desc: "Continue monitoring. No immediate action required.",
    color: "text-success",
    bg: "bg-success/8",
    border: "border-success/30",
  };
}

function PriorityPage() {
  const [inputs, setInputs] = useState<PriorityInputs>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const { priority, setPriority } = usePipeline();
  const update = <K extends keyof PriorityInputs>(k: K, v: PriorityInputs[K]) =>
    setInputs((p) => ({ ...p, [k]: v }));

  const analyze = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      setPriority(runPriority(inputs));
    } catch (e) {
      console.error("Priority analysis error:", e);
    } finally {
      setLoading(false);
    }
  };

  const cat = priority ? priorityCategory(priority.priority) : null;

  const whyReasons = priority
    ? [
        priority.urgency > 0.65 &&
          "Increasing failure probability based on current readings",
        priority.financialImpact > 3000 &&
          "High financial impact if maintenance is delayed",
        inputs.highRiskIndicator === 1 &&
          "High-risk indicator has been escalated",
        priority.expectedDowntimeHours > 4 &&
          `Estimated ${priority.expectedDowntimeHours}h downtime if unaddressed`,
        priority.financialImpact > 0 &&
          `Cost of delay: ${formatCurrency(priority.financialImpact)} at risk`,
      ].filter(Boolean) as string[]
    : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Module 04"
        title={
          <>
            Maintenance <span className="text-gradient">Priority</span>
          </>
        }
        description="Weigh operational readings and downtime cost into a clear, ranked recommendation."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input form */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <div className="text-sm text-muted-foreground mb-4">Operational inputs</div>
          <div className="grid grid-cols-2 gap-4">
            <NumField
              label="Temperature (°C)"
              value={inputs.temperature}
              onChange={(v) => update("temperature", v)}
            />
            <NumField
              label="Vibration"
              value={inputs.vibration}
              onChange={(v) => update("vibration", v)}
              step={0.1}
            />
            <NumField
              label="Pressure (kPa)"
              value={inputs.pressure}
              onChange={(v) => update("pressure", v)}
            />
            <NumField
              label="Acoustic (dB)"
              value={inputs.acoustic}
              onChange={(v) => update("acoustic", v)}
            />
            <NumField
              label="Inspection duration (h)"
              value={inputs.inspectionDuration}
              onChange={(v) => update("inspectionDuration", v)}
              step={0.5}
            />
            <NumField
              label="Downtime cost ($/h)"
              value={inputs.downtimeCost}
              onChange={(v) => update("downtimeCost", v)}
            />
            <NumField
              label="Risk score (0–100)"
              value={inputs.riskScore}
              onChange={(v) => update("riskScore", v)}
            />
            <NumField
              label="Vibration deviation"
              value={inputs.vibrationDeviation}
              onChange={(v) => update("vibrationDeviation", v)}
              step={0.1}
            />
            <div className="col-span-2 flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-3 text-sm">
              <span className="text-foreground">Escalate high-risk indicator</span>
              <button
                onClick={() =>
                  update("highRiskIndicator", inputs.highRiskIndicator ? 0 : 1)
                }
                className={`grid h-6 w-11 place-items-start rounded-full p-0.5 transition-colors ${inputs.highRiskIndicator ? "bg-brand" : "bg-muted"}`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-background transition-transform ${inputs.highRiskIndicator ? "translate-x-5" : ""}`}
                />
              </button>
            </div>
          </div>
          <Button
            onClick={analyze}
            disabled={loading}
            className="mt-6 w-full rounded-full"
          >
            {loading ? "Determining priority…" : "Determine priority"}
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-6 lg:col-span-3">
          {loading ? (
            <div className="h-80 animate-shimmer rounded-3xl border border-border/60" />
          ) : priority && cat ? (
            <>
              {/* Priority category banner */}
              <div className={`rounded-3xl border p-6 ${cat.bg} ${cat.border}`}>
                <div className={`text-xs font-semibold uppercase tracking-wider ${cat.color}`}>
                  Recommended action
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-3xl font-semibold text-foreground">
                    {cat.label}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cat.bg} ${cat.border} ${cat.color}`}
                  >
                    {priority.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{cat.desc}</p>
                <p className="mt-3 text-sm text-foreground">{priority.rationale}</p>
              </div>

              {/* Metrics */}
              <div className="grid gap-4 md:grid-cols-3">
                <Metric
                  label="Business Impact"
                  value={formatCurrency(priority.financialImpact)}
                  hint="Estimated cost at risk"
                />
                <Metric
                  label="Recommended Window"
                  value={priority.window}
                />
                <Metric
                  label="Expected Downtime"
                  value={`${priority.expectedDowntimeHours}h`}
                  hint="If unaddressed"
                />
              </div>

              {/* Why this recommendation */}
              {whyReasons.length > 0 && (
                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Info className="h-4 w-4 text-brand" /> Reason for Recommendation
                  </div>
                  <ul className="space-y-2.5">
                    {whyReasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        <span className="text-foreground">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cost if delayed */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Estimated Cost if Delayed
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> Recommended window
                    </div>
                    <div className="mt-1.5 text-sm font-semibold text-foreground">
                      {priority.window}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <DollarSign className="h-3.5 w-3.5" /> Financial exposure
                    </div>
                    <div className="mt-1.5 text-sm font-semibold text-danger">
                      {formatCurrency(priority.financialImpact)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="text-xs text-muted-foreground">
                    What happens if this is ignored?
                  </div>
                  <p className="mt-1.5 text-sm text-foreground">
                    {priority.priority === "Immediate"
                      ? `Delaying intervention risks unplanned downtime of up to ${priority.expectedDowntimeHours} hours and estimated losses of ${formatCurrency(priority.financialImpact)}. Equipment failure at this stage may extend repair scope significantly.`
                      : priority.priority === "High"
                        ? `Without intervention this week, current conditions are likely to deteriorate. Estimated downtime risk: ${priority.expectedDowntimeHours} hours.`
                        : "No immediate cost risk. Continue standard preventive maintenance schedule."}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="grid h-80 place-items-center rounded-3xl border border-dashed border-border/60 text-center p-8">
              <div>
                <div className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-brand/10">
                  <Wrench className="h-6 w-6 text-brand" />
                </div>
                <div className="mt-4 text-base font-medium text-foreground">
                  Ready to determine priority
                </div>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Provide operational inputs to receive a ranked maintenance recommendation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="rounded-xl bg-background/40"
      />
    </div>
  );
}
