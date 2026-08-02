import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, Clock, Stethoscope, TrendingDown, Wrench } from "lucide-react";
import { PageHeader } from "@/components/app/app-shell";
import { Metric } from "@/components/app/insight-card";
import { Button } from "@/components/ui/button";
import { usePipeline } from "@/lib/pipeline-store";
import { KNOWLEDGE, formatCurrency, formatPct } from "@/lib/inference";

export const Route = createFileRoute("/app/diagnosis")({ component: DiagnosisPage });

const STORY_STEPS = [
  { id: "detected",  icon: AlertTriangle, label: "Detected",           color: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  { id: "diagnosis", icon: Stethoscope,   label: "Diagnosis",          color: "text-brand",   bg: "bg-brand/10",   border: "border-brand/30"  },
  { id: "impact",    icon: TrendingDown,  label: "Impact",             color: "text-danger",  bg: "bg-danger/10",  border: "border-danger/30" },
  { id: "action",    icon: Wrench,        label: "Recommended action", color: "text-brand",   bg: "bg-brand/10",   border: "border-brand/30"  },
  { id: "outcome",   icon: CheckCircle2,  label: "Expected outcome",   color: "text-success", bg: "bg-success/10", border: "border-success/30"},
];

function DiagnosisPage() {
  const { diagnosis, prediction } = usePipeline();
  const navigate = useNavigate();

  if (!diagnosis || !prediction) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Module 02"
          title={<>Failure <span className="text-gradient">Diagnosis</span></>}
          description="Diagnosis runs automatically the moment a failure pattern is detected in Module 01."
        />
        <div className="glass grid place-items-center rounded-3xl p-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/12 text-brand">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div className="mt-4 text-lg font-medium text-foreground">No active diagnosis</div>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Run a failure prediction first. If a failure pattern is detected, the diagnosis opens automatically here.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/app/prediction">Go to prediction <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    );
  }

  const kb = KNOWLEDGE[diagnosis.type];

  const storyContent: Record<string, React.ReactNode> = {
    detected: (
      <div className="space-y-2 text-sm text-foreground">
        <p>A <strong>{diagnosis.fullName}</strong> pattern was detected in the current sensor readings.</p>
        <p className="text-muted-foreground">Confidence: <strong>{formatPct(diagnosis.confidence)}</strong> · Risk level: <strong>{diagnosis.riskLevel}</strong></p>
      </div>
    ),
    diagnosis: (
      <div className="space-y-2 text-sm text-foreground">
        <p>{diagnosis.rootCause}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {kb.symptoms.map((s) => (
            <span key={s} className="rounded-full border border-white/30 bg-white/40 px-2.5 py-0.5 text-xs text-muted-foreground backdrop-blur-sm">{s}</span>
          ))}
        </div>
      </div>
    ),
    impact: (
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/30 bg-white/30 p-3 backdrop-blur-sm">
          <div className="text-xs text-muted-foreground">Estimated repair cost</div>
          <div className="mt-1 text-lg font-semibold text-foreground">{formatCurrency(diagnosis.estimatedCost)}</div>
          <div className="text-[10px] text-muted-foreground">Parts + labour</div>
        </div>
        <div className="rounded-xl border border-white/30 bg-white/30 p-3 backdrop-blur-sm">
          <div className="text-xs text-muted-foreground">Expected downtime</div>
          <div className="mt-1 text-lg font-semibold text-foreground">{diagnosis.expectedDowntimeHours}h</div>
          <div className="text-[10px] text-muted-foreground">If unaddressed</div>
        </div>
        <div className="col-span-2 rounded-xl border border-white/30 bg-white/30 p-3 backdrop-blur-sm">
          <div className="text-xs text-muted-foreground">Severity classification</div>
          <div className="mt-1 text-sm font-semibold text-foreground">{diagnosis.severity} — {diagnosis.riskLevel} risk</div>
        </div>
      </div>
    ),
    action: (
      <ul className="space-y-2.5">
        {diagnosis.recommendations.map((r, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand/15 text-[10px] font-semibold text-brand">{i + 1}</span>
            <span className="text-foreground">{r}</span>
          </li>
        ))}
      </ul>
    ),
    outcome: (() => {
      const HOURLY_RATE = 500;
      const productionLoss = diagnosis.expectedDowntimeHours * HOURLY_RATE;
      const totalLoss = diagnosis.estimatedCost + productionLoss;
      return (
        <div className="space-y-3 text-sm text-foreground">
          <p>With timely maintenance, full operational restoration is expected within <strong>{Math.max(1, Math.round(diagnosis.expectedDowntimeHours * 0.4))} hours</strong> of intervention.</p>
          <p className="text-muted-foreground">
            Addressing this now prevents an estimated total loss of{" "}
            <strong className="text-foreground">{formatCurrency(totalLoss)}</strong> from unplanned downtime.
          </p>
          <div className="rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-xs text-muted-foreground space-y-1 backdrop-blur-sm">
            <div className="flex justify-between">
              <span>Repair cost (parts + labour)</span>
              <span className="font-medium text-foreground">{formatCurrency(diagnosis.estimatedCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>Production loss ({diagnosis.expectedDowntimeHours}h × $500/h)</span>
              <span className="font-medium text-foreground">{formatCurrency(productionLoss)}</span>
            </div>
            <div className="flex justify-between border-t border-white/20 pt-1 font-semibold text-foreground">
              <span>Total estimated loss</span>
              <span>{formatCurrency(totalLoss)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 pt-0.5">$500/h is a conservative industry default for unplanned manufacturing downtime.</p>
          </div>
        </div>
      );
    })(),
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Module 02"
        title={<><span className="text-gradient">{diagnosis.fullName}</span></>}
        description="Root cause identified. Review the complete maintenance story below."
        actions={
          <Button className="rounded-full" onClick={() => navigate({ to: "/app/assistant" })}>
            <Bot className="mr-2 h-4 w-4" /> Open Maintenance Copilot
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Diagnostic confidence" value={formatPct(diagnosis.confidence)} />
        <Metric label="Severity"              value={diagnosis.severity} />
        <Metric label="Estimated cost"        value={formatCurrency(diagnosis.estimatedCost)} hint="Repair + parts" />
        <Metric label="Expected downtime"     value={`${diagnosis.expectedDowntimeHours}h`} />
      </div>

      {/* Story timeline */}
      <div className="glass rounded-3xl p-6">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-brand" /> Maintenance story
        </div>
        <div className="space-y-0">
          {STORY_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === STORY_STEPS.length - 1;
            return (
              <div key={step.id} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border backdrop-blur-sm ${step.border} ${step.bg}`}>
                    <Icon className={`h-4 w-4 ${step.color}`} />
                  </div>
                  {!isLast && <div className="my-1.5 w-px flex-1 bg-white/30" />}
                </div>
                <div className="flex-1 pb-6">
                  <div className={`mb-2 text-xs font-semibold uppercase tracking-wider ${step.color}`}>{step.label}</div>
                  {storyContent[step.id]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Knowledge base */}
      <div className="glass rounded-3xl p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Bot className="h-4 w-4 text-brand" /> Maintenance knowledge base
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {([
            ["Cause",                   [kb.cause]],
            ["Repair procedure",        kb.repair],
            ["Safety precautions",      kb.safety],
            ["Recommended spare parts", kb.spares],
          ] as [string, string[]][]).map(([title, items]) => (
            <div key={title} className="rounded-2xl border border-white/30 bg-white/30 p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {items.map((item, k) => <li key={k} className="text-foreground/85">• {item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          Sources:&nbsp;
          {kb.sources.map((s) => (
            <span key={s.ref} className="rounded-full border border-white/30 bg-white/30 px-2 py-0.5 backdrop-blur-sm">{s.title} — {s.ref}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
