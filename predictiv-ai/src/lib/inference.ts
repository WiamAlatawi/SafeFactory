// Mock "AI" inference layer. Deterministic transforms of inputs into
// natural-language insights so the UX never exposes ML jargon.

export type PredictionInputs = {
  type: "L" | "M" | "H";
  airTemp: number; // K
  processTemp: number; // K
  rotationalSpeed: number; // rpm
  torque: number; // Nm
  toolWear: number; // min
};

export type PredictionResult = {
  failure: boolean;
  probability: number; // 0..1
  confidence: number; // 0..1
  status: "healthy" | "watch" | "at_risk" | "critical";
  headline: string;
  narrative: string;
  approachingType?: FailureType;
};

export type FailureType = "HDF" | "OSF" | "PWF" | "TWF";

export type DiagnosisResult = {
  type: FailureType;
  fullName: string;
  confidence: number;
  rootCause: string;
  severity: "Low" | "Moderate" | "High" | "Critical";
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  estimatedCost: number;
  expectedDowntimeHours: number;
  recommendations: string[];
};

const FAILURE_META: Record<FailureType, { name: string; keywords: string[] }> = {
  HDF: { name: "Heat Dissipation Failure", keywords: ["temperature", "cooling", "airflow"] },
  OSF: { name: "Overstrain Failure", keywords: ["torque", "load", "wear"] },
  PWF: { name: "Power Failure", keywords: ["power", "torque", "speed"] },
  TWF: { name: "Tool Wear Failure", keywords: ["tool wear", "cutting", "abrasion"] },
};

export function runPrediction(i: PredictionInputs): PredictionResult {
  const tempGap = i.processTemp - i.airTemp;
  const power = (i.torque * i.rotationalSpeed * 2 * Math.PI) / 60; // W
  const typeFactor = i.type === "L" ? 1.05 : i.type === "H" ? 0.95 : 1;

  // heuristics
  let score = 0;
  const approaching: Partial<Record<FailureType, number>> = {};

  // HDF: low temp gap and low rpm
  if (tempGap < 8.6 && i.rotationalSpeed < 1380) {
    approaching.HDF = 0.75;
    score += 0.4;
  } else if (tempGap < 10 && i.rotationalSpeed < 1450) {
    approaching.HDF = 0.35;
    score += 0.12;
  }
  // OSF: tool wear * torque
  const osf = (i.toolWear * i.torque) / 1000;
  const osfThreshold = i.type === "L" ? 11 : i.type === "M" ? 12 : 13;
  if (osf > osfThreshold) {
    approaching.OSF = 0.85;
    score += 0.45;
  } else if (osf > osfThreshold * 0.8) {
    approaching.OSF = 0.4;
    score += 0.15;
  }
  // PWF: power outside 3500..9000
  if (power < 3500 || power > 9000) {
    approaching.PWF = 0.7;
    score += 0.35;
  } else if (power < 4200 || power > 8300) {
    approaching.PWF = 0.3;
    score += 0.1;
  }
  // TWF: tool wear over 200
  if (i.toolWear > 200) {
    approaching.TWF = 0.65;
    score += 0.3;
  } else if (i.toolWear > 170) {
    approaching.TWF = 0.3;
    score += 0.1;
  }

  const probability = Math.min(0.99, score * typeFactor);
  const failure = probability >= 0.55;
  const confidence = Math.min(0.98, 0.65 + Math.abs(probability - 0.5) * 0.7);

  const entries = Object.entries(approaching) as [FailureType, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const approachingType = entries[0]?.[0];

  let status: PredictionResult["status"];
  if (probability < 0.2) status = "healthy";
  else if (probability < 0.55) status = "watch";
  else if (probability < 0.8) status = "at_risk";
  else status = "critical";

  let headline: string;
  let narrative: string;
  if (status === "healthy") {
    headline = "Your equipment is operating within healthy parameters.";
    narrative =
      "All measured signals are aligned with normal operating behavior. Continue standard monitoring and inspection cycles.";
  } else if (status === "watch") {
    const near = approachingType ? FAILURE_META[approachingType].name : "abnormal wear";
    headline = "The equipment is currently operating normally.";
    narrative = `However, its operating conditions are gradually approaching patterns previously associated with ${near}. We recommend monitoring the related signals and scheduling a preventive inspection within the next cycle.`;
  } else if (status === "at_risk") {
    const near = approachingType ? FAILURE_META[approachingType].name : "failure";
    headline = "Early warning signals detected.";
    narrative = `Operating behavior is drifting toward conditions historically linked to ${near}. A short preventive intervention now would significantly reduce the risk of unplanned downtime.`;
  } else {
    const near = approachingType ? FAILURE_META[approachingType].name : "imminent failure";
    headline = "Immediate attention recommended.";
    narrative = `Current conditions closely match patterns preceding ${near}. Prepare a maintenance window and notify the on-call technician team.`;
  }

  return { failure, probability, confidence, status, headline, narrative, approachingType };
}

export function runDiagnosis(i: PredictionInputs, prediction: PredictionResult): DiagnosisResult {
  const type = prediction.approachingType ?? "OSF";
  const rootCauses: Record<FailureType, string> = {
    HDF: "Insufficient heat dissipation between process and ambient air, combined with reduced rotational cooling flow.",
    OSF: "Sustained high torque with accumulated tool wear exceeding safe operating envelope.",
    PWF: "Power output has drifted outside its stable operating band, indicating drivetrain or supply instability.",
    TWF: "Cutting tool has reached the end of its effective service life and needs replacement.",
  };
  const recs: Record<FailureType, string[]> = {
    HDF: [
      "Inspect and clean cooling fins and airflow paths.",
      "Verify ambient conditions and coolant circulation.",
      "Schedule thermal calibration within the next inspection window.",
    ],
    OSF: [
      "Reduce operating load until inspection is complete.",
      "Replace worn tooling and verify mounting torque.",
      "Recalibrate feed rate to reduce peak torque events.",
    ],
    PWF: [
      "Inspect drive electronics and power supply lines.",
      "Verify motor windings and check for phase imbalance.",
      "Log a full electrical profile during next production run.",
    ],
    TWF: [
      "Replace cutting tool at the next stop.",
      "Reset the tool life counter after replacement.",
      "Verify workpiece surface finish after change-out.",
    ],
  };
  const severity: DiagnosisResult["severity"] =
    prediction.probability > 0.85 ? "Critical" : prediction.probability > 0.7 ? "High" : "Moderate";
  const riskLevel: DiagnosisResult["riskLevel"] =
    severity === "Critical" ? "Critical" : severity === "High" ? "High" : "Medium";
  const baseCost = { HDF: 4800, OSF: 6200, PWF: 9400, TWF: 2200 }[type];
  const downtime = { HDF: 6, OSF: 8, PWF: 12, TWF: 2 }[type];

  return {
    type,
    fullName: FAILURE_META[type].name,
    confidence: Math.min(0.97, 0.7 + prediction.probability * 0.25),
    rootCause: rootCauses[type],
    severity,
    riskLevel,
    estimatedCost: Math.round(baseCost * (0.8 + prediction.probability * 0.6)),
    expectedDowntimeHours: Math.round(downtime * (0.8 + prediction.probability * 0.6)),
    recommendations: recs[type],
  };
}

// -------- Risk assessment --------
export type RiskInputs = {
  latitude: number;
  longitude: number;
  ambientTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  current: number;
  voltage: number;
  gasSignal: number;
  vibration: number;
  insulationResistance: number;
  historicalFailures: number;
  daysSinceLastFailure: number;
  equipmentType: string;
};

export type RiskResult = {
  score: number; // 0..100
  level: "Low" | "Medium" | "High" | "Critical";
  weather: number;
  electrical: number;
  mechanical: number;
  environmentalImpact: string;
  operationalImpact: string;
  timeline: { day: string; score: number }[];
};

export function runRisk(i: RiskInputs): RiskResult {
  const weather = clamp01(
    (i.ambientTemperature - 15) / 30 +
      i.humidity / 200 +
      i.windSpeed / 60 +
      i.precipitation / 30,
  );
  const powerDrift = Math.abs(i.voltage - 230) / 40 + Math.abs(i.current - 12) / 20;
  const electrical = clamp01(powerDrift + (1 - i.insulationResistance / 100) * 0.6 + i.gasSignal / 100);
  const mechanical = clamp01(
    i.vibration / 10 + i.historicalFailures / 12 + Math.max(0, 1 - i.daysSinceLastFailure / 180) * 0.4,
  );
  const combined = weather * 0.25 + electrical * 0.35 + mechanical * 0.4;
  const score = Math.round(combined * 100);
  const level: RiskResult["level"] =
    score < 30 ? "Low" : score < 55 ? "Medium" : score < 78 ? "High" : "Critical";

  const timeline = Array.from({ length: 14 }, (_, idx) => {
    const drift = Math.sin(idx / 2) * 4 + idx * 0.8;
    return { day: `D${idx + 1}`, score: Math.max(4, Math.min(99, score - 8 + drift)) };
  });

  return {
    score,
    level,
    weather: Math.round(weather * 100),
    electrical: Math.round(electrical * 100),
    mechanical: Math.round(mechanical * 100),
    environmentalImpact:
      weather > 0.6
        ? "Ambient conditions are elevating operational stress on outdoor components."
        : "Ambient conditions are within a stable operating window.",
    operationalImpact:
      mechanical > 0.6
        ? "Recent operational patterns suggest accelerated mechanical fatigue."
        : "Operational patterns remain within expected fatigue envelopes.",
    timeline,
  };
}

// -------- Maintenance priority --------
export type PriorityInputs = {
  temperature: number;
  vibration: number;
  pressure: number;
  acoustic: number;
  inspectionDuration: number;
  downtimeCost: number;
  technicianAvailability: number; // 0..1
  riskScore: number; // 0..100
  vibrationDeviation: number;
  highRiskIndicator: 0 | 1;
};

export type PriorityResult = {
  priority: "Immediate" | "High" | "Medium" | "Low";
  urgency: number; // 0..1
  financialImpact: number;
  window: string;
  technician: string;
  expectedDowntimeHours: number;
  rationale: string;
};

export function runPriority(i: PriorityInputs): PriorityResult {
  const stress =
    i.temperature / 120 +
    i.vibration / 10 +
    i.pressure / 200 +
    i.acoustic / 100 +
    i.vibrationDeviation / 5 +
    i.riskScore / 100 +
    (i.highRiskIndicator ? 0.4 : 0);
  const norm = clamp01(stress / 5);
  let priority: PriorityResult["priority"];
  if (norm > 0.75) priority = "Immediate";
  else if (norm > 0.55) priority = "High";
  else if (norm > 0.35) priority = "Medium";
  else priority = "Low";

  const financialImpact = Math.round(
    i.downtimeCost * (i.inspectionDuration / 4) * (0.6 + norm * 1.2),
  );

  const window =
    priority === "Immediate"
      ? "Within the next 4 hours"
      : priority === "High"
        ? "Within the next 24 hours"
        : priority === "Medium"
          ? "Within the next 3–5 days"
          : "Within the next 2 weeks";

  const technician =
    i.technicianAvailability > 0.7
      ? "On-site senior technician available now."
      : i.technicianAvailability > 0.4
        ? "Regional technician available within business hours."
        : "Escalate to third-party service partner.";

  return {
    priority,
    urgency: norm,
    financialImpact,
    window,
    technician,
    expectedDowntimeHours: Math.round(i.inspectionDuration * (0.9 + norm)),
    rationale:
      priority === "Immediate"
        ? "The maintenance priority has been elevated due to elevated vibration, projected downtime cost and combined risk signals."
        : priority === "High"
          ? "Multiple operational indicators are trending above nominal ranges and warrant a near-term intervention."
          : priority === "Medium"
            ? "Some indicators are approaching attention thresholds; schedule the next planned maintenance cycle."
            : "All indicators are within expected operating ranges; keep the standard preventive plan.",
  };
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

// -------- RAG mock knowledge base --------
export type KnowledgeArticle = {
  cause: string;
  symptoms: string[];
  repair: string[];
  safety: string[];
  checklist: string[];
  spares: string[];
  bestPractices: string[];
  preventive: string[];
  sources: { title: string; ref: string }[];
};

export const KNOWLEDGE: Record<FailureType, KnowledgeArticle> = {
  HDF: {
    cause: "Reduced heat dissipation from restricted airflow and undersized cooling margin between process and ambient air.",
    symptoms: ["Gradual temperature rise", "Reduced rotational cooling", "Elevated surface temperature"],
    repair: [
      "Isolate and lock out the equipment.",
      "Inspect and clean cooling fins and intake filters.",
      "Verify coolant lines and pump pressure.",
      "Recommission and monitor for one production cycle.",
    ],
    safety: ["Allow the unit to cool before opening panels.", "Use insulated gloves.", "Verify de-energization."],
    checklist: ["Cooling fan operation", "Airflow paths clear", "Ambient temperature within spec", "Coolant level and quality"],
    spares: ["Intake filter", "Cooling fan assembly", "Thermal paste", "Temperature sensor"],
    bestPractices: ["Quarterly cooling inspection", "Ambient monitoring in enclosed cabinets"],
    preventive: ["Trend temperature weekly", "Rebalance cooling load seasonally"],
    sources: [
      { title: "Thermal Management Handbook", ref: "TMH-2024 §4.2" },
      { title: "Plant Maintenance Standard", ref: "PMS-118 rev.7" },
    ],
  },
  OSF: {
    cause: "Sustained torque above design envelope with accumulated tool wear.",
    symptoms: ["Elevated torque readings", "Reduced surface finish quality", "Audible strain"],
    repair: [
      "Reduce feed rate and stop the cycle safely.",
      "Replace tooling and verify mounting torque.",
      "Recalibrate feed and speed parameters.",
    ],
    safety: ["Lock out spindle before tool change.", "Wear cut-resistant gloves.", "Support workpiece during removal."],
    checklist: ["Tool integrity", "Fixture rigidity", "Feed rate settings", "Torque profile logs"],
    spares: ["Cutting tool", "Tool holder", "Fixture clamps"],
    bestPractices: ["Monitor torque profiles per part", "Progressive feed strategy for hard materials"],
    preventive: ["Set tool life alerts", "Rotate tools proactively"],
    sources: [
      { title: "Machining Overload Guide", ref: "MOG-311 §2.5" },
      { title: "Tooling Reliability Manual", ref: "TRM-2023" },
    ],
  },
  PWF: {
    cause: "Power delivery has drifted outside the stable operating band, indicating supply or drivetrain instability.",
    symptoms: ["Voltage sag", "Unusual current spikes", "Motor stutter under load"],
    repair: [
      "Isolate the drive and verify supply integrity.",
      "Inspect windings and connectors for wear.",
      "Replace failing electrical components and retest.",
    ],
    safety: ["Verify zero-energy state.", "Use insulated tools.", "Follow arc-flash procedures."],
    checklist: ["Supply voltage", "Motor windings", "Drive controller logs", "Grounding integrity"],
    spares: ["Motor drive controller", "Contactor", "Fuses", "Cable harness"],
    bestPractices: ["Continuous power quality monitoring", "Scheduled thermographic inspections"],
    preventive: ["Log power profile monthly", "Predictive analytics on drive telemetry"],
    sources: [
      { title: "Electrical Systems Reliability", ref: "ESR-405 §6" },
      { title: "IEEE Motor Protection Guide", ref: "IEEE 3004.8" },
    ],
  },
  TWF: {
    cause: "The cutting tool has reached the end of its effective service life.",
    symptoms: ["Increased tool wear counter", "Surface finish degradation", "Rising cutting forces"],
    repair: [
      "Stop the cycle at a safe point.",
      "Replace the tool with a validated spare.",
      "Reset the tool life counter and log the change.",
    ],
    safety: ["Lock out spindle.", "Use gloves during handling.", "Dispose of used tooling per procedure."],
    checklist: ["Tool life counter", "Surface finish quality", "Chip formation", "Post-change verification"],
    spares: ["Cutting tool", "Insert set", "Collet"],
    bestPractices: ["Rotate tools proactively", "Track tool life per job"],
    preventive: ["Automated tool life alerts", "Standardized change-out procedure"],
    sources: [
      { title: "Cutting Tool Lifecycle Standard", ref: "CTLS-2022" },
      { title: "Production Quality Handbook", ref: "PQH-91 §3.1" },
    ],
  },
};

export function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

export function formatPct(v: number, digits = 0) {
  return `${(v * 100).toFixed(digits)}%`;
}