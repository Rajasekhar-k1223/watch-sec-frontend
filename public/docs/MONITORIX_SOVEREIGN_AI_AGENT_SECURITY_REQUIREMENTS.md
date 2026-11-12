# MONITORIX SOVEREIGN AI AGENT SECURITY
## Architecture, Technical Requirements & Logic Specification
**Document ID:** `MTX-REQ-SOV-AI-SEC-2026`  
**Classification:** Enterprise Engineering Specification  
**Architecture Mode:** 100% Native & Sovereign (Zero Cloud Dependencies — No Azure Foundry, No Wiz, No Sentinel Required)  
**Target Correlation Key:** `test_run_id`  

---

## 1. Executive Architecture Overview

This specification establishes the end-to-end architecture, technical requirements, data models, detection logic, and correlation pipeline to implement **Enterprise AI Agent Security** natively within the existing Monitorix platform.

Rather than relying on third-party cloud services (Azure Foundry, Wiz, or Microsoft Sentinel), Monitorix will leverage its native infrastructure:
* **Kafka Event Bus (`:9092`)**: Real-time event streaming for prompt, response, and tool telemetry.
* **FastAPI Backend Gateway**: Native MCP (Model Context Protocol) Security Proxy and Tool Policy Gate.
* **ClickHouse SIEM Lake (`:8123`)**: Columnar storage of high-frequency AI execution traces and tool logs.
* **PostgreSQL (`:5432`)**: AI agent inventory, model registries, tool policies, and audit evidence.
* **Sigma Detection Engine (`sigma_compiler.py`)**: Native AI security Sigma rules evaluating streaming AI events.
* **SOAR Engine (`soar_engine.py`)**: Instant agent quarantine, token revocation, and tool circuit breaking.

```
                      ┌───────────────────────────────────────────────┐
                      │             CLIENT / USER PROMPT              │
                      └──────────────────────┬────────────────────────┘
                                             │
                                             ▼
                      ┌───────────────────────────────────────────────┐
                      │         MONITORIX AI SECURITY PROXY           │
                      │  - Prompt Injection Classifier (Fast Embed)   │
                      │  - DLP / Secret Masking (Shannon Entropy)     │
                      │  - test_run_id Tagging & Session Context      │
                      └──────┬─────────────────────────────────┬──────┘
                             │                                 │
                 (Safe Prompt)                                 │ (Violation / Injection)
                             ▼                                 ▼
         ┌──────────────────────────────────────┐     ┌────────────────────────────────┐
         │     ENTERPRISE AI AGENT / LLM        │     │  DETECTION & SOAR ALERT        │
         │  (Ollama, vLLM, OpenAI, v18 AI)      │     │  - Block Request (<120ms)      │
         └──────────────────┬───────────────────┘     │  - Sigma Alert: Event ID 9101  │
                            │                         └────────────────────────────────┘
                 (Tool Invocations via JSON-RPC)
                            ▼
         ┌─────────────────────────────────────────────────────────────┐
         │            MONITORIX NATIVE MCP SECURITY GATEWAY            │
         │  - Tool Manifest Integrity & SHA-256 Checksum               │
         │  - Parameter & Schema Validation (BOLA/SSRF Defense)        │
         │  - Human-in-the-Loop (HITL) Approval for High-Impact Tools  │
         │  - Network Egress Allowlisting                              │
         └─────────────┬─────────────────────────────────┬─────────────┘
                       │                                 │
           (Authorized Tool Call)               (Unauthorized / High-Risk)
                       ▼                                 ▼
         ┌───────────────────────────┐         ┌───────────────────────────────┐
         │      INTERNAL TOOLS       │         │   SOAR CIRCUIT BREAKER        │
         │ - SQL DB / ClickHouse     │         │ - Freeze Agent Session        │
         │ - REST APIs / Filesystem  │         │ - Notify SOC Analyst Queue    │
         └─────────────┬─────────────┘         └───────────────────────────────┘
                       │
             (Tool Execution Output)
                       ▼
         ┌─────────────────────────────────────────────────────────────┐
         │          INDIRECT INJECTION & SENSITIVE DATA SCAN           │
         │  - Scan Tool Output for Poisoned Instructions               │
         │  - Mask Internal DB Passwords / PII / Synthetic Canaries    │
         └─────────────────────────────┬───────────────────────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │   END-TO-END AUDIT PIPELINE   │
                       │ - Correlate: test_run_id      │
                       │ - ClickHouse: AI Event Trace  │
                       │ - PostgreSQL: Security Audit  │
                       └───────────────────────────────┘
```

---

## 2. The 12 Sovereign AI Agent Security Capabilities

### Capability A: Sovereign AI Agent Inventory & Discovery
* **Objective:** Automatically track and catalog all AI agents, assistant bots, autonomous scripts, and worker subagents operating within the enterprise.
* **Requirements:**
  1. **Agent Registration API:** Agents register via REST or SDK using mutual TLS or agent API keys.
  2. **Metadata Tracking:** Capture Agent Name, Unique UUID, Owner/Department, Execution Environment (Docker, K8s, Bare-metal), Parent Application, and Runtime Purpose.
  3. **Model Binding:** Link each agent to its designated LLM/SLM models and fallback endpoints.
  4. **Tool Linkage:** Map exact tools and MCP servers the agent is authorized to interact with.
  5. **Configuration Posture:** Assess configuration risks (e.g., excessive temperature, missing system prompt delimiters, unconstrained memory retention).

### Capability B: Private & Sovereign Model Security Posture
* **Objective:** Maintain security governance over AI models (local private models such as Ollama/vLLM, as well as external model endpoints).
* **Requirements:**
  1. **Model Catalog:** Central registry of authorized models (Name, Provider, Version, Host URL, Weight SHA-256).
  2. **Model Access Control:** Restrict which agents or tenant roles can query specific models.
  3. **Parameter Governance:** Enforce maximum tokens, top-p, and temperature ceilings to limit model drift and hallucination risks.
  4. **Vulnerability Assessment:** Track known CVEs and evasion vulnerabilities associated with specific model versions and model prompt templates.

### Capability C: Native Prompt Injection & Adversarial Defense
* **Objective:** Intercept and neutralize direct and indirect prompt injections before and during agent inference.
* **Requirements:**
  1. **Direct Injection Defense:** Multi-tier evaluation:
     - *Tier 1 (Fast Regex / Signature)*: Immediate detection of canonical jailbreaks (`ignore previous instructions`, `bypass policy`, `developer mode`, `system prompt extraction`).
     - *Tier 2 (Delimiter & Structure)*: Enforce strict separation between System Directives, Conversation History, and Untrusted User Input using XML/Markdown delimiters.
     - *Tier 3 (Fast Embedding Classifier)*: Cosine-similarity check against an offline vector library of known jailbreak attack vectors.
  2. **Indirect Prompt Injection Defense:** Inspect untrusted external data (PDFs, emails, web scraping results, customer tickets) for hidden instructions before feeding them to the agent.
  3. **Tool-Output Injection Filtering:** Scan data returned by tools (e.g., web search results, database row text) to prevent tool-based prompt overrides.
  4. **Canary Leak Detection:** Inject synthetic honey-canary tokens into system prompts; if an agent's output contains the canary token, trigger an immediate high-severity data leakage alert.

### Capability D: Native MCP (Model Context Protocol) Security Gateway
* **Objective:** Govern and secure all communication between AI agents and tools using the open Model Context Protocol (JSON-RPC 2.0).
* **Requirements:**
  1. **MCP Server Inventory:** Maintain a registry of MCP servers (Server Name, Host, Port/Transport, Protocol Version).
  2. **Tool Manifest Integrity:** Store SHA-256 hashes of tool schemas (Name, Description, Input JSON Schema). Reject execution if a tool definition is silently modified.
  3. **JSON-RPC Traffic Inspection:** Proxy and inspect all JSON-RPC 2.0 messages (`tools/list`, `tools/call`, `resources/read`).
  4. **Tool Version Pinning:** Prevent supply-chain drift by enforcing approved tool semantic versions.
  5. **Execution Auditing:** Record every tool call with full input arguments and output payload hashes.

### Capability E: Granular Tool Authorization & Human-in-the-Loop (HITL)
* **Objective:** Enforce zero-trust authorization on tool execution and require human approval for high-consequence operations.
* **Requirements:**
  1. **Allow/Deny Action Lists:** Explicit tenant-level policies specifying permitted tools per agent.
  2. **Parameter Validation:** Schema-enforced bounds (e.g., regex validation on SQL inputs, forbidding destructive commands like `DROP`, `DELETE`, `rm -rf`, `format`).
  3. **Risk Tiering:**
     - *Tier 1 (Read-Only)*: Autonomous execution permitted (e.g., read document, fetch weather).
     - *Tier 2 (Low Impact Write)*: Rate-limited autonomous execution with audit logging.
     - *Tier 3 (High Consequence)*: Requires human approval via the existing `SoarApprovalQueue` (e.g., database updates, file deletion, user permission modifications, external email dispatch).
  4. **Execution Enforcement:** Terminate tool requests that violate parameter constraints or lack valid approval tickets.

### Capability F: Agent Identity & Zero-Trust Governance
* **Objective:** Treat AI agents as first-class cryptographic identities with scoped credentials.
* **Requirements:**
  1. **Agent Cryptographic Identity:** Issue short-lived mTLS client certificates or 15-minute asymmetric JWTs specifically bound to the agent's UUID.
  2. **Least Privilege Delegation:** Agents execute tools under dedicated service principals, never inheriting superadmin or unconstrained database credentials.
  3. **Privilege Escalation Detection:** Alert if an agent requests tool permissions outside its defined role or attempts to spawn processes as `root`/`Administrator`.
  4. **Contextual Token Binding:** Bind tool access tokens to specific `test_run_id` and session IDs to prevent cross-session replay attacks.

### Capability G: Sovereign Secret Protection & Data Leakage Prevention (DLP)
* **Objective:** Prevent agents from ingesting, exposing, or hallucinating sensitive credentials.
* **Requirements:**
  1. **Bidirectional DLP Filter:**
     - *Inbound Prompt DLP*: Intercept API keys, AWS/Azure credentials, passwords, and private keys before reaching the model.
     - *Outbound Response DLP*: Mask PAN (credit cards using Luhn algorithm), SSNs, passwords, and JWTs in agent outputs.
  2. **Shannon Entropy Scanning:** Reuse the existing `calculate_shannon_entropy()` function in `secrets_security_service.py` to identify high-entropy strings.
  3. **Vault Integration:** Replace hardcoded secrets in agent tool parameters with ephemeral references from Monitorix Vault (`credential_vault.py`).

### Capability H: Network Egress & SSRF Protection
* **Objective:** Constrain agent and tool network traffic to prevent Server-Side Request Forgery and unauthorized data exfiltration.
* **Requirements:**
  1. **Strict Egress Allowlisting:** Prevent agent sandboxes from communicating with unapproved external IP addresses or domains.
  2. **SSRF Blocking:** Intercept attempts to query internal network services:
     - Cloud metadata IPs (`169.254.169.254`).
     - Localhost/loopback (`127.0.0.1`, `::1`, `0.0.0.0`).
     - Internal container networks and host private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
  3. **DNS Tunneling Interception:** Inspect tool outbound domain queries for high-entropy DGA or DNS data exfiltration attempts.

### Capability I: AI Runtime Behavior Anomaly Detection
* **Objective:** Detect behavioral anomalies, infinite loops, and operational runaway conditions in real time.
* **Requirements:**
  1. **Recursion & Loop Breaker:** Detect and terminate agents stuck in repetitive tool invocation loops (e.g., >5 identical tool calls within 60 seconds).
  2. **Burst Rate Limiting:** Enforce maximum tool executions per minute per agent (`RateLimitPerMinute`).
  3. **Token Usage Anomalies:** Detect sudden spikes in token consumption indicative of prompt injection extraction attacks.
  4. **Automated Circuit Breaker:** Automatically transition an agent to `QUARANTINED` status if risk thresholds are breached.

### Capability J: Multi-Stage AI Attack Path Graph
* **Objective:** Map and visualize attack paths connecting prompts, agents, models, tools, and sensitive backend assets.
* **Requirements:**
  1. **Directed Graph Nodes:**
     - `Prompt Source` (User / External API / Webhook)
     - `AI Agent Instance`
     - `Model Target`
     - `MCP Tool`
     - `Target Asset` (Database, S3 Bucket, Identity Account, File)
  2. **Edge Risk Analysis:** Highlight high-risk relationships (e.g., Untrusted User Input → Agent with Unrestricted SQL Tool → Production DB).
  3. **Blast Radius Calculation:** Compute potential impact if a specific agent's prompt guardrail is breached.

### Capability K: Native Security Response & Containment
* **Objective:** Execute automated or 1-click containment against rogue or compromised AI agents.
* **Requirements:**
  1. **Instant Agent Revocation:** 1-click kill switch to revoke an agent's active session JWT and disable its API credentials.
  2. **MCP Tool Quarantine:** Temporarily disable a specific compromised tool across all agents without stopping the agents themselves.
  3. **Incident Generation:** Automatically create an `Incident` in `app/db/models.py` when high-confidence prompt injections or unauthorized tool attempts occur.
  4. **SOAR Playbook Execution:** Trigger automated response playbooks (e.g., snapshot agent memory, notify SOC, roll back unauthorized database changes).

### Capability L: Full-Trace Evidence & `test_run_id` Correlation
* **Objective:** Establish forensic traceability for every AI agent transaction using `test_run_id` as the unifying key.
* **Requirements:**
  1. **First-Class Schema Support:** Add `test_run_id` as an indexed column across all telemetry and audit tables.
  2. **Unified Forensic Trace:** Correlate:
     `test_run_id` ↔ `agent_id` ↔ `session_id` ↔ `prompt_hash` ↔ `tool_call_id` ↔ `detection_alert_id` ↔ `incident_id`.
  3. **Reproducible Security Report:** Generate exportable PDF/JSON evidence bundles proving security posture and test pass/fail status for any `test_run_id`.

---

## 3. Database Schema Requirements (PostgreSQL & ClickHouse)

To support this architecture natively, the following data models are required:

### PostgreSQL Relational Models (Metadata, Posture, and Policies)

```python
# 1. AI Agent Registry
class AiAgent(Base):
    __tablename__ = "ai_agents"
    Id = Column(Integer, primary_key=True, autoincrement=True)
    AgentUuid = Column(String(64), unique=True, index=True, nullable=False)
    TenantId = Column(Integer, ForeignKey("tenants.Id"), nullable=False, index=True)
    Name = Column(String(128), nullable=False)
    Description = Column(Text, nullable=True)
    OwnerEmail = Column(String(255), nullable=False)
    Environment = Column(String(64), default="production") # dev, staging, production
    Status = Column(String(32), default="ACTIVE") # ACTIVE, QUARANTINED, REVOKED
    ModelBindingId = Column(Integer, ForeignKey("ai_models.Id"), nullable=True)
    SystemPromptHash = Column(String(64), nullable=True)
    MaxTokensPerSession = Column(Integer, default=50000)
    RateLimitPerMin = Column(Integer, default=30)
    RequireHitlForHighImpact = Column(Boolean, default=True)
    CreatedAt = Column(DateTime, default=datetime.utcnow)
    UpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 2. AI Model Catalog
class AiModel(Base):
    __tablename__ = "ai_models"
    Id = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(String(128), nullable=False)
    Provider = Column(String(64), nullable=False) # ollama, vllm, internal, openai_compatible
    ModelVersion = Column(String(64), nullable=False)
    EndpointUrl = Column(String(255), nullable=False)
    MaxContextWindow = Column(Integer, default=8192)
    MaxAllowedTemperature = Column(Float, default=0.7)
    IsApproved = Column(Boolean, default=True)
    RiskScore = Column(Integer, default=0) # 0-100

# 3. MCP Server Registry
class McpServer(Base):
    __tablename__ = "mcp_servers"
    Id = Column(Integer, primary_key=True, autoincrement=True)
    TenantId = Column(Integer, ForeignKey("tenants.Id"), nullable=False, index=True)
    ServerName = Column(String(128), nullable=False)
    EndpointUrl = Column(String(255), nullable=False)
    TransportType = Column(String(32), default="stdio") # stdio, sse, websocket
    AuthType = Column(String(32), default="mtls") # mtls, bearer, none
    Status = Column(String(32), default="ONLINE") # ONLINE, DEGRADED, QUARANTINED
    ToolManifestHash = Column(String(64), nullable=False) # SHA-256 of tool schema JSON
    LastVerifiedAt = Column(DateTime, default=datetime.utcnow)

# 4. MCP Tool Authorization Policy
class McpToolPolicy(Base):
    __tablename__ = "mcp_tool_policies"
    Id = Column(Integer, primary_key=True, autoincrement=True)
    TenantId = Column(Integer, ForeignKey("tenants.Id"), nullable=False, index=True)
    AgentId = Column(Integer, ForeignKey("ai_agents.Id"), nullable=False)
    McpServerId = Column(Integer, ForeignKey("mcp_servers.Id"), nullable=False)
    ToolName = Column(String(128), nullable=False)
    RiskTier = Column(String(32), default="MEDIUM") # LOW, MEDIUM, HIGH_IMPACT
    AllowedParametersJson = Column(Text, nullable=True) # JSON Schema restrictions
    IsAllowed = Column(Boolean, default=True)
    RequiresHumanApproval = Column(Boolean, default=False)

# 5. First-Class test_run_id Correlation in DetectionAlert
# (Adding TestRunId column to existing DetectionAlert model)
# DetectionAlert.TestRunId = Column(String(64), nullable=True, index=True)
```

### ClickHouse High-Volume Table (Execution Traces)

```sql
CREATE TABLE IF NOT EXISTS monitorix.ai_agent_execution_traces (
    timestamp DateTime64(3, 'UTC'),
    tenant_id UInt32,
    test_run_id String,
    agent_uuid String,
    session_id String,
    trace_stage Enum8('PROMPT_INGRESS'=1, 'MODEL_INFERENCE'=2, 'TOOL_CALL'=3, 'TOOL_RETURN'=4, 'RESPONSE_EGRESS'=5),
    prompt_sanitized_preview String,
    tool_name LowCardinality(String),
    tool_parameters_json String,
    tool_output_hash FixedString(32),
    execution_time_ms UInt32,
    risk_score UInt8,
    violation_code LowCardinality(String),
    action_taken Enum8('ALLOW'=1, 'SANITIZE'=2, 'CHALLENGE'=3, 'BLOCK'=4)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (tenant_id, test_run_id, agent_uuid, timestamp);
```

---

## 4. Detection Engine Extensions (Sigma Rule Specifications)

Monitorix preserves existing reserved rule IDs 9001–9008 and extends the system rules registry starting at **ID 9101**:

### Reserved AI Agent Security Rule IDs:
* **9101** - `AIPromptInjectionAttempt`: Direct instruction override or jailbreak pattern.
* **9102** - `AIIndirectPromptPoisoning`: Hostile prompt instructions found inside external tool input/document.
* **9103** - `AIMcpManifestTampered`: Unauthorized modification of MCP tool definition or hash mismatch.
* **9104** - `AIUnauthorizedToolExecution`: Agent invoked a tool not permitted by policy.
* **9105** - `AIHighConsequenceToolBypass`: Attempt to execute high-impact tool without HITL approval.
* **9106** - `AISensitiveCredentialExtraction`: Model prompt or tool output contains unmasked secrets/canaries.
* **9107** - `AIRuntimeRecursionAnomaly`: Excessive identical tool calls in rapid succession (loop attack).
* **9108** - `AIAgentSsrfAttempt`: Tool parameter contains forbidden metadata or internal loopback IP.

### Example Canonical Sigma Rule Specification (Rule 9101):

```yaml
title: Direct AI Prompt Injection & Instruction Override Detected
id: 9101
status: production
description: Detects adversarial jailbreak attempts, developer instruction overrides, or safety bypass patterns in AI agent prompts.
author: Monitorix Sovereign AI Defense Team
tags:
  - attack.initial_access
  - attack.t1190
  - attack.ai.prompt_injection
logsource:
  category: ai_agent_telemetry
  product: monitorix_ai_proxy
detection:
  selection:
    prompt_injection_flag: true
  condition: selection
falsepositives:
  - Security research testing with valid test_run_id exemption
level: critical
```

---

## 5. API Contracts (FastAPI Endpoints)

The following backend endpoints specify the native API surface:

### A. AI Agent Inventory & Discovery
* `GET  /api/v2/ai/agents` — List registered AI agents with status and model bindings.
* `POST /api/v2/ai/agents/register` — Register a new AI agent instance.
* `GET  /api/v2/ai/agents/{agent_uuid}` — Fetch detailed agent profile and tool policies.
* `POST /api/v2/ai/agents/{agent_uuid}/revoke` — Immediate 1-click agent session kill switch.

### B. MCP Security Gateway
* `GET  /api/v2/ai/mcp/servers` — List registered MCP servers and status.
* `POST /api/v2/ai/mcp/servers/verify-manifest` — Re-compute and verify tool SHA-256 hashes.
* `POST /api/v2/ai/mcp/proxy/tools-call` — Intercepting gateway endpoint for JSON-RPC tool calls.
* `GET  /api/v2/ai/mcp/policies` — List tool authorization rules per agent.

### C. AI Runtime Threat Detection & Tracing
* `POST /api/v2/ai/telemetry/trace` — High-speed ingestion endpoint for prompt/tool traces.
* `GET  /api/v2/ai/telemetry/runs/{test_run_id}` — Query end-to-end execution tree by `test_run_id`.
* `GET  /api/v2/ai/security-posture` — Dashboard summary metrics for AI defense.

---

## 6. Frontend Requirements (React SOC Integration)

The frontend requires two new specialized views integrated directly into the Monitorix Command Center without altering existing page routes:

1. **AI Agent Inventory & MCP Hub (`/ai/agents`)**:
   - Tab 1: **Agent Fleet Catalog** (Agent UUID, Name, Owner, Model, Active Sessions, Risk Badge).
   - Tab 2: **MCP Tool Governance** (Registered MCP Servers, Tool Signatures, Parameter Rules).
   - Tab 3: **Identity & Zero Trust** (Agent JWT expiration, service principal mappings).
   - Action Button: **"Quarantine Agent"** (Revokes token in <200ms).

2. **AI Runtime Threat & Test Verification (`/ai/runtime-detection`)**:
   - **`test_run_id` Live Trace Explorer**: Enter any `test_run_id` to view the full interactive waterfall graph (User Prompt → Proxy Scan → Model Response → MCP Tool Call → DB Output).
   - **Prompt Injection Activity Stream**: Live feed of blocked jailbreak attempts with matched signature and confidence score.
   - **Human Approval Queue Widget**: Direct integration with the existing SOAR approval queue for Tier-3 tool requests.

---

## 7. Implementation Roadmap & Milestones (Without Current Code Changes)

When approved for development, the rollout can proceed in 4 clean, non-disruptive stages:

* **Milestone 1 — Schemas & Ingestion Contracts**: Add database models (`AiAgent`, `AiModel`, `McpServer`, `McpToolPolicy`) and add `TestRunId` column to `DetectionAlert`.
* **Milestone 2 — Native MCP Security Proxy**: Build the JSON-RPC proxy in `watch-sec-python` with tool manifest hash verification and parameter schema checks.
* **Milestone 3 — Sigma Engine Extension**: Add System Detection Rules 9101–9108 to `system_rules.py` and register category `ai_agent_telemetry`.
* **Milestone 4 — Frontend SOC Views & Test Harness**: Add React UI components for `/ai/agents` and validate end-to-end trace correlation using automated tests.
