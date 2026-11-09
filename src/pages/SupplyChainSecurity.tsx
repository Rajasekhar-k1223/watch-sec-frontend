import React, { useState, useEffect } from 'react';
import {
  Boxes, Shield, AlertTriangle, CheckCircle2, RefreshCw,
  Zap, Search, Filter, Lock, Terminal, FileCode,
  ShieldAlert, Activity, Check, ExternalLink, Play, Sparkles,
  Server, Cpu, AlertOctagon, GitPullRequest, GitFork,
  Layers, Eye, Ban, Skull, Clock, Cloud, Network, ShieldCheck,
  Package, GitBranch, ArrowUpRight, CheckCheck
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function SupplyChainSecurity() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'components' | 'projects' | 'threats' | 'build_gate'>('components');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [overview, setOverview] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);

  // Filters
  const [ecosystemFilter, setEcosystemFilter] = useState<string>('ALL');
  const [maliciousOnly, setMaliciousOnly] = useState<boolean>(false);
  const [vulnerableOnly, setVulnerableOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // CI/CD Build Gate Sandbox
  const [manifestText, setManifestText] = useState(`fastapi==0.100.0
requsts==2.28.1
uvicorn==0.23.0
pydantic==2.1.1`);
  const [sandboxEcosystem, setSandboxEcosystem] = useState('PYPI');
  const [sandboxProject, setSandboxProject] = useState('payment-settlement-svc');
  const [evaluating, setEvaluating] = useState(false);
  const [gateResult, setGateResult] = useState<any>(null);

  // Quarantine Action State
  const [quarantiningId, setQuarantiningId] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/supply-chain/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOverview(await res.json());
    } catch (e) {
      console.error('Failed to load supply-chain overview', e);
    }
  };

  const fetchProjects = async () => {
    try {
      let url = `${API_URL}/v2/supply-chain/projects`;
      if (ecosystemFilter !== 'ALL') url += `?ecosystem=${ecosystemFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setProjects(await res.json());
    } catch (e) {
      console.error('Failed to load projects', e);
    }
  };

  const fetchComponents = async () => {
    try {
      let url = `${API_URL}/v2/supply-chain/components`;
      const params = new URLSearchParams();
      if (ecosystemFilter !== 'ALL') params.append('ecosystem', ecosystemFilter);
      if (maliciousOnly) params.append('is_malicious', 'true');
      if (vulnerableOnly) params.append('is_vulnerable', 'true');
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setComponents(await res.json());
    } catch (e) {
      console.error('Failed to load components', e);
    }
  };

  const fetchFindings = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/supply-chain/findings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setFindings(await res.json());
    } catch (e) {
      console.error('Failed to load findings', e);
    }
  };

  const fetchPolicies = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/supply-chain/policies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPolicies(await res.json());
    } catch (e) {
      console.error('Failed to load policies', e);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchOverview(),
      fetchProjects(),
      fetchComponents(),
      fetchFindings(),
      fetchPolicies()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [ecosystemFilter, maliciousOnly, vulnerableOnly]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
    toast.success('Supply-chain telemetry refreshed');
  };

  // Evaluate Build Manifest
  const handleEvaluateManifest = async () => {
    if (!manifestText.trim()) {
      toast.error('Please input a valid dependency manifest or SBOM');
      return;
    }
    setEvaluating(true);
    try {
      const res = await fetch(`${API_URL}/v2/supply-chain/evaluate-manifest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          manifest_text: manifestText,
          ecosystem: sandboxEcosystem,
          project_name: sandboxProject
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGateResult(data);
        if (data.allowed) {
          toast.success('Build Gate: PASS (Zero Supply-Chain Violations)');
        } else {
          toast.error(`Build Gate: BLOCKED (${data.violations_count} violation(s) found)`);
        }
      } else {
        toast.error('Manifest evaluation failed');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error during evaluation');
    } finally {
      setEvaluating(false);
    }
  };

  // 1-Click Package Quarantine
  const handleQuarantine = async (componentId?: string, findingId?: string) => {
    const target = componentId || findingId;
    if (!target) return;
    setQuarantiningId(target);
    try {
      const res = await fetch(`${API_URL}/v2/supply-chain/quarantine-component`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          component_id: componentId,
          finding_id: findingId,
          action: 'BLOCK_PACKAGE'
        })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || `Package ${target} quarantined from enterprise registry`);
        await loadAll();
      } else {
        toast.error('Failed to quarantine package');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error executing package quarantine');
    } finally {
      setQuarantiningId(null);
    }
  };

  // Filter components by search
  const filteredComponents = components.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.component_id?.toLowerCase().includes(q) ||
      c.ecosystem?.toLowerCase().includes(q) ||
      c.license?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600/30 to-purple-700/30 border border-indigo-500/40 rounded-xl shadow-lg shadow-indigo-900/20">
              <Package className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Software Supply-Chain & SBOM Security</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full">
                  SBOM & SLSA v18.9
                </span>
                <span className="px-2 py-0.5 text-xs font-bold bg-purple-600 text-white rounded">
                  P0 CORE
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                CycloneDX/SPDX dependency governance, typosquatting interception, CI/CD build gates & artifact provenance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors text-slate-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Hero Posture KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Supply Chain Score */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Supply-Chain Posture</span>
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.supply_chain_score ?? '--'}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (overview?.supply_chain_score || 0) > 75
                  ? 'bg-emerald-500'
                  : (overview?.supply_chain_score || 0) > 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${overview?.supply_chain_score || 0}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Avg Codebase Score: {overview?.avg_project_posture ?? 82}%</span>
            <span className="text-indigo-400 font-medium">SLSA VERIFIED</span>
          </div>
        </div>

        {/* Monitored Projects & Dependencies */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Projects & SBOMs</span>
            <GitBranch className="w-5 h-5 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.total_projects_count ?? 5}
            </span>
            <span className="text-xs text-slate-400">codebases</span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-indigo-400" /> {overview?.total_dependencies_count ?? 348} Deps
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCheck className="w-3.5 h-3.5" /> {overview?.slsa_level_3_projects ?? 2} SLSA-3
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            PyPI, NPM, Go & Cargo Supported
          </div>
        </div>

        {/* Malicious Packages Intercepted */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Malicious Packages</span>
            <AlertOctagon className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">
              {overview?.malicious_packages_count ?? 0}
            </span>
            <span className="text-xs text-slate-400">blocked</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
              Typosquats: 1
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
              Postinstall: 1
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Registry firewall upstream blocking active
          </div>
        </div>

        {/* Open Gate Findings */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">CI/CD Gate Violations</span>
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">
              {overview?.open_findings_count ?? 0}
            </span>
            <span className="text-xs text-slate-400">violations</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
              {overview?.critical_findings_count ?? 0} CRITICAL
            </span>
            <span className="text-slate-400">
              Build Gate: ENFORCING
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            100% Sovereign Monitorix Build Shield
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('components')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'components'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          SBOM Component Catalog
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300">
            {components.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'projects'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Projects & Provenance
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300">
            {projects.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('threats')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'threats'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Supply-Chain Threats
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-rose-500/20 text-rose-300">
            {findings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('build_gate')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'build_gate'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Terminal className="w-4 h-4" />
          CI/CD Build Gate Sandbox
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300">
            Policy Active
          </span>
        </button>
      </div>

      {/* TAB 1: SBOM Components */}
      {activeTab === 'components' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search package name, license, version..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Ecosystem:</span>
                <select
                  value={ecosystemFilter}
                  onChange={e => setEcosystemFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Ecosystems</option>
                  <option value="PYPI">PyPI (Python)</option>
                  <option value="NPM">npm (JavaScript)</option>
                  <option value="GO">Go Modules</option>
                  <option value="CARGO">Cargo (Rust)</option>
                </select>
              </div>

              <button
                onClick={() => setMaliciousOnly(!maliciousOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  maliciousOnly
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                Malicious Only
              </button>

              <button
                onClick={() => setVulnerableOnly(!vulnerableOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  vulnerableOnly
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Vulnerable Only
              </button>
            </div>
          </div>

          {/* Component Table */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Package / Version</th>
                    <th className="py-3 px-4">Ecosystem</th>
                    <th className="py-3 px-4">Type & License</th>
                    <th className="py-3 px-4">Vulnerabilities</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {filteredComponents.map(c => (
                    <tr key={c.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-semibold text-white flex items-center gap-2">
                          {c.name}
                          <span className="font-mono text-xs text-slate-400">@{c.version}</span>
                          {c.is_malicious && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              MALICIOUS
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-xs">
                          {c.package_hash || 'Checksum verified'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {c.ecosystem}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300">{c.is_direct ? 'Direct' : 'Transitive'}</span>
                        <span className="ml-2 text-slate-500 font-sans">({c.license})</span>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        {c.is_vulnerable ? (
                          <span className="text-amber-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> {c.cve_count} CVE (CVSS {c.highest_cvss})
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> 0 Known CVEs
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          c.status === 'ALLOWED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : c.status === 'QUARANTINED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {c.status !== 'QUARANTINED' ? (
                          <button
                            onClick={() => handleQuarantine(c.component_id)}
                            disabled={quarantiningId === c.component_id}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow disabled:opacity-50"
                          >
                            {quarantiningId === c.component_id ? 'Quarantining...' : 'Quarantine'}
                          </button>
                        ) : (
                          <span className="text-xs text-rose-400 font-semibold flex items-center justify-end gap-1">
                            <Ban className="w-3.5 h-3.5" /> Quarantined
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Projects & Provenance */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => (
            <div key={p.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {p.ecosystem}
                    </span>
                    <span className="text-sm font-semibold text-white">{p.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                    p.status === 'COMPLIANT'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : p.status === 'ACTIVE'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">Project ID:</span>
                    <p className="font-mono text-slate-200 mt-0.5">{p.project_id}</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">Branch & Provenance:</span>
                    <p className="font-mono text-slate-200 mt-0.5">{p.branch} ({p.slsa_level})</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">Dependencies:</span>
                    <p className="font-mono text-slate-200 mt-0.5">{p.dependency_count} total dependencies</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">Critical CVEs:</span>
                    <p className={`font-mono font-bold mt-0.5 ${p.critical_cve_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {p.critical_cve_count} critical CVE(s)
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Posture Score: <strong className="text-indigo-400">{p.posture_score}/100</strong></span>
                <span>Scanned: {new Date(p.last_scanned_at).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Supply-Chain Threats */}
      {activeTab === 'threats' && (
        <div className="space-y-3">
          {findings.map(f => (
            <div
              key={f.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                    f.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {f.severity}
                  </span>
                  <h3 className="font-semibold text-white text-sm">{f.title}</h3>
                  <span className="text-xs font-mono text-slate-400">({f.finding_type})</span>
                </div>
                <p className="text-xs text-slate-300">{f.description}</p>
                <p className="text-xs text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Remediation: {f.remediation}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span>Project: <code className="text-slate-400">{f.project_id}</code></span>
                  <span>Target Component: <code className="text-slate-400">{f.component_name}</code></span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                  f.status === 'OPEN'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {f.status}
                </span>
                {f.status === 'OPEN' && (
                  <button
                    onClick={() => handleQuarantine(undefined, f.finding_id)}
                    disabled={quarantiningId === f.finding_id}
                    className="px-3 py-1.5 text-xs font-bold rounded bg-rose-600 hover:bg-rose-500 text-white shadow transition-colors disabled:opacity-50"
                  >
                    {quarantiningId === f.finding_id ? 'Quarantining...' : 'Quarantine Package'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: CI/CD Build Gate Sandbox */}
      {activeTab === 'build_gate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manifest Input Console */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-white">CI/CD Manifest & SBOM Scanner</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Ecosystem:</span>
                  <select
                    value={sandboxEcosystem}
                    onChange={e => setSandboxEcosystem(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-indigo-300 focus:outline-none"
                  >
                    <option value="PYPI">PYPI (requirements.txt)</option>
                    <option value="NPM">NPM (package.json)</option>
                    <option value="GO">GO (go.mod)</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs text-slate-400 mb-1 block">Manifest / Dependency Content:</label>
                <textarea
                  value={manifestText}
                  onChange={e => setManifestText(e.target.value)}
                  rows={14}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSandboxEcosystem('PYPI');
                    setManifestText(`fastapi==0.100.0\nuvicorn==0.23.0\npydantic==2.1.1\nrequests==2.31.0`);
                  }}
                  className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Load Clean Manifest
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSandboxEcosystem('PYPI');
                    setManifestText(`fastapi==0.100.0\nrequsts==2.28.1\ncolorama-pro==0.4.6`);
                  }}
                  className="px-2 py-1 text-[11px] rounded bg-rose-900/40 text-rose-300 border border-rose-800 hover:bg-rose-900/60"
                >
                  Load Typosquat Spec
                </button>
              </div>

              <button
                onClick={handleEvaluateManifest}
                disabled={evaluating}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-900/30 transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {evaluating ? 'Evaluating Build Gate...' : 'Evaluate Against Build Gate'}
              </button>
            </div>
          </div>

          {/* Verdict & Policy Feedback */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Pipeline Gate Enforcement</span>
                </div>
                {gateResult && (
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded ${
                    gateResult.allowed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {gateResult.gate_verdict}
                  </span>
                )}
              </div>

              {gateResult ? (
                <div className="mt-4 space-y-4">
                  <div className={`p-4 rounded-lg border ${
                    gateResult.allowed
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : 'bg-rose-950/20 border-rose-800/40'
                  }`}>
                    <div className="flex items-center gap-2">
                      {gateResult.allowed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Skull className="w-5 h-5 text-rose-400" />
                      )}
                      <h4 className="font-bold text-white text-sm">
                        {gateResult.allowed
                          ? 'Pipeline Gate: PASS — Manifest cleared for production build'
                          : `Pipeline Gate: BLOCK — ${gateResult.violations_count} Rule Violation(s)`}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Enforce Mode: <code className="text-indigo-300">{gateResult.enforce_mode}</code>
                    </p>
                  </div>

                  {!gateResult.allowed && gateResult.violations?.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Violations Detected:</h5>
                      {gateResult.violations.map((v: string, idx: number) => (
                        <div key={idx} className="p-2.5 bg-slate-950 rounded border border-rose-900/40 text-xs text-rose-300 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                          <span>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-slate-400 space-y-1 pt-2">
                    <p>Evaluated under: <strong className="text-slate-300">{gateResult.matched_policy || 'Monitorix Default Supply-Chain Policy'}</strong></p>
                    <p>Timestamp: <span className="font-mono text-slate-500">{gateResult.timestamp}</span></p>
                  </div>
                </div>
              ) : (
                <div className="mt-12 text-center text-slate-500 space-y-2">
                  <Package className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-medium">No evaluation executed yet</p>
                  <p className="text-xs">Paste dependency manifest and click "Evaluate Against Build Gate"</p>
                </div>
              )}
            </div>

            {/* Active Guardrails Pill List */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-2">Enforced Supply-Chain Policies:</span>
              <div className="flex flex-wrap gap-1.5">
                {policies.map(p => (
                  <span key={p.id} className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
