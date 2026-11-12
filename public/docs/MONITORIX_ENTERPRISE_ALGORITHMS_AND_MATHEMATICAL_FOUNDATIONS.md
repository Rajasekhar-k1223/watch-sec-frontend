# MONITORIX ENTERPRISE CYBER DEFENSE PLATFORM
## Complete Algorithms Catalog, Mathematical Foundations & Implementation Reference

**Document Ref:** `MTX-ALGO-CATALOG-2026-V1` | **Classification:** Enterprise Engineering Reference  
**Platform:** Monitorix Enterprise (Rust Ring-0 Sensors, Python Core, ClickHouse, and Kafka)  
**Scope:** Exhaustive catalog of all mathematical, information-theoretic, graph, cryptographic, and machine learning algorithms  

---

### Executive Deliverables & Navigation
* **Master Word Document:** [MONITORIX_ENTERPRISE_ALGORITHMS_AND_MATHEMATICAL_FOUNDATIONS.docx](file:///opt/projects/monitorix/docs/MONITORIX_ENTERPRISE_ALGORITHMS_AND_MATHEMATICAL_FOUNDATIONS.docx)
* **Master PDF Publication:** [MONITORIX_ENTERPRISE_ALGORITHMS_AND_MATHEMATICAL_FOUNDATIONS.pdf](file:///opt/projects/monitorix/docs/MONITORIX_ENTERPRISE_ALGORITHMS_AND_MATHEMATICAL_FOUNDATIONS.pdf)
* **Sentinel Replacement & Configuration Runbook:** [MONITORIX_VS_MICROSOFT_SENTINEL_REPLACEMENT_AND_CONFIGURATION_GUIDE.docx](file:///opt/projects/monitorix/docs/MONITORIX_VS_MICROSOFT_SENTINEL_REPLACEMENT_AND_CONFIGURATION_GUIDE.docx)

---

## 1. Executive Summary & Algorithmic Architecture

Monitorix Enterprise relies on a diverse set of production algorithms implemented across its **Rust Ring-0 kernel drivers, Python backend microservices, ClickHouse columnar SIEM lake, and React SOC interfaces**.

These algorithms provide high-throughput threat detection, cryptographic anti-tamper verification, information-theoretic credential scanning, real-time credit card masking, and sub-second automated containment:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MONITORIX PRODUCTION ALGORITHM MESH                             │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ Information Theory & ML  │  Graph & Tree Automation │ Cryptography & Network Radar     │
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
│ • Shannon Entropy (H(X)) │ • Recursive-Descent AST  │ • Low-Jitter Periodicity (Δt, J) │
│ • Luhn Mod 10 Checksum   │ • Graph Shortest-Path    │ • HMAC-SHA256 Challenge-Response │
│ • Cosine Vector Distance │ • Topological Sort (DAG) │ • Sliding-Window Token Bucket    │
│ • Haversine Distance     │ • Multi-Event Correlation│ • Exponential IOC Decay          │
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

---

## 2. Exhaustive Algorithms Catalog & Deep-Dive Reference

---

### Algorithm 1: Shannon Information Entropy Calculation
* **Mathematical Formula:**
  $$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
  *Where $P(x_i)$ is the probability of character $x_i$ appearing in string $X$.*
* **Repository Implementation:**
  * File: [`watch-sec-python/backend/app/services/secrets_security_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/secrets_security_service.py#L36-L48) (`calculate_shannon_entropy`)
  * File: [`watch-sec-python/backend/app/services/ndr_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/ndr_service.py#L528-L537)
* **Operational Purpose:**
  1. **Secrets & Credential Exposure Detection:** Distinguishes natural language text ($H < 3.2$) from randomized, high-entropy secrets ($H > 4.2$) such as AWS Access Keys, private RSA keys, and Slack tokens.
  2. **DNS Exfiltration & DGA Interception:** Calculates the entropy of incoming DNS query labels. Domain labels with $H > 4.4$ or lengths $> 65$ characters indicate encoded exfiltration channels or malware Domain Generation Algorithms.

---

### Algorithm 2: Luhn Checksum Algorithm (MOD 10)
* **Mathematical Formula:**
  $$\left( \sum_{i=1}^{k} d_i \right) \pmod{10} \equiv 0$$
  *Where digits in even positions (from right to left) are doubled, and if greater than 9, their digits are summed.*
* **Repository Implementation:**
  * File: [`watch-sec-rust/src/modules/shadow_monitor.rs`](file:///opt/projects/monitorix/watch-sec-rust/src/modules/shadow_monitor.rs) (Rust Ring-0 kernel agent)
  * File: [`watch-sec-python/backend/app/services/dlp_engine.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/dlp_engine.py)
* **Operational Purpose:**
  * **PCI-DSS 3.4 Cardholder Data Protection:** Validates credit card Primary Account Numbers (Visa, MasterCard, Amex) in real time before screen capture or memory dump. Matches trigger instant masking (`••••-••••-••••-1234`) or screen blackout.

---

### Algorithm 3: Recursive-Descent Abstract Syntax Tree (AST) Compiler
* **Mathematical Structure:**
  Context-Free Grammar (CFG) evaluating Boolean propositions:
  $$E \to T \lor E \mid T$$
  $$T \to F \land T \mid F$$
  $$F \to \neg F \mid (E) \mid \text{Matcher}(field, op, val)$$
* **Repository Implementation:**
  * File: [`watch-sec-python/backend/app/services/detection/sigma_compiler.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/detection/sigma_compiler.py#L11-L400)
* **Operational Purpose:**
  * **Streaming Sigma Detection:** Compiles complex nested Boolean conditions (e.g., `(selection1 and selection2) or not 1 of filter_*`) into executable Python lambda AST nodes (`ExistsMatcher`, `StringMatcher`, `ContainsAllMatcher`, `CIDRMatcher`, `RegexMatcher`), evaluating Kafka streaming events in $<2\text{ms}$.

---

### Algorithm 4: Sliding Time-Window Event Correlation & Kill-Chain Progression
* **Mathematical Model:**
  Given a set of events $E = \{e_1, e_2, \dots, e_m\}$ within time window $T = [t_0, t_0 + \Delta t]$ (where $\Delta t = 2\text{ hours}$):
  $$\text{KillChain}(E) = \bigwedge_{k \in \text{Tactics}} (\exists e_i \in E \mid \text{Tactic}(e_i) = k)$$
* **Repository Implementation:**
  * File: [`watch-sec-python/backend/app/services/correlation_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/correlation_service.py)
  * File: [`watch-sec-python/backend/app/services/detection/streaming_detector.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/detection/streaming_detector.py)
* **Operational Purpose:**
  * Correlates individual low-severity alerts across time into high-confidence multi-stage attack chains mapped to MITRE ATT&CK tactics (Initial Access $\rightarrow$ Execution $\rightarrow$ Privilege Escalation $\rightarrow$ C2). Handles alert deduplication to prevent alert storms.

---

### Algorithm 5: Directed Graph Multi-Hop Attack Path Traversal (BFS / Dijkstra)
* **Mathematical Model:**
  Given a directed graph $G = (V, E)$ where vertices $V$ represent accounts, hosts, and tokens, and directed edges $E$ represent privilege escalation or network paths:
  $$\text{dist}(u, v) = \min_{p \in P(u,v)} \sum_{e \in p} w(e)$$
* **Repository Implementation:**
  * File: [`watch-sec-python/backend/app/services/itdr_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/itdr_service.py#L196-L540) (`IdentityAttackPathNode`)
  * File: [`watch-sec-python/backend/app/services/cnapp_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/cnapp_service.py) (`CnappAttackPath`)
* **Operational Purpose:**
  * Uncovers the shortest, least-resistance path an attacker can take from an initial compromised workstation to Tier-0 Active Directory Domain Controllers or Cloud Root IAM roles.

---

### Algorithm 6: Low-Jitter Periodicity & Inter-Arrival Time Variance Analysis
* **Mathematical Formula:**
  Given inter-arrival packet time intervals $\Delta t_i = t_{i} - t_{i-1}$, compute the coefficient of variation (jitter $J$):
  $$\mu_{\Delta t} = \frac{1}{N}\sum_{i=1}^{N} \Delta t_i, \quad \sigma_{\Delta t} = \sqrt{\frac{1}{N}\sum_{i=1}^{N} (\Delta t_i - \mu_{\Delta t})^2}, \quad J = \frac{\sigma_{\Delta t}}{\mu_{\Delta t}} \times 100\%$$
* **Repository Implementation:**
  * File: [`watch-sec-python/backend/app/services/ndr_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/ndr_service.py#L515-L525)
* **Operational Purpose:**
  * **C2 Beaconing Radar:** Automated malware beacons (Cobalt Strike, Sliver) generate outbound network connections at regular intervals (e.g. $60\text{s}$). If $J < 5\%$, the connection is flagged as automated C2 heartbeat beaconing.

---

### Algorithm 7: Topological Sort & Directed Acyclic Graph (DAG) Execution
* **Mathematical Model:**
  Linear ordering of vertices in a DAG such that for every directed edge $(u, v)$, vertex $u$ comes before $v$:
  $$\forall (u, v) \in E, \quad \text{pos}(u) < \text{pos}(v)$$
* **Repository Implementation:**
  * File: [`watch-sec-python/backend/app/services/soar_engine.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/soar_engine.py#L10-L60)
* **Operational Purpose:**
  * Orchestrates automated SOAR incident response playbooks, resolving action dependencies, evaluating conditional branches, and pausing execution for Human-in-the-Loop (HITL) approval when high-impact actions (e.g. network quarantine) are reached.

---

### Algorithm 8: HMAC-SHA256 Cryptographic Challenge-Response
* **Mathematical Formula:**
  $$\text{HMAC}(K, m) = \text{SHA256}\Big((K' \oplus \text{opad}) \mathbin{\Vert} \text{SHA256}\big((K' \oplus \text{ipad}) \mathbin{\Vert} m\big)\Big)$$
* **Repository Implementation:**
  * File: [`watch-sec-python/backend/app/services/self_defense_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/self_defense_service.py#L93-L187)
  * File: [`watch-sec-python/backend/app/services/siem_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/siem_service.py#L16-L80)
* **Operational Purpose:**
  * **Agent Anti-Tamper Protection:** Prevents adversaries from terminating or uninstalling the endpoint sensor without a cryptographically signed one-time challenge token issued by the central server.

---

### Algorithm 9: Sliding-Window Token Bucket Rate Limiting & Circuit Breaker
* **Mathematical Model:**
  Tracks action timestamps in window $W = [t - \Delta t, t]$:
  $$\text{Count}(W) = |\{t_i \in \text{Timestamps} \mid t - \Delta t \le t_i \le t\}|$$
  $$\text{If } \text{Count}(W) > \text{Limit}, \quad \text{State} \leftarrow \text{TRIPPED (Block)}$$
* **Repository Implementation:**
  * File: [`watch-sec-python/backend/app/services/autonomous_security_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/autonomous_security_service.py#L70-L100)
  * File: [`watch-sec-python/backend/app/services/waap_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/waap_service.py)
* **Operational Purpose:**
  * Prevents runaway autonomous actions and denial-of-service attempts by tripping an emergency circuit breaker if action thresholds are exceeded.

---

### Algorithm 10: Cosine Similarity & Vector Embedding Distance
* **Mathematical Formula:**
  $$\cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\|_2 \|\mathbf{B}\|_2} = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$
* **Repository Implementation:**
  * File: [`watch-sec-python/backend/app/services/ai_soc_eval_guardrails.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/ai_soc_eval_guardrails.py)
  * File: [`watch-sec-python/backend/app/services/security_research_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/security_research_service.py#L339-L345)
* **Operational Purpose:**
  * Powers semantic threat hunting, prompt injection intent classification, and AI Copilot RAG grounding evaluation.

---

### Algorithm 11: Exponential Time-Decay Scoring for Threat Intelligence IOCs
* **Mathematical Formula:**
  $$S(t) = S_0 \cdot e^{-\lambda (t - t_0)}$$
  *Where $S_0$ is initial confidence, $\lambda = \frac{\ln(2)}{t_{1/2}}$ is decay rate, and $t_{1/2}$ is half-life.*
* **Repository Implementation:**
  * File: [`watch-sec-python/backend/app/db/models.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/db/models.py#L737) (`IndicatorOfCompromise.ValidUntil`)
  * File: [`watch-sec-python/backend/app/services/threat_intel_pipeline.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/threat_intel_pipeline.py)
* **Operational Purpose:**
  * Automatically reduces the confidence score of IP and domain indicators over time to prevent false positives from recycled IP addresses.

---

### Algorithm 12: Haversine Great-Circle Distance & Velocity Analysis
* **Mathematical Formula:**
  $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
  $$v = \frac{d}{t_2 - t_1}$$
* **Repository Implementation:**
  * File: [`watch-sec-python/backend/app/services/ueba_engine.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/ueba_engine.py#L35-L65)
* **Operational Purpose:**
  * Computes geographic distance and travel velocity between consecutive logins. If calculated velocity $v > 1000\text{ km/h}$, an **Impossible Travel** anomaly alert is generated.

---

## 3. Summary Mapping Table: Algorithms vs. Code Locations

| Algorithm Name | Mathematical Type | Repository File Path | Key Functions / Classes | Primary Security Domain |
| :--- | :--- | :--- | :--- | :--- |
| **Shannon Information Entropy** | Information Theory | [`secrets_security_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/secrets_security_service.py) | `calculate_shannon_entropy` | Secrets Scanning & DSPM |
| **Luhn Checksum (MOD 10)** | Checksum Verification | [`shadow_monitor.rs`](file:///opt/projects/monitorix/watch-sec-rust/src/modules/shadow_monitor.rs) | `watch_paths`, PCI masking | Endpoint DLP & PCI-DSS 3.4 |
| **Recursive-Descent AST Compiler** | Formal Grammar Parsing | [`sigma_compiler.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/detection/sigma_compiler.py) | `SigmaCompiler`, `ASTNode` | Real-Time Sigma SIEM Detection |
| **Sliding-Window Correlation** | Temporal Correlation | [`correlation_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/correlation_service.py) | `CorrelationService` | Multi-Event MITRE Kill Chains |
| **Graph BFS / Dijkstra** | Graph Traversal | [`itdr_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/itdr_service.py) | `MonitorixITDRService` | Tier-0 Privilege Escalation Paths |
| **Periodicity & Jitter ($\Delta t, J$)** | Time-Series Variance | [`ndr_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/ndr_service.py) | `MonitorixNdrService` | NDR & C2 Beaconing Radar |
| **Topological Sort (DAG)** | Graph Scheduling | [`soar_engine.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/soar_engine.py) | `SoarEngine` | Automated SOAR Playbooks |
| **HMAC-SHA256 Challenge** | Cryptography | [`self_defense_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/self_defense_service.py) | `SelfDefenseService` | Agent Anti-Tamper & Protection |
| **Sliding Token Bucket** | Rate Limiting | [`autonomous_security_service.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/autonomous_security_service.py) | `AutonomousSecurityService` | Autonomous Defense Circuit Breaker |
| **Cosine Vector Distance** | Vector Algebra | [`ai_soc_eval_guardrails.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/ai_soc_eval_guardrails.py) | `AiSocEvalAndGuardrailsEngine`| AI Copilot & Semantic Defense |
| **Exponential Time-Decay** | Exponential Decay | [`threat_intel_pipeline.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/threat_intel_pipeline.py) | `ThreatIntelPipeline` | Threat Intelligence IOC Scoring |
| **Haversine Distance & Velocity**| Spherical Trigonometry | [`ueba_engine.py`](file:///opt/projects/monitorix/watch-sec-python/backend/app/services/ueba_engine.py) | `UebaEngine` | Impossible Travel & UEBA |
