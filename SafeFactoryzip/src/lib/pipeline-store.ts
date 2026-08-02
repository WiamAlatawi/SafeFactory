import { createContext, useContext } from "react";
import type { PredictionInputs, PredictionResult, DiagnosisResult, RiskResult, PriorityResult } from "./inference";

export type PipelineState = {
  predictionInputs: PredictionInputs | null;
  prediction: PredictionResult | null;
  diagnosis: DiagnosisResult | null;
  risk: RiskResult | null;
  priority: PriorityResult | null;
  setPrediction: (i: PredictionInputs, r: PredictionResult) => void;
  setDiagnosis: (d: DiagnosisResult | null) => void;
  setRisk: (r: RiskResult | null) => void;
  setPriority: (p: PriorityResult | null) => void;
  reset: () => void;
};

export const PipelineContext = createContext<PipelineState | null>(null);

export function usePipeline() {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error("usePipeline must be used inside PipelineProvider");
  return ctx;
}