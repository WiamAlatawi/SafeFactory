---
name: SafeFactory backend architecture
description: Python FastAPI server wrapping 4 trained ML models; frontend calls /api/* with no local calculations.
---

## Architecture

Python FastAPI server at `python_server/main.py`, port 8000.
Vite dev server (port 5000) proxies `/api/*` → `http://localhost:8000`.
Frontend (`src/lib/inference.ts`) is a pure HTTP client — no calculations.

**Why:** User requires every displayed value to be traceable to a backend model or dataset. No hardcoded business values allowed.

**How to apply:** Any new metric shown in the UI must come from a `/api/*` endpoint response. Never compute values in TypeScript.

## 4 Models + Exact Features

### Binary Failure Model (XGBClassifier)
- File: `Model/binary_failure_model.pkl` (keys: model, threshold=0.5, features)
- Dataset: AI4I 2020 — 10,000 rows (UCI/Kaggle)
- Features: `Type` (L→0,M→1,H→2), `Air temperature K`, `Process temperature K`, `Rotational speed rpm`, `Torque Nm`, `Tool wear min`
- Output: `fail_prob` (0–1), `will_fail` (bool, threshold=0.5)

### Multiclass Failure Model (XGBClassifier)
- File: `Model/multiclass_failure_model.pkl` (keys: model, label_encoder, features)
- Dataset: AI4I 2020 — failure rows only
- Features: Same 6 as binary
- Classes: HDF, OSF, PWF, TWF (NO RNF — not in multiclass)
- Output: `failure_type` string

### Risk Score Model (RandomForestRegressor)
- File: `Model/risk_score_model.pkl` (keys: model, feature_columns)
- Dataset: `distribution_equipment_risk_dataset.csv` (1,000 rows)
- Features (18): location_lat, location_long, ambient_temperature_C, humidity_percent, wind_speed_mps, precipitation_mm, load_current_A, voltage_kV, smart_meter_gasp_signal, vibration_level_g, insulation_resistance_MOhm, historical_failures_count, time_since_last_failure_days + equipment_type one-hot (Cable/CircuitBreaker/Relay/Switch/Transformer)
- Output: `risk_score` (0–1 float), `risk_level` derived (Low<0.35, Medium<0.60, High<0.80, Critical≥0.80)

### Priority Model (RandomForestClassifier, balanced)
- File: `Model/maintenance_priority_model.pkl` (keys: model, features)
- Dataset: `smart_maintenance_dataset.csv` (1,430 rows)
- Features (10): Temp_C, Vibration_mm_s, Pressure_Bar, Acoustic_dB, Inspection_Duration_min, Downtime_Cost_USD, Technician_Availability_pct, Risk_Score, Vibration_Deviation, Vibration_High_Risk
- Server derives: Vibration_Deviation = vibration - 2.5; Vibration_High_Risk = int(vibration > 4.0)
- Classes: 1=Low (308), 2=Medium (1048), 3=High (74)
- Note: Failure_Prob excluded from features (data leakage). Risk_Score IS a feature — pre-fill from risk module.

## Knowledge Base
- File: `data/failure_knowledge_base.csv` (12 rows)
- Retrieved via TF-IDF cosine similarity in Python server
- Costs/downtime are KB fields (not model predictions): HDF=$1,500/4h · OSF=$1,800/6h · PWF=$2,500/8h · TWF=$700/2h · RNF=$1,200/3h
- Always label KB values as "Knowledge base field — not a model prediction"

## Copilot (RAG)
- TF-IDF vectorizer + cosine similarity (server-side)
- OpenAI gpt-4o-mini optional (requires OPENAI_API_KEY secret)
- Falls back to KB text answer if no API key
- Endpoint: POST /api/ask with {question, failure_type}

## Workflows
- "Start application": `bun run dev` → port 5000 (Vite, webview)
- "Python API Server": `python3.11 python_server/main.py` → port 8000 (console)

## API Key
- Hardcoded key was in backend_analysis/SafeFactory/.env (extracted zip) — NOT in project root
- No .env in project root
- OPENAI_API_KEY should be set as Replit secret for LLM generation
