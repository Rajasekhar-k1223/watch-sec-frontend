# Monitorix Enterprise — On-Premises Deployment Guide

## 1. Executive Architecture Overview

Monitorix Enterprise is an enterprise XDR, SIEM, and Autonomous Cybersecurity Platform architected for sovereign, on-premises deployment. It is designed to satisfy the strict data residency, privacy, and compliance requirements of government agencies, defense contractors, financial institutions, and critical infrastructure operators.

```
                              CUSTOMER INTERNAL NETWORK
+----------------------------------------------------------------------------------+
|                                                                                  |
|   +-----------------------+                    +-----------------------------+   |
|   |   Protected Endpoints |                    |   Security Operations (SOC) |   |
|   |  (Windows, Linux, Mac)|                    |        Web Browser          |   |
|   +-----------+-----------+                    +--------------+--------------+   |
|               |                                               |                  |
|               | TLS 1.3 / mTLS                                | HTTPS (Port 8085)|
|               | Port 8005                                     |                  |
|               v                                               v                  |
|   +-----------------------+                    +-----------------------------+   |
|   |  Ingestion Load       |                    |  Monitorix Web Portal       |   |
|   |  Balancer (Nginx)     |                    |  (Hardened Nginx Container) |   |
|   +-----------+-----------+                    +--------------+--------------+   |
|               |                                               |                  |
|               | Proxy                                         | API Proxy / WS   |
|               v                                               v                  |
|   +-----------------------+                    +-----------------------------+   |
|   |  Agent Gateway API    |                    |  Monitorix Core API         |   |
|   |  (FastAPI Port 8005)  |                    |  (FastAPI Port 8000)        |   |
|   +-----------+-----------+                    +--------------+--------------+   |
|               |                                               |                  |
|               | Kafka Stream                                  | SQL / Cache      |
|               v                                               v                  |
|   +-----------------------+                    +-----------------------------+   |
|   |  Message Streaming    |                    |  PostgreSQL 15 (Relational) |   |
|   |  (Kafka / Zookeeper)  |                    |  Redis 7 (Cache & Tasks)    |   |
|   +-----------+-----------+                    |  ClickHouse (Telemetry/SIEM)|   |
|               |                                +-----------------------------+   |
|               v                                                                  |
|   +-----------------------+                                                      |
|   |  Streaming Analytics  |                                                      |
|   |  & Detection Worker   |                                                      |
|   +-----------------------+                                                      |
|                                                                                  |
+----------------------------------------------------------------------------------+
       |
       X  FIREWALL: ALL INBOUND & OUTBOUND TRAFFIC BLOCKED (AIR-GAPPED MODE)
```

---

## 2. Hardware and Operating System Requirements

### 2.1 Supported Operating Systems
* **Primary Target:** Linux x86_64 (Enterprise Linux: RHEL 8/9, Rocky Linux 8/9, Ubuntu Server 20.04/22.04 LTS, Debian 11/12)
* **Secondary Target:** Linux ARM64 (aarch64)
* **Cluster Deployment:** Kubernetes 1.25+ / OpenShift 4.12+ (Enterprise Container Platform)

### 2.2 Sizing Guidelines

| Deployment Tier | Endpoints Monitored | CPU Cores | RAM | Storage (NVMe/SSD) | Ingestion Bandwidth |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Proof of Concept (PoC)** | Up to 250 | 4 Cores | 8 GB | 100 GB | 10 Mbps |
| **Standard Enterprise** | 250 - 2,500 | 8 Cores | 32 GB | 500 GB - 1 TB | 50 Mbps |
| **Large Enterprise** | 2,500 - 10,000 | 16 Cores | 64 GB | 2 TB - 5 TB | 250 Mbps |
| **Mission-Critical SOC** | 10,000+ | Distributed | Distributed | Tiered SAN/S3 | 1 Gbps+ |

---

## 3. Network Architecture & Firewall Configuration

### 3.1 Network Ingress Rules

| Port | Protocol | Source | Destination | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **8085 / 443** | TCP (HTTPS) | SOC Analysts / Admins | Monitorix Server | Web Console & REST/WebSocket API |
| **8005** | TCP (TLS) | Monitored Endpoints | Monitorix Server | Agent Telemetry & Heartbeat Ingestion |
| **50051** | TCP (gRPC/mTLS)| Monitored Endpoints | Monitorix Server | High-throughput Streaming EDR Ingestion |
| **22** | TCP (SSH) | IT / Systems Admin | Host OS | Host Administration (Customer Internal) |

### 3.2 Network Egress Rules
* **Air-Gapped Mode:** ZERO outbound connections required. Host firewall may block 100% of outbound Internet traffic (`OUTPUT DROP`).
* **Connected Mode (Optional):** Outbound HTTPS (Port 443) only to customer-approved threat intelligence proxies or vendor license synchronization endpoints. No raw telemetry is ever transmitted.

---

## 4. Pre-Installation Host Preparation

### 4.1 Prerequisites Installation (Ubuntu / Debian)
```bash
# Update and install Docker CE & Docker Compose Plugin
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Install Docker Engine (if not already installed)
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Ensure current user has Docker permissions
sudo usermod -aG docker $USER
```

### 4.2 Kernel Parameter Optimization
For high-volume SIEM and ClickHouse telemetry ingestion:
```bash
sudo sysctl -w vm.max_map_count=262144
sudo sysctl -w fs.file-max=1000000
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
echo "fs.file-max=1000000" | sudo tee -a /etc/sysctl.conf
```

---

## 5. Enterprise Installation Workflow

### 5.1 Step 1: Extract Customer Release Bundle
```bash
tar -xzf monitorix-enterprise-19.1.0.tar.gz
cd monitorix-enterprise-19.1.0
```

### 5.2 Step 2: Verify Artifact Integrity
```bash
sha256sum -c checksums/SHA256SUMS.txt
```

### 5.3 Step 3: Run Sovereign Installer
```bash
sudo ./installer/install.sh
```

The installer autonomously executes:
1. System hardware & prerequisite validation (CPU, RAM, Disk, Docker).
2. Checksum and signature verification.
3. Offline cryptographic license signature verification.
4. Cryptographically strong secret key generation (`SECRET_KEY`, `VAULT_MASTER_KEY`).
5. Offline container image loading (`docker load`).
6. Volume directory creation and permissions lockdown (`chmod 700 storage/vault`).
7. Multi-container service startup via Docker Compose.
8. Real-time health check verification.

---

## 6. First-Run Setup & SOC Access

1. Open your browser and navigate to:
   ```
   http://<MONITORIX_HOST_IP>:8085
   ```
   *(Or your internal DNS name: `https://monitorix.internal:8085`)*

2. Log in with the initial administrative credentials:
   * **Username:** `superadmin`
   * **Password:** Generated dynamically during `./installer/install.sh` and recorded in `config/monitorix.env` (temporary fallback `changeme!` if deployed manually without installer; mandatory password change enforced on first authentication).

3. **First-Run Configuration Wizard:**
   * **Organization Setup:** Confirm Enterprise Entity and Tenant Hierarchy.
   * **License Activation:** Confirm authorized endpoint quota and activated engines.
   * **TLS Certificate:** Upload internal enterprise CA certificates or use self-signed TLS.
   * **Agent Deployment:** Download signed agent packages (Windows MSI, Linux RPM/DEB, macOS PKG).
   * **Detection Baseline:** Select active Sigma rules, YARA rulesets, and MITRE ATT&CK profiles.

---

## 7. Storage Persistence & Disaster Recovery

### 7.1 Volume Mapping
All stateful customer data is isolated in the host filesystem under `storage/`:
* `storage/postgres`: System metadata, users, RBAC, incidents, alert states.
* `storage/clickhouse`: High-velocity EDR/NDR events and SIEM logs.
* `storage/redis`: Task queues, streaming state, session cache.
* `storage/vault`: Encrypted secrets, agent tokens, and cryptographic keys.

### 7.2 Automated Daily Backups
A production backup script is provided in `scripts/backup.sh`:
```bash
# Execute an on-demand full database and configuration backup
./scripts/backup.sh /var/backups/monitorix
```
Add to cron for automated daily backups:
```cron
0 2 * * * /opt/monitorix/scripts/backup.sh /var/backups/monitorix > /var/log/monitorix-backup.log 2>&1
```

### 7.3 Cluster Rollback
If a software update requires rollback, execute:
```bash
./scripts/rollback.sh
```
This restores previous container image versions, reloads database schemas, and verifies service restoration without data loss.
