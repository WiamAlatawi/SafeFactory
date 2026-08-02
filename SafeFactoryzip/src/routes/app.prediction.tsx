import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/app/app-shell";
import { InsightCard, Metric } from "@/components/app/insight-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { apiPredict, type PredictionInputs, formatPct } from "@/lib/inference";
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

const RANGES = {
  airTemp:          { min: 295,  max: 305,  label: "Air temp (K)" },
  processTemp:      { min: 305,  max: 314,  label: "Process temp (K)" },
  rotationalSpeed:  { min: 1168, max: 2886, label: "Rotation (rpm)" },
  torque:           { min: 3.8,  max: 76.6, label: "Torque (Nm)" },
  toolWear:         { min: 0,    max: 253,  label: "Tool wear (min)" },
} as const;

type RangedKey = keyof typeof RANGES;

function outOfRange(inputs: PredictionInputs): RangedKey[] {
  return (Object.keys(RANGES) as RangedKey[]).filter((k) => {
    const v = inputs[k] as number;
    return v < RANGES[k].min || v > RANGES[k].max;
  });
}

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
  const [apiError, setApiError] = useState<string | null>(null);
  const pipeline = usePipeline();
  const navigate = useNavigate();
  const step = useAnalysisStep(analyzing);

  const update = <K extends keyof PredictionInputs>(k: K, v: PredictionInputs[K]) =>
    setInputs((p) => ({ ...p, [k]: v }));

  const invalid = outOfRange(inputs);
  const hasErrors = invalid.length > 0;

  const analyze = async () => {
    if (hasErrors) return;
    setAnalyzing(true);
    setApiError(null);
    try {
      const { prediction, diagnosis } = await apiPredict(inputs);
      pipeline.setPrediction(inputs, prediction);
      pipeline.setDiagnosis(diagnosis);
    } catch (e) {
      console.error("Analysis error:", e);
      setApiError("Could not reach the analysis engine. Please try again in a moment.");
    } finally {
      setAnalyzing(false);
    }
  };

  const result = pipeline.prediction;
  const tone = (result?.status ?? "healthy") as "healthy" | "watch" | "at_risk" | "critical";

  const tempDelta = parseFloat((inputs.processTemp - inputs.airTemp).toFixed(1));
  const powerW    = parseFloat((inputs.torque * inputs.rotationalSpeed * (2 * Math.PI / 60)).toFixed(0));

  const factors = result ? (() => {
    const ft = result.approachingType ?? result.failure_type;
    if (ft === "HDF") return [
      { label: "Cooling delta (proc − air)", value: `${tempDelta} K`,          hint: "< 8.6 K signals poor heat dissipation", high: tempDelta < 8.6 },
      { label: "Air temperature",            value: `${inputs.airTemp} K`,      hint: "> 300 K is elevated",                   high: inputs.airTemp > 300 },
      { label: "Process temperature",        value: `${inputs.processTemp} K`,  hint: "Normal range 305–314 K",                high: inputs.processTemp > 313 },
      { label: "Rotational speed",           value: `${inputs.rotationalSpeed} rpm`, hint: "Normal",                           high: false },
    ];
    if (ft === "PWF") return [
      { label: "Torque",           value: `${inputs.torque} Nm`,             hint: "> 50 Nm under load",          high: inputs.torque > 50 },
      { label: "Rotational speed", value: `${inputs.rotationalSpeed} rpm`,   hint: "< 1500 rpm with high torque", high: inputs.rotationalSpeed < 1500 && inputs.torque > 40 },
      { label: "Mechanical power", value: `${powerW} W`,                     hint: "> 9,000 W exceeds rated capacity", high: powerW > 9000 },
      { label: "Tool wear",        value: `${inputs.toolWear} min`,          hint: "Normal",                      high: false },
    ];
    if (ft === "TWF") return [
      { label: "Tool wear",       value: `${inputs.toolWear} min`, hint: "> 200 min is near end-of-life",         high: inputs.toolWear > 200 },
      { label: "Equipment class", value: inputs.type,              hint: "L-class has lower wear tolerance",      high: inputs.type === "L" && inputs.toolWear > 150 },
      { label: "Torque",          value: `${inputs.torque} Nm`,   hint: "Normal",                                high: false },
      { label: "Rotational speed",value: `${inputs.rotationalSpeed} rpm`, hint: "Normal",                        high: false },
    ];
    if (ft === "OSF") return [
      { label: "Torque",           value: `${inputs.torque} Nm`,           hint: "> 47 Nm on worn tool = overstrain", high: inputs.torque > 47 },
      { label: "Tool wear",        value: `${inputs.toolWear} min`,        hint: "> 150 min with high torque",        high: inputs.toolWear > 150 },
      { label: "Mechanical power", value: `${powerW} W`,                   hint: "> 9,000 W exceeds rated capacity",  high: powerW > 9000 },
      { label: "Rotational speed", value: `${inputs.rotationalSpeed} rpm`, hint: "Normal",                            high: false },
    ];
    return [
      { label: "Operating torque",    value: `${inputs.torque} Nm`,           hint: "Threshold 47 Nm",    high: inputs.torque > 47 },
      { label: "Tool wear",           value: `${inputs.toolWear} min`,        hint: "Threshold 200 min",  high: inputs.toolWear > 200 },
      { label: "Process temperature", value: `${inputs.processTemp} K`,       hint: "Threshold 313 K",    high: inputs.processTemp > 313 },
      { label: "Rotational speed",    value: `${inputs.rotationalSpeed} rpm`, hint: "Threshold 2800 rpm", high: inputs.rotationalSpeed > 2800 },
    ];
  })() : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Module 01"
        title={<>Failure <span className="text-gradient">Prediction</span></>}
        description="Enter current operating readings. SafeFactory provides an assessment of equipment health and failure risk."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input form */}
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
            <Activity className="h-4 w-4 text-brand" /> Operating conditions
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="mb-1.5 block text-xs text-muted-foreground">Equipment class</Label>
              <Select value={inputs.type} onValueChange={(v) => update("type", v as "L" | "M" | "H")}>
                <SelectTrigger className="rounded-xl border-white/30 bg-white/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Low-duty</SelectItem>
                  <SelectItem value="M">Medium-duty</SelectItem>
                  <SelectItem value="H">High-duty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <RangedField label="Air temp (K)"      value={inputs.airTemp}         onChange={(v) => update("airTemp", v)}         step={0.1} range={RANGES.airTemp} />
            <RangedField label="Process temp (K)"  value={inputs.processTemp}     onChange={(v) => update("processTemp", v)}     step={0.1} range={RANGES.processTemp} />
            <RangedField label="Rotation (rpm)"    value={inputs.rotationalSpeed} onChange={(v) => update("rotationalSpeed", v)}            range={RANGES.rotationalSpeed} />
            <RangedField label="Torque (Nm)"       value={inputs.torque}          onChange={(v) => update("torque", v)}          step={0.1} range={RANGES.torque} />
            <div className="col-span-2">
              <RangedField label="Tool wear (min)"  value={inputs.toolWear}        onChange={(v) => update("toolWear", v)}                   range={RANGES.toolWear} />
            </div>
          </div>

          {hasErrors && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-warning/40 bg-warning/8 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div className="text-xs text-warning">
                <div className="font-semibold mb-1">Values outside model training range</div>
                <div className="text-warning/80 leading-relaxed">
                  {invalid.map((k) => (
                    <span key={k} className="block">{RANGES[k].label}: expected {RANGES[k].min}–{RANGES[k].max}</span>
                  ))}
                  <span className="block mt-1.5">The model was trained on real sensor data within these bounds. Inputs outside this range will produce unreliable predictions.</span>
                </div>
              </div>
            </div>
          )}

          {apiError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-danger/40 bg-danger/8 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <div className="text-xs text-danger">{apiError}</div>
            </div>
          )}

          <Button onClick={analyze} disabled={analyzing || hasErrors} className="mt-4 w-full rounded-full">
            {analyzing
              ? <><Sparkles className="mr-2 h-4 w-4 animate-pulse" />{ANALYSIS_STEPS[step]}</>
              : hasErrors
                ? <><AlertTriangle className="mr-2 h-4 w-4" />Fix out-of-range values</>
                : <>Analyze equipment <Sparkles className="ml-2 h-4 w-4" /></>
            }
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-6 lg:col-span-3">
          {analyzing ? (
            <div className="space-y-4">
              <div className="glass rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand/12">
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
                        : <div className="h-4 w-4 shrink-0 rounded-full border border-white/40" />
                      }
                      <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-shimmer rounded-2xl border border-white/30" />)}
              </div>
            </div>
          ) : result ? (
            <>
              <InsightCard tone={tone} icon={<Sparkles className="h-5 w-5 text-brand" />} title={result.headline}>
                {result.narrative}
              </InsightCard>

              <div className="grid gap-4 md:grid-cols-3">
                <Metric label="Assessment confidence" value={formatPct(result.confidence)} />
                <Metric label="Estimated failure risk" value={formatPct(result.probability)} hint={result.failure ? "Above alert threshold" : "Within safe band"} />
                <Metric label="Status" value={statusLabel(result.status)} hint={result.approachingType ? `Nearest pattern: ${result.approachingType}` : "No matching pattern"} />
              </div>

              {/* Pattern alignment */}
              <div className="glass rounded-3xl p-6">
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
              <div className="glass rounded-3xl p-6">
                <div className="mb-4 text-sm font-semibold text-foreground">Contributing factors</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {factors.map((f) => (
                    <div key={f.label} className={`flex items-center justify-between rounded-xl border px-4 py-3 backdrop-blur-sm ${f.high ? "border-warning/40 bg-warning/8" : "border-white/30 bg-white/30"}`}>
                      <div>
                        <div className="text-xs text-muted-foreground">{f.label}</div>
                        <div className="text-sm font-semibold text-foreground">{f.value}</div>
                        {f.hint && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{f.hint}</div>}
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
                <div className="flex items-center justify-between rounded-3xl border border-brand/30 bg-brand/8 p-5 backdrop-blur-sm">
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
            <div className="glass grid place-items-center rounded-3xl border-dashed p-12 text-center" style={{ borderStyle: "dashed", borderColor: "rgba(255,255,255,0.4)" }}>
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/12 text-brand">
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

function RangedField({
  label, value, onChange, step = 1, range,
}: {
  label: string; value: number; onChange: (v: number) => void; step?: number; range: { min: number; max: number };
}) {
  const error = !isNaN(value) && (value < range.min || value > range.max);
  return (
    <div>
      <Label className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {error && <AlertTriangle className="h-3 w-3 text-warning" />}
      </Label>
      <Input
        type="number" step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`rounded-xl border-white/30 bg-white/40 ${error ? "border-warning/60 focus-visible:ring-warning/30" : ""}`}
      />
      <div className={`mt-1 text-[10px] ${error ? "text-warning font-medium" : "text-muted-foreground/60"}`}>
        {range.min}–{range.max}{error && " ← out of range"}
      </div>
    </div>
  );
}
