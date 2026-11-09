# Monitorix Sovereign Enterprise — License Activation & Cryptographic Verification

## 1. Cryptographic Architecture

Monitorix Enterprise utilizes **asymmetric public-key cryptography (RFC 8032 Ed25519)** to enforce software entitlements without requiring any cloud connection or external phone-home mechanism.

```
       [ VENDOR ROOT AUTHORITY / HSM ]
                      │
     Signs license payload with Vendor Private Key:
     [AIR_GAPPED_VENDOR_ROOT_PRIVATE_KEY_NEVER_SHIPPED_OR_EXPOSED]
                      │
                      ▼
            [ customer-license.json ]
                      │
          Physical Transfer (Air-Gapped)
                      │
                      ▼
    [ CUSTOMER ON-PREMISES DEPLOYMENT SERVER ]
                      │
     Verifies signature using Public Key only:
     4f0aea519bb1e5c72ee95032033bb9e430bed55d4c4f9741c5994c2c365ddbb2
                      │
   ┌──────────────────┴──────────────────┐
   ▼                                     ▼
[ VALID: ENTITLEMENTS ACTIVE ]       [ TAMPERED: LICENSE REJECTED ]
```

### Key Separation Principle
- **Vendor Authority**: Retains the Ed25519 private signing key in air-gapped hardware security modules (HSMs). The private key is never distributed or included in customer software packages.
- **Customer Deployment**: Contains strictly the Ed25519 public verification key (`4f0aea519bb1e5c72ee95032033bb9e430bed55d4c4f9741c5994c2c365ddbb2`). Changing even a single byte or character in the license payload invalidates the signature immediately.

---

## 2. License Data Schema

A valid Monitorix license payload contains:

```json
{
  "license_id": "LIC-2026-CUSTOMER-ACME-01",
  "customer_id": "CUST-ACME-CORP",
  "deployment_id": "dep-acme-onprem-01",
  "product": "Monitorix Sovereign XDR/SIEM Platform",
  "edition": "enterprise",
  "endpoint_limit": 5000,
  "server_limit": 250,
  "vm_limit": 500,
  "cloud_account_limit": 50,
  "user_limit": 50,
  "database_limit": 25,
  "kubernetes_limit": 10,
  "network_sensor_limit": 20,
  "storage_limit_gb": 50000,
  "events_per_second_limit": 50000,
  "enabled_modules": [
    "edr", "xdr", "siem", "soar", "ai_soc", "ueba",
    "threat_hunting", "yara", "sandbox", "waap", "dlp",
    "itdr", "cnapp", "easm", "ndr", "dam", "secrets"
  ],
  "valid_from": "2026-10-29T00:00:00Z",
  "valid_until": "2027-10-29T23:59:59Z",
  "deployment_type": "ON_PREMISE",
  "version_policy": "LTS",
  "offline_grace_period_days": 14,
  "issued_at": "2026-10-29T10:00:00Z",
  "issuer": "Monitorix Enterprise Root Authority"
}
```

---

## 3. Activation Procedures

### Method 1: Automated Offline License Pre-Injection
When generating a custom distribution package via the Monitorix Deployment Center:
1. The customer license is automatically generated and digitally signed.
2. The license is placed in the bundle at `/opt/monitorix/license/customer-license.json`.
3. During execution of `./installer/install.sh`, Phase 3 automatically detects, verifies, and registers the license into the local PostgreSQL instance without manual intervention.

### Method 2: First-Run Web Portal Activation
If deploying a generic enterprise bundle or applying a renewal license:
1. Access the First-Run Setup interface at `https://<server-ip>:8085/setup`.
2. Under **Step 2: Cryptographic License Activation**, either:
   - Paste the base64-encoded signed license token string.
   - Upload the `customer-license.json` file.
3. The local entitlement engine computes the canonical SHA-256 digest of the payload and verifies the Ed25519 signature in-browser and on the backend.
4. Upon successful validation, entitlements are committed locally and the administrator is redirected to the SOC Command Center.

### Method 3: Command-Line Interface (CLI) Activation
To update or apply a renewed license via SSH or host shell:
```bash
# 1. Place renewed license file
sudo cp renewed-license.json /opt/monitorix/license/customer-license.json

# 2. Run activation CLI probe
sudo docker exec -i watch-sec-backend python -c "
import asyncio, json
from app.db.session import AsyncSessionLocal
from app.services.commercial_lifecycle_service import commercial_lifecycle_service

async def main():
    async with AsyncSessionLocal() as session:
        lic_data = json.load(open('/opt/monitorix/license/customer-license.json'))
        res = await commercial_lifecycle_service.activate_deployment_license(
            db=session,
            target_dep_id='dep-acme-onprem-01',
            payload=lic_data,
            actor='sysadmin'
        )
        print('[✓] License activation successful:', res)

asyncio.run(main())
"
```

---

## 4. License Lifecycle State Machine

```
              ┌────────────────┐
              │     ACTIVE     │
              └───────┬────────┘
                      │ (30 Days Remaining)
                      ▼
              ┌────────────────┐
              │    EXPIRING    │
              └───────┬────────┘
                      │ (Expiration Date Passed)
                      ▼
              ┌────────────────┐
              │  GRACE_PERIOD  │ (14-Day Full Functionality Window)
              └───────┬────────┘
                      │ (Grace Period Expired)
                      ▼
              ┌────────────────┐
              │   RESTRICTED   │ (Read-Only SOC, Existing Agents Active, New Enrollments Blocked)
              └───────┬────────┘
                      │ (Administrative Action)
                      ▼
              ┌────────────────┐
              │    REVOKED     │ (Tamper Detected or Contract Terminated)
              └────────────────┘
```

1. **ACTIVE**: All modules and agent enrollments operating within authorized limits.
2. **EXPIRING**: Visual alert banners presented in the SOC banner alerting administrators to renew.
3. **GRACE_PERIOD (14 Days)**: Complete detection, telemetry ingestion, and SOAR execution continue uninterrupted.
4. **RESTRICTED**: Telemetry collection continues; new agent enrollments are strictly rejected with `ENDPOINT_LIMIT_EXCEEDED` or `LICENSE_RESTRICTED`.
5. **REVOKED / EXPIRED**: SOC console switches to administrative-only access for data export and compliance auditing.
