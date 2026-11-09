# Monitorix Enterprise — Build & Release Engineering Guide

## 1. Overview & Build Philosophy

The Monitorix Enterprise Build and Release pipeline is engineered to deliver reproducible, cryptographically verifiable, and tamper-resistant production artifacts.

### Key Tenets
1. **Zero Source Code Shipping:** Customers receive production artifacts (minified React JS/CSS, Cython native `.so` shared objects, optimized `-OO` `.pyc` bytecode, and signed container images). Raw `.py` files and `.map` sourcemaps are strictly excluded.
2. **Zero Secret Leakage:** Static analysis and pattern matching scan every file prior to packaging. The build pipeline fails immediately if unapproved private keys, passwords, or tokens are found.
3. **Cryptographic Provenance:** Every build generates a machine-readable `BUILD_MANIFEST.json`, a CycloneDX/SPDX Software Bill of Materials (SBOM), and an Ed25519 digital signature of all file checksums.
4. **Reproducibility:** Build parameters, toolchain versions (Node, Python, Cython, GCC), and Git commit SHAs are stamped into every artifact.

```
+-----------------------------------------------------------------------------+
|                     SECURE PRODUCTION BUILD PIPELINE                        |
+-----------------------------------------------------------------------------+
|                                                                             |
|  1. AUDIT & SECRET SCAN                                                     |
|     python3 scripts/scan_secrets.py watch-sec-python/backend/app            |
|     python3 scripts/scan_secrets.py watch-sec-frontend/src                  |
|                                                                             |
|  2. FRONTEND PRODUCTION BUILD                                               |
|     cd watch-sec-frontend && npm run build                                  |
|     (Enforces sourcemap: false, console.drop, identifier minification)      |
|                                                                             |
|  3. PYTHON NATIVE & BYTECODE COMPILATION                                    |
|     python3 build/python/compile_crown_jewels.py                            |
|     python3 build/python/compile_bytecode.py                                |
|     python3 build/python/validate_compiled_backend.py                       |
|                                                                             |
|  4. CONTAINER PACKAGING & MULTI-STAGE HARNESS                               |
|     docker build -f Dockerfile.production -t monitorix-backend:19.1.0 .     |
|     docker build -f Dockerfile.production -t monitorix-web:19.1.0 .         |
|                                                                             |
|  5. LICENSE GENERATION & METADATA BUNDLING                                  |
|     python3 tools/license_generator.py (Vendor HSM / CI Runner)             |
|                                                                             |
|  6. SBOM & CHECKSUM DIGESTS                                                 |
|     sha256sum -> checksums/SHA256SUMS.txt                                   |
|     Sign with Vendor Ed25519 Private Key -> signatures/SHA256SUMS.sig       |
|                                                                             |
|  7. ARCHIVE COMPRESSION                                                     |
|     tar -czf build/dist/monitorix-enterprise-19.1.0.tar.gz                  |
|                                                                             |
+-----------------------------------------------------------------------------+
```

---

## 2. Environment Prerequisites

### Toolchain Requirements
* **Operating System:** Linux x86_64 (Ubuntu 22.04 LTS or RHEL 9 recommended)
* **Python Runtime:** Python 3.11.x (matches production runtime)
* **C Compiler:** GCC 11+ or Clang 14+ with Python development headers (`python3-dev`)
* **Node.js Runtime:** Node.js 18.x LTS or 20.x LTS with NPM 9+
* **Container Engine:** Docker CE 24+ with BuildKit enabled
* **Cryptography Library:** OpenSSL 3.x, Python `cryptography` library

---

## 3. Step-by-Step Production Build Instructions

### Step 1: Pre-Build Secret Scanning
Validate that no developers accidentally committed credentials:
```bash
python3 scripts/scan_secrets.py watch-sec-python/backend/app
python3 scripts/scan_secrets.py watch-sec-frontend/src
```
*Build fails immediately if any pattern matches.*

### Step 2: React Frontend Build
```bash
cd watch-sec-frontend
npm ci --prefer-offline
npm run build
```
**Verification:**
```bash
# Verify zero source maps
find dist/ -name "*.map" | grep -q . && { echo "ERROR: Source maps detected!"; exit 1; } || echo "PASSED: Zero source maps."
```

### Step 3: Python Backend Compilation
Execute the native Cython compilation for the 8 Crown Jewel modules:
```bash
python3 build/python/compile_crown_jewels.py --target watch-sec-python/backend/app
```
Compile the remaining routes and services to optimized bytecode and purge `.py` files:
```bash
python3 build/python/compile_bytecode.py --target watch-sec-python/backend/app --purge-source
```
Validate that the compiled backend runtime functions without `.py` source:
```bash
python3 build/python/validate_compiled_backend.py --target watch-sec-python/backend/app
```

### Step 4: Multi-Stage Production Docker Images
Build the hardened production images:
```bash
# 1. Build Production Frontend Image
docker build \
    -f watch-sec-frontend/Dockerfile.production \
    -t monitorix-web:19.1.0 \
    watch-sec-frontend/

# 2. Build Production Backend Image
docker build \
    -f watch-sec-python/backend/Dockerfile.production \
    -t monitorix-backend:19.1.0 \
    watch-sec-python/backend/
```

### Step 5: Bundle Assembly & Verification
Assemble the customer distribution bundle:
```bash
python3 build/build_production_bundle.py --version 19.1.0
```
This script:
1. Assembles all scripts, installers, licenses, and compose configurations into `build/dist/monitorix-enterprise-19.1.0/`.
2. Packages container images into `images/monitorix-backend.tar.gz` and `images/monitorix-web.tar.gz`.
3. Computes SHA-256 digests for all files into `checksums/SHA256SUMS.txt`.
4. Signs the checksum file with the Vendor Release Key into `signatures/SHA256SUMS.sig`.
5. Compresses the entire release tree into `build/dist/monitorix-enterprise-19.1.0.tar.gz`.

---

## 4. Release Verification Checklist

Before shipping any release archive to a customer or partner:
* [ ] Pre-build secret scanner passed with 0 violations.
* [ ] Frontend `dist/` contains 0 `.map` files.
* [ ] Backend contains 0 `.py` files (only `.so` and `.pyc`).
* [ ] `license/customer-license.json` verified with vendor public key.
* [ ] `install.sh` passed dry-run installation on a clean Linux host.
* [ ] `health-check.sh` returned `HEALTHY` for all services.
* [ ] SBOM generated in CycloneDX standard JSON.
* [ ] Release checksums signed with Ed25519 vendor key.
