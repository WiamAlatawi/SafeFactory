import { createFileRoute } from "@tanstack/react-router";
import { CloudRain, Gauge, ShieldAlert, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/app/app-shell";
import { InsightCard } from "@/components/app/insight-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { runRisk, type RiskInputs } from "@/lib/inference";
import { usePipeline } from "@/lib/pipeline-store";

export const Route = createFileRoute("/app/risk")({ component: RiskPage });

const DEFAULTS: RiskInputs = {
  latitude: 51.9,
  longitude: 4.48,
  ambientTemperature: 26,
  humidity: 68,
  windSpeed: 14,
  precipitation: 3,
  current: 13.4,
  voltage: 224,
  gasSignal: 12,
  vibration: 4.6,
  insulationResistance: 78,
  historicalFailures: 3,
  daysSinceLastFailure: 42,
  equipmentType: "Rotating machinery",
};

function RiskPage() {
  const [inputs, setInputs] = useState<RiskInputs>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const { risk, setRisk } = usePipeline();
  const update = <K extends keyof RiskInputs>(k: K, v: RiskInputs[K]) =>
    setInputs((p) => ({ ...p, [k]: v }));
  const analyze = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setRisk(runRisk(inputs));
    } catch (e) {
      console.error("Risk analysis error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Module 03"
        title={
          <>
            Risk <span className="text-gradient">Assessment</span>
          </>
        }
        description="Combine environmental, electrical and mechanical signals into a single, interpretable risk score."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input form */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <div className="text-sm text-muted-foreground">Signal inputs</div>

          <div className="mt-4 space-y-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Environmental
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Ambient temp (°C)" value={inputs.ambientTemperature} onChange={(v) => update("ambientTemperature", v)} />
              <NumField label="Humidity (%)" value={inputs.humidity} onChange={(v) => update("humidity", v)} />
              <NumField label="Wind speed (km/h)" value={inputs.windSpeed} onChange={(v) => update("windSpeed", v)} />
              <NumField label="Precipitation (mm)" value={inputs.precipitation} onChange={(v) => update("precipitation", v)} />
            </div>

            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pt-2">
              Electrical
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Current (A)" value={inputs.current} onChange={(v) => update("current", v)} step={0.1} />
              <NumField label="Voltage (V)" value={inputs.voltage} onChange={(v) => update("voltage", v)} />
              <NumField label="Gas signal" value={inputs.gasSignal} onChange={(v) => update("gasSignal", v)} />
              <NumField label="Insulation (MΩ)" value={inputs.insulationResistance} onChange={(v) => update("insulationResistance", v)} />
            </div>

            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pt-2">
              Mechanical
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Vibration" value={inputs.vibration} onChange={(v) => update("vibration", v)} step={0.1} />
              <NumField label="Historical failures" value={inputs.historicalFailures} onChange={(v) => update("historicalFailures", v)} />
              <NumField label="Days since last failure" value={inputs.daysSinceLastFailure} onChange={(v) => update("daysSinceLastFailure", v)} />
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">Equipment type</Label>
                <Select value={inputs.equipmentType} onValueChange={(v) => update("equipmentType", v)}>
                  <SelectTrigger className="rounded-xl bg-background/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rotating machinery">Rotating machinery</SelectItem>
                    <SelectItem value="Electrical drive">Electrical drive</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Compressor">Compressor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button onClick={analyze} disabled={loading} className="mt-6 w-full rounded-full">
            {loading ? "Assessing risk…" : "Assess risk"}
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-6 lg:col-span-3">
          {loading ? (
            <div className="h-96 animate-shimmer rounded-3xl border border-border/60" />
          ) : risk ? (
            <>
              {/* Composite score + contributions */}
              <div className="grid gap-5 md:grid-cols-3">
                <div className="md:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Composite risk score</div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      risk.level === "Critical"
                        ? "border-danger/60 bg-danger/10 text-danger"
                        : risk.level === "High"
                          ? "border-warning/60 bg-warning/10 text-warning"
                          : risk.level === "Medium"
                            ? "border-brand/60 bg-brand/10 text-brand"
                            : "border-success/60 bg-success/10 text-success"
                    }`}>
                      {risk.level} risk
                    </span>
                  </div>
                  <RiskGauge value={risk.score} />
                </div>

                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Main contributors
                  </div>
                  <div className="space-y-3">
                    <ContribBar icon={<CloudRain className="h-4 w-4" />} label="Environmental" value={risk.weather} />
                    <ContribBar icon={<Zap className="h-4 w-4" />} label="Electrical" value={risk.electrical} />
                    <ContribBar icon={<Gauge className="h-4 w-4" />} label="Mechanical" value={risk.mechanical} />
                  </div>
                </div>
              </div>

              {/* Risk explanation */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-foreground">
                  <ShieldAlert className="h-4 w-4 text-brand" /> Risk Explanation
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Environmental</div>
                    <div className="mt-2 text-sm text-foreground">{risk.environmentalImpact}</div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Operational Impact</div>
                    <div className="mt-2 text-sm text-foreground">{risk.operationalImpact}</div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Overall Assessment</div>
                    <div className="mt-2 text-sm text-foreground">
                      {risk.level === "Critical" || risk.level === "High"
                        ? "Immediate review is recommended. Elevated risk across multiple dimensions."
                        : risk.level === "Medium"
                          ? "Risk is elevated in one or more areas. Schedule inspection within the week."
                          : "Risk is within acceptable operational bounds. Continue standard monitoring."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Insight cards */}
              <div className="grid gap-4 md:grid-cols-2">
                <InsightCard tone="watch" icon={<CloudRain className="h-5 w-5" />} title="Environmental conditions">
                  {risk.environmentalImpact}
                </InsightCard>
                <InsightCard tone="watch" icon={<Gauge className="h-5 w-5" />} title="Operational patterns">
                  {risk.operationalImpact}
                </InsightCard>
              </div>
            </>
          ) : (
            <div className="grid h-96 place-items-center rounded-3xl border border-dashed border-border/60 text-center p-8">
              <div>
                <div className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-brand/10">
                  <ShieldAlert className="h-6 w-6 text-brand" />
                </div>
                <div className="mt-4 text-base font-medium text-foreground">Ready to assess</div>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Provide the signal readings on the left and run the assessment to generate a composite risk score.
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

function RiskGauge({ value }: { value: number }) {
  const angle = (value / 100) * 180 - 90;
  return (
    <div className="mt-4 flex flex-col items-center">
      <div className="relative h-40 w-72">
        <svg viewBox="0 0 200 110" className="h-full w-full">
          <defs>
            <linearGradient id="gauge" x1="0" x2="1">
              <stop offset="0%" stopColor="oklch(0.72 0.16 155)" />
              <stop offset="50%" stopColor="oklch(0.82 0.17 80)" />
              <stop offset="100%" stopColor="oklch(0.65 0.22 25)" />
            </linearGradient>
          </defs>
          <path d="M10 100 A90 90 0 0 1 190 100" stroke="url(#gauge)" strokeWidth="14" fill="none" strokeLinecap="round" />
          <g transform={`rotate(${angle} 100 100)`}>
            <line x1="100" y1="100" x2="100" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <circle cx="100" cy="100" r="6" fill="currentColor" />
          </g>
        </svg>
      </div>
      <div className="-mt-6 text-center">
        <div className="text-4xl font-semibold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground">out of 100</div>
      </div>
    </div>
  );
}

function ContribBar({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">{icon} {label}</span>
        <span className="font-medium text-foreground">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-brand-glow"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
