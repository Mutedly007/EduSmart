# EduSmart — Semantic Web Platform for Education & Training

[![Phase](https://img.shields.io/badge/Phase-1%3A%20Environment%20%26%20UI%20Foundation-blue.svg)](#)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776AB.svg?logo=python&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](#)
[![Vite](https://img.shields.io/badge/Vite-6%2B-646CFF.svg?logo=vite&logoColor=white)](#)
[![SPARQL](https://img.shields.io/badge/SPARQL-1.1%20W3C-005A9C.svg)](#)
[![Fuseki](https://img.shields.io/badge/Apache%20Jena-Fuseki-ED8B00.svg)](#)

EduSmart is a Semantic Web knowledge platform tailored for the **Education and Training** domain. It is built in accordance with the university **Web Semantics** project requirements, designed to bridge structured OWL 2/RDF domain ontologies, Apache Jena Fuseki triplestore servers, and a custom rule-based Natural Language Processing (TALN) question-to-SPARQL translation engine.

> **Current Phase Status:** **Phase 1 — Initial Environment Setup, Architecture, Configuration, and Frontend Design Only.**  
> In accordance with strict project guidelines, no ontology classes, RDF individuals, fake SPARQL executions, or hosted LLMs have been introduced.

---

## 1. Project Architecture

The repository is structured as a clean monorepo separating the user interface, backend application engine, semantic knowledge graph layer, and triplestore infrastructure:

```text
edusmart/
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind CSS dashboard
│   ├── public/
│   │   └── favicon.svg           # EduSmart vector favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/           # AppLayout, Sidebar, TopBar (live health check)
│   │   │   └── ui/               # StatusDot, Badge, Card components
│   │   ├── pages/                # Dashboard + 6 future module workspaces
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── NLSearchPage.tsx
│   │   │   ├── SPARQLExplorerPage.tsx
│   │   │   ├── KnowledgeGraphPage.tsx
│   │   │   ├── DataManagementPage.tsx
│   │   │   ├── OntologyOverviewPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── hooks/                # useBackendHealth polling hook
│   │   ├── services/             # Native Fetch API client for FastAPI
│   │   ├── types/                # Strict TypeScript interface contracts
│   │   ├── lib/                  # Utility functions
│   │   ├── App.tsx               # Client-side routing configuration
│   │   ├── main.tsx              # DOM root mount
│   │   └── index.css             # Tailwind base layers, typography, tokens
│   ├── .env.example              # Frontend environment template
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── backend/                      # Python 3 + FastAPI application engine
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       └── health.py     # Truthful / and /health verification endpoints
│   │   ├── core/
│   │   │   └── config.py         # Pydantic BaseSettings environment loader
│   │   ├── schemas/              # Pydantic request and response models
│   │   ├── services/             # Future business logic services
│   │   ├── semantic/             # RDFLib & Fuseki HTTP client layer (README)
│   │   ├── nlp/                  # spaCy & TALN rule-based SPARQL translator (README)
│   │   └── main.py               # FastAPI instance, CORS, error handlers
│   ├── tests/
│   │   └── test_health.py        # Pytest test suite for health & root endpoints
│   ├── requirements.txt          # Python dependencies (FastAPI, RDFLib, spaCy, httpx)
│   └── .env.example              # Backend environment template
├── infrastructure/
│   └── fuseki/
│       ├── docker-compose.yml    # Optional local Apache Jena Fuseki container
│       └── README.md             # Detailed guide for Docker and Standalone Fuseki
├── .gitignore                    # Comprehensive multi-language ignore rules
└── README.md                     # Platform documentation (this file)
```

---

## 2. Technology Choices & Their Roles

| Component | Technology | Role & Justification |
|---|---|---|
| **Frontend UI** | **React 19 + TypeScript** | Strongly typed, reactive user interface for interacting with semantic web workflows. |
| **Build Tool** | **Vite** | Fast Hot-Module Replacement (HMR) and optimized ES module bundling. |
| **Styling** | **Tailwind CSS** | Tailored academic color palette (slate navy surfaces, academic blue accents, restrained shadows). |
| **Icons** | **Lucide React** | Consistent, lightweight, accessible icon set across all navigation and cards. |
| **Routing** | **React Router DOM v7** | Client-side routing across the 7 application views. |
| **Backend API** | **FastAPI + Uvicorn** | High-performance asynchronous Python API providing automatic OpenAPI documentation (`/docs`). |
| **Validation** | **Pydantic v2** | Data schema validation and environment configuration parsing. |
| **Semantic Web** | **RDFLib** | In-memory graph parsing, serialization, and local ontology validation (Phase 2+). |
| **SPARQL Server**| **Apache Jena Fuseki** | W3C SPARQL 1.1 protocol server with TDB2 transactional storage for graph persistence. |
| **NLP / TALN**   | **spaCy (Non-LLM)** | Local natural-language processing pipeline for rule-based question-to-SPARQL translation. |
| **Ontology Editor** | **Protégé 5.x (External)** | Standard academic tool for OWL 2 ontology engineering. |
| **Reasoner**     | **HermiT 1.4.x (External)**| Description Logic reasoner run within Protégé for consistency and classification checking. |

---

## 3. Strict Project Policies & Constraints

1. **Non-LLM Translation Rule**: Per university requirements, no hosted or generative LLMs (OpenAI, Gemini, Claude, etc.) are permitted for SPARQL query construction. Translation must be deterministic, utilizing linguistic analysis (spaCy) and custom semantic mapping rules.
2. **External Ontology Engineering**: Protégé and the HermiT reasoner are maintained as external desktop tools. No automatic installation is performed.
3. **Truthful Connection Status**: The frontend and backend never claim that Fuseki or the ontology is connected unless an active dataset check actually succeeds. Standby status is explicitly reported.

---

## 4. Prerequisites

- **Node.js**: `v20.x` or higher (verified with Node `v20.19.6` and npm `11.17.0`)
- **Python**: `3.11`, `3.12`, or `3.13` (verified with Python `3.13.0`)
- **Docker** *(Optional)*: If running Apache Jena Fuseki via Docker Compose.
- **Java 17+** *(Optional)*: Required only if running Apache Jena Fuseki in standalone mode without Docker.

---

## 5. Getting Started & Installation

### Step 1: Clone and Configure Environment

```powershell
# Clone the repository
git clone https://github.com/Mutedly007/EduSmart.git
cd EduSmart

# Create backend .env from example template
Copy-Item backend\.env.example backend\.env

# Create frontend .env from example template
Copy-Item frontend\.env.example frontend\.env
```

*Linux / macOS equivalent:*
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

---

### Step 2: Backend Setup (FastAPI Python)

#### On Windows (PowerShell):
```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# Run pytest test suite
pytest tests

# Start FastAPI development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### On Linux / macOS:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pytest tests
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/health`

---

### Step 3: Frontend Setup (React + Vite)

In a separate terminal:

#### On Windows (PowerShell):
```powershell
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Run TypeScript check and production build
npm run build

# Start Vite local development server
npm run dev
```

#### On Linux / macOS:
```bash
cd frontend
npm install
npm run build
npm run dev
```

- Web Dashboard URL: `http://127.0.0.1:5173`

---

### Step 4: Semantic Web Infrastructure (Apache Jena Fuseki)

#### Option A: Docker Compose (Recommended if Docker is installed)
```powershell
cd infrastructure/fuseki
docker compose up -d

# Open web console at http://localhost:3030
# Default credentials: admin / admin
```

#### Option B: Standalone Apache Jena Fuseki (No Docker)
1. Download Apache Jena Fuseki distribution (`.zip`) from: https://jena.apache.org/download/
2. Extract to a local directory (e.g. `C:\Tools\jena-fuseki`).
3. Run on Windows:
   ```powershell
   cd C:\Tools\jena-fuseki
   .\fuseki-server.bat
   ```
   Or on Linux/macOS:
   ```bash
   ./fuseki-server
   ```
4. Access the administration interface at `http://localhost:3030`.

> [!NOTE]
> In Phase 1, Fuseki runs without pre-populated datasets. Creating the `/edusmart` dataset and uploading the validated ontology will occur in Phase 3.

---

## 6. External Tools: Protégé & HermiT Reasoner Workflow

1. **Protégé 5.x Desktop**:
   - Download Protégé Desktop from: https://protege.stanford.edu/
   - Open Protégé and model the **Education and Training** domain ontology:
     - Classes: `edu:Course`, `edu:Competency`, `edu:Degree`, `edu:Instructor`, `edu:TrainingProgram`.
     - Object Properties: `edu:hasPrerequisite`, `edu:teachesSkill`, `edu:leadsToCertification`.
     - Data Properties: `edu:hasCredits`, `edu:courseDurationWeeks`, `edu:ectsPoints`.
2. **HermiT DL Reasoner**:
   - Under the **Reasoner** menu in Protégé, select **HermiT**.
   - Click **Start Reasoner** to verify ontology consistency, class satisfiability, and inferred taxonomies.
   - Address any incoherencies or circular dependencies.
3. **Exporting**:
   - Save/export the checked ontology as `edusmart.owl` (Turtle or RDF/XML).
   - Place the file into `backend/ontology/edusmart.owl` for ingestion in Phase 2.

---

## 7. Development Roadmap & Phasing

- [x] **Phase 1: Environment Setup & Foundation** *(Completed)*
  - Monorepo directory structure established.
  - FastAPI backend initialized with CORS, configuration, schemas, `/health`, and `/` endpoints.
  - React + Vite + TypeScript + Tailwind CSS dashboard shell created.
  - Live backend connection health polling integrated with truthful status indicators.
  - Complete UI mockup and placeholder workspaces for all 6 target modules.
  - Apache Jena Fuseki Docker Compose and Standalone infrastructure documented.
  - Zero-warning TypeScript build and 100% passing Pytest suite verified.
- [ ] **Phase 2: Ontology Integration & Rule-Based NLP Translation**
  - Ingestion of Protégé-validated `edusmart.owl` via RDFLib.
  - spaCy language model integration (`en_core_web_sm`).
  - Linguistic parsing, intent recognition, and ontology entity linking.
  - Deterministic question-to-SPARQL translation without external LLM APIs.
- [ ] **Phase 3: Triplestore Publication & Visual Explorer**
  - Apache Jena Fuseki `/edusmart` dataset creation and persistence (TDB2).
  - Asynchronous HTTP SPARQL execution client in FastAPI backend.
  - Interactive D3 / Force-directed knowledge graph canvas rendering.
  - Natural Language question execution end-to-end with results export.
