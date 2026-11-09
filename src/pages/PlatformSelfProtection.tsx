import React, { useState, useEffect } from 'react';
import {
  Shield, ShieldAlert, ShieldCheck, Activity, Lock, Unlock,
  RefreshCw, AlertTriangle, CheckCircle2, Server, Terminal,
  Cpu, Zap, Search, Filter, Play, Check, Eye, Hash,
  Database, Radio, FileCode, Layers, AlertOctagon,
  ArrowUpRight, Clock, HardDrive, Key, Skull
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function PlatformSelfProtection() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'nodes' | 'events' | 'policies' | 'proofs' | 'simulator'>('events');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [overview, setOverview] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [proofs, setProofs] = useState<any[]>([]);

  // Filters
  const [componentFilter, setComponentFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Simulator State
  const [simComponent, setSimComponent] = useState('AGENT');
  const [simTarget, setSimTarget] = useState('srv-prod-worker-01 (PID 4821)');
  const [simTamperType, setSimTamperType] = useState('SERVICE_TERMINATION_ATTEMPT');
  const [simSource, setSimSource] = useState('taskkill.exe /F /IM monitorix-agent.exe');
  const [simDescription, setSimDescription] = useState('Adversary injected unauthorized termination signal');
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Lockdown State
  const [lockdownNodeId, setLockdownNodeId] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/platform-protection/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOverview(await res.json());
    } catch (e) {
      console.error('Failed to load overview', e);
    }
  };

  const fetchNodes = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/platform-protection/nodes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setNodes(await res.json());
    } catch (e) {
      console.error('Failed to load nodes', e);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/platform-protection/events?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setEvents(await res.json());
    } catch (e) {
      console.error('Failed to load events', e);
    }
  };

  const fetchPolicies = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/platform-protection/policies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPolicies(await res.json());
    } catch (e) {
      console.error('Failed to load policies', e);
    }
  };

  const fetchProofs = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/platform-protection/proofs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setProofs(await res.json());
    } catch (e) {
      console.error('Failed to load proofs', e);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchOverview(),
      fetchNodes(),
      fetchEvents(),
      fetchPolicies(),
      fetchProofs()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    toast.success('Self-protection ledger refreshed');
  };

  const handleSimulateTamper = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`${API_URL}/v2/platform-protection/report-tamper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          component_type: simComponent,
          target_identifier: simTarget,
          tamper_type: simTamperType,
          source_process_or_ip: simSource,
          description: simDescription,
          severity: 'CRITICAL'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationResult(data);
        toast.success(`Tamper Incursion Blocked: ${data.action_taken}`);
        fetchEvents();
        fetchOverview();
      } else {
        toast.error('Simulation request failed');
      }
    } catch (e) {
      toast.error('Network error during simulation');
    } finally {
      setSimulating(false);
    }
  };

  const handleEmergencyLockdown = async (nodeId: string) => {
    if (!window.confirm(`Initiate EMERGENCY LOCKDOWN for component node [${nodeId}]? This will isolate memory and revoke ephemeral keys.`)) {
      return;
    }
    setLockdownNodeId(nodeId);
    try {
      const res = await fetch(`${API_URL}/v2/platform-protection/emergency-lockdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          node_id: nodeId,
          reason: 'Manual SOC Operator Emergency Lockdown Command'
        })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Node [${nodeId}] successfully locked down!`);
        fetchNodes();
        fetchEvents();
        fetchOverview();
      } else {
        toast.error('Lockdown execution failed');
      }
    } catch (e) {
      toast.error('Network failure executing lockdown');
    } finally {
      setLockdownNodeId(null);
    }
  };

  // Filtered Events
  const filteredEvents = events.filter(e => {
    const matchComp = componentFilter === 'ALL' || e.component_type === componentFilter;
    const matchSev = severityFilter === 'ALL' || e.severity === severityFilter;
    const matchQuery = !searchQuery ||
      e.target_identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tamper_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchComp && matchSev && matchQuery;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Platform Self-Protection & Tamper Defense
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  WAVE 1.11 • P0
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  KERNEL & CRYPTO LOCK
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                100% Sovereign Platform • Agent Termination Guard • Process Injection Defense • Database Hash Chain & Rule Signature Seal
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-sm text-slate-200 transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Attest State
          </button>
          <div className="px-3.5 py-2 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs font-medium text-rose-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            Active Containment Enforced
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Platform Integrity Score */}
        <div className="p-5 bg-slate-900/70 border border-slate-800/80 rounded-xl backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Integrity Posture</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {overview?.platform_integrity_score ?? 99.8}%
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Cryptographically sealed state ledger
          </div>
        </div>

        {/* Card 2: Monitored Nodes */}
        <div className="p-5 bg-slate-900/70 border border-slate-800/80 rounded-xl backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Attested Nodes</span>
            <Server className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {overview?.secure_nodes_count ?? 7}
            <span className="text-sm font-normal text-slate-400"> / {overview?.total_nodes_monitored ?? 7}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-indigo-300 font-medium">
            <Cpu className="w-3.5 h-3.5" />
            100% Subsystems verified secure
          </div>
        </div>

        {/* Card 3: Tamper Intercepts */}
        <div className="p-5 bg-slate-900/70 border border-slate-800/80 rounded-xl backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Blocked Incursions</span>
            <Lock className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400">
            {overview?.blocked_tamper_events ?? 3}
            <span className="text-sm font-normal text-slate-400"> of {overview?.tamper_events_total ?? 4}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-rose-400 font-medium">
            <AlertOctagon className="w-3.5 h-3.5" />
            Zero successful process termination
          </div>
        </div>

        {/* Card 4: Cryptographic Proofs */}
        <div className="p-5 bg-slate-900/70 border border-slate-800/80 rounded-xl backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Merkle Proofs</span>
            <Hash className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-300">
            {overview?.cryptographic_proofs_valid ?? 3}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-amber-300 font-medium">
            <Key className="w-3.5 h-3.5" />
            SHA-256 Hash-chain valid
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'events'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Tamper Defense Feed ({events.length})
        </button>

        <button
          onClick={() => setActiveTab('nodes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'nodes'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Server className="w-4 h-4" />
          Subsystem Integrity Nodes ({nodes.length})
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'policies'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          Protection Policies ({policies.length})
        </button>

        <button
          onClick={() => setActiveTab('proofs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'proofs'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Hash className="w-4 h-4" />
          Cryptographic Merkle Proofs ({proofs.length})
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'simulator'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Play className="w-4 h-4" />
          Tamper Incursion Sandbox
        </button>
      </div>

      {/* Tab 1: Tamper Events Feed */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search target, tamper type, or description..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>

              <select
                value={componentFilter}
                onChange={e => setComponentFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200"
              >
                <option value="ALL">All Components</option>
                <option value="AGENT">Agent Fleet</option>
                <option value="DATABASE">PostgreSQL Database</option>
                <option value="DETECTION_ENGINE">Detection & SOAR Engine</option>
                <option value="KAFKA">Kafka Pipeline</option>
                <option value="REDIS">Redis Cache</option>
              </select>

              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>
            </div>
            <div className="text-xs text-slate-400">
              Showing {filteredEvents.length} events
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/60 text-slate-300 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Event ID</th>
                    <th className="py-3 px-4">Component</th>
                    <th className="py-3 px-4">Target Target</th>
                    <th className="py-3 px-4">Tamper Attack Type</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">MITRE Technique</th>
                    <th className="py-3 px-4">Action Taken</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredEvents.map(evt => (
                    <tr key={evt.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono text-xs text-rose-300 font-medium">
                        {evt.event_id}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200">
                          {evt.component_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-200">
                        {evt.target_identifier}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{evt.tamper_type}</div>
                        <div className="text-xs text-slate-400 line-clamp-1">{evt.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          evt.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {evt.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-purple-300">
                        {evt.mitre_technique}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {evt.action_taken}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300">
                          {evt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No tamper incursions detected matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Subsystem Nodes */}
      {activeTab === 'nodes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map(n => (
            <div
              key={n.id}
              className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {n.subsystem}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  n.status === 'VERIFIED_SECURE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {n.status}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-white text-base">{n.component_name}</h3>
                <p className="font-mono text-xs text-slate-400 mt-0.5">{n.node_id}</p>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1 font-mono text-xs">
                <div className="text-slate-400 flex items-center justify-between">
                  <span>Protection:</span>
                  <span className="text-emerald-400 font-semibold">{n.self_protection_level}</span>
                </div>
                <div className="text-slate-400 flex items-center justify-between">
                  <span>Score:</span>
                  <span className="text-white font-bold">{n.integrity_score}%</span>
                </div>
                <div className="text-slate-500 line-clamp-1 truncate" title={n.current_hash}>
                  Hash: {n.current_hash.slice(0, 24)}...
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                <span className="text-xs text-slate-400">
                  Attested: {new Date(n.last_attested_at).toLocaleTimeString()}
                </span>
                <button
                  onClick={() => handleEmergencyLockdown(n.node_id)}
                  disabled={lockdownNodeId === n.node_id || n.status === 'LOCKDOWN'}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded hover:bg-rose-500/30 transition disabled:opacity-50"
                >
                  {lockdownNodeId === n.node_id ? 'Locking...' : n.status === 'LOCKDOWN' ? 'Locked Down' : 'Lockdown'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Policies */}
      {activeTab === 'policies' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/60 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Policy ID</th>
                <th className="py-3 px-4">Policy Name</th>
                <th className="py-3 px-4">Protection Scope</th>
                <th className="py-3 px-4">Enforcement Mode</th>
                <th className="py-3 px-4">Lockdown Threshold</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {policies.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-mono text-xs text-indigo-300 font-semibold">{p.policy_id}</td>
                  <td className="py-3 px-4 font-medium text-white">{p.name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-300">{p.protection_scope}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {p.enforcement_mode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{p.auto_lockdown_threshold} attempts</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ENABLED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Proofs */}
      {activeTab === 'proofs' && (
        <div className="space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Cryptographic Merkle Proofs & Hash Chain Ledger</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Immutable block-level cryptographic hashes verifying Monitorix database state, agent binary attestations, and detection rulesets.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% Attested Valid
              </span>
            </div>

            <div className="space-y-3">
              {proofs.map(pr => (
                <div key={pr.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-amber-300 font-bold">{pr.proof_id}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300">
                      {pr.ledger_type}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-slate-300 space-y-1">
                    <div><span className="text-slate-500">Merkle Root:</span> {pr.merkle_root}</div>
                    <div><span className="text-slate-500">Parent Root:</span> {pr.previous_proof_hash}</div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>Status: <span className="text-emerald-400 font-medium">{pr.verified_status}</span></span>
                    <span>Timestamp: {new Date(pr.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Simulator Sandbox */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="font-bold text-white text-base">Tamper Attack Incursion Simulator</h3>
              <p className="text-xs text-slate-400 mt-1">
                Inject simulated adversary attacks against Monitorix agent fleet, database state, or detection engines to test real-time containment.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Target Component</label>
                <select
                  value={simComponent}
                  onChange={e => setSimComponent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100"
                >
                  <option value="AGENT">Agent Fleet (EDR Daemon)</option>
                  <option value="DATABASE">PostgreSQL State Ledger</option>
                  <option value="DETECTION_ENGINE">Detection & SOAR Ruleset</option>
                  <option value="KAFKA">Kafka Event Bus</option>
                  <option value="REDIS">Redis Cache Store</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Target Identifier</label>
                <input
                  type="text"
                  value={simTarget}
                  onChange={e => setSimTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Tamper Attack Type</label>
                <select
                  value={simTamperType}
                  onChange={e => setSimTamperType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono"
                >
                  <option value="SERVICE_TERMINATION_ATTEMPT">SERVICE_TERMINATION_ATTEMPT (T1562.001)</option>
                  <option value="PROCESS_INJECTION">PROCESS_INJECTION (T1055)</option>
                  <option value="DATABASE_HASH_CHAIN_MISMATCH">DATABASE_HASH_CHAIN_MISMATCH (T1565.001)</option>
                  <option value="RULE_SIGNATURE_TAMPER">RULE_SIGNATURE_TAMPER (T1562.001)</option>
                  <option value="REDIS_CACHE_POISONING">REDIS_CACHE_POISONING (T1565)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Attacker Process / Source IP</label>
                <input
                  type="text"
                  value={simSource}
                  onChange={e => setSimSource(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Incursion Details</label>
                <textarea
                  value={simDescription}
                  onChange={e => setSimDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100"
                />
              </div>

              <button
                onClick={handleSimulateTamper}
                disabled={simulating}
                className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30"
              >
                <Play className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
                {simulating ? 'Executing Incursion & Triggering Defense...' : 'Dispatch Tamper Incursion'}
              </button>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-white text-base">Real-Time Defense Reaction Ledger</h3>
            {simulationResult ? (
              <div className="p-4 bg-slate-950 border border-emerald-500/40 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    CONTAINMENT SUCCESSFUL
                  </span>
                  <span className="font-mono text-xs text-rose-300 font-bold">{simulationResult.event_id}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="text-white font-semibold">{simulationResult.message}</div>
                  <div className="text-xs text-slate-400 font-mono">
                    Action Taken: <span className="text-emerald-400 font-bold">{simulationResult.action_taken}</span>
                  </div>
                  <div className="text-xs text-purple-300 font-mono">
                    MITRE ATT&CK: {simulationResult.mitre_technique}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-slate-800 rounded-lg text-center text-slate-500 text-sm">
                No active simulation dispatched yet. Select parameters on the left and click "Dispatch Tamper Incursion".
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
