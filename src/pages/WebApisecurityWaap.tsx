import React, { useState, useEffect } from 'react';
import {
  Shield, Server, AlertTriangle, CheckCircle2, RefreshCw,
  Zap, Search, Filter, ArrowRight, Lock, Eye, Network, Terminal,
  Radio, ShieldAlert, Cpu, Activity, Ban, RotateCcw, Share2, Layers,
  Compass, AlertOctagon, HelpCircle, HardDrive, Key, Globe, Database,
  Check, ExternalLink, Play, RadioTower, Wifi, FileText, Code, Slash
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function WebApisecurityWaap() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'events' | 'rules' | 'endpoints' | 'reputation' | 'simulator'>('events');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [overview, setOverview] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [ipReputations, setIpReputations] = useState<any[]>([]);

  // Filters
  const [eventAttackFilter, setEventAttackFilter] = useState<string>('ALL');
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState<string>('ALL');
  const [endpointSearch, setEndpointSearch] = useState<string>('');

  // Simulator Form
  const [simUri, setSimUri] = useState("/api/v1/search?q=test' UNION SELECT username,password FROM users--");
  const [simMethod, setSimMethod] = useState('GET');
  const [simBody, setSimBody] = useState('');
  const [simUserAgent, setSimUserAgent] = useState('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Manual IP Ban
  const [banIpInput, setBanIpInput] = useState('');
  const [banReasonInput, setBanReasonInput] = useState('');
  const [banning, setBanning] = useState(false);

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/waap/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOverview(await res.json());
    } catch (e) {
      console.error('Failed to load WAAP overview', e);
    }
  };

  const fetchRules = async () => {
    try {
      let url = `${API_URL}/v2/waap/rules`;
      if (ruleCategoryFilter !== 'ALL') url += `?category=${ruleCategoryFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setRules(await res.json());
    } catch (e) {
      console.error('Failed to load rules', e);
    }
  };

  const fetchEvents = async () => {
    try {
      let url = `${API_URL}/v2/waap/events`;
      if (eventAttackFilter !== 'ALL') url += `?attack_type=${eventAttackFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setEvents(await res.json());
    } catch (e) {
      console.error('Failed to load events', e);
    }
  };

  const fetchEndpoints = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/waap/endpoints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setEndpoints(await res.json());
    } catch (e) {
      console.error('Failed to load endpoints', e);
    }
  };

  const fetchIpReputation = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/waap/ip-reputation`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setIpReputations(await res.json());
    } catch (e) {
      console.error('Failed to load IP reputation', e);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOverview(),
      fetchRules(),
      fetchEvents(),
      fetchEndpoints(),
      fetchIpReputation()
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchOverview(),
        fetchRules(),
        fetchEvents(),
        fetchEndpoints(),
        fetchIpReputation()
      ]);
      setLoading(false);
    };
    init();
  }, [eventAttackFilter, ruleCategoryFilter]);

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean, action?: string) => {
    try {
      const res = await fetch(`${API_URL}/v2/waap/rules/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rule_id: ruleId,
          is_enabled: !currentEnabled,
          action: action || 'BLOCK'
        })
      });
      if (res.ok) {
        toast.success(`Rule ${ruleId} updated`);
        fetchRules();
        fetchOverview();
      }
    } catch (e: any) {
      toast.error('Failed to toggle rule: ' + e.message);
    }
  };

  const handleBlockIp = async (ip: string, reason?: string) => {
    setBanning(true);
    try {
      const res = await fetch(`${API_URL}/v2/waap/ip-block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ip_address: ip,
          reason: reason || 'Manual SOC Analyst Blacklist'
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `IP ${ip} blocked`);
        setBanIpInput('');
        setBanReasonInput('');
        fetchIpReputation();
        fetchOverview();
      } else {
        toast.error('Block IP failed');
      }
    } catch (e: any) {
      toast.error('Error blocking IP: ' + e.message);
    } finally {
      setBanning(false);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch(`${API_URL}/v2/waap/inspect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          uri: simUri,
          method: simMethod,
          body: simBody,
          user_agent: simUserAgent
        })
      });
      const data = await res.json();
      setSimResult(data);
      if (!data.allowed) {
        toast.error(`WAF BLOCKED: ${data.attack_type} (${data.rule_name})`);
      } else {
        toast.success('WAF ALLOWED: Payload signatures clean.');
      }
      fetchEvents();
      fetchOverview();
    } catch (e: any) {
      toast.error('Inspection failed: ' + e.message);
    } finally {
      setSimulating(false);
    }
  };

  const filteredEndpoints = endpoints.filter(ep => {
    if (!endpointSearch) return true;
    const s = endpointSearch.toLowerCase();
    return ep.path?.toLowerCase().includes(s) || ep.method?.toLowerCase().includes(s);
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Web Application & API Security (WAAP / WAF)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  OWASP Top 10 Active
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                  WAF • BOLA • Rate Limiting
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-0.5">
                Real-time HTTP traffic inspection, OWASP Top 10 injection defense, API authorization enforcement, and IP threat blacklisting.
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
            onClick={() => setActiveTab('simulator')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-lg shadow-emerald-600/20 transition"
          >
            <Zap className="w-4 h-4" />
            Test WAF Payload
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Defense Health Score */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">WAAP Defense Score</span>
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.waap_defense_score !== undefined ? `${overview.waap_defense_score}` : '--'}
            </span>
            <span className="text-xs font-medium text-gray-400">/ 100</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${overview?.waap_defense_score || 90}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Active HTTP Layer Mitigation</p>
        </div>

        {/* Total Inspected & Blocked */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Requests Inspected</span>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {(overview?.total_requests_inspected || 0).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-rose-400">
              ({overview?.total_blocked_attacks || 0} Blocked)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-emerald-400 font-semibold">
            <span>{overview?.block_rate_pct || 100}% Attack Containment Rate</span>
          </div>
        </div>

        {/* WAF Rules & OWASP */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">WAF Inspection Rules</span>
            <Lock className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.active_waf_rules_count || 0}
            </span>
            <span className="text-xs font-medium text-gray-400">Rules Enforcing</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">SQLi</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">XSS</span>
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium">RCE</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">SSRF</span>
          </div>
        </div>

        {/* Protected API Endpoints */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Protected APIs & IPs</span>
            <Server className="w-5 h-5 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.protected_endpoints_count || 0}
            </span>
            <span className="text-xs font-medium text-rose-400">
              ({overview?.blocked_malicious_ips_count || 0} IPs Banned)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <span>{overview?.high_risk_endpoints_count || 0} High-Risk Endpoints</span>
            <span>•</span>
            <span>BOLA Enforced</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'events'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Live Intercepted Attacks ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'rules'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          WAF Inspection Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'endpoints'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Server className="w-4 h-4" />
          API Security & BOLA Posture ({endpoints.length})
        </button>
        <button
          onClick={() => setActiveTab('reputation')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'reputation'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Ban className="w-4 h-4" />
          IP Reputation & Ban List ({ipReputations.length})
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'simulator'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          WAF Attack Simulator
        </button>
      </div>

      {/* TAB 1: LIVE INTERCEPTED ATTACKS */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">Attack Type:</span>
              {['ALL', 'SQLI', 'XSS', 'RCE', 'SSRF', 'PATH_TRAVERSAL'].map(t => (
                <button
                  key={t}
                  onClick={() => setEventAttackFilter(t)}
                  className={`px-2.5 py-0.5 rounded text-xs font-medium border transition ${
                    eventAttackFilter === t
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400">
              Showing {events.length} intercepted security events
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {events.map(e => (
              <div key={e.event_id} className="p-5 rounded-xl bg-gray-900/90 border border-rose-500/30 bg-rose-950/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 mt-0.5">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-gray-300">{e.event_id}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {e.attack_type}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-800 text-gray-300">
                          {e.request_method}
                        </span>
                        <span className="font-mono text-xs text-gray-300 max-w-md truncate">
                          {e.request_uri}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500 text-white">
                          {e.action_taken}
                        </span>
                      </div>

                      {e.payload_sample && (
                        <div className="mt-2 text-xs font-mono bg-black/50 p-2.5 rounded border border-gray-800 text-rose-400 overflow-x-auto">
                          {e.payload_sample}
                        </div>
                      )}

                      <div className="mt-2.5 flex items-center gap-3 text-xs text-gray-400">
                        <span><strong>Client IP:</strong> {e.client_ip}</span>
                        <span>•</span>
                        <span><strong>Rule:</strong> {e.rule_id}</span>
                        <span>•</span>
                        <span><strong>User-Agent:</strong> {e.user_agent}</span>
                      </div>
                    </div>
                  </div>

                  <div className="self-end md:self-center">
                    <button
                      onClick={() => handleBlockIp(e.client_ip, `Automated WAF block: ${e.attack_type}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium shadow-md shadow-rose-600/20 transition"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Block Client IP
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: WAF RULES & OWASP TOP 10 */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/60">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-950/80 text-xs uppercase text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Rule ID & Name</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Severity</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Matches</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {rules.map(r => (
                  <tr key={r.rule_id} className="hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{r.name}</div>
                      <div className="font-mono text-xs text-gray-500">{r.rule_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        r.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-gray-800 text-white">
                        {r.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-emerald-400 font-bold">
                      {r.match_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        r.is_enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {r.is_enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleRule(r.rule_id, r.is_enabled)}
                        className={`px-3 py-1 rounded text-xs font-medium transition ${
                          r.is_enabled
                            ? 'bg-rose-600/20 text-rose-300 hover:bg-rose-600/30'
                            : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'
                        }`}
                      >
                        {r.is_enabled ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: API SECURITY & BOLA */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search API endpoints..."
                value={endpointSearch}
                onChange={e => setEndpointSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="text-xs text-gray-400">
              Showing {filteredEndpoints.length} protected API endpoints
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/60">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-950/80 text-xs uppercase text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Endpoint Path & Method</th>
                  <th className="px-4 py-3 font-semibold">Authentication</th>
                  <th className="px-4 py-3 font-semibold">Schema Validation</th>
                  <th className="px-4 py-3 font-semibold">Rate Limit</th>
                  <th className="px-4 py-3 font-semibold">Traffic Volume</th>
                  <th className="px-4 py-3 font-semibold">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredEndpoints.map(ep => (
                  <tr key={ep.endpoint_id} className="hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300">
                          {ep.method}
                        </span>
                        <span className="font-mono text-sm text-white font-semibold">{ep.path}</span>
                      </div>
                      <div className="font-mono text-[11px] text-gray-500">{ep.endpoint_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        ep.auth_type === 'NONE'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {ep.auth_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ep.has_schema_validation ? (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Strict JSON Schema
                        </span>
                      ) : (
                        <span className="text-xs text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Missing Validation
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-300">
                      {ep.rate_limit_per_min} req / min
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {ep.total_requests.toLocaleString()} reqs ({ep.blocked_requests} blocked)
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs font-bold ${
                        ep.risk_score >= 70 ? 'text-rose-400' : ep.risk_score >= 40 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {ep.risk_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: IP REPUTATION & BAN LIST */}
      {activeTab === 'reputation' && (
        <div className="space-y-6">
          {/* Quick Ban Box */}
          <div className="p-5 rounded-xl bg-gray-900 border border-gray-800">
            <h3 className="text-sm font-bold text-white mb-3">Add IP to Perimeter Ban List</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="IP Address (e.g. 198.51.100.222)"
                value={banIpInput}
                onChange={e => setBanIpInput(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Ban Reason (e.g. Malicious SQLi scanner)"
                value={banReasonInput}
                onChange={e => setBanReasonInput(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
              />
              <button
                onClick={() => handleBlockIp(banIpInput, banReasonInput)}
                disabled={banning || !banIpInput}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {banning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                Enforce IP Ban
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/60">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-950/80 text-xs uppercase text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">IP Address</th>
                  <th className="px-4 py-3 font-semibold">Reputation Score</th>
                  <th className="px-4 py-3 font-semibold">Threat Category</th>
                  <th className="px-4 py-3 font-semibold">Ban Reason</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {ipReputations.map(ip => (
                  <tr key={ip.ip_address} className="hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3 font-mono text-sm font-bold text-white">
                      {ip.ip_address}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-rose-400">
                        {ip.reputation_score} / 100
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {ip.threat_category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300">
                      {ip.reason}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-600 text-white">
                        BLOCKED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: WAF ATTACK SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">WAF Payload Inspection Simulator</h2>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Test HTTP requests against the live Monitorix WAF engine to verify blocking of OWASP Top 10 attack payloads.
            </p>

            <form onSubmit={handleSimulate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Pre-Loaded Attack Preset</label>
                <select
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'sqli') {
                      setSimMethod('GET');
                      setSimUri("/api/v1/search?q=test' UNION SELECT username,password FROM users--");
                      setSimBody('');
                    } else if (val === 'xss') {
                      setSimMethod('POST');
                      setSimUri('/api/v1/comments');
                      setSimBody("<script>alert(document.cookie)</script>");
                    } else if (val === 'ssrf') {
                      setSimMethod('POST');
                      setSimUri('/api/v1/webhook?url=http://169.254.169.254/latest/meta-data/');
                      setSimBody('');
                    } else if (val === 'rce') {
                      setSimMethod('POST');
                      setSimUri('/api/v1/diagnostics');
                      setSimBody('target=127.0.0.1; cat /etc/passwd; id');
                    } else if (val === 'traversal') {
                      setSimMethod('GET');
                      setSimUri('/api/v1/download?file=../../../../etc/shadow');
                      setSimBody('');
                    } else if (val === 'clean') {
                      setSimMethod('GET');
                      setSimUri('/api/v1/search?q=cybersecurity+threat+monitoring');
                      setSimBody('');
                    }
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="sqli">SQL Injection (UNION Select)</option>
                  <option value="xss">Cross-Site Scripting (Script Tag & Cookie Exfiltration)</option>
                  <option value="ssrf">SSRF (AWS Metadata 169.254.169.254)</option>
                  <option value="rce">Command Injection (Semicolon & Cat /etc/passwd)</option>
                  <option value="traversal">Path Traversal (Dot-Dot-Slash /etc/shadow)</option>
                  <option value="clean">Legitimate Safe Request (Clean Search)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Method</label>
                  <select
                    value={simMethod}
                    onChange={e => setSimMethod(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Request URI</label>
                  <input
                    type="text"
                    value={simUri}
                    onChange={e => setSimUri(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Request Body</label>
                <textarea
                  rows={3}
                  value={simBody}
                  onChange={e => setSimBody(e.target.value)}
                  placeholder="Optional POST body payload"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={simulating}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Inspect Request Payload
              </button>
            </form>
          </div>

          <div className="p-6 rounded-xl bg-gray-950 border border-gray-800 font-mono flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <span className="text-xs text-gray-400 uppercase font-semibold">WAF Enforcement Verdict</span>
                {simResult?.action === 'BLOCK' ? (
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-500 text-white">
                    HTTP 403 BLOCKED
                  </span>
                ) : simResult?.action === 'ALLOW' ? (
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500 text-white">
                    HTTP 200 ALLOWED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-800 text-gray-400">
                    IDLE
                  </span>
                )}
              </div>

              <div className="mt-4 text-xs text-gray-300 space-y-2 overflow-auto max-h-[380px]">
                {simResult ? (
                  <pre className="text-emerald-400 text-xs bg-gray-900/90 p-4 rounded-lg border border-gray-800 overflow-x-auto">
                    {JSON.stringify(simResult, null, 2)}
                  </pre>
                ) : (
                  <div className="text-gray-600 italic py-16 text-center">
                    Trigger inspection on the left to evaluate HTTP payload signatures through Monitorix WAF rules.
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
