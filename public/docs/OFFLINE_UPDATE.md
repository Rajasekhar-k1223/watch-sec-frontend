# Monitorix Sovereign Enterprise — Offline Update Packaging & Air-Gapped Ingestion

## 1. Concept & Requirements

In classified, high-assurance, or sovereign environments, servers have no access to the public internet or external container registries. Software updates, detection content, and schema upgrades must be delivered as **self-contained offline bundles**.

Monitorix provides an air-gapped update mechanism:
- Package: `monitorix-update-<version>.tar.gz`
- Contents: Container images/diffs, SQL migrations, release manifest, SBOM, release notes, and Ed25519 digital signatures.

---

## 2. Generating Offline Update Packages (Vendor / Build Infrastructure)

To generate an official offline update package:
```bash
python3 build/build_offline_update.py \
  --version "19.2.0" \
  --min-version "19.1.0" \
  --channel "LTS" \
  --output-dir "build/dist/updates"
```

### Bundle Architecture & Directory Layout

```
monitorix-update-19.2.0.tar.gz
├── manifest.json              # Release metadata, min version, components
├── release-notes.md           # Security advisories & release highlights
├── SBOM/                      # Software Bill of Materials
│   └── sbom.json              # CycloneDX 1.4 specification
├── migration/                 # Database upgrade & verification routines
│   ├── 19.2.0_upgrade.sql     # Transactional SQL DDL/DML migrations
│   └── verify_migration.sql   # Post-upgrade schema integrity probes
├── images/                    # Container image manifests & layer archives
│   └── image-manifest.json    # Target image digests and tags
├── signatures/                # Asymmetric RFC 8032 Ed25519 signatures
│   ├── manifest.sig           # Digital signature of manifest.json
│   └── checksums.sig          # Digital signature of SHA256SUMS.txt
└── checksums/
    └── SHA256SUMS.txt         # SHA-256 cryptographic digests of every file
```

---

## 3. Secure Transfer Protocol (Air-Gap Ingestion)

1. **Vendor Release Check**:
   On a connected release workstation, verify the SHA-256 digest:
   ```bash
   sha256sum monitorix-update-19.2.0.tar.gz
   ```
2. **Media Hardening & Transfer**:
   Copy the bundle to an approved transfer device (e.g., write-once optical disc or encrypted audited USB) or transmit across a unidirectional hardware data diode.
3. **Target Ingestion**:
   Mount the media on the air-gapped target host:
   ```bash
   mkdir -p /opt/monitorix/updates
   cp /media/secure/monitorix-update-19.2.0.tar.gz /opt/monitorix/updates/
   ```

---

## 4. Offline Verification & Tamper Detection

Before executing an update, the customer or automated installer verifies the digital signature:

```bash
# Manual verification probe
python3 -c "
import json
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.exceptions import InvalidSignature

# Load root vendor public verification key
pub_key = ed25519.Ed25519PublicKey.from_public_bytes(
    bytes.fromhex('4f0aea519bb1e5c72ee95032033bb9e430bed55d4c4f9741c5994c2c365ddbb2')
)

import tarfile, tempfile
with tempfile.TemporaryDirectory() as tdir:
    with tarfile.open('/opt/monitorix/updates/monitorix-update-19.2.0.tar.gz', 'r:gz') as tar:
        tar.extractall(tdir)
    manifest = open(tdir + '/manifest.json', 'rb').read()
    sig = open(tdir + '/signatures/manifest.sig', 'rb').read()
    try:
        pub_key.verify(sig, manifest)
        print('[✓] Offline update package authenticity VERIFIED (Valid Vendor Ed25519 Signature).')
    except InvalidSignature:
        print('[✗] CRITICAL ALERT: Tampered update package detected! Signature verification FAILED.')
"
```

If any file within the package has been altered, the installer halts immediately with:
```
[✗] FATAL: Invalid Ed25519 signature on manifest.json! Tampered package.
[✗] Cryptographic signature verification failed.
```

---

## 5. Applying the Offline Update

Run the update installer directly:
```bash
sudo /opt/monitorix/scripts/monitorix-update \
  --package /opt/monitorix/updates/monitorix-update-19.2.0.tar.gz
```
