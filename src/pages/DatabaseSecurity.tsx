import React, { useState, useEffect } from 'react';
import {
  Database, Shield, AlertTriangle, CheckCircle2, RefreshCw,
  Zap, Search, Filter, Lock, Unlock, Terminal, FileCode,
  ShieldAlert, Activity, Check, ExternalLink, Play, Sparkles,
  Server, HardDrive, Cpu, AlertOctagon, RotateCw,
  Layers, Compass, Eye, EyeOff, Ban, Skull, Clock, ArrowDown
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function DatabaseSecurity() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'alerts' | 'audit' | 'instances' | 'inspector'>('alerts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [overview, setOverview] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [instances, setInstances] = useState<any[]>([]);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [privilegedOnly, setPrivilegedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // SQL Inspector Sandbox
  const [inspectSql, setInspectSql] = useState("SELECT * FROM cardholders_master WHERE status = 'ACTIVE' LIMIT 500000;");
  const [inspectUser, setInspectUser] = useState("analyst_temp");
  const [inspectIp, setInspectIp] = useState("198.51.100.77");
  const [inspectRows, setInspectRows] = useState<number>(50000);
  const [inspecting, setInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<any>(null);

  // Actions
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/database-security/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOverview(await res.json());
    } catch (e) {
      console.error('Failed to load DB security overview', e);
    }
  };

  const fetchAlerts = async () => {
    try {
      let url = `${API_URL}/v2/database-security/alerts`;
      const params = new URLSearchParams();
      if (severityFilter !== 'ALL') params.append('severity', severityFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAlerts(await res.json());
    } catch (e) {
      console.error('Failed to load alerts', e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      let url = `${API_URL}/v2/database-security/audit-logs`;
      if (privilegedOnly) url += `?is_privileged_only=true`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAuditLogs(await res.json());
    } catch (e) {
      console.error('Failed to load audit logs', e);
    }
  };

  const fetchInstances = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/database-security/instances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setInstances(await res.json());
    } catch (e) {
      console.error('Failed to load DB instances', e);
    }
  };

  const reloadAll = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOverview(),
      fetchAlerts(),
      fetchAuditLogs(),
      fetchInstances()
    ]);
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    reloadAll();
  }, [severityFilter, statusFilter, privilegedOnly]);

  const handleInspectQuery = async () => {
    if (!inspectSql.trim()) {
      toast.error('Please input SQL query to inspect');
      return;
    }
    setInspecting(true);
    try {
      const res = await fetch(`${API_URL}/v2/database-security/inspect-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          instance_id: 'DB-PG-PROD-PRIMARY',
          db_user: inspectUser,
          client_ip: inspectIp,
          query_text: inspectSql,
          rows_returned: Number(inspectRows)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInspectionResult(data);
        if (data.verdict === 'BLOCKED') {
          toast.error(`Query Blocked! Violation: ${data.alert_type}`);
        } else {
          toast.success('Query evaluated clear under DAM policies.');
        }
        reloadAll();
      } else {
        toast.error('Query inspection failed');
      }
    } catch (e) {
      toast.error('Error contacting DAM inspection engine');
    } finally {
      setInspecting(false);
    }
  };

  const handleTerminateSession = async (alertId: string, action: string = 'KILL_SESSION') => {
    setTerminatingId(alertId);
    try {
      const res = await fetch(`${API_URL}/v2/database-security/terminate-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ alert_id: alertId, action })
      });
      if (res.ok) {
        toast.success(`Session for alert ${alertId} terminated!`);
        reloadAll();
      } else {
        toast.error('Failed to terminate session');
      }
    } catch (e) {
      toast.error('Error executing kill session');
    } finally {
      setTerminatingId(null);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (!searchQuery) return true;
    return (
      a.alert_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.alert_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.query_snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.db_user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.instance_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-xl border border-emerald-500/30">
              <Database className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Database Security & Activity Monitoring (DAM)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  WAVE 1.7
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ACTIVE ENFORCING
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Real-Time SQL Telemetry, Mass Exfiltration Shields, Privilege Escalation Guard & Active Session Termination
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
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* DAM Defense Score */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">DAM Defense</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {overview?.dam_defense_score ?? '--'}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-2 text-xs text-emerald-400/90 flex items-center gap-1 font-medium">
            <Activity className="w-3.5 h-3.5" />
            {(overview?.dam_defense_score ?? 0) >= 75 ? 'Hardened Posture' : 'Elevated Risk'}
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Monitored DB Instances */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">DB Clusters</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {overview?.monitored_instances_count ?? '--'}
            </span>
            <span className="text-xs text-slate-400">engines</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1 font-medium">
            <span>PG, Mongo, MySQL, Redis, CH</span>
          </div>
        </div>

        {/* 24h Query Volume */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">24h Query Volume</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {overview ? `${(overview.total_queries_24h / 1000000).toFixed(1)}M` : '--'}
            </span>
            <span className="text-xs text-slate-400">queries</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>{overview?.total_audit_logs_count ?? 0} audited in stream</span>
          </div>
        </div>

        {/* Security Alerts */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Security Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {overview?.open_alerts_count ?? '--'}
            </span>
            <span className="text-xs text-slate-400">active</span>
          </div>
          <div className="mt-2 text-xs text-rose-400 flex items-center gap-1 font-medium">
            <AlertOctagon className="w-3.5 h-3.5" />
            {overview?.critical_alerts_count ?? 0} Critical Exfiltration / DDL
          </div>
        </div>

        {/* Sensitive Tables */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sensitive Tables</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400">
              {overview?.sensitive_tables_total ?? 0}
            </span>
            <span className="text-xs text-slate-400">tables</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>{overview?.unencrypted_db_count ?? 0} Unencrypted Nodes</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-1">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'alerts'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Database Security Alerts
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-rose-900/50 text-rose-300 border border-rose-800/50">
            {alerts.filter(a => a.status === 'OPEN').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'audit'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Query Audit Stream
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('instances')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'instances'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Database className="w-4 h-4" />
          Monitored Database Clusters
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
            {instances.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'inspector'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Interactive Query Inspector
        </button>
      </div>

      {/* Tab 1: Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search alerts by query, user, alert ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open Alerts</option>
                <option value="CONTAINED">Contained</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAlerts.map(alert => (
              <div
                key={alert.alert_id}
                className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-slate-400">{alert.alert_id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-2">
                    {alert.alert_type.replace(/_/g, ' ')}
                  </h3>
                  <div className="text-xs text-slate-400 mt-1">
                    Instance: <span className="font-mono text-emerald-400">{alert.instance_id}</span> • User: <span className="font-mono text-white">{alert.db_user}</span> ({alert.client_ip})
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-xs text-slate-300">
                    <div className="text-slate-500 text-[11px] mb-1">Offending SQL Query:</div>
                    <div className="text-rose-400 font-semibold break-all">{alert.query_snippet}</div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs">
                    Status:{' '}
                    <span className={`font-bold ${alert.status === 'CONTAINED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {alert.status}
                    </span>
                  </div>

                  {alert.status === 'OPEN' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTerminateSession(alert.alert_id, 'KILL_SESSION')}
                        disabled={terminatingId === alert.alert_id}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-rose-950"
                      >
                        <Skull className="w-3.5 h-3.5" />
                        Kill Session
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Contained
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Query Audit Stream */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Live SQL statement execution audit stream across all monitored engines.
            </div>

            <button
              onClick={() => setPrivilegedOnly(!privilegedOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                privilegedOnly
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Superuser / Privileged Queries Only
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp & ID</th>
                  <th className="py-3 px-4">Instance & User</th>
                  <th className="py-3 px-4">Query Type</th>
                  <th className="py-3 px-4">SQL Query Statement</th>
                  <th className="py-3 px-4">Rows Returned</th>
                  <th className="py-3 px-4">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {auditLogs.map(log => (
                  <tr key={log.log_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400">
                      <div>{log.log_id}</div>
                      <div className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-white font-bold flex items-center gap-1.5">
                        {log.db_user}
                        {log.is_privileged_user && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            SUPERUSER
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px]">{log.instance_id} ({log.client_ip})</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        log.query_type === 'DROP' || log.query_type === 'ALTER'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : log.query_type === 'SELECT'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {log.query_type}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300 max-w-md truncate">
                      {log.query_text}
                    </td>

                    <td className="py-3 px-4 text-white font-bold">
                      {Number(log.rows_returned).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {log.execution_time_ms} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Monitored Database Clusters */}
      {activeTab === 'instances' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map(inst => (
            <div
              key={inst.instance_id}
              className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {inst.engine}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  inst.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {inst.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{inst.name}</h3>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  {inst.host}:{inst.port}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
                  <div className="text-slate-400">Environment</div>
                  <div className="text-white font-bold mt-0.5">{inst.environment}</div>
                </div>
                <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
                  <div className="text-slate-400">TLS Encryption</div>
                  <div className={`font-bold mt-0.5 ${inst.is_tls_enforced ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {inst.is_tls_enforced ? 'Enforced' : 'Unencrypted'}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Sensitive Tables: <b className="text-white">{inst.sensitive_tables_count}</b></span>
                <span className="text-slate-400">Risk: <b className={`${inst.risk_score >= 60 ? 'text-rose-400' : 'text-emerald-400'}`}>{inst.risk_score}</b></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Interactive Query Inspector */}
      {activeTab === 'inspector' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Real-Time DAM SQL Query Security Inspector
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Simulate database statements against active DAM guardrails: mass extraction checks, DDL drops, and privilege escalation guards.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-slate-400 font-medium py-1">Quick Attack Presets:</span>
              <button
                onClick={() => {
                  setInspectSql("SELECT * FROM cardholders_master WHERE status = 'ACTIVE' LIMIT 500000;");
                  setInspectRows(500000);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Mass Exfiltration (500K Rows)
              </button>
              <button
                onClick={() => {
                  setInspectSql("DROP TABLE audit_trail_archive CASCADE;");
                  setInspectRows(0);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Suspicious DDL (DROP TABLE)
              </button>
              <button
                onClick={() => {
                  setInspectSql("ALTER ROLE analyst_read WITH SUPERUSER;");
                  setInspectRows(0);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Privilege Escalation (SUPERUSER)
              </button>
              <button
                onClick={() => {
                  setInspectSql("SELECT id, username FROM users WHERE tenant_id = 't-001' LIMIT 20;");
                  setInspectRows(20);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Benign Query (Scoped SELECT)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400">Database User</label>
                <input
                  type="text"
                  value={inspectUser}
                  onChange={e => setInspectUser(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400">Client IP</label>
                <input
                  type="text"
                  value={inspectIp}
                  onChange={e => setInspectIp(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400">Estimated Rows Returned</label>
                <input
                  type="number"
                  value={inspectRows}
                  onChange={e => setInspectRows(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
                />
              </div>
            </div>

            <textarea
              rows={4}
              value={inspectSql}
              onChange={e => setInspectSql(e.target.value)}
              placeholder="Paste SQL query to inspect..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />

            <div className="flex justify-end">
              <button
                onClick={handleInspectQuery}
                disabled={inspecting}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-950"
              >
                <Play className={`w-4 h-4 ${inspecting ? 'animate-spin' : ''}`} />
                Evaluate SQL Statement
              </button>
            </div>
          </div>

          {inspectionResult && (
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${inspectionResult.verdict === 'BLOCKED' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <h4 className="text-base font-bold text-white">
                    Inspection Outcome: {inspectionResult.verdict}
                  </h4>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Enforcement Action: {inspectionResult.action_taken}
                </span>
              </div>

              {inspectionResult.alert_triggered ? (
                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-rose-400">Alert Type: {inspectionResult.alert_type}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">{inspectionResult.severity}</span>
                  </div>
                  <div className="text-slate-300">
                    Alert Registered: <span className="font-mono text-white">{inspectionResult.alert_id}</span> • Query Type: <span className="font-mono text-white">{inspectionResult.query_type}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  Query verified clean. Rows returned and syntax comply with production DAM access guardrails.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
