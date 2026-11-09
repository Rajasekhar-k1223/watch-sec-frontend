# Monitorix Sovereign Enterprise — Backup & Restoration Guide

## 1. Overview & Security Baseline

Monitorix provides an enterprise-grade disaster recovery backup and restoration toolset (`monitorix-backup` and `monitorix-restore`) designed specifically for sovereign on-premises and air-gapped clusters.

### Key Operational Standards:
- **Zero Secrets in Logs**: All database passwords, API tokens, master vault keys, and encryption secrets are dynamically scrubbed and masked (`***MASKED***`) from standard output and log streams.
- **Cryptographic Digest**: Every backup archive is automatically accompanied by a SHA-256 cryptographic manifest (`.sha256`).
- **Comprehensive Coverage**: Captures relational operational data, telemetry schemas, MinIO object inventories, vector embeddings, license manifests, TLS certificates, and environment configuration.

---

## 2. Backup CLI: `monitorix-backup`

### Location:
`/opt/monitorix/scripts/monitorix-backup`

### Command Syntax:
```bash
./scripts/monitorix-backup [options]
```

### Options:
- `--output-dir <path>`: Destination directory for the backup archive (default: `./backups`).
- `--full`: Full system backup (Database, Configuration, License, Certificates, Manifests).
- `--db-only`: Backs up only operational and telemetry databases.
- `--config-only`: Backs up only environment configuration, license, and certificates.

### Backup Archive Contents:
```
monitorix-backup-<timestamp>.tar.gz
├── backup_manifest.json           # Backup timestamp, mode, platform version
├── config/
│   └── monitorix.env              # Environment variables (secrets preserved in archive, masked in logs)
├── license/
│   └── customer-license.json      # Asymmetric Ed25519 customer license
├── certificates/                  # TLS server certificates, private keys, and trusted CA
├── databases/
│   ├── postgres_monitorix.sql     # Full SQL dump of PostgreSQL database
│   └── clickhouse/                # Telemetry table definitions and schemas
└── storage/
    ├── minio_inventory.txt        # Forensic storage object inventory
    └── qdrant_collections.json    # Threat intelligence vector collection snapshots
```

### Automated Cron Backup Schedule:
Add to the host root crontab (`sudo crontab -e`):
```cron
# Full nightly cluster backup at 02:00 AM UTC
0 2 * * * /opt/monitorix/scripts/monitorix-backup --output-dir /var/backups/monitorix --full >> /var/log/monitorix-backup.log 2>&1
```

---

## 3. Restore CLI: `monitorix-restore`

### Location:
`/opt/monitorix/scripts/monitorix-restore`

### Command Syntax:
```bash
./scripts/monitorix-restore --backup <path_to_backup.tar.gz> [options]
```

### Options:
- `--backup <file>`: (Required) Path to the `.tar.gz` backup archive. If omitted, the tool automatically uses the latest backup recorded in `backups/latest_backup_path.txt`.
- `--full`: Full system disaster recovery (default). Restores config, license, certs, and operational databases, then executes health verification probes.
- `--db-only`: Restores only the operational PostgreSQL and ClickHouse databases.
- `--config-only`: Restores only `config/monitorix.env`.
- `--license-only`: Restores only the customer license file in `license/`.
- `--certs-only`: Restores only the TLS/mTLS certificates in `certificates/`.
- `--skip-health-check`: Bypasses post-restoration API health probes.

---

## 4. Disaster Recovery Scenarios & Walkthroughs

### Scenario A: Full Host Replacement (Bare-Metal Rebuild)
1. Install base Linux OS and Docker runtime on the new physical server.
2. Unpack the original Monitorix distribution bundle to `/opt/monitorix`.
3. Copy the latest backup archive and `.sha256` manifest to `/opt/monitorix/backups/`.
4. Run full restoration:
   ```bash
   cd /opt/monitorix
   sudo ./scripts/monitorix-restore --backup backups/monitorix-backup-latest.tar.gz --full
   ```
5. The restore script automatically:
   - Verifies the SHA-256 digest against `monitorix-backup-latest.sha256`.
   - Extracts configurations, certificates, and license.
   - Streams `postgres_monitorix.sql` into PostgreSQL.
   - Executes health probes against `/api/health`.

### Scenario B: Database Rollback (Corrupted or Accidental Data Modification)
To restore only the database without overwriting modified server configurations or certs:
```bash
sudo ./scripts/monitorix-restore --backup backups/monitorix-backup-latest.tar.gz --db-only
```

### Scenario C: Emergency Certificate or License Recovery
To restore an accidentally overwritten license:
```bash
sudo ./scripts/monitorix-restore --backup backups/monitorix-backup-latest.tar.gz --license-only
```
