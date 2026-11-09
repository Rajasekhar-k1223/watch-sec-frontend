import React, { useState, useEffect } from 'react';
import {
  Cloud, Shield, Server, AlertTriangle, CheckCircle2, RefreshCw,
  Zap, Search, Filter, ArrowRight, Lock, Eye, Network, Terminal,
  Radio, ShieldAlert, Cpu, Activity, Ban, RotateCcw, Share2, Layers,
  Compass, AlertOctagon, HelpCircle, HardDrive, Key, Globe, Database,
  Check, ExternalLink, Play
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function CloudSecurityCnapp() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'cspm' | 'inventory' | 'threats' | 'paths' | 'simulator'>('cspm');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Core Data
  const [overview, setOverview] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [misconfigs, setMisconfigs] = useState<any[]>([]);
  const [threats, setThreats] = useState<any[]>([]);
  const [attackPaths, setAttackPaths] = useState<any[]>([]);

  // Filters
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [resourceSearch, setResourceSearch] = useState<string>('');

  // Simulator Form
  const [simEventName, setSimEventName] = useState('PutBucketAcl');
  const [simProvider, setSimProvider] = useState('AWS');
  const [simPrincipal, setSimPrincipal] = useState('arn:aws:iam::112233445566:user/devops-ci');
  const [simResource, setSimResource] = useState('corp-customer-backups-2026');
  const [simSourceIp, setSimSourceIp] = useState('198.51.100.44');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Remediation
  const [remediatingId, setRemediatingId] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/cnapp/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOverview(await res.json());
    } catch (e) {
      console.error('Failed to load CNAPP overview', e);
    }
  };

  const fetchAccounts = async () => {
    try {
      let url = `${API_URL}/v2/cnapp/accounts`;
      if (providerFilter !== 'ALL') url += `?provider=${providerFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAccounts(await res.json());
    } catch (e) {
      console.error('Failed to load accounts', e);
    }
  };

  const fetchResources = async () => {
    try {
      let url = `${API_URL}/v2/cnapp/resources`;
      if (providerFilter !== 'ALL') url += `?provider=${providerFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setResources(await res.json());
    } catch (e) {
      console.error('Failed to load resources', e);
    }
  };

  const fetchMisconfigs = async () => {
    try {
      let url = `${API_URL}/v2/cnapp/misconfigurations`;
      const params = [];
      if (providerFilter !== 'ALL') params.push(`provider=${providerFilter}`);
      if (severityFilter !== 'ALL') params.push(`severity=${severityFilter}`);
      if (params.length) url += `?${params.join('&')}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMisconfigs(await res.json());
    } catch (e) {
      console.error('Failed to load misconfigurations', e);
    }
  };

  const fetchThreats = async () => {
    try {
      let url = `${API_URL}/v2/cnapp/threats`;
      if (providerFilter !== 'ALL') url += `?provider=${providerFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setThreats(await res.json());
    } catch (e) {
      console.error('Failed to load threats', e);
    }
  };

  const fetchAttackPaths = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/cnapp/paths`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAttackPaths(await res.json());
    } catch (e) {
      console.error('Failed to load attack paths', e);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOverview(),
      fetchAccounts(),
      fetchResources(),
      fetchMisconfigs(),
      fetchThreats(),
      fetchAttackPaths()
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchOverview(),
        fetchAccounts(),
        fetchResources(),
        fetchMisconfigs(),
        fetchThreats(),
        fetchAttackPaths()
      ]);
      setLoading(false);
    };
    init();
  }, [providerFilter, severityFilter]);

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const res = await fetch(`${API_URL}/v2/cnapp/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`CSPM Scan Complete: ${data.scanned_accounts_count} accounts audited against CIS benchmarks.`);
        refreshAll();
      } else {
        toast.error('Scan failed');
      }
    } catch (e: any) {
      toast.error('Scan error: ' + e.message);
    } finally {
      setScanning(false);
    }
  };

  const handleRemediate = async (findingId: string) => {
    setRemediatingId(findingId);
    try {
      const res = await fetch(`${API_URL}/v2/cnapp/remediate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ finding_id: findingId })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.remediation_summary || 'Misconfiguration remediated successfully!');
        refreshAll();
      } else {
        toast.error(data.detail || 'Remediation failed');
      }
    } catch (e: any) {
      toast.error('Remediation error: ' + e.message);
    } finally {
      setRemediatingId(null);
    }
  };

  const handleSimulateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimResult(null);
    try {
      const payload: any = {
        event_name: simEventName,
        provider: simProvider,
        principal_arn: simPrincipal,
        resource_name: simResource,
        source_ip: simSourceIp
      };
      if (simEventName === 'PutBucketAcl') {
        payload.grant = 'allUsers';
      }
      if (simEventName === 'RunInstances') {
        payload.instance_type = 'p3.16xlarge';
      }

      const res = await fetch(`${API_URL}/v2/cnapp/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setSimResult(data);
      if (data.threat_detected) {
        toast.error(`Cloud Threat Detected: ${data.threat_type} (${data.mitre})`);
      } else {
        toast.success('Cloud telemetry normal. No anomaly detected.');
      }
      fetchThreats();
      fetchOverview();
    } catch (err: any) {
      toast.error('Simulation failed: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  const filteredResources = resources.filter(r => {
    if (!resourceSearch) return true;
    const s = resourceSearch.toLowerCase();
    return (
      r.resource_name?.toLowerCase().includes(s) ||
      r.resource_id?.toLowerCase().includes(s) ||
      r.resource_type?.toLowerCase().includes(s) ||
      r.provider?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Cloud Security, CNAPP & CSPM</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Multi-Cloud Active
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                  AWS • AZURE • GCP
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-0.5">
                Cloud Security Posture Management, Cloud Workload Protection (CWPP), CIS Benchmarks, and Cloud Threat Detection.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium border border-gray-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleRunScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium shadow-lg shadow-cyan-600/20 transition"
          >
            <Play className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            Run CIS Benchmark Audit
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Compliance Posture Score */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Multi-Cloud Posture</span>
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.cloud_posture_score !== undefined ? `${overview.cloud_posture_score}` : '--'}
            </span>
            <span className="text-xs font-medium text-gray-400">/ 100</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (overview?.cloud_posture_score || 0) > 80
                  ? 'bg-emerald-500'
                  : (overview?.cloud_posture_score || 0) > 65
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${overview?.cloud_posture_score || 75}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">CIS Multi-Cloud Benchmark Rating</p>
        </div>

        {/* Monitored Accounts & Resources */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cloud Workloads</span>
            <Server className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.total_cloud_resources || 0}
            </span>
            <span className="text-xs font-medium text-cyan-400">
              ({overview?.monitored_accounts_count || 0} Accounts)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <span className="text-emerald-400 font-semibold">{accounts.length} Active Clouds</span>
            <span>•</span>
            <span>Containers, VMs & S3</span>
          </div>
        </div>

        {/* Publicly Exposed Storage & Ports */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Exposed Assets</span>
            <Globe className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">
              {overview?.publicly_exposed_assets || 0}
            </span>
            <span className="text-xs font-medium text-gray-400">Public Ingress / Buckets</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
              S3 / Blob Public ACL
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              Open SSH 0.0.0.0/0
            </span>
          </div>
        </div>

        {/* Misconfigurations & Findings */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Open CSPM Findings</span>
            <AlertOctagon className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.open_misconfigurations_count || 0}
            </span>
            <span className="text-xs font-medium text-gray-400">
              ({overview?.finding_severities?.CRITICAL || 0} Critical)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-amber-400 font-medium">
            <span>{overview?.remediated_findings_count || 0} Remediated</span>
            <span>•</span>
            <span>{overview?.active_threats_count || 0} Active CDR Threats</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('cspm')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'cspm'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          CSPM Misconfigurations ({misconfigs.filter(m => m.status === 'OPEN').length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'inventory'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Server className="w-4 h-4" />
          Cloud Workload Inventory (CWPP) ({resources.length})
        </button>
        <button
          onClick={() => setActiveTab('threats')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'threats'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Cloud Threats & Anomaly Ingestion ({threats.length})
        </button>
        <button
          onClick={() => setActiveTab('paths')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'paths'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Network className="w-4 h-4" />
          Cloud Attack Paths ({attackPaths.length})
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'simulator'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Cloud Event Simulator
        </button>
      </div>

      {/* Provider Selector Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-400 uppercase">Provider Filter:</span>
        {['ALL', 'AWS', 'AZURE', 'GCP'].map(p => (
          <button
            key={p}
            onClick={() => setProviderFilter(p)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
              providerFilter === p
                ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* TAB 1: CSPM MISCONFIGURATIONS */}
      {activeTab === 'cspm' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">Severity:</span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(s => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={`px-2.5 py-0.5 rounded text-xs font-medium border transition ${
                    severityFilter === s
                      ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400">
              Showing {misconfigs.length} CSPM audit findings
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {misconfigs.map(f => (
              <div
                key={f.finding_id}
                className={`p-5 rounded-xl bg-gray-900/90 border transition ${
                  f.status === 'REMEDIATED'
                    ? 'border-gray-800 opacity-60'
                    : f.severity === 'CRITICAL'
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : 'border-amber-500/30 bg-amber-950/10'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2 rounded-lg border mt-0.5 ${
                      f.status === 'REMEDIATED'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : f.severity === 'CRITICAL'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}>
                      {f.status === 'REMEDIATED' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-gray-300">{f.finding_id}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          f.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {f.severity}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {f.provider}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {f.benchmark} ({f.rule_id})
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          f.status === 'REMEDIATED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {f.status}
                        </span>
                      </div>

                      <h3 className="mt-1 text-sm font-bold text-white">{f.title}</h3>
                      <p className="mt-1 text-xs text-gray-300">{f.description}</p>

                      <div className="mt-2.5 flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span>
                          <strong className="text-gray-300">Target Asset:</strong> {f.resource_id}
                        </span>
                        <span>•</span>
                        <span className="text-cyan-400">
                          <strong>Remediation:</strong> {f.remediation_step}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {f.status !== 'REMEDIATED' && (
                      <button
                        onClick={() => handleRemediate(f.finding_id)}
                        disabled={remediatingId === f.finding_id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md shadow-emerald-600/20 transition"
                      >
                        {remediatingId === f.finding_id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        1-Click Remediate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CLOUD WORKLOAD INVENTORY (CWPP) */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search workloads, S3 buckets, VMs..."
                value={resourceSearch}
                onChange={e => setResourceSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="text-xs text-gray-400">
              Showing {filteredResources.length} cloud assets
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/60">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-950/80 text-xs uppercase text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Asset / Workload</th>
                  <th className="px-4 py-3 font-semibold">Cloud Provider</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Region</th>
                  <th className="px-4 py-3 font-semibold">Risk Score</th>
                  <th className="px-4 py-3 font-semibold">Public Exposure</th>
                  <th className="px-4 py-3 font-semibold">Posture Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredResources.map(r => (
                  <tr key={r.resource_id} className="hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{r.resource_name}</div>
                      <div className="font-mono text-[11px] text-gray-500 truncate max-w-sm">{r.resource_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {r.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300 font-mono">
                      {r.resource_type}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {r.region}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold ${
                          r.risk_score >= 70 ? 'text-rose-400' : r.risk_score >= 40 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {r.risk_score}
                        </span>
                        <div className="w-16 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              r.risk_score >= 70 ? 'bg-rose-500' : r.risk_score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${r.risk_score}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {r.is_publicly_exposed ? (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
                          <Globe className="w-3 h-3" />
                          Public Ingress
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Private VPC</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.has_critical_misconfig ? (
                        <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Misconfigured
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Protected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CLOUD THREATS & CDR */}
      {activeTab === 'threats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {threats.map(t => (
              <div key={t.threat_id} className="p-5 rounded-xl bg-gray-900 border border-gray-800">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-gray-300">{t.threat_id}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {t.severity}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {t.threat_type}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          MITRE {t.mitre_technique} ({t.mitre_tactic})
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-200">
                        {t.details?.indicator || t.details?.reason || 'Cloud threat pattern identified.'}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                        <span><strong>Event Source:</strong> {t.event_source}</span>
                        <span>•</span>
                        <span><strong>Principal:</strong> {t.principal_arn}</span>
                        <span>•</span>
                        <span><strong>Source IP:</strong> {t.source_ip}</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MULTI-CLOUD ATTACK PATHS */}
      {activeTab === 'paths' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Network className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">Multi-Cloud Crown Jewel Kill-Chains</h3>
                <p className="text-xs text-gray-400">
                  Maps multi-step ingress attack paths leading to sensitive cloud databases and storage buckets.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold text-xs">
              Crown Jewels At Risk
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {attackPaths.map((p, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-gray-900 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-cyan-400 font-bold">{p.path_id}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300">
                      Risk Score {p.risk_score} ({p.hops_count} Hops)
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{p.provider} Account: {p.account_id}</span>
                </div>

                <p className="text-xs text-gray-300 mb-4">{p.risk_description}</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {p.steps?.map((s: any, sIdx: number) => (
                    <div key={sIdx} className="p-3 rounded-lg bg-gray-800/80 border border-gray-700 relative">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase">Hop #{s.hop}</span>
                      <div className="text-xs font-bold text-white mt-0.5 truncate">{s.asset}</div>
                      <div className="text-[11px] text-gray-400 mt-1">{s.action}</div>
                      {sIdx < p.steps.length - 1 && (
                        <div className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-cyan-400">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CLOUD TELEMETRY SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Cloud Event Ingestion Simulator</h2>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Simulate live AWS CloudTrail, Azure Activity, and GCP Audit Log events through Monitorix real-time threat detection heuristics.
            </p>

            <form onSubmit={handleSimulateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Event Template</label>
                <select
                  value={simEventName}
                  onChange={e => {
                    const val = e.target.value;
                    setSimEventName(val);
                    if (val === 'PutBucketAcl') {
                      setSimProvider('AWS');
                      setSimPrincipal('arn:aws:iam::112233445566:user/devops-ci');
                      setSimResource('corp-customer-backups-2026');
                    } else if (val === 'StopLogging') {
                      setSimProvider('AWS');
                      setSimPrincipal('arn:aws:iam::112233445566:user/admin-breakglass');
                      setSimResource('arn:aws:cloudtrail:us-east-1:trail/security-trail-primary');
                    } else if (val === 'CreateAccessKey') {
                      setSimProvider('AWS');
                      setSimPrincipal('arn:aws:iam::112233445566:user/unauthorized-api');
                      setSimResource('arn:aws:iam::112233445566:user/admin-inactive');
                    } else if (val === 'RunInstances') {
                      setSimProvider('AWS');
                      setSimPrincipal('arn:aws:iam::112233445566:user/compromised-worker');
                      setSimResource('Instance: p3.16xlarge (GPU Miner)');
                    }
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="PutBucketAcl">PutBucketAcl (S3 Bucket Public ACL Modification)</option>
                  <option value="StopLogging">StopLogging (CloudTrail Audit Log Tampering)</option>
                  <option value="CreateAccessKey">CreateAccessKey (IAM Backdoor Credential Creation)</option>
                  <option value="RunInstances">RunInstances (High-Cost Crypto Mining GPU Provisioning)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Cloud Provider</label>
                  <select
                    value={simProvider}
                    onChange={e => setSimProvider(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="AWS">AWS</option>
                    <option value="AZURE">Azure</option>
                    <option value="GCP">GCP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Source IP Address</label>
                  <input
                    type="text"
                    value={simSourceIp}
                    onChange={e => setSimSourceIp(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Principal ARN / Identity</label>
                <input
                  type="text"
                  value={simPrincipal}
                  onChange={e => setSimPrincipal(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Resource Name</label>
                <input
                  type="text"
                  value={simResource}
                  onChange={e => setSimResource(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={simulating}
                className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Ingest & Evaluate Telemetry
              </button>
            </form>
          </div>

          <div className="p-6 rounded-xl bg-gray-950 border border-gray-800 font-mono flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <span className="text-xs text-gray-400 uppercase font-semibold">CDR Heuristic Result</span>
                {simResult?.threat_detected ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    THREAT DETECTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-800 text-gray-400">
                    NORMAL
                  </span>
                )}
              </div>

              <div className="mt-4 text-xs text-gray-300 space-y-2 overflow-auto max-h-[380px]">
                {simResult ? (
                  <pre className="text-cyan-400 text-xs bg-gray-900/90 p-4 rounded-lg border border-gray-800 overflow-x-auto">
                    {JSON.stringify(simResult, null, 2)}
                  </pre>
                ) : (
                  <div className="text-gray-600 italic py-16 text-center">
                    Trigger telemetry ingestion on the left to evaluate cloud events through Monitorix CDR heuristics.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
