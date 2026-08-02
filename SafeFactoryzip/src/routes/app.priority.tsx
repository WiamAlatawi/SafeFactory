import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/app/app-shell";
import { Metric } from "@/components/app/insight-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, apiPriority, type PriorityInputs } from "@/lib/inference";
import { usePipeline } from "@/lib/pipeline-store";

export const Route = createFileRoute("/app/priority")({ component: PriorityPage });

const DEFAULTS: PriorityInputs = {
  temperature: 72, vibration: 4.2, pressure: 118, acoustic: 68,
  inspectionDuration: 3, downtimeCost: 2200, technicianAvailability: 0.6,
};

function priorityCategory(p: string) {
  if (p === "Immediate") return { label: "Do Today",       desc: "Immediate intervention required to prevent failure.",          color: "text-danger",  bg: "bg-danger/8",  border: "border-danger/30" };
  if (p === "High")      return { label: "Do This Week",   desc: "Address before the end of the current work week.",            color: "text-warning", bg: "bg-warning/8", border: "border-warning/30" };
  return                        { label: "Monitor",        desc: "Continue monitoring. No immediate action required.",          color: "text-success", bg: "bg-success/8", border: "border-success/30" };
}

function PriorityPage() {
  const [inputs, setInputs] = useState<PriorityInputs>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { priority, setPriority } = usePipeline();
  const update = <K extends keyof PriorityInputs>(k: K, v: PriorityInputs[K]) => setInputs((p) => ({ ...p, [k]: v }));

  const analyze = async () => {
    setLoading(true);
    setApiError(null);
    try { setPriority(await apiPriority(inputs)); }
    catch (e) {
      console.error("Priority analysis error:", e);
      setApiError("Could not reach the analysis engine. Please try again in a moment.");
    }
    finally { setLoading(false); }
  };

  const cat = priority ? priorityCategory(priority.priority) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Module 04"
        title={<>Maintenance <span className="text-gradient">Priority</span></>}
        description="Weigh operational readings and downtime cost into a clear, ranked recommendation."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input form */}
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="text-sm text-muted-foreground mb-4">Operational inputs</div>
          <div className="grid grid-cols-2 gap-4">
            <NumField label="Temperature (°C)"        value={inputs.temperature}          onChange={(v) => update("temperature", v)} />
            <NumField label="Vibration"               value={inputs.vibration}            onChange={(v) => update("vibration", v)}   step={0.1} />
            <NumField label="Pressure (kPa)"          value={inputs.pressure}             onChange={(v) => update("pressure", v)} />
            <NumField label="Acoustic (dB)"           value={inputs.acoustic}             onChange={(v) => update("acoustic", v)} />
            <NumField label="Inspection duration (h)" value={inputs.inspectionDuration}   onChange={(v) => update("inspectionDuration", v)} step={0.5} />
            <NumField label="Downtime cost ($/h)"     value={inputs.downtimeCost}         onChange={(v) => update("downtimeCost", v)} />
          </div>
          {apiError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-danger/40 bg-danger/8 p-3">
              <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <div className="text-xs text-danger">{apiError}</div>
            </div>
          )}
          <Button onClick={analyze} disabled={loading} className="mt-6 w-full rounded-full">
            {loading ? "Determining priority…" : "Determine priority"}
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-6 lg:col-span-3">
          {loading ? (
            <div className="h-80 animate-shimmer rounded-3xl border border-white/30" />
          ) : priority && cat ? (
            <>
              {/* Priority banner */}
              <div className={`rounded-3xl border p-6 backdrop-blur-xl ${cat.bg} ${cat.border}`} style={{ boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)" }}>
                <div className={`text-xs font-semibold uppercase tracking-wider ${cat.color}`}>
                  Recommended action
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="font-display text-3xl font-normal text-foreground">{cat.label}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cat.bg} ${cat.border} ${cat.color}`}>
                    {priority.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{cat.desc}</p>
                <p className="mt-3 text-sm text-foreground">{priority.rationale}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Metric label="Business Impact"     value={formatCurrency(priority.financialImpact)} hint="Estimated cost at risk" />
                <Metric label="Recommended Window"  value={priority.window} />
                <Metric label="Expected Downtime"   value={`${priority.expectedDowntimeHours}h`} hint="If unaddressed" />
              </div>
            </>
          ) : (
            <div className="glass grid h-80 place-items-center rounded-3xl text-center p-8">
              <div>
                <div className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-brand/12">
                  <Wrench className="h-6 w-6 text-brand" />
                </div>
                <div className="mt-4 text-base font-medium text-foreground">Ready to determine priority</div>
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

function NumField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number" step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="rounded-xl border-white/30 bg-white/40"
      />
    </div>
  );
}
