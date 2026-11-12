/**
 * MONITORIX PUBLIC & OFFLINE DOCUMENTATION AI ASSISTANT
 * Autonomous Technical Knowledge Base • No Login Required • Zero Tenant Data
 */
(function() {
  'use strict';

  // 1. Offline Knowledge Base & Semantic Evaluator
  const DocsOfflineAI = {
    evaluate: function(query) {
      const q = (query || '').toLowerCase().trim();

      // Guardrail: Client / Tenant / Superadmin / User / Customer Data Inquiry or Leakage Check
      const isClientTenantAdminQuery = 
        q.includes('superadmin') || q.includes('super admin') ||
        q.includes('client data') || q.includes('client list') || q.includes('clients data') ||
        q.includes('tenant data') || q.includes('tenant list') || q.includes('tenants data') ||
        q.includes('user data') || q.includes('user list') || q.includes('users data') || q.includes('user credential') ||
        q.includes('customer data') || q.includes('customer list') || q.includes('customers data') ||
        q.includes('admin data') || q.includes('admin account') || q.includes('admin credential') ||
        q.includes('admin password') || q.includes('admin email') ||
        q.includes('client/tenant') || q.includes('tenant/superadmin') || q.includes('superadmin or any user data') ||
        q.includes('give or not') || q.includes('will give or not') ||
        (
          (q.includes('client') || q.includes('tenant') || q.includes('superadmin') || q.includes('user') || q.includes('customer')) &&
          (q.includes('give') || q.includes('leak') || q.includes('show') || q.includes('expose') || q.includes('extract') || q.includes('list') || q.includes('who is') || q.includes('who are') || q.includes('visible') || q.includes('data'))
        ) ||
        q.includes('my agent') || q.includes('private agent') || q.includes('my host') ||
        q.includes('my ip') || q.includes('internal ip') || q.includes('private ip') ||
        q.includes('my password') || q.includes('my fleet') || q.includes('login token') ||
        q.includes('session data') || q.includes('jwt secret') || q.includes('tenant db') ||
        q.includes('private key') || q.includes('show all agents') || q.includes('internal ips') ||
        q.includes('active incidents in my company');

      if (isClientTenantAdminQuery) {
        return {
          response: "🔒 **Zero-Trust Privacy & Confidentiality Guarantee (Public Documentation Mode)**:\n\n" +
            "### 🛡️ Definitive Answer: **NO, the public chatbot NEVER gives or exposes client, tenant, superadmin, or user data.**\n\n" +
            "The Monitorix Public Documentation AI Guide is strictly engineered with **zero access to private enterprise data**:\n\n" +
            "### 🚫 4-Pillar Confidentiality Enforcement:\n" +
            "1. **Total Air-Gap from Operational Databases**:\n" +
            "   * The public chatbot is completely decoupled from database tables (`Tenants`, `Users`, `Customers`, `Agents`, `EventLogs`).\n" +
            "   * It runs statelessly without database drivers, SQL/ORM bindings, or user session context.\n" +
            "2. **Strict Multi-Tenant Isolation (Row-Level Security & AES-256-GCM)**:\n" +
            "   * **Superadmin & Tenant Accounts**: Password hashes, JWT secrets, MFA keys, email addresses, and admin usernames are encrypted and completely inaccessible to public APIs.\n" +
            "   * **Client & Customer Data**: Organizations, company names, subscription licenses, and endpoint inventories are protected by strict cryptographic tenant barriers.\n" +
            "   * **No Cross-Tenant Visibility**: Even within the authenticated platform, tenants can never view other tenants' data.\n" +
            "3. **Zero Keystroke / PII Retention**:\n" +
            "   * Public chats are processed statelessly in-memory or in your local browser session.\n" +
            "   * No user inquiries, IP addresses, or visitor queries are linked to enterprise accounts.\n" +
            "4. **Where to Access Authorized Organizational Telemetry**:\n" +
            "   * Legitimate administrators and analysts can only inspect their own organization's fleet and user telemetry by signing in to the authenticated SOC dashboard at `https://monitorix.elsea.co.in/`.",
          actions: ["Modular APIs", "SDK Handshake", "Transaction Privacy", "Reseller Margins"]
        };
      }

      // 1. Modular Architecture & Standalone REST APIs
      if (
        q.includes('modular') || q.includes('pick-and-choose') || q.includes('pick and choose') ||
        q.includes('integrate module') || q.includes('standalone') || q.includes('in product') ||
        q.includes('cherry pick') || q.includes('yara') || q.includes('edr isolate') ||
        q.includes('dlp api') || q.includes('integrate some of') || q.includes('possible or not') ||
        (q.includes('integrate') && (q.includes('module') || q.includes('api') || q.includes('product')))
      ) {
        return {
          response: "🧩 **Monitorix Modular 'Pick-and-Choose' Architecture & Standalone APIs**:\n\n" +
            "**Yes, 100% possible!** Monitorix is engineered as a decoupled, headless microservice mesh. " +
            "External clients, SaaS platforms, and enterprise software teams **do not need to deploy the full platform**—you can cherry-pick and integrate individual security modules directly into your existing product via **715+ standalone REST APIs**:\n\n" +
            "### 🔌 Key Standalone Modules Available for Direct Integration:\n" +
            "1. **YARA / Malware File Scanning API** (`POST /api/security/scan/yara`):\n" +
            "   * Submit uploaded files, scripts, or binaries programmatically from your web application.\n" +
            "   * Returns instant rule matches, IOC strings, and severity ratings in < 180 ms without needing an agent.\n" +
            "2. **EDR Remote Isolation & Containment API** (`POST /api/endpoints/{agent_id}/isolate`):\n" +
            "   * Trigger immediate network quarantine directly from your existing SIEM, SOAR, or ticketing pipeline.\n" +
            "3. **DLP & Sensitive Data Leak Inspection** (`POST /api/dlp/scan`):\n" +
            "   * Real-time regex and NLP inspection for PII, secrets, API keys, and Luhn credit cards before saving to your database.\n" +
            "4. **Threat Intelligence & IP Reputation** (`GET /api/threat-intel/lookup`):\n" +
            "   * Autonomous correlation of IP addresses, domain names, and file hashes against 50+ global threat feeds.\n" +
            "5. **Honeypot Decoys & Deception Grid** (`POST /api/deception/campaigns`):\n" +
            "   * Deploy shadow honeypot ports (SSH, RDP, Redis) and plant decoy canary tokens across your environment.\n" +
            "6. **Perimeter WAAP & External Attack Surface** (`POST /api/easm/assets`):\n" +
            "   * Continuous discovery of dangling subdomains, SSL expiries, and Layer-7 OWASP Top 10 mitigation.\n\n" +
            "### 🛠️ Integration Resources:\n" +
            "* **Zero-Trust SDK Handshake**: Authenticate via `POST /api/auth/sdk-handshake` with your SDK Key (`mk_live_...`) to receive a short-lived Session JWT.\n" +
            "* **Interactive API Documentation**: Explore the full Swagger OpenAPI 3.0 specification at `/developers`.\n" +
            "* **Documentation Section**: View **Section 23: Modular Architecture** in the main documentation.",
          actions: ["SDK Handshake", "Transaction Privacy", "Reseller Margins", "Replaced Tools"]
        };
      }

      // 2. Zero-Trust SDK Key Handshake & Authentication Protocol
      if (
        q.includes('handshake') || q.includes('authenticate') || q.includes('sdk key') ||
        q.includes('api key') || q.includes('mk_') || q.includes('session jwt') ||
        q.includes('how to auth') || q.includes('auth flow')
      ) {
        return {
          response: "🔑 **Zero-Trust SDK Key Handshake Protocol (`POST /api/auth/sdk-handshake`)**:\n\n" +
            "External applications authenticate with Monitorix using an enterprise **Zero-Trust Handshake Protocol** that prevents persistent credential exposure in memory:\n\n" +
            "### 🔄 Step-by-Step Handshake Flow:\n" +
            "1. **SDK Key Provisioning**: Obtain a cryptographically secure SDK Key (`mk_live_...` or `mk_test_...`) from the **Developer Portal** (`/developers`) or Tenant Settings.\n" +
            "2. **Initiate Handshake Request**:\n" +
            "   * `POST /api/auth/sdk-handshake`\n" +
            "   * **Headers**: `Content-Type: application/json`\n" +
            "   * **Body**:\n" +
            "   ```json\n" +
            "   {\n" +
            "     \"sdk_key\": \"mk_live_9f83a812b7e...\",\n" +
            "     \"tenant_id\": \"tenant-enterprise-01\",\n" +
            "     \"timestamp\": 1718000000,\n" +
            "     \"signature\": \"hmac_sha256_hash\"\n" +
            "   }\n" +
            "   ```\n" +
            "3. **Token Verification & Session Minting**:\n" +
            "   * The auth engine validates the HMAC signature, confirms active tenant authorization, and checks rate limits.\n" +
            "   * Issues an ephemeral, cryptographically signed **Session JWT** (valid for 15 minutes).\n" +
            "4. **API Execution**:\n" +
            "   * Pass the Session JWT in the header for all subsequent standalone module calls:\n" +
            "   * `Authorization: Bearer <SESSION_JWT>`\n\n" +
            "### 🛡️ Zero-Trust Security Guarantees:\n" +
            "* **Replay Attack Defense**: Nonce and timestamp validation rejects any duplicated requests.\n" +
            "* **Zero Memory Exposure**: Long-lived keys never touch client-side browser JavaScript.\n" +
            "* **Granular Scopes**: Permissions can be scoped strictly to requested APIs (e.g. `['yara:scan']` only).",
          actions: ["Modular APIs", "Transaction Privacy", "Reseller Margins"]
        };
      }

      // 3. Financial Transactions, Credit Cards & Online Banking Privacy (PCI-DSS 3.4)
      if (
        q.includes('credit') || q.includes('debit') || q.includes('card') ||
        q.includes('transact') || q.includes('transcat') || q.includes('pci') ||
        q.includes('cvv') || q.includes('cvc') || q.includes('banking') ||
        q.includes('bank') || q.includes('payment') || q.includes('financial') ||
        q.includes('checkout') || q.includes('luhn') || q.includes('stream visible') ||
        ((q.includes('stream') || q.includes('strema') || q.includes('screen')) &&
         (q.includes('visible') || q.includes('show') || q.includes('privacy') || q.includes('see') || q.includes('mask') || q.includes('protect') || q.includes('online')))
      ) {
        return {
          response: "💳 **Financial Transaction & Credit Card Privacy Protection (PCI-DSS 3.4 Compliance)**:\n\n" +
            "### 🔒 Definitive Answer: **NO, transaction details and credit cards are NEVER visible.**\n" +
            "When a user enters credit card numbers or conducts online banking transactions—even if an administrator or tenant enables **Live Streaming** or remote screen monitoring—the financial details are **strictly protected and masked** across all layers:\n\n" +
            "### 🛡️ 5-Layer Financial Privacy Architecture:\n" +
            "1. **Dynamic Hardware-Accelerated Blackout Shield**:\n" +
            "   * When an administrator opens a live stream or remote view, the endpoint agent's display hook monitors the active foreground window.\n" +
            "   * If an online banking portal (`*.chase.com`, `*.hdfcbank.com`, etc.) or payment gateway (Stripe, Razorpay, PayPal) is detected, the agent **immediately applies a hardware blackout / blur shield over the viewport**.\n" +
            "   * The live stream viewer sees: `[PROTECTED FINANCIAL SESSION - PCI-DSS COMPLIANT]`.\n" +
            "2. **Automated PAN (Primary Account Number) Masking (PCI-DSS 3.4)**:\n" +
            "   * Any 13-19 digit card numbers passing the Luhn algorithm checksum are automatically redacted in real time across keystroke logs, memory buffers, and telemetry to: `••••-••••-••••-1234` or `••••-••••-••••-••••`.\n" +
            "3. **Zero CVV / PIN Code Retention**:\n" +
            "   * Ring-0 eBPF (Linux) and ETW kernel drivers (Windows) intercept and permanently drop CVV, CVC, and card security PINs before they can ever reach disk, RAM buffers, or network packets.\n" +
            "4. **DLP Outbound Exfiltration Interception**:\n" +
            "   * Outbound web forms, clipboard copies, or file transfers containing raw financial strings trigger an instant `HTTP 403 / Network Kill` without saving the sensitive payload.\n" +
            "5. **Cryptographic Multi-Tenant Partitioning**:\n" +
            "   * Tenant data is encrypted at rest (AES-256-GCM) with separate cryptographic keys. Admins and other tenants have zero access to raw cardholder data.",
          actions: ["Modular APIs", "SDK Handshake", "Reseller Margins"]
        };
      }

      // 4. Reseller, Commercial Partner & White-Label Ecosystem
      if (
        q.includes('reseller') || q.includes('partner') || q.includes('margin') ||
        q.includes('wholesale') || q.includes('white-label') || q.includes('whitelabel') ||
        q.includes('subtenant') || q.includes('sub-tenant') || q.includes('quote') ||
        q.includes('commercial partner') || q.includes('commission')
      ) {
        return {
          response: "💼 **Monitorix Reseller & Commercial Partner Network (`/partner`)**:\n\n" +
            "Monitorix features a comprehensive commercial partner ecosystem tailored for **MSPs, MSSPs, VARs, and cybersecurity distributors** to deliver sovereign security under their own brand:\n\n" +
            "### 💰 20% Standard Wholesale Margin:\n" +
            "* Certified commercial partners receive a **guaranteed 20% wholesale discount** off standard retail list pricing across all platform modules.\n" +
            "* Full flexibility to set retail markup, package managed services, and retain 100% of service delivery revenues.\n\n" +
            "### 🚀 Core Partner Capabilities in `/partner`:\n" +
            "1. **Interactive Multi-Tier Quote Generator**:\n" +
            "   * Configure endpoint quotas, WAAP protected domains, EASM assets, and compliance tiers.\n" +
            "   * Generates formal client proposals showing Retail MSRP, Partner Wholesale Cost (20% margin), and Net Profit in real time.\n" +
            "2. **Instant Sub-Tenant Automated Provisioning**:\n" +
            "   * 1-click creation of logically and cryptographically isolated client sub-tenants with automated license quotas.\n" +
            "3. **Complete White-Label Customization**:\n" +
            "   * **Enterprise Logo & Favicon**: Replace Monitorix branding with your company logo.\n" +
            "   * **Custom Domain Aliases**: Map portals to your own domain (e.g. `soc.yourcompany.com`).\n" +
            "   * **Custom Theme & Colors**: Match your corporate brand palette.\n" +
            "   * **Co-branded SOC Reports**: Generate executive compliance and incident PDFs with your agency branding.\n" +
            "4. **Commission & Revenue Ledger**:\n" +
            "   * Track monthly recurring revenue (MRR), partner commission payouts, and contract renewal dates.",
          actions: ["Modular APIs", "SDK Handshake", "Transaction Privacy"]
        };
      }

      // 5. Tools Consolidation Matrix
      if (
        q.includes('tool') || q.includes('tools') || q.includes('wazuh') ||
        q.includes('splunk') || q.includes('crowdstrike') || q.includes('sentinelone') ||
        q.includes('suricata') || q.includes('zeek') || q.includes('replace') ||
        q.includes('supported tools')
      ) {
        return {
          response: "🛠️ **Monitorix Unified Cyber Defense Fabric vs. 150+ Tool Sprawl**:\n\n" +
            "Monitorix is an all-in-one sovereign cyber defense platform that **consolidates and replaces over 85% of separate security tools** with a single lightweight agent and high-performance backend:\n\n" +
            "* **SIEM**: Replaces *Wazuh, Graylog, Splunk* with native ClickHouse sub-150ms columnar log analytics.\n" +
            "* **EDR/XDR & FIM**: Replaces *CrowdStrike, SentinelOne, Wazuh FIM* with our native Rust eBPF/ETW kernel agent.\n" +
            "* **NDR & IDS**: Replaces *Zeek, Suricata* with wire-speed PCAP packet capture and protocol anomaly analyzers.\n" +
            "* **SOAR**: Replaces *Shuffle, TheHive, XSOAR* with built-in Visual DAG Playbooks executing containment in < 240 ms.\n" +
            "* **Deception**: Replaces *T-Pot, Cowrie, Thinkst Canary* with native Shadow Honeypots & Canaries.\n" +
            "* **EASM & WAF**: Replaces *Amass, Shodan, ModSecurity* with built-in External Attack Surface Management & WAAP.\n" +
            "* **Compliance**: Replaces *OpenSCAP, CIS-CAT* with continuous tracking of **32 global regulations**.\n\n" +
            "**Enterprise Connectors**: For clients with existing tools, Monitorix provides **1-Click Connectors** for Splunk HEC, Microsoft Sentinel, CrowdStrike, Okta, and AWS GuardDuty.",
          actions: ["Modular APIs", "Transaction Privacy", "Supported Systems"]
        };
      }

      // 6. Platform Compatibility & Supported OS
      if (
        q.includes('mac') || q.includes('macos') || q.includes('windows') ||
        q.includes('linux') || q.includes('ubuntu') || q.includes('debian') ||
        q.includes('operating system') || q.includes('platform') || q.includes('support') ||
        q.includes('install') || q.includes('spec')
      ) {
        return {
          response: "💻 **Monitorix Cross-Platform Support & Deployment**:\n\n" +
            "The Monitorix Security Platform offers **complete cross-platform endpoint support** with minimal resource footprints:\n\n" +
            "* 🐧 **Linux (Ubuntu 18.04+, Debian 10+, CentOS/RHEL 8+, Alpine)**:\n" +
            "   * Deployed via systemd daemon with native Ring-0 eBPF kernel hooks.\n" +
            "   * Memory profile: under 85 MB RAM.\n" +
            "* 🪟 **Windows (Windows 10, 11, Windows Server 2016-2025)**:\n" +
            "   * Deploys as an enterprise Windows Background Service with ETW kernel telemetry.\n" +
            "   * Hardware-accelerated screen capture and live streaming.\n" +
            "* 🍎 **macOS (Apple Silicon M1-M4 & Intel, macOS 11 Big Sur through Sequoia)**:\n" +
            "   * Deploys via custom `launchd` plist daemon with Endpoint Security Framework (ESF).\n\n" +
            "**Server Requirements**:\n" +
            "* Central Server / Cluster: Ubuntu 22.04/24.04 LTS or Kubernetes.\n" +
            "* Minimum: 4 vCPU, 8 GB RAM (production cluster scales to 100,000+ endpoints).",
          actions: ["Modular APIs", "SDK Handshake", "Transaction Privacy"]
        };
      }

      // 7. General Documentation Overview
      return {
        response: "📖 **Monitorix Public Documentation AI Guide**:\n\n" +
          "Welcome! I am the documentation assistant for the **Monitorix Sovereign Cyber Defense Platform**.\n\n" +
          "I operate in **Public / Offline Mode** (no login required, zero tenant data). You can ask me technical questions about:\n\n" +
          "* 🧩 **Modular APIs**: *\"Can I integrate only YARA scanning or EDR into our product?\"*\n" +
          "* 🔑 **SDK Authentication**: *\"How does the Zero-Trust SDK key handshake work?\"*\n" +
          "* 💳 **Privacy & PCI-DSS**: *\"Are credit cards or online banking transactions visible during live streaming?\"*\n" +
          "* 💼 **Reseller Partner Program**: *\"How does the 20% wholesale margin and quote calculator work?\"*\n" +
          "* 🛠️ **Tool Consolidation**: *\"Which tools does Monitorix replace (Splunk, CrowdStrike, Wazuh)?\"*\n" +
          "* 💻 **Deployment**: *\"What operating systems and server specifications are supported?\"*\n\n" +
          "💡 *Note: To view your organization's private assets, logged incidents, or agent telemetry, please sign in to the main SOC console.*",
        actions: ["Modular APIs", "SDK Handshake", "Transaction Privacy", "Reseller Margins", "Replaced Tools"]
      };
    }
  };

  // 2. Format Markdown to Safe HTML
  function renderMarkdown(md) {
    if (!md) return '';
    const lines = md.split('\n');
    let html = '';
    let inList = false;
    let inCodeBlock = false;
    let codeBlockContent = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Code blocks ```
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          html += '<pre><code>' + escapeHtml(codeBlockContent.trim()) + '</code></pre>';
          codeBlockContent = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeBlockContent = '';
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        continue;
      }

      // Headers ###
      if (line.startsWith('### ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<h3>' + formatInline(line.substring(4)) + '</h3>';
        continue;
      }

      // Bullet lists
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        if (!inList) { html += '<ul>'; inList = true; }
        const itemText = line.trim().substring(2);
        html += '<li>' + formatInline(itemText) + '</li>';
        continue;
      } else {
        if (inList) { html += '</ul>'; inList = false; }
      }

      if (!line.trim()) {
        html += '<div style="height:6px"></div>';
        continue;
      }

      html += '<p style="margin:4px 0">' + formatInline(line) + '</p>';
    }

    if (inList) html += '</ul>';
    if (inCodeBlock) html += '<pre><code>' + escapeHtml(codeBlockContent.trim()) + '</code></pre>';

    return html;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatInline(str) {
    let s = escapeHtml(str);
    // Bold **text**
    s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Inline `code`
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    return s;
  }

  // 3. UI Widget Management
  const DocsChatWidget = {
    isOpen: false,
    messages: [],

    init: function() {
      this.loadHistory();
      this.injectDOM();
      this.bindEvents();
      this.renderMessages();
    },

    loadHistory: function() {
      try {
        const saved = localStorage.getItem('monitorix_docs_ai_chats');
        if (saved) {
          this.messages = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Failed to parse docs chat history:', e);
      }

      if (!this.messages || this.messages.length === 0) {
        this.messages = [
          {
            sender: 'bot',
            text: "Hello! I am the **Monitorix Documentation AI Guide**.\n\n" +
              "I operate in **Public / Offline Mode** without requiring any login credentials. I can answer technical questions about platform architecture, 715+ modular REST APIs, the Zero-Trust SDK handshake, PCI-DSS transaction privacy, and the 20% reseller partner program.\n\n" +
              "*(Note: Private fleet agent telemetry, hostnames, and IP coordinates are restricted to the authenticated SOC dashboard.)*",
            actions: ["🧩 Modular APIs", "🔑 SDK Handshake", "💳 Transaction Privacy", "💼 Reseller Margins"]
          }
        ];
      }
    },

    saveHistory: function() {
      try {
        localStorage.setItem('monitorix_docs_ai_chats', JSON.stringify(this.messages.slice(-25)));
      } catch (e) {
        // Ignore storage limits
      }
    },

    injectDOM: function() {
      // Launcher Button
      const launcher = document.createElement('div');
      launcher.id = 'docsAiLauncher';
      launcher.innerHTML = `
        <span class="status-dot"></span>
        <span class="launcher-icon">🤖</span>
        <span>Docs AI • No Login</span>
      `;
      document.body.appendChild(launcher);

      // Chat Window
      const win = document.createElement('div');
      win.id = 'docsAiWindow';
      win.innerHTML = `
        <div class="docs-chat-header">
          <div class="docs-chat-title-group">
            <div class="docs-chat-avatar">🤖</div>
            <div class="docs-chat-header-text">
              <h3>Monitorix Docs AI <span class="docs-chat-badge">Public • Offline</span></h3>
              <p>Architecture & Docs Guide • Zero Tenant Data</p>
            </div>
          </div>
          <div class="docs-chat-controls">
            <button class="docs-chat-ctrl-btn" id="docsAiClearBtn" title="Clear History">🗑️</button>
            <button class="docs-chat-ctrl-btn" id="docsAiCloseBtn" title="Close">✕</button>
          </div>
        </div>

        <div class="docs-quick-prompts-bar">
          <button class="docs-prompt-chip" data-prompt="Can I integrate individual modules like YARA, EDR, or DLP into our product?">🧩 Modular APIs</button>
          <button class="docs-prompt-chip" data-prompt="How does the Zero-Trust SDK Key Handshake protocol work?">🔑 SDK Handshake</button>
          <button class="docs-prompt-chip" data-prompt="Are credit cards or online banking transactions visible during live streaming?">💳 Transaction Privacy</button>
          <button class="docs-prompt-chip" data-prompt="How does the reseller partner program and 20% margin quoting work?">💼 Reseller Margins</button>
          <button class="docs-prompt-chip" data-prompt="Which security tools does Monitorix replace or connect with?">🛠️ Replaced Tools</button>
          <button class="docs-prompt-chip" data-prompt="What operating systems and server specifications are supported?">💻 Supported Systems</button>
        </div>

        <div class="docs-chat-messages" id="docsAiMessages"></div>

        <div class="docs-chat-input-area">
          <div class="docs-input-row">
            <input type="text" id="docsAiInput" class="docs-chat-input" placeholder="Ask about modular APIs, handshake, privacy, reseller..." />
            <button id="docsAiSendBtn" class="docs-send-btn" title="Send">➤</button>
          </div>
          <p class="docs-chat-disclaimer">🔒 Public Documentation Mode • Zero private session data retained</p>
        </div>
      `;
      document.body.appendChild(win);
    },

    bindEvents: function() {
      const launcher = document.getElementById('docsAiLauncher');
      const win = document.getElementById('docsAiWindow');
      const closeBtn = document.getElementById('docsAiCloseBtn');
      const clearBtn = document.getElementById('docsAiClearBtn');
      const sendBtn = document.getElementById('docsAiSendBtn');
      const input = document.getElementById('docsAiInput');

      launcher.addEventListener('click', () => {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
          win.classList.add('open');
          setTimeout(() => input.focus(), 150);
        } else {
          win.classList.remove('open');
        }
      });

      closeBtn.addEventListener('click', () => {
        this.isOpen = false;
        win.classList.remove('open');
      });

      clearBtn.addEventListener('click', () => {
        this.messages = [
          {
            sender: 'bot',
            text: "Chat history cleared. How can I assist you with Monitorix documentation or modular architecture?",
            actions: ["🧩 Modular APIs", "🔑 SDK Handshake", "💳 Transaction Privacy", "💼 Reseller Margins"]
          }
        ];
        this.saveHistory();
        this.renderMessages();
      });

      const handleSend = () => {
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        this.sendMessage(text);
      };

      sendBtn.addEventListener('click', handleSend);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSend();
        }
      });

      // Quick prompt chips
      document.querySelectorAll('.docs-prompt-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const prompt = chip.getAttribute('data-prompt');
          if (prompt) {
            this.sendMessage(prompt);
          }
        });
      });
    },

    sendMessage: function(userText) {
      // Add user message
      this.messages.push({
        sender: 'user',
        text: userText
      });
      this.saveHistory();
      this.renderMessages();

      // Show typing indicator
      this.showTyping();

      // Try Online API first, fall back to offline engine
      const startTime = Date.now();
      const sendPromise = fetch('/api/ai/docs/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userText })
      })
      .then(res => {
        if (!res.ok) throw new Error('API ' + res.status);
        return res.json();
      })
      .then(data => {
        return {
          response: data.Response || data.response,
          actions: data.SuggestedActions || data.actions || []
        };
      })
      .catch(() => {
        // Instant Offline Semantic Evaluation
        return DocsOfflineAI.evaluate(userText);
      });

      sendPromise.then(result => {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(200 - elapsed, 50); // slight smooth pacing

        setTimeout(() => {
          this.hideTyping();
          this.messages.push({
            sender: 'bot',
            text: result.response,
            actions: result.actions
          });
          this.saveHistory();
          this.renderMessages();
        }, delay);
      });
    },

    showTyping: function() {
      const container = document.getElementById('docsAiMessages');
      let typing = document.getElementById('docsAiTyping');
      if (!typing) {
        typing = document.createElement('div');
        typing.id = 'docsAiTyping';
        typing.className = 'docs-typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
      }
    },

    hideTyping: function() {
      const typing = document.getElementById('docsAiTyping');
      if (typing) typing.remove();
    },

    renderMessages: function() {
      const container = document.getElementById('docsAiMessages');
      if (!container) return;
      container.innerHTML = '';

      this.messages.forEach(msg => {
        const wrap = document.createElement('div');
        wrap.className = 'docs-message ' + (msg.sender === 'user' ? 'user' : 'bot');

        const bubble = document.createElement('div');
        bubble.className = 'docs-message-bubble';
        bubble.innerHTML = renderMarkdown(msg.text);
        wrap.appendChild(bubble);

        // Suggested action buttons for bot messages
        if (msg.sender === 'bot' && msg.actions && msg.actions.length > 0) {
          const actWrap = document.createElement('div');
          actWrap.className = 'docs-suggested-actions';

          msg.actions.forEach(act => {
            const btn = document.createElement('button');
            btn.className = 'docs-action-pill';
            btn.textContent = act;
            btn.addEventListener('click', () => {
              const PROMPT_MAP = {
                'modular apis': 'Can I integrate individual modules like YARA, EDR, or DLP into our product?',
                'sdk handshake': 'How does the Zero-Trust SDK Key Handshake protocol work?',
                'transaction privacy': 'Are credit cards or online banking transactions visible during live streaming?',
                'reseller margins': 'How does the reseller partner program and 20% margin quoting work?',
                'replaced tools': 'Which security tools does Monitorix replace or connect with?',
                'supported systems': 'What operating systems and server specifications are supported?',
                'open documentation': 'What documentation chapters are available in Monitorix?'
              };
              const mapped = PROMPT_MAP[act.toLowerCase().trim()] || act;
              this.sendMessage(mapped);
            });
            actWrap.appendChild(btn);
          });

          wrap.appendChild(actWrap);
        }

        container.appendChild(wrap);
      });

      container.scrollTop = container.scrollHeight;
    }
  };

  // 4. Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DocsChatWidget.init());
  } else {
    DocsChatWidget.init();
  }

})();
