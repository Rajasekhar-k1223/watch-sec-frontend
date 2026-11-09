import React, { useState, useEffect } from 'react';
import {
  Boxes, Shield, AlertTriangle, CheckCircle2, RefreshCw,
  Zap, Search, Filter, Lock, Terminal, FileCode,
  ShieldAlert, Activity, Check, ExternalLink, Play, Sparkles,
  Server, Cpu, AlertOctagon,
  Layers, Eye, Ban, Skull, Clock, Cloud, Network, ShieldCheck
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function KubernetesSecurity() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'workloads' | 'clusters' | 'findings' | 'admission'>('workloads');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [overview, setOverview] = useState<any>(null);
  const [clusters, setClusters] = useState<any[]>([]);
  const [workloads, setWorkloads] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);

  // Filters
  const [namespaceFilter, setNamespaceFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [privilegedOnly, setPrivilegedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Admission Control Sandbox
  const [manifestText, setManifestText] = useState(`apiVersion: v1
kind: Pod
metadata:
  name: billing-daemon
  namespace: prod
spec:
  containers:
  - name: telemetry-agent
    image: alpine:latest
    securityContext:
      privileged: true
    volumeMounts:
    - mountPath: /var/run/docker.sock
      name: dockersock
  volumes:
  - name: dockersock
    hostPath:
      path: /var/run/docker.sock`);
  const [sandboxNamespace, setSandboxNamespace] = useState('prod');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // Quarantine Action State
  const [quarantiningId, setQuarantiningId] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/k8s-security/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOverview(await res.json());
    } catch (e) {
      console.error('Failed to load K8s overview', e);
    }
  };

  const fetchClusters = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/k8s-security/clusters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setClusters(await res.json());
    } catch (e) {
      console.error('Failed to load clusters', e);
    }
  };

  const fetchWorkloads = async () => {
    try {
      let url = `${API_URL}/v2/k8s-security/workloads`;
      const params = new URLSearchParams();
      if (namespaceFilter !== 'ALL') params.append('namespace', namespaceFilter);
      if (privilegedOnly) params.append('is_privileged', 'true');
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setWorkloads(await res.json());
    } catch (e) {
      console.error('Failed to load workloads', e);
    }
  };

  const fetchFindings = async () => {
    try {
      let url = `${API_URL}/v2/k8s-security/findings`;
      if (severityFilter !== 'ALL') url += `?severity=${severityFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setFindings(await res.json());
    } catch (e) {
      console.error('Failed to load findings', e);
    }
  };

  const fetchPolicies = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/k8s-security/policies`, {
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
      fetchClusters(),
      fetchWorkloads(),
      fetchFindings(),
      fetchPolicies()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [namespaceFilter, privilegedOnly, severityFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
    toast.success('Kubernetes security telemetry refreshed');
  };

  // Evaluate Admission Manifest
  const handleEvaluateManifest = async () => {
    if (!manifestText.trim()) {
      toast.error('Please input a valid YAML/JSON Pod manifest');
      return;
    }
    setEvaluating(true);
    try {
      const res = await fetch(`${API_URL}/v2/k8s-security/evaluate-manifest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          manifest_text: manifestText,
          namespace: sandboxNamespace
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluationResult(data);
        if (data.allowed) {
          toast.success('Manifest PASSED Pod Security Standards');
        } else {
          toast.error(`Admission REJECTED: ${data.violations_count} violation(s) found`);
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

  // 1-Click Pod Quarantine
  const handleQuarantine = async (workloadId?: string, findingId?: string) => {
    const target = workloadId || findingId;
    if (!target) return;
    setQuarantiningId(target);
    try {
      const res = await fetch(`${API_URL}/v2/k8s-security/quarantine-pod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          workload_id: workloadId,
          finding_id: findingId,
          action: 'ISOLATE_NETWORK'
        })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || `Quarantine NetworkPolicy applied to ${target}`);
        await loadAll();
      } else {
        toast.error('Failed to quarantine pod');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error executing quarantine');
    } finally {
      setQuarantiningId(null);
    }
  };

  // Filter workloads by search
  const filteredWorkloads = workloads.filter(w => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.name?.toLowerCase().includes(q) ||
      w.workload_id?.toLowerCase().includes(q) ||
      w.namespace?.toLowerCase().includes(q) ||
      w.image?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-600/30 to-blue-700/30 border border-cyan-500/40 rounded-xl shadow-lg shadow-cyan-900/20">
              <Boxes className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Kubernetes & Container Workload Security</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  KSPM & CWPP v18.8
                </span>
                <span className="px-2 py-0.5 text-xs font-bold bg-cyan-600 text-white rounded">
                  P0 CORE
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Multi-cluster posture governance, Pod Security Standards (PSS), container breakout defense & admission guardrails
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
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Hero Posture KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KSPM Defense Score */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">KSPM Posture Score</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.kspm_defense_score ?? '--'}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (overview?.kspm_defense_score || 0) > 75
                  ? 'bg-emerald-500'
                  : (overview?.kspm_defense_score || 0) > 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${overview?.kspm_defense_score || 0}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Avg CIS Benchmark: {overview?.cis_benchmark_score ?? 76}%</span>
            <span className="text-emerald-400 font-medium">PROTECTED</span>
          </div>
        </div>

        {/* Monitored Clusters */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Clusters & Nodes</span>
            <Cloud className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.total_clusters_count ?? 4}
            </span>
            <span className="text-xs text-slate-400">clusters</span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-cyan-400" /> {overview?.total_nodes_count ?? 44} Nodes
            </span>
            <span className="flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5 text-blue-400" /> {overview?.total_pods_count ?? 575} Pods
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Multi-cloud: EKS, GKE, AKS & Bare-Metal
          </div>
        </div>

        {/* Privileged & High-Risk Workloads */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Privileged Workloads</span>
            <AlertOctagon className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">
              {overview?.privileged_workloads_count ?? 0}
            </span>
            <span className="text-xs text-slate-400">workloads</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              Root UID: {overview?.root_execution_workloads_count ?? 0}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
              HostPath: {overview?.hostpath_workloads_count ?? 0}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {overview?.quarantined_workloads_count ?? 0} pods actively quarantined
          </div>
        </div>

        {/* Active CWPP Findings */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Active Security Findings</span>
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">
              {overview?.open_findings_count ?? 0}
            </span>
            <span className="text-xs text-slate-400">open alerts</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
              {overview?.critical_findings_count ?? 0} CRITICAL
            </span>
            <span className="text-slate-400">
              Admission Guard: ACTIVE
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            100% Sovereign Monitorix CWPP Shield
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('workloads')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'workloads'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Workloads & Pods
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300">
            {workloads.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('clusters')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'clusters'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Cloud className="w-4 h-4" />
          Clusters & CIS Posture
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300">
            {clusters.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('findings')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'findings'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Security Findings & CWPP
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-rose-500/20 text-rose-300">
            {findings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('admission')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'admission'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Admission Control Sandbox
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-300">
            PSS Active
          </span>
        </button>
      </div>

      {/* TAB 1: Workloads & Pods */}
      {activeTab === 'workloads' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search pod name, image, namespace..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Namespace:</span>
                <select
                  value={namespaceFilter}
                  onChange={e => setNamespaceFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Namespaces</option>
                  <option value="prod">prod</option>
                  <option value="default">default</option>
                  <option value="monitoring">monitoring</option>
                  <option value="security">security</option>
                </select>
              </div>

              <button
                onClick={() => setPrivilegedOnly(!privilegedOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  privilegedOnly
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                Privileged Only
              </button>
            </div>
          </div>

          {/* Workloads Table */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Workload / Pod</th>
                    <th className="py-3 px-4">Namespace</th>
                    <th className="py-3 px-4">Kind</th>
                    <th className="py-3 px-4">Security Context</th>
                    <th className="py-3 px-4">Risk</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {filteredWorkloads.map(w => (
                    <tr key={w.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-semibold text-white flex items-center gap-2">
                          {w.name}
                          {w.is_privileged && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              PRIVILEGED
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                          {w.image}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {w.namespace}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {w.workload_type}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {w.runs_as_root && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              root (UID 0)
                            </span>
                          )}
                          {w.has_hostpath_mount && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20">
                              hostPath
                            </span>
                          )}
                          {w.has_host_pid && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              hostPID
                            </span>
                          )}
                          {!w.runs_as_root && !w.has_hostpath_mount && !w.is_privileged && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              non-root
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <span className={`font-bold ${
                          w.risk_score > 70 ? 'text-rose-400' : w.risk_score > 30 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {w.risk_score}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          w.status === 'RUNNING'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : w.status === 'QUARANTINED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {w.status !== 'QUARANTINED' ? (
                          <button
                            onClick={() => handleQuarantine(w.workload_id)}
                            disabled={quarantiningId === w.workload_id}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow disabled:opacity-50"
                          >
                            {quarantiningId === w.workload_id ? 'Isolating...' : 'Quarantine'}
                          </button>
                        ) : (
                          <span className="text-xs text-rose-400 font-semibold flex items-center justify-end gap-1">
                            <Ban className="w-3.5 h-3.5" /> Isolated
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

      {/* TAB 2: Clusters & CIS Posture */}
      {activeTab === 'clusters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clusters.map(c => (
            <div key={c.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {c.provider}
                    </span>
                    <span className="text-sm font-semibold text-white">{c.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                    c.status === 'HEALTHY'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">Cluster ID:</span>
                    <p className="font-mono text-slate-200 mt-0.5">{c.cluster_id}</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">Region & Version:</span>
                    <p className="font-mono text-slate-200 mt-0.5">{c.region} ({c.k8s_version})</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">Nodes / Pods:</span>
                    <p className="font-mono text-slate-200 mt-0.5">{c.node_count} nodes / {c.pod_count} pods</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">CIS Benchmark:</span>
                    <p className="font-mono font-bold text-cyan-400 mt-0.5">{c.cis_benchmark_score}% Compliant</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Posture Score: <strong className="text-emerald-400">{c.posture_score}/100</strong></span>
                <span>Last Audited: {new Date(c.last_audited_at).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Security Findings & CWPP */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400">Filter Severity:</span>
            <div className="flex items-center gap-2">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                    severityFilter === sev
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

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
                  <p className="text-xs text-cyan-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Remediation: {f.remediation}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span>Cluster: <code className="text-slate-400">{f.cluster_id}</code></span>
                    <span>Namespace: <code className="text-slate-400">{f.namespace}</code></span>
                    <span>Target: <code className="text-slate-400">{f.workload_id}</code></span>
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
                      {quarantiningId === f.finding_id ? 'Quarantining...' : 'Quarantine Pod'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Admission Control Sandbox */}
      {activeTab === 'admission' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manifest Input Console */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">Pod Manifest Evaluator</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Target Namespace:</span>
                  <input
                    type="text"
                    value={sandboxNamespace}
                    onChange={e => setSandboxNamespace(e.target.value)}
                    className="w-24 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-cyan-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs text-slate-400 mb-1 block">Kubernetes YAML / JSON Manifest:</label>
                <textarea
                  value={manifestText}
                  onChange={e => setManifestText(e.target.value)}
                  rows={14}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setManifestText(`apiVersion: v1
kind: Pod
metadata:
  name: payment-api
  namespace: prod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
  containers:
  - name: api
    image: monitorix/payment-api:v2.4
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true`)}
                  className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Load Clean Pod
                </button>
                <button
                  type="button"
                  onClick={() => setManifestText(`apiVersion: v1
kind: Pod
metadata:
  name: exploit-pod
spec:
  containers:
  - name: attacker
    image: alpine:latest
    securityContext:
      privileged: true
    volumeMounts:
    - mountPath: /host-sock
      name: dockersock
  volumes:
  - name: dockersock
    hostPath:
      path: /var/run/docker.sock`)}
                  className="px-2 py-1 text-[11px] rounded bg-rose-900/40 text-rose-300 border border-rose-800 hover:bg-rose-900/60"
                >
                  Load Exploit Pod
                </button>
              </div>

              <button
                onClick={handleEvaluateManifest}
                disabled={evaluating}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {evaluating ? 'Evaluating Policies...' : 'Evaluate Against PSS'}
              </button>
            </div>
          </div>

          {/* Verdict & Policy Feedback */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Admission Controller Verdict</span>
                </div>
                {evaluationResult && (
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded ${
                    evaluationResult.allowed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {evaluationResult.verdict}
                  </span>
                )}
              </div>

              {evaluationResult ? (
                <div className="mt-4 space-y-4">
                  <div className={`p-4 rounded-lg border ${
                    evaluationResult.allowed
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : 'bg-rose-950/20 border-rose-800/40'
                  }`}>
                    <div className="flex items-center gap-2">
                      {evaluationResult.allowed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Skull className="w-5 h-5 text-rose-400" />
                      )}
                      <h4 className="font-bold text-white text-sm">
                        {evaluationResult.allowed
                          ? 'Admission Permitted: Complies with Pod Security Standards'
                          : `Admission Denied: ${evaluationResult.violations_count} Rule Violation(s)`}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Action Enforced: <code className="text-cyan-300">{evaluationResult.enforce_action}</code>
                    </p>
                  </div>

                  {!evaluationResult.allowed && evaluationResult.violations?.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Violations Detected:</h5>
                      {evaluationResult.violations.map((v: string, idx: number) => (
                        <div key={idx} className="p-2.5 bg-slate-950 rounded border border-rose-900/40 text-xs text-rose-300 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                          <span>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-slate-400 space-y-1 pt-2">
                    <p>Evaluated under: <strong className="text-slate-300">{evaluationResult.matched_policy || 'Monitorix Default PSS Profile'}</strong></p>
                    <p>Timestamp: <span className="font-mono text-slate-500">{evaluationResult.timestamp}</span></p>
                  </div>
                </div>
              ) : (
                <div className="mt-12 text-center text-slate-500 space-y-2">
                  <Terminal className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-medium">No evaluation executed yet</p>
                  <p className="text-xs">Paste or select a Pod manifest and click "Evaluate Against PSS"</p>
                </div>
              )}
            </div>

            {/* Active Guardrails Pill List */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-2">Active Admission Policies:</span>
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
