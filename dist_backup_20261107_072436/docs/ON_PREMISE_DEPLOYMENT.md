# Monitorix Sovereign Enterprise — On-Premises Deployment Architecture

## 1. Scope & Objective

This document defines the deployment architecture and operational baseline for deploying Monitorix directly onto on-premises bare-metal servers or enterprise hypervisors (VMware vSphere/ESXi, Proxmox VE, KVM, Nutanix AHV).

In this deployment model:
- 100% of telemetry, logs, packets, memory dumps, and forensic artifacts remain within the customer's on-premises network perimeter.
- No outbound connections to public clouds or vendor servers are required or established.
- Licensing and feature entitlements are enforced strictly on-premises using asymmetric cryptography (Ed25519).

---

## 2. Infrastructure Architecture & Sizing

```
                          [ CORPORATE NETWORK ]
                                    │
           ┌────────────────────────┴────────────────────────┐
           │                                                 │
   [ Workstations / Laptops ]                       [ Datacenter Servers ]
   (Windows, macOS, Linux)                          (RHEL, Ubuntu, Windows Server)
           │                                                 │
           └────────────────────────┬────────────────────────┘
                                    │
             Port 8005 (gRPC / HTTPS Agent Heartbeats)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   MONITORIX ON-PREMISES HOST SERVER                         │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    INGRESS REVERSE PROXY (NGINX)                      │  │
│  │    • Port 8085: SOC Web Console (TLS 1.3, HTTPS)                      │  │
│  │    • Port 8005: High-Throughput Agent Telemetry Gateway               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                   │                                         │
│       ┌───────────────────────────┴───────────────────────────┐             │
│       ▼                                                       ▼             │
│  ┌─────────────────────────┐                             ┌───────────────┐  │
│  │  MONITORIX API BACKEND  │                             │ AGENT GATEWAY │  │
│  │  • Commercial Engine    │                             │ • Dynamic OTP │  │
│  │  • Local Entitlement    │                             │ • Telemetry   │  │
│  │  • SOC Alert Dispatcher │                             │ • Heartbeats  │  │
│  └───────────┬─────────────┘                             └───────┬───────┘  │
│              │                                                   │          │
│  ┌───────────▼───────────────────────────────────────────────────▼───────┐  │
│  │                   SOVEREIGN DATA PLANE STORAGE                        │  │
│  │  • PostgreSQL 15:  Relational Metadata, Commercial Records, Users     │  │
│  │  • ClickHouse:     High-Volume Telemetry & Security Event Streaming   │  │
│  │  • Redis 7:        In-Memory Queuing, Rate-Limiting, Caching          │  │
│  │  • MinIO:          S3-Compatible Forensic Binaries & Packet Captures  │  │
│  │  • Qdrant:         Zero-Trust Vector Embeddings & Similarity Search   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Network Interfaces & Segmentation

For high-volume enterprise deployments, we recommend a dual-homed network configuration:

1. **Management Interface (`eth0` / `ens192`)**:
   - Subnet: Internal Security Operations Center / IT Management VLAN (e.g., `10.10.0.0/24`)
   - Purpose: SOC Analyst Browser Access (`https://soc.corp:8085`), SSH Administration (`port 22`), Backup Export.
2. **Agent Telemetry Ingestion Interface (`eth1` / `ens224`)**:
   - Subnet: Corporate Endpoint Routing Domain (e.g., `10.20.0.0/16`)
   - Purpose: Ingestion of agent heartbeats and threat telemetry (`https://agent-gateway.corp:8005`).

---

## 4. Local Cryptographic Entitlement & Hard Quota

Monitorix operates under an authoritative local entitlement engine:
1. **Public Key Verification**: The server holds only the Vendor Public Key (`4f0aea519bb1e5c72ee95032033bb9e430bed55d4c4f9741c5994c2c365ddbb2`). The vendor signing private key is never distributed.
2. **Quota Enforcement**:
   - Active agents are dynamically counted against the licensed `endpoint_limit`.
   - Decommissioned or uninstalled agents are automatically excluded from the count.
   - When the quota is reached, any additional enrollment attempts are authoritatively rejected locally with code:
     ```json
     {
       "allowed": false,
       "code": "ENDPOINT_LIMIT_EXCEEDED",
       "limit": 1000,
       "used": 1000,
       "available": 0,
       "reason": "Endpoint limit reached (1000/1000). New agent enrollment blocked."
     }
     ```

---

## 5. Storage Sizing & Data Retention Policies

| Data Tier | Storage Engine | Retention Window | Disk I/O Requirement |
| :--- | :--- | :--- | :--- |
| **Operational Metadata** | PostgreSQL 15 | Indefinite | 500+ IOPS SSD |
| **Hot Telemetry (EPS)** | ClickHouse | 30 - 90 Days | 3,000+ IOPS NVMe |
| **Warm Event Archive** | ClickHouse Tiered | 180 - 365 Days | High-Capacity SATA SSD / SAN |
| **Forensic PCAP & Memory**| MinIO | 30 Days | 1,000+ IOPS SSD / Object Store |
| **Threat Vector Store** | Qdrant | Indefinite | Fast Random-Access RAM / NVMe |

---

## 6. Daily Operations & System Maintenance

### Automated Daily Snapshots
Run the enterprise backup CLI via cron at off-peak hours:
```bash
0 2 * * * /opt/monitorix/scripts/monitorix-backup --output-dir /backup/monitorix/daily --full
```

### Health Diagnostics
Probe cluster health and subsystem performance:
```bash
/opt/monitorix/scripts/diagnostics.sh
```
