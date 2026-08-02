import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, ArrowRight, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/app/app-shell";
import { InsightCard, Metric } from "@/components/app/insight-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { runDiagnosis, runPrediction, type PredictionInputs, formatPct } from "@/lib/inference";
import { usePipeline } from "@/lib/pipeline-store";

export const Route = createFileRoute("/app/prediction")({ component: PredictionPage });

const DEFAULTS: PredictionInputs = {
  type: "M",
  airTemp: 298.5,
  processTemp: 308.9,
  rotationalSpeed: 1520,
  torque: 42.8,
  toolWear: 108,
};

const ANALYSIS_STEPS = [
  "Analyzing equipment readings…",
  "Comparing with historical operating patterns…",
  "Evaluating failure risk indicators…",
  "Generating maintenance assessment…",
];

function useAnalysisStep(analyzing: boolean) {
  const [step, setStep] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (analyzing) {
      setStep(0);
      timer.current = setInterval(() => setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 550);
    } else {
      if (timer.current) clearInterval(timer.current);
      setStep(0);
    }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [analyzing]);
  return step;
}

function statusLabel(s: string) {
  if (s === "critical") return "Requires Immediate Review";
  if (s === "at_risk")  return "At Risk";
  if (s === "watch")    return "Monitor";
  return "Healthy";
}

function PredictionPage() {
  const [inputs, setInputs] = useState<PredictionInputs>(DEFAULTS);
  const [analyzing, setAnalyzing] = useState(false);
  const pipeline = usePipeline();
  const navigate = useNavigate();
  const step = useAnalysisStep(analyzing);

  const update = <K extends keyof PredictionInputs>(k: K, v: PredictionInputs[K]) =>
    setInputs((p) => ({ ...p, [k]: v }));

  const analyze = async () => {
    setAnalyzing(true);
    try {
      await new Promise((r) => setTimeout(r, 2200));
      const r = runPrediction(inputs);
      pipeline.setPrediction(inputs, r);
      pipeline.setDiagnosis(r.failure ? runDiagnosis(inputs, r) : null);
    } catch (e) {
      console.error("Analysis error:", e);
    } finally {
      setAnalyzing(false);
    }
  };

  const result = pipeline.prediction;
  const tone = (result?.status ?? "healthy") as "healthy" | "watch" | "at_risk" | "critical";

  // Contributing factors derived from inputs
  const factors = result ? [
    { label: "Operating torque", value: inputs.torque, threshold: 47, unit: "Nm", high: inputs.torque > 47 },
    { label: "Tool wear",        value: inputs.toolWear, threshold: 200, unit: "min", high: inputs.toolWear > 200 },
    { label: "Process temperature", value: inputs.processTemp, threshold: 313, unit: "K", high: inputs.processTemp > 313 },
    { label: "Rotational speed",    value: inputs.rotationalSpeed, threshold: 2800, unit: "rpm", high: inputs.rotationalSpeed > 2800 },
  ] : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Module 01"
        title={<>Failure <span className="text-gradient">Prediction</span></>}
        description="Enter current operating readings. SafeFactory provides an assessment of equipment health and failure risk."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input form */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-brand" /> Operating conditions
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Equipment class</Label>
              <Select value={inputs.type} onValueChange={(v) => update("type", v as "L" | "M" | "H")}>
                <SelectTrigger className="rounded-xl bg-background/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Low-duty</SelectItem>
                  <SelectItem value="M">Medium-duty</SelectItem>
                  <SelectItem value="H">High-duty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <NumField label="Air temp (K)"      value={inputs.airTemp}          onChange={(v) => update("airTemp", v)}          step={0.1} />
            <NumField label="Process temp (K)"  value={inputs.processTemp}      onChange={(v) => update("processTemp", v)}      step={0.1} />
            <NumField label="Rotation (rpm)"    value={inputs.rotationalSpeed}  onChange={(v) => update("rotationalSpeed", v)} />
            <NumField label="Torque (Nm)"       value={inputs.torque}           onChange={(v) => update("torque", v)}           step={0.1} />
            <NumField label="Tool wear (min)"   value={inputs.toolWear}         onChange={(v) => update("toolWear", v)} />
          </div>
          <Button onClick={analyze} disabled={analyzing} className="mt-6 w-full rounded-full">
            {analyzing
              ? <><Sparkles className="mr-2 h-4 w-4 animate-pulse" />{ANALYSIS_STEPS[step]}</>
              : <>Analyze equipment <Sparkles className="ml-2 h-4 w-4" /></>
            }
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-6 lg:col-span-3">
          {analyzing ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10">
                    <Sparkles className="h-5 w-5 text-brand animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">SafeFactory is analyzing…</div>
                    <div className="text-xs text-muted-foreground">{ANALYSIS_STEPS[step]}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {ANALYSIS_STEPS.map((s, i) => (
                    <div key={s} className={`flex items-center gap-3 text-sm transition-opacity duration-300 ${i <= step ? "opacity-100" : "opacity-25"}`}>
                      {i < step
                        ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                        : i === step
                        ? <Sparkles className="h-4 w-4 shrink-0 text-brand animate-pulse" />
                        : <div className="h-4 w-4 shrink-0 rounded-full border border-border/60" />
                      }
                      <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-shimmer rounded-2xl border border-border/60" />)}
              </div>
            </div>
          ) : result ? (
            <>
              <InsightCard tone={tone} icon={<Sparkles className="h-5 w-5 text-brand" />} title={result.headline}>
                {result.narrative}
              </InsightCard>

              <div className="grid gap-4 md:grid-cols-3">
                <Metric label="Assessment confidence"  value={formatPct(result.confidence)} />
                <Metric
                  label="Estimated failure risk"
                  value={formatPct(result.probability)}
                  hint={result.failure ? "Above alert threshold" : "Within safe band"}
                />
                <Metric
                  label="Status"
                  value={statusLabel(result.status)}
                  hint={result.approachingType ? `Nearest pattern: ${result.approachingType}` : "No matching pattern"}
                />
              </div>

              {/* Pattern alignment */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-1 text-sm font-semibold text-foreground">
                  <TrendingUp className="h-4 w-4 text-brand" /> Signal alignment with known failure patterns
                </div>
                <p className="text-xs text-muted-foreground mb-4">Historical similarity to each failure type based on current readings.</p>
                <div className="space-y-3">
                  {(["HDF", "OSF", "PWF", "TWF"] as const).map((code) => {
                    const active = result.approachingType === code;
                    const v = active
                      ? Math.round(result.probability * 100)
                      : Math.max(4, Math.round(result.probability * 40 - 10));
                    const names: Record<string, string> = {
                      HDF: "Heat dissipation failure",
                      OSF: "Overstrain failure",
                      PWF: "Power delivery failure",
                      TWF: "Tool wear failure",
                    };
                    return (
                      <div key={code}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className={active ? "font-medium text-foreground" : "text-muted-foreground"}>
                            {names[code]}
                            {active && <span className="ml-2 rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 text-[10px] text-brand">Detected pattern</span>}
                          </span>
                          <span className="text-muted-foreground">{v}%</span>
                        </div>
                        <Progress value={v} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contributing factors */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 text-sm font-semibold text-foreground">Contributing factors</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {factors.map((f) => (
                    <div key={f.label} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${f.high ? "border-warning/40 bg-warning/6" : "border-border/60 bg-background/40"}`}>
                      <div>
                        <div className="text-xs text-muted-foreground">{f.label}</div>
                        <div className="text-sm font-semibold text-foreground">{f.value} {f.unit}</div>
                      </div>
                      {f.high
                        ? <span className="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[10px] font-semibold text-warning">Elevated</span>
                        : <span className="rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-[10px] font-semibold text-success">Normal</span>
                      }
                    </div>
                  ))}
                </div>
              </div>

              {result.failure && (
                <div className="flex items-center justify-between rounded-3xl border border-brand/40 bg-brand/10 p-5">
                  <div>
                    <div className="text-sm font-medium text-foreground">Failure pattern detected — diagnosis ready</div>
                    <div className="text-xs text-muted-foreground">SafeFactory has prepared a root-cause diagnosis.</div>
                  </div>
                  <Button onClick={() => navigate({ to: "/app/diagnosis" })} className="rounded-full">
                    Open diagnosis <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="grid place-items-center rounded-3xl border border-dashed border-border/60 p-12 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
                <Activity className="h-6 w-6" />
              </div>
              <div className="mt-4 text-lg font-medium text-foreground">Ready when you are</div>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Enter the current operating readings and SafeFactory will assess equipment health and failure risk.
              </p>
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
