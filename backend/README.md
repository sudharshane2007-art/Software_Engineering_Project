# PII Sentinel - Python Backend

Autonomous Government PII Detection and Redaction Engine built with **FastAPI**, **Pydantic v2**, and modular validation services.

---

## Key Features

1. **UIDAI Verhoeff Checksum Validation (FR-06):**
   - Validates Indian 12-digit Aadhaar numbers using the dihedral group $D_5$ Verhoeff algorithm to eliminate numeric false positives.
2. **Income Tax PAN Card Verification (FR-07):**
   - Evaluates 10-character alphanumeric PAN formats (`[A-Z]{5}[0-9]{4}[A-Z]{1}`) and analyzes the 4th character identity flag (`P`, `C`, `H`, `F`, etc.).
3. **Driving Licence Recognition (FR-08):**
   - Validates Indian state & union territory RTO formats.
4. **Associated PII Detection (FR-09):**
   - Detects Indian mobile phone numbers (`+91` / 10 digits starting with 6–9), RFC-5322 emails, and Dates of Birth (`DD/MM/YYYY`).
5. **Coordinate Normalization (FR-11):**
   - Computes percentage coordinates `(x, y, width, height)` matching the React frontend document viewer.
6. **DPDP Act 2023 Non-PII Audit Ledger (FR-19, Section 2.5):**
   - Strictly logs metadata, timestamps, and redaction actions without storing or leaking raw PII.

---

## Directory Layout

```
backend/
├── app/
│   ├── main.py              # FastAPI entry point & CORS configuration
│   ├── config.py            # Application settings & limits
│   ├── models/
│   │   └── schemas.py       # Pydantic schemas (ScanResponse, PiiEntity, AuditLog, etc.)
│   ├── core/
│   │   ├── verhoeff.py      # Verhoeff checksum algorithm
│   │   ├── detector.py      # PII detection & coordinate calculator
│   │   └── redaction.py     # Sanitization & masking engine
│   ├── services/
│   │   ├── document_parser.py # Document ingestion & line extractor
│   │   └── audit_service.py # Non-PII compliance audit ledger
│   └── api/
│       └── routes.py        # API endpoints
├── tests/
│   └── test_backend.py      # Unit test suite
├── requirements.txt         # Dependencies
└── run.py                   # Server startup runner
```

---

## Running the Backend

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Server
```bash
python run.py
```
Or with uvicorn directly:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- **API Root:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`

---

## Running Unit Tests

```bash
python tests/test_backend.py
```
Or:
```bash
pytest tests/
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & engine status |
| `POST` | `/api/scan` | Ingest and scan document (file upload or raw text) |
| `POST` | `/api/redact` | Sanitize and export cleaned document |
| `GET` | `/api/audit-logs` | Retrieve non-PII compliance ledger entries |
| `GET` | `/api/audit-metrics` | Retrieve live aggregated compliance statistics |

