import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Download, FileText } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { usePipeline } from "@/lib/pipeline-store";
import { KNOWLEDGE, formatCurrency, formatPct } from "@/lib/inference";
import { LogoMark } from "@/components/site/logo-mark";

export const Route = createFileRoute("/app/report")({ component: ReportPage });

function ReportPage() {
  const { prediction, diagnosis, risk, priority } = usePipeline();
  const anything = prediction || diagnosis || risk || priority;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Executive Report"
        title={<>Maintenance <span className="text-gradient">intelligence brief</span></>}
        description="A synthesized, management-ready summary composed from the analyses completed in this session."
        actions={
          <Button onClick={() => window.print()} className="rounded-full">
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        }
      />

      {!anything ? (
        <div className="glass grid place-items-center rounded-3xl p-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/12 text-brand">
            <FileText className="h-6 w-6" />
          </div>
          <div className="mt-4 text-lg font-medium text-foreground">Nothing to report yet</div>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Run a failure prediction, risk assessment or maintenance priority to compose an executive brief.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/app/prediction">Start with a prediction</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6 print:text-black">
          {/* Report header */}
          <div className="glass flex items-center justify-between rounded-3xl p-6 print:border-gray-200">
            <div className="flex items-center gap-4">
              <LogoMark size={40} />
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  SafeFactory · Executive Report
                </div>
                <div className="font-display text-xl font-normal tracking-tight text-foreground">
                  Maintenance Intelligence Brief
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>Assessment date</div>
              <div className="font-medium text-foreground">
                {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
              <div>{new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          </div>

          {/* Summary strip */}
          <div className="rounded-3xl border border-brand/20 bg-brand/6 p-6 backdrop-blur-xl" style={{ boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)" }}>
            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-brand">Assessment Summary</div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <SummaryCell label="Equipment"  value={prediction ? `Class ${prediction.approachingType ? "— " + prediction.approachingType : "assessed"}` : "—"} />
              <SummaryCell
                label="Prediction"
                value={prediction ? (prediction.status === "healthy" ? "No failure expected" : prediction.status === "watch" ? "Monitor — early signals" : prediction.status === "at_risk" ? "At risk" : "Requires immediate review") : "—"}
                tone={prediction?.status}
              />
              <SummaryCell label="Risk"     value={risk ? `${risk.level} (${risk.score}/100)` : "—"} />
              <SummaryCell
                label="Priority"
                value={priority ? (priority.priority === "Immediate" ? "Do Today" : priority.priority === "High" ? "Do This Week" : "Monitor") : "—"}
                tone={priority ? (priority.priority === "Immediate" ? "critical" : priority.priority === "High" ? "at_risk" : "healthy") : undefined}
              />
            </div>

            {(diagnosis || priority) && (
              <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <SummaryCell label="Estimated Cost"      value={diagnosis ? formatCurrency(diagnosis.estimatedCost) : "—"} />
                <SummaryCell label="Estimated Downtime"  value={diagnosis ? `${diagnosis.expectedDowntimeHours}h` : "—"} />
                <SummaryCell label="Recommended Action"  value={diagnosis?.recommendations[0] ?? (priority?.rationale?.split(".")[0] ?? "—")} />
                <SummaryCell label="Failure Risk"        value={prediction ? formatPct(prediction.probability) : "—"} />
              </div>
            )}
          </div>

          {/* Detailed findings */}
          <div className="grid gap-4 md:grid-cols-2">
            <Block title="Failure Prediction" icon={<FileText className="h-4 w-4 text-brand" />}>
              {prediction ? (
                <>
                  <p className="font-medium text-foreground">{prediction.headline}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{prediction.narrative}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MiniCell label="Failure risk"  value={formatPct(prediction.probability)} />
                    <MiniCell label="Confidence"    value={formatPct(prediction.confidence)} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No prediction has been run.</p>
              )}
            </Block>

            <Block title="Root Cause Analysis" icon={<FileText className="h-4 w-4 text-brand" />}>
              {diagnosis ? (
                <>
                  <p className="font-semibold text-foreground">{diagnosis.fullName}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{diagnosis.rootCause}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MiniCell label="Severity"          value={diagnosis.severity} />
                    <MiniCell label="Risk level"        value={diagnosis.riskLevel} />
                    <MiniCell label="Estimated cost"    value={formatCurrency(diagnosis.estimatedCost)} />
                    <MiniCell label="Expected downtime" value={`${diagnosis.expectedDowntimeHours}h`} />
                  </div>
                </>
              ) : prediction ? (
                <p className="text-sm text-muted-foreground">No failure pattern detected. Equipment operating within normal parameters.</p>
              ) : (
                <p className="text-sm text-muted-foreground">Run a prediction first.</p>
              )}
            </Block>

            <Block title="Risk Analysis" icon={<FileText className="h-4 w-4 text-brand" />}>
              {risk ? (
                <>
                  <p className="font-semibold text-foreground">{risk.level} risk — {risk.score} / 100</p>
                  <p className="mt-2 text-sm text-muted-foreground">{risk.environmentalImpact}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{risk.operationalImpact}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No risk assessment has been run.</p>
              )}
            </Block>

            <Block title="Maintenance Recommendation" icon={<FileText className="h-4 w-4 text-brand" />}>
              {priority ? (
                <>
                  <p className="font-semibold text-foreground">
                    {priority.priority === "Immediate" ? "Do Today" : priority.priority === "High" ? "Do This Week" : "Monitor"}{" "}
                    — {priority.window}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{priority.rationale}</p>
                  <div className="mt-4 rounded-xl border border-white/30 bg-white/30 p-3 text-sm backdrop-blur-sm">
                    <div className="text-xs text-muted-foreground">Business impact</div>
                    <div className="mt-1 font-semibold text-foreground">{formatCurrency(priority.financialImpact)}</div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No priority has been determined.</p>
              )}
            </Block>
          </div>

          {diagnosis && (
            <div className="glass rounded-3xl p-6">
              <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommended Actions</div>
              <ol className="grid gap-2 md:grid-cols-2">
                {diagnosis.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border border-white/30 bg-white/30 p-3 text-sm backdrop-blur-sm">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-semibold text-brand">{i + 1}</span>
                    <span className="text-foreground">{r}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-6">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Maintenance Checklist</div>
                <ul className="grid gap-2 md:grid-cols-2">
                  {KNOWLEDGE[diagnosis.type].checklist.map((c) => (
                    <li key={c} className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/30 p-3 text-sm backdrop-blur-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                      <span className="text-foreground">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Knowledge Base References</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {KNOWLEDGE[diagnosis.type].sources.map((s) => (
                    <span key={s.ref} className="rounded-full border border-white/30 bg-white/30 px-3 py-1 text-muted-foreground backdrop-blur-sm">
                      {s.title} — {s.ref}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 glass rounded-2xl px-5 py-3 text-xs text-muted-foreground">
            <LogoMark size={16} />
            Generated from the latest equipment assessment. SafeFactory is a decision-support platform. All recommendations should be reviewed by a qualified maintenance professional before action.
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const toneColor = tone === "critical" ? "text-danger" : tone === "at_risk" ? "text-warning" : tone === "healthy" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-2xl border border-brand/15 bg-white/30 p-4 backdrop-blur-sm">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1.5 text-sm font-semibold leading-tight ${toneColor}`}>{value}</div>
    </div>
  );
}

function MiniCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/30 bg-white/30 p-3 text-sm backdrop-blur-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Block({ title, children, icon }: { title: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}{title}
      </div>
      <div>{children}</div>
    </div>
  );
}
