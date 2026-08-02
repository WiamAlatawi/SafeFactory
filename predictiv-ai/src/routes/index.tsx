import { createFileRoute, Link } from "@tanstack/react-router";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  useRef,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  LayoutGrid,
  ShieldAlert,
  Stethoscope,
  Wrench,
  X,
  Building2,
  Factory,
  TrendingUp,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { LogoMark } from "@/components/site/logo-mark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafeFactory — Predictive Maintenance Intelligence" },
      {
        name: "description",
        content:
          "SafeFactory helps maintenance teams identify equipment failures earlier, understand their causes, assess operational risk and generate management-ready reports.",
      },
    ],
  }),
  component: Landing,
});

// ─── Shared ────────────────────────────────────────────────────────────────────

const E = [0.22, 1, 0.36, 1] as const;

function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useSpring(0, { stiffness: 200, damping: 24 });
  const rotY = useSpring(0, { stiffness: 200, damping: 24 });
  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const { left, top, width, height } = el.getBoundingClientRect();
      rotX.set(-((e.clientY - top) / height - 0.5) * 6);
      rotY.set(((e.clientX - left) / width - 0.5) * 6);
    },
    [rotX, rotY],
  );
  const reset = useCallback(() => {
    rotX.set(0);
    rotY.set(0);
  }, [rotX, rotY]);
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
      whileHover={{ y: -4, boxShadow: "0 16px 48px -12px oklch(0.66 0.16 55 / 0.13)" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/8 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand">
      {children}
    </div>
  );
}

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.6, delay, ease: E }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Landing ───────────────────────────────────────────────────────────────────

function Landing() {
  return (
    <div
      className="min-h-screen bg-background text-foreground antialiased"
      style={{ overflowX: "clip" }}
    >
      <SiteNav />
      {/* S1 */ }<HeroSection />
      {/* S2 */ }<IndustrySnapshotSection />
      {/* S3 */ }<TheChallengeSection />
      {/* S4 */ }<IntroducingSection />
      {/* S5 */ }<WorkflowSection />
      {/* S6 */ }<OutcomesSection />
      {/* S7 */ }<SignatureSection />
      {/* S8 */ }<WhoSection />
      {/* S9 */ }<TrustSection />
      {/* S10 */ }<VisionSection />
      {/* S11 */ }<CTASection />
      <SiteFooter />
    </div>
  );
}

// ─── S1 · Hero ────────────────────────────────────────────────────────────────

function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yText = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const opText = useTransform(scrollYProgress, [0, 0.42], [1, 0]);
  const yIllu = useTransform(scrollYProgress, [0, 1], [0, 55]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const blobX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-18, 18]), {
    stiffness: 48,
    damping: 18,
  });
  const blobY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-12, 12]), {
    stiffness: 48,
    damping: 18,
  });
  const handleMouse = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const { clientX, clientY, currentTarget } = e;
      const { left, top, width, height } = currentTarget.getBoundingClientRect();
      mouseX.set((clientX - left) / width - 0.5);
      mouseY.set((clientY - top) / height - 0.5);
    },
    [mouseX, mouseY],
  );

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen flex-col justify-center overflow-hidden pt-24 pb-16"
      onMouseMove={handleMouse}
    >
      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(20,24,29,1) 1px, transparent 1px), linear-gradient(90deg, rgba(20,24,29,1) 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
      />
      {/* Glow blob */}
      <motion.div
        className="pointer-events-none absolute -left-40 top-1/3 h-[440px] w-[440px] rounded-full"
        style={{
          x: blobX,
          y: blobY,
          background:
            "radial-gradient(circle, oklch(0.66 0.16 55 / 0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
        {/* Left */}
        <motion.div style={{ y: yText, opacity: opText }}>
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: E }}
          >
            <SectionLabel>Maintenance Intelligence Platform</SectionLabel>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: E }}
            className="mt-6 font-display text-5xl font-normal leading-[1.06] tracking-tight md:text-6xl lg:text-[60px]"
          >
            Move from Reactive Maintenance{" "}
            <em className="not-italic text-gradient">
              to Proactive Decisions.
            </em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: E }}
            className="mt-6 max-w-[460px] text-lg leading-relaxed text-muted-foreground"
          >
            Maintenance teams that act before failures happen reduce unplanned
            downtime and make better use of limited resources. SafeFactory gives
            them the structured decision support to do exactly that.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: E }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <motion.div
              whileHover={{
                y: -2,
                boxShadow: "0 10px 30px -8px oklch(0.66 0.16 55 / 0.26)",
              }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-foreground px-7 text-background hover:bg-foreground/90"
              >
                <Link to="/app">
                  Start Analysis <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-border px-7 hover:bg-secondary/60"
              >
                <a href="#workflow">Explore Platform</a>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.46 }}
            className="mt-9 flex flex-col gap-2"
          >
            {[
              "Built for Maintenance Teams",
              "Explainable Recommendations",
              "Decision Support, Not Automation",
            ].map((t) => (
              <span
                key={t}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Right */}
        <motion.div style={{ y: yIllu }}>
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.15, ease: E }}
          >
            <HeroMockup />
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ opacity: opText }}
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-border/50 py-1.5">
          <motion.div
            className="h-1.5 w-1 rounded-full bg-brand"
            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}

function HeroMockup() {
  const fields = [
    { label: "Equipment class", value: "Medium-duty (M)" },
    { label: "Air temperature", value: "298.5 K" },
    { label: "Process temperature", value: "308.9 K" },
    { label: "Rotational speed", value: "1,520 rpm" },
    { label: "Torque", value: "42.8 Nm" },
    { label: "Tool wear", value: "108 min" },
  ];
  return (
    <div className="relative mx-auto max-w-[500px]">
      <div className="pointer-events-none absolute -inset-12 rounded-[48px] bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,oklch(0.66_0.16_55_/_0.06),transparent)]" />
      <div className="relative rounded-3xl border border-border bg-card shadow-[0_8px_48px_-12px_oklch(0_0_0_/_0.08)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div
              className="grid h-7 w-7 place-items-center rounded-lg"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.66 0.16 55), oklch(0.50 0.14 50))",
              }}
            >
              <Activity className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">
                Equipment Analysis
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Failure prediction · Module 01
              </div>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />{" "}
            Ready
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-border border-b border-border">
          {fields.map((f) => (
            <div key={f.label} className="flex flex-col gap-0.5 px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {f.label}
              </div>
              <div className="text-sm font-medium text-foreground">{f.value}</div>
            </div>
          ))}
        </div>
        <div className="px-5 py-4">
          <div
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.66 0.16 55), oklch(0.50 0.14 50))",
            }}
          >
            <Activity className="h-3.5 w-3.5" /> Analyze equipment
          </div>
        </div>
      </div>
      {/* Result badge */}
      <motion.div
        className="absolute -bottom-5 -right-4 w-52 rounded-2xl border border-border bg-card p-3.5 shadow-lg"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-success/10">
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              No Failure Expected
            </div>
            <div className="text-[10px] text-muted-foreground">
              Within normal parameters
            </div>
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          {[
            { l: "Confidence", v: "94%" },
            { l: "Failure risk", v: "3.2%", green: true },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-lg border border-border bg-secondary/50 px-2.5 py-1.5"
            >
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {s.l}
              </div>
              <div
                className={`text-sm font-semibold ${s.green ? "text-success" : "text-foreground"}`}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      {/* Label */}
      <motion.div
        className="absolute -left-3 -top-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-1.5 shadow-md"
        animate={{ y: [0, 3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="h-1.5 w-1.5 rounded-full bg-brand" />
        <span className="text-xs font-medium text-foreground">
          Worker enters readings
        </span>
      </motion.div>
    </div>
  );
}

// ─── S2 · Industry Snapshot ────────────────────────────────────────────────────

const saudiStats = [
  {
    figure: "36",
    unit: "Industrial Cities",
    desc: "MODON — Saudi Industrial Property Authority — operates 36 industrial cities and economic zones across the Kingdom.",
    icon: Building2,
    source: "MODON",
  },
  {
    figure: "4,000+",
    unit: "Factories to be Digitalised",
    desc: "The Future Factories Program targets the digital transformation of over 4,000 Saudi manufacturing facilities by 2030.",
    icon: Factory,
    source: "Ministry of Industry and Mineral Resources",
  },
  {
    figure: "20%",
    unit: "GDP Contribution Target",
    desc: "Saudi Vision 2030 aims to more than double the manufacturing sector's contribution to GDP — from approximately 11% to 20%.",
    icon: TrendingUp,
    source: "Saudi Vision 2030 — National Industrial Strategy",
  },
  {
    figure: "SR 895B",
    unit: "Industrial Investments",
    desc: "Saudi Arabia attracted SR 895 billion in industrial investments through 2022, with continued growth projected through the decade.",
    icon: Landmark,
    source: "Ministry of Industry and Mineral Resources — Annual Report 2022",
  },
];

function IndustrySnapshotSection() {
  return (
    <section id="snapshot" className="py-28 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-6">
        <FadeUp className="mx-auto max-w-2xl text-center">
          <SectionLabel>Industry Snapshot</SectionLabel>
          <h2 className="mt-4 font-display text-4xl font-normal tracking-tight md:text-5xl">
            Saudi Arabia's industrial sector{" "}
            <span className="italic text-gradient">is scaling rapidly.</span>
          </h2>
        </FadeUp>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {saudiStats.map((s, i) => {
            const Icon = s.icon;
            return (
              <FadeUp key={s.unit} delay={i * 0.08}>
                <TiltCard className="h-full rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10">
                    <Icon className="h-4.5 w-4.5 text-brand" />
                  </div>
                  <div className="mt-3 font-display text-3xl font-normal text-gradient leading-none">
                    {s.figure}
                  </div>
                  <div className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-foreground">
                    {s.unit}
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60">
                      {s.source}
                    </span>
                  </div>
                </TiltCard>
              </FadeUp>
            );
          })}
        </div>

        <FadeUp delay={0.34} className="mt-10 text-center">
          <p className="mx-auto max-w-2xl text-sm italic leading-relaxed text-muted-foreground">
            "As Saudi Arabia's industrial sector continues to expand, maintenance
            decisions become increasingly critical to operational continuity."
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── S3 · The Challenge ────────────────────────────────────────────────────────

const challengeRows = [
  {
    traditional: "Reactive maintenance — teams respond to breakdowns as they happen",
    modern: "Proactive planning — potential issues are identified before they cause failure",
  },
  {
    traditional: "Time-based maintenance — scheduled by calendar, not by equipment condition",
    modern: "Condition-informed decisions — maintenance triggered by actual operational signals",
  },
  {
    traditional: "Disconnected information — data spread across spreadsheets and separate systems",
    modern: "Connected workflows — analysis, diagnosis and reporting in one structured process",
  },
  {
    traditional: "Manual prioritization — experience-based decisions under time pressure",
    modern: "Risk-informed prioritization — ranked by operational impact and urgency",
  },
  {
    traditional: "Technical complexity — outputs only interpretable by specialists",
    modern: "Clear operational insights — findings communicated in plain language to all stakeholders",
  },
];

function TheChallengeSection() {
  return (
    <section id="challenge" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeUp className="mx-auto max-w-2xl text-center">
          <SectionLabel>The Challenge</SectionLabel>
          <h2 className="mt-4 font-display text-4xl font-normal tracking-tight md:text-5xl">
            Why maintenance{" "}
            <span className="italic text-gradient">needs to evolve.</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.1} className="mt-14 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          {/* Column headers */}
          <div className="grid grid-cols-2 border-b border-border bg-secondary/20">
            <div className="flex items-center gap-2 border-r border-border px-6 py-4">
              <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Traditional Maintenance
              </span>
            </div>
            <div className="flex items-center gap-2 px-6 py-4">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand" />
              <span className="text-xs font-semibold uppercase tracking-widest text-brand">
                Modern Maintenance Decision Support
              </span>
            </div>
          </div>

          {challengeRows.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.42, delay: i * 0.06, ease: E }}
              className={`grid grid-cols-2 ${i < challengeRows.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="flex items-start gap-3 border-r border-border px-6 py-4">
                <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
                <span className="text-sm text-muted-foreground">{row.traditional}</span>
              </div>
              <div className="flex items-start gap-3 bg-brand/[0.025] px-6 py-4">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                <span className="text-sm text-foreground">{row.modern}</span>
              </div>
            </motion.div>
          ))}
        </FadeUp>
      </div>
    </section>
  );
}

// ─── S4 · Introducing SafeFactory ─────────────────────────────────────────────

function IntroducingSection() {
  return (
    <section id="introducing" className="py-28 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <FadeUp>
            <SectionLabel>Introducing SafeFactory</SectionLabel>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="mt-4 font-display text-4xl font-normal tracking-tight md:text-5xl">
              A platform built for maintenance{" "}
              <span className="italic text-gradient">
                teams, not data teams.
              </span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="mt-8 mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
              SafeFactory is a decision-support platform that helps maintenance
              professionals understand equipment conditions, assess operational
              risk and act with confidence — without requiring any background in
              data science or machine learning.
            </p>
          </FadeUp>
          <FadeUp delay={0.3} className="mt-10">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-foreground px-8 text-background hover:bg-foreground/90"
            >
              <Link to="/app">
                Start Analysis <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ─── S5 · Workflow ─────────────────────────────────────────────────────────────

const workflowSteps = [
  { label: "Equipment Data", icon: Activity, tag: "Input" },
  { label: "Failure Prediction", icon: Activity, tag: "Step 01" },
  { label: "Failure Diagnosis", icon: Stethoscope, tag: "Step 02" },
  { label: "Risk Assessment", icon: ShieldAlert, tag: "Step 03" },
  { label: "Maintenance Priority", icon: Wrench, tag: "Step 04" },
  { label: "Maintenance Copilot", icon: Bot, tag: "Step 05" },
  { label: "Executive Report", icon: FileText, tag: "Step 06" },
];

function WorkflowSection() {
  return (
    <section id="workflow" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeUp className="mx-auto max-w-2xl text-center">
          <SectionLabel>One Connected Workflow</SectionLabel>
          <h2 className="mt-4 font-display text-4xl font-normal tracking-tight md:text-5xl">
            From equipment data{" "}
            <span className="italic text-gradient">to executive report.</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.1} className="mt-14">
          {/* Desktop horizontal flow */}
          <div className="hidden flex-wrap items-stretch justify-center gap-0 lg:flex">
            {workflowSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.07, ease: E }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="flex w-[108px] cursor-default flex-col items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-4 shadow-sm"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10">
                      <Icon className="h-4 w-4 text-brand" />
                    </div>
                    <span className="text-center text-[11px] font-semibold leading-tight text-foreground">
                      {step.label}
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                      {step.tag}
                    </span>
                  </motion.div>
                  {i < workflowSteps.length - 1 && (
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.18,
                      }}
                      className="mx-1 shrink-0"
                    >
                      <ArrowRight className="h-3.5 w-3.5 text-border" />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile vertical flow */}
          <div className="flex flex-col items-center gap-0 lg:hidden">
            {workflowSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex flex-col items-center">
                  <div className="flex w-60 items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                      <Icon className="h-3.5 w-3.5 text-brand" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {step.label}
                      </div>
                      <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
                        {step.tag}
                      </div>
                    </div>
                  </div>
                  {i < workflowSteps.length - 1 && (
                    <div className="my-1.5 h-5 w-px bg-border" />
                  )}
                </div>
              );
            })}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── S6 · From Analysis to Action ─────────────────────────────────────────────

const outcomeCards = [
  {
    label: "Earlier Maintenance Planning",
    icon: Activity,
    desc: "Equipment issues are identified before they lead to unplanned downtime, giving maintenance teams time to plan rather than react.",
  },
  {
    label: "Better Maintenance Prioritization",
    icon: Wrench,
    desc: "Work orders are ranked by operational impact — so teams focus on what matters most, not what was reported last.",
  },
  {
    label: "Clear Communication Across Teams",
    icon: FileText,
    desc: "Technical findings are translated into plain-language summaries that operations managers and executives can act on directly.",
  },
  {
    label: "Faster Operational Decisions",
    icon: ShieldAlert,
    desc: "Analysis, diagnosis, risk and priority in one continuous workflow means fewer meetings and less time lost switching between tools.",
  },
];

function OutcomesSection() {
  return (
    <section id="outcomes" className="py-28 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-6">
        <FadeUp className="mx-auto max-w-2xl text-center">
          <SectionLabel>From Analysis to Action</SectionLabel>
          <h2 className="mt-4 font-display text-4xl font-normal tracking-tight md:text-5xl">
            What changes when decisions{" "}
            <span className="italic text-gradient">come earlier.</span>
          </h2>
        </FadeUp>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {outcomeCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <FadeUp key={card.label} delay={i * 0.08}>
                <TiltCard className="h-full rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10">
                    <Icon className="h-5 w-5 text-brand" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">
                    {card.label}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {card.desc}
                  </p>
                </TiltCard>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── S7 · One Analysis. Multiple Decisions. ────────────────────────────────────

const analysisIndicators = [
  {
    id: "risk",
    label: "Failure Risk",
    value: "3.2%",
    color: "text-success",
    bg: "bg-success/10",
    top: "top-[14%]",
    left: "left-[8%]",
  },
  {
    id: "cause",
    label: "Root Cause",
    value: "Heat dissipation",
    color: "text-brand",
    bg: "bg-brand/10",
    top: "top-[14%]",
    right: "right-[8%]",
  },
  {
    id: "score",
    label: "Risk Score",
    value: "62 / 100",
    color: "text-warning",
    bg: "bg-warning/10",
    top: "top-[52%]",
    left: "left-[3%]",
  },
  {
    id: "priority",
    label: "Maintenance Priority",
    value: "Do Today",
    color: "text-brand",
    bg: "bg-brand/10",
    top: "top-[52%]",
    right: "right-[3%]",
  },
  {
    id: "guidance",
    label: "AI Guidance",
    value: "Section 4.2 — Thermal",
    color: "text-foreground",
    bg: "bg-secondary",
    bottom: "bottom-[16%]",
    left: "left-[8%]",
  },
  {
    id: "report",
    label: "Executive Report",
    value: "PDF ready",
    color: "text-success",
    bg: "bg-success/10",
    bottom: "bottom-[16%]",
    right: "right-[8%]",
  },
];

function SignatureSection() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section id="analysis" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeUp className="mx-auto max-w-2xl text-center">
          <SectionLabel>One Analysis. Multiple Decisions.</SectionLabel>
          <h2 className="mt-4 font-display text-4xl font-normal tracking-tight md:text-5xl">
            One equipment analysis.{" "}
            <span className="italic text-gradient">
              Six decision-ready outputs.
            </span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.1} className="mt-14">
          <div className="relative mx-auto max-w-3xl">
            {/* Central interface mockup */}
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_8px_48px_-16px_oklch(0_0_0_/_0.09)]">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border bg-secondary/30 px-5 py-3.5">
                <div className="flex gap-1.5">
                  {["bg-danger/30", "bg-warning/30", "bg-success/30"].map(
                    (c) => (
                      <div key={c} className={`h-2.5 w-2.5 rounded-full ${c}`} />
                    ),
                  )}
                </div>
                <div className="flex h-5 flex-1 items-center justify-center rounded-full border border-border bg-background/50">
                  <span className="text-[10px] text-muted-foreground/60">
                    safefactory · equipment analysis
                  </span>
                </div>
              </div>

              {/* Content area */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Equipment ID
                    </div>
                    <div className="mt-0.5 text-lg font-semibold text-foreground">
                      Unit M-247 · Medium-duty
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                    Attention required
                  </div>
                </div>

                {/* Reading grid */}
                <div className="mt-5 grid grid-cols-3 gap-2.5">
                  {[
                    { l: "Air Temp", v: "298.5 K" },
                    { l: "Process Temp", v: "308.9 K" },
                    { l: "Rotational Speed", v: "1,520 rpm" },
                    { l: "Torque", v: "42.8 Nm" },
                    { l: "Tool Wear", v: "108 min" },
                    { l: "Equipment Class", v: "Medium (M)" },
                  ].map((r) => (
                    <div
                      key={r.l}
                      className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5"
                    >
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                        {r.l}
                      </div>
                      <div className="mt-0.5 text-sm font-semibold text-foreground">
                        {r.v}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
                    Analysis outputs
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Output pills */}
                <div className="flex flex-wrap gap-2">
                  {analysisIndicators.map((ind) => (
                    <motion.button
                      key={ind.id}
                      onClick={() =>
                        setActive(active === ind.id ? null : ind.id)
                      }
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                        active === ind.id
                          ? "border-brand/40 bg-brand/8 text-foreground"
                          : "border-border bg-secondary/50 text-muted-foreground hover:border-brand/25 hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${ind.bg.replace("bg-", "bg-")}`}
                        style={{ background: "currentColor", opacity: 0.7 }}
                      />
                      {ind.label}
                    </motion.button>
                  ))}
                </div>

                {/* Expanded output */}
                <AnimatePresence>
                  {active && (() => {
                    const ind = analysisIndicators.find(
                      (x) => x.id === active,
                    )!;
                    return (
                      <motion.div
                        key={active}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: E }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 flex items-center justify-between rounded-2xl border border-brand/20 bg-brand/[0.04] px-4 py-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              {ind.label}
                            </div>
                            <div
                              className={`mt-0.5 text-base font-semibold ${ind.color}`}
                            >
                              {ind.value}
                            </div>
                          </div>
                          <Link
                            to={
                              ind.id === "risk"
                                ? "/app/prediction"
                                : ind.id === "cause"
                                  ? "/app/diagnosis"
                                  : ind.id === "score"
                                    ? "/app/risk"
                                    : ind.id === "priority"
                                      ? "/app/priority"
                                      : ind.id === "guidance"
                                        ? "/app/assistant"
                                        : "/app/report"
                            }
                            className="flex items-center gap-1.5 rounded-full border border-brand/30 px-3 py-1 text-[11px] font-medium text-brand transition-colors hover:bg-brand/8"
                          >
                            Open <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.2} className="mt-10 text-center">
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A single equipment analysis generates multiple decision-ready
            insights, helping maintenance teams move from data to action without
            switching between disconnected tools.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── S8 · Who Uses SafeFactory ─────────────────────────────────────────────────

const personas = [
  {
    role: "Plant Manager",
    icon: LayoutGrid,
    decision:
      "Decides which production areas require prioritised attention this week, based on risk assessments and operational impact rather than technician reports alone.",
  },
  {
    role: "Maintenance Manager",
    icon: Wrench,
    decision:
      "Issues work orders with ranked justification — knowing which assets require intervention today, which can wait, and why.",
  },
  {
    role: "Operations Supervisor",
    icon: ShieldAlert,
    decision:
      "Assesses whether current equipment conditions present an acceptable operational risk before approving a production shift to continue.",
  },
  {
    role: "Industrial Engineer",
    icon: Stethoscope,
    decision:
      "Reviews root cause analysis and identified failure modes to refine equipment specifications and update maintenance procedures.",
  },
  {
    role: "Reliability Engineer",
    icon: Activity,
    decision:
      "Identifies recurring failure patterns across assets to develop long-term reliability improvement programmes grounded in operational data.",
  },
];

function WhoSection() {
  return (
    <section id="who" className="py-28 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-6">
        <FadeUp className="mx-auto max-w-2xl text-center">
          <SectionLabel>Who Uses SafeFactory</SectionLabel>
          <h2 className="mt-4 font-display text-4xl font-normal tracking-tight md:text-5xl">
            For the people who make{" "}
            <span className="italic text-gradient">maintenance decisions.</span>
          </h2>
        </FadeUp>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {personas.map((p, i) => {
            const Icon = p.icon;
            return (
              <FadeUp key={p.role} delay={i * 0.07}>
                <TiltCard className="h-full rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10">
                      <Icon className="h-4 w-4 text-brand" />
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {p.role}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {p.decision}
                  </p>
                </TiltCard>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── S9 · Why Trust SafeFactory ────────────────────────────────────────────────

const trustPoints = [
  {
    label: "Historical maintenance datasets",
    desc: "Assessments are grounded in documented equipment performance patterns, not generalized or invented benchmarks.",
  },
  {
    label: "Operational equipment data",
    desc: "Risk and priority outputs incorporate actual operational conditions — temperature, speed, torque and tool wear.",
  },
  {
    label: "Risk assessment models",
    desc: "Each risk score is produced by purpose-built models trained for industrial maintenance failure scenarios.",
  },
  {
    label: "Maintenance knowledge base",
    desc: "Copilot guidance references technical manuals and documented maintenance procedures — not generic answers.",
  },
  {
    label: "Explainable recommendations",
    desc: "Every output includes a plain-language explanation of contributing factors. No black-box outputs.",
  },
  {
    label: "Decision support, not automation",
    desc: "SafeFactory presents structured options and ranked recommendations. Decisions remain with your maintenance team.",
  },
];

function TrustSection() {
  return (
    <section id="trust" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <FadeUp className="mx-auto max-w-2xl text-center">
          <SectionLabel>Why Trust SafeFactory</SectionLabel>
          <h2 className="mt-4 font-display text-4xl font-normal tracking-tight md:text-5xl">
            Grounded in data.{" "}
            <span className="italic text-gradient">Transparent by design.</span>
          </h2>
        </FadeUp>

        <div className="mt-14 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {trustPoints.map((point, i) => (
            <FadeUp key={point.label} delay={i * 0.06}>
              <div className="flex h-full gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {point.label}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {point.desc}
                  </p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── S10 · Saudi Vision 2030 ────────────────────────────────────────────────────

function VisionSection() {
  return (
    <section id="vision" className="py-28 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <FadeUp>
            <SectionLabel>Aligned with Saudi Vision 2030</SectionLabel>
            <h2 className="mt-4 font-display text-4xl font-normal tracking-tight md:text-5xl">
              Built for the direction{" "}
              <span className="italic text-gradient">
                Saudi industry is heading.
              </span>
            </h2>
          </FadeUp>

          <FadeUp delay={0.12}>
            <div className="space-y-5">
              <p className="text-muted-foreground leading-relaxed">
                Saudi Vision 2030 places industrial development and
                manufacturing at the centre of the Kingdom's economic
                transformation. Through the National Industrial Strategy, the
                Future Factories Program and investments across MODON's
                industrial cities, Saudi Arabia is building a manufacturing
                sector that is more productive, more efficient and increasingly
                data-informed.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                SafeFactory supports this direction by helping maintenance teams
                make better-structured decisions — reducing unplanned downtime,
                improving asset utilization and enabling clearer communication
                between operational and management teams.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                As factories modernise and operational complexity increases, the
                ability to act on structured maintenance intelligence — rather
                than reactive instinct — becomes a meaningful operational
                advantage.
              </p>
              <div className="rounded-xl border border-border/50 bg-card/60 px-4 py-3">
                <p className="text-[11px] text-muted-foreground/70 italic">
                  SafeFactory is an independent platform. This alignment
                  reflects shared goals around industrial efficiency and
                  data-driven decision support. SafeFactory does not imply
                  endorsement, partnership or approval by any government entity.
                </p>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ─── S11 · Final CTA ──────────────────────────────────────────────────────────

function CTASection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end start"],
  });
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.04, 1]);

  return (
    <section ref={ref} id="about" className="relative overflow-hidden py-36">
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ scale: bgScale }}
      >
        <div className="absolute inset-0 bg-background" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(rgba(20,24,29,1) 1px, transparent 1px), linear-gradient(90deg, rgba(20,24,29,1) 1px, transparent 1px)`,
            backgroundSize: "44px 44px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 50%, oklch(0.66 0.16 55 / 0.05), transparent)",
          }}
        />
      </motion.div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <FadeUp>
          <LogoMark size={48} className="mx-auto mb-8" />
          <h2 className="font-display text-5xl font-normal leading-[1.06] tracking-tight md:text-[56px]">
            Better maintenance decisions{" "}
            <span className="italic text-gradient">
              start before failures do.
            </span>
          </h2>
          <p className="mt-6 mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground">
            SafeFactory connects prediction, diagnosis, risk assessment and
            maintenance planning into one continuous workflow — so maintenance
            teams can act with confidence, not just react with urgency.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <motion.div
              whileHover={{
                y: -2,
                boxShadow: "0 12px 36px -8px oklch(0.66 0.16 55 / 0.26)",
              }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-foreground px-8 text-background hover:bg-foreground/90"
              >
                <Link to="/app">
                  Start Analysis <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-border px-8 hover:bg-secondary/60"
              >
                <a href="#workflow">Explore Platform</a>
              </Button>
            </motion.div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
