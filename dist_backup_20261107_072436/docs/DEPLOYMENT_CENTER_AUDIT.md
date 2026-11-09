# Monitorix Enterprise — Deployment Center & Commercial Architecture Audit

**Assessment Date:** 2026-10-29  
**Platform Version:** Monitorix Enterprise 19.1.0 LTS  
**Architecture:** Sovereign Multi-Tenant XDR / SIEM / Autonomous Cybersecurity  
**Audit Scope:** Control Plane, Commercial Lifecycle, Customer Deployments, License Engine, Agent Enrollment, Offline Operations, Disaster Recovery  

---

## 1. Executive Summary

This audit assesses the existing Monitorix platform architecture to prepare for full enterprise deployment across **On-Premises**, **Private Cloud**, and **Air-Gapped** customer environments.

Monitorix currently possesses strong foundational primitives:
1. **Commercial Lifecycle Engine (`v4.2.0`):** Complete Partner, Customer, Product, Plan, Quote, Order, Payment, and Commission data models.
2. **Offline Cryptographic Licensing:** Asymmetric Ed25519 digital signature validation operating 100% locally without cloud call-homes.
3. **Local Entitlement Engine:** Authoritative hard quota enforcement rejecting over-quota registrations with `ENDPOINT_LIMIT_EXCEEDED`.
4. **Hardened Container Runtime:** Multi-stage production builds for Nginx (frontend) and Python (backend) with native Cython Crown Jewels and stripped `.so` binaries.
5. **Sovereign First-Run Setup Wizard:** React-based 12-stage onboarding wizard (`/setup`).

To achieve complete enterprise production readiness, this audit identifies required enhancements in:
* **Control Plane Entity Harmonization:** Adding `DeploymentPackage`, `Release`, `UpdatePackage`, and `UpdateHistory`.
* **Dynamic Customer Deployment Package Generator:** Emitting signed `monitorix-enterprise-<version>-<deployment-id>.tar.gz` archives dynamically.
* **Agent Enrollment Token Lifecycle:** Ephemeral, expiring, and revokable enrollment tokens with mTLS certificates.
* **Air-Gapped Update & Threat Intel Pipelines:** Signed offline differential update bundles.
* **Unified Enterprise Backup & Disaster Recovery CLI (`monitorix-backup`):** Standardized backup and restore across PostgreSQL, ClickHouse, MinIO, Redis, and configuration manifests.

---

## 2. Component-by-Component Architectural Audit

### 2.1 Authentication, Organizations & RBAC

| Layer | Existing Implementation | Current Exposure & State | Required Enhancement |
| :--- | :--- | :--- | :--- |
| **Authentication** | JWT-based OAuth2 bearer tokens (`app/api/deps.py`, `app/core/security.py`). PBKDF2/bcrypt password hashing. | Functional. Session tokens validated locally against database. | Retain existing JWT scheme; enforce session revocation on password change. |
| **Organizations & Tenants** | Multi-tier hierarchy: `Tenants` (technical operational tenant) linked to `Customers` (commercial legal entity) and `Partners` (reseller/distributor). | Normalized. Each tenant is isolated by `TenantId` across 50+ database tables. | Add explicit `Organization` alias mapping to ensure unified terminology across enterprise docs. |
| **RBAC Roles** | `superadmin`, `admin`, `analyst`, `auditor`, `partner_admin`, `customer_admin`. Enforced via FastAPI dependency injection. | Enforced across standard routes and `commercial_lifecycle.py`. | Add explicit `DeploymentEngineer` and `SecOpsAuditor` roles for fine-grained deployment access. |

### 2.2 Commercial Lifecycle & Subscriptions

| Entity | Database Model | API Route Mapping | Status |
| :--- | :--- | :--- | :--- |
| **Partner** | `Partner` (`Partners` table) | `GET / POST /api/v2/admin/commercial/partners` | COMPLETE |
| **Customer** | `Customer` (`Customers` table) | `GET / POST /api/v2/admin/commercial/customers` | COMPLETE |
| **Product & Plans**| `ProductCatalog`, `ProductPlan` | `GET /api/v2/admin/commercial/plans` | COMPLETE |
| **Quotes & Orders**| `CommercialQuote`, `CommercialOrder` | `POST /api/v2/partner/quotes`, `POST /api/v2/admin/commercial/orders/{id}/pay` | COMPLETE |
| **Payments** | `CommercialPayment` | `POST /api/v2/admin/commercial/orders/{id}/pay` | COMPLETE |
| **Commissions** | `PartnerCommissionRecord` | `GET /api/v2/partner/commissions` | COMPLETE |
| **Subscription** | `SaaSPlanSubscription` | `GET /api/v2/customer/subscription` | COMPLETE |

### 2.3 Licensing & Entitlement Engine

* **License File Format:** JSON payload containing `customer_id`, `deployment_id`, `license_id`, `edition`, `endpoint_limit`, `modules`, `issued_at`, `expires_at`, `deployment_type`, and `version_policy`.
* **Signing Algorithm:** RFC 8032 Ed25519 elliptic curve signature (64-byte signature hex).
* **Key Decoupling:** Vendor private key resides in vendor infrastructure / HSM. Customer runtime contains only the 32-byte public verification key (`4f0aea519bb1e5c7...`).
* **Entitlement Enforcement (`LocalEntitlementEngine`):**
  * Evaluates active agent count against `endpoint_limit`.
  * If `active >= limit`, returns HTTP 403 Forbidden with `{"allowed": false, "code": "ENDPOINT_LIMIT_EXCEEDED"}`.
  * Evaluates feature flags for 18 core security modules (`edr`, `ndr`, `siem`, `soar`, `ueba`, `dlp`, etc.).
  * Operates 100% locally with zero internet dependency.

### 2.4 Customer Deployments & Control Plane

* **Existing Table:** `CustomerDeployments` tracks `DeploymentId`, `CustomerId`, `TenantId`, `Environment`, `DeploymentType`, `Version`, `LicenseId`, `ControlPlaneConnection`, `LocalHealth`, and resource usage metrics.
* **Gaps Identified:**
  1. `DeploymentType` needs strict normalization to enum: `ON_PREMISE`, `PRIVATE_CLOUD`, `AIR_GAPPED`.
  2. Need `DeploymentPackage` entity to track generated release archives, SHA-256 hashes, and download paths.
  3. Need `Release` and `UpdatePackage` entities to support automated software updates and offline bundles.

### 2.5 Endpoint Agent Registration & Enrollment

* **Existing Registration Route:** `POST /api/agent/register` validates Tenant API key / PIN, generates `machine_secret`, and registers agent in `Agents` table.
* **Gaps Identified:**
  1. Currently relies on static `TenantApiKey` passed in headers.
  2. Needs dynamic **Enrollment Tokens** with configurable expiration (e.g. 1 hour, 24 hours), usage quotas (single-use or multi-use), and explicit revocation capabilities.
  3. Agent gateway must validate enrollment tokens before issuing mTLS client certificates.

### 2.6 Deployment Packaging & Installer

* **Production Bundle Generator:** `build/build_production_bundle.py` currently packages generic version `19.1.0`.
* **Required Evolution:** Parameterize bundle generation per customer deployment:
  `monitorix-enterprise-<version>-<deployment-id>.tar.gz`
  containing deployment-specific license, pre-generated random secrets, and verified image tarballs.
* **Installer Capabilities (`installer/install.sh`):**
  * Hardware checks (CPU, RAM, Disk, OS).
  * Checksum & Ed25519 signature verification.
  * Offline Docker image loading (`docker load`).
  * Automated secret generation (`openssl rand -hex 32`).
  * Health probe verification across 7 microservices.

### 2.7 Backup, Restore & Disaster Recovery

* Existing scripts in repository:
  * `scripts/backup_postgres.sh` (PostgreSQL only)
  * `scripts/dr_scheduler.py` (Scheduled snapshots)
  * `scripts/verify_postgres_backup.sh`
* **Gaps Identified:**
  1. Needs unified CLI tool: `monitorix-backup` and `monitorix-restore`.
  2. Must backup: PostgreSQL (relational/RBAC), ClickHouse metadata/schemas, MinIO configuration, configuration `.env`, licenses, and release manifests.
  3. Restore script must support full cluster restoration and point-in-time recovery on a clean server.

---

## 3. Action Plan & Technical Roadmap

```
+-------------------------------------------------------------------------------+
|                    ENTERPRISE DEPLOYMENT ARCHITECTURE MAP                     |
+-------------------------------------------------------------------------------+
|                                                                               |
|  1. CONTROL PLANE ENHANCEMENT                                                 |
|     - Extend database models: DeploymentPackage, Release, UpdatePackage,      |
|       UpdateHistory, SupportCase, AuditEvent.                                 |
|     - Support deployment types: ON_PREMISE, PRIVATE_CLOUD, AIR_GAPPED.        |
|                                                                               |
|  2. DYNAMIC DEPLOYMENT PACKAGE GENERATOR                                      |
|     - API & CLI to generate monitorix-enterprise-<version>-<dep-id>.tar.gz    |
|     - Embed customer-specific signed license, configs, checksums, signatures  |
|                                                                               |
|  3. SECURE AGENT ENROLLMENT SERVICE                                           |
|     - Dynamic ephemeral enrollment tokens with TTL and max-use counters       |
|     - Token revocation and audit logging                                      |
|     - Hard quota enforcement: ENDPOINT_LIMIT_EXCEEDED                         |
|                                                                               |
|  4. BACKUP & DISASTER RECOVERY FRAMEWORK                                      |
|     - Unified monitorix-backup / monitorix-restore scripts                    |
|     - Multi-database snapshotting (Postgres, ClickHouse, Vault, MinIO)        |
|                                                                               |
|  5. UPDATE & OFFLINE UPDATE SYSTEM                                            |
|     - Release manifest generation and signature verification                  |
|     - Rollback automation on health check failure                             |
|                                                                               |
|  6. LOCAL HEALTH MONITORING & TELEMETRY SOVEREIGNTY                           |
|     - Web portal cluster health view (14 core subsystem probes)               |
|     - Strict zero-telemetry guarantee for air-gapped deployments              |
|                                                                               |
|  7. VERIFICATION & CLEAN CUSTOMER INSTALLATION TEST                           |
|     - Comprehensive end-to-end execution of clean customer installation test  |
|                                                                               |
+-------------------------------------------------------------------------------+
```
