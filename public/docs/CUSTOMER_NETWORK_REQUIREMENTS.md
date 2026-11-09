# Monitorix Sovereign Enterprise — Customer Network Requirements & Port Matrix

## 1. Network Topology & Ingress/Egress Principles

Monitorix is designed for strict zero-trust network architectures:
- **Zero Inbound Internet Traffic**: The server must never be exposed directly to the public internet. Access is restricted to internal corporate networks, management VLANs, and authorized VPN concentrators.
- **Zero Mandatory Outbound Internet Traffic**: The platform operates in air-gapped mode with zero external cloud or vendor dependencies.
- **Strict Microservice Network Isolation**: All backend datastores (PostgreSQL, ClickHouse, Redis, MinIO, Qdrant) communicate strictly across internal Docker bridge networks (`monitorix-internal`) and are NOT exposed to the host network interface.

---

## 2. Ingress Port Requirements (External / Host Level)

| Port | Protocol | Source | Destination | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **8085** (or 443) | TCP (TLS 1.3) | SOC Analyst Workstations / IT Admins | Monitorix Nginx Frontend | Web Command Center, Dashboard & Administrative APIs |
| **8005** | TCP (HTTPS / mTLS / gRPC) | Corporate Endpoints (Workstations / Servers) | Monitorix Agent Gateway | Agent Heartbeats, Process Telemetry, Security Alerts |
| **22** | TCP (SSH) | Administrative Bastion / Jump Host | Monitorix Host OS | Host Administration & Backup Operations |

---

## 3. Intra-Cluster Network Requirements (Isolated Internal Bridge Only)

These ports are bound strictly to internal container networks (`monitorix-internal` / `172.28.0.0/16`) and must **never** be exposed or forwarded to external network interfaces:

| Port | Protocol | Service | Description |
| :--- | :--- | :--- | :--- |
| **5432** | TCP | `sentinel_postgres` | Relational operational metadata, RBAC, licenses |
| **6379** | TCP | `sentinel_redis` | In-memory message queues, Celery broker, caching |
| **8123** / **9000** | TCP | `sentinel_clickhouse` | High-throughput telemetry log storage and OLAP queries |
| **9000** / **9001** | TCP | `sentinel_minio` | S3-compatible forensic PCAP and binary storage |
| **6333** / **6334** | TCP | `sentinel_qdrant` | AI SOC vector search and similarity indexing |
| **29092** | TCP | `sentinel_kafka` | Telemetry event streaming pipeline |
| **8000** | TCP | `watch-sec-backend` | Internal FastAPI application server |

---

## 4. Optional Outbound Integrations

If the customer wishes to enable external alerts or forward telemetry to an existing corporate syslog collector:

| Port | Protocol | Destination | Purpose |
| :--- | :--- | :--- | :--- |
| **587** / **465** | TCP (TLS) | Customer Internal SMTP Relay | Email alert dispatching for critical threat alerts |
| **514** | UDP / TCP | Corporate Central SIEM (Splunk, QRadar) | Outbound Syslog/CEF event forwarding |
| **443** | TCP (HTTPS) | Internal Ticketing System (Jira / ServiceNow) | Automated SOAR incident ticket generation |

---

## 5. Bandwidth & Latency Guidelines

| Deployment Tier | Endpoints | Recommended Ingestion Bandwidth | Latency Tolerance |
| :--- | :--- | :--- | :--- |
| **Starter** | Up to 500 Endpoints | 10 Mbps sustained / 50 Mbps burst | < 150 ms |
| **Standard Enterprise** | 500 - 2,500 Endpoints | 50 Mbps sustained / 200 Mbps burst | < 100 ms |
| **Large Enterprise** | 2,500 - 10,000+ Endpoints | 200 Mbps sustained / 1 Gbps burst | < 50 ms |
