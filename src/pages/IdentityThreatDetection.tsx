import React, { useState, useEffect } from 'react';
import {
  Shield, Key, Users, AlertTriangle, CheckCircle2, RefreshCw,
  Zap, Search, Filter, ArrowRight, Lock, Eye, Network, Terminal,
  Radio, ShieldAlert, Cpu, Activity, Ban, RotateCcw, Share2, Layers,
  Compass, AlertOctagon, HelpCircle, Server
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function IdentityThreatDetection() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'threats' | 'accounts' | 'graph' | 'evaluator'>('threats');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [overview, setOverview] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [threats, setThreats] = useState<any[]>([]);
  const [attackGraph, setAttackGraph] = useState<any>(null);

  // Filters
  const [accountTierFilter, setAccountTierFilter] = useState<string>('ALL');
  const [accountSearch, setAccountSearch] = useState<string>('');
  const [threatSeverityFilter, setThreatSeverityFilter] = useState<string>('ALL');

  // Evaluator Form
  const [evalEventType, setEvalEventType] = useState('TGS_REQUEST');
  const [evalSourceAccount, setEvalSourceAccount] = useState('secops-operator@company.internal');
  const [evalTargetAccount, setEvalTargetAccount] = useState('svc_mssql_prod');
  const [evalEncryption, setEvalEncryption] = useState('0x17 (RC4_HMAC_MD5)');
  const [evalSpn, setEvalSpn] = useState('MSSQLSvc/db01.company.internal:1433');
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  // Containment Action Modal
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const [containmentAction, setContainmentAction] = useState('DISABLE_ACCOUNT');
  const [containing, setContaining] = useState(false);

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/itdr/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (e) {
      console.error('Failed to load ITDR overview', e);
    }
  };

  const fetchAccounts = async () => {
    try {
      let url = `${API_URL}/v2/itdr/accounts`;
      if (accountTierFilter !== 'ALL') {
        url += `?privilege_tier=${accountTierFilter}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (e) {
      console.error('Failed to load accounts', e);
    }
  };

  const fetchThreats = async () => {
    try {
      let url = `${API_URL}/v2/itdr/threats`;
      if (threatSeverityFilter !== 'ALL') {
        url += `?severity_filter=${threatSeverityFilter}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setThreats(data);
      }
    } catch (e) {
      console.error('Failed to load threats', e);
    }
  };

  const fetchGraph = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/itdr/graph`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAttackGraph(data);
      }
    } catch (e) {
      console.error('Failed to load attack graph', e);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchOverview(), fetchAccounts(), fetchThreats(), fetchGraph()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchOverview(), fetchAccounts(), fetchThreats(), fetchGraph()]);
      setLoading(false);
    };
    init();
  }, [accountTierFilter, threatSeverityFilter]);

  const handleEvaluateTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluating(true);
    setEvalResult(null);
    try {
      const payload: any = {
        event_type: evalEventType,
        source_account: evalSourceAccount,
        target_account: evalTargetAccount,
        encryption: evalEncryption,
        spn: evalSpn
      };
      if (evalEventType === 'NTLM_LOGON') {
        payload.auth_package = 'NTLM';
        payload.logon_type = 3;
      }
      if (evalEventType === 'DCSYNC') {
        payload.encryption = undefined;
        payload.api_called = 'DSGetNCChanges';
      }
      if (evalEventType === 'OAUTH_CONSENT') {
        payload.scopes = ['Directory.ReadWrite.All', 'Mail.ReadWrite'];
      }

      const res = await fetch(`${API_URL}/v2/itdr/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setEvalResult(data);
      if (data.threat_detected) {
        toast.error(`Threat Detected: ${data.threat_type} (${data.mitre})`);
      } else {
        toast.success('Telemetry normal. No threat detected.');
      }
      fetchThreats();
      fetchOverview();
    } catch (err: any) {
      toast.error('Evaluation failed: ' + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  const handleContainThreat = async () => {
    if (!selectedThreat) return;
    setContaining(true);
    try {
      const res = await fetch(`${API_URL}/v2/itdr/contain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          threat_id: selectedThreat.threat_id,
          action: containmentAction
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Contained: ${data.message}`);
        setSelectedThreat(null);
        refreshAll();
      } else {
        toast.error(data.detail || 'Containment failed');
      }
    } catch (err: any) {
      toast.error('Containment execution error: ' + err.message);
    } finally {
      setContaining(false);
    }
  };

  const filteredAccounts = accounts.filter(acc => {
    if (!accountSearch) return true;
    const s = accountSearch.toLowerCase();
    return (
      acc.display_name?.toLowerCase().includes(s) ||
      acc.account_id?.toLowerCase().includes(s) ||
      acc.privilege_tier?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Identity Threat Detection & Response (ITDR)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Shield
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                  MITRE T1558 / T1003 / T1550
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-0.5">
                Active Directory, Entra ID, and Cloud Identity threat hunting, Kerberoasting defense, DCSync monitoring, and Tier-0 attack path elimination.
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
            onClick={() => setActiveTab('evaluator')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium shadow-lg shadow-purple-600/20 transition"
          >
            <Zap className="w-4 h-4" />
            Simulate Identity Attack
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Posture Score */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Identity Posture</span>
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.posture_score !== undefined ? `${overview.posture_score}` : '--'}
            </span>
            <span className="text-xs font-medium text-gray-400">/ 100</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (overview?.posture_score || 0) > 75
                  ? 'bg-emerald-500'
                  : (overview?.posture_score || 0) > 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${overview?.posture_score || 50}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Zero-Trust Directory Hygiene Rating</p>
        </div>

        {/* Monitored Accounts */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Directory Accounts</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.total_accounts_monitored || 0}
            </span>
            <span className="text-xs font-medium text-purple-400">
              ({overview?.tier_distribution?.TIER_0_DOMAIN_ADMIN || 0} Tier-0)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1 text-rose-400 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {overview?.high_risk_accounts || 0} High-Risk
            </span>
            <span>•</span>
            <span>{overview?.tier_distribution?.TIER_CRITICAL_SERVICE || 0} Service Accts</span>
          </div>
        </div>

        {/* Active Threats */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Threats</span>
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">
              {overview?.active_threats_count || 0}
            </span>
            <span className="text-xs font-medium text-gray-400">Detections Active</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
              {overview?.active_threat_severities?.CRITICAL || 0} Critical
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              {overview?.active_threat_severities?.HIGH || 0} High
            </span>
          </div>
        </div>

        {/* Attack Paths */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vulnerabilities & Paths</span>
            <Network className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.attack_graph_edges_count || 0}
            </span>
            <span className="text-xs font-medium text-gray-400">Escalation Edges</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-amber-400 font-medium">
            <span>{overview?.vulnerability_counts?.kerberoastable_spns || 0} Kerberoastable SPNs</span>
            <span>•</span>
            <span>{overview?.vulnerability_counts?.shadow_admins || 0} Shadow Admins</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('threats')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'threats'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Active Identity Threats ({threats.filter(t => t.status === 'ACTIVE').length})
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'accounts'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Identity Inventory & Posture ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'graph'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Network className="w-4 h-4" />
          Tier-0 Attack Path Graph
        </button>
        <button
          onClick={() => setActiveTab('evaluator')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'evaluator'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Telemetry Evaluator & Simulation
        </button>
      </div>

      {/* TAB 1: THREAT DETECTIONS */}
      {activeTab === 'threats' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-400 uppercase">Filter Severity:</span>
              <div className="flex items-center gap-1.5">
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(s => (
                  <button
                    key={s}
                    onClick={() => setThreatSeverityFilter(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                      threatSeverityFilter === s
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Showing {threats.length} detected threat events
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {threats.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-gray-900/50 rounded-xl border border-gray-800">
                No identity threats matching current filter.
              </div>
            ) : (
              threats.map(threat => (
                <div
                  key={threat.threat_id}
                  className={`p-5 rounded-xl bg-gray-900/90 border transition ${
                    threat.status === 'CONTAINED'
                      ? 'border-gray-800 opacity-75'
                      : threat.severity === 'CRITICAL'
                      ? 'border-rose-500/40 bg-rose-950/10'
                      : 'border-amber-500/30 bg-amber-950/10'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-lg border mt-0.5 ${
                        threat.status === 'CONTAINED'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : threat.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}>
                        {threat.status === 'CONTAINED' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <AlertOctagon className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-gray-300">
                            {threat.threat_id}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            threat.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {threat.severity}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {threat.threat_type}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            MITRE {threat.mitre_technique} ({threat.mitre_tactic})
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            threat.status === 'CONTAINED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                          }`}>
                            {threat.status}
                          </span>
                        </div>

                        <div className="mt-2 text-sm text-gray-200">
                          {threat.details?.indicator || threat.details?.reason || 'Suspicious identity pattern identified.'}
                        </div>

                        <div className="mt-2.5 flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                          <span>
                            <strong className="text-gray-300">Source:</strong> {threat.source_account} ({threat.source_host})
                          </span>
                          <span>•</span>
                          <span>
                            <strong className="text-gray-300">Target:</strong> {threat.target_account} ({threat.target_domain})
                          </span>
                          {threat.containment_action_taken && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400">
                                <strong>Action:</strong> {threat.containment_action_taken}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {threat.status !== 'CONTAINED' && (
                        <button
                          onClick={() => {
                            setSelectedThreat(threat);
                            setContainmentAction(
                              threat.threat_type === 'OAUTH_CONSENT_ABUSE'
                                ? 'REVOKE_OAUTH_TOKENS'
                                : threat.threat_type === 'KERBEROASTING'
                                ? 'TRIGGER_PASSWORD_RESET'
                                : 'DISABLE_ACCOUNT'
                            );
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium shadow-md shadow-rose-600/20 transition"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Contain Threat
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: IDENTITY INVENTORY & POSTURE */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-400 uppercase">Tier:</span>
              {[
                { label: 'All', value: 'ALL' },
                { label: 'Tier-0 Domain Admins', value: 'TIER_0_DOMAIN_ADMIN' },
                { label: 'Tier-1 Server Admins', value: 'TIER_1_SERVER_ADMIN' },
                { label: 'Critical Service', value: 'TIER_CRITICAL_SERVICE' },
                { label: 'Tier-2 Users', value: 'TIER_2_USER' }
              ].map(t => (
                <button
                  key={t.value}
                  onClick={() => setAccountTierFilter(t.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                    accountTierFilter === t.value
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search account name, id, tier..."
                value={accountSearch}
                onChange={e => setAccountSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/60">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-950/80 text-xs uppercase text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Account / Identity</th>
                  <th className="px-4 py-3 font-semibold">Provider & Type</th>
                  <th className="px-4 py-3 font-semibold">Privilege Tier</th>
                  <th className="px-4 py-3 font-semibold">Risk Score</th>
                  <th className="px-4 py-3 font-semibold">Posture Flags</th>
                  <th className="px-4 py-3 font-semibold">MFA</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredAccounts.map(acc => (
                  <tr key={acc.account_id} className="hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{acc.display_name}</div>
                      <div className="font-mono text-xs text-gray-500">{acc.account_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold text-gray-300">{acc.identity_provider}</div>
                      <div className="text-xs text-gray-500">{acc.account_type}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        acc.privilege_tier === 'TIER_0_DOMAIN_ADMIN'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : acc.privilege_tier === 'TIER_CRITICAL_SERVICE'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {acc.privilege_tier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold ${
                          acc.risk_score >= 70 ? 'text-rose-400' : acc.risk_score >= 40 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {acc.risk_score}
                        </span>
                        <div className="w-16 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              acc.risk_score >= 70 ? 'bg-rose-500' : acc.risk_score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${acc.risk_score}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {acc.is_kerberoastable && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                            Kerberoastable SPN
                          </span>
                        )}
                        {acc.has_unconstrained_delegation && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            Unconstrained Del.
                          </span>
                        )}
                        {acc.is_shadow_admin && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            Shadow Admin
                          </span>
                        )}
                        {!acc.is_kerberoastable && !acc.has_unconstrained_delegation && !acc.is_shadow_admin && (
                          <span className="text-xs text-gray-500">None detected</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {acc.mfa_enabled ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Enforced
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-rose-400 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Missing MFA
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        acc.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}>
                        {acc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TIER-0 ATTACK PATH GRAPH */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Network className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">Privilege Escalation & Identity Attack Paths</h3>
                <p className="text-xs text-gray-400">
                  Visualizes multi-hop attack vectors targeting Tier-0 Domain Controllers and Active Directory root secrets.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                Active Exploit Path Identified
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attackGraph?.links?.map((link: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-purple-500/40 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-purple-400 font-semibold">{link.path_id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    link.risk_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {link.risk_level} Risk (Hop #{link.hops_count})
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 my-3">
                  <div className="p-2.5 rounded-lg bg-gray-800/80 border border-gray-700 flex-1">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Source Asset</span>
                    <div className="text-xs font-bold text-white truncate">{link.source}</div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-mono text-amber-400 font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 mb-1">
                      {link.relation_type}
                    </span>
                    <ArrowRight className="w-4 h-4 text-purple-400 animate-pulse" />
                  </div>

                  <div className="p-2.5 rounded-lg bg-gray-800/80 border border-gray-700 flex-1">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Target Asset</span>
                    <div className="text-xs font-bold text-rose-300 truncate">{link.target}</div>
                  </div>
                </div>

                <div className="text-[11px] text-gray-400 border-t border-gray-800/60 pt-2 flex items-center justify-between">
                  <span>Exploitation: Multi-hop credential theft towards Tier-0</span>
                  <span className="text-rose-400 font-semibold">Active Vector</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TELEMETRY EVALUATOR & SIMULATION */}
      {activeTab === 'evaluator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Heuristic Identity Attack Simulator</h2>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Simulate live identity telemetry to test Monitorix sovereign heuristics against Kerberoasting, DCSync, Pass-the-Hash, and OAuth abuse.
            </p>

            <form onSubmit={handleEvaluateTelemetry} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Attack Pattern Heuristic</label>
                <select
                  value={evalEventType}
                  onChange={e => {
                    const val = e.target.value;
                    setEvalEventType(val);
                    if (val === 'TGS_REQUEST') {
                      setEvalSourceAccount(accounts[0]?.UserPrincipalName || 'secops-operator@company.internal');
                      setEvalTargetAccount('svc_mssql_prod');
                      setEvalEncryption('0x17 (RC4_HMAC_MD5)');
                      setEvalSpn('MSSQLSvc/db01.company.internal:1433');
                    } else if (val === 'DCSYNC') {
                      setEvalSourceAccount(accounts[1]?.UserPrincipalName || 'service-sync@company.internal');
                      setEvalTargetAccount('krbtgt');
                      setEvalEncryption('None (RPC DSGetNCChanges)');
                      setEvalSpn('N/A');
                    } else if (val === 'NTLM_LOGON') {
                      setEvalSourceAccount(accounts[2]?.UserPrincipalName || 'analyst@company.internal');
                      setEvalTargetAccount('SRV-FILE-01');
                      setEvalEncryption('NTLMv2');
                      setEvalSpn('N/A');
                    } else if (val === 'OAUTH_CONSENT') {
                      setEvalSourceAccount('CloudSync Utility App');
                      setEvalTargetAccount('Tenant Admin');
                      setEvalEncryption('TLS / OAuth 2.0');
                      setEvalSpn('N/A');
                    }
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="TGS_REQUEST">Kerberoasting (T1558.003 - TGS RC4 request)</option>
                  <option value="DCSYNC">DCSync (T1003.006 - DSGetNCChanges replication abuse)</option>
                  <option value="NTLM_LOGON">Pass-the-Hash (T1550.002 - NTLM LogonType 3)</option>
                  <option value="OAUTH_CONSENT">OAuth Consent Abuse (T1098.003 - High privilege scopes)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Source Account</label>
                  <input
                    type="text"
                    value={evalSourceAccount}
                    onChange={e => setEvalSourceAccount(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Target Account</label>
                  <input
                    type="text"
                    value={evalTargetAccount}
                    onChange={e => setEvalTargetAccount(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Cipher / API Call</label>
                <input
                  type="text"
                  value={evalEncryption}
                  onChange={e => setEvalEncryption(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Service Principal Name (SPN)</label>
                <input
                  type="text"
                  value={evalSpn}
                  onChange={e => setEvalSpn(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={evaluating}
                className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                {evaluating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Evaluate Telemetry Stream
              </button>
            </form>
          </div>

          {/* Evaluator Output Display */}
          <div className="p-6 rounded-xl bg-gray-950 border border-gray-800 font-mono flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <span className="text-xs text-gray-400 uppercase font-semibold">Heuristic Engine Output</span>
                {evalResult?.threat_detected ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    THREAT DETECTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-800 text-gray-400">
                    IDLE / NORMAL
                  </span>
                )}
              </div>

              <div className="mt-4 text-xs text-gray-300 space-y-2 overflow-auto max-h-[380px]">
                {evalResult ? (
                  <pre className="text-emerald-400 text-xs bg-gray-900/90 p-4 rounded-lg border border-gray-800 overflow-x-auto">
                    {JSON.stringify(evalResult, null, 2)}
                  </pre>
                ) : (
                  <div className="text-gray-600 italic py-16 text-center">
                    Run simulation on the left to evaluate identity telemetry through Monitorix sovereign heuristic rules.
                  </div>
                )}
              </div>
            </div>

            {evalResult?.threat_detected && (
              <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                <span className="text-xs text-rose-300 font-semibold">Immediate Containment Recommended</span>
                <button
                  onClick={() => {
                    setSelectedThreat({
                      threat_id: evalResult.threat_id,
                      threat_type: evalResult.threat_type,
                      target_account: evalTargetAccount
                    });
                    setContainmentAction('DISABLE_ACCOUNT');
                  }}
                  className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
                >
                  Contain Threat
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Containment Modal */}
      {selectedThreat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Active Response Containment</h3>
                <p className="text-xs text-gray-400">{selectedThreat.threat_id}</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 mb-4">
              Choose an active defense response to immediately isolate target asset <strong className="text-white">{selectedThreat.target_account}</strong> across Active Directory and cloud identity providers.
            </p>

            <div className="space-y-2 mb-6">
              {[
                { id: 'DISABLE_ACCOUNT', label: 'Disable Directory Account', desc: 'Revokes active logons and suspends account in Active Directory / Entra.' },
                { id: 'TRIGGER_PASSWORD_RESET', label: 'Force Password & Ticket Reset', desc: 'Forces Kerberos ticket invalidation (krbtgt) and password change.' },
                { id: 'REVOKE_OAUTH_TOKENS', label: 'Revoke OAuth Grants & Sessions', desc: 'Invalidates all refresh tokens and app permissions.' },
                { id: 'ISOLATE_KERBEROS_TICKET', label: 'Isolate Kerberos TGT', desc: 'Invalidates Ticket Granting Service authorization.' }
              ].map(action => (
                <label
                  key={action.id}
                  onClick={() => setContainmentAction(action.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    containmentAction === action.id
                      ? 'bg-rose-500/10 border-rose-500/40 text-white'
                      : 'bg-gray-800/40 border-gray-700/60 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="containAction"
                    checked={containmentAction === action.id}
                    onChange={() => setContainmentAction(action.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{action.label}</div>
                    <div className="text-[11px] text-gray-400">{action.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedThreat(null)}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleContainThreat}
                disabled={containing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
              >
                {containing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Execute Containment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
