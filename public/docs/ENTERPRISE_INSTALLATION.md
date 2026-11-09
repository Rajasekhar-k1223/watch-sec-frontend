# Monitorix Sovereign Enterprise — Installation & Deployment Guide

## 1. Executive Overview

Monitorix is a 100% sovereign, enterprise-grade Extended Detection and Response (XDR) and Security Information and Event Management (SIEM) platform designed for strict data sovereignty, on-premises data centers, private cloud environments, and air-gapped critical infrastructure networks.

Customer security telemetry, audit logs, forensic captures, and threat detection intelligence remain strictly within the customer's controlled perimeter. Zero telemetry or data is ever transmitted to vendor infrastructure.

---

## 2. System Hardware & Infrastructure Prerequisites

### Minimum Hardware Sizing

| Component | Proof of Concept / Lab | Standard Enterprise (up to 2,500 agents) | High-Volume Enterprise (up to 10,000+ agents) |
| :--- | :--- | :--- | :--- |
| **CPU Architecture** | x86_64 / amd64 | x86_64 / amd64 | x86_64 / amd64 |
| **CPU Cores** | 4 Cores (2.4 GHz+) | 8 - 16 Cores | 32+ Cores |
| **RAM** | 8 GB | 32 GB ECC RAM | 64 - 128 GB ECC RAM |
| **Storage (System)** | 50 GB NVMe | 100 GB NVMe | 250 GB NVMe |
| **Storage (Telemetry)** | 100 GB SSD | 1 TB - 4 TB NVMe / SAN | 10 TB+ Fast Tiered Storage |
| **Network Interface** | 1 Gbps Ethernet | 10 Gbps Ethernet | 10 Gbps+ Bonded Redundant NICs |

### Operating System & Runtime Environment
- **Supported Linux Distributions**:
  - Rocky Linux 9.x / AlmaLinux 9.x / RHEL 8.8+ & 9.x
  - Ubuntu Server 22.04 LTS / 24.04 LTS
  - Debian 12 (Bookworm)
  - SUSE Linux Enterprise Server (SLES) 15 SP5+
- **Container Runtime**:
  - Docker Engine 24.0.0+ / 26.0+
  - Docker Compose v2.20.0+ (`docker compose` plugin)
  - Podman 4.6+ with `podman-compose` (optional air-gapped rootless profile)

---

## 3. Customer Deployment Distribution Package

Monitorix is provided to the customer as a single, self-contained, cryptographically signed distribution archive:
```
monitorix-enterprise-<version>-<deployment-id>.tar.gz
```

### Verification Before Extraction
Every distribution archive includes a SHA-256 checksum and an asymmetric Ed25519 digital signature:
```bash
# Verify archive checksum
sha256sum -c monitorix-enterprise-19.1.0-dep-customer.tar.gz.sha256

# Verify digital signature against Monitorix Root Public Key
python3 -c "
from cryptography.hazmat.primitives.asymmetric import ed25519
pub = ed25519.Ed25519PublicKey.from_public_bytes(bytes.fromhex('4f0aea519bb1e5c72ee95032033bb9e430bed55d4c4f9741c5994c2c365ddbb2'))
sig = bytes.fromhex(open('monitorix-enterprise-19.1.0-dep-customer.tar.gz.sig').read().strip())
data = open('monitorix-enterprise-19.1.0-dep-customer.tar.gz', 'rb').read()
pub.verify(sig, data)
print('[✓] Archive signature verified successfully.')
"
```

### Unpacking the Distribution Archive
```bash
tar -xzf monitorix-enterprise-19.1.0-dep-customer.tar.gz -C /opt/monitorix
cd /opt/monitorix
```

### Directory Structure
```
/opt/monitorix/
├── bin/                          # Stripped compiled binaries (no source code)
├── config/                       # Sovereign configuration & environment templates
│   ├── monitorix.env.example     # Master environment specification
│   └── nginx.conf                # Local reverse proxy & TLS termination
├── certificates/                 # TLS/mTLS certificates and customer CA
├── deployment/                   # Docker Compose cluster definition
│   └── docker-compose.enterprise.yml
├── license/                      # Cryptographically signed customer offline license
│   └── customer-license.json
├── images/                       # Pre-cached OCI container image layers (Air-gapped)
├── installer/                    # Automated enterprise installation suite
│   └── install.sh                # Hardened idempotent installation CLI
├── scripts/                      # Operational CLI tools
│   ├── monitorix-backup          # Unified disaster recovery backup tool
│   ├── monitorix-restore         # Disaster recovery restoration tool
│   ├── monitorix-update          # Offline update and schema upgrade installer
│   ├── health-check.sh           # Cluster health probe script
│   └── diagnostics.sh            # Live system resource diagnostic tool
├── storage/                      # Persistent stateful mounts (Postgres, ClickHouse, MinIO, Vault)
└── release-manifest.json         # Cryptographic release bill of materials
```

---

## 4. Pre-Flight System Validation & Dry-Run Mode

Before initiating service deployment, run the installer in dry-run mode to audit CPU, RAM, disk space, Docker engine availability, and cryptographic license validity without altering host system state:
```bash
./installer/install.sh --dry-run
```

Sample output:
```
================================================================================
        MONITORIX ENTERPRISE ON-PREMISES DEPLOYMENT & INSTALLATION             
        Version 19.1.0 LTS | Sovereign Air-Gapped Release                      
        [MODE: PRE-FLIGHT DRY-RUN & SYSTEM VERIFICATION]                       
================================================================================

[PHASE 1/8] Validating Host System Hardware & Runtime Environment...
  [✓] CPU Cores: 16 detected (Meets minimum requirements)
  [✓] System Memory: 32GB detected
  [✓] Disk Storage: 240GB free space available
  [✓] Docker Engine: Docker version 26.1.0, build 8900f1d
  [✓] Docker Compose: Docker Compose version v2.27.0

[PHASE 2/8] Verifying Release Artifact Integrity & Digital Signatures...
  [✓] Release Manifest signature verified.

[PHASE 3/8] Verifying Customer Cryptographic Offline License...
  [*] Reading license: license/customer-license.json
  [✓] License ID:       LIC-2026-CUSTOMER-ENTERPRISE
  [✓] Licensed Entity:  CUST-ACME-ENTERPRISE
  [✓] Endpoint Quota:   5000 Endpoints
  [✓] Expiration Date:  2027-10-29T12:00:00Z
  [✓] Offline Ed25519 signature validated against embedded public verification key.

[PHASE 4/8] Initializing Sovereign Configuration & Credentials...
  [✓] Existing configuration detected: config/monitorix.env

[PHASE 5/8] Loading Signed Container Images...

[PHASE 6/8] Provisioning Local Storage Volumes & Network Services...

[✓] DRY-RUN / PRE-FLIGHT SYSTEM VERIFICATION PASSED SUCCESSFULLY!
```

---

## 5. Production Cluster Installation

To execute the actual deployment:
```bash
chmod +x ./installer/install.sh
sudo ./installer/install.sh
```

### Installation Pipeline Phases:
1. **Phase 1: Hardware & Runtime Validation** — Verifies CPU, memory, storage, and container runtime.
2. **Phase 2: Digital Signature Verification** — Validates SHA-256 digests and Ed25519 signatures on all bundle artifacts.
3. **Phase 3: Offline License Verification** — Cryptographically verifies the customer license against the root authority public key.
4. **Phase 4: Credentials & Secret Provisioning** — Generates cryptographically secure random values for `SECRET_KEY`, `VAULT_MASTER_KEY`, and database credentials if not pre-configured. Secrets are strictly masked in all installation logs.
5. **Phase 5: Container Image Staging** — Loads pre-packaged container images into the local Docker daemon without requiring internet connectivity.
6. **Phase 6: Storage Provisioning & Service Launch** — Creates isolated persistent directories with permissions (`chmod 700` for vault) and launches the core service mesh via Docker Compose.
7. **Phase 7: Health Checks & Verification Probes** — Probes core APIs, database connections, and ingress proxies until fully healthy.
8. **Phase 8: Portal URL & Credentials Output** — Displays the SOC Command Center URL and initial administrative login credentials.

---

## 6. Accessing the Monitorix SOC Portal

Once installation is complete, access the Monitorix Security Operations Center:
- **HTTPS URL**: `https://<server-ip>:8085` or `https://monitorix.internal:8085`
- **Initial Username**: `superadmin`
- **Initial Password**: Configured in `config/monitorix.env` (or displayed upon initial installation)
- **First-Run Setup**: Directs administrator to update the temporary master password, verify MFA, confirm license entitlements, and review endpoint enrollment tokens.
