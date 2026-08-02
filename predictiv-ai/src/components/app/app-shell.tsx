import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Bot,
  FileText,
  LayoutGrid,
  Search,
  ShieldAlert,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type {
  DiagnosisResult,
  PredictionInputs,
  PredictionResult,
  PriorityResult,
  RiskResult,
} from "@/lib/inference";
import { PipelineContext } from "@/lib/pipeline-store";
import { Input } from "@/components/ui/input";
import { LogoMark } from "@/components/site/logo-mark";

const nav = [
  { to: "/app", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/app/prediction", label: "Failure Prediction", icon: Activity },
  { to: "/app/diagnosis", label: "Failure Diagnosis", icon: Stethoscope },
  { to: "/app/risk", label: "Risk Assessment", icon: ShieldAlert },
  { to: "/app/priority", label: "Maintenance Priority", icon: Wrench },
  { to: "/app/assistant", label: "Maintenance Copilot", icon: Bot },
  { to: "/app/report", label: "Executive Report", icon: FileText },
];

export function AppShell() {
  const [predictionInputs, setPI] = useState<PredictionInputs | null>(null);
  const [prediction, setPR] = useState<PredictionResult | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [priority, setPriority] = useState<PriorityResult | null>(null);

  const value = useMemo(
    () => ({
      predictionInputs,
      prediction,
      diagnosis,
      risk,
      priority,
      setPrediction: (i: PredictionInputs, r: PredictionResult) => {
        setPI(i);
        setPR(r);
      },
      setDiagnosis,
      setRisk,
      setPriority,
      reset: () => {
        setPI(null);
        setPR(null);
        setDiagnosis(null);
        setRisk(null);
        setPriority(null);
      },
    }),
    [predictionInputs, prediction, diagnosis, risk, priority],
  );

  const loc = useLocation();
  const navigate = useNavigate();

  return (
    <PipelineContext.Provider value={value}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 md:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="hidden border-r border-border md:block">
            <div className="sticky top-0 flex h-screen flex-col p-4">
              {/* Logo */}
              <Link to="/" className="mb-8 mt-2 flex items-center gap-3 px-2">
                <LogoMark size={36} />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold tracking-tight text-foreground">
                    Safe<span className="text-brand">Factory</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Intelligence
                  </span>
                </div>
              </Link>

              <nav className="flex flex-col gap-0.5">
                {nav.map((n) => {
                  const active = n.exact
                    ? loc.pathname === n.to
                    : loc.pathname.startsWith(n.to);
                  const Icon = n.icon;
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        active
                          ? "bg-brand/10 font-medium text-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 flex-shrink-0 ${active ? "text-brand" : "text-muted-foreground group-hover:text-foreground"}`}
                      />
                      <span>{n.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Session status */}
              <div className="mt-auto rounded-2xl border border-border bg-secondary/60 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Session
                </div>
                <div className="mt-1.5 text-sm font-medium text-foreground">
                  Decision support active
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  Run analyses to populate the report
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0">
            <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md md:px-8">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search modules or go to analysis…"
                  className="h-9 rounded-full border-border bg-secondary/50 pl-9 text-foreground placeholder:text-muted-foreground"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") navigate({ to: "/app/prediction" });
                  }}
                />
              </div>
              <button className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand" />
              </button>
              <div
                className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-brand-foreground"
                style={{ background: "linear-gradient(135deg, oklch(0.66 0.16 55), oklch(0.50 0.14 50))" }}
              >
                MA
              </div>
            </div>

            <div key={loc.pathname} className="animate-rise px-4 py-6 md:px-8 md:py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </PipelineContext.Provider>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
