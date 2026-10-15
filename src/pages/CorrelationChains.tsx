import React, { useState, useEffect } from 'react';
import { 
  Network, ShieldAlert, GitCommit, AlertTriangle, ArrowRight, Play, CheckCircle2,
  RefreshCw, Server, Zap, ExternalLink, Terminal, Eye, Lock, Crosshair, ChevronDown, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

interface Stage {
  stage_num: number;
  tactic: string;
  technique: string;
  source: string;
  title: string;
  timestamp: string;
  details: string;
  status: string;
}

interface IOC {
  type: string;
  value: string;
  role: string;
}

interface AttackChain {
  id: string;
  title: string;
  agent_id: string;
  hostname: string;
  ip_address: string;
  severity: string;
  confidence_score: number;
  status: string;
  kill_chain_progress: string;
  started_at: string;
  last_activity: string;
  recommended_playbook_id: number;
  stages: Stage[];
  iocs: IOC[];
}

interface FleetThreat {
  type: string;
  severity: string;
  nodes: string[];
  description: string;
  mitre_tactic?: string;
  status?: string;
  detected_at?: string;
}

export default function CorrelationChains() {
  const [chains, setChains] = useState<AttackChain[]>([]);
  const [threats, setThreats] = useState<FleetThreat[]>([]);
  const [tacticalNarrative, setTacticalNarrative] = useState('');
  const [selectedChain, setSelectedChain] = useState<AttackChain | null>(null);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [loading, setLoading] = useState(true);
  const [correlating, setCorrelating] = useState(false);
  const [executingSoar, setExecutingSoar] = useState(false);
  const [activeTab, setActiveTab] = useState<'chains' | 'fleet_threats'>('chains');

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resChains, resThreats] = await Promise.all([
        fetch(`${API_URL}/v2/correlation/attack-chains`, { headers }),
        fetch(`${API_URL}/v2/correlation/fleet-threats`, { headers })
      ]);

      if (resChains.ok) {
        const data = await resChains.json();
        setChains(data.chains || []);
        if (data.chains?.length > 0 && !selectedChain) {
          setSelectedChain(data.chains[0]);
          if (data.chains[0].stages?.length > 0) {
            setSelectedStage(data.chains[0].stages[0]);
          }
        }
      }

      if (resThreats.ok) {
        const data = await resThreats.json();
        setThreats(data.threats || []);
        setTacticalNarrative(data.tactical_narrative || '');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load correlation intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerCorrelateNow = async () => {
    try {
      setCorrelating(true);
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/correlation/correlate-now`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Real-time fleet correlation analysis completed');
        await fetchData();
      } else {
        toast.error('Correlation analysis failed');
      }
    } catch (e) {
      toast.error('Network error triggering correlation');
    } finally {
      setCorrelating(false);
    }
  };

  const handleExecutePlaybook = async (chain: AttackChain) => {
    try {
      setExecutingSoar(true);
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/soar/playbooks/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          playbook_id: chain.recommended_playbook_id || 1,
          target_agent_id: chain.agent_id,
          action_params: {
            IncidentRef: chain.id,
            Severity: chain.severity
          }
        })
      });

      if (res.ok) {
        toast.success(`SOAR Playbook #${chain.recommended_playbook_id} triggered on ${chain.hostname}`);
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to trigger SOAR playbook');
      }
    } catch (e) {
      toast.error('Error executing automated containment');
    } finally {
      setExecutingSoar(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'medium':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400 shadow-inner">
              <Network className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Correlation Engine & Attack Chain Detection
              </h1>
              <p className="text-sm text-slate-400">
                Multi-node pattern recognition & MITRE ATT&CK cyber kill-chain synthesis across Monitorix EDR fleet
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerCorrelateNow}
            disabled={correlating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw className={`w-4 h-4 ${correlating ? 'animate-spin' : ''}`} />
            {correlating ? 'Correlating Fleet...' : 'Correlate Telemetry Now'}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Attack Chains</div>
            <div className="text-2xl font-bold text-white mt-1">{chains.length}</div>
            <div className="text-xs text-red-400 flex items-center gap-1 mt-0.5">
              <AlertTriangle className="w-3 h-3" /> Multi-Stage Intrusions
            </div>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            <GitCommit className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fleet Threats Correlated</div>
            <div className="text-2xl font-bold text-white mt-1">{threats.length}</div>
            <div className="text-xs text-amber-400 flex items-center gap-1 mt-0.5">
              <ShieldAlert className="w-3 h-3" /> Cross-Node Patterns
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Network className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Max Kill-Chain Progress</div>
            <div className="text-2xl font-bold text-red-400 mt-1">80% (Lateral Pivot)</div>
            <div className="text-xs text-slate-400 mt-0.5">Stage 5 of 6 Reached</div>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Crosshair className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Automated SOAR Coverage</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">100%</div>
            <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Containment Playbooks Ready
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Narrative Alert */}
      {tacticalNarrative && (
        <div className="bg-indigo-950/30 border border-indigo-800/40 p-4 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-indigo-200">
            <span className="font-semibold text-white">Tactical Security Assessment: </span>
            {tacticalNarrative}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('chains')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'chains'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          Multi-Stage Attack Chains ({chains.length})
        </button>
        <button
          onClick={() => setActiveTab('fleet_threats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'fleet_threats'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Network className="w-4 h-4" />
          Cross-Node Fleet Pattern Correlations ({threats.length})
        </button>
      </div>

      {activeTab === 'chains' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chains Selector */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-sm font-semibold text-slate-300">Correlated Attack Campaigns</div>
            {chains.map((chain) => {
              const isSelected = selectedChain?.id === chain.id;
              return (
                <div
                  key={chain.id}
                  onClick={() => {
                    setSelectedChain(chain);
                    if (chain.stages?.length > 0) setSelectedStage(chain.stages[0]);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-indigo-400">{chain.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getSeverityBadge(chain.severity)}`}>
                      {chain.severity} ({chain.confidence_score}% Conf)
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{chain.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Server className="w-3.5 h-3.5 text-slate-500" />
                      {chain.hostname}
                    </span>
                    <span>Progress: <strong className="text-red-400">{chain.kill_chain_progress}</strong></span>
                    <span>{chain.stages.length} Stages</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kill-Chain Timeline & Stage Detail */}
          <div className="lg:col-span-7 space-y-6">
            {selectedChain ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                {/* Chain Title & Containment Trigger */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400">{selectedChain.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getSeverityBadge(selectedChain.severity)}`}>
                        {selectedChain.severity}
                      </span>
                      <span className="text-xs text-slate-400">Target: {selectedChain.hostname} ({selectedChain.ip_address})</span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1">{selectedChain.title}</h2>
                  </div>

                  <button
                    onClick={() => handleExecutePlaybook(selectedChain)}
                    disabled={executingSoar}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/30"
                  >
                    <Zap className="w-4 h-4" />
                    {executingSoar ? 'Executing Playbook...' : 'Execute SOAR Containment'}
                  </button>
                </div>

                {/* Kill-Chain Stage Tracker */}
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    MITRE ATT&CK Kill-Chain Progression
                  </div>
                  <div className="relative pl-6 border-l-2 border-indigo-500/30 space-y-6">
                    {selectedChain.stages.map((stage) => {
                      const isStageSelected = selectedStage?.stage_num === stage.stage_num;
                      return (
                        <div
                          key={stage.stage_num}
                          onClick={() => setSelectedStage(stage)}
                          className={`relative p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isStageSelected
                              ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md'
                              : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                          }`}
                        >
                          {/* Dot indicator */}
                          <div className={`absolute -left-[31px] top-4 w-4 h-4 rounded-full border-2 border-slate-900 ${
                            stage.status === 'Completed' ? 'bg-emerald-400' : (stage.status === 'Active' ? 'bg-red-400 animate-ping' : 'bg-amber-400')
                          }`} />

                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-indigo-300">
                              Stage {stage.stage_num}: {stage.tactic}
                            </span>
                            <span className="text-slate-400 font-mono">
                              {new Date(stage.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-white">{stage.title}</div>
                          <div className="text-xs text-slate-400 font-mono mt-1">{stage.technique} · Source: {stage.source}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stage Inspector Drawer */}
                {selectedStage && (
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-white uppercase tracking-wider">Telemetry Evidence (Stage {selectedStage.stage_num})</span>
                      <span className="font-mono text-emerald-400">{selectedStage.status}</span>
                    </div>
                    <div className="text-xs text-slate-300 bg-slate-900 p-3 rounded-lg font-mono border border-slate-800">
                      {selectedStage.details}
                    </div>
                  </div>
                )}

                {/* Correlated IOCs */}
                {selectedChain.iocs?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Correlated Indicators of Compromise (IOCs)
                    </div>
                    <div className="space-y-2">
                      {selectedChain.iocs.map((ioc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs font-mono">
                          <span className="text-slate-400">[{ioc.type}]</span>
                          <span className="text-indigo-300 font-bold">{ioc.value}</span>
                          <span className="text-amber-400">{ioc.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-12 text-slate-500">Select an attack chain to inspect telemetry</div>
            )}
          </div>
        </div>
      ) : (
        /* Fleet Threats View */
        <div className="space-y-4">
          <div className="text-sm font-semibold text-slate-300">
            Fleet Pattern Anomalies (Lateral Movement, Coordinated Brute Force, Exfiltration Clusters)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {threats.map((threat, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getSeverityBadge(threat.severity)}`}>
                    {threat.severity}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {threat.detected_at ? new Date(threat.detected_at).toLocaleTimeString() : 'Recent'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{threat.type}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{threat.description}</p>
                </div>

                {threat.mitre_tactic && (
                  <div className="text-xs font-mono text-indigo-400 bg-indigo-950/30 p-2 rounded-lg border border-indigo-800/30">
                    MITRE: {threat.mitre_tactic}
                  </div>
                )}

                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Impacted Endpoints ({threat.nodes.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {threat.nodes.map((node, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs font-mono border border-slate-700">
                        {node}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
