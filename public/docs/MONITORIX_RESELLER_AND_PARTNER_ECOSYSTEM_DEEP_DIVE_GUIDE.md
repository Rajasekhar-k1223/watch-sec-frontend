# Monitorix Sovereign Enterprise — Reseller & Partner Ecosystem Deep-Dive Guide

> **Document Version:** 4.2.0-SOVEREIGN  
> **Classification:** Enterprise Commercial & Partner Architecture  
> **Release Target:** Global MSSPs, MSPs, Resellers, Distributors & Commercial Operations  
> **Last Verified:** 2026-11-10  

---

## 1. Executive Summary & Partner Operating Model

The **Monitorix Sovereign Partner Network (SPN)** enables Value-Added Resellers (VARs), Managed Service Providers (MSPs), Managed Detection and Response (MSSP/MDR) providers, and System Integrators to sell, deploy, and co-manage Monitorix Sovereign XDR/SIEM platforms for enterprise clients across on-premises, hybrid cloud, and air-gapped enclaves.

Unlike traditional cloud SaaS architectures where client telemetry is centralized and pooled into a single multi-tenant vendor database—introducing compliance, regulatory, and data sovereignty risks—Monitorix implements a **Federated Cryptographic Multi-Tenant Architecture**:

1. **Absolute Data Sovereignty**: Every customer organization operates within an isolated cryptographic tenant enclave (`TenantId`). Zero customer telemetry, raw security events, or forensic artifacts leave the client perimeter or bleed into neighboring client boundaries.
2. **Commercial Autonomy**: Partners retain 100% ownership of the commercial customer relationship, pricing margins, quote negotiations, and recurring subscription billing.
3. **Automated Margin & Payout Ledger**: Out of the box, Monitorix automates margin calculations (standard **20.0% Reseller Margin**, scaling up to **35.0% for Elite MSSPs**) with immutable commission audit records and net-30/quarterly settlement pipelines.
4. **Complete White-Labeling**: Partners can rebrand the customer-facing security portal (`/portal`), executive reports, automated alerts, and help desk contact info under their own corporate identity.

```
+-------------------------------------------------------------------------------+
|                       MONITORIX RESELLER TOPOLOGY                             |
+-------------------------------------------------------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
+----------------------------------+          +----------------------------------+
|   GLOBAL CONTROL PLANE (ADMIN)   |          |     PARTNER RESELLER HUB         |
|   - Tier & Margin Policy         |          |     - URL: /partner (Badge: RES) |
|   - Ed25519 License Authority    |          |     - Client Sub-Tenant Creator  |
|   - Commission Payout Clearance  |          |     - Quote Builder & Margin Calc|
|   - Global Product Catalog       |          |     - White-Label Rebranding     |
+----------------------------------+          +----------------------------------+
                 |                                             |
                 |                                             v
                 |                            +----------------------------------+
                 |                            |    ISOLATED CUSTOMER ENCLAVES    |
                 |                            |    - Tenant A: Acme Bank         |
                 |                            |    - Tenant B: Horizon Health    |
                 |                            |    - Tenant C: Apex Logistics    |
                 +--------------------------->|    - Cross-Platform EDR Fleet    |
                                              +----------------------------------+
```

---

## 2. Reseller Architecture & Tenant Isolation Topology

Below is the high-level architectural schematic showing how the Monitorix Global Control Plane, the Reseller Hub (`/partner`), and client sub-tenant enclaves communicate while preserving strict isolation:

![Monitorix Reseller Architecture](file:///opt/projects/monitorix/docs/monitorix_reseller_architecture.png)

### The Three-Tier Domain Isolation Hierarchy

Monitorix enforces a strict three-tier boundary across all database queries, API middleware, and WebSocket streaming:

```
  Tier 1: Global Super-Admin (Vendor Master)
  ├── Scope: All Partners, Global License Authority, Hardware & VM Fleet
  └── Routes: /admin/commercial, /admin/organizations, /global/platform

  Tier 2: Partner / Reseller Hub (Partner Operator)
  ├── Scope: Sub-Tenant Clients, Sales Quotes, 20% Commission Records, Health Registry
  └── Routes: /partner, /v2/partner/*, /v2/soc/mssp/*

  Tier 3: Customer Client Enclave (End Customer Organization)
  ├── Scope: Local Agents, Internal Alerts, Quarantine Actions, Incident Forensics
  └── Routes: /portal, /dashboard, /endpoints, /security-logs (Filtered to single TenantId)
```

> [!IMPORTANT]
> **Zero Cross-Tenant Leakage Guarantee**: Every database query generated within the Partner scope includes mandatory filters on `PartnerId` and `TenantId`. Even if a reseller manages 50 distinct customer offices, Tenant A's analysts or API keys can never query, inspect, or decrypt Tenant B's security logs, incident records, or endpoint inventory.

---

## 3. Partner Tier Matrix & Margin Schedule

The platform features built-in tiering logic that governs discount structures, commission rates, and technical support SLAs:

| Partner Tier | Minimum ARR Commit | Default Commission Margin | White-Label Rights | Co-Managed SOC Access | Support SLA Escalation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authorized Silver Reseller** | \$25,000 ARR | **15.0%** | Standard Portal Logo | Incident Referral Only | 8x5 Next-Business-Day |
| **Premier Gold Reseller** | \$100,000 ARR | **20.0% (Default)** | Full Domain & Logo Rebranding | Tier 1/2 Alert Triage | 24x7x365 4-Hour SLA |
| **Elite Platinum MSSP** | \$500,000 ARR | **25.0% - 35.0%** | Complete Sovereign White-Label | Full Multi-Tenant SOC (`/soc`) | 24x7x365 15-Min Critical |
| **OEM / National Distributor** | \$1,500,000+ ARR | **Custom Tiered (40%+)** | Unbranded Binary Distribution | Autonomous Region Control | Dedicated Principal Architect |

---

## 4. End-to-End Reseller Commercial Lifecycle

The reseller operational process is organized into six deterministic phases, fully supported by the codebase:

![Monitorix Reseller Lifecycle Flow](file:///opt/projects/monitorix/docs/monitorix_reseller_lifecycle_flow.png)

### Phase 1: Partner Onboarding & Credential Generation
1. The Monitorix Super-Administrator registers the Partner in `/admin/commercial` or via `POST /api/v2/commercial/admin/partners`.
2. A unique `PartnerCode` (e.g., `PRT-CYBERGUARD-SEC`) is issued, along with an initial commission schedule (default: `20.0%`).
3. The partner receives administrative credentials and signs into the **Partner Portal** at `/partner`.

### Phase 2: Client Sub-Tenant Provisioning
1. The partner navigates to `/partner` $\rightarrow$ **Customer Management** tab $\rightarrow$ clicks **"+ Add Customer"**.
2. Partner inputs:
   - **Company Legal Name**: e.g., `Acme Financial Corp`
   - **Primary Administrative Email**: `ciso@acmefinancial.com`
   - **Industry Vertical**: Banking / Healthcare / Defense / Retail / Manufacturing
   - **Deployment Model**: `Cloud` (Hosted Enclave) or `OnPremises` (Customer Data Center)
3. The system executes `POST /api/v2/partner/customers`:
   - Creates a dedicated `Tenant` record in PostgreSQL.
   - Creates a linked `Customer` record with `PartnerId` set to the calling reseller.
   - Allocates isolated schema namespaces and cryptographic encryption keys.

### Phase 3: Quote Generation & Margin Calculation
1. The partner navigates to the **Quote Generator** tab in `/partner`.
2. The partner selects the target customer and chooses a product tier from the catalog:
   - `XDR-500` (Monitorix Enterprise XDR - 500 Endpoints)
   - `XDR-1000` (Monitorix Enterprise XDR - 1,000 Endpoints)
   - `XDR-5000` (Monitorix Enterprise XDR - 5,000 Endpoints)
3. The pricing engine calculates:
   $$\text{Gross Amount} = \text{Unit Price} \times \text{Endpoints} \times \text{Billing Duration}$$
   $$\text{Discounted Price} = \text{Gross Amount} \times (1 - \text{Discount Rate})$$
   $$\text{Reseller Commission (20\%)} = \text{Discounted Price} \times 0.20$$
4. The partner downloads or transmits the digital quote PDF to the customer.

### Phase 4: Order Conversion & Cryptographic Licensing
1. Upon customer acceptance and issuance of a Purchase Order (PO), the quote is converted to an active `CommercialOrder`.
2. The Global Licensing Engine automatically generates an **RFC 8032 Ed25519** digitally signed license (`customer-license.json`).
3. The license embeds the exact endpoint quota, expiry timestamp, authorized modules (`["edr", "ndr", "soar", "sandbox", "itdr"]`), and sovereign customer signature.

### Phase 5: Deployment Packaging & Fleet Installation
1. The partner downloads the pre-configured deployment bundle for the client's deployment model:
   - Air-Gapped / On-Premises: `docker-compose.enterprise.yml` + pre-compiled Rust agent binaries (`monitorix-agent-linux`, `monitorix-agent-windows.exe`, `monitorix-agent-macos`) + signed license.
   - Cloud: Pre-configured enrollment tokens linking straight to the customer's isolated tenant.
2. Agents enroll via mutual TLS (mTLS), report system telemetry, and the **Partner Portal** live dashboard updates active agent counts in real time.

### Phase 6: Commission Settlement & Payout Engine
1. For every completed order, the system instantiates an immutable `PartnerCommissionRecord`.
2. Payout states progress through a governed financial workflow:
   $$\text{PENDING} \longrightarrow \text{APPROVED} \longrightarrow \text{PAYABLE} \longrightarrow \text{PAID}$$
3. Net-30 financial reconciliation settles earnings directly to the partner's registered payout method.

---

## 5. White-Labeling & Rebranding Engine

Monitorix provides comprehensive white-labeling capabilities, allowing partners to present the platform entirely as their own proprietary security solution:

![Monitorix White-Label Hierarchy](file:///opt/projects/monitorix/docs/monitorix_white_label_hierarchy.png)

### White-Label Configuration Parameters

Partners configure their branding profile via `PUT /api/v2/soc/mssp/whitelabel` or inside the Partner Hub settings:

```json
{
  "brand_name": "CyberGuard Sovereign Defense",
  "portal_title": "CyberGuard Security Operations Center",
  "logo_url": "/assets/branding/cyberguard-logo-light.svg",
  "logo_dark_url": "/assets/branding/cyberguard-logo-dark.svg",
  "favicon_url": "/assets/branding/cyberguard-favicon.ico",
  "custom_domain": "secops.cyberguard-defense.com",
  "support_email": "soc-support@cyberguard-defense.com",
  "support_phone": "+1 (800) 555-0199",
  "primary_accent_color": "#00E5FF",
  "secondary_accent_color": "#1E1B4B",
  "report_watermark_text": "CONFIDENTIAL - CYBERGUARD MANAGED DEFENSE",
  "hide_upstream_vendor_credits": true
}
```

### Surfaces Rebranded for Sub-Clients:
1. **Web User Interface**: The Customer Security Portal (`/portal`) displays the partner's logo in the navigation header, customized color palettes, and partner support contact links.
2. **Automated PDF Reports**: Threat summaries, executive compliance decks, and vulnerability scans generated from `/reports` feature partner branding, disclaimers, and header graphics.
3. **Email & Alerting Engine**: System notifications, critical threat alerts, and automated SOAR digests are sent using the partner's customized SMTP sender identity and footers.

---

## 6. Frontend Reseller Portal Walkthrough (`/partner`)

The Partner Portal is implemented in [`watch-sec-frontend/src/pages/PartnerPortal.tsx`](file:///opt/projects/monitorix/watch-sec-frontend/src/pages/PartnerPortal.tsx) and accessible at the route `/partner`:

### Key Portal Views & Features

```
+---------------------------------------------------------------------------------------------------+
|  PARTNER / RESELLER HUB                                              [Partner Tier: PREMIER GOLD] |
+---------------------------------------------------------------------------------------------------+
|  [ Total Customers: 14 ]   [ Active Quotes: 6 ]   [ Earned Margin: $48,200 ]   [ Commission: 20% ]|
+---------------------------------------------------------------------------------------------------+
|  [Customers]      [Quotes & Proposals]      [Commissions Ledger]      [Deployment Health]         |
+---------------------------------------------------------------------------------------------------+
|  CUSTOMER MANAGEMENT DIRECTORY                                             [ + Add Customer ]     |
|  -----------------------------------------------------------------------------------------------  |
|  Customer Code    Company Name         Industry        Deployment    Agents / Limit    Status     |
|  CUST-ACM-01      Acme Financial       Banking         On-Premises   487 / 500         ACTIVE     |
|  CUST-HRZ-02      Horizon Health       Healthcare      Dedicated     1,120 / 1,200     ACTIVE     |
|  CUST-APX-03      Apex Logistics       Logistics       Cloud         312 / 350         ACTIVE     |
+---------------------------------------------------------------------------------------------------+
|  COMMISSION & PAYOUT LEDGER                                                                       |
|  -----------------------------------------------------------------------------------------------  |
|  Order ID    Customer            Gross Sale    Discount    Net Sale     20% Commission    Payout  |
|  ORD-9021    Acme Financial      $22,500.00    $2,250.00   $20,250.00   $4,050.00         [PAID]  |
|  ORD-9022    Horizon Health      $54,000.00    $5,400.00   $48,600.00   $9,720.00         [PAID]  |
|  ORD-9023    Apex Logistics      $15,750.00    $1,575.00   $14,175.00   $2,835.00      [PENDING]  |
+---------------------------------------------------------------------------------------------------+
```

1. **Top Metric Badges**:
   - **Total Customers**: Live count of onboarded client accounts under this partner.
   - **Active Quotes**: Open sales proposals currently awaiting customer signature.
   - **Earned Commissions**: Cumulative margin earned by the partner in USD (\$ and local currency).
   - **Commission Rate**: Active reseller margin percentage (e.g., `20% Standard Margin`).
   - **Active Endpoints**: Aggregated count of active EDR agents reporting in from all customer sites.

2. **Customer Onboarding Modal**:
   - Opens an interactive modal allowing the partner to immediately provision a client tenant with legal entity name, primary contact, industry vertical, and deployment model.

3. **Quote Generator**:
   - Interactive quote builder: select client $\rightarrow$ pick endpoint capacity $\rightarrow$ adjust discount slider $\rightarrow$ live preview of Net Price and 20% partner margin $\rightarrow$ click **"Generate Quote"**.

4. **Commission & Settlement Table**:
   - Real-time accounting view breaking down Gross Billings, Volume Discounts, Net Billings, Partner Margin, and Payout Status (`PAID`, `APPROVED`, `PENDING`).

5. **Deployment Health Matrix**:
   - Displays real-time operational status for each customer deployment:
     - `ControlPlaneConnection`: `CONNECTED`, `OFFLINE`, or `DEGRADED`.
     - `ActiveAgentCount` vs `AgentLimit`: Visual progress bar showing endpoint utilization.
     - `LicenseStatus`: `ACTIVE`, `EXPIRING`, or `GRACE_PERIOD`.

---

## 7. Database Models & Schema Reference

All reseller and commercial entities are defined in [`backend/app/db/models.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/db/models.py):

### 1. The `Partner` Model (`models.py:2993`)
```python
class Partner(Base):
    __tablename__ = "Partners"
    Id = Column(Integer, primary_key=True, index=True)
    PartnerCode = Column(String(50), unique=True, index=True, nullable=False) # e.g. PRT-ABC-SEC
    PartnerName = Column(String(150), nullable=False)                         # e.g. CyberGuard Partners
    PartnerType = Column(String(50), default="Reseller")                     # Reseller, Distributor, MSSP
    ContactEmail = Column(String(150), nullable=False)
    ContactPhone = Column(String(50), nullable=True)
    Country = Column(String(100), default="US")
    CommissionRatePercent = Column(Float, default=20.0)                      # Standard 20% reseller commission
    Status = Column(String(50), default="ACTIVE")                            # ACTIVE, PENDING, SUSPENDED
    MetadataJson = Column(Text, default="{}")
    CreatedAt = Column(DateTime, default=datetime.utcnow, index=True)
    UpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### 2. The `Customer` Model (`models.py:3010`)
```python
class Customer(Base):
    __tablename__ = "Customers"
    Id = Column(Integer, primary_key=True, index=True)
    CustomerCode = Column(String(50), unique=True, index=True, nullable=False) # e.g. CUST-ACME-CORP
    CustomerName = Column(String(200), nullable=False)                         # e.g. Acme Corporation
    PartnerId = Column(Integer, ForeignKey("Partners.Id"), nullable=True, index=True)
    TenantId = Column(Integer, ForeignKey("Tenants.Id"), nullable=True, index=True)
    PrimaryContactEmail = Column(String(150), nullable=False)
    Industry = Column(String(100), default="Technology")
    DeploymentModel = Column(String(50), default="OnPremises")                 # Cloud, OnPremises, Hybrid
    Status = Column(String(50), default="ACTIVE")                            # LEAD, TRIAL, ACTIVE
    CreatedAt = Column(DateTime, default=datetime.utcnow, index=True)
```

### 3. The `PartnerCommissionRecord` Model (`models.py:3113`)
```python
class PartnerCommissionRecord(Base):
    __tablename__ = "PartnerCommissionRecords"
    Id = Column(Integer, primary_key=True, index=True)
    PartnerId = Column(Integer, ForeignKey("Partners.Id"), nullable=False, index=True)
    OrderId = Column(Integer, ForeignKey("CommercialOrders.Id"), nullable=False, index=True)
    CustomerId = Column(Integer, ForeignKey("Customers.Id"), nullable=False, index=True)
    GrossAmountUsd = Column(Float, nullable=False)
    DiscountAmountUsd = Column(Float, default=0.0)
    TaxAmountUsd = Column(Float, default=0.0)
    NetAmountUsd = Column(Float, nullable=False)
    CommissionRatePercent = Column(Float, default=20.0)
    CommissionAmountUsd = Column(Float, nullable=False)
    PayoutStatus = Column(String(50), default="PENDING")                     # PENDING, APPROVED, PAYABLE, PAID
    PaidAt = Column(DateTime, nullable=True)
    CreatedAt = Column(DateTime, default=datetime.utcnow, index=True)
```

### 4. The `CustomerDeployment` Model (`models.py:3131`)
```python
class CustomerDeployment(Base):
    __tablename__ = "CustomerDeployments"
    Id = Column(Integer, primary_key=True, index=True)
    DeploymentId = Column(String(100), unique=True, index=True, nullable=False)
    CustomerId = Column(Integer, ForeignKey("Customers.Id"), nullable=False, index=True)
    TenantId = Column(Integer, ForeignKey("Tenants.Id"), nullable=False, index=True)
    Environment = Column(String(50), default="Production")
    DeploymentType = Column(String(50), default="OnPremises")
    Version = Column(String(50), default="v4.2.0")
    LicenseId = Column(String(100), nullable=True, index=True)
    LicenseStatus = Column(String(50), default="ACTIVE")
    ControlPlaneConnection = Column(String(50), default="CONNECTED")
    ActiveAgentCount = Column(Integer, default=0)
    AgentLimit = Column(Integer, default=500)
    Status = Column(String(50), default="ACTIVE")
```

---

## 8. Complete REST API Reference

### Reseller Self-Service APIs (`/api/v2/partner/*`)

#### 1. Partner Dashboard Metrics
- **Endpoint**: `GET /api/v2/partner/dashboard`
- **Description**: Returns consolidated commercial KPIs for the authenticated partner.
- **Response `200 OK`**:
```json
{
  "partner_name": "CyberGuard Partners",
  "partner_code": "PRT-CYBERGUARD-SEC",
  "tier": "Premier Gold",
  "commission_rate_percent": 20.0,
  "total_customers": 14,
  "active_quotes": 6,
  "total_earned_commission_usd": 48200.00,
  "total_monitored_endpoints": 6420,
  "active_deployments": 14
}
```

#### 2. Onboard Sub-Tenant Customer
- **Endpoint**: `POST /api/v2/partner/customers`
- **Description**: Creates a new customer organization and assigns an isolated tenant enclave.
- **Request Body**:
```json
{
  "customer_name": "Acme Financial Corp",
  "primary_contact_email": "ciso@acmefinancial.com",
  "industry": "Banking",
  "deployment_model": "OnPremises"
}
```
- **Response `201 Created`**:
```json
{
  "id": 108,
  "customer_code": "CUST-ACME-CORP",
  "customer_name": "Acme Financial Corp",
  "tenant_id": 108,
  "partner_id": 12,
  "primary_contact_email": "ciso@acmefinancial.com",
  "deployment_model": "OnPremises",
  "status": "ACTIVE",
  "created_at": "2026-11-10T13:15:00Z"
}
```

#### 3. Create Commercial Sales Quote
- **Endpoint**: `POST /api/v2/partner/quotes`
- **Description**: Generates a pricing proposal with automatic 20% margin calculation.
- **Request Body**:
```json
{
  "customer_id": 108,
  "plan_code": "XDR-500",
  "discount_percent": 10,
  "billing_cycle": "annual"
}
```
- **Response `201 Created`**:
```json
{
  "id": 412,
  "quote_number": "QUO-2026-0412",
  "customer_id": 108,
  "plan_code": "XDR-500",
  "gross_amount_usd": 22500.00,
  "discount_percent": 10.0,
  "discount_amount_usd": 2250.00,
  "net_amount_usd": 20250.00,
  "reseller_margin_percent": 20.0,
  "reseller_margin_usd": 4050.00,
  "status": "DRAFT",
  "valid_until": "2026-12-10T23:59:59Z"
}
```

#### 4. Fetch Commission Ledger
- **Endpoint**: `GET /api/v2/partner/commissions`
- **Description**: Retrieves transactional commission breakdown and payment status for all closed orders.
- **Response `200 OK`**:
```json
[
  {
    "id": 89,
    "order_id": 9021,
    "customer_name": "Acme Financial Corp",
    "gross_amount_usd": 22500.00,
    "discount_amount_usd": 2250.00,
    "net_amount_usd": 20250.00,
    "commission_rate_percent": 20.0,
    "commission_amount_usd": 4050.00,
    "payout_status": "PAID",
    "paid_at": "2026-11-01T10:00:00Z"
  }
]
```

---

## 9. Administrator & Parent Provider Operations

Platform super-administrators monitor and govern all reseller partners from **Admin Commercial Ops** (`/admin/commercial`):

### Setting Custom Commission Margins
Admins can dynamically adjust partner commission rates based on volume tiers or contract terms:
```bash
# Update Partner Commission Rate to 25% (Premier Gold Tier)
curl -X PATCH https://controlplane.monitorix.internal/api/v2/commercial/admin/partners/12 \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "Premier Gold",
    "commission_rate_percent": 25.0,
    "status": "ACTIVE"
  }'
```

### Triggering Net-30 Commission Settlements
```bash
# Trigger Automated Payout Batch for Approved Commissions
curl -X POST https://controlplane.monitorix.internal/api/v2/commercial/admin/payouts/process \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payout_cycle": "2026-Q4-M1",
    "target_status": "APPROVED"
  }'
```

---

## 10. Operational Checklist for Reseller Onboarding

| Step | Action Item | Verification Command / Target | Responsible Party |
| :--- | :--- | :--- | :--- |
| **1** | Register Partner Entity | `POST /api/v2/commercial/admin/partners` | Vendor Super-Admin |
| **2** | Issue Partner Login Credentials | Email / Secure Vault delivery | Vendor Commercial Team |
| **3** | Partner First-Time Login | Authenticate at `https://<domain>/partner` | Partner Administrator |
| **4** | Configure White-Label Branding | Set logo, custom colors, and portal title | Partner Administrator |
| **5** | Provision First Customer Sub-Tenant | Use "+ Add Customer" modal in `/partner` | Partner Sales Engineer |
| **6** | Generate Commercial Quote | Select `XDR-500` or `XDR-1000` plan | Partner Account Manager |
| **7** | Issue Cryptographic License | Generate signed Ed25519 `customer-license.json` | Partner Portal / Signer |
| **8** | Deploy Endpoints & Verify Telemetry | Check `ActiveAgentCount` in deployment table | Customer & Partner SecOps |
| **9** | Confirm Commission Record | Verify 20% margin is registered in ledger | Partner Finance Team |

---

## 11. Architecture Artifacts & File Locations

All production code and assets supporting the Reseller and Partner ecosystem are stored in the following authoritative paths:

| Component | Path | Description |
| :--- | :--- | :--- |
| **Reseller Frontend Portal** | [`watch-sec-frontend/src/pages/PartnerPortal.tsx`](file:///opt/projects/monitorix/watch-sec-frontend/src/pages/PartnerPortal.tsx) | Complete UI for customers, quotes, commissions, and deployment monitoring |
| **Commercial REST APIs** | [`backend/app/api/v2/commercial_lifecycle.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/api/v2/commercial_lifecycle.py) | Full partner self-service and quoting endpoints |
| **MSSP & White-Label APIs** | [`backend/app/api/v2/global_mdr_mssp.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/api/v2/global_mdr_mssp.py) | White-label rebranding and multi-tenant SOC management |
| **Commercial Service Engine** | [`backend/app/services/commercial_lifecycle_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/commercial_lifecycle_service.py) | 20% margin calculation, quote lifecycle, license triggering |
| **Database Schema Models** | [`backend/app/db/models.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/db/models.py#L2993-L3155) | `Partner`, `Customer`, `PartnerCommissionRecord`, `CustomerDeployment` |
| **Architecture Diagram (PNG)** | [`docs/monitorix_reseller_architecture.png`](file:///opt/projects/monitorix/docs/monitorix_reseller_architecture.png) | High-resolution multi-tenant architecture topology |
| **Lifecycle Diagram (PNG)** | [`docs/monitorix_reseller_lifecycle_flow.png`](file:///opt/projects/monitorix/docs/monitorix_reseller_lifecycle_flow.png) | Step-by-step commercial onboarding and payout flow |
| **White-Label Diagram (PNG)** | [`docs/monitorix_white_label_hierarchy.png`](file:///opt/projects/monitorix/docs/monitorix_white_label_hierarchy.png) | Rebranding injection and portal delivery schematic |
| **Compiled Word Guide (.docx)** | [`docs/MONITORIX_RESELLER_AND_PARTNER_ECOSYSTEM_DEEP_DIVE_GUIDE.docx`](file:///opt/projects/monitorix/docs/MONITORIX_RESELLER_AND_PARTNER_ECOSYSTEM_DEEP_DIVE_GUIDE.docx) | Fully styled executive Word document with embedded diagrams |

