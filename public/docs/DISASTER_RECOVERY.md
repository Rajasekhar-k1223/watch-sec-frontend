# Monitorix Sovereign Enterprise — Disaster Recovery & Business Continuity Plan

## 1. Objectives & SLAs

In critical infrastructure and defense environments, security monitoring platforms must ensure rapid and reliable disaster recovery capabilities:

| Metric | Target SLA | Implementation Mechanism |
| :--- | :--- | :--- |
| **Recovery Time Objective (RTO)** | < 15 Minutes | Atomic container initialization & streaming database restore via `monitorix-restore` |
| **Recovery Point Objective (RPO)** | < 24 Hours (Standard) / < 1 Hour (Streaming) | Scheduled nightly `monitorix-backup` or continuous PostgreSQL WAL archiving |
| **Integrity SLA** | 100% Cryptographic Match | Asymmetric Ed25519 signatures and SHA-256 digest validation |
| **Data Sovereignty SLA** | 0 Bytes Leaked | Zero data egress, local on-premises/air-gapped restoration |

---

## 2. Recovery Tiers & Scenarios

### Tier 1: Full System Recovery (Catastrophic Hardware Loss)
- **Trigger**: Total hardware failure, hypervisor destruction, or complete datacenter loss.
- **Procedure**:
  1. Provision a clean host conforming to minimum hardware specifications (8+ vCPU, 32 GB RAM, 100+ GB NVMe).
  2. Deploy Docker Engine and Docker Compose.
  3. Extract the enterprise bundle `monitorix-enterprise-<version>.tar.gz`.
  4. Copy latest backup tarball: `monitorix-backup-<timestamp>.tar.gz` and `.sha256`.
  5. Execute full recovery:
     ```bash
     sudo ./scripts/monitorix-restore --backup monitorix-backup-<timestamp>.tar.gz --full
     ```
  6. Confirm all containers reach healthy state:
     ```bash
     ./scripts/health-check.sh
     ```

### Tier 2: Database Recovery (Operational Corruption)
- **Trigger**: Accidental table drop, bad administrative script, or unrecoverable schema error.
- **Procedure**:
  ```bash
  sudo ./scripts/monitorix-restore --backup monitorix-backup-<timestamp>.tar.gz --db-only
  ```

### Tier 3: Configuration & Secrets Recovery
- **Trigger**: Accidental modification of `monitorix.env` or lost vault credentials.
- **Procedure**:
  ```bash
  sudo ./scripts/monitorix-restore --backup monitorix-backup-<timestamp>.tar.gz --config-only
  sudo docker compose restart backend agent-gateway
  ```

### Tier 4: License & Certificate Recovery
- **Trigger**: Expired TLS certificates, accidental certificate deletion, or invalid license file replacement.
- **Procedure**:
  ```bash
  sudo ./scripts/monitorix-restore --backup monitorix-backup-<timestamp>.tar.gz --license-only --certs-only
  sudo docker compose restart frontend
  ```

---

## 3. Disaster Recovery Drill & Validation Protocol

To comply with SOC 2, ISO 27001, and NIST SP 800-53 CP-4 (Contingency Plan Testing), run semi-annual recovery drills:

### Drill Checklist:
1. **Prepare Isolated Test Host**: Ensure the test host has no network route conflicts with the production cluster.
2. **Transfer Latest Production Snapshot**: Download `monitorix-backup-<timestamp>.tar.gz`.
3. **Verify SHA-256 Digest**:
   ```bash
   sha256sum -c monitorix-backup-<timestamp>.sha256
   ```
4. **Execute Restoration Dry-Run & Health Probe**:
   ```bash
   ./scripts/monitorix-restore --backup monitorix-backup-<timestamp>.tar.gz --full
   ```
5. **Simulate Agent Heartbeat**: Send a test heartbeat to ensure endpoints can re-authenticate immediately after cluster restoration:
   ```bash
   curl -k -X POST https://127.0.0.1:8005/api/agent/heartbeat ...
   ```
6. **Log Drill Audit**: Record drill timestamp, duration (RTO observed), and data integrity score in compliance registers.
