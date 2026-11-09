# MONITORIX — GLOBAL COMPLIANCE & REGULATORY FRAMEWORK GUIDE

## 1. Architecture Overview

```text
watch-sec-python/backend/app/compliance/
├── core/
│   ├── models.py                  # Standardized models, enums, PostureStatus, LEGAL_DISCLAIMER
│   ├── engine.py                  # Orchestrator, PostgreSQL persistence, DSR/CCPA/DSL, PDF/CSV/ZIP exports
│   ├── scoring.py                 # Severity-weighted scoring engine & multi-dimensional rollups
│   ├── applicability.py           # 32-regulation tenant scoping engine
│   ├── evidence.py                # SHA-256 tamper-evident evidence builder
│   ├── pdf_report.py              # Pure-Python %PDF-1.4 binary report generator
│   └── compliance_*.py            # Modular core re-exports
├── frameworks/
│   ├── base.py                    # BaseComplianceFramework + 14 live PostgreSQL/DSPM/DLP/Federation probes
│   ├── gdpr.py ... co_law_1581.py # All 32 statutory regulations + 20 supplemental security standards
│   └── __init__.py                # Exports all 32 run_<framework>_checks() entrypoints
├── classifiers/
│   ├── checksums.py               # 23 mathematical validators (Verhoeff, Luhn, Mod-11, EAN-13, NRIC, etc.)
│   ├── registry.py                # Context-aware + negative-context-suppressed scanner
│   └── india.py ... colombia.py   # 25 national PII classifier modules
└── registry/
    └── framework_registry.py      # Canonical 32-framework registry + alias resolution
```

---

## 2. Weighted Compliance Scoring Formula

Monitorix derives all scores strictly from live control evaluations:

$$
\text{Compliance Score} = \frac{\sum (w_i \cdot 1.0 \text{ for PASS}) + \sum (w_i \cdot 0.5 \text{ for PARTIAL})}{\sum (w_i \text{ for PASS} \cup \text{PARTIAL} \cup \text{FAIL})} \times 100
$$

- **Severity Weights ($w_i$)**: `CRITICAL = 4.0`, `HIGH = 3.0`, `MEDIUM = 2.0`, `LOW = 1.0`, `INFORMATIONAL = 0.5`.
- **Zero Fake Score Inflation**: Controls in `MANUAL_REVIEW` or `NOT_APPLICABLE` are excluded from the automated denominator so non-technical legal requirements never fabricate points.
- **Supported Score Dimensions**: Framework, Category, Country/Jurisdiction, Industry, Asset, Department, Tenant, and Organization.

---

## 3. 25-Country National PII Classifiers & Checksum Protection

Every national identifier combines **token-bounded regex**, **country scope**, **positive keyword proximity**, **negative operational keyword suppression** (`invoice`, `order_id`, `timestamp`, `epoch`, `build #`, `txid`), and **mathematical checksum validation** where defined:

- **India (`IN`)**: Aadhaar (Verhoeff), PAN, Voter ID (EPIC), Passport, Driving Licence, Mobile, IFSC, UPI.
- **USA (`US`)**: SSN (SSA area/group/serial validation), ITIN, EIN, ABA Routing (3-7-1 Mod-10), Credit Card (Luhn), Driver License, Passport, Medical Record Number.
- **Brazil (`BR`)**: CPF (2-digit Mod-11), CNPJ (2-digit Mod-11), RG, CNH, Mobile.
- **China (`CN`)**: 18-digit Resident Identity Card (ISO 7064 Mod 11-2), Mobile, Unified Social Credit Code (USCC).
- **Japan (`JP`)**: 12-digit My Number (Mod-11), Driver License, Pension Number.
- **South Korea (`KR`)**: 13-digit Resident Registration Number / RRN (weighted Mod-11), Mobile, Passport.
- **Singapore (`SG`)**: NRIC / FIN (weighted prefix-offset Mod-11 check letter), Mobile.
- **Thailand (`TH`)**: 13-digit National ID (weighted Mod-11).
- **Indonesia (`ID`)**: 16-digit NIK, 15/16-digit NPWP.
- **Australia (`AU`)**: Tax File Number / TFN (weighted Mod-11), Medicare, Passport.
- **New Zealand (`NZ`)**: IRD Number (primary/secondary weighted Mod-11), Driver Licence.
- **Canada (`CA`)**: Social Insurance Number / SIN (province prefix + Luhn), Passport.
- **United Kingdom (`GB`)**: National Insurance Number (NINO prefix exclusions), NHS Number (Mod-11).
- **Switzerland (`CH`)**: AHV / AVS `756.xxxx.xxxx.xx` (EAN-13 checksum).
- **Türkiye (`TR`)**: 11-digit T.C. Kimlik No (2-step Mod-10/Mod-10 parity validator).
- **South Africa (`ZA`)**: 13-digit SA ID (YYMMDD date + Luhn).
- **Nigeria (`NG`)**: NIN, BVN.
- **Kenya (`KE`)**: National ID, KRA PIN.
- **UAE (`AE`)**: `784-XXXX-XXXXXXX-X` Emirates ID (Luhn).
- **Saudi Arabia (`SA`)**: 10-digit National ID / Iqama (`1`/`2` prefix + Luhn).
- **Qatar (`QA`)**: 11-digit QID.
- **Mexico (`MX`)**: 18-char CURP, 12/13-char RFC.
- **Argentina (`AR`)**: DNI, CUIT / CUIL (weighted Mod-11).
- **Chile (`CL`)**: RUT / RUN (Mod-11 `0-9`/`K`).
- **Colombia (`CO`)**: Cédula de Ciudadanía, NIT.

---

## 4. REST API Reference (`/api/v2/compliance` & `/api/compliance`)

- `GET /frameworks` — List all 32 core statutory regulations (`?include_supplemental=true` adds 20 standards).
- `GET /matrix` — Machine-readable 32-regulation statutory compliance matrix.
- `GET /posture` — Multi-dimensional global compliance posture for the authenticated tenant.
- `GET /frameworks/{id}` — Full control-by-control live evaluation, findings, and SHA-256 evidence.
- `POST /frameworks/{id}/run` — Queue asynchronous background scan job (`ComplianceScanJob` + Celery task `compliance.run_scan_job`).
- `POST /evaluate-all` — Execute synchronous full 32-regulation scan.
- `GET /controls` — Filterable catalog of all 322 statutory controls.
- `GET /findings` & `POST /findings/{finding_id}/remediate` — Open gaps & audited remediation workflow.
- `GET /remediation` — Severity-ranked remediation roadmap.
- `GET /evidence` & `GET /evidence-packager?framework=...` — SHA-256 ledger & signed `.ZIP` bundle.
- `GET /pii` & `POST /pii` — 25-country PII catalog & real-time masked scanner.
- `GET /residency` — 10-region sovereign data residency topology.
- `GET /nist-mapping` — FISMA / NIST SP 800-53 Rev. 5 20-family baseline matrix (`LOW`, `MODERATE`, `HIGH`).
- `GET /dsl-assets` & `POST /dsl-assets` — China DSL 3-tier (`GENERAL_DATA`, `IMPORTANT_DATA`, `CORE_DATA`) registry.
- `GET /applicability` & `POST /applicability` — 32-regulation scoping engine.
- `GET /privacy-requests`, `POST /privacy-requests`, `PATCH /privacy-requests/{id}` — DSR / ARCO workflow queue.
- `GET /privacy-preferences` & `PUT /privacy-preferences` — Persistent CCPA/CPRA & governance settings.
- `GET /audit-history` — Tamper-evident compliance `AuditLog` trail.
- `GET /reports/{id}/export?format=pdf|csv|json` — Valid `%PDF-1.4`, CSV, and JSON report exports.

---

## 5. Running Verification & Acceptance Suites

```bash
# Live 83-assertion Global Compliance Acceptance Suite
python3 /opt/projects/monitorix/test_global_compliance_acceptance.py

# Unit & Live-DB Suite: All 32 Frameworks, 5 Control States & Weighted Scoring
docker exec watch-sec-backend python3 /tmp/test_compliance_32_frameworks.py

# Unit & Integration Suite: All 25 Country Classifiers, Checksums & False Positives
docker exec watch-sec-backend python3 /tmp/test_compliance_25_country_classifiers.py

# Security Suite: JWT Auth, RBAC, Cross-Tenant Isolation, PII Masking & PDF/ZIP Integrity
docker exec watch-sec-backend python3 /tmp/test_compliance_security_rbac_isolation.py
```

