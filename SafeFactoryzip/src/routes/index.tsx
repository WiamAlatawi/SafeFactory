import { createFileRoute, Link } from "@tanstack/react-router";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
  useInView,
} from "framer-motion";
import {
  useRef,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Activity,
  Stethoscope,
  ShieldAlert,
  Wrench,
  Bot,
  FileText,
  ChevronDown,
} from "lucide-react";
import { SiteNav } from "@/components/site/nav";
import { LogoMark } from "@/components/site/logo-mark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafeFactory — Maintenance Intelligence" },
      {
        name: "description",
        content:
          "SafeFactory gives maintenance teams the intelligence to act before equipment fails.",
      },
    ],
  }),
  component: Landing,
});

// ─── Tokens ──────────────────────────────────────────────────────────────────

const NAVY_BG = "linear-gradient(158deg, #071526 0%, #0A1B31 55%, #0B1D35 100%)";
const NAVY_SOLID = "#071526";
const ORANGE = "#D97A2B";
const CREAM = "#F8F6F2";
const E = [0.22, 1, 0.36, 1] as const;

// ─── Primitives ───────────────────────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  y = 22,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: E }}
    >
      {children}
    </motion.div>
  );
}

function Chip({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
      style={{
        background: light ? "rgba(255,255,255,0.07)" : `${ORANGE}14`,
        border: `1px solid ${light ? "rgba(255,255,255,0.13)" : `${ORANGE}30`}`,
        color: light ? "rgba(255,255,255,0.52)" : ORANGE,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: light ? "rgba(255,255,255,0.38)" : ORANGE,
        }}
      />
      {children}
    </span>
  );
}

// ─── Animated number count-up ─────────────────────────────────────────────────

function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 2200,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const raf = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

function Landing() {
  return (
    <div style={{ overflowX: "clip" }} className="antialiased">
      <SiteNav />
      <HeroSection />
      <div className="relative z-10">
        <SnapshotSection />
        <ChallengeSection />
        <JourneySection />
        <ImpactSection />
        <TrustSection />
        <CtaSection />
        <SiteFooter />
      </div>
    </div>
  );
}

// ─── S1 · Hero (cream) ────────────────────────────────────────────────────────

function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yTxt = useTransform(scrollYProgress, [0, 1], [0, -55]);
  const opTxt = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const bx = useSpring(useTransform(mx, [0, 1], [-50, 50]), {
    stiffness: 30,
    damping: 20,
  });
  const by = useSpring(useTransform(my, [0, 1], [-30, 30]), {
    stiffness: 30,
    damping: 20,
  });

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width);
      my.set((e.clientY - r.top) / r.height);
    },
    [mx, my]
  );

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="sticky top-0 z-0 h-screen overflow-hidden"
    >
      {/* Full-bleed background photo */}
      <div className="absolute inset-0">
        <img
          src="/hero-industry.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center"
        />
        {/* Dark gradient overlay — heavier at top/left for text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(110deg, rgba(7,10,14,0.72) 0%, rgba(7,10,14,0.52) 55%, rgba(7,10,14,0.18) 100%)",
          }}
        />
      </div>

      {/* Mouse-tracking orange glow (subtle on dark bg) */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2"
        style={{ x: bx, y: by, translateX: "-50%", translateY: "-50%" }}
      >
        <div
          className="h-[700px] w-[700px] rounded-full"
          style={{ background: `radial-gradient(circle, ${ORANGE}18 0%, transparent 65%)` }}
        />
      </motion.div>

      <div
        className="relative z-10 mx-auto flex h-screen max-w-7xl flex-col justify-center gap-12 px-6 pb-20 pt-28 lg:flex-row lg:items-center lg:px-12"
      >
        {/* Glass content card — left */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: E }}
          className="w-full lg:w-[50%]"
        >
          <div
            className="rounded-[32px] p-8 md:p-10"
            style={{
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(32px) saturate(160%)",
              WebkitBackdropFilter: "blur(32px) saturate(160%)",
              border: "1px solid rgba(255,255,255,0.22)",
              boxShadow: "0 12px 60px -16px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.20)",
            }}
          >
            {/* Eyebrow chip */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12, ease: E }}
            >
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.26)",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ background: ORANGE }}
                />
                Maintenance Intelligence Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.20, ease: E }}
              className="mt-6 font-display leading-[1.02] tracking-[-0.025em] text-white"
              style={{ fontSize: "clamp(44px, 5.5vw, 72px)" }}
            >
              Act before
              <br />
              equipment{" "}
              <em className="not-italic" style={{ color: ORANGE }}>
                fails.
              </em>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.32, ease: E }}
              className="mt-5 max-w-[400px] text-[16px] leading-[1.75]"
              style={{ color: "rgba(255,255,255,0.72)" }}
            >
              SafeFactory turns sensor readings into clear maintenance decisions
              — no data science background required.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.44, ease: E }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <motion.div
                whileHover={{ y: -2, boxShadow: `0 14px 40px -8px ${ORANGE}60` }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to="/app"
                  className="inline-flex h-12 items-center gap-2.5 rounded-full px-7 text-sm font-semibold text-white transition-all"
                  style={{ background: ORANGE }}
                >
                  Open platform <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
              <a
                href="#journey"
                className="inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-medium transition-all hover:bg-white/10"
                style={{
                  border: "1px solid rgba(255,255,255,0.30)",
                  color: "rgba(255,255,255,0.80)",
                }}
              >
                How it works
              </a>
            </motion.div>
          </div>
        </motion.div>

        {/* Dashboard mockup — right */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.0, delay: 0.18, ease: E }}
          className="hidden lg:block lg:w-[50%]"
        >
          <HeroMockup />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        style={{ opacity: opTxt }}
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="flex h-9 w-5 items-start justify-center rounded-full py-2"
          style={{ border: "1px solid #C4BEB5" }}
        >
          <motion.div
            className="h-1.5 w-0.5 rounded-full"
            style={{ background: ORANGE }}
            animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}

function HeroMockup() {
  const GLASS_BG   = "rgba(255,255,255,0.11)";
  const GLASS_BDR  = "rgba(255,255,255,0.22)";
  const GLASS_DIVIDER = "rgba(255,255,255,0.14)";
  const BLUR       = "blur(28px) saturate(160%)";

  return (
    <div className="relative mx-auto max-w-[460px]">
      {/* Orange glow behind card */}
      <div
        className="pointer-events-none absolute -inset-12 rounded-[56px]"
        style={{ background: `radial-gradient(ellipse, ${ORANGE}22 0%, transparent 68%)` }}
      />

      {/* Main card */}
      <div
        className="rounded-[28px] overflow-hidden"
        style={{
          background: GLASS_BG,
          backdropFilter: BLUR,
          WebkitBackdropFilter: BLUR,
          border: `1px solid ${GLASS_BDR}`,
          boxShadow: "0 28px 80px -16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.22)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${GLASS_DIVIDER}` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="grid h-7 w-7 place-items-center rounded-lg"
              style={{ background: `linear-gradient(135deg, ${ORANGE}, #B85E18)` }}
            >
              <Activity className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Failure Prediction</div>
              <div className="text-[10px] uppercase tracking-widest text-white/45">Module 01</div>
            </div>
          </div>
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium text-white/75"
            style={{ background: "rgba(255,255,255,0.12)", border: `1px solid ${GLASS_DIVIDER}` }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        </div>

        {/* Readings grid */}
        <div className="grid grid-cols-2">
          {[
            ["Air temperature",    "298.5 K"],
            ["Process temperature","308.9 K"],
            ["Rotational speed",   "1,520 rpm"],
            ["Torque",             "42.8 Nm"],
            ["Tool wear",          "108 min"],
            ["Equipment class",    "Medium (M)"],
          ].map(([l, v], i) => (
            <div
              key={l}
              className="px-4 py-3"
              style={{
                borderBottom: i < 4 ? `1px solid ${GLASS_DIVIDER}` : "none",
                borderRight:  i % 2 === 0 ? `1px solid ${GLASS_DIVIDER}` : "none",
              }}
            >
              <div className="text-[9px] uppercase tracking-wider text-white/45">{l}</div>
              <div className="mt-0.5 text-sm font-medium text-white">{v}</div>
            </div>
          ))}
        </div>

        {/* CTA row */}
        <div className="px-5 py-4">
          <div
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${ORANGE}, #B85E18)` }}
          >
            <Activity className="h-3.5 w-3.5" /> Analyze equipment
          </div>
        </div>
      </div>

      {/* Floating result badge */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-5 -right-4 rounded-2xl px-4 py-3.5"
        style={{
          background: "rgba(255,255,255,0.13)",
          backdropFilter: BLUR,
          WebkitBackdropFilter: BLUR,
          border: `1px solid ${GLASS_BDR}`,
          boxShadow: "0 12px 40px -8px rgba(0,0,0,0.35)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(52,211,153,0.18)", border: "1px solid rgba(52,211,153,0.30)" }}
          >
            <span className="text-sm text-emerald-400 font-bold">✓</span>
          </div>
          <div>
            <div className="text-xs font-semibold text-white">No Failure Expected</div>
            <div className="mt-0.5 flex gap-3 text-[10px] text-white/50">
              <span>Confidence <strong className="text-white">94%</strong></span>
              <span>Risk <strong className="text-emerald-400">3.2%</strong></span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating label pill */}
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -left-3 top-5 flex items-center gap-2 rounded-full px-3 py-1.5"
        style={{
          background: "rgba(255,255,255,0.13)",
          backdropFilter: BLUR,
          WebkitBackdropFilter: BLUR,
          border: `1px solid ${GLASS_BDR}`,
          boxShadow: "0 6px 24px -4px rgba(0,0,0,0.30)",
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: ORANGE }} />
        <span className="text-xs font-medium text-white">Worker enters readings</span>
      </motion.div>
    </div>
  );
}

// ─── S2 · Saudi Industry Snapshot (navy) ─────────────────────────────────────

const stats = [
  {
    value: 36,
    prefix: "",
    suffix: "",
    label: "Industrial cities across the Kingdom",
    source: "MODON — Saudi Authority for Industrial Cities",
  },
  {
    value: 10000,
    prefix: "+",
    suffix: "",
    label: "Licensed factories in operation",
    source: "Ministry of Industry and Mineral Resources",
  },
  {
    value: 895,
    prefix: "SAR ",
    suffix: "B",
    label: "Manufacturing sector output target",
    source: "Saudi Vision 2030 Industrial Strategy",
  },
  {
    value: 600000,
    prefix: "+",
    suffix: "",
    label: "Jobs in the Saudi manufacturing sector",
    source: "General Authority for Statistics (GaStat)",
  },
];

function SnapshotSection() {
  return (
    <section id="snapshot" style={{ background: NAVY_BG }} className="relative overflow-hidden">
      {/* Blue ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 55% at 50% 50%, rgba(14,55,130,0.20) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-32">
        <Reveal className="mb-20 text-center">
          <Chip light>Saudi Industry Snapshot</Chip>
          <h2
            className="mt-5 font-display font-normal leading-[1.07] tracking-tight text-white"
            style={{ fontSize: "clamp(36px, 4.5vw, 52px)" }}
          >
            Industrial scale.
            <br />
            <em className="not-italic" style={{ color: ORANGE }}>
              Maintenance must match it.
            </em>
          </h2>
        </Reveal>

        {/* Stats row */}
        <div
          className="grid gap-0 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            divideColor: "rgba(255,255,255,0.07)",
          }}
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="flex flex-col gap-3 px-8 py-10"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: E }}
              style={{ borderColor: "rgba(255,255,255,0.07)" }}
            >
              <div
                className="font-display font-normal leading-none tracking-tight"
                style={{
                  fontSize: "clamp(42px, 5vw, 58px)",
                  color: ORANGE,
                }}
              >
                <CountUp
                  to={s.value}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  duration={2000 + i * 100}
                />
              </div>
              <div className="text-sm font-medium leading-snug text-white/75">
                {s.label}
              </div>
              <div
                className="text-[10px] leading-snug"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                {s.source}
              </div>
            </motion.div>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-10 text-center">
          <p
            className="text-sm"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            At this scale, unplanned downtime isn&apos;t an inconvenience — it&apos;s a systemic cost.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── S3 · Challenge (cream) ───────────────────────────────────────────────────

const before = [
  "Failures discovered after damage is done",
  "Schedules driven by calendar, not condition",
  "Decisions made under time pressure with incomplete data",
  "Reports assembled manually after every incident",
  "Maintenance knowledge trapped in experienced staff",
];
const after = [
  "Failures surfaced before they interrupt operations",
  "Inspections triggered by actual equipment signals",
  "Structured recommendations with traceable reasoning",
  "Reports consolidated automatically across modules",
  "Maintenance knowledge systematised and accessible",
];

function ChallengeSection() {
  return (
    <section className="overflow-hidden py-36" style={{ background: CREAM }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-16 lg:grid-cols-[1fr_1px_1fr]">
          {/* Before */}
          <div>
            <Reveal>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: "#BDB7AE" }}
              >
                The reactive cycle
              </span>
              <h2
                className="mt-4 font-display font-normal leading-[1.10] tracking-tight text-[#0D1117]"
                style={{ fontSize: "clamp(32px, 3.5vw, 44px)" }}
              >
                Maintenance teams
                <br />
                working in the dark.
              </h2>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#7A756E]">
                Without real-time intelligence, every decision is reactive. Every report is late.
              </p>
            </Reveal>
            <ul className="mt-10 space-y-0 divide-y" style={{ borderTop: "1px solid #E8E4DD", borderBottom: "1px solid #E8E4DD", divideColor: "#E8E4DD" }}>
              {before.map((item, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3.5 py-4"
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.07, ease: E }}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "#D6D2CB" }}
                    />
                  </span>
                  <span className="text-sm leading-relaxed text-[#7A756E]">
                    {item}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Divider */}
          <div
            className="hidden lg:block"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, #D6D2CB 30%, #D6D2CB 70%, transparent 100%)",
            }}
          />

          {/* After */}
          <div>
            <Reveal delay={0.12}>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: ORANGE }}
              >
                With SafeFactory
              </span>
              <h2
                className="mt-4 font-display font-normal leading-[1.10] tracking-tight text-[#0D1117]"
                style={{ fontSize: "clamp(32px, 3.5vw, 44px)" }}
              >
                Maintenance teams
                <br />
                working with clarity.
              </h2>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#7A756E]">
                Structured intelligence means every recommendation is grounded in data, not guesswork.
              </p>
            </Reveal>
            <ul className="mt-10 space-y-0 divide-y" style={{ borderTop: "1px solid #E8E4DD", borderBottom: "1px solid #E8E4DD", divideColor: "#E8E4DD" }}>
              {after.map((item, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3.5 py-4"
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.07 + 0.14, ease: E }}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    <ArrowRight className="h-3.5 w-3.5" style={{ color: ORANGE }} />
                  </span>
                  <span className="text-sm leading-relaxed text-[#3D3A36] font-medium">
                    {item}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── S4 · Journey (navy) ─────────────────────────────────────────────────────

const steps = [
  {
    n: "01",
    icon: Activity,
    name: "Failure Prediction",
    desc: "Sensor readings classified across five failure types. Most likely candidate surfaced with reasoning.",
  },
  {
    n: "02",
    icon: Stethoscope,
    name: "Failure Diagnosis",
    desc: "Probable cause, repair scope, and parts — from a structured knowledge base.",
  },
  {
    n: "03",
    icon: ShieldAlert,
    name: "Risk Assessment",
    desc: "Environmental, electrical, and mechanical signals into a single explainable risk score.",
  },
  {
    n: "04",
    icon: Wrench,
    name: "Maintenance Priority",
    desc: "Urgency ranked by equipment data and downtime cost — with a clear action window.",
  },
  {
    n: "05",
    icon: Bot,
    name: "Maintenance Copilot",
    desc: "Ask follow-up questions in plain language. Answers from the knowledge base, not generic AI.",
  },
  {
    n: "06",
    icon: FileText,
    name: "Executive Report",
    desc: "All findings consolidated into a management-ready report. No manual write-up.",
  },
];

function JourneySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const lineWidth = useTransform(scrollYProgress, [0.15, 0.75], ["0%", "100%"]);

  const CREAM = "#F8F6F2";
  const INK = "#0B1D35";

  return (
    <section
      id="journey"
      ref={sectionRef}
      className="relative overflow-hidden py-28"
      style={{ background: CREAM }}
    >
      <div className="relative mx-auto max-w-7xl px-6">
        {/* Headline */}
        <Reveal className="mb-16 text-center">
          <Chip>The Workflow</Chip>
          <h2
            className="mt-4 font-display font-normal leading-[1.07] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4vw, 50px)", color: INK }}
          >
            From raw data to clear{" "}
            <em className="not-italic" style={{ color: ORANGE }}>
              decision.
            </em>
          </h2>
          <p
            className="mx-auto mt-4 max-w-md text-sm leading-relaxed"
            style={{ color: "rgba(11,29,53,0.45)" }}
          >
            Six modules that share context. Every step builds toward a complete picture of equipment health.
          </p>
        </Reveal>

        {/* ── Desktop: horizontal pipeline ── */}
        <div className="hidden lg:block">
          {/* Single grid — dot + label share the same column cell */}
          <div className="relative grid grid-cols-6">
            {/* Track line: spans the dot centres (left-half of col-1 → right-half of col-6) */}
            <div
              className="pointer-events-none absolute inset-x-0 overflow-hidden"
              style={{ top: "22px", height: "1px", left: "8.33%", right: "8.33%" }}
            >
              {/* Track base */}
              <div className="absolute inset-0" style={{ background: "rgba(11,29,53,0.10)" }} />
              {/* Animated fill */}
              <motion.div
                className="absolute inset-y-0 left-0 origin-left"
                style={{
                  width: lineWidth,
                  background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE}80)`,
                }}
              />
            </div>

            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.n}
                  className="flex flex-col items-center px-2 text-center"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: E }}
                >
                  {/* Dot */}
                  <motion.div
                    whileInView={{ borderColor: ORANGE, background: `${ORANGE}15` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.08 + 0.2 }}
                    className="relative z-10 mb-5 flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: "#fff", border: "1px solid rgba(11,29,53,0.14)" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: ORANGE }} />
                  </motion.div>

                  {/* Label */}
                  <span
                    className="font-display text-[10px] font-normal"
                    style={{ color: "rgba(11,29,53,0.22)" }}
                  >
                    {s.n}
                  </span>
                  <span
                    className="mt-1 text-xs font-semibold leading-snug"
                    style={{ color: INK }}
                  >
                    {s.name}
                  </span>
                  <p
                    className="mt-1.5 text-[11px] leading-relaxed"
                    style={{ color: "rgba(11,29,53,0.45)" }}
                  >
                    {s.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Mobile: vertical list ── */}
        <div className="flex flex-col gap-0 lg:hidden">
          <div className="relative">
            <div
              className="absolute left-[19px] top-0 w-px"
              style={{ height: "calc(100% - 24px)", background: "rgba(11,29,53,0.10)" }}
            />
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.n}
                  className="relative flex gap-5 pb-8 last:pb-0"
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: E }}
                >
                  <div
                    className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: `${ORANGE}12`,
                      border: `1px solid ${ORANGE}45`,
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: ORANGE }} />
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-display text-[10px]"
                        style={{ color: "rgba(11,29,53,0.25)" }}
                      >
                        {s.n}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: INK }}
                      >
                        {s.name}
                      </span>
                    </div>
                    <p
                      className="mt-1 text-[11px] leading-relaxed"
                      style={{ color: "rgba(11,29,53,0.48)" }}
                    >
                      {s.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── S5 · (removed) ──────────────────────────────────────────────────────────


// ─── S7 · Impact (cream) ─────────────────────────────────────────────────────

const impacts = [
  {
    accent: "01",
    headline: "Equipment failures\ncaught early.",
    body: "Condition-based signals mean teams know about problems before they interrupt operations — not after.",
  },
  {
    accent: "02",
    headline: "Maintenance priorities\nranked clearly.",
    body: "Urgency is determined by real equipment data and operational cost, not instinct under pressure.",
  },
  {
    accent: "03",
    headline: "Reports ready\nwithout manual work.",
    body: "Every finding is structured as it's generated. The executive report writes itself.",
  },
];

function ImpactSection() {
  return (
    <section className="py-36" style={{ background: CREAM }}>
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-20 max-w-sm">
          <Chip>Business Impact</Chip>
          <h2
            className="mt-5 font-display font-normal leading-[1.08] tracking-tight text-[#0D1117]"
            style={{ fontSize: "clamp(36px, 4.5vw, 52px)" }}
          >
            What
            <em className="not-italic" style={{ color: ORANGE }}>
              {" "}changes.
            </em>
          </h2>
        </Reveal>

        <div
          className="space-y-0 divide-y"
          style={{
            borderTop: "1px solid #E8E4DD",
            borderBottom: "1px solid #E8E4DD",
            divideColor: "#E8E4DD",
          }}
        >
          {impacts.map((item, i) => (
            <motion.div
              key={i}
              className="grid gap-6 py-8 lg:grid-cols-[80px_1fr_1fr] lg:items-start"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.65, delay: i * 0.08, ease: E }}
            >
              <span
                className="font-display text-5xl font-normal leading-none"
                style={{ color: "#EBE7E1" }}
              >
                {item.accent}
              </span>
              <h3
                className="font-display font-normal leading-[1.15] tracking-tight text-[#0D1117]"
                style={{ fontSize: "clamp(28px, 3vw, 38px)", whiteSpace: "pre-line" }}
              >
                {item.headline}
              </h3>
              <p className="text-sm leading-relaxed text-[#5A5650] lg:pt-2">
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── S8 · Trust (navy) ───────────────────────────────────────────────────────

const trust = [
  {
    title: "Machine Learning Models",
    body: "Predictions are generated by trained ML models — not rule sets or static thresholds. The models were built on historical equipment failure data.",
  },
  {
    title: "Explainable Predictions",
    body: "Every output includes the factors that contributed to it. No single number without a reason. Maintenance teams see what the model saw.",
  },
  {
    title: "Maintenance Knowledge Base",
    body: "Diagnosis and Copilot responses draw from structured maintenance documentation — covering causes, repair procedures, and parts for each failure type.",
  },
  {
    title: "Executive Reporting",
    body: "All six module outputs feed into a structured report format. Management-ready without manual curation or post-session summarisation.",
  },
];

function TrustSection() {
  const INK = "#0B1D35";
  return (
    <section
      className="relative overflow-hidden py-28"
      style={{ background: "#F8F6F2" }}
    >
      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal className="mb-14 text-center">
          <Chip>Technology</Chip>
          <h2
            className="mt-4 font-display font-normal leading-[1.08] tracking-tight"
            style={{ fontSize: "clamp(32px, 4vw, 48px)", color: INK }}
          >
            Built on real{" "}
            <em className="not-italic" style={{ color: ORANGE }}>
              engineering.
            </em>
          </h2>
          <p
            className="mx-auto mt-4 max-w-sm text-sm leading-relaxed"
            style={{ color: "rgba(11,29,53,0.45)" }}
          >
            No fabricated claims. No invented metrics. Only what SafeFactory actually does.
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {trust.map((item, i) => (
            <motion.div
              key={item.title}
              className="rounded-2xl p-7"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.07, ease: E }}
              style={{
                background: "#fff",
                border: "1px solid rgba(11,29,53,0.08)",
              }}
            >
              <h3
                className="mb-2.5 text-base font-semibold"
                style={{ color: INK }}
              >
                {item.title}
              </h3>
              <p
                className="mt-2.5 text-sm leading-relaxed"
                style={{ color: "rgba(11,29,53,0.50)" }}
              >
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── S9 · CTA (navy) ─────────────────────────────────────────────────────────

function CtaSection() {
  return (
    <section
      className="relative overflow-hidden py-48"
      style={{ background: NAVY_BG }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 80% at 50% 50%, rgba(14,55,130,0.22) 0%, transparent 65%)",
        }}
      />
      {/* Thin top separator */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "rgba(255,255,255,0.06)" }}
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <p
            className="mb-6 text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            SafeFactory
          </p>
          <h2
            className="font-display font-normal leading-[1.06] tracking-[-0.02em] text-white"
            style={{ fontSize: "clamp(46px, 6.5vw, 78px)" }}
          >
            Maintenance teams
            <br />
            deserve better
            <br />
            <em className="not-italic" style={{ color: ORANGE }}>
              decisions.
            </em>
          </h2>

          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: E }}
          >
            <motion.div
              className="inline-block"
              whileHover={{ y: -3, boxShadow: `0 16px 44px -8px ${ORANGE}55` }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                to="/app"
                className="inline-flex h-14 items-center gap-3 rounded-full px-9 text-base font-semibold text-white"
                style={{ background: ORANGE }}
              >
                Open SafeFactory <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function SiteFooter() {
  return (
    <footer
      style={{
        background: NAVY_SOLID,
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <LogoMark size={26} inkColor="#E8E8E0" goldColor={ORANGE} />
              <span className="text-sm font-semibold tracking-tight text-white/70">
                Safe
                <span style={{ color: ORANGE }}>Factory</span>
              </span>
            </div>
            <p
              className="mt-4 max-w-xs text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.26)" }}
            >
              Maintenance intelligence for industrial teams.
            </p>
          </div>

          {/* Platform */}
          <div>
            <div
              className="mb-4 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.20)" }}
            >
              Platform
            </div>
            <ul className="space-y-2.5">
              {[
                ["/app/prediction", "Failure Prediction"],
                ["/app/diagnosis", "Failure Diagnosis"],
                ["/app/risk", "Risk Assessment"],
                ["/app/priority", "Maintenance Priority"],
                ["/app/assistant", "Maintenance Copilot"],
                ["/app/report", "Executive Report"],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm transition-colors hover:text-white/65"
                    style={{ color: "rgba(255,255,255,0.30)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div
              className="mb-4 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.20)" }}
            >
              Company
            </div>
            <ul className="space-y-2.5">
              {["About", "Privacy Policy", "Terms of Service", "Contact"].map(
                (label) => (
                  <li key={label}>
                    <a
                      href="#"
                      className="text-sm transition-colors hover:text-white/65"
                      style={{ color: "rgba(255,255,255,0.30)" }}
                    >
                      {label}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        <div
          className="mt-16 flex flex-col items-start justify-between gap-3 border-t pt-8 sm:flex-row sm:items-center"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <p
            className="text-xs"
            style={{ color: "rgba(255,255,255,0.18)" }}
          >
            © 2025 SafeFactory Intelligence. All rights reserved.
          </p>
          <p
            className="text-xs"
            style={{ color: "rgba(255,255,255,0.14)" }}
          >
            Built for modern industrial maintenance.
          </p>
        </div>
      </div>
    </footer>
  );
}
