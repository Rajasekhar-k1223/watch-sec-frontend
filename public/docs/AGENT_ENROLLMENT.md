# Monitorix Sovereign Enterprise — Agent Enrollment & Ephemeral Token Lifecycle

## 1. Enrollment Overview

Monitorix supports zero-trust endpoint agent provisioning across Windows, Linux, and macOS endpoints. To prevent credential leakage and control quota allocation, agents authenticate using **Dynamic Ephemeral Enrollment Tokens**.

Unlike static API keys that present severe security risks if intercepted, Monitorix ephemeral tokens feature:
1. **Configurable Time-To-Live (TTL)**: Tokens expire automatically after a defined window (e.g., 24 hours, 72 hours).
2. **Usage Counter Constraints**: Single-use tokens for sensitive systems; multi-use batch tokens for automated fleet rollouts (SCCM, Jamf, Ansible, Group Policy).
3. **Instant SecOps Revocation**: SecOps administrators can instantly invalidate active enrollment tokens from the SOC console without rotating the tenant's primary credentials.
4. **Authoritative Hard Quota Rejection**: Dynamic verification ensures enrollment attempts beyond the licensed endpoint quota are authoritatively rejected (`ENDPOINT_LIMIT_EXCEEDED`).

---

## 2. Enrollment Token Lifecycle

```
[ SecOps Administrator ]
           │
           │ Generates Ephemeral Token via SOC API
           ▼
┌─────────────────────────────────────────────────────────────┐
│                 AgentEnrollmentToken                        │
│  • Token:        enr_a8f9c2e17b3d4f5890ab12cd...            │
│  • Max Uses:     500 (Batch Rollout)                        │
│  • Uses Count:   0                                          │
│  • TTL:          48 Hours                                   │
│  • Status:       ACTIVE                                     │
└─────────────────────────────────────────────────────────────┘
           │
           │ Distributed via Enterprise Deployment Tool (Ansible / GPO)
           ▼
[ Endpoint Agent (monitorix-agent) ]
           │
           │ Handshake Request: POST /api/agent/register
           ▼
┌─────────────────────────────────────────────────────────────┐
│                  AGENT REGISTRATION GATEWAY                 │
│                                                             │
│  1. Check Token Exists & Is Not Revoked                     │
│  2. Verify Expiration: ExpiresAt > datetime.utcnow()        │
│  3. Check Usage: UsesCount < MaxUses                        │
│  4. Authoritative Entitlement Check: ActiveCount < Limit    │
│                                                             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │     QUOTA EXCEEDED    │       │     QUOTA PERMITTED   │  │
│  │ 403 Forbidden         │       │ 200 OK                │  │
│  │ ENDPOINT_LIMIT_EXC... │       │ Return: MachineSecret │  │
│  └───────────────────────┘       └───────────┬───────────┘  │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                                               ▼
                         [ Agent Stores MachineSecret Securely ]
                         (Subsequent Heartbeats use HMAC-SHA256)
```

---

## 3. Managing Enrollment Tokens via API

### Generate a Single-Use Token (Manual Workstation Provisioning)
```bash
curl -X POST https://<monitorix-host>:8085/api/v2/tokens/enrollment \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": 1,
    "deployment_id": "dep-acme-onprem-01",
    "max_uses": 1,
    "ttl_hours": 4
  }'
```

Response:
```json
{
  "token": "enr_3b91a7c04e2f8910d5e128b9410ac",
  "tenant_id": 1,
  "deployment_id": "dep-acme-onprem-01",
  "max_uses": 1,
  "uses_count": 0,
  "expires_at": "2026-10-30T16:00:00Z",
  "is_revoked": false,
  "created_at": "2026-10-29T12:00:00Z"
}
```

### Generate a Fleet Batch Token (Mass Rollout via GPO / Ansible)
```bash
curl -X POST https://<monitorix-host>:8085/api/v2/tokens/enrollment \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": 1,
    "deployment_id": "dep-acme-onprem-01",
    "max_uses": 2500,
    "ttl_hours": 72
  }'
```

### Revoke an Enrollment Token (Emergency Threat Isolation)
```bash
curl -X POST https://<monitorix-host>:8085/api/v2/tokens/enrollment/revoke \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "enr_3b91a7c04e2f8910d5e128b9410ac",
    "reason": "Administrative revocation due to unapproved script distribution"
  }'
```

---

## 4. Agent Installation Commands

### Linux Agent Installation (Debian / Ubuntu / RHEL / Rocky)
```bash
# Silent unattended installation with ephemeral token
sudo /opt/monitorix/agents/monitorix-agent-linux \
  --server https://monitorix.corp:8005 \
  --token enr_3b91a7c04e2f8910d5e128b9410ac \
  --install
```

### Windows Agent Installation (MSI / EXE Silent Deployment)
```powershell
# Unattended PowerShell execution (GPO or SCCM)
msiexec.exe /i "C:\Staging\MonitorixAgent.msi" /qn `
  SERVER_URL="https://monitorix.corp:8005" `
  ENROLLMENT_TOKEN="enr_3b91a7c04e2f8910d5e128b9410ac" `
  AUTO_START=1
```

### macOS Agent Installation (Terminal / Jamf Pro)
```bash
sudo /Library/Application\ Support/Monitorix/monitorix-agent \
  --server https://monitorix.corp:8005 \
  --token enr_3b91a7c04e2f8910d5e128b9410ac \
  --install
```

---

## 5. Mutual Authentication & Heartbeat Protocol

Following initial enrollment:
1. The agent exchanges the ephemeral token for a unique 256-bit cryptographically random `MachineSecret`.
2. The ephemeral token use counter is incremented or consumed.
3. Every subsequent heartbeat and telemetry burst is signed with an HMAC-SHA256 signature calculated from the agent's unique `MachineSecret`:
   ```
   Signature = HMAC-SHA256(SecretKey = SHA256(MachineSecret), Message = PayloadBody + "|" + Timestamp)
   ```
4. The gateway verifies the signature. If a machine's secret does not match or a replay attack is detected, the request is rejected with `403 Forbidden`.
