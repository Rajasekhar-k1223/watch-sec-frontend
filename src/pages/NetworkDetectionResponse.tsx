import React, { useState, useEffect } from 'react';
import {
  Activity, Shield, AlertTriangle, CheckCircle2, RefreshCw,
  Zap, Search, Filter, Lock, Terminal, FileCode,
  ShieldAlert, Radio, Check, ExternalLink, Play, Sparkles,
  Server, Cpu, AlertOctagon, Wifi, Network, ArrowUpRight,
  Layers, Eye, Ban, Skull, Clock, Cloud, ArrowDownRight,
  ShieldCheck, Globe, Crosshair, HardDrive
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function NetworkDetectionResponse() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'flows' | 'sensors' | 'threats' | 'traffic_sandbox'>('threats');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [overview, setOverview] = useState<any>(null);
  const [sensors, setSensors] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [threats, setThreats] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);

  // Filters
  const [suspiciousOnly, setSuspiciousOnly] = useState<boolean>(false);
  const [protocolFilter, setProtocolFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Traffic Sandbox State
  const [sandboxSourceIp, setSandboxSourceIp] = useState('10.0.1.45');
  const [sandboxDestIp, setSandboxDestIp] = useState('198.51.100.22');
  const [sandboxPort, setSandboxPort] = useState<number>(443);
  const [sandboxProtocol, setSandboxProtocol] = useState('TCP');
  const [sandboxDomain, setSandboxDomain] = useState('');
  const [sandboxBeaconInterval, setSandboxBeaconInterval] = useState<number | undefined>(60.0);
  const [sandboxJitter, setSandboxJitter] = useState<number | undefined>(0.8);
  const [sandboxPortsScanned, setSandboxPortsScanned] = useState<number | undefined>(undefined);
  const [inspecting, setInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<any>(null);

  // Active Response State
  const [containingId, setContainingId] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/ndr/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOverview(await res.json());
    } catch (e) {
      console.error('Failed to load NDR overview', e);
    }
  };

  const fetchSensors = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/ndr/sensors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSensors(await res.json());
    } catch (e) {
      console.error('Failed to load sensors', e);
    }
  };

  const fetchFlows = async () => {
    try {
      let url = `${API_URL}/v2/ndr/flows`;
      const params = new URLSearchParams();
      if (suspiciousOnly) params.append('is_suspicious', 'true');
      if (protocolFilter !== 'ALL') params.append('protocol', protocolFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setFlows(await res.json());
    } catch (e) {
      console.error('Failed to load flows', e);
    }
  };

  const fetchThreats = async () => {
    try {
      let url = `${API_URL}/v2/ndr/threats`;
      if (severityFilter !== 'ALL') url += `?severity=${severityFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setThreats(await res.json());
    } catch (e) {
      console.error('Failed to load threats', e);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/ndr/rules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setRules(await res.json());
    } catch (e) {
      console.error('Failed to load rules', e);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchOverview(),
      fetchSensors(),
      fetchFlows(),
      fetchThreats(),
      fetchRules()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [suspiciousOnly, protocolFilter, severityFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
    toast.success('NDR network telemetry refreshed');
  };

  // Inspect Custom Traffic in Sandbox
  const handleInspectTraffic = async () => {
    setInspecting(true);
    try {
      const payload: any = {
        source_ip: sandboxSourceIp,
        destination_ip: sandboxDestIp,
        destination_port: Number(sandboxPort),
        protocol: sandboxProtocol
      };
      if (sandboxDomain) payload.query_domain = sandboxDomain;
      if (sandboxBeaconInterval !== undefined) payload.beacon_interval_sec = Number(sandboxBeaconInterval);
      if (sandboxJitter !== undefined) payload.jitter_percent = Number(sandboxJitter);
      if (sandboxPortsScanned !== undefined) payload.ports_scanned_count = Number(sandboxPortsScanned);

      const res = await fetch(`${API_URL}/v2/ndr/inspect-traffic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setInspectionResult(data);
        if (data.threat_detected) {
          toast.error(`Threat Detected: ${data.threat_type} (${data.enforce_action})`);
        } else {
          toast.success('Traffic matches normal baseline profile');
        }
      } else {
        toast.error('Traffic inspection failed');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error during inspection');
    } finally {
      setInspecting(false);
    }
  };

  // 1-Click Active Response (Block IP / Kill Session)
  const handleContain = async (alertId?: string, sourceIp?: string, action: string = 'BLOCK_IP') => {
    const target = alertId || sourceIp;
    if (!target) return;
    setContainingId(target);
    try {
      const res = await fetch(`${API_URL}/v2/ndr/contain-threat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          alert_id: alertId,
          source_ip: sourceIp,
          action: action
        })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || `Active mitigation applied against ${target}`);
        await loadAll();
      } else {
        toast.error('Failed to contain network threat');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error executing containment');
    } finally {
      setContainingId(null);
    }
  };

  // Filter flows by search
  const filteredFlows = flows.filter(fl => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      fl.source_ip?.toLowerCase().includes(q) ||
      fl.destination_ip?.toLowerCase().includes(q) ||
      fl.threat_type?.toLowerCase().includes(q) ||
      fl.flow_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-600/30 to-teal-700/30 border border-emerald-500/40 rounded-xl shadow-lg shadow-emerald-900/20">
              <Radio className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Advanced Network Detection & Response</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  NDR v18.10
                </span>
                <span className="px-2 py-0.5 text-xs font-bold bg-teal-600 text-white rounded">
                  P0 CORE
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                C2 beacon radar, DNS tunneling interception, horizontal port sweep heuristics & 1-click active perimeter response
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
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Hero Posture KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* NDR Defense Score */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">NDR Defense Score</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.ndr_defense_score ?? '--'}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (overview?.ndr_defense_score || 0) > 75
                  ? 'bg-emerald-500'
                  : (overview?.ndr_defense_score || 0) > 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${overview?.ndr_defense_score || 0}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Sensors: {overview?.total_sensors_count ?? 4} Active</span>
            <span className="text-emerald-400 font-medium">PROTECTED</span>
          </div>
        </div>

        {/* Monitored Traffic Volume */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Bandwidth & Packets</span>
            <Activity className="w-5 h-5 text-teal-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.total_bandwidth_mbps ?? '2730'}
            </span>
            <span className="text-xs text-slate-400">Mbps</span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-teal-400" /> {overview?.total_packets_per_sec?.toLocaleString() ?? '177,000'} PPS
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Network className="w-3.5 h-3.5" /> {overview?.monitored_flows_count ?? 5} Flows
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Real-time tap mirror & NetFlow/IPFIX stream
          </div>
        </div>

        {/* C2 Radar Detections */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">C2 Radar & DNS Exfil</span>
            <Crosshair className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">
              {(overview?.c2_beacons_count ?? 1) + (overview?.dns_tunneling_count ?? 1)}
            </span>
            <span className="text-xs text-slate-400">active alerts</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
              C2 Beacons: {overview?.c2_beacons_count ?? 1}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
              DNS Tunnels: {overview?.dns_tunneling_count ?? 1}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Low-jitter beaconing & entropy analysis active
          </div>
        </div>

        {/* Active Threat Count */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Open Network Threats</span>
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">
              {overview?.open_threats_count ?? 0}
            </span>
            <span className="text-xs text-slate-400">unmitigated</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
              {overview?.critical_threats_count ?? 0} CRITICAL
            </span>
            <span className="text-slate-400">
              RST Severance: READY
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            100% Sovereign Monitorix NDR Shield
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('threats')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'threats'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Behavioral Threats & C2 Radar
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-rose-500/20 text-rose-300">
            {threats.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('flows')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'flows'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          Flow Records & IPFIX
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300">
            {flows.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sensors')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'sensors'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Radio className="w-4 h-4" />
          Sensor Fleet & Probes
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300">
            {sensors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('traffic_sandbox')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'traffic_sandbox'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Traffic Inspection Sandbox
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-teal-500/20 text-teal-300">
            Heuristics Live
          </span>
        </button>
      </div>

      {/* TAB 1: Behavioral Threats & C2 Radar */}
      {activeTab === 'threats' && (
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
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {threats.map(t => (
              <div
                key={t.id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                      t.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {t.severity}
                    </span>
                    <h3 className="font-semibold text-white text-sm">{t.title}</h3>
                    <span className="text-xs font-mono text-slate-400">({t.threat_type})</span>
                  </div>
                  <p className="text-xs text-slate-300">{t.description}</p>
                  <p className="text-xs text-teal-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Mitigation Advisory: {t.mitigation}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span>Source: <code className="text-rose-400 font-bold">{t.source_ip}</code></span>
                    <span>Destination: <code className="text-slate-300">{t.destination_ip}</code></span>
                    <span>Sensor Probe: <code className="text-slate-400">{t.sensor_id}</code></span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                    t.status === 'OPEN'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {t.status}
                  </span>
                  {t.status === 'OPEN' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleContain(t.alert_id, t.source_ip, 'BLOCK_IP')}
                        disabled={containingId === t.alert_id}
                        className="px-3 py-1.5 text-xs font-bold rounded bg-rose-600 hover:bg-rose-500 text-white shadow transition-colors disabled:opacity-50"
                      >
                        {containingId === t.alert_id ? 'Quarantining...' : 'Block IP'}
                      </button>
                      <button
                        onClick={() => handleContain(t.alert_id, t.source_ip, 'KILL_SESSION')}
                        disabled={containingId === t.alert_id}
                        className="px-3 py-1.5 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors disabled:opacity-50"
                      >
                        TCP RST Kill
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Flow Records */}
      {activeTab === 'flows' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search source/destination IP, flow ID..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Protocol:</span>
                <select
                  value={protocolFilter}
                  onChange={e => setProtocolFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Protocols</option>
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="ICMP">ICMP</option>
                </select>
              </div>

              <button
                onClick={() => setSuspiciousOnly(!suspiciousOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  suspiciousOnly
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                Suspicious Only
              </button>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Flow ID / Sensor</th>
                    <th className="py-3 px-4">Source Endpoint</th>
                    <th className="py-3 px-4">Destination Endpoint</th>
                    <th className="py-3 px-4">Protocol & Flags</th>
                    <th className="py-3 px-4">Transfer Volume</th>
                    <th className="py-3 px-4">Threat Classification</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {filteredFlows.map(fl => (
                    <tr key={fl.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-semibold text-white">{fl.flow_id}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{fl.sensor_id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-white font-semibold">{fl.source_ip}</span>
                        <span className="text-slate-500">:{fl.source_port}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-white font-semibold">{fl.destination_ip}</span>
                        <span className="text-slate-500">:{fl.destination_port}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {fl.protocol}
                        </span>
                        <span className="ml-2 text-slate-400">({fl.flags})</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-200 font-bold">{fl.bytes_transferred.toLocaleString()} B</span>
                        <span className="ml-1 text-slate-500">({fl.packets} pkts)</span>
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        {fl.is_suspicious ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {fl.threat_type}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-300">
                            BENIGN
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        {fl.is_suspicious ? (
                          <button
                            onClick={() => handleContain(undefined, fl.source_ip, 'BLOCK_IP')}
                            className="px-2.5 py-1 text-xs font-bold rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow"
                          >
                            Block Source
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">Logged</span>
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

      {/* TAB 3: Sensors */}
      {activeTab === 'sensors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sensors.map(s => (
            <div key={s.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <Radio className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-semibold text-white">{s.name}</span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {s.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">Sensor ID / Interface:</span>
                    <p className="font-mono text-slate-200 mt-0.5">{s.sensor_id} ({s.interface})</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">Tap Location:</span>
                    <p className="font-mono text-slate-200 mt-0.5">{s.location}</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">Packet Ingestion:</span>
                    <p className="font-mono font-bold text-teal-400 mt-0.5">{s.packets_per_sec?.toLocaleString()} PPS</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">Link Bandwidth:</span>
                    <p className="font-mono font-bold text-emerald-400 mt-0.5">{s.bandwidth_mbps} Mbps</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>PCAP Ring Buffer: <strong className="text-slate-200">{s.capture_buffer_mb} MB</strong></span>
                <span>Active Link: {new Date(s.last_seen_at).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: Traffic Sandbox */}
      {activeTab === 'traffic_sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Injector Console */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Traffic Behavior Simulator</span>
                </div>
                <span className="text-xs text-slate-400">Protocol: TCP / UDP</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Source IP:</label>
                  <input
                    type="text"
                    value={sandboxSourceIp}
                    onChange={e => setSandboxSourceIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Destination IP:</label>
                  <input
                    type="text"
                    value={sandboxDestIp}
                    onChange={e => setSandboxDestIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Destination Port:</label>
                  <input
                    type="number"
                    value={sandboxPort}
                    onChange={e => setSandboxPort(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Protocol:</label>
                  <select
                    value={sandboxProtocol}
                    onChange={e => setSandboxProtocol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none"
                  >
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Simulated DNS Query Domain (for DNS Tunneling testing):</label>
                <input
                  type="text"
                  value={sandboxDomain}
                  onChange={e => setSandboxDomain(e.target.value)}
                  placeholder="e.g. data-payload-chunk01.exfil.c2-proxy.net"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-teal-300 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Beacon Interval (sec):</label>
                  <input
                    type="number"
                    value={sandboxBeaconInterval ?? ''}
                    onChange={e => setSandboxBeaconInterval(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="60.0"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Jitter (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sandboxJitter ?? ''}
                    onChange={e => setSandboxJitter(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0.8"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSandboxSourceIp('10.0.1.45');
                    setSandboxDestIp('198.51.100.22');
                    setSandboxPort(443);
                    setSandboxProtocol('TCP');
                    setSandboxDomain('');
                    setSandboxBeaconInterval(60.0);
                    setSandboxJitter(0.8);
                    setSandboxPortsScanned(undefined);
                  }}
                  className="px-2 py-1 text-[11px] rounded bg-rose-900/40 text-rose-300 border border-rose-800 hover:bg-rose-900/60"
                >
                  Load C2 Beacon
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSandboxSourceIp('10.0.2.88');
                    setSandboxDestIp('8.8.8.8');
                    setSandboxPort(53);
                    setSandboxProtocol('UDP');
                    setSandboxDomain('aW5maWx0cmF0aW9uLXNlY3JldC12YXVsdA==.exfil.attacker.xyz');
                    setSandboxBeaconInterval(undefined);
                    setSandboxJitter(undefined);
                    setSandboxPortsScanned(undefined);
                  }}
                  className="px-2 py-1 text-[11px] rounded bg-purple-900/40 text-purple-300 border border-purple-800 hover:bg-purple-900/60"
                >
                  Load DNS Exfil
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSandboxSourceIp('10.0.4.15');
                    setSandboxDestIp('142.250.190.46');
                    setSandboxPort(443);
                    setSandboxProtocol('TCP');
                    setSandboxDomain('');
                    setSandboxBeaconInterval(undefined);
                    setSandboxJitter(undefined);
                    setSandboxPortsScanned(undefined);
                  }}
                  className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Load Clean
                </button>
              </div>

              <button
                onClick={handleInspectTraffic}
                disabled={inspecting}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {inspecting ? 'Analyzing Telemetry...' : 'Inspect Traffic'}
              </button>
            </div>
          </div>

          {/* Verdict Feedback */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">NDR Behavioral Verdict</span>
                </div>
                {inspectionResult && (
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded ${
                    inspectionResult.threat_detected
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {inspectionResult.verdict}
                  </span>
                )}
              </div>

              {inspectionResult ? (
                <div className="mt-4 space-y-4">
                  <div className={`p-4 rounded-lg border ${
                    inspectionResult.threat_detected
                      ? 'bg-rose-950/20 border-rose-800/40'
                      : 'bg-emerald-950/20 border-emerald-800/40'
                  }`}>
                    <div className="flex items-center gap-2">
                      {inspectionResult.threat_detected ? (
                        <Skull className="w-5 h-5 text-rose-400" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      )}
                      <h4 className="font-bold text-white text-sm">
                        {inspectionResult.threat_detected
                          ? `Threat Intercepted: ${inspectionResult.threat_type}`
                          : 'Normal Connection Flow (Zero Anomaly Detected)'}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 mt-2">
                      {inspectionResult.description}
                    </p>
                    <p className="text-xs text-teal-400 mt-1">
                      Enforce Action: <code className="font-bold">{inspectionResult.enforce_action}</code>
                    </p>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 pt-2">
                    <p>Alert Reference: <code className="text-slate-300">{inspectionResult.alert_id || 'None'}</code></p>
                    <p>Timestamp: <span className="font-mono text-slate-500">{inspectionResult.timestamp}</span></p>
                  </div>
                </div>
              ) : (
                <div className="mt-12 text-center text-slate-500 space-y-2">
                  <Radio className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-medium">No traffic simulation executed yet</p>
                  <p className="text-xs">Configure connection parameters or load sample traffic and click "Inspect Traffic"</p>
                </div>
              )}
            </div>

            {/* Active Guardrails Pill List */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-2">Enforced NDR Policies:</span>
              <div className="flex flex-wrap gap-1.5">
                {rules.map(r => (
                  <span key={r.id} className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {r.name}
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
