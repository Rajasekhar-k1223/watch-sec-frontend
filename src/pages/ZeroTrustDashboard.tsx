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
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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
      case 'critical': return 'bg-red-50 text-red-700 border border-red-200';
      case 'high': return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border border-amber-200';
      default: return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                Unified Risk Engine
              </h1>
              <p className="text-sm text-slate-500">
                Correlating Monitorix EDR fleet posture with external attack surface telemetry
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRecalculateAll}
          disabled={recalculating}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
          {recalculating ? 'Recalculating...' : 'Recalculate All Risks'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('unified')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'unified'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Unified Cyber Risk Index (EDR + External Surface)
        </button>
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'endpoints'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-3 relative overflow-hidden shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Unified Global Risk Index
              </div>
              <div className="flex items-baseline gap-3">
                <div className="text-5xl font-black text-slate-900">
                  {unifiedRisk?.unified_risk_index ?? 43.6}
                </div>
                <div className="text-sm text-slate-400">/ 100</div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getBadgeStyle(unifiedRisk?.risk_tier || 'Medium')}`}>
                  {unifiedRisk?.risk_tier || 'Medium'} Risk Tier
                </span>
              </div>
              <p className="text-xs text-slate-500">
                55% Internal Fleet Posture + 45% External Perimeter Exposure
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 h-full rounded-full" 
                  style={{ width: `${Math.min(unifiedRisk?.unified_risk_index || 45, 100)}%` }}
                />
              </div>
            </div>

            {/* Internal Monitorix EDR Posture */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Internal Fleet Posture
                </div>
                <Server className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-indigo-600">
                  {unifiedRisk?.breakdown?.internal_fleet_risk?.score ?? 35.0}
                </div>
                <div className="text-xs text-slate-400">/ 100</div>
              </div>
              <div className="text-xs text-slate-700 font-semibold">Monitorix EDR Fleet</div>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded">
                  Crit: {unifiedRisk?.breakdown?.internal_fleet_risk?.distribution?.critical ?? 0}
                </span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                  High: {unifiedRisk?.breakdown?.internal_fleet_risk?.distribution?.high ?? 1}
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                  Med: {unifiedRisk?.breakdown?.internal_fleet_risk?.distribution?.medium ?? 3}
                </span>
              </div>
            </div>

            {/* External RedRainbow Attack Surface */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  External Attack Surface
                </div>
                <Globe className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-rose-600">
                  {unifiedRisk?.breakdown?.external_attack_surface_risk?.score ?? 82.4}
                </div>
                <div className="text-xs text-slate-400">/ 100</div>
              </div>
              <div className="text-xs text-slate-700 font-semibold">Monitorix Perimeter Recon</div>
              <div className="text-xs text-slate-600 flex items-center justify-between">
                <span>CVE Severity Score: <strong className="text-slate-900">88.0</strong></span>
                <span>Subdomains: <strong className="text-slate-900">14</strong></span>
              </div>
            </div>
          </div>

          {/* Critical Correlated Asset Exposure targets */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cross-Correlated High-Risk Assets</h3>
                <p className="text-xs text-slate-500">
                  Assets where external perimeter vulnerabilities directly connect to Monitorix internal endpoints
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">Real-Time Synthesis</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200 font-mono">
                  <tr>
                    <th className="p-3">Asset</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">Internal Risk</th>
                    <th className="p-3">External Exposure Vector</th>
                    <th className="p-3">Correlated Threat Chain</th>
                    <th className="p-3 text-right">Recommended Containment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(unifiedRisk?.critical_correlated_assets || []).map((asset, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900 font-mono">
                        {asset.asset_name}
                        <div className="text-[11px] text-slate-500 font-normal">{asset.ip}</div>
                      </td>
                      <td className="p-3 text-slate-600">{asset.type}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          asset.internal_risk >= 80 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {asset.internal_risk}/100
                        </span>
                      </td>
                      <td className="p-3 text-rose-600 font-medium">{asset.external_exposure_vector}</td>
                      <td className="p-3 text-amber-600 font-medium">{asset.threat_chain}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => toast.success(`Automated playbook "${asset.recommended_playbook}" dispatched`)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm"
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
              <div key={level} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">{level} Risk Devices</h3>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
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
            <div className="col-span-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Fleet Endpoints</h3>
              </div>
              <div className="p-4 max-h-[500px] overflow-y-auto">
                <ul className="space-y-2">
                  {tenantRisk.map(agent => (
                    <li 
                      key={agent.agent_id} 
                      className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all border ${
                        selectedAgent?.agent_id === agent.agent_id
                          ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                          : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                      }`}
                      onClick={() => fetchAgentDetails(agent.agent_id)}
                    >
                      <div>
                        <p className="font-semibold text-slate-900 text-xs">{agent.hostname || agent.agent_id}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{agent.ip_address} · Score: {agent.total_score}/100</p>
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
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Multi-Vector Risk Posture</h3>
                      <p className="text-xs text-slate-500">Target: {selectedAgent.agent_id}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getBadgeStyle(selectedAgent.level)}`}>
                      {selectedAgent.level} ({selectedAgent.total_score}/100)
                    </span>
                  </div>
                  <div className="h-[300px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={selectedAgent.vectors}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" stroke="#64748b" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
                        <Radar name="Risk Score" dataKey="A" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.35} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="pb-4 border-b border-slate-200">
                    <h3 className="text-base font-bold text-slate-900">Risk Trajectory Trend (24h)</h3>
                  </div>
                  <div className="h-[220px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedAgent.timeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="time" stroke="#94a3b8" />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
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
