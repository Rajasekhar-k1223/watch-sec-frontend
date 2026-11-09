# Monitorix Sovereign Enterprise — Platform Update & Maintenance Guide

## 1. Overview & Update Philosophy

Monitorix is engineered for high-availability enterprise environments where update operations must never result in cluster downtime, data loss, or prolonged telemetry blackouts.

All Monitorix updates adhere to the following principles:
1. **100% Offline Capable**: Updates do not rely on live internet connections or external registries.
2. **Cryptographic Provenance**: Every release package is signed using RFC 8032 Ed25519 digital signatures.
3. **Automated Pre-Update Snapshots**: The platform automatically creates a full operational snapshot before modifying a single configuration file or database table.
4. **Deterministic Rollback**: If database schema migration, container initialization, or health checks fail, the installer automatically triggers an atomic rollback.

---

## 2. Release Channels

Monitorix provides two distinct release tracks:

| Track | Target Audience | Cadence | Support Window |
| :--- | :--- | :--- | :--- |
| **LTS (Long-Term Support)** | Critical infrastructure, defense, banking, SCADA enclaves | Every 6 - 12 Months | 24 Months Security & Bug Fixes |
| **Standard Enterprise** | Corporate SOCs, cloud-native enterprises, MSSPs | Every 6 - 8 Weeks | Active track until superseded |

---

## 3. End-to-End Update Execution Pipeline

```
[ Update Package: monitorix-update-<version>.tar.gz ]
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 MONITORIX UPDATE INSTALLER                  │
│                                                             │
│  [Step 1] Compatibility Check                               │
│           • Current Version >= MinUpgradeVersion            │
│                                                             │
│  [Step 2] Asymmetric Ed25519 Signature Verification         │
│           • Validates manifest.sig against Root Public Key  │
│                                                             │
│  [Step 3] SHA-256 Checksum Validation                       │
│           • Verifies digest of every bundled file & image   │
│                                                             │
│  [Step 4] Pre-Update Automated Snapshot Backup              │
│           • Dumps PostgreSQL, ClickHouse schema, MinIO,     │
│             license, certs, and config to backup archive    │
│                                                             │
│  [Step 5] Database Schema & Data Migrations                 │
│           • Applies SQL DDL/DML inside transaction blocks   │
│           • Executes post-migration verification probes     │
│                                                             │
│  [Step 6] Container Image Staging & Service Reload          │
│           • Reloads backend, frontend, and gateway          │
│                                                             │
│  [Step 7] Post-Update Health Check Probes                   │
│           • Probes /api/health and database connectivity    │
│                                                             │
│  ┌───────────────────────────┐ ┌──────────────────────────┐ │
│  │    ALL PROBES PASSED      │ │       PROBE FAILED       │ │
│  │  Finalize Cluster Version │ │ Trigger Atomic Rollback  │ │
│  │  Status: SUCCESS          │ │ Restore from Pre-Update  │ │
│  │  Return 0                 │ │ Status: ROLLED_BACK      │ │
│  └───────────────────────────┘ └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Applying an Update

To apply an update package on the Monitorix host:

```bash
# 1. Place the signed update package
cd /opt/monitorix

# 2. Execute update installer
sudo ./scripts/monitorix-update --package /path/to/monitorix-update-19.2.0.tar.gz
```

### Command-Line Arguments
- `--package <file>`: (Required) Path to the signed `monitorix-update-<version>.tar.gz` bundle.
- `--skip-backup`: (Optional) Skips pre-update backup snapshot (recommended only for non-production lab testing).
- `--public-key <hex>`: (Optional) Custom vendor authority public verification key.

### Sample Execution Output:
```
================================================================================
          MONITORIX ENTERPRISE OFFLINE UPDATE INSTALLER                         
================================================================================
[*] Package:         monitorix-update-19.2.0.tar.gz
[*] Staging Temp:    /tmp/monitorix-update-stage.8Bfa12
--------------------------------------------------------------------------------
[1/8] Unpacking update bundle and inspecting manifest...
  [✓] Target Version:       19.2.0
  [✓] Channel:              LTS
  [✓] Min Required Version: 19.1.0
[2/8] Checking cluster version compatibility...
  [*] Detected Current Version: 19.1.0
  [✓] Cluster satisfies compatibility requirements.
[3/8] Verifying cryptographic signatures (Ed25519)...
  [✓] Manifest Ed25519 signature verified successfully.
[4/8] Validating SHA-256 checksums across all bundle artifacts...
  [✓] All package artifacts verified against cryptographic digest.
[5/8] Creating pre-update snapshot backup...
  [✓] Pre-update snapshot secured: /opt/monitorix/backups/monitorix-backup-20261029_120522.tar.gz
[6/8] Executing schema migrations...
  [*] Applying migration: 19.2.0_upgrade.sql
  [✓] PostgreSQL migration applied successfully.
  [*] Running migration verification probe...
  [✓] Schema verification probe PASSED.
[7/8] Staging container images and warm-reloading services...
  [✓] watch-sec-backend container reloaded.
[8/8] Performing post-update system health validation...
  [✓] Health check probe PASSED: API is fully operational.
================================================================================
[✓] MONITORIX ENTERPRISE UPGRADE TO 19.2.0 COMPLETED SUCCESSFULLY!
================================================================================
```

---

## 5. Automated Rollback Safeguards

If an update fails at any step after Step 5 (e.g., a SQL syntax error, container crash loop, or failed health check):
1. The update script traps the error (`trap rollback_on_failure ERR`).
2. It automatically invokes `/opt/monitorix/scripts/monitorix-restore` pointing to the pre-update snapshot.
3. Database schemas and configs are restored to their exact pre-update state.
4. Services are restarted under the previous stable version.
5. The upgrade attempt is logged in `UpdateHistories` with status `ROLLED_BACK` and the root-cause error trace.
