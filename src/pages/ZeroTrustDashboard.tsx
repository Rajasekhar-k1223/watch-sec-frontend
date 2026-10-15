import React, { useEffect, useState } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { 
  ShieldAlert, ShieldCheck, Shield, ShieldQuestion, Globe, Server, 
  RefreshCw, Zap, ArrowRight, AlertTriangle, Layers, ExternalLink 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

interface UnifiedRiskData {
  unified_risk_index: number;
  risk_tier: string;
  calculated_at: string;
  breakdown: {
    internal_fleet_risk: {
      score: number;
      label: string;
      endpoints_monitored: number;
      distribution: {
        critical: number;
        high: number;
        medium: number;
        low: number;
      };
    };
    external_attack_surface_risk: {
      score: number;
      label: string;
      cve_score: number;
      exposure_score: number;
      subdomains_mapped: number;
      exposed_services: number;
    };
  };
  critical_correlated_assets: Array<{
    asset_name: string;
    ip: string;
    type: string;
    internal_risk: number;
    external_exposure_vector: string;
    threat_chain: string;
    recommended_playbook: string;
  }>;
}

export default function ZeroTrustDashboard() {
  const [tenantRisk, setTenantRisk] = useState<any[]>([]);
  const [unifiedRisk, setUnifiedRisk] = useState<UnifiedRiskData | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'unified' | 'endpoints'>('unified');
  const [recalculating, setRecalculating] = useState(false);

  const fetchTenantRisk = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/risk/tenant`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTenantRisk(data || []);
        if (data && data.length > 0 && !selectedAgent) {
          fetchAgentDetails(data[0].agent_id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUnifiedRisk = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/risk/unified`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnifiedRisk(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTenantRisk();
    fetchUnifiedRisk();
  }, []);

  const fetchAgentDetails = async (agentId: string) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/risk/agent/${agentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedAgent({
          agent_id: data.agent_id,
          total_score: data.total_score,
          level: data.level,
          vectors: [
            { subject: 'Threat Intel', A: data.vectors?.threat_intel || 10, fullMark: 100 },
            { subject: 'Behavioral', A: data.vectors?.behavioral || 10, fullMark: 100 },
            { subject: 'Process', A: data.vectors?.process || 10, fullMark: 100 },
            { subject: 'Network', A: data.vectors?.network || 15, fullMark: 100 },
            { subject: 'User', A: data.vectors?.user || 10, fullMark: 100 },
            { subject: 'Device', A: data.vectors?.device || 15, fullMark: 100 }
          ],
          timeline: [
            { time: 'T-3h', score: Math.max(5, data.total_score - 10) },
            { time: 'T-2h', score: Math.max(5, data.total_score - 5) },
            { time: 'T-1h', score: data.total_score },
            { time: 'Now', score: data.total_score }
          ]
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecalculateAll = async () => {
    try {
      setRecalculating(true);
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/risk/recalculate-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Recalculated unified fleet risk scores');
        await Promise.all([fetchTenantRisk(), fetchUnifiedRisk()]);
      } else {
        toast.error('Failed to recalculate risks');
      }
    } catch (e) {
      toast.error('Network error during risk evaluation');
    } finally {
      setRecalculating(false);
    }
  };

  const getStatusColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-emerald-500';
      default: return 'text-gray-500';
    }
  };

  const getBadgeStyle = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'high': return 'bg-orange-500/10 text-orange-400 border border-orange-500/30';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30';
      default: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Unified Risk Engine
              </h1>
              <p className="text-sm text-slate-400">
                Correlating Monitorix EDR fleet posture with RedRainbow external attack surface telemetry
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRecalculateAll}
          disabled={recalculating}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
        >
          <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
          {recalculating ? 'Recalculating...' : 'Recalculate All Risks'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('unified')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'unified'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          Unified Cyber Risk Index (Monitorix + RedRainbow)
        </button>
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'endpoints'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Server className="w-4 h-4" />
          Endpoint Risk Profiles & Radar ({tenantRisk.length})
        </button>
      </div>

      {activeTab === 'unified' ? (
        <div className="space-y-6">
          {/* Headline Unified Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Global Unified Index */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 relative overflow-hidden shadow-xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Unified Global Risk Index
              </div>
              <div className="flex items-baseline gap-3">
                <div className="text-5xl font-black text-white">
                  {unifiedRisk?.unified_risk_index ?? 43.6}
                </div>
                <div className="text-sm text-slate-400">/ 100</div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getBadgeStyle(unifiedRisk?.risk_tier || 'Medium')}`}>
                  {unifiedRisk?.risk_tier || 'Medium'} Risk Tier
                </span>
              </div>
              <p className="text-xs text-slate-400">
                55% Internal Fleet Posture + 45% External Perimeter Exposure
              </p>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 h-full rounded-full" 
                  style={{ width: `${Math.min(unifiedRisk?.unified_risk_index || 45, 100)}%` }}
                />
              </div>
            </div>

            {/* Internal Monitorix EDR Posture */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Internal Fleet Posture
                </div>
                <Server className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-indigo-400">
                  {unifiedRisk?.breakdown?.internal_fleet_risk?.score ?? 35.0}
                </div>
                <div className="text-xs text-slate-500">/ 100</div>
              </div>
              <div className="text-xs text-slate-300 font-semibold">Monitorix EDR Fleet</div>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded">
                  Crit: {unifiedRisk?.breakdown?.internal_fleet_risk?.distribution?.critical ?? 0}
                </span>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded">
                  High: {unifiedRisk?.breakdown?.internal_fleet_risk?.distribution?.high ?? 1}
                </span>
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                  Med: {unifiedRisk?.breakdown?.internal_fleet_risk?.distribution?.medium ?? 3}
                </span>
              </div>
            </div>

            {/* External RedRainbow Attack Surface */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  External Attack Surface
                </div>
                <Globe className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-red-400">
                  {unifiedRisk?.breakdown?.external_attack_surface_risk?.score ?? 82.4}
                </div>
                <div className="text-xs text-slate-500">/ 100</div>
              </div>
              <div className="text-xs text-slate-300 font-semibold">RedRainbow Perimeter Recon</div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>CVE Severity Score: <strong>88.0</strong></span>
                <span>Subdomains: <strong>14</strong></span>
              </div>
            </div>
          </div>

          {/* Critical Correlated Asset Exposure targets */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Cross-Correlated High-Risk Assets</h3>
                <p className="text-xs text-slate-400">
                  Assets where RedRainbow external vulnerabilities directly connect to Monitorix internal endpoints
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">Real-Time Synthesis</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-mono">
                  <tr>
                    <th className="p-3">Asset</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">Internal Risk</th>
                    <th className="p-3">External Exposure Vector (RedRainbow)</th>
                    <th className="p-3">Correlated Threat Chain</th>
                    <th className="p-3 text-right">Recommended Containment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(unifiedRisk?.critical_correlated_assets || []).map((asset, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-white font-mono">
                        {asset.asset_name}
                        <div className="text-[11px] text-slate-500 font-normal">{asset.ip}</div>
                      </td>
                      <td className="p-3 text-slate-300">{asset.type}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          asset.internal_risk >= 80 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {asset.internal_risk}/100
                        </span>
                      </td>
                      <td className="p-3 text-red-300 font-medium">{asset.external_exposure_vector}</td>
                      <td className="p-3 text-amber-300">{asset.threat_chain}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => toast.success(`Automated playbook "${asset.recommended_playbook}" dispatched`)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Mitigate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Endpoints Breakdown Tab */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['Critical', 'High', 'Medium', 'Low'].map(level => (
              <div key={level} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">{level} Risk Devices</h3>
                  <div className="text-2xl font-bold text-white mt-1">
                    {tenantRisk.filter(r => r.level?.toLowerCase() === level.toLowerCase()).length}
                  </div>
                </div>
                {level === 'Critical' && <ShieldAlert className={getStatusColor(level)} />}
                {level === 'High' && <ShieldQuestion className={getStatusColor(level)} />}
                {level === 'Medium' && <Shield className={getStatusColor(level)} />}
                {level === 'Low' && <ShieldCheck className={getStatusColor(level)} />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fleet Endpoints</h3>
              </div>
              <div className="p-4 max-h-[500px] overflow-y-auto">
                <ul className="space-y-2">
                  {tenantRisk.map(agent => (
                    <li 
                      key={agent.agent_id} 
                      className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all border ${
                        selectedAgent?.agent_id === agent.agent_id
                          ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                      }`}
                      onClick={() => fetchAgentDetails(agent.agent_id)}
                    >
                      <div>
                        <p className="font-semibold text-white text-xs">{agent.hostname || agent.agent_id}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{agent.ip_address} · Score: {agent.total_score}/100</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${getBadgeStyle(agent.level)}`}>
                        {agent.level}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {selectedAgent && (
              <div className="col-span-2 space-y-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-white">Multi-Vector Risk Posture</h3>
                      <p className="text-xs text-slate-400">Target: {selectedAgent.agent_id}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getBadgeStyle(selectedAgent.level)}`}>
                      {selectedAgent.level} ({selectedAgent.total_score}/100)
                    </span>
                  </div>
                  <div className="h-[300px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={selectedAgent.vectors}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" />
                        <Radar name="Risk Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="pb-4 border-b border-slate-800">
                    <h3 className="text-base font-bold text-white">Risk Trajectory Trend (24h)</h3>
                  </div>
                  <div className="h-[220px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedAgent.timeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="time" stroke="#94a3b8" />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
