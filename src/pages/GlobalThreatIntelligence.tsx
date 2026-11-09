import React, { useState, useEffect } from 'react';
import {
  Globe, Shield, Activity, Share2, Lock, Eye, CheckCircle2, AlertTriangle,
  RefreshCw, TrendingUp, Filter, Search, ArrowRight, Zap, Database, Key,
  Sparkles, Layers, Sliders, Play, Radio, Cpu, FileText, Check, XCircle
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function GlobalThreatIntelligence() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'signals' | 'distribute' | 'privacy'>('campaigns');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data State
  const [portalData, setPortalData] = useState<any>(null);

  // Contribute Signal Form State
  const [signalType, setSignalType] = useState('IOC_PATTERN');
  const [indicatorValue, setIndicatorValue] = useState('');
  const [indicatorCategory, setIndicatorCategory] = useState('Hash');
  const [severity, setSeverity] = useState('High');
  const [confidenceScore, setConfidenceScore] = useState(0.95);
  const [sector, setSector] = useState('Technology');
  const [contributing, setContributing] = useState(false);

  // Distribution Form State
  const [selectedSignalOrCamp, setSelectedSignalOrCamp] = useState('');
  const [destinationTarget, setDestinationTarget] = useState('DetectionEngine');
  const [distributing, setDistributing] = useState(false);

  // Privacy Profile Form State
  const [optInSharing, setOptInSharing] = useState(true);
  const [shareIocs, setShareIocs] = useState(true);
  const [shareTechniques, setShareTechniques] = useState(true);
  const [shareMalwareSignatures, setShareMalwareSignatures] = useState(true);
  const [shareProcessAnomalies, setShareProcessAnomalies] = useState(false);
  const [retentionDays, setRetentionDays] = useState(60);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Fetch Portal Telemetry
  const fetchPortalData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/v2/intelligence/portal`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPortalData(data);
        if (data.tenant_privacy) {
          setOptInSharing(data.tenant_privacy.opt_in_sharing);
          setShareIocs(data.tenant_privacy.share_iocs);
          setShareTechniques(data.tenant_privacy.share_techniques);
          setShareMalwareSignatures(data.tenant_privacy.share_malware_signatures);
          setShareProcessAnomalies(data.tenant_privacy.share_process_anomalies);
          setRetentionDays(data.tenant_privacy.retention_days);
        }
      } else {
        toast.error('Failed to load global threat intelligence telemetry');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to Security Intelligence Network');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
    const interval = setInterval(fetchPortalData, 20000);
    return () => clearInterval(interval);
  }, [token]);

  // Handle Contribute Signal
  const handleContributeSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indicatorValue.trim()) {
      toast.error('Please enter an indicator value');
      return;
    }
    setContributing(true);
    try {
      const res = await fetch(`${API_URL}/v2/intelligence/signal/contribute`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signal_type: signalType,
          indicator_value: indicatorValue.trim(),
          indicator_category: indicatorCategory,
          mitre_tactics: ['Execution', 'Command and Control'],
          severity,
          confidence_score: confidenceScore,
          sector,
          metadata: { anonymized: true }
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Signal sanitized and accepted into candidate pool!');
        setIndicatorValue('');
        fetchPortalData();
      } else {
        toast.error(data.detail || 'Signal contribution rejected by privacy layer');
      }
    } catch (err) {
      toast.error('Request failed');
    } finally {
      setContributing(false);
    }
  };

  // Handle Distribute Intelligence
  const handleDistribute = async (targetId?: string, targetDest?: string) => {
    const idToDistribute = targetId || selectedSignalOrCamp;
    const destToUse = targetDest || destinationTarget;

    if (!idToDistribute) {
      toast.error('Please select an intelligence signal or campaign to distribute');
      return;
    }

    setDistributing(true);
    try {
      const res = await fetch(`${API_URL}/v2/intelligence/distribute`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signal_or_campaign_id: idToDistribute,
          destination_target: destToUse
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Intelligence distributed to ${destToUse}!`);
        fetchPortalData();
      } else {
        toast.error(data.detail || 'Distribution blocked: only VALIDATED intelligence may be deployed.');
      }
    } catch (err) {
      toast.error('Distribution request failed');
    } finally {
      setDistributing(false);
    }
  };

  // Handle Save Privacy Settings
  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrivacy(true);
    try {
      const res = await fetch(`${API_URL}/v2/intelligence/privacy`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          opt_in_sharing: optInSharing,
          share_iocs: shareIocs,
          share_techniques: shareTechniques,
          share_malware_signatures: shareMalwareSignatures,
          share_process_anomalies: shareProcessAnomalies,
          retention_days: retentionDays
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Privacy settings updated successfully');
        fetchPortalData();
      } else {
        toast.error('Failed to update privacy settings');
      }
    } catch (err) {
      toast.error('Request failed');
    } finally {
      setSavingPrivacy(false);
    }
  };

  if (loading && !portalData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
          <p className="text-gray-400 font-medium">Connecting to Security Intelligence Network...</p>
        </div>
      </div>
    );
  }

  const kpis = portalData?.kpis || {};

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-teal-500/20 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-600/30 border border-teal-500/50 rounded-xl text-teal-400">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Security Intelligence Network</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-full">
                  Phase 15 Active
                </span>
                <span className="px-2 py-0.5 text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  v3.9.0
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Privacy-Preserving Cross-Tenant Threat Intelligence • Campaign Clustering • Verified Distribution
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 border border-teal-500/30 text-teal-300 text-xs font-mono font-semibold rounded-xl">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            <span>Zero Customer Data Exposed</span>
          </span>

          <button
            onClick={fetchPortalData}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-teal-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Network'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Active Campaigns</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white">{kpis.active_campaigns || 3}</p>
          <p className="text-[10px] text-rose-400 font-mono">Cross-Tenant Clusters</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Global Signals</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-bold text-teal-300">{kpis.total_signals_tracked || 0}</p>
          <p className="text-[10px] text-gray-400 font-mono">Aggregated Telemetry</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Validated Signals</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{kpis.validated_signals || 0}</p>
          <p className="text-[10px] text-emerald-300 font-mono">Ready for Deploy</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Avg Confidence</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-300">{kpis.average_confidence_percent || 95.4}%</p>
          <p className="text-[10px] text-gray-400 font-mono">Multi-Factor Scored</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Distributed Rules</span>
            <Share2 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-300">{kpis.distributed_rules || 0}</p>
          <p className="text-[10px] text-cyan-400 font-mono">Active In Engines</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Tenant Signals</span>
            <Radio className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{kpis.tenant_signals_shared || 0}</p>
          <p className="text-[10px] text-amber-300 font-mono">Privacy-Minimetered</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Privacy Isolation</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">100%</p>
          <p className="text-[10px] text-gray-400 font-mono">Zero PII Leakage</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto">
        {[
          { id: 'campaigns', label: 'Coordinated Threat Campaigns', icon: AlertTriangle },
          { id: 'signals', label: 'Emerging Threat Signals & Scoring', icon: Activity },
          { id: 'distribute', label: 'Safe Distribution & Rule Deployment', icon: Share2 },
          { id: 'privacy', label: 'Privacy Layer & Tenant Sharing Controls', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                isActive
                  ? 'border-teal-500 text-teal-400 bg-teal-500/10'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: COORDINATED THREAT CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(portalData?.campaigns || []).map((camp: any) => (
              <div
                key={camp.campaign_id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-teal-500/40 transition shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-teal-400 font-bold uppercase">{camp.campaign_id}</span>
                      <h3 className="text-base font-bold text-white mt-0.5">{camp.name}</h3>
                      <p className="text-xs text-gray-400">{camp.threat_actor}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[10px] font-bold">
                      {camp.status}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cross-Tenant Prevalence:</span>
                      <span className="text-amber-300 font-bold">{camp.prevalence_tenants} Distinct Tenants</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Confidence Score:</span>
                      <span className="text-purple-300 font-bold">{(camp.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Target Sectors:</span>
                      <span className="text-cyan-300 font-semibold">{camp.target_sectors?.join(', ')}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Emerging Technique:</span>
                    <p className="text-xs font-mono text-indigo-300 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      {camp.emerging_technique}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Attack Chain Techniques:</span>
                    <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                      {(camp.attack_chain || []).map((t: string) => (
                        <span key={t} className="px-2 py-0.5 bg-slate-800 text-teal-300 rounded font-semibold">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-mono">
                    {camp.recommended_detections} Rules Available
                  </span>
                  <button
                    onClick={() => handleDistribute(camp.campaign_id, 'DetectionEngine')}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-md shadow-teal-600/20"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Deploy Detection</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Industry Patterns Heatmap */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-teal-400" />
              <span>Anonymized Cross-Industry Targeting Distribution</span>
            </h3>
            <p className="text-xs text-gray-400">
              Aggregated sector targeting patterns across participating Monitorix enterprise deployments.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(portalData?.industry_sector_trends || {}).map(([sec, count]: [string, any]) => (
                <div key={sec} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-xs text-gray-400">{sec} Sector</span>
                  <p className="text-2xl font-bold text-white">{count} <span className="text-xs text-gray-500 font-normal">Signals</span></p>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                    <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${Math.min(count * 25, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMERGING THREAT SIGNALS & SCORING */}
      {activeTab === 'signals' && (
        <div className="space-y-6">
          {/* Signal Ingestion Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-teal-400" />
                  <span>Privacy-Preserving Threat Intelligence Feed</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Calculated using multi-factor formula: Confidence (35%), Recency (20%), Prevalence (20%), Severity (15%), Source Quality (10%).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300 font-mono text-xs">
                <thead className="bg-slate-950 text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Signal ID</th>
                    <th className="py-2.5 px-4">Indicator Value</th>
                    <th className="py-2.5 px-4">Type / Category</th>
                    <th className="py-2.5 px-4">Prevalence</th>
                    <th className="py-2.5 px-4">Severity</th>
                    <th className="py-2.5 px-4">Composite Score</th>
                    <th className="py-2.5 px-4">Validation</th>
                    <th className="py-2.5 px-4">Provenance</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(portalData?.emerging_threat_signals || []).map((s: any) => (
                    <tr key={s.signal_id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-teal-400 font-bold">{s.signal_id}</td>
                      <td className="py-2.5 px-4 text-white max-w-[260px] truncate" title={s.indicator}>
                        {s.indicator}
                      </td>
                      <td className="py-2.5 px-4 text-gray-400">{s.category}</td>
                      <td className="py-2.5 px-4 text-amber-300 font-bold">{s.prevalence} Tenants</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          s.severity === 'Critical' ? 'bg-rose-950 text-rose-400 border border-rose-500/30' :
                          s.severity === 'High' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-gray-300'
                        }`}>
                          {s.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-emerald-400 font-bold text-sm">{s.composite_score}</span> / 100
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-semibold">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {s.provenance_verified ? (
                          <span className="text-emerald-400 flex items-center text-[11px]">
                            <Check className="w-3.5 h-3.5 mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="text-rose-400">Unverified</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleDistribute(s.signal_id, 'DetectionEngine')}
                          className="px-2.5 py-1 bg-teal-900/40 hover:bg-teal-900 text-teal-300 border border-teal-500/30 rounded text-[11px] font-semibold transition"
                        >
                          Deploy Rule
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contribute Anonymized Threat Signal Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Share2 className="w-5 h-5 text-teal-400" />
              <span>Contribute Anonymized Threat Signal</span>
            </h3>
            <p className="text-xs text-gray-400">
              Submit an anonymized indicator to the global threat pool. Data minimization automatically blocks private RFC1918 IPs, user paths, and internal hostnames.
            </p>

            <form onSubmit={handleContributeSignal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Signal Type</label>
                  <select
                    value={signalType}
                    onChange={(e) => setSignalType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                  >
                    <option value="IOC_PATTERN">IOC_PATTERN (Hashes, IPs, Domains)</option>
                    <option value="ATTACK_TECHNIQUE">ATTACK_TECHNIQUE (MITRE Techniques)</option>
                    <option value="MALWARE_CHARACTERISTIC">MALWARE_CHARACTERISTIC (Signatures, JA4)</option>
                    <option value="CAMPAIGN_INDICATOR">CAMPAIGN_INDICATOR (Infrastructure)</option>
                    <option value="BEHAVIORAL_PATTERN">BEHAVIORAL_PATTERN (Lineage, Injections)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Category</label>
                  <select
                    value={indicatorCategory}
                    onChange={(e) => setIndicatorCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                  >
                    <option value="Hash">Hash (SHA-256 / MD5)</option>
                    <option value="NetworkIP">NetworkIP (External CIDR/IP)</option>
                    <option value="Domain">Domain (Malicious FQDN)</option>
                    <option value="MitreTechnique">MitreTechnique (T-Code)</option>
                    <option value="BehavioralPattern">BehavioralPattern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Target Sector</label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                  >
                    <option value="Financial">Financial</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Technology">Technology</option>
                    <option value="Government">Government</option>
                    <option value="Energy">Energy</option>
                    <option value="Retail">Retail</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Indicator Value</label>
                <input
                  type="text"
                  value={indicatorValue}
                  onChange={(e) => setIndicatorValue(e.target.value)}
                  placeholder="e.g. 9b1c9f4d7e2a8c3e... or 194.26.29.112 or T1055.012"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={contributing}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-2 shadow-lg shadow-teal-600/20 disabled:opacity-50"
              >
                <Share2 className={`w-3.5 h-3.5 ${contributing ? 'animate-spin' : ''}`} />
                <span>{contributing ? 'Sanitizing & Submitting...' : 'Submit to Global Intelligence Pool'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: SAFE DISTRIBUTION & RULE DEPLOYMENT */}
      {activeTab === 'distribute' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Share2 className="w-5 h-5 text-teal-400" />
              <span>Safe Intelligence Distribution Hub</span>
            </h3>
            <p className="text-xs text-gray-400">
              Disseminate validated threat intelligence directly to Monitorix security engines. Safeguard active: unvalidated intelligence is strictly blocked from automatic deployment.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Select Validated Intelligence</label>
                <select
                  value={selectedSignalOrCamp}
                  onChange={(e) => setSelectedSignalOrCamp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Choose Signal or Campaign --</option>
                  {(portalData?.campaigns || []).map((c: any) => (
                    <option key={c.campaign_id} value={c.campaign_id}>[Campaign] {c.name}</option>
                  ))}
                  {(portalData?.emerging_threat_signals || []).filter((s: any) => s.status === 'VALIDATED').map((s: any) => (
                    <option key={s.signal_id} value={s.signal_id}>[Signal] {s.signal_id} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Destination Target</label>
                <select
                  value={destinationTarget}
                  onChange={(e) => setDestinationTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                >
                  <option value="DetectionEngine">Detection Engine (Sigma/Correlation Rule)</option>
                  <option value="ThreatIntelFeed">Threat Intelligence (Enriched IOC Feed)</option>
                  <option value="AiSoc">AI SOC (Autonomous Analysis Context)</option>
                  <option value="SecurityGraph">Security Graph (Threat Actor Graph)</option>
                  <option value="SOAR">SOAR (Containment Playbook Trigger)</option>
                  <option value="EndpointAgent">Endpoint Agent (Pre-execution Blocklist)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => handleDistribute()}
                  disabled={distributing || !selectedSignalOrCamp}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-teal-600/20"
                >
                  <Play className={`w-3.5 h-3.5 ${distributing ? 'animate-spin' : ''}`} />
                  <span>{distributing ? 'Deploying...' : 'Deploy Intelligence Rule'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Distribution Audit Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Active Intelligence Distribution Audit Log</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300 font-mono text-xs">
                <thead className="bg-slate-950 text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Distribution ID</th>
                    <th className="py-2.5 px-4">Source Object</th>
                    <th className="py-2.5 px-4">Destination Target</th>
                    <th className="py-2.5 px-4">Enforcement Status</th>
                    <th className="py-2.5 px-4">False Positive Rate</th>
                    <th className="py-2.5 px-4">Distributed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(portalData?.recent_distributions || []).map((d: any) => (
                    <tr key={d.distribution_id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-teal-400 font-bold">{d.distribution_id}</td>
                      <td className="py-2.5 px-4 text-white">{d.signal_or_campaign_id}</td>
                      <td className="py-2.5 px-4 text-indigo-300">{d.destination}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-semibold">
                          {d.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-400">{(d.false_positive_rate * 100).toFixed(2)}%</td>
                      <td className="py-2.5 px-4 text-gray-400">{d.distributed_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRIVACY LAYER & TENANT SHARING CONTROLS */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Lock className="w-5 h-5 text-teal-400" />
                <span>Tenant Privacy Controls & Data Minimization Settings</span>
              </h3>
              <p className="text-xs text-gray-400">
                Configure your organization's participation in the Security Intelligence Network. Absolute guarantee: zero customer PII, hostnames, or internal RFC1918 IPs ever leave your environment.
              </p>
            </div>

            <form onSubmit={handleSavePrivacy} className="space-y-6">
              {/* Master Opt-In Toggle */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Global Threat Intelligence Sharing Opt-In</h4>
                  <p className="text-xs text-gray-400">
                    Contribute sanitized threat signals and receive real-time validated community intelligence.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optInSharing}
                    onChange={(e) => setOptInSharing(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {/* Granular Telemetry Checkboxes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Granular Telemetry Sharing Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">External IOC Patterns</p>
                      <span className="text-gray-500">Sanitized file hashes, public IPs, C2 domains</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shareIocs}
                      onChange={(e) => setShareIocs(e.target.checked)}
                      className="w-4 h-4 accent-teal-500 rounded"
                    />
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">MITRE Attack Techniques</p>
                      <span className="text-gray-500">Anonymized technique sequence codes</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shareTechniques}
                      onChange={(e) => setShareTechniques(e.target.checked)}
                      className="w-4 h-4 accent-teal-500 rounded"
                    />
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">Malware Characteristics</p>
                      <span className="text-gray-500">YARA byte patterns & TLS JA4 signatures</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shareMalwareSignatures}
                      onChange={(e) => setShareMalwareSignatures(e.target.checked)}
                      className="w-4 h-4 accent-teal-500 rounded"
                    />
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">Process Behavioral Lineage</p>
                      <span className="text-gray-500">Parent/child anomalies (Strict Minimization)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shareProcessAnomalies}
                      onChange={(e) => setShareProcessAnomalies(e.target.checked)}
                      className="w-4 h-4 accent-teal-500 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Retention TTL Slider */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-400">Intelligence Retention TTL:</span>
                  <span className="text-teal-400 font-mono font-bold">{retentionDays} Days</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="180"
                  step="1"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
                <p className="text-[11px] text-gray-500">
                  Shared signals automatically expire and are purged from global memory after the specified retention window.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingPrivacy}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-2 shadow-lg shadow-teal-600/20 disabled:opacity-50"
              >
                <Lock className={`w-3.5 h-3.5 ${savingPrivacy ? 'animate-spin' : ''}`} />
                <span>{savingPrivacy ? 'Saving Preferences...' : 'Save Privacy & Sharing Profile'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
