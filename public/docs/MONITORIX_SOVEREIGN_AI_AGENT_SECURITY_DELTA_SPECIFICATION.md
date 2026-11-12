# MONITORIX ENTERPRISE — SOVEREIGN AI AGENT SECURITY
## Capability Delta Analysis, Code Diff Blueprint & Implementation Requirements
**Document Ref:** `MTX-AI-SEC-DIFF-2026-V1` | **Classification:** Enterprise Engineering Blueprint  
**Architecture:** 100% Native & Sovereign Monitorix (Zero External Cloud Dependencies — No Azure Foundry, No Wiz, No Sentinel Required)  
**Target Correlation Key:** `test_run_id`  

---

### Executive Deliverables & Navigation
* **Master Delta Specification PDF:** [MONITORIX_SOVEREIGN_AI_AGENT_SECURITY_DELTA_SPECIFICATION.pdf](file:///opt/projects/monitorix/docs/MONITORIX_SOVEREIGN_AI_AGENT_SECURITY_DELTA_SPECIFICATION.pdf)
* **Master Delta Specification Word Document:** [MONITORIX_SOVEREIGN_AI_AGENT_SECURITY_DELTA_SPECIFICATION.docx](file:///opt/projects/monitorix/docs/MONITORIX_SOVEREIGN_AI_AGENT_SECURITY_DELTA_SPECIFICATION.docx)
* **Master Requirements Document:** [MONITORIX_SOVEREIGN_AI_AGENT_SECURITY_REQUIREMENTS.md](file:///opt/projects/monitorix/docs/MONITORIX_SOVEREIGN_AI_AGENT_SECURITY_REQUIREMENTS.md)
* **Pre-Audit Report:** [MONITORIX_AI_AGENT_SECURITY_IMPLEMENTATION_AUDIT.md](file:///opt/projects/monitorix/docs/MONITORIX_AI_AGENT_SECURITY_IMPLEMENTATION_AUDIT.md)

---

## 1. Executive Summary & Architecture Scope

This document provides the definitive **Gap Analysis (Delta)** and exact **Code Diff Blueprint** required to implement enterprise-grade **AI Agent Security** natively inside Monitorix Enterprise.

Per customer architectural requirements:
1. **Zero External Cloud Integrations**: Eliminate reliance on Microsoft Azure AI Foundry, Wiz, or Microsoft Sentinel / Azure Log Analytics. All AI agent discovery, MCP security, runtime behavioral detection, and audit pipelines execute within Monitorix's sovereign multi-tenant architecture.
2. **Unified Trace Correlation Key (`test_run_id`)**: Elevate `test_run_id` from a synthetic test string into a first-class, indexed schema attribute across PostgreSQL, ClickHouse, Kafka event streams, and REST API contracts.
3. **Safety & Zero-Downtime Guarantee**: All schema modifications are additive and backward-compatible. Existing system detection rules (9001–9008) are preserved without modification, and new AI security rules begin cleanly at **Rule ID 9101**.

---

## 2. Capability Delta Matrix (Current State vs. Required Implementation)

| Capability | Current Monitorix State (As-Is) | Required Implementation (To-Be Delta) | Delta Status |
| :--- | :--- | :--- | :---: |
| **1. AI Agent Inventory** | `Agent` model in `models.py` tracks OS endpoint fleet nodes (Windows/Linux host sensors). | Add `AiAgent` model with `AgentUuid`, `ModelBindingId`, `OwnerEmail`, `Status`, `RateLimitPerMin`, and approved tools. Add discovery API `/api/v2/ai/agents`. | **NEW COMPONENT** |
| **2. Model Security Posture** | Hardcoded/env-configured LLM client in `ai_service.py`. No model governance. | Add `AiModel` model to register local (Ollama/vLLM) and private models with max temperature, context window, and risk score. | **NEW COMPONENT** |
| **3. Prompt Injection Defense** | Basic regex checking (`PROMPT_INJECTION_PATTERNS`) in `autonomous_security_service.py`. Disconnected from Sigma. | Introduce 3-tier defense: Fast regex + delimiter hardening + embedding similarity classifier. Author Sigma Rule 9101 & 9102. | **MAJOR EXTENSION** |
| **4. MCP (Model Context Protocol) Security** | Completely absent (0% in codebase). | Build `McpSecurityGateway` service. Parse JSON-RPC 2.0 tool calls. Verify SHA-256 tool manifest signatures. | **NEW COMPONENT** |
| **5. Tool Authorization & HITL** | Internal SOAR containment allowlist (`DEFAULT_ALLOWED_ACTIONS`) in `autonomous_security_service.py`. | Add `McpToolPolicy` table. Enforce parameter validation and route Tier-3 destructive tools into `SoarApprovalQueue`. | **MAJOR EXTENSION** |
| **6. Agent Identity & Zero Trust** | ITDR tracks Active Directory and Entra ID human/service accounts. | Issue 15-minute asymmetric JWT session tokens bound to `agent_uuid`. Restrict agent tool tokens to least privilege. | **EXTENSION** |
| **7. Secret & Sensitive Data Protection** | Shannon entropy in `secrets_security_service.py` and Luhn PAN masking in `shadow_monitor.rs`. | Extend DLP filters to bidirectional AI agent proxy: scan incoming prompts and outgoing tool returns for leaked credentials. | **EXTENSION** |
| **8. Network & SSRF Security** | WAAP checks `169.254.169.254` and NDR checks C2 beaconing. | Restrict AI agent and tool network sandboxes. Enforce explicit domain allowlists and block internal loopback/private subnets. | **EXTENSION** |
| **9. AI Runtime Anomaly Detection** | Rate limiting and circuit breaker in `autonomous_security_service.py`. | Add recursion/infinite loop detection (>5 identical tool invocations in 60s) and token surge alerts. Sigma Rule 9107. | **EXTENSION** |
| **10. AI Attack Path Analysis** | `IdentityAttackPathNode` and `CnappAttackPath` model AD and cloud infrastructure. | Model graph edges: `User Prompt` → `AI Agent` → `Model` → `MCP Tool` → `Target Database / Asset`. | **EXTENSION** |
| **11. Security Response & Containment** | `SoarEngine` executes automated host isolation and process termination. | Add 1-click agent session revocation switch and instant MCP tool quarantine action without container restarts. | **EXTENSION** |
| **12. Evidence & Reporting (`test_run_id`)** | `test_run_id` only exists as an ad-hoc test string in `test_live_kafka_detection.py`. | Add `TestRunId` indexed column to `DetectionAlert` and create ClickHouse table `ai_agent_execution_traces`. | **DATABASE & API DELTA** |

---

## 3. Exact Code & Architecture Diff Blueprint

The following diffs represent the exact code additions required to achieve 100% sovereign AI Agent Security:

### Diff 1: Database Models (`backend/app/db/models.py`)

```python
--- a/watch-sec-python/backend/app/db/models.py
+++ b/watch-sec-python/backend/app/db/models.py
@@ -753,6 +753,7 @@ class DetectionAlert(Base):
     Severity = Column(String(32), default="Low")
     MitreTactic = Column(String(64), nullable=True)
     MitreTechnique = Column(String(64), nullable=True)
+    TestRunId = Column(String(64), nullable=True, index=True)
     MatchedContent = Column(Text, nullable=True)
     RawEventJson = Column(Text, nullable=True)
     CreatedAt = Column(DateTime, default=datetime.utcnow)
@@ -3371,0 +3372,65 @@
+# ===========================================================================
+# [v19.2.0] SOVEREIGN AI AGENT SECURITY & MCP GOVERNANCE MODELS
+# ===========================================================================
+
+class AiModel(Base):
+    __tablename__ = "ai_models"
+    Id = Column(Integer, primary_key=True, autoincrement=True)
+    Name = Column(String(128), nullable=False)
+    Provider = Column(String(64), nullable=False) # ollama, vllm, internal, openai_compatible
+    ModelVersion = Column(String(64), nullable=False)
+    EndpointUrl = Column(String(255), nullable=False)
+    MaxContextWindow = Column(Integer, default=8192)
+    MaxAllowedTemperature = Column(Float, default=0.7)
+    IsApproved = Column(Boolean, default=True)
+    RiskScore = Column(Integer, default=0)
+    CreatedAt = Column(DateTime, default=datetime.utcnow)
+
+class AiAgent(Base):
+    __tablename__ = "ai_agents"
+    Id = Column(Integer, primary_key=True, autoincrement=True)
+    AgentUuid = Column(String(64), unique=True, index=True, nullable=False)
+    TenantId = Column(Integer, ForeignKey("tenants.Id"), nullable=False, index=True)
+    Name = Column(String(128), nullable=False)
+    Description = Column(Text, nullable=True)
+    OwnerEmail = Column(String(255), nullable=False)
+    Environment = Column(String(64), default="production") # dev, staging, production
+    Status = Column(String(32), default="ACTIVE") # ACTIVE, QUARANTINED, REVOKED
+    ModelBindingId = Column(Integer, ForeignKey("ai_models.Id"), nullable=True)
+    SystemPromptHash = Column(String(64), nullable=True)
+    RateLimitPerMin = Column(Integer, default=30)
+    RequireHitlForHighImpact = Column(Boolean, default=True)
+    CreatedAt = Column(DateTime, default=datetime.utcnow)
+    UpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
+
+class McpServer(Base):
+    __tablename__ = "mcp_servers"
+    Id = Column(Integer, primary_key=True, autoincrement=True)
+    TenantId = Column(Integer, ForeignKey("tenants.Id"), nullable=False, index=True)
+    ServerName = Column(String(128), nullable=False)
+    EndpointUrl = Column(String(255), nullable=False)
+    TransportType = Column(String(32), default="stdio") # stdio, sse, websocket
+    AuthType = Column(String(32), default="mtls") # mtls, bearer, none
+    Status = Column(String(32), default="ONLINE") # ONLINE, DEGRADED, QUARANTINED
+    ToolManifestHash = Column(String(64), nullable=False) # SHA-256 of tool schema JSON
+    LastVerifiedAt = Column(DateTime, default=datetime.utcnow)
+    CreatedAt = Column(DateTime, default=datetime.utcnow)
+
+class McpToolPolicy(Base):
+    __tablename__ = "mcp_tool_policies"
+    Id = Column(Integer, primary_key=True, autoincrement=True)
+    TenantId = Column(Integer, ForeignKey("tenants.Id"), nullable=False, index=True)
+    AgentId = Column(Integer, ForeignKey("ai_agents.Id"), nullable=False, index=True)
+    McpServerId = Column(Integer, ForeignKey("mcp_servers.Id"), nullable=False)
+    ToolName = Column(String(128), nullable=False)
+    RiskTier = Column(String(32), default="MEDIUM") # LOW, MEDIUM, HIGH_IMPACT
+    AllowedParametersJson = Column(Text, nullable=True) # JSON Schema restrictions
+    IsAllowed = Column(Boolean, default=True)
+    RequiresHumanApproval = Column(Boolean, default=False)
+    CreatedAt = Column(DateTime, default=datetime.utcnow)
```

---

### Diff 2: Reserved System Detection Rules (`backend/app/services/detection/system_rules.py`)

Preserving rules 9001–9008 and idempotently adding rules 9101–9108:

```python
--- a/watch-sec-python/backend/app/services/detection/system_rules.py
+++ b/watch-sec-python/backend/app/services/detection/system_rules.py
@@ -26,3 +26,6 @@
-RESERVED_SYSTEM_RULE_IDS = {9001, 9002, 9003, 9004, 9005, 9006, 9007, 9008}
+RESERVED_SYSTEM_RULE_IDS = {
+    9001, 9002, 9003, 9004, 9005, 9006, 9007, 9008,
+    9101, 9102, 9103, 9104, 9105, 9106, 9107, 9108
+}
```

Canonical System Rule Definitions for AI Agent Security:
* **Rule 9101**: `AIPromptInjectionAttempt` (Initial Access - T1190)
* **Rule 9102**: `AIIndirectPromptPoisoning` (Execution - T1059)
* **Rule 9103**: `AIMcpManifestTampered` (Persistence - T1554)
* **Rule 9104**: `AIUnauthorizedToolExecution` (Privilege Escalation - T1068)
* **Rule 9105**: `AIHighConsequenceToolBypass` (Defense Evasion - T1562)
* **Rule 9106**: `AISensitiveCredentialExtraction` (Credential Access - T1552)
* **Rule 9107**: `AIRuntimeRecursionAnomaly` (Impact - T1499)
* **Rule 9108**: `AIAgentSsrfAttempt` (Lateral Movement - T1557)

---

### Diff 3: Sigma Compiler Category Registration (`backend/app/services/detection/sigma_compiler.py`)

```python
--- a/watch-sec-python/backend/app/services/detection/sigma_compiler.py
+++ b/watch-sec-python/backend/app/services/detection/sigma_compiler.py
@@ -140,6 +140,7 @@ SUPPORTED_LOGSOURCE_CATEGORIES = {
     "firewall_status",
     "file_modification",
     "dlp_event",
+    "ai_agent_telemetry"
 }
```

---

### Diff 4: Native MCP Security Gateway (`backend/app/services/mcp_security_gateway.py` - NEW)

```python
class McpSecurityGateway:
    FORBIDDEN_SUBNETS = [
        ipaddress.ip_network("127.0.0.0/8"),
        ipaddress.ip_network("10.0.0.0/8"),
        ipaddress.ip_network("172.16.0.0/12"),
        ipaddress.ip_network("192.168.0.0/16"),
        ipaddress.ip_network("169.254.169.254/32") # Cloud Metadata
    ]

    @classmethod
    def verify_manifest_hash(cls, tools_schema_json: str, expected_hash: str) -> bool:
        computed = hashlib.sha256(tools_schema_json.encode("utf-8")).hexdigest()
        return computed == expected_hash

    @classmethod
    def check_ssrf_destination(cls, target_url_or_ip: str) -> bool:
        match = re.search(r"https?://([^/:]+)", target_url_or_ip)
        host = match.group(1) if match else target_url_or_ip
        if host in ["localhost", "127.0.0.1", "169.254.169.254"]:
            return True
        try:
            ip = ipaddress.ip_address(host)
            return any(ip in subnet for subnet in cls.FORBIDDEN_SUBNETS)
        except ValueError:
            return False

    @classmethod
    def validate_tool_execution(
        cls, policy: McpToolPolicy, tool_args: Dict[str, Any]
    ) -> Tuple[bool, str]:
        if not policy.IsAllowed:
            return False, "Tool execution forbidden by tenant security policy."
        args_str = json.dumps(tool_args).lower()
        dangerous_patterns = [r"drop\s+table", r"delete\s+from", r"rm\s+-rf", r"format\s+[c-z]:"]
        for pat in dangerous_patterns:
            if re.search(pat, args_str):
                return False, f"Dangerous command parameter detected: {pat}"
        return True, "Authorized"
```

---

### Diff 5: ClickHouse Columnar Execution Traces (`storage/clickhouse/005_ai_traces.sql`)

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

## 4. Step-by-Step Implementation Checklist & Safety Invariants

```
[ ] Step 1: Execute PostgreSQL schema migration for ai_models, ai_agents, mcp_servers, mcp_tool_policies.
[ ] Step 2: Add TestRunId column to DetectionAlert table in PostgreSQL.
[ ] Step 3: Execute ClickHouse migration for ai_agent_execution_traces table.
[ ] Step 4: Register Category 'ai_agent_telemetry' in sigma_compiler.py.
[ ] Step 5: Append System Detection Rules 9101–9108 to system_rules.py.
[ ] Step 6: Deploy McpSecurityGateway service in backend/app/services/.
[ ] Step 7: Mount FastAPI router at /api/v2/ai/agents and /api/v2/ai/mcp/.
[ ] Step 8: Mount React SOC UI page /ai/agents in frontend router.
[ ] Step 9: Execute automated test suite tests/test_ai_agent_security_mcp_e2e.py.
```

### Safety & Operational Invariants:
* **Zero Container Restarts**: No Docker daemon restarts required; FastAPI microservice hot-reloads cleanly.
* **Preserve 9001–9008**: System infrastructure detection rules remain 100% untouched.
* **Multi-Tenant Isolation**: Every AI Agent and MCP Policy requires explicit `TenantId` foreign key checks.
* **Strict Correlation**: Every execution trace must carry `test_run_id` end-to-end.
