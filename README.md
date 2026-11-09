# Monitorix Enterprise — Security Operations Console (Frontend)

**Enterprise Level 4: Sovereign Cybersecurity & Extended Detection and Response (XDR) Web Portal**

Monitorix Enterprise Frontend is a high-performance, single-page application (SPA) engineered with React 19, TypeScript, and Vite. It serves as the primary visual command interface for Zero-Knowledge Executives, Principal Security Architects, SOC Analysts, and Regulatory Auditors.

---

## 1. Key Technologies & Architectural Stack

- **Core Framework**: React `19.2.0` with React DOM `19.2.0`
- **Build & Bundling**: Vite `7.3.0` with TypeScript `5.9.3`
- **Routing**: React Router DOM `7.11.0` (client-side routing across 60+ enterprise views)
- **Styling**: TailwindCSS `4.1.18` with hardware-accelerated transitions and dark/light mode themes
- **Geospatial & Fleet Tracking**: **React Leaflet (`react-leaflet` ^5.0.0, `leaflet` ^1.9.4)**
  - Zero-API-key sovereign tile layers: **Esri World Streets**, **Esri Dark Gray Canvas**, **Esri Light Gray Canvas**, **OpenStreetMap**
  - Offline air-gapped readiness (zero dependencies on third-party SaaS mapping APIs such as Carto, Google Maps, or Mapbox)
  - Great-circle spherical interpolation for dynamic cyber threat trajectories
  - Organic feathered alpha-mask gradient blending for executive command hero banners
- **Data Visualization**: Recharts `3.6.0` (time-series CPU, RAM, network bandwidth, risk scores)
- **Real-Time Streaming**: Socket.IO client (`socket.io-client` ^4.8.3) with automatic reconnect and event multiplexing
- **Terminal Emulation**: XTerm `5.3.0` with `xterm-addon-fit` for remote administrative terminal sessions
- **Topology & Attack Graphs**: React Flow (`@xyflow/react` 12.12.0) and React Force Graph 2D `1.29.0`

---

## 2. 100% Real-Time Dynamic Telemetry Invariant

Monitorix Enterprise enforces an authoritative **Zero Mock Data Invariant**:
- **No Synthetic Sensors**: All fleet pins and connection trajectories are dynamically generated from active agents enrolled in the database.
- **No Hardcoded Fallbacks**: All dashboard metrics (Active Endpoints, Critical Threats, Inbound Traffic Mbps, Active Connections) bind directly to live `/api/dashboard/stats`, `/api/system/health`, and WebSocket event streams.
- **Microservices Health Telemetry**: Live millisecond latency, memory footprints, connected client counts, and disk usage polled directly from operational Docker microservices.

---

## 3. Core Operational Modules & Routes

| Route | View Name | Key Operational Capabilities |
| :--- | :--- | :--- |
| `/` or `/dashboard` | **Cybersecurity Command Center** | Executive command banner, interactive React Leaflet world threat map, real-time telemetry KPIs, stacked critical attack widgets. |
| `/fleet-map` | **Fleet Location Map** | Sovereign geospatial tracking with live multi-layer switching (Esri Streets, Dark Canvas, Light Canvas, OSM), agent popups, IP triangulation. |
| `/agents` | **Active Fleet Management** | Enrolled endpoints list, multi-OS deployment wizard, lockdown/isolation triggers, remote desktop, activity logs, file integrity. |
| `/soc-command-center` | **SOC Command Center** | Shift handovers, active containment actions, SLA tracking, MTTR/MTTD metrics. |
| `/compliance` | **Global Compliance Center** | 32 statutory regulatory frameworks, mathematical PII checksum verification, automated audit reports. |
| `/threat-hunting` | **Threat Hunting Lab** | ClickHouse-powered query builder, natural language query copilot, MITRE ATT&CK technique mapping. |
| `/sandbox` | **Detonation Sandbox** | Safe detonation analysis, behavior scoring, dynamic API hooking traces. |
| `/easm` | **External Attack Surface** | Subdomain discovery, orphaned CNAME detection, SSL/TLS certificate expiration auditing. |
| `/waap` | **Web & API Security (WAAP)** | OWASP Top 10 mitigation, WAF rule inspection, API rate limiting telemetry. |
| `/dlp` | **Data Loss Prevention (DLP)** | Sovereign PII pattern detection, clipboard inspection, USB storage exfiltration alerts. |

---

## 4. Development & Production Operations

### Prerequisites
- Node.js `20.x` or `22.x` LTS
- npm `10.x`+

### Development Server
```bash
# Install dependencies
npm install

# Start development server on port 5173
npm run dev
```

### Production Build & Verification
```bash
# Run TypeScript type check and compile Vite production bundle
npm run build

# Output directory: /opt/projects/monitorix/watch-sec-frontend/dist
```

### Production Deployment (Docker & Host Nginx)
```bash
# Copy compiled bundle to Nginx runtime container
docker cp /opt/projects/monitorix/watch-sec-frontend/dist/. watch-sec-frontend:/usr/share/nginx/html/

# Reload Docker Nginx and Host Nginx
docker exec watch-sec-frontend nginx -s reload
nginx -s reload
```

---

## 5. Security & Sovereignty Standards

- **Zero External SaaS Leaks**: Zero telemetry sent to external tracking services or third-party CDNs.
- **Content Security Policy**: Hardened against inline scripts and untrusted remote frame injections.
- **Cryptographic Session Storage**: Encrypted JWT storage with auto-refresh and role-based access control (SuperAdmin, TenantAdmin, Analyst, Auditor).
