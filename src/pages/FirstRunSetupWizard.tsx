import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, CheckCircle2, ChevronRight, ChevronLeft, Building2, Key,
  Lock, Network, Download, Sliders, Layers, Search, BarChart3,
  Check, ArrowRight, Laptop, Server, AlertCircle
} from 'lucide-react';

interface SetupState {
  // Step 2: Org
  organizationName: string;
  primaryDomain: string;
  adminContactEmail: string;
  // Step 3: License
  licenseId: string;
  licenseEdition: string;
  endpointQuota: number;
  licenseStatus: string;
  // Step 4: Admin
  superadminUsername: string;
  superadminPassword: string;
  confirmPassword: string;
  // Step 5: TLS
  tlsMode: string;
  enableMtls: boolean;
  // Step 6: Network
  ingestionPort: number;
  portalPort: number;
  bindHost: string;
  // Step 7: Enrollment
  enableWindowsEnroll: boolean;
  enableLinuxEnroll: boolean;
  enableMacEnroll: boolean;
  // Step 8: Policies
  enableSigmaRules: boolean;
  enableYaraScanning: boolean;
  autonomousRemediation: boolean;
  // Step 9: Integrations
  enableSyslog: boolean;
  enableWebhooks: boolean;
  enableEmailAlerts: boolean;
  // Step 10: Discovery
  discoverySubnet: string;
  autoEnrollDiscovered: boolean;
  // Step 11: Security Baseline
  baselineProfile: string;
  enforceZeroTrust: boolean;
}

export default function FirstRunSetupWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  const [state, setState] = useState<SetupState>({
    organizationName: 'Acme Enterprise Global',
    primaryDomain: 'acme.internal',
    adminContactEmail: 'secops@acme.internal',
    licenseId: 'LIC-2026-SOVEREIGN-LTS',
    licenseEdition: 'Enterprise XDR / Sovereign On-Prem',
    endpointQuota: 5000,
    licenseStatus: 'CRYPTOGRAPHICALLY VALIDATED (Ed25519)',
    superadminUsername: 'superadmin',
    superadminPassword: '',
    confirmPassword: '',
    tlsMode: 'enterprise_ca',
    enableMtls: true,
    ingestionPort: 8005,
    portalPort: 8085,
    bindHost: '0.0.0.0',
    enableWindowsEnroll: true,
    enableLinuxEnroll: true,
    enableMacEnroll: true,
    enableSigmaRules: true,
    enableYaraScanning: true,
    autonomousRemediation: true,
    enableSyslog: true,
    enableWebhooks: false,
    enableEmailAlerts: true,
    discoverySubnet: '10.0.0.0/16',
    autoEnrollDiscovered: false,
    baselineProfile: 'cis_level_2',
    enforceZeroTrust: true,
  });

  const steps = [
    { id: 1, title: 'Welcome', icon: Shield },
    { id: 2, title: 'Organization', icon: Building2 },
    { id: 3, title: 'License', icon: Key },
    { id: 4, title: 'Administrator', icon: Lock },
    { id: 5, title: 'TLS Security', icon: Shield },
    { id: 6, title: 'Network', icon: Network },
    { id: 7, title: 'Endpoint Enrollment', icon: Download },
    { id: 8, title: 'Security Policies', icon: Sliders },
    { id: 9, title: 'Integrations', icon: Layers },
    { id: 10, title: 'Initial Discovery', icon: Search },
    { id: 11, title: 'Security Baseline', icon: BarChart3 },
    { id: 12, title: 'Complete', icon: CheckCircle2 },
  ];

  const handleNext = () => {
    if (currentStep < 12) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsFinishing(true);
      setTimeout(() => {
        navigate('/soc');
      }, 1200);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              MONITORIX <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30">ENTERPRISE 19.1.0 LTS</span>
            </h1>
            <p className="text-xs text-slate-400">First-Run Sovereign Configuration & Initialization Wizard</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Air-Gapped Status</div>
          <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 justify-end">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            100% Local & Sovereign
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full p-6 gap-8">
        {/* Left Step Sidebar */}
        <aside className="w-72 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex flex-col">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Setup Sequence</div>
          <div className="space-y-1.5 flex-1">
            {steps.map(s => {
              const Icon = s.icon;
              const isPast = s.id < currentStep;
              const isCurrent = s.id === currentStep;
              return (
                <div
                  key={s.id}
                  onClick={() => s.id <= currentStep && setCurrentStep(s.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                      : isPast
                      ? 'text-slate-300 hover:bg-slate-800/40'
                      : 'text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                    isCurrent
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : isPast
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isPast ? <Check className="w-4 h-4" /> : s.id}
                  </div>
                  <span className="truncate">{s.title}</span>
                </div>
              );
            })}
          </div>
          <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-500 flex justify-between px-2">
            <span>Step {currentStep} of 12</span>
            <span>{Math.round((currentStep / 12) * 100)}% Complete</span>
          </div>
        </aside>

        {/* Right Dynamic Form Panel */}
        <main className="flex-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium">
                Autonomous Security Architecture
              </div>
              <h2 className="text-3xl font-extrabold text-white">Welcome to Monitorix Enterprise</h2>
              <p className="text-slate-300 leading-relaxed">
                Thank you for deploying Monitorix Enterprise. This sovereign, on-premises installation ensures your organization's sensitive telemetry, threat indicators, and process data never exit your corporate firewall.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <h4 className="font-semibold text-white text-sm mb-1">Zero Cloud Connectivity</h4>
                  <p className="text-xs text-slate-400">Operates 100% offline with air-gapped cryptographic license verification.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <h4 className="font-semibold text-white text-sm mb-1">Autonomous Disruption</h4>
                  <p className="text-xs text-slate-400">Real-time attack-chain correlation and active defensive responses.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Organization */}
          {currentStep === 2 && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-2xl font-bold text-white">Organization & Hierarchy</h2>
              <p className="text-slate-400 text-sm">Define your enterprise entity identity and sovereign domain boundary.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Enterprise Organization Name</label>
                  <input
                    type="text"
                    value={state.organizationName}
                    onChange={e => setState({ ...state, organizationName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Internal Domain (FQDN)</label>
                  <input
                    type="text"
                    value={state.primaryDomain}
                    onChange={e => setState({ ...state, primaryDomain: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Security Operations Contact Email</label>
                  <input
                    type="email"
                    value={state.adminContactEmail}
                    onChange={e => setState({ ...state, adminContactEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: License */}
          {currentStep === 3 && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-2xl font-bold text-white">Cryptographic License Verification</h2>
              <p className="text-slate-400 text-sm">Verified offline against the embedded Monitorix Vendor Public Key.</p>
              <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <span className="text-xs text-slate-400">License ID</span>
                  <span className="text-sm font-mono text-cyan-400 font-semibold">{state.licenseId}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <span className="text-xs text-slate-400">Edition / Entitlement</span>
                  <span className="text-sm text-white font-medium">{state.licenseEdition}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <span className="text-xs text-slate-400">Authorized Endpoint Quota</span>
                  <span className="text-sm font-bold text-emerald-400">{state.endpointQuota.toLocaleString()} Nodes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Signature State</span>
                  <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                    {state.licenseStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Administrator */}
          {currentStep === 4 && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-2xl font-bold text-white">Primary Administrator Setup</h2>
              <p className="text-slate-400 text-sm">Initialize master superadmin credentials for the SOC command center.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Master Username</label>
                  <input
                    type="text"
                    value={state.superadminUsername}
                    disabled
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Administrator Password</label>
                  <input
                    type="password"
                    placeholder="Enter strong password (min 12 chars)"
                    value={state.superadminPassword}
                    onChange={e => setState({ ...state, superadminPassword: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm administrator password"
                    value={state.confirmPassword}
                    onChange={e => setState({ ...state, confirmPassword: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: TLS */}
          {currentStep === 5 && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-2xl font-bold text-white">TLS & Ingestion Encryption</h2>
              <p className="text-slate-400 text-sm">Configure cryptographic cipher suites and endpoint mutual TLS (mTLS).</p>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="radio"
                    name="tlsMode"
                    checked={state.tlsMode === 'enterprise_ca'}
                    onChange={() => setState({ ...state, tlsMode: 'enterprise_ca' })}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold text-white text-sm">Enterprise Internal CA / Custom Certificate</div>
                    <div className="text-xs text-slate-400">Use existing organizational PKI certificates staged in /opt/monitorix/certificates.</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="radio"
                    name="tlsMode"
                    checked={state.tlsMode === 'self_signed'}
                    onChange={() => setState({ ...state, tlsMode: 'self_signed' })}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold text-white text-sm">Automated Self-Signed Sovereign TLS</div>
                    <div className="text-xs text-slate-400">Generates 4096-bit RSA / P-384 elliptic curve certificate pairs on host startup.</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 6: Network */}
          {currentStep === 6 && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-2xl font-bold text-white">Network Binding & Ports</h2>
              <p className="text-slate-400 text-sm">Define listening ports for the SOC Web Portal and Agent Ingestion Gateway.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Web Portal Port (HTTPS)</label>
                  <input
                    type="number"
                    value={state.portalPort}
                    onChange={e => setState({ ...state, portalPort: parseInt(e.target.value) || 8085 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Agent Gateway Port (TLS)</label>
                  <input
                    type="number"
                    value={state.ingestionPort}
                    onChange={e => setState({ ...state, ingestionPort: parseInt(e.target.value) || 8005 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Endpoint Enrollment */}
          {currentStep === 7 && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-2xl font-bold text-white">Endpoint Agent Enrollment</h2>
              <p className="text-slate-400 text-sm">Pre-configured agent packages ready for deployment with embedded local server URLs.</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <Laptop className="w-8 h-8 mx-auto text-cyan-400" />
                  <div className="text-sm font-semibold text-white">Windows Agent</div>
                  <div className="text-xs text-slate-400">MSI / Signed Authenticode</div>
                  <button className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white">Download</button>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <Server className="w-8 h-8 mx-auto text-emerald-400" />
                  <div className="text-sm font-semibold text-white">Linux Agent</div>
                  <div className="text-xs text-slate-400">RPM / DEB / Binary</div>
                  <button className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white">Download</button>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <Laptop className="w-8 h-8 mx-auto text-indigo-400" />
                  <div className="text-sm font-semibold text-white">macOS Agent</div>
                  <div className="text-xs text-slate-400">Universal PKG / Notarized</div>
                  <button className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white">Download</button>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Security Policies */}
          {currentStep === 8 && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-2xl font-bold text-white">Detection & Autonomous Policies</h2>
              <p className="text-slate-400 text-sm">Select baseline detection engines and autonomous defense response modes.</p>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="text-sm font-semibold text-white">Enable Sigma Rules Engine</div>
                    <div className="text-xs text-slate-400">Evaluates streaming events against 1,200+ MITRE ATT&CK Sigma rules.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.enableSigmaRules}
                    onChange={e => setState({ ...state, enableSigmaRules: e.target.checked })}
                    className="w-5 h-5 rounded text-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="text-sm font-semibold text-white">Enable Real-Time YARA Memory & File Scanner</div>
                    <div className="text-xs text-slate-400">Scans loaded binaries and process memory for malicious patterns.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.enableYaraScanning}
                    onChange={e => setState({ ...state, enableYaraScanning: e.target.checked })}
                    className="w-5 h-5 rounded text-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="text-sm font-semibold text-white">Autonomous Threat Remediation (SOAR)</div>
                    <div className="text-xs text-slate-400">Auto-isolate confirmed ransomware processes and infected host network adapters.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.autonomousRemediation}
                    onChange={e => setState({ ...state, autonomousRemediation: e.target.checked })}
                    className="w-5 h-5 rounded text-cyan-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step 9: Integrations */}
          {currentStep === 9 && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-2xl font-bold text-white">Enterprise Integrations</h2>
              <p className="text-slate-400 text-sm">Forward alerts to internal SIEM or ticketing systems via standard protocols.</p>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="text-sm font-semibold text-white">Internal Syslog Forwarding (RFC 5424)</div>
                    <div className="text-xs text-slate-400">Stream CEF/LEEF formatted alerts to internal secondary SIEMs.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.enableSyslog}
                    onChange={e => setState({ ...state, enableSyslog: e.target.checked })}
                    className="w-5 h-5 rounded text-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="text-sm font-semibold text-white">Internal Incident Webhooks</div>
                    <div className="text-xs text-slate-400">Trigger local webhooks to Jira / ServiceNow on incident creation.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.enableWebhooks}
                    onChange={e => setState({ ...state, enableWebhooks: e.target.checked })}
                    className="w-5 h-5 rounded text-cyan-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step 10: Initial Discovery */}
          {currentStep === 10 && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-2xl font-bold text-white">Initial Asset Discovery</h2>
              <p className="text-slate-400 text-sm">Define subnets for passive ARP/NDR asset discovery and unmanaged device detection.</p>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Internal Network CIDR Block</label>
                <input
                  type="text"
                  value={state.discoverySubnet}
                  onChange={e => setState({ ...state, discoverySubnet: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Step 11: Security Baseline */}
          {currentStep === 11 && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-2xl font-bold text-white">Initial Security Baseline</h2>
              <p className="text-slate-400 text-sm">Establish standard compliance baselines for all monitored endpoints.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-2">
                  <div className="text-sm font-semibold text-cyan-400">CIS Benchmark Level 2</div>
                  <div className="text-xs text-slate-400">High-assurance hardening profile for enterprise workstations and production servers.</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-sm font-semibold text-white">NIST SP 800-53 / Zero Trust</div>
                  <div className="text-xs text-slate-400">Continuous device health attestation and conditional access enforcement.</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 12: Complete */}
          {currentStep === 12 && (
            <div className="space-y-6 max-w-xl text-center mx-auto py-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-extrabold text-white">Configuration Complete!</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Your sovereign on-premises Monitorix instance is fully initialized, cryptographically sealed, and ready for operations.
              </p>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs text-slate-400 space-y-1.5">
                <div className="flex justify-between">
                  <span>Cluster Status:</span>
                  <span className="text-emerald-400 font-semibold">ONLINE & HEALTHY</span>
                </div>
                <div className="flex justify-between">
                  <span>Organization:</span>
                  <span className="text-white font-medium">{state.organizationName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Quota:</span>
                  <span className="text-cyan-400 font-semibold">{state.endpointQuota} Endpoints</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                disabled={isFinishing}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium flex items-center gap-2 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            <button
              onClick={handleNext}
              disabled={isFinishing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              {currentStep === 12 ? (
                isFinishing ? 'Launching Command Center...' : 'Launch Monitorix SOC'
              ) : (
                <>Next Step <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
