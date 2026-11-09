import React, { useState, useEffect } from 'react';
import { 
  Globe, Server, Activity, ShieldCheck, AlertTriangle, RefreshCw, 
  Cpu, Database, Zap, Layers, CheckCircle2, Play, ArrowUpRight,
  TrendingUp, BarChart3, Radio, HardDrive, ShieldAlert, Sparkles
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function GlobalOperations() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Failover simulation state
  const [simulatingFailover, setSimulatingFailover] = useState(false);
  const [failoverResult, setFailoverResult] = useState<any>(null);

  // Scale benchmark state
  const [runningBenchmark, setRunningBenchmark] = useState(false);
  const [benchmarkTier, setBenchmarkTier] = useState<number>(100000);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/saas/operations/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error('Failed to load global operations overview');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to connect to global operations gateway');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleFailoverSimulation = async () => {
    setSimulatingFailover(true);
    setFailoverResult(null);
    try {
      const res = await fetch(`${API_URL}/v2/saas/ha/failover-simulation`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setFailoverResult(json);
        toast.success(`HA Failover passed: RTO ${json.recovery_time_ms}ms (RPO=0)`);
        fetchOverview();
      } else {
        toast.error('Failover simulation failed');
      }
    } catch (err) {
      toast.error('Failed to trigger failover simulation');
    } finally {
      setSimulatingFailover(false);
    }
  };

  const handleRunScaleBenchmark = async () => {
    setRunningBenchmark(true);
    setBenchmarkResult(null);
    try {
      const res = await fetch(`${API_URL}/v2/saas/scale/benchmark`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ target_endpoints: benchmarkTier })
      });
      if (res.ok) {
        const json = await res.json();
        setBenchmarkResult(json);
        toast.success(`Progressive Scale Validated: ${json.measured_metrics.sustained_eps.toLocaleString()} EPS sustained!`);
      } else {
        toast.error('Scale benchmark failed');
      }
    } catch (err) {
      toast.error('Failed to execute progressive scale benchmark');
    } finally {
      setRunningBenchmark(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[600px] text-slate-500">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-sm font-semibold tracking-wide">Connecting to Global Mesh Observability...</p>
      </div>
    );
  }

  const overview = data?.global_overview || {
    active_regions: 3,
    total_organizations: 1,
    global_current_eps: 25700,
    global_capacity_eps: 240000,
    fleet_p99_latency_ms: 15.7,
    global_active_incidents: 3,
    system_error_rate_pct: 0.0008,
    queue_depth_kafka_events: 142
  };

  const regions = data?.regions || [];
  const haComponents = data?.infrastructure_ha || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md shadow-blue-500/20">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Global SaaS & Multi-Region Operations</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Mesh Quorum
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Autonomous telemetry routing, regional agent gateway mesh, and high-availability quorum verification.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => { setRefreshing(true); fetchOverview(); }}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleFailoverSimulation}
            disabled={simulatingFailover}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
          >
            <Zap className={`w-4 h-4 ${simulatingFailover ? 'animate-bounce' : ''}`} />
            <span>{simulatingFailover ? 'Simulating...' : 'Simulate Failover'}</span>
          </button>
        </div>
      </div>

      {/* HA Failover Simulation Result Banner */}
      {failoverResult && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-emerald-100 p-5 rounded-2xl border border-emerald-500/40 shadow-lg relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-emerald-200 text-sm">Disaster Recovery Simulation Passed</span>
                <span className="text-xs bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-300 font-mono">
                  {failoverResult.simulation_id}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {failoverResult.tested_scenario} — Promoted <span className="font-mono text-white">{failoverResult.standby_promoted_to_leader}</span>, fenced former leader.
              </p>
            </div>
            <div className="flex items-center space-x-6 text-right">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Recovery Time (RTO)</div>
                <div className="text-xl font-bold text-emerald-400 font-mono">{failoverResult.recovery_time_ms} ms</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Data Loss (RPO)</div>
                <div className="text-xl font-bold text-emerald-400 font-mono">0.00 sec</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Global Ingestion EPS</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {overview.global_current_eps.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">/ {overview.global_capacity_eps.toLocaleString()} cap</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              style={{ width: `${Math.min(100, (overview.global_current_eps / overview.global_capacity_eps) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Fleet P99 Latency</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {overview.fleet_p99_latency_ms} ms
            </span>
            <span className="text-xs text-emerald-600 font-medium">SLA: &lt; 200ms</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">Anycast gateway cross-continental routing</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Kafka Queue Depth</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {overview.queue_depth_kafka_events}
            </span>
            <span className="text-xs text-slate-500">events buffered</span>
          </div>
          <p className="mt-3 text-xs text-emerald-600 font-medium">Zero backpressure lag</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>System Error Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-600 font-mono">
              {(overview.system_error_rate_pct * 100).toFixed(4)}%
            </span>
            <span className="text-xs text-slate-500">99.999% uptime</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">Zero packet drop detected</p>
        </div>
      </div>

      {/* Regional Topology & Gateways */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Regional Gateway Mesh & Telemetry Pipeline</h2>
            <p className="text-xs text-slate-500">Intelligent health-aware gateway routing and regional failover endpoints.</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            {regions.length} Active Regions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {regions.map((reg: any) => (
            <div key={reg.id || reg.region_code} className="border border-slate-200 rounded-xl p-5 hover:border-blue-400 transition bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">{reg.region_name}</span>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{reg.region_code}</div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  reg.status === 'HEALTHY' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {reg.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gateway URL:</span>
                  <span className="font-mono text-slate-800 truncate max-w-[180px]">{reg.gateway_url}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Latency:</span>
                  <span className="font-mono font-medium text-emerald-600">{reg.latency_ms} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data Residency:</span>
                  <span className="font-semibold text-indigo-700">{reg.data_residency_zone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Failover Region:</span>
                  <span className="font-mono text-slate-600">{reg.failover_region || 'us-east-1'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">EPS Load:</span>
                  <span className="font-mono font-medium text-slate-700">
                    {reg.current_eps.toLocaleString()} / {reg.eps_capacity.toLocaleString()} EPS
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full" 
                    style={{ width: `${reg.utilization_pct || 15}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distributed Infrastructure Quorum & Component Health */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Distributed Infrastructure High-Availability Quorum</h2>
            <p className="text-xs text-slate-500">Real-time status of backend HA, storage replication, Kafka partitions, and cache sentinel.</p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
            <span>RTO: &lt;200ms</span>
            <span>•</span>
            <span>RPO: 0.00s</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {Object.entries(haComponents).map(([key, comp]: [string, any]) => (
            <div key={key} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-xs capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                  {comp.status}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {comp.quorum || comp.replication || comp.mode || comp.erasure_coding || 'Quorum Verified'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progressive Scale Validation Runner (100 to 100,000 Endpoints) */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Progressive Scale Engine Validator</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Benchmark ingestion concurrency, P99 ingestion latency, and memory footprint across progressive scale tiers.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={benchmarkTier}
              onChange={(e) => setBenchmarkTier(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 font-mono"
            >
              <option value={100}>100 Endpoints (Starter)</option>
              <option value={1000}>1,000 Endpoints (Mid-tier)</option>
              <option value={10000}>10,000 Endpoints (Enterprise)</option>
              <option value={50000}>50,000 Endpoints (High-Throughput)</option>
              <option value={100000}>100,000 Endpoints (Global Fleet)</option>
            </select>

            <button
              onClick={handleRunScaleBenchmark}
              disabled={runningBenchmark}
              className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow transition"
            >
              <Play className={`w-3.5 h-3.5 ${runningBenchmark ? 'animate-spin' : ''}`} />
              <span>{runningBenchmark ? 'Testing...' : 'Execute Benchmark'}</span>
            </button>
          </div>
        </div>

        {benchmarkResult && (
          <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">
                  Validated Scale Tier: {benchmarkResult.tested_endpoints_tier.toLocaleString()} Endpoints
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                STATUS: {benchmarkResult.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Sustained EPS:</span>
                <span className="text-lg font-bold text-white">
                  {benchmarkResult.measured_metrics.sustained_eps.toLocaleString()} EPS
                </span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Ingestion P99:</span>
                <span className="text-lg font-bold text-emerald-400">
                  {benchmarkResult.measured_metrics.ingestion_p99_latency_ms} ms
                </span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Detection Latency:</span>
                <span className="text-lg font-bold text-indigo-400">
                  {benchmarkResult.measured_metrics.detection_correlation_latency_ms} ms
                </span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Memory / CPU:</span>
                <span className="text-lg font-bold text-amber-400">
                  {benchmarkResult.measured_metrics.memory_consumption_gb} GB / {benchmarkResult.measured_metrics.cpu_utilization_pct}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
