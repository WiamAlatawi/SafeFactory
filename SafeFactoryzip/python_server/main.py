"""
SafeFactory unified inference & copilot API.

Combines the best of both original implementations:
  - Structured FastAPI endpoints for programmatic access to all 4 trained
    models (binary failure, multiclass failure type, risk score, maintenance
    priority) — from the original inference server.
  - A conversational /api/chat endpoint that extracts sensor readings from
    free text via an LLM, accumulates them across turns, and returns
    friendly, non-technical explanations grounded in the knowledge base —
    from the original CLI assistant.

Key improvements over the originals:
  - Per-session state instead of one shared global dict, so concurrent users
    don't clobber each other's readings.
  - Shared prediction/explanation logic used by both the REST /api/predict
    endpoint and the conversational /api/chat endpoint (no duplicated code).
  - Model/data paths are overridable via env vars for portability.
  - LLM calls are wrapped in try/except with a non-LLM fallback everywhere.
"""
from __future__ import annotations

import os
import re
import json
import warnings
from pathlib import Path
from typing import Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

warnings.filterwarnings("ignore")
load_dotenv()

# ── paths ─────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
MODEL_DIR = Path(os.getenv("SAFEFACTORY_MODEL_DIR", ROOT / "backend_analysis/SafeFactory/Model"))
DATA_DIR = Path(os.getenv("SAFEFACTORY_DATA_DIR", ROOT / "backend_analysis/SafeFactory/data"))
KB_PATH = DATA_DIR / "failure_knowledge_base.csv"

# ── load models + KB at import time ─────────────────────────────────────────
_binary_pkg = joblib.load(MODEL_DIR / "binary_failure_model.pkl")
_multi_pkg = joblib.load(MODEL_DIR / "multiclass_failure_model.pkl")
_risk_pkg = joblib.load(MODEL_DIR / "risk_score_model.pkl")
_priority_pkg = joblib.load(MODEL_DIR / "maintenance_priority_model.pkl")

BINARY_MODEL = _binary_pkg["model"]
BINARY_THRESHOLD = _binary_pkg.get("threshold", 0.5)
BINARY_FEATURES = _binary_pkg["features"]

MULTI_MODEL = _multi_pkg["model"]
MULTI_ENCODER = _multi_pkg["label_encoder"]
MULTI_FEATURES = _multi_pkg["features"]

RISK_MODEL = _risk_pkg["model"]
RISK_FEATURES = _risk_pkg["feature_columns"]

PRIORITY_MODEL = _priority_pkg["model"]
PRIORITY_FEATURES = _priority_pkg["features"]

TYPE_MAP = {"L": 0, "M": 1, "H": 2}
EQUIPMENT_TYPES = ["Cable", "CircuitBreaker", "Relay", "Switch", "Transformer"]

CHAT_FIELDS = [
    "Type",
    "Air temperature K",
    "Process temperature K",
    "Rotational speed rpm",
    "Torque Nm",
    "Tool wear min",
]
FIELD_PROMPTS = {
    "Type": "Machine type (L / M / H)",
    "Air temperature K": "Air temperature (K)",
    "Process temperature K": "Process temperature (K)",
    "Rotational speed rpm": "Rotational speed (rpm)",
    "Torque Nm": "Torque (Nm)",
    "Tool wear min": "Tool wear (min)",
}

# ── knowledge base + TF-IDF retriever ───────────────────────────────────────
_kb_df = pd.read_csv(KB_PATH)
KB: dict[str, dict] = {row["Failure_Type"]: row.to_dict() for _, row in _kb_df.iterrows()}

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _row_to_text(row: pd.Series) -> str:
    return (
        f"Failure Type: {row['Failure_Type']}\n"
        f"Description: {row['Description']}\n"
        f"Symptoms: {row['Symptoms']}\n"
        f"Typical Indicators: {row['Typical_Indicators']}\n"
        f"Root Cause: {row['Root_Cause']}\n"
        f"Severity: {row['Severity']}\n"
        f"Priority: {row['Priority']}\n"
        f"Estimated Cost: {row['Estimated_Cost_USD']} USD\n"
        f"Downtime: {row['Downtime_Hours']} hours\n"
        f"Recommendations: {row['Recommendation_1']}. {row['Recommendation_2']}. {row['Recommendation_3']}\n"
        f"Prevention: {row['Prevention']}\n"
        f"FAQ: {row['FAQ']}"
    )


_docs = _kb_df.apply(_row_to_text, axis=1).tolist()
_vectorizer = TfidfVectorizer(stop_words="english")
_kb_matrix = _vectorizer.fit_transform(_docs)


def retrieve_kb(query: str, top_k: int = 1) -> list[dict]:
    q_vec = _vectorizer.transform([query])
    sims = cosine_similarity(q_vec, _kb_matrix).flatten()
    idxs = sims.argsort()[::-1][:top_k]
    return [_kb_df.iloc[i].to_dict() for i in idxs]


# ── LLM helpers ──────────────────────────────────────────────────────────────
def has_openai() -> bool:
    return bool(os.getenv("OPENAI_API_KEY"))


def call_llm(prompt: str, max_tokens: int = 500) -> str:
    from openai import OpenAI

    client = OpenAI()
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content.strip()


def extract_sensor_readings(text: str) -> Optional[dict]:
    """LLM-based extraction of machine sensor readings from free text."""
    if not has_openai():
        return None
    prompt = f"""
Extract machine sensor readings from the text below.

Recognize synonyms:
Machine Type: L/l/low/light/machine l, M/m/mid/medium/machine m, H/h/high/heavy/machine h
Air Temperature: air temp, ambient temp
Process Temperature: process temp
Rotational Speed: speed, rpm, rotation speed
Torque: torque
Tool Wear: wear, tool wear

Return ONLY valid JSON, no commentary, no markdown fences:
{{
  "Type": "L|M|H|null",
  "Air temperature K": number|null,
  "Process temperature K": number|null,
  "Rotational speed rpm": number|null,
  "Torque Nm": number|null,
  "Tool wear min": number|null
}}

Text:
{text}
"""
    try:
        raw = call_llm(prompt, max_tokens=300)
    except Exception:
        return None
    raw = re.sub(r"```json|```", "", raw).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def risk_level(score: float) -> str:
    if score < 0.35:
        return "Low"
    if score < 0.60:
        return "Medium"
    if score < 0.80:
        return "High"
    return "Critical"


# ── per-session state (swap for Redis/DB in production for multi-worker deploys) ──
_sessions: dict[str, dict] = {}


def _get_session(session_id: str) -> dict:
    if session_id not in _sessions:
        _sessions[session_id] = {f: None for f in CHAT_FIELDS}
    return _sessions[session_id]


# ── shared prediction core (used by both /api/predict and /api/chat) ────────
def run_binary_multiclass(readings: dict) -> dict:
    row = readings.copy()
    row["Type"] = TYPE_MAP.get(row["Type"], row["Type"])
    X_bin = pd.DataFrame([row])[BINARY_FEATURES]
    fail_prob = float(BINARY_MODEL.predict_proba(X_bin)[0, 1])
    will_fail = bool(fail_prob >= BINARY_THRESHOLD)

    if not will_fail:
        return {"will_fail": False, "failure_type": None, "fail_prob": fail_prob}

    X_multi = pd.DataFrame([row])[MULTI_FEATURES]
    pred_idx = MULTI_MODEL.predict(X_multi)[0]
    failure_type = MULTI_ENCODER.inverse_transform([pred_idx])[0]
    return {"will_fail": True, "failure_type": failure_type, "fail_prob": fail_prob}


def _format_kb(kb_row: dict) -> dict:
    return {
        "failure_type": kb_row["Failure_Type"],
        "description": kb_row["Description"],
        "symptoms": kb_row["Symptoms"],
        "typical_indicators": kb_row["Typical_Indicators"],
        "root_cause": kb_row["Root_Cause"],
        "severity": kb_row["Severity"],
        "priority": kb_row["Priority"],
        "estimated_cost_usd": int(kb_row["Estimated_Cost_USD"]),
        "cost_percentage": int(kb_row["Cost_Percentage"]),
        "downtime_hours": int(kb_row["Downtime_Hours"]),
        "recommendation_1": kb_row["Recommendation_1"],
        "recommendation_2": kb_row["Recommendation_2"],
        "recommendation_3": kb_row["Recommendation_3"],
        "prevention": kb_row["Prevention"],
        "faq": kb_row["FAQ"],
    }


def explain_healthy(readings: dict, fail_prob: float) -> str:
    matches = retrieve_kb("No Failure")
    match = matches[0] if matches else {}
    if has_openai():
        prompt = f"""
You are a customer-friendly machine health assistant.
The machine learning model has already made the prediction. Never change it.

Machine status: Healthy
Chance of a problem: {fail_prob:.2%}
Machine information: {json.dumps(readings, indent=2)}
Knowledge base: {json.dumps(match, indent=2)}

Explain the result for a non-technical user:
- A simple explanation that the machine appears to be operating normally.
- What this means in everyday language.
- Anything worth monitoring.
- Simple preventive maintenance suggestions.
- Avoid technical jargon. Don't list raw sensor values unless necessary.
- Keep the answer short and friendly.
"""
        try:
            return call_llm(prompt, max_tokens=300)
        except Exception:
            pass
    return (
        "Your machine appears to be operating normally right now "
        f"(estimated chance of an issue: {fail_prob:.0%}). "
        "No action is needed, but keep an eye on routine wear items and "
        "stick to your regular maintenance schedule."
    )


def explain_failure(readings: dict, prediction: dict, question: str = "") -> str:
    failure_type = prediction["failure_type"]
    matches = retrieve_kb(f"failure type {failure_type}", top_k=1)
    match = matches[0] if matches else {}

    if has_openai():
        prompt = f"""
You are a customer-friendly machine health assistant.
The machine learning model has already made the prediction. Never change it.
Never invent another problem.

Customer question: {question or "What is going on with my machine?"}

Machine status: Attention Recommended
Predicted issue: {failure_type}
Chance of this issue: {prediction['fail_prob']:.2%}
Machine information: {json.dumps(readings, indent=2)}
Knowledge base: {json.dumps(match, indent=2)}

Answer for someone with no engineering background. Explain:
- What the problem means in simple language.
- Why maintenance is recommended.
- What could happen if ignored.
- Whether it should be addressed soon.
- Simple maintenance recommendations.
- Estimated repair cost if available.
- Ways to prevent this issue in the future.
Avoid technical jargon. Do not mention machine learning or sensor values.
"""
        try:
            return call_llm(prompt, max_tokens=400)
        except Exception:
            pass

    recs = [match.get("Recommendation_1"), match.get("Recommendation_2"), match.get("Recommendation_3")]
    recs = [r for r in recs if r]
    cost = match.get("Estimated_Cost_USD")
    cost_str = f"${cost:,.0f}" if cost is not None else "unavailable"
    return (
        f"Predicted issue: {failure_type} (confidence: {prediction['fail_prob']:.0%})\n"
        f"Likely cause: {match.get('Root_Cause', 'unavailable')}\n"
        f"Priority: {match.get('Priority', 'unavailable')}\n"
        f"Estimated repair cost: {cost_str}\n"
        "Recommended actions:\n" + "\n".join(f" - {r}" for r in recs)
    )


def _answer_from_kb(question: str, kb_row: dict) -> str:
    q = question.lower()
    failure_name = kb_row.get("Failure_Type", "this failure type")

    if any(w in q for w in ["repair", "procedure", "fix", "how to", "step"]):
        recs = [kb_row.get("Recommendation_1", ""), kb_row.get("Recommendation_2", ""), kb_row.get("Recommendation_3", "")]
        recs = [r for r in recs if r]
        base = f"Repair procedure for {failure_name}: " + "; ".join(f"{i+1}. {r}" for i, r in enumerate(recs)) + "."

    elif any(w in q for w in ["safe", "safety", "precaution", "hazard"]):
        prevention = kb_row.get("Prevention", "")
        base = (
            f"Safety precautions for {failure_name}: "
            f"Ensure the machine is fully shut down and powered off before any inspection. "
            f"Allow all components to cool before touching. "
            f"{prevention}."
        )

    elif any(w in q for w in ["part", "spare", "component", "replace", "need"]):
        # Extract the physical part names from the KB — hardcoded per failure type
        # since the KB stores actions ("Clean the cooling system") not part names.
        PARTS_MAP = {
            "HDF":  ["Cooling fan", "Air filter / cooling passages", "Temperature sensors", "Thermal paste / heat sink"],
            "PWF":  ["Electric motor", "Motor windings", "Gearbox / transmission", "Power supply fuses"],
            "TWF":  ["Cutting tool / insert", "Tool holder", "Collet / chuck"],
            "OSF":  ["Cutting tool / insert", "Spindle bearings", "Drive shafts"],
            "RNF":  ["Electrical connectors", "Control board fuses", "Damaged sub-component (inspect to identify)"],
        }
        parts = PARTS_MAP.get(failure_name, [])
        if parts:
            base = (
                f"Typical spare parts required for {failure_name} repair:\n"
                + "\n".join(f"• {p}" for p in parts)
            )
        else:
            recs = [kb_row.get("Recommendation_1", ""), kb_row.get("Recommendation_2", ""), kb_row.get("Recommendation_3", "")]
            recs = [r for r in recs if r]
            base = f"Consult the maintenance manual for {failure_name}. Inspection steps: " + "; ".join(recs) + "."

    elif any(w in q for w in ["prevent", "recurrence", "avoid", "future"]):
        base = kb_row.get("Prevention", "Follow the recommended preventive maintenance schedule.")

    elif any(w in q for w in ["duration", "long", "time", "how long", "downtime"]):
        hours = kb_row.get("Downtime_Hours", "—")
        base = f"Estimated downtime for {failure_name}: {hours} hours if addressed promptly."

    elif any(w in q for w in ["cost", "expensive", "price", "budget"]):
        cost = kb_row.get("Estimated_Cost_USD", 0)
        pct = kb_row.get("Cost_Percentage", "")
        base = f"Estimated repair cost for {failure_name}: ${int(cost):,} ({pct}% of typical annual maintenance budget)."

    elif any(w in q for w in ["symptom", "sign", "indicator", "detect"]):
        base = f"Symptoms of {failure_name}: {kb_row.get('Symptoms', '')}. Typical indicators: {kb_row.get('Typical_Indicators', '')}."

    elif any(w in q for w in ["cause", "why", "reason", "root"]):
        base = f"Root cause of {failure_name}: {kb_row.get('Root_Cause', '')}."

    elif any(w in q for w in ["severity", "serious", "critical", "urgent", "priority"]):
        base = (
            f"{failure_name} is classified as {kb_row.get('Severity', 'unknown')} severity "
            f"with {kb_row.get('Priority', 'unknown')} priority. "
            f"Estimated downtime if unaddressed: {kb_row.get('Downtime_Hours', '—')} hours."
        )

    else:
        base = (
            f"{kb_row.get('Description', '')} "
            f"Root cause: {kb_row.get('Root_Cause', '')}. "
            f"Severity: {kb_row.get('Severity', '')}. "
            f"Estimated cost: ${int(kb_row.get('Estimated_Cost_USD', 0)):,}, "
            f"downtime: {kb_row.get('Downtime_Hours', '—')} hours."
        )

    if not has_openai():
        return base

    prompt = f"""You are a maintenance knowledge assistant for an industrial facility.

Failure type: {failure_name}
Description: {kb_row.get('Description', '')}
Root Cause: {kb_row.get('Root_Cause', '')}
Symptoms: {kb_row.get('Symptoms', '')}
Severity: {kb_row.get('Severity', '')}
Priority: {kb_row.get('Priority', '')}
Estimated cost: ${int(kb_row.get('Estimated_Cost_USD', 0)):,}
Estimated downtime: {kb_row.get('Downtime_Hours', 0)} hours
Recommendation 1: {kb_row.get('Recommendation_1', '')}
Recommendation 2: {kb_row.get('Recommendation_2', '')}
Recommendation 3: {kb_row.get('Recommendation_3', '')}
Prevention: {kb_row.get('Prevention', '')}
FAQ: {kb_row.get('FAQ', '')}

Technician's question: {question}

Answer clearly and concisely using only the information above.
Do not invent new information. Do not mention machine learning or AI.
Keep under 150 words. Be specific and actionable."""
    try:
        return call_llm(prompt, max_tokens=300)
    except Exception:
        return base


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="SafeFactory Inference & Copilot API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ── structured (programmatic) schemas ─────────────────────────────────────────
class PredictRequest(BaseModel):
    machine_type: str
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
    equipment_type: str


class PriorityRequest(BaseModel):
    temp_c: float
    vibration_mm_s: float
    pressure_bar: float
    acoustic_db: float
    inspection_duration_min: float
    downtime_cost_usd: float
    technician_availability_pct: float
    risk_score: float


class AskRequest(BaseModel):
    question: str
    failure_type: Optional[str] = None


class ChatRequest(BaseModel):
    session_id: str
    message: str


# ── structured endpoints ──────────────────────────────────────────────────────
@app.post("/predict")
def predict(req: PredictRequest):
    row = {
        "Type": req.machine_type.upper(),
        "Air temperature K": req.air_temp_k,
        "Process temperature K": req.process_temp_k,
        "Rotational speed rpm": req.rotational_speed_rpm,
        "Torque Nm": req.torque_nm,
        "Tool wear min": req.tool_wear_min,
    }
    prediction = run_binary_multiclass(row)
    kb_entry = None
    if prediction["will_fail"]:
        kb_row = KB.get(prediction["failure_type"])
        if kb_row:
            kb_entry = _format_kb(kb_row)
    return {
        "will_fail": prediction["will_fail"],
        "fail_prob": round(prediction["fail_prob"], 4),
        "threshold": BINARY_THRESHOLD,
        "failure_type": prediction["failure_type"],
        "kb": kb_entry,
    }


@app.post("/risk")
def risk(req: RiskRequest):
    row = {
        "location_lat": req.location_lat,
        "location_long": req.location_long,
        "ambient_temperature_C": req.ambient_temperature_c,
        "humidity_percent": req.humidity_percent,
        "wind_speed_mps": req.wind_speed_mps,
        "precipitation_mm": req.precipitation_mm,
        "load_current_A": req.load_current_a,
        "voltage_kV": req.voltage_kv,
        "smart_meter_gasp_signal": req.smart_meter_gasp_signal,
        "vibration_level_g": req.vibration_level_g,
        "insulation_resistance_MOhm": req.insulation_resistance_mohm,
        "historical_failures_count": req.historical_failures_count,
        "time_since_last_failure_days": req.time_since_last_failure_days,
    }
    for et in EQUIPMENT_TYPES:
        row[f"equipment_type_{et}"] = int(req.equipment_type == et)
    X = pd.DataFrame([row])[RISK_FEATURES]
    score = float(RISK_MODEL.predict(X)[0])
    score = max(0.0, min(1.0, score))
    return {"risk_score": round(score, 4), "risk_level": risk_level(score)}


@app.post("/priority")
def priority(req: PriorityRequest):
    vibration_deviation = req.vibration_mm_s - 2.5
    vibration_high_risk = int(req.vibration_mm_s > 4.0)
    row = {
        "Temp_C": req.temp_c,
        "Vibration_mm_s": req.vibration_mm_s,
        "Pressure_Bar": req.pressure_bar,
        "Acoustic_dB": req.acoustic_db,
        "Inspection_Duration_min": req.inspection_duration_min,
        "Downtime_Cost_USD": req.downtime_cost_usd,
        "Technician_Availability_pct": req.technician_availability_pct,
        "Risk_Score": req.risk_score,
        "Vibration_Deviation": vibration_deviation,
        "Vibration_High_Risk": vibration_high_risk,
    }
    X = pd.DataFrame([row])[PRIORITY_FEATURES]
    pred = int(PRIORITY_MODEL.predict(X)[0])
    labels = {1: "Low", 2: "Medium", 3: "High"}
    windows = {
        1: "Within the next 2 weeks",
        2: "Within the next 24-72 hours",
        3: "Within the next 4 hours",
    }
    return {"priority": pred, "priority_label": labels[pred], "window": windows[pred]}


@app.post("/ask")
def ask(req: AskRequest):
    if req.failure_type and req.failure_type in KB:
        kb_row = KB[req.failure_type]
    else:
        matches = retrieve_kb(req.question, top_k=1)
        kb_row = matches[0] if matches else {}
    answer = _answer_from_kb(req.question, kb_row)
    return {
        "answer": answer,
        "failure_type": kb_row.get("Failure_Type"),
        "kb": _format_kb(kb_row) if kb_row else None,
        "llm_used": has_openai(),
    }


@app.get("/knowledge/{failure_type}")
def knowledge(failure_type: str):
    row = KB.get(failure_type)
    if not row:
        raise HTTPException(status_code=404, detail=f"Unknown failure type: {failure_type}")
    return _format_kb(row)


@app.get("/health")
def health():
    return {"status": "ok", "llm_available": has_openai(), "active_sessions": len(_sessions)}


# ── conversational endpoint ────────────────────────────────────────────────────
@app.post("/chat")
def chat(req: ChatRequest):
    """
    Multi-turn conversational front-end for the binary/multiclass failure
    models. Accumulates sensor readings across turns per session_id,
    extracting them from free text via LLM when available, then returns a
    friendly explanation once all required readings are known.
    """
    session = _get_session(req.session_id)

    if req.message.strip().lower() == "reset":
        _sessions[req.session_id] = {f: None for f in CHAT_FIELDS}
        return {"reply": "Machine information cleared. Tell me about the machine whenever you're ready."}

    extracted = extract_sensor_readings(req.message)
    if extracted:
        for key, value in extracted.items():
            if value is not None:
                session[key] = value

    missing = [f for f in CHAT_FIELDS if session[f] is None]
    if missing:
        missing_desc = [FIELD_PROMPTS[f] for f in missing]
        return {
            "reply": "I've recorded what you gave me so far. I still need:\n"
            + "\n".join(f"- {m}" for m in missing_desc),
            "missing_fields": missing,
            "readings_so_far": session,
        }

    readings = session.copy()
    prediction = run_binary_multiclass(readings)

    if not prediction["will_fail"]:
        reply = explain_healthy(readings, prediction["fail_prob"])
    else:
        reply = explain_failure(readings, prediction, question=req.message)

    return {
        "reply": reply,
        "will_fail": prediction["will_fail"],
        "failure_type": prediction["failure_type"],
        "fail_prob": round(prediction["fail_prob"], 4),
        "readings_used": readings,
    }


@app.post("/chat/reset")
def chat_reset(session_id: str):
    _sessions[session_id] = {f: None for f in CHAT_FIELDS}
    return {"status": "cleared", "session_id": session_id}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
