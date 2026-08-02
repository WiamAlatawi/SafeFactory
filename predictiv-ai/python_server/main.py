"""
SafeFactory Python inference server.
Wraps 4 trained ML models + KB retrieval + optional LLM copilot.
"""
from __future__ import annotations

import os
import json
import re
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── paths ─────────────────────────────────────────────────────────────────────
ROOT      = Path(__file__).parent.parent
MODEL_DIR = ROOT / "backend_analysis/SafeFactory/Model"
DATA_DIR  = ROOT / "backend_analysis/SafeFactory/data"
KB_PATH   = DATA_DIR / "failure_knowledge_base.csv"

# ── load models + KB at startup ───────────────────────────────────────────────
import warnings
warnings.filterwarnings("ignore")

_binary_pkg   = joblib.load(MODEL_DIR / "binary_failure_model.pkl")
_multi_pkg    = joblib.load(MODEL_DIR / "multiclass_failure_model.pkl")
_risk_pkg     = joblib.load(MODEL_DIR / "risk_score_model.pkl")
_priority_pkg = joblib.load(MODEL_DIR / "maintenance_priority_model.pkl")

BINARY_MODEL     = _binary_pkg["model"]
BINARY_THRESHOLD = _binary_pkg.get("threshold", 0.5)
BINARY_FEATURES  = _binary_pkg["features"]

MULTI_MODEL    = _multi_pkg["model"]
MULTI_ENCODER  = _multi_pkg["label_encoder"]
MULTI_FEATURES = _multi_pkg["features"]

RISK_MODEL    = _risk_pkg["model"]
RISK_FEATURES = _risk_pkg["feature_columns"]   # list of 18 column names incl. dummies

PRIORITY_MODEL    = _priority_pkg["model"]
PRIORITY_FEATURES = _priority_pkg["features"]  # list of 10

TYPE_MAP = {"L": 0, "M": 1, "H": 2}

# ── knowledge base ────────────────────────────────────────────────────────────
_kb_df = pd.read_csv(KB_PATH)
KB: dict[str, dict] = {}
for _, row in _kb_df.iterrows():
    KB[row["Failure_Type"]] = row.to_dict()

# TF-IDF retriever for copilot
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def _row_to_text(row: pd.Series) -> str:
    return (
        f"Failure Type: {row['Failure_Type']}\n"
        f"Description: {row['Description']}\n"
        f"Symptoms: {row['Symptoms']}\n"
        f"Root Cause: {row['Root_Cause']}\n"
        f"Severity: {row['Severity']}\n"
        f"Priority: {row['Priority']}\n"
        f"Recommendations: {row['Recommendation_1']}. {row['Recommendation_2']}. {row['Recommendation_3']}\n"
        f"Prevention: {row['Prevention']}\n"
        f"FAQ: {row['FAQ']}"
    )

_docs = _kb_df.apply(_row_to_text, axis=1).tolist()
_vectorizer = TfidfVectorizer(stop_words="english")
_kb_matrix  = _vectorizer.fit_transform(_docs)

def _retrieve(query: str, top_k: int = 1) -> list[dict]:
    q_vec = _vectorizer.transform([query])
    sims  = cosine_similarity(q_vec, _kb_matrix).flatten()
    idxs  = sims.argsort()[::-1][:top_k]
    return [_kb_df.iloc[i].to_dict() for i in idxs]

# ── OpenAI (optional) ─────────────────────────────────────────────────────────
def _has_openai() -> bool:
    return bool(os.getenv("OPENAI_API_KEY"))

def _call_llm(prompt: str) -> str:
    from openai import OpenAI
    client = OpenAI()
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
    )
    return resp.choices[0].message.content.strip()

# ── risk level thresholds (derived from dataset distribution) ─────────────────
def _risk_level(score: float) -> str:
    if score < 0.35:   return "Low"
    if score < 0.60:   return "Medium"
    if score < 0.80:   return "High"
    return "Critical"

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="SafeFactory Inference API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── schemas ───────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    machine_type: str         # L / M / H
    air_temp_k: float
    process_temp_k: float
    rotational_speed_rpm: float
    torque_nm: float
    tool_wear_min: float

class RiskRequest(BaseModel):
    location_lat: float
    location_long: float
    ambient_temperature_c: float
    humidity_percent: float
    wind_speed_mps: float
    precipitation_mm: float
    load_current_a: float
    voltage_kv: float
    smart_meter_gasp_signal: float
    vibration_level_g: float
    insulation_resistance_mohm: float
    historical_failures_count: float
    time_since_last_failure_days: float
    equipment_type: str       # Cable / CircuitBreaker / Relay / Switch / Transformer

class PriorityRequest(BaseModel):
    temp_c: float
    vibration_mm_s: float
    pressure_bar: float
    acoustic_db: float
    inspection_duration_min: float
    downtime_cost_usd: float
    technician_availability_pct: float
    risk_score: float         # 0–1, ideally from risk assessment

class AskRequest(BaseModel):
    question: str
    failure_type: Optional[str] = None   # HDF / OSF / PWF / TWF / None

# ── endpoints ─────────────────────────────────────────────────────────────────

@app.post("/api/predict")
def predict(req: PredictRequest):
    type_code = TYPE_MAP.get(req.machine_type.upper(), 1)
    row = {
        "Type": type_code,
        "Air temperature K": req.air_temp_k,
        "Process temperature K": req.process_temp_k,
        "Rotational speed rpm": req.rotational_speed_rpm,
        "Torque Nm": req.torque_nm,
        "Tool wear min": req.tool_wear_min,
    }
    X = pd.DataFrame([row])[BINARY_FEATURES]

    fail_prob   = float(BINARY_MODEL.predict_proba(X)[0, 1])
    will_fail   = bool(fail_prob >= BINARY_THRESHOLD)
    failure_type = None
    kb_entry    = None

    if will_fail:
        X_multi = pd.DataFrame([row])[MULTI_FEATURES]
        pred_idx     = MULTI_MODEL.predict(X_multi)[0]
        failure_type = MULTI_ENCODER.inverse_transform([pred_idx])[0]
        kb_row       = KB.get(failure_type)
        if kb_row:
            kb_entry = {
                "failure_type":       kb_row["Failure_Type"],
                "description":        kb_row["Description"],
                "symptoms":           kb_row["Symptoms"],
                "typical_indicators": kb_row["Typical_Indicators"],
                "root_cause":         kb_row["Root_Cause"],
                "severity":           kb_row["Severity"],
                "priority":           kb_row["Priority"],
                "estimated_cost_usd": int(kb_row["Estimated_Cost_USD"]),
                "cost_percentage":    int(kb_row["Cost_Percentage"]),
                "downtime_hours":     int(kb_row["Downtime_Hours"]),
                "recommendation_1":   kb_row["Recommendation_1"],
                "recommendation_2":   kb_row["Recommendation_2"],
                "recommendation_3":   kb_row["Recommendation_3"],
                "prevention":         kb_row["Prevention"],
                "faq":                kb_row["FAQ"],
            }

    return {
        "will_fail":    will_fail,
        "fail_prob":    round(fail_prob, 4),
        "threshold":    BINARY_THRESHOLD,
        "failure_type": failure_type,
        "kb":           kb_entry,
    }


@app.post("/api/risk")
def risk(req: RiskRequest):
    # Build one-hot encoded row matching training features
    equipment_types = ["Cable", "CircuitBreaker", "Relay", "Switch", "Transformer"]
    row = {
        "location_lat":                req.location_lat,
        "location_long":               req.location_long,
        "ambient_temperature_C":       req.ambient_temperature_c,
        "humidity_percent":            req.humidity_percent,
        "wind_speed_mps":              req.wind_speed_mps,
        "precipitation_mm":            req.precipitation_mm,
        "load_current_A":              req.load_current_a,
        "voltage_kV":                  req.voltage_kv,
        "smart_meter_gasp_signal":     req.smart_meter_gasp_signal,
        "vibration_level_g":           req.vibration_level_g,
        "insulation_resistance_MOhm":  req.insulation_resistance_mohm,
        "historical_failures_count":   req.historical_failures_count,
        "time_since_last_failure_days":req.time_since_last_failure_days,
    }
    # one-hot: equipment_type_Cable, etc.
    for et in equipment_types:
        row[f"equipment_type_{et}"] = int(req.equipment_type == et)

    X = pd.DataFrame([row])[RISK_FEATURES]
    risk_score = float(RISK_MODEL.predict(X)[0])
    risk_score = max(0.0, min(1.0, risk_score))  # clamp to [0,1]

    return {
        "risk_score": round(risk_score, 4),
        "risk_level": _risk_level(risk_score),
    }


@app.post("/api/priority")
def priority(req: PriorityRequest):
    # Derive computed features from vibration
    vibration_deviation  = req.vibration_mm_s - 2.5   # deviation from dataset mean
    vibration_high_risk  = int(req.vibration_mm_s > 4.0)

    row = {
        "Temp_C":                    req.temp_c,
        "Vibration_mm_s":            req.vibration_mm_s,
        "Pressure_Bar":              req.pressure_bar,
        "Acoustic_dB":               req.acoustic_db,
        "Inspection_Duration_min":   req.inspection_duration_min,
        "Downtime_Cost_USD":         req.downtime_cost_usd,
        "Technician_Availability_pct": req.technician_availability_pct,
        "Risk_Score":                req.risk_score,
        "Vibration_Deviation":       vibration_deviation,
        "Vibration_High_Risk":       vibration_high_risk,
    }
    X = pd.DataFrame([row])[PRIORITY_FEATURES]
    pred = int(PRIORITY_MODEL.predict(X)[0])

    labels = {1: "Low", 2: "Medium", 3: "High"}
    windows = {
        1: "Within the next 2 weeks",
        2: "Within the next 24–72 hours",
        3: "Within the next 4 hours",
    }
    return {
        "priority":       pred,
        "priority_label": labels[pred],
        "window":         windows[pred],
    }


@app.post("/api/ask")
def ask(req: AskRequest):
    # Retrieve KB entry
    if req.failure_type and req.failure_type in KB:
        kb_row = KB[req.failure_type]
    else:
        results = _retrieve(req.question, top_k=1)
        kb_row  = results[0] if results else {}

    # Build fallback text answer from KB
    question_lower = req.question.lower()
    if any(w in question_lower for w in ["repair", "procedure", "fix", "how to"]):
        kb_answer = f"{kb_row.get('Recommendation_1', '')}. {kb_row.get('Recommendation_2', '')}. {kb_row.get('Recommendation_3', '')}"
    elif any(w in question_lower for w in ["safe", "safety", "precaution"]):
        kb_answer = f"Safety: {kb_row.get('Prevention', '')}. {kb_row.get('FAQ', '')}"
    elif any(w in question_lower for w in ["part", "spare", "component"]):
        kb_answer = f"Refer to the maintenance manual for {kb_row.get('Failure_Type', 'this failure type')}. Key indicators: {kb_row.get('Typical_Indicators', '')}."
    elif any(w in question_lower for w in ["prevent", "recurrence", "avoid"]):
        kb_answer = kb_row.get("Prevention", "Follow the recommended preventive maintenance schedule.")
    elif any(w in question_lower for w in ["duration", "long", "time", "how long"]):
        kb_answer = f"Estimated downtime: {kb_row.get('Downtime_Hours', '—')} hours based on knowledge base records for this failure type."
    elif any(w in question_lower for w in ["cost", "expensive", "price"]):
        kb_answer = f"Estimated repair cost: ${int(kb_row.get('Estimated_Cost_USD', 0)):,} ({kb_row.get('Cost_Percentage', '')}% of typical maintenance budget). Source: knowledge base."
    else:
        kb_answer = (
            f"{kb_row.get('Description', '')} "
            f"Root cause: {kb_row.get('Root_Cause', '')}. "
            f"Severity: {kb_row.get('Severity', '')}."
        )

    # If LLM available, generate a richer answer
    if _has_openai():
        prompt = f"""You are a maintenance knowledge assistant for an industrial facility.

Failure type detected: {kb_row.get('Failure_Type', 'Unknown')}

Knowledge base entry:
- Description: {kb_row.get('Description', '')}
- Root Cause: {kb_row.get('Root_Cause', '')}
- Symptoms: {kb_row.get('Symptoms', '')}
- Severity: {kb_row.get('Severity', '')}
- Estimated cost: ${int(kb_row.get('Estimated_Cost_USD', 0)):,}
- Estimated downtime: {kb_row.get('Downtime_Hours', 0)} hours
- Recommendations: {kb_row.get('Recommendation_1', '')}; {kb_row.get('Recommendation_2', '')}; {kb_row.get('Recommendation_3', '')}
- Prevention: {kb_row.get('Prevention', '')}

Maintenance technician's question:
{req.question}

Answer clearly and concisely. Only use information from the knowledge base above.
Do not invent new information. Do not mention machine learning or AI.
Keep response under 150 words."""
        try:
            answer = _call_llm(prompt)
        except Exception:
            answer = kb_answer
    else:
        answer = kb_answer

    return {
        "answer": answer,
        "failure_type": kb_row.get("Failure_Type"),
        "kb": {
            "failure_type":       kb_row.get("Failure_Type"),
            "description":        kb_row.get("Description"),
            "symptoms":           kb_row.get("Symptoms"),
            "typical_indicators": kb_row.get("Typical_Indicators"),
            "root_cause":         kb_row.get("Root_Cause"),
            "severity":           kb_row.get("Severity"),
            "estimated_cost_usd": int(kb_row.get("Estimated_Cost_USD", 0)),
            "downtime_hours":     int(kb_row.get("Downtime_Hours", 0)),
            "recommendation_1":   kb_row.get("Recommendation_1"),
            "recommendation_2":   kb_row.get("Recommendation_2"),
            "recommendation_3":   kb_row.get("Recommendation_3"),
            "prevention":         kb_row.get("Prevention"),
            "faq":                kb_row.get("FAQ"),
        },
        "llm_used": _has_openai(),
    }


@app.get("/api/knowledge/{failure_type}")
def knowledge(failure_type: str):
    row = KB.get(failure_type)
    if not row:
        return {"error": f"Unknown failure type: {failure_type}"}
    return {
        "failure_type":       row["Failure_Type"],
        "description":        row["Description"],
        "symptoms":           row["Symptoms"],
        "typical_indicators": row["Typical_Indicators"],
        "root_cause":         row["Root_Cause"],
        "severity":           row["Severity"],
        "priority":           row["Priority"],
        "estimated_cost_usd": int(row["Estimated_Cost_USD"]),
        "cost_percentage":    int(row["Cost_Percentage"]),
        "downtime_hours":     int(row["Downtime_Hours"]),
        "recommendation_1":   row["Recommendation_1"],
        "recommendation_2":   row["Recommendation_2"],
        "recommendation_3":   row["Recommendation_3"],
        "prevention":         row["Prevention"],
        "faq":                row["FAQ"],
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "llm_available": _has_openai()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
