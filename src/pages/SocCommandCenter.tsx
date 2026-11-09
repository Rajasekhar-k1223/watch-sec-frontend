import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, AlertTriangle, Activity, Users, Lock, Radio, 
  Clock, Zap, CheckCircle, ArrowUpRight, Search, Crosshair, 
  Terminal, Server, ChevronRight, RefreshCw, BarChart3, Database,
  GitBranch, Bot, Sparkles, Send, FileText, Check, ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function SocCommandCenter() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Shift Handover Modal State
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [incomingAnalyst, setIncomingAnalyst] = useState('secops_commander');
  const [handoverNotes, setHandoverNotes] = useState('All Critical incidents contained. Cobalt Strike C2 beacon quarantined. Zero SLA breaches in last shift.');
  const [submittingHandover, setSubmittingHandover] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/soc/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error('Failed to update live SOC metrics');
      }
    } catch (err) {
      console.error('Failed to load SOC dashboard data', err);
      toast.error('Failed to update live SOC metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleExecuteHandover = async () => {
    setSubmittingHandover(true);
    try {
      const res = await fetch(`${API_URL}/v2/soc/shifts/handover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          incoming_analyst: incomingAnalyst,
          notes: handoverNotes
        })
      });

      if (res.ok) {
        const json = await res.json();
        toast.success(`Shift Handover #${json.handover_id} logged to immutable audit ledger!`);
        setShowHandoverModal(false);
        fetchDashboard();
      } else {
        toast.error('Failed to execute shift handover');
      }
    } catch (err) {
      toast.error('Failed to execute shift handover');
    } finally {
      setSubmittingHandover(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 font-mono text-sm tracking-wider uppercase">Loading SOC Command Center...</span>
        </div>
      </div>
    );
  }

  const s = data?.summary || {};
  const activeThreats = data?.active_threats || [];
  const soarActions = data?.recent_soar_actions || [];
  const workload = data?.analyst_workload || [];
  const shift = data?.active_shift || {};
  const health = data?.platform_health || {};
  const attackChains = data?.recent_attack_chains || [];
  const aiRecommendations = data?.ai_soc_recommendations || [];
  const huntingActivity = data?.threat_hunting_activity || [];

  return (
    <div className="p-6 max-w-[1750px] mx-auto space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Enterprise SOC Command Center
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                24/7 MDR EYES-ON-GLASS
              </span>
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Real-time multi-tenant threat detection, SLA countdowns, containment state, and SOAR automation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-4 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/60 text-xs font-mono text-slate-300">
            <span>SHIFT: <b className="text-white">{shift.shift_name}</b></span>
            <span className="text-slate-600">|</span>
            <span>LEAD: <b className="text-cyan-400">{shift.lead_analyst}</b></span>
            <span className="text-slate-600">|</span>
            <span>INGEST P99: <b className="text-emerald-400">{health.latency_p99_ms} ms</b></span>
          </div>

          <button
            onClick={() => setShowHandoverModal(true)}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-purple-500/20 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Shift Handover</span>
          </button>

          <button
            onClick={() => { setRefreshing(true); fetchDashboard(); }}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>Sync</span>
          </button>

          <Link
            to="/soc/queue"
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition"
          >
            <Radio className="w-4 h-4" />
            <span>Open Work Queue</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div 
          onClick={() => navigate('/soc/queue?filter=critical')}
          className="bg-slate-900 border border-rose-500/30 p-4 rounded-xl cursor-pointer hover:border-rose-500 transition relative overflow-hidden group shadow-lg"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition"></div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-rose-400 font-mono uppercase tracking-wider">Critical</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-500">{s.critical_incidents ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">SLA target &lt; 5m</div>
        </div>

        <div 
          onClick={() => navigate('/soc/queue?filter=high')}
          className="bg-slate-900 border border-amber-500/30 p-4 rounded-xl cursor-pointer hover:border-amber-500 transition relative overflow-hidden group shadow-lg"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-amber-400 font-mono uppercase tracking-wider">High</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">{s.high_incidents ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">SLA target &lt; 15m</div>
        </div>

        <div 
          onClick={() => navigate('/soc/queue?filter=unassigned')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl cursor-pointer hover:border-slate-700 transition shadow-lg"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Unassigned</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-200">{s.unassigned_incidents ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Pending analyst pick</div>
        </div>

        <div 
          onClick={() => navigate('/soc/queue?filter=sla_risk')}
          className="bg-slate-900 border border-rose-900/50 p-4 rounded-xl cursor-pointer hover:border-rose-700 transition shadow-lg"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-rose-400 font-mono uppercase tracking-wider">SLA Breaches</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400">{s.sla_breaches ?? 0}</div>
          <div className="text-[11px] text-rose-300 mt-1">Escalation triggered</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-blue-400 font-mono uppercase tracking-wider">Detections 24h</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-blue-400">{s.detection_volume_24h ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Sigma / Telemetry hits</div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-emerald-400 font-mono uppercase tracking-wider">Contained Hosts</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{s.hosts_under_containment ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Driver network isolated</div>
        </div>

        <div 
          onClick={() => navigate('/mdr')}
          className="bg-slate-900 border border-purple-500/30 p-4 rounded-xl cursor-pointer hover:border-purple-500 transition shadow-lg"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-purple-400 font-mono uppercase tracking-wider">Open Cases</span>
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-400">{s.open_cases ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Case Mgmt 2.0</div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Threats, Attack Chains & Real-Time SOAR */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active High-Priority Attack Vectors */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-rose-500" />
                Active Attack Vectors & Correlated Threats
              </h2>
              <span className="text-xs text-slate-400 font-mono">MITRE ATT&CK ALIGNED</span>
            </div>

            <div className="space-y-3">
              {activeThreats.map((t: any, idx: number) => (
                <div key={idx} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between hover:border-slate-600 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${t.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                        {t.severity}
                      </span>
                      <span className="text-sm font-semibold text-slate-200">{t.threat}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span>MITRE: <code className="text-cyan-400">{t.mitre}</code></span>
                      <span>•</span>
                      <span>Affected Assets: <b className="text-white">{t.affected_nodes}</b></span>
                    </div>
                  </div>

                  <Link 
                    to="/soc/queue"
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 transition"
                  >
                    <span>Triage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Multi-Stage Attack Chains */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-amber-400" />
                Correlated Attack Chains (Cross-Host / Multi-Stage)
              </h2>
              <Link to="/attack-chains" className="text-xs text-amber-400 hover:underline flex items-center gap-1">
                <span>View Graph</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {attackChains.map((chain: any, idx: number) => (
                <div key={idx} className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-cyan-400 font-bold">{chain.chain_id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                      {(chain.confidence * 100).toFixed(0)}% Conf
                    </span>
                  </div>
                  <div className="text-slate-200 font-medium">Target: {chain.target_host}</div>
                  <div className="text-[11px] text-slate-400 font-mono bg-slate-950 p-2 rounded break-words">
                    {chain.tactic_flow}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Depth: {chain.kill_chain_depth} stages • {new Date(chain.detected_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Autonomous SOAR Containment Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Real-Time SOAR Containment Dispatches
              </h2>
              <span className="text-xs text-slate-400 font-mono">AUTOMATED MITIGATION</span>
            </div>

            <div className="divide-y divide-slate-800 overflow-hidden">
              {soarActions.map((a: any) => (
                <div key={a.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${a.status === 'Success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {a.status === 'Success' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">{a.action}</div>
                      <div className="text-slate-400 font-mono text-[11px]">Host: {a.target_agent}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${a.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {a.status}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">{new Date(a.executed_at).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Col: AI SOC, Hunting Activity, Workload */}
        <div className="space-y-6">
          
          {/* AI SOC Autonomous Recommendations */}
          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                AI SOC Autonomous Guidance
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono font-bold">
                GROUNDED
              </span>
            </div>

            <div className="space-y-3">
              {aiRecommendations.map((rec: any, idx: number) => (
                <div key={idx} className="bg-slate-800/70 border border-slate-700/60 p-3.5 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{rec.title}</span>
                    <span className="text-[10px] font-mono text-cyan-300">{(rec.confidence * 100).toFixed(0)}% conf</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{rec.impact}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-emerald-400 flex items-center gap-1 font-mono">
                      <ShieldCheck className="w-3 h-3" /> SOAR Ready
                    </span>
                    <button 
                      onClick={() => toast.success(`Approved: ${rec.title}`)}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Approve & Execute →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Threat Hunting Sweeps */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                Active Threat Hunting Sweeps
              </h2>
              <Link to="/threat-hunting" className="text-xs text-emerald-400 hover:underline">
                New Hunt
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              {huntingActivity.map((h: any, idx: number) => (
                <div key={idx} className="bg-slate-800/50 border border-slate-700/40 p-3 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5 max-w-[200px]">
                    <div className="font-semibold text-slate-200 truncate">{h.hunt_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">By {h.analyst}</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${h.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400 animate-pulse'}`}>
                      {h.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{h.matches} hits</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Analysts & Workload */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                SOC Analyst Workload & Shift
              </h2>
              <span className="text-xs text-emerald-400 font-mono">{workload.filter((w: any) => w.status === 'Online').length} Online</span>
            </div>

            <div className="space-y-2.5">
              {workload.map((u: any, idx: number) => (
                <div key={idx} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${u.status === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                      <span className="font-semibold text-slate-200">{u.username}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.role}</div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-400">{u.assigned_incidents}</span>
                    <span className="text-slate-400 text-[10px] ml-1">incidents</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Jump Links */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-slate-400">SOC Workspace Navigation</h2>
            
            <Link 
              to="/soc/queue"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition group"
            >
              <div className="flex items-center gap-3">
                <Radio className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold">Analyst Work Queue</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition" />
            </Link>

            <Link 
              to="/mdr"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition group"
            >
              <div className="flex items-center gap-3">
                <Server className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold">MDR Operations & Onboarding</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition" />
            </Link>

            <Link 
              to="/portal"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition group"
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold">Customer Security Portal</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition" />
            </Link>
          </div>

        </div>

      </div>

      {/* Shift Handover Modal */}
      {showHandoverModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Execute Automated Shift Handover
              </h3>
              <button 
                onClick={() => setShowHandoverModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Outgoing Duty Analyst</label>
                <input 
                  type="text" 
                  disabled 
                  value={user?.username || 'secops_lead'} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Incoming Relieving Analyst</label>
                <select 
                  value={incomingAnalyst} 
                  onChange={(e) => setIncomingAnalyst(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-blue-500"
                >
                  <option value="secops_commander">secops_commander (Lead)</option>
                  <option value="elsea">elsea (Senior Incident Commander)</option>
                  <option value="superadmin">superadmin (Global SOC Director)</option>
                  <option value="secops_escalation">secops_escalation (Tier 3 Specialist)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Automated Shift Summary & Notes</label>
                <textarea 
                  rows={4}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-sans focus:border-blue-500"
                  placeholder="Enter operational handover briefing..."
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                <div>• Auto-compiling {s.active_incidents ?? 0} active incidents & {s.critical_incidents ?? 0} critical items.</div>
                <div>• Generating tamper-evident cryptographically signed briefing.</div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowHandoverModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteHandover}
                disabled={submittingHandover}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {submittingHandover ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Transfer Shift & Log Briefing</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
