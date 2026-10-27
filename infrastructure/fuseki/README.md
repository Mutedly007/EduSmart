# Apache Jena Fuseki — SPARQL Server Infrastructure

## Role and Purpose in EduSmart

**Apache Jena Fuseki** is the planned RDF triple store and SPARQL server for the **EduSmart** Semantic Web platform. It provides:
1. **SPARQL 1.1 Protocol Endpoints**: Serving SPARQL Query (`/query`), SPARQL Update (`/update`), and Graph Store Protocol (`/data`) over HTTP.
2. **Persistent Storage (TDB2)**: High-performance transactional persistence for RDF/OWL graphs representing courses, prerequisites, competencies, learning outcomes, and instructors.
3. **Web Administration Console**: A visual interface running on port `3030` for inspecting graphs, uploading RDF datasets, and running manual queries.

---

## Architecture: Backend & Frontend Communication Pipeline

```
┌─────────────────────────────────┐
│     EduSmart React Frontend     │
│  (NL Search, SPARQL Explorer)   │
└────────────────┬────────────────┘
                 │ HTTP JSON (Native Fetch)
                 ▼
┌─────────────────────────────────┐
│       FastAPI Python Backend    │
│  - app/semantic (RDFLib/Fuseki) │
│  - app/nlp (spaCy / TALN rules) │
└────────────────┬────────────────┘
                 │ SPARQL 1.1 HTTP Protocol
                 │ Accept: application/sparql-results+json
                 ▼
┌─────────────────────────────────┐
│    Apache Jena Fuseki Server    │
│       (:3030/edusmart)          │
└─────────────────────────────────┘
```

1. **Frontend to Backend**:
   - The user inputs natural language queries or custom SPARQL in the React web dashboard.
   - The frontend issues HTTP requests using the native Fetch API to the FastAPI backend.
   - All query results, metadata, and graph structures are returned to the frontend strictly as standard JSON.

2. **Backend to Fuseki**:
   - The FastAPI backend communicates with Fuseki asynchronously over HTTP (using `httpx`).
   - Queries are issued via `POST /edusmart/query` with `Content-Type: application/x-www-form-urlencoded` or `application/sparql-query` and header `Accept: application/sparql-results+json`.
   - The backend validates, shapes, and sanitizes SPARQL results before delivering them to the frontend.

---

## Running Fuseki Locally

### Option A: Using Docker Compose (Recommended if Docker is installed)

1. Navigate to the `infrastructure/fuseki` directory:
   ```powershell
   cd infrastructure/fuseki
   ```

2. Start the Fuseki container in detached mode:
   ```powershell
   docker compose up -d
   ```

3. Verify that Fuseki is running:
   ```powershell
   docker compose ps
   # Open browser at http://localhost:3030
   ```

4. Credentials:
   - **Username**: `admin`
   - **Password**: `admin` (configured in `docker-compose.yml`)

5. Stopping the container:
   ```powershell
   docker compose down
   ```

> [!NOTE]
> In Phase 1, `docker-compose.yml` launches an empty Fuseki server. No datasets (such as `/edusmart`) are automatically created, and no RDF triples are loaded. Creating the dataset and loading the validated ontology will occur in subsequent phases.

---

### Option B: Standalone Apache Jena Fuseki (No Docker Required)

If Docker is not installed on your machine (e.g. native Windows development):

1. **Prerequisite**: Java 17+ or Java 21+ must be installed (`java -version`).
2. **Download**: Download the official Apache Jena Fuseki distribution (zip/tar.gz) from:
   https://jena.apache.org/download/
3. **Extract**: Extract the zip archive to a local folder (e.g., `C:\Tools\apache-jena-fuseki-5.x.x`).
4. **Run on Windows (PowerShell)**:
   ```powershell
   cd C:\Tools\apache-jena-fuseki-5.x.x
   .\fuseki-server.bat
   ```
5. **Run on Linux / macOS**:
   ```bash
   cd /opt/apache-jena-fuseki-5.x.x
   ./fuseki-server
   ```
6. Access the web interface at `http://localhost:3030`.

---

## Configuration Variables Reference

The FastAPI backend uses the following environment variables (defined in `backend/.env`):

| Variable | Default Value | Description |
|---|---|---|
| `FUSEKI_BASE_URL` | `http://localhost:3030` | Root URL of the Fuseki server |
| `FUSEKI_DATASET` | `edusmart` | Target dataset identifier |
| `FUSEKI_QUERY_ENDPOINT` | `http://localhost:3030/edusmart/query` | SPARQL 1.1 Query endpoint |
| `FUSEKI_UPDATE_ENDPOINT` | `http://localhost:3030/edusmart/update` | SPARQL 1.1 Update endpoint |

---

## Current Status (Phase 1)

- Infrastructure files and documentation are prepared.
- Fuseki is in **Standby** mode. The backend and frontend explicitly report that Fuseki is not yet connected to avoid false status indicators.
- No datasets or RDF/OWL files have been committed or injected.
