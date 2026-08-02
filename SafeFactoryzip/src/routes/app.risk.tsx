import { createFileRoute } from "@tanstack/react-router";
import { CloudRain, Gauge, ShieldAlert, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/app/app-shell";
import { InsightCard } from "@/components/app/insight-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRisk, type RiskInputs } from "@/lib/inference";
import { usePipeline } from "@/lib/pipeline-store";

export const Route = createFileRoute("/app/risk")({ component: RiskPage });

const DEFAULTS: RiskInputs = {
  latitude: 24.7, longitude: 46.7,
  ambientTemperature: 35, humidity: 60, windSpeed: 27, precipitation: 10,
  current: 13, voltage: 19, gasSignal: 0,
  vibration: 0.75, insulationResistance: 5.5,
  historicalFailures: 2, daysSinceLastFailure: 250,
  equipmentType: "Transformer",
};

const RISK_RANGES = {
  ambientTemperature:   { min: 15,   max: 55,   unit: "°C" },
  humidity:             { min: 20,   max: 100,  unit: "%" },
  windSpeed:            { min: 0,    max: 54,   unit: "km/h" },
  precipitation:        { min: 0,    max: 20,   unit: "mm" },
  current:              { min: 1,    max: 25,   unit: "A" },
  voltage:              { min: 6,    max: 33,   unit: "kV" },
  vibration:            { min: 0.05, max: 1.5,  unit: "g" },
  insulationResistance: { min: 1,    max: 10,   unit: "MΩ" },
  historicalFailures:   { min: 0,    max: 5,    unit: "" },
  daysSinceLastFailure: { min: 0,    max: 500,  unit: "days" },
} as const;

function RiskPage() {
  const [inputs, setInputs] = useState<RiskInputs>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { risk, setRisk } = usePipeline();
  const update = <K extends keyof RiskInputs>(k: K, v: RiskInputs[K]) => setInputs((p) => ({ ...p, [k]: v }));
  const analyze = async () => {
    setLoading(true);
    setApiError(null);
    try { setRisk(await apiRisk(inputs)); }
    catch (e) {
      console.error("Risk analysis error:", e);
      setApiError("Could not reach the analysis engine. Please try again in a moment.");
    }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Module 03"
        title={<>Risk <span className="text-gradient">Assessment</span></>}
        description="Combine environmental, electrical and mechanical signals into a single, interpretable risk score."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input form */}
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="text-sm text-muted-foreground mb-4">Signal inputs</div>
          <div className="space-y-4">
            <SectionLabel>Environmental</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <RangedField label="Ambient temp (°C)"  value={inputs.ambientTemperature}  onChange={(v) => update("ambientTemperature", v)}  range={RISK_RANGES.ambientTemperature} />
              <RangedField label="Humidity (%)"        value={inputs.humidity}             onChange={(v) => update("humidity", v)}             range={RISK_RANGES.humidity} />
              <RangedField label="Wind speed (km/h)"   value={inputs.windSpeed}            onChange={(v) => update("windSpeed", v)}            range={RISK_RANGES.windSpeed} />
              <RangedField label="Precipitation (mm)"  value={inputs.precipitation}        onChange={(v) => update("precipitation", v)}        range={RISK_RANGES.precipitation} />
            </div>

            <SectionLabel>Electrical</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <RangedField label="Current (A)"         value={inputs.current}              onChange={(v) => update("current", v)}              range={RISK_RANGES.current} step={0.1} />
              <RangedField label="Voltage (kV)"        value={inputs.voltage}              onChange={(v) => update("voltage", v)}              range={RISK_RANGES.voltage} step={0.1} />
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">Gas alarm</Label>
                <Select value={String(inputs.gasSignal)} onValueChange={(v) => update("gasSignal", Number(v))}>
                  <SelectTrigger className="rounded-xl border-white/30 bg-white/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No alarm (0)</SelectItem>
                    <SelectItem value="1">Alarm detected (1)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-1 text-[10px] text-muted-foreground/60">Fault gas / GASP alert</div>
              </div>
              <RangedField label="Insulation (MΩ)"     value={inputs.insulationResistance} onChange={(v) => update("insulationResistance", v)} range={RISK_RANGES.insulationResistance} step={0.1} />
            </div>

            <SectionLabel>Mechanical</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <RangedField label="Vibration (g)"             value={inputs.vibration}           onChange={(v) => update("vibration", v)}           range={RISK_RANGES.vibration} step={0.05} />
              <RangedField label="Historical failures"       value={inputs.historicalFailures}  onChange={(v) => update("historicalFailures", v)}  range={RISK_RANGES.historicalFailures} />
              <RangedField label="Days since last failure"   value={inputs.daysSinceLastFailure} onChange={(v) => update("daysSinceLastFailure", v)} range={RISK_RANGES.daysSinceLastFailure} />
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">Equipment type</Label>
                <Select value={inputs.equipmentType} onValueChange={(v) => update("equipmentType", v)}>
                  <SelectTrigger className="rounded-xl border-white/30 bg-white/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Cable","Circuit Breaker","Relay","Switch","Transformer"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {apiError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-danger/40 bg-danger/8 p-3">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <div className="text-xs text-danger">{apiError}</div>
            </div>
          )}
          <Button onClick={analyze} disabled={loading} className="mt-6 w-full rounded-full">
            {loading ? "Assessing risk…" : "Assess risk"}
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-6 lg:col-span-3">
          {loading ? (
            <div className="h-96 animate-shimmer rounded-3xl border border-white/30" />
          ) : risk ? (
            <>
              <div className="grid gap-5 md:grid-cols-3">
                <div className="glass md:col-span-2 rounded-3xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Composite risk score</div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm ${
                      risk.level === "Critical" ? "border-danger/60 bg-danger/10 text-danger"
                      : risk.level === "High"   ? "border-warning/60 bg-warning/10 text-warning"
                      : risk.level === "Medium" ? "border-brand/60 bg-brand/10 text-brand"
                      : "border-success/60 bg-success/10 text-success"
                    }`}>
                      {risk.level} risk
                    </span>
                  </div>
                  <RiskGauge value={risk.score} />
                </div>

                <div className="glass rounded-3xl p-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Main contributors
                  </div>
                  <div className="space-y-3">
                    <ContribBar icon={<CloudRain className="h-4 w-4" />} label="Environmental" value={risk.weather} />
                    <ContribBar icon={<Zap className="h-4 w-4" />}       label="Electrical"    value={risk.electrical} />
                    <ContribBar icon={<Gauge className="h-4 w-4" />}     label="Mechanical"    value={risk.mechanical} />
                  </div>
                </div>
              </div>

              <div className="glass rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-foreground">
                  <ShieldAlert className="h-4 w-4 text-brand" /> Risk Explanation
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: "Environmental",     text: risk.environmentalImpact },
                    { label: "Operational Impact", text: risk.operationalImpact },
                    { label: "Overall Assessment", text: risk.level === "Critical" || risk.level === "High"
                        ? "Immediate review is recommended. Elevated risk across multiple dimensions."
                        : risk.level === "Medium"
                          ? "Risk is elevated in one or more areas. Schedule inspection within the week."
                          : "Risk is within acceptable operational bounds. Continue standard monitoring." },
                  ].map(({ label, text }) => (
                    <div key={label} className="rounded-xl border border-white/30 bg-white/30 p-4 backdrop-blur-sm">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
                      <div className="mt-2 text-sm text-foreground">{text}</div>
                    </div>
                  ))}
                </div>
              </div>

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
            <div className="glass grid h-96 place-items-center rounded-3xl text-center p-8">
              <div>
                <div className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-brand/12">
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

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pt-2">
      {children}
    </div>
  );
}

function RangedField({
  label, value, onChange, step = 1, range,
}: {
  label: string; value: number; onChange: (v: number) => void; step?: number; range: { min: number; max: number; unit: string };
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number" step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="rounded-xl border-white/30 bg-white/40"
      />
      <div className="mt-1 text-[10px] text-muted-foreground/60">
        typical: {range.min}–{range.max}{range.unit ? ` ${range.unit}` : ""}
      </div>
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
              <stop offset="0%"   stopColor="oklch(0.72 0.16 155)" />
              <stop offset="50%"  stopColor="oklch(0.82 0.17 80)" />
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
        <div className="font-display text-4xl font-normal tracking-tight">{value}</div>
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
      <div className="h-2 overflow-hidden rounded-full bg-white/30">
        <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-glow" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
