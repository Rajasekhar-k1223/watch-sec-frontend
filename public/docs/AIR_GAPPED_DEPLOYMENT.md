# Monitorix Enterprise — Air-Gapped Deployment & Operations Architecture

## 1. Principles of Sovereign Air-Gapped Operation

In high-assurance security environments (defense networks, SCADA/ICS enclaves, air-gapped financial cores), systems must operate with **absolute zero network connectivity** to the public Internet or unauthorized external networks.

Monitorix Enterprise provides a **100% Sovereign Air-Gapped Model**:
1. **Zero Outbound Telemetry:** Core security engines, detection algorithms, and dashboards operate without external beaconing.
2. **Local Cryptographic License Verification:** Offline verification using asymmetric Ed25519 digital signatures. No license server call-home or activation phone-home.
3. **Self-Contained Container Runtimes:** All runtime dependencies, third-party libraries, databases, and frontends are pre-compiled and packaged inside self-sufficient OCI image archives.
4. **Air-Gapped Threat Intel Synchronization:** Detection rules (Sigma), malware signatures (YARA), and threat indicators are updated via offline signed differential bundles.

```
       UNCLASSIFIED / INTERNET                    SECURE AIR-GAPPED ZONE
  +-------------------------------+         +--------------------------------+
  |  Vendor Secure Portal         |         |  Monitorix Sovereign Cluster   |
  |  - Release Bundle (tar.gz)    |         |                                |
  |  - SHA256SUMS.txt             |         |  +--------------------------+  |
  |  - SHA256SUMS.sig (Ed25519)   |         |  | Production Microservices |  |
  +---------------+---------------+         |  | (Compiled & Hardened)    |  |
                  |                         |  +------------+-------------+  |
                  v                         |               ^                |
  +-------------------------------+         |               |                |
  | Physical Diode / Secure Media |-------->|  +------------+-------------+  |
  | Transfer (USB / Optical Disc) |         |  | Offline Storage & DBs    |  |
  +-------------------------------+         |  +--------------------------+  |
                                            +--------------------------------+
```

---

## 2. Secure Transfer & Chain-of-Custody

### 2.1 Artifact Preparation (Connected Workstation)
From an authorized vendor workstation or download bastion:
```bash
# 1. Download Customer Release Bundle & Verification Manifests
curl -O https://releases.monitorix.internal/v19.1.0/monitorix-enterprise-19.1.0.tar.gz
curl -O https://releases.monitorix.internal/v19.1.0/SHA256SUMS.txt
curl -O https://releases.monitorix.internal/v19.1.0/SHA256SUMS.sig

# 2. Verify release checksum on download host
sha256sum -c SHA256SUMS.txt
```

### 2.2 Transfer to Physical Secure Media
Transfer files to an approved, encrypted, write-once (e.g., DVD-R / Blu-ray) or audited hardware-encrypted USB medium in compliance with organizational security protocols.

### 2.3 Verification Inside the Air-Gapped Enclave
Upon mounting the media on the target host:
```bash
# 1. Copy release files to target deployment directory
mkdir -p /opt/monitorix
cp /media/secure-transfer/monitorix-enterprise-19.1.0.tar.gz /opt/monitorix/
cd /opt/monitorix

# 2. Extract bundle
tar -xzf monitorix-enterprise-19.1.0.tar.gz
cd monitorix-enterprise-19.1.0

# 3. Verify cryptographic integrity before any execution
sha256sum -c checksums/SHA256SUMS.txt
```

---

## 3. Sovereign Offline License Architecture

### 3.1 Asymmetric Ed25519 Offline Validation
* **Vendor Signing Key:** Resides in vendor Hardware Security Modules (HSM). Never exported, never bundled.
* **Customer Verification Key:** Embedded directly into the compiled Monitorix binary (`license_service.so`):
  `4f0aea519bb1e5c72ee95032033bb9e430bed55d4c4f9741c5994c2c365ddbb2`
* **Tamper-Evident Payload:** Contains authorized endpoint quotas, enabled capability modules, deployment UUID, and expiration timestamp.
* **Zero Cloud Connection:** Verification takes < 2ms locally using elliptic curve cryptography.

### 3.2 License Replacement & Renewal Workflow
When renewing or upgrading endpoint capacity in an air-gapped enclave:
```bash
# 1. Obtain signed 'customer-license.json' from vendor via secure transfer
# 2. Replace license file in production bundle
cp /media/secure-transfer/customer-license.json /opt/monitorix/monitorix-enterprise-19.1.0/license/

# 3. Reload license dynamically without cluster restart
docker exec monitorix-backend python3 -c "from app.services.license_service import reload_active_license; reload_active_license()"
```

---

## 4. Air-Gapped Update & Patch Management

Never perform in-place updates without a strict pre-flight backup and verified rollback plan.

```
+-----------------------------------------------------------------------------+
|                          AIR-GAPPED UPDATE WORKFLOW                         |
+-----------------------------------------------------------------------------+
|                                                                             |
|  1. Transfer Signed Update Bundle (monitorix-update-19.1.x.tar.gz)          |
|                                                                             |
|  2. Execute Pre-Update Snapshot:                                            |
|     ./scripts/backup.sh /var/backups/pre-update-$(date +%Y%m%d)             |
|                                                                             |
|  3. Load New Production Images:                                             |
|     docker load -i images/monitorix-backend.tar.gz                          |
|     docker load -i images/monitorix-web.tar.gz                              |
|                                                                             |
|  4. Apply Database Migrations (if applicable):                              |
|     docker exec monitorix-backend alembic upgrade head                      |
|                                                                             |
|  5. Restart Microservices Stack:                                            |
|     docker compose -f config/docker-compose.enterprise.yml up -d            |
|                                                                             |
|  6. Run Health Diagnostic Probes:                                           |
|     ./scripts/health-check.sh                                               |
|                                                                             |
|  7. Automated Decision:                                                     |
|     [SUCCESS] -> Commit update, record new manifest in BUILD_MANIFEST.json  |
|     [FAILURE] -> Execute ./scripts/rollback.sh (Restore DB & prior images)  |
|                                                                             |
+-----------------------------------------------------------------------------+
```

---

## 5. Offline Threat Intelligence & Sigma/YARA Ruleset Ingestion

In an air-gapped SOC, live external threat feeds (AlienVault, MISP, AbuseIPDB) cannot be reached over the Internet. Monitorix provides an **Offline Feed Ingestion Bridge**:

### 5.1 Feeding Offline Threat Bundles
Vendors provide monthly or bi-weekly `threat-intel-bundle-YYYYMMDD.tar.gz` packages containing:
* Pre-compiled Sigma detection rules
* High-confidence YARA file scanning signatures
* Curated IoC tables (malicious hashes, IP/domain indicators)
* MITRE ATT&CK enterprise technique mapping updates

### 5.2 Importing into Running Cluster
```bash
# 1. Copy bundle to cluster host
cp /media/secure-transfer/threat-intel-bundle-20261029.tar.gz /opt/monitorix/storage/vault/

# 2. Trigger hot reload via Admin CLI or Web Console
docker exec monitorix-backend python3 -m app.services.threat_feed_service \
    --import-bundle /app/storage/threat-intel-bundle-20261029.tar.gz
```
The detection engine immediately begins evaluating incoming telemetry against the updated rule definitions without requiring a service restart.
