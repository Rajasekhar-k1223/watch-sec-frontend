import React, { useState, useEffect } from 'react';
import {
  Key, Shield, AlertTriangle, CheckCircle2, RefreshCw,
  Zap, Search, Filter, Lock, Unlock, Terminal, FileCode,
  ShieldAlert, Activity, Check, ExternalLink, Play, Sparkles,
  GitBranch, Server, HardDrive, Cpu, AlertOctagon, RotateCw,
  Layers, Database, Compass, Eye, EyeOff, Hash
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function SecretsSecurity() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'incidents' | 'targets' | 'vaults' | 'scanner'>('incidents');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [overview, setOverview] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [vaults, setVaults] = useState<any[]>([]);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Scanner Sandbox
  const [codeSample, setCodeSample] = useState(
    "import os\n\n# Production AWS credentials leaked in source\nAWS_KEY = \"AKIAIOSFODNN7EXAMPLE\"\nSTRIPE_SECRET = \"sk_live_1234567890abcdef12345678\"\nDB_PASSWORD = \"p@ssw0rdSuperSecret2026!\"\n\ndef get_client():\n    return boto3.client('s3', aws_access_key_id=AWS_KEY)"
  );
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // Actions
  const [remediatingId, setRemediatingId] = useState<string | null>(null);
  const [scanningTargetId, setScanningTargetId] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/secrets/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOverview(await res.json());
    } catch (e) {
      console.error('Failed to load secrets overview', e);
    }
  };

  const fetchIncidents = async () => {
    try {
      let url = `${API_URL}/v2/secrets/incidents`;
      const params = new URLSearchParams();
      if (severityFilter !== 'ALL') params.append('severity', severityFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setIncidents(await res.json());
    } catch (e) {
      console.error('Failed to load incidents', e);
    }
  };

  const fetchTargets = async () => {
    try {
      let url = `${API_URL}/v2/secrets/targets`;
      if (targetTypeFilter !== 'ALL') url += `?target_type=${targetTypeFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTargets(await res.json());
    } catch (e) {
      console.error('Failed to load targets', e);
    }
  };

  const fetchVaults = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/secrets/vaults`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setVaults(await res.json());
    } catch (e) {
      console.error('Failed to load vaults', e);
    }
  };

  const reloadAll = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOverview(),
      fetchIncidents(),
      fetchTargets(),
      fetchVaults()
    ]);
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    reloadAll();
  }, [severityFilter, statusFilter, targetTypeFilter]);

  const handleScanSample = async () => {
    if (!codeSample.trim()) {
      toast.error('Please input code or file sample to scan');
      return;
    }
    setScanning(true);
    try {
      const res = await fetch(`${API_URL}/v2/secrets/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: codeSample, filename: 'source_app.py' })
      });
      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
        if (data.has_secrets) {
          toast.success(`Discovered ${data.secrets_count} exposed secret tokens!`);
        } else {
          toast('No secrets or high-entropy tokens detected.', { icon: '🛡️' });
        }
      } else {
        toast.error('Scanning failed');
      }
    } catch (e) {
      toast.error('Error executing secret scan');
    } finally {
      setScanning(false);
    }
  };

  const handleRemediate = async (incidentId: string, action: string) => {
    setRemediatingId(incidentId);
    try {
      const res = await fetch(`${API_URL}/v2/secrets/remediate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ incident_id: incidentId, action })
      });
      if (res.ok) {
        toast.success(`Incident ${incidentId} neutralized via ${action}!`);
        reloadAll();
      } else {
        toast.error('Failed to remediate secret');
      }
    } catch (e) {
      toast.error('Error contacting remediation service');
    } finally {
      setRemediatingId(null);
    }
  };

  const handleTriggerTargetScan = async (targetId: string) => {
    setScanningTargetId(targetId);
    try {
      const res = await fetch(`${API_URL}/v2/secrets/targets/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ target_id: targetId })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Scan completed for ${data.target_name}!`);
        reloadAll();
      } else {
        toast.error('Target scan failed');
      }
    } catch (e) {
      toast.error('Error triggering target scan');
    } finally {
      setScanningTargetId(null);
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    if (!searchQuery) return true;
    return (
      inc.incident_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.secret_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.location_file.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.target_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-rose-600/20 rounded-xl border border-amber-500/30">
              <Key className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Secrets Security & Vault Governance
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  WAVE 1.6
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ACTIVE ENFORCING
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Hardcoded Credential Detection, Shannon Entropy Analysis & Automated Enterprise Vault Rotation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reloadAll}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-sm font-medium transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Posture Score */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Secrets Posture</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {overview?.secrets_posture_score ?? '--'}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-2 text-xs text-amber-400/90 flex items-center gap-1 font-medium">
            <Activity className="w-3.5 h-3.5" />
            {(overview?.secrets_posture_score ?? 0) >= 70 ? 'Optimal Guard' : 'High Secret Risk'}
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Exposed Secrets */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Exposed Secrets</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {overview?.total_exposed_secrets ?? '--'}
            </span>
            <span className="text-xs text-slate-400">open leaks</span>
          </div>
          <div className="mt-2 text-xs text-rose-400 flex items-center gap-1 font-medium">
            <AlertOctagon className="w-3.5 h-3.5" />
            {overview?.critical_secrets_count ?? 0} Critical (Cloud & Live Keys)
          </div>
        </div>

        {/* Vault Managed */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vault Coverage</span>
            <Lock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {overview?.vault_managed_pct ?? '--'}%
            </span>
            <span className="text-xs text-slate-400">managed</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>{vaults.length} Connected Vault Clusters</span>
          </div>
        </div>

        {/* Scanned Targets */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Scan Perimeter</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {overview?.total_targets_scanned ?? '--'}
            </span>
            <span className="text-xs text-slate-400">repos & hosts</span>
          </div>
          <div className="mt-2 text-xs text-amber-400 flex items-center gap-1 font-medium">
            <span>{overview?.high_risk_targets_count ?? 0} Elevated Risk Targets</span>
          </div>
        </div>

        {/* Shannon Entropy */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Shannon Analysis</span>
            <Hash className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400">
              Active
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>Randomness Threshold: &gt; 4.0 bits</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-1">
        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'incidents'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Key className="w-4 h-4" />
          Exposed Secrets & Incidents
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-rose-900/50 text-rose-300 border border-rose-800/50">
            {incidents.filter(i => i.status === 'OPEN').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('targets')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'targets'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Repositories & Scan Targets
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
            {targets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('vaults')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'vaults'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Lock className="w-4 h-4" />
          Enterprise Vault Integrations
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
            {vaults.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'scanner'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          Real-Time Code Scanner
        </button>
      </div>

      {/* Tab 1: Incidents */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by file, type, incident ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open Leaks</option>
                <option value="REVOKED">Revoked</option>
                <option value="ROTATED">Rotated</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Incident & Type</th>
                  <th className="py-3 px-4">Location & Line</th>
                  <th className="py-3 px-4">Masked Secret</th>
                  <th className="py-3 px-4">Entropy</th>
                  <th className="py-3 px-4">Vault Status</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Automated Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredIncidents.map(inc => (
                  <tr key={inc.incident_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60">
                          <Key className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            {inc.secret_type.replace(/_/g, ' ')}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inc.severity === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {inc.severity}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {inc.incident_id} • Target: {inc.target_id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-slate-300 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-slate-400" />
                        {inc.location_file}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        Line: <span className="text-indigo-400 font-semibold">{inc.line_number}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-rose-400 font-semibold">
                        {inc.masked_secret}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white font-mono">{inc.entropy_score}</span>
                        <span className="text-[10px] text-slate-400">bits</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {inc.is_vault_managed ? (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1 w-fit">
                          <Lock className="w-3 h-3" /> Vault Managed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 w-fit">
                          <Unlock className="w-3 h-3" /> Unmanaged Leak
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        inc.status === 'OPEN'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {inc.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {inc.status === 'OPEN' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRemediate(inc.incident_id, 'REVOKE_KEY')}
                            disabled={remediatingId === inc.incident_id}
                            className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
                          >
                            Revoke
                          </button>
                          <button
                            onClick={() => handleRemediate(inc.incident_id, 'VAULT_ROTATE')}
                            disabled={remediatingId === inc.incident_id}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1"
                          >
                            <RotateCw className="w-3 h-3" />
                            Rotate Vault
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-400 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Neutralized
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

      {/* Tab 2: Targets */}
      {activeTab === 'targets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {targets.map(target => (
              <div
                key={target.target_id}
                className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-400">{target.target_id}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {target.target_type}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-2">{target.name}</h3>
                  <div className="text-xs text-slate-400 font-mono mt-1 truncate">
                    {target.location_path}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                      <div className="text-slate-400">Environment</div>
                      <div className="text-white font-bold mt-0.5">{target.environment}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                      <div className="text-slate-400">Exposed Secrets</div>
                      <div className={`font-bold mt-0.5 ${target.secrets_found_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {target.secrets_found_count} secrets
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Risk Score:</span>
                    <span className={`text-sm font-bold ${target.risk_score >= 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {target.risk_score}
                    </span>
                  </div>

                  <button
                    onClick={() => handleTriggerTargetScan(target.target_id)}
                    disabled={scanningTargetId === target.target_id}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${scanningTargetId === target.target_id ? 'animate-spin' : ''}`} />
                    Trigger Scan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Vault Integrations */}
      {activeTab === 'vaults' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vaults.map(vault => (
            <div
              key={vault.vault_id}
              className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {vault.provider}
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {vault.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{vault.name}</h3>
                <div className="text-xs text-slate-400 font-mono mt-1 truncate">
                  {vault.endpoint_url}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-xs flex justify-between items-baseline">
                <span className="text-slate-400">Synced Secrets:</span>
                <span className="text-xl font-bold text-white">{vault.synced_secrets_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Interactive Code Scanner */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Real-Time Secret & Shannon Entropy Inspection Engine
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Scan source code, environment configs, or build scripts for API keys, cloud tokens, private certificates, and high-entropy passwords.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-slate-400 font-medium py-1">Quick Presets:</span>
              <button
                onClick={() => setCodeSample("export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nexport GITHUB_TOKEN=ghp_abcdef1234567890abcdef12345678901234")}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                AWS AKIA + GitHub PAT
              </button>
              <button
                onClick={() => setCodeSample("stripe_secret = 'sk_live_1234567890abcdef12345678'\nopenai_key = 'sk-proj-abc1234567890abcdef1234567890abcdef1234567890'")}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Stripe & OpenAI Keys
              </button>
              <button
                onClick={() => setCodeSample("-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0w9Z8x...\n-----END RSA PRIVATE KEY-----")}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                RSA Private Key
              </button>
              <button
                onClick={() => setCodeSample("db_password = 'P@ssw0rdSuperRandomSecret#2026!'\njwt_secret = 'super_secret_jwt_hmac_signing_key_2026'")}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                High-Entropy Password & JWT Secret
              </button>
            </div>

            <textarea
              rows={6}
              value={codeSample}
              onChange={e => setCodeSample(e.target.value)}
              placeholder="Paste code or configuration file content..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-500"
            />

            <div className="flex justify-end">
              <button
                onClick={handleScanSample}
                disabled={scanning}
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-amber-950"
              >
                <Play className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                Scan Code for Secrets
              </button>
            </div>
          </div>

          {scanResult && (
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${scanResult.has_secrets ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <h4 className="text-base font-bold text-white">
                    Inspection Outcome: {scanResult.has_secrets ? `${scanResult.secrets_count} Secret(s) Found` : 'Clean (No Secrets Detected)'}
                  </h4>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Scanned: {scanResult.scanned_lines} lines
                </span>
              </div>

              {scanResult.detections && scanResult.detections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {scanResult.detections.map((d: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400">{d.secret_type.replace(/_/g, ' ')}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {d.severity}
                        </span>
                      </div>
                      <div className="text-slate-300">{d.description}</div>
                      <div className="text-slate-400 font-mono text-[11px] flex justify-between">
                        <span>Line: <span className="text-white font-bold">{d.line_number}</span></span>
                        <span>Entropy: <span className="text-emerald-400 font-bold">{d.entropy_score} bits</span></span>
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        Masked Token: <span className="text-rose-400 font-bold">{d.masked_snippet}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  Zero hardcoded secrets, API tokens, or high-entropy credentials detected.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
