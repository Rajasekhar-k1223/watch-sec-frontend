# Monitorix Enterprise — Crown Jewel Modules & IP Sensitivity Analysis
**Document Version:** 1.0.0  
**Classification:** Confidential — Engineering & Architecture  
**Date:** October 29, 2026  
**Auditor:** Principal Software & Security Architecture Team  

---

## 1. Overview & Evaluation Criteria

Monitorix contains over 64 backend services and modules. In an enterprise cybersecurity platform delivered on-premises, not all code carries identical commercial sensitivity. Ordinary CRUD operations, health endpoints, and database adapters represent standard operational plumbing. Conversely, the **detection algorithms, behavioral correlation models, autonomous containment logic, risk scoring algorithms, and license enforcement engines** constitute the core intellectual property (IP) and competitive differentiation of Monitorix.

This document classifies the highest-value "Crown Jewel" modules, evaluates their current exposure, defines the specific compilation and hardening strategy for each, and maps their runtime impacts and testing requirements.

---

## 2. Crown Jewel Modules Matrix

| Module | Purpose | IP Sensitivity | Current Exposure | Recommended Protection | Dependencies | Runtime Impact | Testing Requirements |
|---|---|:---:|---|---|---|---|---|
| **`app/services/correlation_service.py`** | In-flight multi-stage threat correlation, MITRE ATT&CK tactic chaining, graph relationship evaluation. | **Critical** | Plaintext `.py` in container `/app`. | Compile to Native Shared Object (`.so`) via Nuitka/Cython, strip all symbols, drop AST and docstrings. | Redis, ClickHouse, Socket.IO, SQLAlchemy. | Negligible (~5-15% faster execution due to C compilation). | Streaming correlation unit tests, multi-stage attack simulation benchmark. |
| **`app/services/detection_engine.py`** | Real-time Sigma rule parser, behavioral anomaly evaluator, in-memory heuristic matching. | **Critical** | Plaintext `.py` in container `/app`. | Native compilation (`.so`), strip symbols, embed immutable core rule signatures. | SQLAlchemy, `app.models`, Redis. | Zero degradation; improved event evaluation latency. | Golden detection test suite (`test_golden_detections`), synthetic event injection. |
| **`app/services/local_entitlement_engine.py`** | Authoritative on-premises quota enforcement (endpoints, cloud, DBs, K8s, EPS), license state evaluator. | **Critical** | Plaintext `.py` in container `/app`. | Native compilation (`.so`), symbol stripping, tamper-evident cryptographic checksum validation. | `CommercialLicense`, `Tenant`, `Agent`, `license_service`. | Zero impact; cached in memory. | Quota boundary tests (500 -> 501 rejection, decommission release). |
| **`app/services/license_service.py`** | Ed25519 digital signature validation, offline license verification, 7-state machine. | **Critical** | Plaintext `.py` in container `/app` + deterministic key seed. | **Architectural Split**: Excise private signing key completely. Distribute public verification key only in native-compiled module. | `cryptography` (Ed25519). | Sub-millisecond verification. | Valid token acceptance, tampered token unconditional rejection (`INVALID_SIGNATURE`). |
| **`app/services/risk_engine.py`** | Proprietary algorithm computing composite risk scores (0-100) across identity, process, network, and vulnerability posture. | **High** | Plaintext `.py` in container `/app`. | Native compilation (`.so`) with stripped symbols. | SQLAlchemy, ClickHouse, `app.models`. | 10% faster vectorized score calculations. | Asset risk update regression test, multi-factor scoring verification. |
| **`app/services/autonomous_security_service.py`** | Autonomous threat containment decision engine, dynamic playbook executor, automated network isolation. | **High** | Plaintext `.py` in container `/app`. | Native compilation (`.so`), symbol stripping. | Redis, Socket.IO, Celery. | Sub-second reaction time preserved. | Breach emulation test, containment action verification. |
| **`app/services/ai_soc_eval_guardrails.py` & `ai_service.py`** | Proprietary prompt guardrails, LLM evaluation criteria, automated incident triage synthesis. | **High** | Plaintext `.py` in container `/app`. | Native compilation (`.so`), strip prompts and evaluation heuristics from plaintext. | Qdrant, NumPy, Scikit-Learn. | Memory footprint unchanged. | AI Copilot evaluation test, triage quality benchmark. |
| **`app/services/threat_intel_pipeline.py`** | Multi-source IOC indexing, bloom-filter cache, indicator scoring and confidence decay logic. | **High** | Plaintext `.py` in container `/app`. | Bytecode optimization (`.pyc`), stripped docstrings and comments. | Redis, SQLAlchemy. | Zero impact. | IOC ingestion benchmark, cache hit rate validation. |
| **`app/services/vault_encryption.py`** | AES-256-GCM envelope encryption for cloud credentials, database connection strings, and audit keys. | **High** | Plaintext `.py` in container `/app`. | Native compilation (`.so`), memory zeroization on wipe. | `cryptography` (AES-GCM). | Cryptographic hardware acceleration (AES-NI). | Envelope encryption round-trip test, credential decryption verification. |

---

## 3. Deep-Dive on Target Protections

### 3.1. Layer 1: Native Compilation & Symbol Stripping (Nuitka / Cython)
- **Objective**: Transform Python Abstract Syntax Trees (AST) and bytecode into native C code, which is then compiled via `gcc` into platform-specific machine code (`.so` on Linux ELF).
- **Mechanism**:
  - The C code interacts directly with the Python C-API (`PyObject*`), maintaining 100% binary compatibility with FastAPI, Pydantic, and SQLAlchemy.
  - All local variable names, comments, docstrings, and control-flow metadata are eliminated during C code generation.
  - Production binaries are stripped using `strip --strip-all` or `strip --strip-unneeded`, removing ELF symbol tables, debug tables (`.debug_info`, `.debug_line`), and relocation sections.
- **Result**: Decompilers such as `decompyle++` or `uncompyle6` fail completely because no Python bytecode exists. Disassemblers (Ghidra, IDA Pro) yield raw x86_64 assembly referencing Python internal C-API calls, requiring significant reverse-engineering effort comparable to analyzing native software.

### 3.2. Layer 2: Architectural Decoupling of License Signing Authority
- **The Vulnerability**:
  - In legacy development code, private signing keys were derived from a deterministic seed.
  - If shipped in customer runtimes, anyone analyzing the binary could reverse the seed and forge licenses for arbitrary quotas or expiration dates.
- **The Hardening**:
  - **Excision**: The private signing key and the `generate_signed_license()` method are completely removed from the customer runtime.
  - **Vendor Isolation**: A dedicated vendor-only CLI tool (`tools/license_generator.py`) retains the private key in secure vendor infrastructure (CI secrets or HSM).
  - **Runtime Public Key**: The customer binary includes **only** the 32-byte Ed25519 public key (`ed25519.Ed25519PublicKey`). The public key can verify signatures mathematically, but cannot be used to forge new signatures under any circumstances.

### 3.3. Layer 3: Anti-Tamper & Quota Boundary Hardening
- **The Vulnerability**:
  - A malicious customer administrator might attempt to patch `LocalEntitlementEngine.check_agent_enrollment_quota()` to unconditionally return `{"allowed": true}`.
- **The Hardening**:
  - The entitlement check is compiled into the native shared object alongside the cryptographic license verification logic.
  - Modifying the shared library binary corrupts ELF checksums and causes dynamic linker failures (`SIGSEGV` / `invalid ELF header`) or fails container startup integrity checks.
  - All quota calculations compare against cryptographically verified license claims decoded from the Ed25519 digital signature.

---

## 4. Runtime Impact & Compatibility Matrix

| Technology | Compatibility Status | Notes |
|---|:---:|---|
| **FastAPI / Starlette** | **100% Compatible** | Routers and endpoints in native modules function identically; signatures inspected via C-API. |
| **Pydantic v2 (Rust Core)** | **100% Compatible** | Pydantic model schemas and validation logic operate without modification. |
| **SQLAlchemy 2.0 (Async)** | **100% Compatible** | Async session execution, greenlet switches, and ORM models function normally. |
| **Dynamic Plugin Discovery** | **Requires Update** | `app/core/plugins.py` currently checks `if filename.endswith(".py")`. Must be upgraded to discover `.so` and `.pyc` modules. |
| **Kafka & ClickHouse** | **100% Compatible** | Consumer workers and driver protocol sockets operate with zero performance penalty. |
| **Celery Tasks** | **100% Compatible** | Task discovery and serialization operate through standard import paths. |

---

## 5. Verification & Testing Requirements

To ensure zero regressions, every compiled Crown Jewel module must pass:
1. **Import Verification**: Every compiled `.so` must successfully import in a clean Python 3.11 environment without runtime syntax or linker errors.
2. **Golden Detection Verification**: `test_golden_detections` must evaluate 100% of Sigma and heuristic alerts identically between raw Python and native compiled versions.
3. **Correlation Engine Stress Benchmark**: Ingest 10,000 synthetic events and verify that multi-stage attack chains are constructed with identical graph nodes.
4. **License & Quota Verification**: Verify that valid licenses pass and tampered tokens are rejected with `INVALID_SIGNATURE`. Verify that exceeding quotas raises `ENDPOINT_LIMIT_EXCEEDED`.
