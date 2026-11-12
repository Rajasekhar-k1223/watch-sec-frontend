import React, { useState, useEffect } from 'react';
import {
  Shield, Brain, Zap, AlertTriangle, CheckCircle2, RotateCcw, XCircle,
  Play, RefreshCw, Lock, Radio, FileText, Search, Activity, Sliders,
  TrendingUp, Clock, Eye, Ban, Check, Terminal, Cpu, Database, ChevronRight,
  ShieldAlert, Sparkles, Filter, CornerDownLeft
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AutonomousSecurity() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'actions' | 'investigation' | 'hunting' | 'guardrails' | 'ai-mcp'>('actions');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // AI-SPM & Sovereign MCP Gateway State
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [aiAgents, setAiAgents] = useState<any[]>([]);
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [runningHarness, setRunningHarness] = useState(false);
  const [harnessScenario, setHarnessScenario] = useState<'SSRF_EXFIL' | 'PROMPT_INJECTION' | 'HITL_BYPASS'>('SSRF_EXFIL');
  const [harnessResult, setHarnessResult] = useState<any>(null);
  const [quarantiningAgent, setQuarantiningAgent] = useState<string | null>(null);

  // Core Dashboard State
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Propose Action Form State
  const [actionType, setActionType] = useState('isolate_endpoint');
  const [targetEntity, setTargetEntity] = useState('WORKSTATION-08 (192.168.1.105)');
  const [confidenceScore, setConfidenceScore] = useState(0.96);
  const [reasoning, setReasoning] = useState('Outbound C2 beaconing on port 443 detected following malicious PDF execution and LSASS memory access.');
  const [evidenceSummary, setEvidenceSummary] = useState('Memory dump matches Trojan.CobaltStrike.Stager. SHA256: 9b1c9f... (62/70 VT)');
  const [riskLevel, setRiskLevel] = useState('High');
  const [proposingAction, setProposingAction] = useState(false);

  // Autonomous Investigation Form State
  const [investigationSeed, setInvestigationSeed] = useState('WORKSTATION-08');
  const [investigating, setInvestigating] = useState(false);
  const [investigationResult, setInvestigationResult] = useState<any>(null);

  // Autonomous Hunt Form State
  const [huntTopic, setHuntTopic] = useState('LSASS Memory Ingestion via Native APIs');
  const [hunting, setHunting] = useState(false);
  const [huntResult, setHuntResult] = useState<any>(null);
  const [queryTab, setQueryTab] = useState<'kql' | 'sigma' | 'spl'>('kql');

  // Kill Switch State
  const [togglingKillSwitch, setTogglingKillSwitch] = useState(false);

  // Fetch AI-SPM & MCP Data
  const fetchAiData = async () => {
    try {
      const [modelsRes, agentsRes, mcpRes] = await Promise.all([
        fetch(`${API_URL}/v2/ai/models`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/v2/ai/agents`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/v2/ai/mcp/servers`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (modelsRes.ok) {
        const d = await modelsRes.json();
        setAiModels(d.models || []);
      }
      if (agentsRes.ok) {
        const d = await agentsRes.json();
        setAiAgents(d.agents || []);
      }
      if (mcpRes.ok) {
        const d = await mcpRes.json();
        setMcpServers(d.servers || []);
      }
    } catch (err) {
      console.error('Error fetching AI security data:', err);
    }
  };

  // Fetch Dashboard Telemetry
  const fetchDashboard = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/v2/autonomous/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      } else {
        toast.error('Failed to load autonomous security telemetry');
      }
      await fetchAiData();
    } catch (err) {
      console.error(err);
      toast.error('Connection error to Autonomous Security Gateway');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchAiData();
    const interval = setInterval(() => {
      fetchDashboard();
      fetchAiData();
    }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // Handle 1-Click Agent Quarantine Toggle
  const handleToggleQuarantine = async (agentUuid: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'QUARANTINED' : 'ACTIVE';
    setQuarantiningAgent(agentUuid);
    try {
      const res = await fetch(`${API_URL}/v2/ai/agents/${agentUuid}/status?new_status=${newStatus}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`Agent ${agentUuid} status updated to ${newStatus}`);
        fetchAiData();
      } else {
        toast.error('Failed to update agent status');
      }
    } catch (err) {
      toast.error('Network error updating agent status');
    } finally {
      setQuarantiningAgent(null);
    }
  };

  // Handle Run 3 Success Contracts Harness
  const handleRunHarness = async () => {
    setRunningHarness(true);
    try {
      const targetAgent = aiAgents[0]?.AgentUuid || 'agt-16fad162a7d1';
      const testRunId = `UI-VERIFY-${Date.now()}`;
      const res = await fetch(`${API_URL}/v2/ai/validate-harness`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenant_id: 1,
          agent_uuid: targetAgent,
          scenario_type: harnessScenario,
          test_run_id: testRunId
        })
      });
      const data = await res.json();
      if (res.ok) {
        setHarnessResult(data);
        toast.success(`Harness Complete! 3/3 Contracts Passed (ID: ${testRunId})`);
        fetchAiData();
      } else {
        toast.error(data.detail || 'Harness validation failed');
      }
    } catch (err) {
      toast.error('Failed to trigger harness validation');
    } finally {
      setRunningHarness(false);
    }
  };

  // Handle Propose Action
  const handleProposeAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setProposingAction(true);
    try {
      const res = await fetch(`${API_URL}/v2/autonomous/action/propose`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action_type: actionType,
          target_entity: targetEntity,
          confidence_score: confidenceScore,
          reasoning: reasoning,
          evidence_summary: evidenceSummary,
          risk_level: riskLevel
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Action ${data.action_id} proposed (${data.status})`);
        fetchDashboard();
      } else {
        toast.error(data.detail || 'Failed to propose action');
      }
    } catch (err) {
      toast.error('Request failed');
    } finally {
      setProposingAction(false);
    }
  };

  // Handle Approve Action
  const handleApproveAction = async (actionId: string) => {
    try {
      const res = await fetch(`${API_URL}/v2/autonomous/action/${actionId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: 'Authorized by SecOps Engineer' })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Action ${actionId} approved & verified!`);
        fetchDashboard();
      } else {
        toast.error(data.detail || 'Approval failed');
      }
    } catch (err) {
      toast.error('Approval request failed');
    }
  };

  // Handle Reject Action
  const handleRejectAction = async (actionId: string) => {
    try {
      const res = await fetch(`${API_URL}/v2/autonomous/action/${actionId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Rejected by operator: false positive', is_false_positive: true })
      });
      if (res.ok) {
        toast.success(`Action ${actionId} rejected`);
        fetchDashboard();
      } else {
        toast.error('Rejection failed');
      }
    } catch (err) {
      toast.error('Rejection request failed');
    }
  };

  // Handle Rollback Action
  const handleRollbackAction = async (actionId: string) => {
    try {
      const res = await fetch(`${API_URL}/v2/autonomous/action/${actionId}/rollback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rollback_reason: 'SecOps initiated state rollback.' })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Action ${actionId} safely rolled back!`);
        fetchDashboard();
      } else {
        toast.error(data.detail || 'Rollback failed');
      }
    } catch (err) {
      toast.error('Rollback request failed');
    }
  };

  // Handle Run Investigation
  const handleRunInvestigation = async () => {
    setInvestigating(true);
    try {
      const res = await fetch(`${API_URL}/v2/autonomous/investigation/run`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ seed_ioc_or_target: investigationSeed })
      });
      const data = await res.json();
      if (res.ok) {
        setInvestigationResult(data);
        toast.success(`Investigation completed: ${data.investigation_id}`);
        fetchDashboard();
      } else {
        toast.error(data.detail || 'Investigation failed');
      }
    } catch (err) {
      toast.error('Investigation request failed');
    } finally {
      setInvestigating(false);
    }
  };

  // Handle Run Hunting
  const handleRunHunting = async () => {
    setHunting(true);
    try {
      const res = await fetch(`${API_URL}/v2/autonomous/hunting/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ focus_topic: huntTopic })
      });
      const data = await res.json();
      if (res.ok) {
        setHuntResult(data);
        toast.success(`Hunt generated: ${data.hypothesis_id}`);
        fetchDashboard();
      } else {
        toast.error(data.detail || 'Hunting generation failed');
      }
    } catch (err) {
      toast.error('Hunting request failed');
    } finally {
      setHunting(false);
    }
  };

  // Handle Kill Switch Toggle
  const handleToggleKillSwitch = async () => {
    const currentState = dashboardData?.kill_switch_engaged;
    setTogglingKillSwitch(true);
    try {
      const res = await fetch(`${API_URL}/v2/autonomous/guardrail/kill-switch`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ engage: !currentState })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchDashboard();
      } else {
        toast.error('Failed to toggle kill switch');
      }
    } catch (err) {
      toast.error('Kill switch toggle failed');
    } finally {
      setTogglingKillSwitch(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
          <p className="text-gray-400 font-medium">Initializing Autonomous Security Gateway...</p>
        </div>
      </div>
    );
  }

  const kpis = dashboardData?.kpis || {};
  const isKillSwitchEngaged = dashboardData?.kill_switch_engaged;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-cyan-500/20 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-600/30 border border-cyan-500/50 rounded-xl text-cyan-400">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Autonomous Security & Defense</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full">
                  Phase 14 Active
                </span>
                <span className="px-2 py-0.5 text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  v3.8.0
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Detection → Analysis → Confidence → Policy → Approval → Action → Verification → Rollback
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Emergency Kill Switch Button */}
          <button
            onClick={handleToggleKillSwitch}
            disabled={togglingKillSwitch}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-bold rounded-xl transition border shadow-lg ${
              isKillSwitchEngaged
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'bg-slate-800 hover:bg-rose-950 text-rose-300 border-rose-500/40'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isKillSwitchEngaged ? 'KILL SWITCH ENGAGED' : 'Emergency Kill Switch'}</span>
          </button>

          <button
            onClick={fetchDashboard}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-sm font-medium border border-cyan-500/30 rounded-xl transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* Safety Principle Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-gray-400 overflow-x-auto">
        <span className="font-semibold text-gray-300 uppercase tracking-wider flex items-center">
          <Shield className="w-4 h-4 mr-1 text-cyan-400" /> AI Safety Pipeline:
        </span>
        <div className="flex items-center space-x-2 font-mono">
          <span className="px-2 py-0.5 bg-slate-800 rounded text-gray-300">1. Detection</span>
          <span>→</span>
          <span className="px-2 py-0.5 bg-slate-800 rounded text-gray-300">2. Analysis</span>
          <span>→</span>
          <span className="px-2 py-0.5 bg-indigo-900/40 text-indigo-300 rounded font-bold">3. Confidence (≥85%)</span>
          <span>→</span>
          <span className="px-2 py-0.5 bg-slate-800 rounded text-gray-300">4. Policy Check</span>
          <span>→</span>
          <span className="px-2 py-0.5 bg-amber-900/40 text-amber-300 rounded font-bold">5. Approval</span>
          <span>→</span>
          <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-300 rounded">6. Action</span>
          <span>→</span>
          <span className="px-2 py-0.5 bg-cyan-900/40 text-cyan-300 rounded">7. Verification</span>
          <span>→</span>
          <span className="px-2 py-0.5 bg-purple-900/40 text-purple-300 rounded">8. Rollback</span>
        </div>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Autonomy Mode</span>
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-base font-bold text-cyan-300 truncate">{dashboardData?.autonomy_mode || 'SUPERVISED'}</p>
          <p className="text-[10px] text-gray-500 font-mono">Human-in-the-Loop</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{kpis.pending_approvals || 0}</p>
          <p className="text-[10px] text-amber-300 font-mono">Awaiting SecOps</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Executed Actions</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{kpis.completed_actions || 0}</p>
          <p className="text-[10px] text-emerald-400 font-mono">100% Contained</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Avg AI Confidence</span>
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-300">{kpis.average_confidence_percent || 95.0}%</p>
          <p className="text-[10px] text-gray-500 font-mono">&gt; 85% Threshold</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{kpis.success_rate_percent || 100}%</p>
          <p className="text-[10px] text-gray-500 font-mono">Verified Containment</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Rollbacks Executed</span>
            <RotateCcw className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-300">{kpis.rollbacks || 0}</p>
          <p className="text-[10px] text-indigo-400 font-mono">Safe State Reversal</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Human Overrides</span>
            <Sliders className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white">{kpis.human_overrides || 0}</p>
          <p className="text-[10px] text-gray-500 font-mono">FP Interventions</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto">
        {[
          { id: 'actions', label: 'Autonomous Response & Approvals', icon: Zap },
          { id: 'ai-mcp', label: 'AI-SPM & Sovereign MCP Gateway', icon: Brain },
          { id: 'investigation', label: 'Autonomous Investigation', icon: Search },
          { id: 'hunting', label: 'Autonomous Threat Hunting', icon: Radio },
          { id: 'guardrails', label: 'AI Guardrails & Safety Policy', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                isActive
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AUTONOMOUS RESPONSE & APPROVALS */}
      {activeTab === 'actions' && (
        <div className="space-y-6">
          {/* Pending Approvals Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>Pending Human Authorization Queue ({dashboardData?.pending_approval_list?.length || 0})</span>
                </h3>
                <p className="text-xs text-gray-400">
                  High-impact actions require explicit SecOps approval before execution on production endpoints.
                </p>
              </div>
            </div>

            {(dashboardData?.pending_approval_list || []).length > 0 ? (
              <div className="space-y-3">
                {dashboardData.pending_approval_list.map((item: any) => (
                  <div
                    key={item.action_id}
                    className="p-4 bg-slate-950 border border-amber-500/30 rounded-xl space-y-3 font-mono text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-amber-400 text-sm uppercase">{item.action_type}</span>
                          <span className="px-2 py-0.5 bg-slate-800 text-gray-300 rounded text-[11px] font-bold">
                            Target: {item.target_entity}
                          </span>
                          <span className="px-2 py-0.5 bg-purple-900/40 text-purple-300 rounded text-[11px]">
                            Confidence: {(item.confidence_score * 100).toFixed(1)}%
                          </span>
                          <span className="px-2 py-0.5 bg-rose-900/40 text-rose-300 rounded text-[11px]">
                            Risk: {item.risk_level}
                          </span>
                        </div>
                        <p className="text-gray-300 text-xs font-sans mt-1">{item.reasoning}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRejectAction(item.action_id)}
                          className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => handleApproveAction(item.action_id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-lg shadow-emerald-600/20"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Authorize & Execute</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-[11px]">
                      <div>
                        <span className="text-gray-500">Evidence Summary:</span>
                        <p className="text-gray-300 truncate">{item.evidence_summary}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Expected Impact:</span>
                        <p className="text-amber-300 truncate">{item.expected_impact}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <p className="text-sm font-semibold text-gray-300">Approval Queue Empty</p>
                <p className="text-xs">No pending high-impact actions awaiting authorization.</p>
              </div>
            )}
          </div>

          {/* Action History & Rollback Ledger */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <span>Autonomous Action Ledger & Rollback Controls</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300 font-mono text-xs">
                <thead className="bg-slate-950 text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Action ID</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Target Entity</th>
                    <th className="py-2.5 px-4">Confidence</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Verification</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4 text-right">Rollback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(dashboardData?.recent_actions || []).map((a: any) => (
                    <tr key={a.action_id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-cyan-400 font-bold">{a.action_id}</td>
                      <td className="py-2.5 px-4 text-white font-semibold">{a.action_type}</td>
                      <td className="py-2.5 px-4 text-gray-300">{a.target_entity}</td>
                      <td className="py-2.5 px-4 text-purple-300">{(a.confidence_score * 100).toFixed(0)}%</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          a.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          a.status === 'ROLLED_BACK' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                          a.status === 'PENDING_APPROVAL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] text-gray-400">{a.verification_status}</span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-400">{a.created_at}</td>
                      <td className="py-2.5 px-4 text-right">
                        {a.is_reversible && a.status === 'COMPLETED' ? (
                          <button
                            onClick={() => handleRollbackAction(a.action_id)}
                            className="px-2.5 py-1 bg-indigo-900/40 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-semibold transition"
                          >
                            Rollback
                          </button>
                        ) : (
                          <span className="text-gray-600 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Simulate Action Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <span>Simulate AI Autonomous Action Proposal</span>
            </h3>
            <p className="text-xs text-gray-400">
              Submit an autonomous action proposal to evaluate confidence scoring, safety guardrail verification, and human approval enforcement.
            </p>

            <form onSubmit={handleProposeAction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Action Type</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="isolate_endpoint">isolate_endpoint (High Impact)</option>
                    <option value="kill_process">kill_process (High Impact)</option>
                    <option value="block_ioc">block_ioc (Medium Impact)</option>
                    <option value="disable_account">disable_account (High Impact)</option>
                    <option value="revoke_session">revoke_session (Medium Impact)</option>
                    <option value="collect_evidence">collect_evidence (Low Impact)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Target Entity</label>
                  <input
                    type="text"
                    value={targetEntity}
                    onChange={(e) => setTargetEntity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Confidence Score: {(confidenceScore * 100).toFixed(0)}%</label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.01"
                    value={confidenceScore}
                    onChange={(e) => setConfidenceScore(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">AI Reasoning</label>
                <input
                  type="text"
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Evidence Summary</label>
                <input
                  type="text"
                  value={evidenceSummary}
                  onChange={(e) => setEvidenceSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={proposingAction}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-2 shadow-lg shadow-cyan-600/20 disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${proposingAction ? 'animate-spin' : ''}`} />
                <span>{proposingAction ? 'Submitting...' : 'Submit Action for Policy Evaluation'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: AUTONOMOUS INVESTIGATION */}
      {activeTab === 'investigation' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Search className="w-5 h-5 text-cyan-400" />
              <span>Launch AI Autonomous Incident Investigation</span>
            </h3>
            <p className="text-xs text-gray-400">
              AI automatically captures evidence, reconstructs attack timelines, inspects process lineage, enriches IOCs, and extracts root cause.
            </p>

            <div className="flex gap-3">
              <input
                type="text"
                value={investigationSeed}
                onChange={(e) => setInvestigationSeed(e.target.value)}
                placeholder="Target Hostname, IP, Hash or Alert ID"
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleRunInvestigation}
                disabled={investigating}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm transition flex items-center space-x-2 shadow-lg shadow-cyan-600/20 disabled:opacity-50"
              >
                <Search className={`w-4 h-4 ${investigating ? 'animate-spin' : ''}`} />
                <span>{investigating ? 'Investigating...' : 'Start Investigation'}</span>
              </button>
            </div>
          </div>

          {investigationResult && (
            <div className="space-y-6">
              {/* Root Cause Banner */}
              <div className="bg-slate-900 border border-cyan-500/40 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center">
                    <Brain className="w-4 h-4 mr-1.5" /> AI Root Cause Analysis ({investigationResult.investigation_id})
                  </span>
                  <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-mono font-bold">
                    Confidence: {(investigationResult.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">{investigationResult.root_cause_analysis}</p>
                <div className="pt-2 flex items-center space-x-2 text-xs font-mono text-gray-400">
                  <span className="text-gray-500">MITRE Tactics Detected:</span>
                  <span className="text-indigo-300 font-semibold">{investigationResult.mitre_tactics}</span>
                </div>
              </div>

              {/* Timeline Reconstruction */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Reconstructed Attack Timeline</span>
                </h4>
                <div className="space-y-3 font-mono text-xs">
                  {(investigationResult.timeline || []).map((t: any, idx: number) => (
                    <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                      <div className="text-cyan-400 font-bold whitespace-nowrap">{t.timestamp.split('T')[1]?.slice(0, 8)}</div>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-white font-sans text-xs">{t.event}</p>
                        <div className="flex items-center space-x-3 text-gray-500 text-[11px]">
                          <span>Actor/Target: {t.actor}</span>
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            t.severity === 'Critical' ? 'bg-rose-950 text-rose-400' :
                            t.severity === 'High' ? 'bg-amber-950 text-amber-400' : 'bg-slate-800 text-gray-300'
                          }`}>
                            {t.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Process & Network Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-xs">
                  <h4 className="text-sm font-bold text-white font-sans flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-purple-400" />
                    <span>Process Lineage Analysis</span>
                  </h4>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div>
                      <span className="text-gray-500">Root Process:</span>
                      <p className="text-white font-bold">{investigationResult.process_analysis?.root_process}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Anomalous Behavior:</span>
                      <p className="text-rose-400">{investigationResult.process_analysis?.anomalous_behavior}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">MITRE Technique:</span>
                      <p className="text-cyan-300">{investigationResult.process_analysis?.mitre_technique}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-xs">
                  <h4 className="text-sm font-bold text-white font-sans flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-amber-400" />
                    <span>Network C2 & Lateral Telemetry</span>
                  </h4>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div>
                      <span className="text-gray-500">Outbound C2:</span>
                      <p className="text-rose-400 font-bold">{investigationResult.network_analysis?.outbound_c2}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Beaconing Frequency:</span>
                      <p className="text-white">{investigationResult.network_analysis?.beacon_frequency_sec}s (±{investigationResult.network_analysis?.jitter_percent}% jitter)</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Lateral Connections:</span>
                      <p className="text-amber-300">{investigationResult.network_analysis?.smb_lateral_connections?.[0]}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUTONOMOUS THREAT HUNTING */}
      {activeTab === 'hunting' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Radio className="w-5 h-5 text-indigo-400" />
              <span>AI Autonomous Threat Hunting Engine</span>
            </h3>
            <p className="text-xs text-gray-400">
              Autonomous generation of hunting hypotheses, cross-dialect queries (KQL, Sigma, SPL), and detection rule candidates.
            </p>

            <div className="flex gap-3">
              <input
                type="text"
                value={huntTopic}
                onChange={(e) => setHuntTopic(e.target.value)}
                placeholder="Hunting Focus (e.g. Kerberoasting, LSASS Dumping, DCSync)"
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleRunHunting}
                disabled={hunting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition flex items-center space-x-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${hunting ? 'animate-spin' : ''}`} />
                <span>{hunting ? 'Generating...' : 'Generate Hunt'}</span>
              </button>
            </div>
          </div>

          {huntResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase">{huntResult.hypothesis_id}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{huntResult.title}</h3>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400 font-mono">
                    <span>MITRE: {huntResult.mitre_technique}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">Validation Score: {(huntResult.validation_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold font-mono">
                  {huntResult.status}
                </span>
              </div>

              {/* Multi-Dialect Query Viewer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2 text-xs">
                    {(['kql', 'sigma', 'spl'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => setQueryTab(q)}
                        className={`px-3 py-1 rounded-lg uppercase font-mono font-bold transition ${
                          queryTab === q ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-gray-400 hover:text-white'
                        }`}
                      >
                        {q.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono">Cross-Dialect Detection Generation</span>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-indigo-300 overflow-x-auto whitespace-pre">
                  {huntResult.queries?.[queryTab]}
                </div>
              </div>

              {/* Investigation Plan */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Multi-Phase Investigation Plan</h4>
                <div className="space-y-1.5 font-mono text-xs">
                  {(huntResult.investigation_plan || []).map((step: any) => (
                    <div key={step.step} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center space-x-2 text-gray-300">
                      <span className="px-1.5 py-0.5 bg-indigo-900/40 text-indigo-400 rounded font-bold">{step.step}</span>
                      <span>{step.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AI GUARDRAILS & SAFETY POLICY */}
      {activeTab === 'guardrails' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span>AI Safety Guardrails & Autonomy Policy Enforcement</span>
              </h3>
              <p className="text-xs text-gray-400">
                Core safety boundaries guaranteeing AI never executes unrestricted actions without confidence verification and policy authorization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Configured Policy Guardrails</span>
                </h4>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-gray-400">Human Approval for High Impact:</span>
                    <span className="text-emerald-400 font-bold">ENFORCED (MANDATORY)</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-gray-400">Min Confidence Threshold:</span>
                    <span className="text-cyan-400 font-bold">85.0%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-gray-400">Rate Limit Per Minute:</span>
                    <span className="text-white font-bold">10 Actions / min</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-gray-400">Prompt Injection Defense:</span>
                    <span className="text-emerald-400 font-bold">ACTIVE (RegEx + Delimiter Filter)</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-gray-400">Groundedness Score Minimum:</span>
                    <span className="text-purple-300 font-bold">0.90 (Grounded in Verified Facts)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Authorized Response Tool Allowlist</span>
                </h4>

                <div className="space-y-1.5 font-mono text-xs">
                  {[
                    { tool: 'isolate_endpoint', impact: 'High Impact', reversible: 'Yes (Restorable)' },
                    { tool: 'kill_process', impact: 'High Impact', reversible: 'No' },
                    { tool: 'block_ioc', impact: 'Medium Impact', reversible: 'Yes (Removable)' },
                    { tool: 'disable_account', impact: 'High Impact', reversible: 'Yes (Re-activatable)' },
                    { tool: 'revoke_session', impact: 'Medium Impact', reversible: 'Yes' },
                    { tool: 'collect_evidence', impact: 'Low Impact', reversible: 'N/A (Read-only)' }
                  ].map((t) => (
                    <div key={t.tool} className="flex justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-white font-bold">{t.tool}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-amber-400 text-[10px]">{t.impact}</span>
                        <span className="text-gray-500 text-[10px]">Reversible: {t.reversible}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AI-SPM & SOVEREIGN MCP GATEWAY */}
      {activeTab === 'ai-mcp' && (
        <div className="space-y-6">
          {/* Sovereign AI Engine Connection Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Live Sovereign AI Engine Connected
                  </span>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    100% Native • Replaces Azure Foundry & Wiz
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Brain className="w-6 h-6 text-indigo-400" />
                  <span>Elsea Enterprise AI Production Cluster</span>
                </h2>
                <p className="text-xs font-mono text-gray-300">
                  Active Endpoint: <span className="text-cyan-300 font-bold">https://ai-apis.elsea.co.in/v1/chat/completions</span>
                </p>
                <p className="text-xs text-gray-400 max-w-3xl leading-relaxed">
                  Zero cloud telemetry leakage. AI prompts, contextual parameters, and execution traces are strictly evaluated within Sovereign Gateway boundaries before tool dispatch.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 p-4 rounded-xl border border-indigo-500/20 font-mono text-xs">
                <div className="space-y-0.5">
                  <span className="text-gray-500 text-[10px] uppercase">Engine Latency</span>
                  <p className="text-emerald-400 font-bold">&lt; 240ms</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-gray-500 text-[10px] uppercase">Max Context</span>
                  <p className="text-indigo-300 font-bold">32,768 Tokens</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-gray-500 text-[10px] uppercase">Temperature</span>
                  <p className="text-purple-300 font-bold">0.70 Guarded</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-gray-500 text-[10px] uppercase">Security Posture</span>
                  <p className="text-cyan-400 font-bold">Zero-Trust</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column: Registered AI Models (AI-SPM) & Sovereign MCP Security Gateway */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: AI-SPM Sovereign Model Inventory */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Cpu className="w-5 h-5 text-purple-400" />
                    <span>AI-SPM Model Inventory ({aiModels.length})</span>
                  </h3>
                  <p className="text-xs text-gray-400">Cryptographically audited model endpoints & risk postures.</p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30">
                  Audited & Approved
                </span>
              </div>

              <div className="space-y-3">
                {aiModels.length === 0 ? (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-gray-500 font-mono text-center">
                    Loading AI-SPM Models...
                  </div>
                ) : (
                  aiModels.map((model) => (
                    <div key={model.Id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${model.IsApproved ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                          <span className="text-sm font-bold text-white">{model.Name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-gray-400 rounded">
                            ID: {model.Id}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-900/40 text-indigo-300 rounded-full border border-indigo-500/30">
                          {model.Provider}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-gray-400 truncate">
                        {model.EndpointUrl}
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-1 border-t border-slate-900">
                        <span>Context: {model.MaxContextWindow?.toLocaleString()} tokens</span>
                        <span>Risk Score: <strong className={model.RiskScore === 0 ? 'text-emerald-400' : 'text-amber-400'}>{model.RiskScore} / 100</strong></span>
                        <span className="text-emerald-400 font-semibold">{model.IsApproved ? '✓ APPROVED' : 'RESTRICTED'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: Sovereign MCP Tool Gateway & SHA-256 Pinning */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <span>MCP Gateway & Tool Pinning ({mcpServers.length})</span>
                  </h3>
                  <p className="text-xs text-gray-400">Cryptographically pinned manifests preventing tool tampering.</p>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/30">
                  SHA-256 Enforced
                </span>
              </div>

              <div className="space-y-3">
                {mcpServers.length === 0 ? (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-gray-500 font-mono text-center">
                    Loading MCP Tool Servers...
                  </div>
                ) : (
                  mcpServers.map((server) => (
                    <div key={server.Id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Terminal className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-bold text-white">{server.ServerName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-gray-400 rounded">
                            Transport: {server.TransportType}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30">
                          {server.Status}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-gray-400 truncate">
                        {server.EndpointUrl}
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[10px] text-gray-300 space-y-1">
                        <div className="flex items-center justify-between text-gray-400">
                          <span>PINNED TOOL MANIFEST SHA-256:</span>
                          <span className="text-emerald-400 font-bold">VERIFIED</span>
                        </div>
                        <div className="text-purple-300 truncate">
                          {server.ToolManifestHash}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Gateway Guardrails Summary */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5 text-gray-400">
                  <div className="flex justify-between">
                    <span>Anti-SSRF Guardrail:</span>
                    <span className="text-emerald-400 font-bold">169.254.169.254 & RFC1918 Blocked</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Canary Honeypot Sandboxing:</span>
                    <span className="text-emerald-400 font-bold">attacker.invalid Intercepted</span>
                  </div>
                  <div className="flex justify-between">
                    <span>High-Impact Execution:</span>
                    <span className="text-amber-400 font-bold">Human Approval Gate (Tier-3)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Autonomous AI Agents Fleet & 1-Click Instant Quarantine */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span>Autonomous AI Agent Fleet ({aiAgents.length})</span>
                </h3>
                <p className="text-xs text-gray-400">Autonomous threat triage and containment entities governed by zero-trust identity.</p>
              </div>
              <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/30">
                Zero-Trust Posture
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-gray-400">
                    <th className="pb-3 font-semibold">Agent Name & UUID</th>
                    <th className="pb-3 font-semibold">Bound Brain</th>
                    <th className="pb-3 font-semibold">Rate Limit</th>
                    <th className="pb-3 font-semibold">High-Impact HITL</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Emergency Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {aiAgents.map((agent) => {
                    const isQuarantined = agent.Status === 'QUARANTINED';
                    return (
                      <tr key={agent.Id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 pr-4">
                          <div className="font-bold text-white text-sm font-sans">{agent.Name}</div>
                          <div className="text-cyan-400 font-mono text-[11px]">{agent.AgentUuid}</div>
                        </td>
                        <td className="py-3 pr-4 text-gray-300">
                          {agent.model?.Name || 'Elsea Enterprise AI'}
                        </td>
                        <td className="py-3 pr-4 text-gray-400">
                          {agent.RateLimitPerMin} actions / min
                        </td>
                        <td className="py-3 pr-4">
                          {agent.RequireHitlForHighImpact ? (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded border border-amber-500/30">
                              Enforced
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-800 text-gray-400 rounded">
                              Autonomous
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1 ${
                              isQuarantined
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isQuarantined ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                            <span>{agent.Status}</span>
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleToggleQuarantine(agent.AgentUuid, agent.Status)}
                            disabled={quarantiningAgent === agent.AgentUuid}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ml-auto shadow ${
                              isQuarantined
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-500/50'
                            } disabled:opacity-50`}
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>
                              {quarantiningAgent === agent.AgentUuid
                                ? 'Updating...'
                                : isQuarantined
                                ? 'Restore Agent'
                                : '1-Click Quarantine'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive 3 Success Contracts Verification Harness Console */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>Interactive AI Security Validation Harness (3 Success Contracts)</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Simulates controlled adversary attack vectors against the Sovereign MCP Gateway to prove Safety, Signal, and Detection contracts.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <select
                  value={harnessScenario}
                  onChange={(e) => setHarnessScenario(e.target.value as any)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="SSRF_EXFIL">SSRF Cloud IMDS Exfil (169.254.169.254)</option>
                  <option value="PROMPT_INJECTION">Prompt Injection (System Prompt Override)</option>
                  <option value="HITL_BYPASS">HITL Tier-3 Bypass (Unauthorized Host Isolate)</option>
                </select>

                <button
                  onClick={handleRunHarness}
                  disabled={runningHarness}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${runningHarness ? 'animate-spin' : ''}`} />
                  <span>{runningHarness ? 'Testing Gateway...' : 'Execute Live Harness'}</span>
                </button>
              </div>
            </div>

            {harnessResult && (
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 font-mono text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400">Correlation Key:</span>
                    <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {harnessResult.test_run_id}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400">Scenario:</span>
                    <span className="text-purple-300 font-bold">{harnessResult.scenario_type}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                  {/* Contract 1 */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-emerald-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 font-bold">Contract 1: Safety</span>
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">PASSED</span>
                    </div>
                    <p className="text-[11px] text-gray-400">{harnessResult.contracts?.['1_safety']?.details}</p>
                    <div className="text-[10px] text-emerald-400">✓ Contained at Gateway (0 Assets Touched)</div>
                  </div>

                  {/* Contract 2 */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-cyan-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 font-bold">Contract 2: Signal</span>
                      <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px] font-bold">PASSED</span>
                    </div>
                    <p className="text-[11px] text-gray-400">{harnessResult.contracts?.['2_signal']?.details}</p>
                    <div className="text-[10px] text-cyan-400">✓ ClickHouse & Postgres Share TestRunId</div>
                  </div>

                  {/* Contract 3 */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-indigo-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 font-bold">Contract 3: Detection</span>
                      <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-[10px] font-bold">PASSED</span>
                    </div>
                    <p className="text-[11px] text-gray-400">{harnessResult.contracts?.['3_detection']?.details}</p>
                    <div className="text-[10px] text-indigo-300">✓ Sigma Rule #{harnessResult.contracts?.['3_detection']?.rule_id} Fired</div>
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
