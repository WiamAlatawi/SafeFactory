# 🏭 SafeFactory Intelligence

**AI-powered predictive maintenance platform for industrial equipment.**

SafeFactory turns raw sensor and machine data into actionable maintenance intelligence — predicting failures before they happen, diagnosing root causes, scoring equipment risk, and prioritizing maintenance actions, all backed by trained machine learning models and a RAG-based AI maintenance copilot.

---

## ✨ Features

- **Failure Prediction** — predicts the likelihood of equipment failure from live sensor readings
- **Failure Diagnosis** — classifies the type/cause of a detected or predicted failure
- **Risk Assessment** — scores equipment risk level to support inspection planning
- **Maintenance Priority** — ranks maintenance actions by urgency and impact
- **AI Assistant** — a Retrieval-Augmented Generation (RAG) copilot for maintenance Q&A, grounded in a domain knowledge base
- **Intelligence Report** — a consolidated dashboard view tying prediction → diagnosis → risk → priority together

---

## 🧱 Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (TanStack Router + Vite + SSR via Nitro) |
| UI | React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix primitives) |
| Animation | Framer Motion |
| Charts | Recharts |
| Runtime / Package Manager | [Bun](https://bun.sh) |

### Backend
| Layer | Technology |
|---|---|
| API | FastAPI (Python) |
| ML | scikit-learn, XGBoost, imbalanced-learn, joblib |
| Data | pandas, numpy |
| AI Copilot | OpenAI API (RAG pipeline) |
| Package Manager | [uv](https://github.com/astral-sh/uv) |

---

## 📂 Project Structure

```
SafeFactory/
├── src/                          # Frontend (TanStack Start)
│   ├── routes/
│   │   ├── index.tsx              # Landing page
│   │   ├── app.tsx                # App shell (sidebar layout)
│   │   ├── app.prediction.tsx     # Failure Prediction module
│   │   ├── app.diagnosis.tsx      # Failure Diagnosis module
│   │   ├── app.risk.tsx           # Risk Assessment module
│   │   ├── app.priority.tsx       # Maintenance Priority module
│   │   ├── app.assistant.tsx      # AI Assistant (RAG) module
│   │   └── app.report.tsx         # Intelligence Report module
│   ├── components/
│   │   ├── app/                   # AppShell, InsightCard, PageHeader
│   │   ├── site/                  # Landing page chrome (nav, footer)
│   │   └── ui/                    # shadcn/ui component library
│   └── lib/
│       ├── inference.ts           # Client-side AI inference logic
│       └── pipeline-store.ts      # Cross-module pipeline state (React context)
│
├── python_server/
│   └── main.py                    # FastAPI entry point
│
├── backend_analysis/SafeFactory/
│   ├── Model/                     # Trained ML models (.pkl)
│   │   ├── binary_failure_model.pkl
│   │   ├── multiclass_failure_model.pkl
│   │   ├── risk_score_model.pkl
│   │   └── maintenance_priority_model.pkl
│   ├── NoteBooks/                 # Model training & experimentation notebooks
│   ├── data/                      # Training/reference datasets
│   └── rag.py                     # RAG pipeline for the AI Assistant
│
├── requirements.txt                # Backend dependencies (pip)
├── pyproject.toml                  # Backend dependencies (uv)
├── package.json                    # Frontend dependencies (bun)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh) (frontend runtime)
- Python 3.11+ and [uv](https://github.com/astral-sh/uv) (or plain `pip`) for the backend
- An OpenAI API key (for the AI Assistant / RAG module)

### 1. Clone the repository
```bash
git clone https://github.com/WiamAlatawi/SafeFactory.git
cd SafeFactory
```

### 2. Frontend setup
```bash
bun install
bun run dev        # starts the Vite dev server on port 5000
```

### 3. Backend setup
```bash
cd python_server
uv sync             # or: pip install -r requirements.txt
```

Create a `.env` file (see `.env.example`) with:
```
OPENAI_API_KEY=your-key-here
```

Run the API server:
```bash
uvicorn main:app --reload
```

---

## 🤖 Machine Learning Models

Four models power the platform's predictive capabilities, trained on industrial equipment sensor data (including the [AI4I 2020 Predictive Maintenance dataset](https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset)):

| Model | Purpose |
|---|---|
| `binary_failure_model.pkl` | Predicts whether a failure will occur (yes/no) |
| `multiclass_failure_model.pkl` | Classifies the *type* of failure |
| `risk_score_model.pkl` | Produces a continuous equipment risk score |
| `maintenance_priority_model.pkl` | Ranks maintenance actions by priority |

Training notebooks are available under `backend_analysis/SafeFactory/NoteBooks/`.

---

## 📖 Documentation

- Model training details: `backend_analysis/SafeFactory/NoteBooks/`
- Test case guide: see project documentation
- Interactive risk map and presentation materials: included in project deliverables

---

## 👤 Authors

**Wiam Alatawi**

**Mohammed Albalawi**

**Nawal Alkhalifah**

**Abdulrahman almuharib**
