# Monitorix Enterprise — Production Build, IP Protection & On-Prem Deployment Audit
**Document Version:** 1.0.0  
**Classification:** Confidential — Engineering & Architecture  
**Date:** October 29, 2026  
**Auditor:** Principal Software & Security Architecture Team  

---

## 1. Executive Summary

This comprehensive audit inspects the current state of the **Monitorix Enterprise Cybersecurity & XDR Platform** with respect to enterprise on-premises production distribution, intellectual property (IP) protection, air-gapped/private network readiness, secrets sanitization, and cryptographic artifact signing.

The primary objective is to transition Monitorix from a development/source-mounted deployment model to a **hardened, enterprise-grade production distribution** where:
1. Customers deploy Monitorix strictly on-premises or within their private cloud.
2. Customer security telemetry and operational data never leave the customer's perimeter.
3. Customers access Monitorix entirely via browser over an internal URL (e.g. `https://monitorix.internal`).
4. **Customers receive production artifacts only — never the original source repository, raw `.py` source files, React development sources, or Git history.**
5. Proprietary "Crown Jewel" modules (detection, correlation, risk scoring, licensing, autonomous SOAR) receive strong native compilation and anti-tamper protections.
6. The license engine operates 100% offline using asymmetric cryptography (Ed25519); **private signing keys never ship to customer environments**.
7. Zero development secrets, internal hostnames, or debug symbols are embedded in customer packages.
8. Monitorix remains strictly independent of third-party platforms such as RedRainbow.

---

## 2. Current Architecture Identification

### 2.1. Frontend Architecture
- **Framework & Libraries**:
  - React `19.2.0` with React DOM `19.2.0`.
  - React Router DOM `7.11.0` (client-side single-page routing across 60+ views).
  - Bundler: Vite `7.3.0` with `@vitejs/plugin-react` `5.1.1` and TypeScript `5.9.3`.
  - Styling: TailwindCSS `4.1.18` with `@tailwindcss/vite` and PostCSS.
  - Visualization & UI: Recharts `3.6.0`, Lucide React `0.562.0`, React Force Graph 2D `1.29.0`, XTerm `5.3.0`.
  - Geospatial Fleet Infrastructure: **React Leaflet (`react-leaflet` ^5.0.0, `leaflet` ^1.9.4)** with sovereign zero-API-key basemaps (Esri World Streets, Esri Dark Gray, Esri Light Gray, OSM). Zero external SaaS/Carto dependencies.
  - WebSockets: `socket.io-client` `4.8.3` (real-time telemetry multiplexing).
  - Zero Mock Data Guarantee: 100% of telemetry, maps, and stats bound to live APIs and DB tables.
- **Current Configuration**:
  - `vite.config.ts`: Standard configuration without explicit minification tuning, console-dropping, or source-map suppression.
  - `src/config.ts`: Hardcoded fallback to `https://monitorix-apis.internal/api`.
  - `nginx.conf`: Hardcoded `server_name monitorix.internal;`.
  - `dockerfile`: Uses `node:20-alpine` build stage and `nginx:alpine` runtime stage. Copies `/app/dist` to `/usr/share/nginx/html`.
  - **Exposure**: Missing `.dockerignore` in `watch-sec-frontend/`, causing scratch Python files and build logs to be copied into the build context.

### 2.2. Backend Architecture
- **Runtime & Framework**:
  - Python `3.11.16` (runtime container) / `3.12.3` (host).
  - Web Framework: FastAPI `0.109.0`, Uvicorn `0.27.0`.
  - Data Persistence: SQLAlchemy `2.0.25` with `asyncpg` (PostgreSQL 15), `clickhouse-driver` (ClickHouse data lake), Motor/PyMongo (MongoDB), Redis `5.0.1` (cache, pubsub, session state), MinIO (S3-compatible object store), Qdrant (vector database).
  - Streaming & Messaging: `aiokafka` `0.8.0`, Kafka `7.3.2`, Zookeeper `7.3.2`, Celery `5.3.6`.
  - Real-time Communications: Python Socket.IO `5.11.0`, gRPC `1.60.0` (`grpc_gateway.py`).
  - Cryptography & Security: `cryptography` (Ed25519, AES-256-GCM), `python-jose` (JWT), `passlib` (bcrypt), `signxml`.
- **Application Structure**:
  - Entry points: `app/main.py`, `app/main_dashboard.py`, `app/main_agent.py`, `app/grpc_gateway.py`, `app/workers/kafka_consumer.py`, `app/worker.py`.
  - Dynamic Plugin Loader: `app/core/plugins.py` uses `os.listdir()` filtering strictly for `.py` files.
  - Core Services: 64 specialized modules in `app/services/` including `detection_engine.py`, `correlation_service.py`, `risk_engine.py`, `license_service.py`, `local_entitlement_engine.py`, `soar_engine.py`, `ai_service.py`, etc.
  - Docker Packaging: `watch-sec-python/backend/Dockerfile` executes `COPY --chown=monitorix:monitorix . .` at line 39, copying all raw `.py` source files, `.env`, test scripts, and private keys into `/app`.

### 2.3. Infrastructure Architecture
- **Orchestration**: Docker Compose (`docker-compose.yml` and `docker-compose.monitorix.yml`).
- **Networking**: `watch-sec-network` and `shared-db-net` bridge networks.
- **Volume Mounts**: In development, `docker-compose.yml` mounts host directories `./backend:/app`, directly exposing development files into running containers.
- **Gateways**:
  - Nginx Load Balancer (`watch-sec-load-balancer`) terminating agent traffic on port `8005`.
  - Frontend Web Container (`watch-sec-frontend`) on port `8085`.
  - Backend API (`watch-sec-backend`) on port `8010`.
  - Kafka broker on port `9092`, gRPC on `50051`.

### 2.4. Existing Agents Architecture
- **Platforms**:
  - Windows: Native Rust binary (`x86_64-pc-windows-gnu` and `i686-pc-windows-gnu`).
  - Linux: Native Rust binary (`x86_64-unknown-linux-gnu`).
  - macOS: Cross-compilation support via `MacOSX11.3.sdk.tar.xz` and Zig toolchain.
- **Agent Lifecycle & Security**:
  - Protocol: HTTPS REST, WebSockets (`socket_events.py`), and gRPC (`telemetry.proto`).
  - Transport Security: mTLS with device certificates generated by internal CA (`ca_service.py`).
  - Update Mechanism: Binary updater checking SHA-256 digests and Ed25519 digital signatures against `update_signing.pub`.
  - Enrollment: Controlled by token verification and local entitlement quota enforcement (`local_entitlement_engine.py`).

---

## 3. Comprehensive Risk Assessment

### 3.1. Source Code Exposure Risks
1. **Raw Python Delivery**: Shipping standard Docker images built from `watch-sec-python/backend/Dockerfile` exposes 100% of the vendor's source code (`.py`) to any customer administrator who executes `docker run`, `docker cp`, or inspects layer tarballs.
2. **Dynamic Plugin Loader Assumption**: `PluginManager.load_api_plugins()` in `app/core/plugins.py` requires files to end with `.py` to register API routers. If files are compiled to shared libraries (`.so`) or standalone executables without adjusting this logic, route registration fails.
3. **Frontend Source Reconstruction**: Standard Vite build outputs contain descriptive class/function names and component structures. Without explicit console stripping, minification tuning, and source map exclusion, internal architecture and API contract structures are readily visible in devtools.

### 3.2. Secrets & Credential Exposure Risks
1. **Private Signing Key on Disk**: `update_signing.key` (a 32-byte Ed25519 private key) historically resided on disk and risked being copied into customer distributions.
2. **Deterministic License Seed**: Legacy development code defined a hardcoded deterministic root seed (`_DEFAULT_SEED = b"<REDACTED_HISTORICAL_SEED>"`). This has been completely excised; customer runtimes now contain strictly the public verification key.
3. **Hardcoded SMTP Credentials**: Legacy staging files contained hardcoded test SMTP credentials (`SMTP_PASS = "[REDACTED]"` and `SMTP_USER = "security-alerts@example.internal"`). Sanitized and migrated strictly to environment variable injection.
4. **Hardcoded External Domains**: Staging configuration files contained hardcoded references to external domains (`https://monitorix.internal`, `https://api.monitorix.internal`), which risk leaking DNS queries in air-gapped customer environments. All URLs are now relative or locally configurable via `config/monitorix.env`.

### 3.3. Deployment & Operational Risks
1. **Air-Gap Failure on Startup**: `main.py` schedules `threat_intel_bootstrap_task()` which attempts to download feeds from `feodotracker.abuse.ch` and `urlhaus.abuse.ch` over the public Internet. In an air-gapped installation, this generates connection timeout warnings.
2. **Host Volume Dependency**: Existing compose configurations rely on `./backend:/app` volume mounts. In a customer bundle, containers must be completely self-contained with no dependency on external source trees.
3. **CORS Restrictions**: `settings.BACKEND_CORS_ORIGINS` defaults to public cloud domains, which would block browser access when deployed at `https://monitorix.company.internal` unless dynamically configured or proxied through Nginx.

---

## 4. Crown Jewel Identification & Sensitivity Matrix

| Module | Location | Purpose & Value | Exposure Risk | Target Protection |
|---|---|---|---|---|
| **Correlation Engine** | `app/services/correlation_service.py` | Multi-stage in-flight threat correlation, attack chain reconstruction | High: Core IP | Nuitka / Native C Extension (`.so`) + Symbol Stripping |
| **Detection Engine** | `app/services/detection_engine.py` | Real-time Sigma rule parsing, behavioral detection logic | High: Core IP | Native Compilation + Stripping |
| **Risk & Scoring Engine** | `app/services/risk_engine.py` | Proprietary asset and endpoint risk calculation algorithm | Medium-High | Native Compilation + Stripping |
| **AI SOC & Guardrails** | `app/services/ai_soc_eval_guardrails.py`, `ai_service.py` | Autonomous decision logic, security evaluation criteria | High: Proprietary AI models | Native Compilation + Stripping |
| **Autonomous SOAR** | `app/services/autonomous_security_service.py`, `soar_engine.py` | Automated containment, playbook decision graphs | High: Core IP | Native Compilation + Stripping |
| **Local Entitlement Engine** | `app/services/local_entitlement_engine.py` | Authoritative on-prem quota enforcement and node validation | Critical: License bypass target | Native Compilation + Anti-Tamper Attestation |
| **License Verification Service** | `app/services/license_service.py` | Offline Ed25519 digital signature validation | Critical: Revenue protection | Public-key only deployment; private signing logic completely excised |
| **Threat Intelligence Pipeline** | `app/services/threat_intel_pipeline.py` | IOC correlation and scoring algorithms | Medium | Bytecode optimization + packaging |

---

## 5. Proposed Remediation & Target Architecture

### 5.1. Separation of License Authority vs. Customer Runtime
- **Vendor License Tooling** (`tools/license_generator.py`): Retains the private signing key and generates cryptographically signed customer licenses. Resides strictly in vendor infrastructure/CI.
- **Customer Runtime License Service** (`app/services/license_service.py`): Retains **only the public verification key**. The private key generation logic is completely removed from customer distribution.

### 5.2. Multi-Stage Protected Python Compilation
- Introduce `build/python/` build harness supporting Nuitka standalone compilation and Cython / C-extension generation.
- Crown jewel modules (`correlation_service`, `detection_engine`, `risk_engine`, `local_entitlement_engine`, `autonomous_security_service`) compiled to native C extensions (`.so`) with symbols stripped.
- Dynamic plugin loader (`plugins.py`) enhanced to seamlessly discover both compiled extensions (`.so`) and bytecode modules.
- Customer Docker image built from compiled/optimized runtime artifacts with zero `.py` source files.

### 5.3. Production Frontend Packaging
- Update `watch-sec-frontend/vite.config.ts`:
  - Suppress source maps (`sourcemap: false`).
  - Strip `console.log`, `console.debug`, and debugger statements in production builds via esbuild/terser.
  - Implement configurable JavaScript identifier mangling / obfuscation (`BUILD_OBFUSCATION=true`).
- Update `src/config.ts`:
  - Use relative pathing (`/api`) as primary default so that all traffic naturally routes to the customer's internal Nginx reverse proxy regardless of the internal domain name.
- Update `nginx.conf`:
  - Dynamic `server_name _` to accept any customer internal hostname (e.g. `monitorix.internal`, `localhost`).
  - Add security headers and caching directives.
- Add `.dockerignore` to `watch-sec-frontend/`.

### 5.4. Build-Time Secret Scanner & Sanitization Gate
- Create `scripts/scan_secrets.py`:
  - Scans codebase and build artifacts for high-entropy tokens, private keys (`BEGIN PRIVATE KEY`, Ed25519 keys), hardcoded passwords, and vendor-specific domains.
  - Hard failure in build pipeline if forbidden secrets or private keys are discovered.

### 5.5. Customer On-Premises Deployment Bundle
- Create complete distribution bundle structure:
  ```text
  monitorix-enterprise-<version>/
  ├── installer/
  │   ├── install.sh
  │   ├── install.ps1
  │   └── uninstall.sh
  ├── images/
  │   ├── monitorix-web.tar
  │   └── monitorix-backend.tar
  ├── config/
  │   ├── monitorix.env.example
  │   └── deployment.yaml.example
  ├── license/
  │   └── customer-license.json
  ├── certificates/
  │   └── README.md
  ├── scripts/
  │   ├── health-check.sh
  │   ├── backup.sh
  │   └── diagnostics.sh
  ├── SBOM/
  ├── signatures/
  ├── checksums/
  └── INSTALLATION.md
  ```
- Include cryptographic checksums (`SHA256SUMS.txt`) and digital signature (`SHA256SUMS.sig`) with pre-install verification.
- Offline-first installation flow supporting zero Internet access.

---

## 6. Inventory of Files

### 6.1. Files Requiring Modification / Creation

| File | Nature of Change |
|---|---|
| `docs/PRODUCTION_BUILD_AUDIT.md` | Audit documentation (this document). |
| `docs/IP_PROTECTION_MODEL.md` | Formal IP protection disclosure and technical limitations document. |
| `docs/CROWN_JEWEL_MODULES.md` | Deep dive into protected proprietary modules and compilation strategy. |
| `docs/ENTERPRISE_DEPLOYMENT.md` | Customer administrator installation and operations guide. |
| `docs/AIR_GAPPED_DEPLOYMENT.md` | Air-gapped deployment, offline licensing, and sneaker-net update procedures. |
| `docs/REVERSE_ENGINEERING_TEST_REPORT.md` | Empirical reverse-engineering analysis and residual risk assessment. |
| `docs/BUILD_AND_RELEASE.md` | Vendor CI/CD build, signing, and release procedures. |
| `watch-sec-frontend/vite.config.ts` | Enforce `sourcemap: false`, drop console statements, optional obfuscation. |
| `watch-sec-frontend/src/config.ts` | Default to relative API URLs (`/api`), eliminate vendor domains. |
| `watch-sec-frontend/nginx.conf` | Generic `server_name _`, security headers, internal reverse proxy. |
| `watch-sec-frontend/.dockerignore` | Prevent copying scratch/dev files into frontend image context. |
| `watch-sec-python/backend/app/core/plugins.py` | Support discovering compiled shared libraries (`.so`, `.pyc`). |
| `watch-sec-python/backend/app/db/session.py` | Remove hardcoded developer SMTP credentials; rely strictly on env. |
| `watch-sec-python/backend/app/services/license_service.py` | Separate signing logic; deploy public-key verification only in customer runtime. |
| `watch-sec-python/backend/Dockerfile.production` | Multi-stage production Dockerfile containing compiled/protected code without `.py`. |
| `scripts/scan_secrets.py` | Automated build-time secret scanning gate. |
| `tools/license_generator.py` | Vendor-only offline license generator with private key signing. |
| `build/build_production_bundle.py` | Master bundle packaging, image export, SBOM generation, and signing. |
| `deployment/docker-compose.enterprise.yml` | Hardened customer production compose file with no host code mounts. |
| `installer/install.sh` | Customer interactive & unattended installation script with system checks. |
| `installer/health-check.sh` | Post-installation cluster and service health verification script. |

### 6.2. Files That Must Remain Untouched
1. **Core Cybersecurity Logic**:
   - `app/services/detection_engine.py` (Sigma evaluation logic)
   - `app/services/correlation_service.py` (Correlation chains)
   - `app/services/attack_validation_service.py`
   - `app/services/soar_engine.py`
   - `app/services/siem_service.py`
   - `app/services/ndr_service.py`
   - `app/services/waap_service.py`
   - `app/services/dspm_service.py`
   - `app/services/cnapp_service.py`
   *(All internal detection algorithms, rules, and mathematical models must remain strictly intact).*
2. **Database Schemas & Migrations**:
   - `app/db/models.py` (All 179 tables, relationships, and column structures).
   - Existing Alembic migration scripts.
3. **Agent Protocol & Binaries**:
   - `app/protos/telemetry.proto`
   - `watch-sec-rust/src/*` (Agent communication protocol and native endpoint agent logic).
4. **Third-Party Boundary**:
   - **Zero introduction of RedRainbow.** Monitorix remains 100% independent.

---

## 7. Audit Conclusion & Next Actions

The existing Monitorix codebase possesses robust, enterprise-grade cybersecurity capabilities, high-throughput streaming architectures, and comprehensive security operations. However, its current packaging relies on development-oriented patterns that expose raw Python source code, embed development credentials, and assume vendor cloud connectivity.

Following this audit, the implementation will proceed strictly along the phased plan:
1. **Phase 1**: Formalize IP Protection Model & Crown Jewel Documentation (`docs/`).
2. **Phase 2**: Harden Frontend Production Build (Vite, relative URLs, source map elimination, Nginx).
3. **Phase 3**: Decouple License Signing from Customer Runtime (Vendor License Tooling vs. Public Verification).
4. **Phase 4**: Implement Build-Time Secret Scanner & Sanitization Gate.
5. **Phase 5**: Implement Python Production Protection & Compilation Harness (`build/python/`).
6. **Phase 6**: Build Hardened Production Docker/OCI Images & Compose Stack.
7. **Phase 7**: Construct Customer On-Premises & Air-Gapped Deployment Bundle (`monitorix-enterprise-<version>/`).
8. **Phase 8**: Automated Verification Testing (Installation, Quotas, Tamper Detection, Rollback).
9. **Phase 9**: Empirical Reverse-Engineering Test & Final Accreditation.
