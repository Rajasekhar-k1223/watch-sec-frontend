import React, { useState, useEffect } from 'react';
import { 
  Crosshair, Play, ShieldAlert, CheckCircle, AlertTriangle, 
  Terminal, Server, RefreshCw, Lock, Radio, Cpu, Layers, Flame
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Scenario {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  severity: string;
  mitre_tactics: string[];
  mitre_techniques: string[];
  stages: { step: number; name: string; tactic: string }[];
}

interface SimulationRun {
  id: number;
  scenario_code: string;
  target_agent_id: string;
  status: string;
  stages_completed: number;
  total_stages: number;
  alerts_triggered: number;
  containment_action: string;
  started_at: string;
  completed_at: string;
  duration_ms?: number;
  timestamp?: string;
  execution_log: { step: number; action: string; status: string; detail: string }[];
}

export default function CyberRange() {
  const { token } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [recentRuns, setRecentRuns] = useState<SimulationRun[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('DESKTOP-9IJ37J7');
  const [agentsList, setAgentsList] = useState<{ id: string; hostname: string }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeRunResult, setActiveRunResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchScenariosAndRuns = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [scenRes, runsRes, agentsRes] = await Promise.all([
        fetch(`${API_URL}/v2/simulation/scenarios`, { headers }),
        fetch(`${API_URL}/v2/simulation/runs`, { headers }),
        fetch(`${API_URL}/agents/`, { headers })
      ]);

      if (scenRes.ok) {
        const data = await scenRes.json();
        setScenarios(data);
      }
      if (runsRes.ok) {
        const data = await runsRes.json();
        setRecentRuns(data);
      }
      if (agentsRes.ok) {
        const agents = await agentsRes.json();
        if (Array.isArray(agents)) {
          setAgentsList(agents.map((a: any) => ({ id: a.AgentId, hostname: a.Hostname || a.AgentId })));
          if (agents.length > 0 && !selectedAgent) {
            setSelectedAgent(agents[0].AgentId);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load Cyber Range data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenariosAndRuns();
  }, [token]);

  const handleLaunchSimulation = async (scenarioCode: string) => {
    setIsRunning(true);
    setActiveRunResult(null);
    toast.loading(`Launching ${scenarioCode} adversary simulation...`, { id: 'sim-launch' });

    try {
      const res = await fetch(`${API_URL}/v2/simulation/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          scenario_code: scenarioCode,
          target_agent_id: selectedAgent
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Simulation execution failed');
      }

      const data = await res.json();
      setActiveRunResult(data.result);
      toast.success(`Simulation completed! Target contained: ${data.result.containment_action}`, { id: 'sim-launch' });
      fetchScenariosAndRuns();
    } catch (err: any) {
      toast.error(err.message || 'Simulation error', { id: 'sim-launch' });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600">
              <Crosshair className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Cyber Range & Attack Simulation
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-red-50 border border-red-200 text-red-700">
                  LIVE ADVERSARY ENGINE
                </span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Automated multi-stage adversary attack validation, detection regression, and autonomous SOAR containment testing.
              </p>
            </div>
          </div>
        </div>

        {/* Target Agent Selector */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <Server className="w-5 h-5 text-blue-600" />
          <span className="text-xs text-slate-500 font-medium">Target Asset:</span>
          <select 
            value={selectedAgent} 
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="bg-white text-slate-800 text-sm rounded-lg px-3 py-1.5 border border-slate-300 focus:outline-none focus:border-red-500 font-mono shadow-sm"
          >
            {agentsList.length > 0 ? (
              agentsList.map(a => (
                <option key={a.id} value={a.id}>{a.hostname} ({a.id})</option>
              ))
            ) : (
              <option value="DESKTOP-9IJ37J7">DESKTOP-9IJ37J7</option>
            )}
          </select>
          <button 
            onClick={fetchScenariosAndRuns} 
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition"
            title="Refresh Cyber Range telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Simulation Command Center Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/soc_cyber_command.jpg" 
            alt="Cyber Range Command Center" 
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
        </div>
        <div className="relative z-10 p-6 md:p-8 max-w-2xl">
          <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
            Enterprise Adversary Emulation Arena
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-2">
            Active Cyber Defense Operations & Automated Red-Teaming
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Validate detection engineering rules, SIEM correlation pipelines, and zero-trust autonomous containment response in a live, controlled endpoint simulation sandbox.
          </p>
        </div>
      </div>

      {/* Live Execution Output Drawer (if triggered) */}
      {activeRunResult && (
        <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500"></div>
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-lg text-slate-900">Live Execution Result: {activeRunResult.scenario.name}</h3>
                <span className="text-xs text-slate-500 font-mono">Run ID #{activeRunResult.run_id} • Target: {activeRunResult.target_agent.hostname}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> {activeRunResult.status}
              </span>
              <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-mono">
                Containment: {activeRunResult.containment_action}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            {activeRunResult.execution_log.map((step: any, idx: number) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-2">
                  <span>STEP 0{step.step}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${step.status === 'CONTAINED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-700'}`}>
                    {step.status}
                  </span>
                </div>
                <div className="font-semibold text-sm text-slate-900">{step.action}</div>
                <div className="text-xs text-slate-500 mt-2 line-clamp-2">{step.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scenario Catalog Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-red-500" />
          Pre-Packaged Adversary Scenarios
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {scenarios.map((sc) => (
            <div 
              key={sc.id}
              className="bg-white border border-slate-200 hover:border-red-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 border border-slate-200 font-semibold">
                    {sc.category}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    sc.severity === 'Critical' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {sc.severity}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition">
                  {sc.name}
                </h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-3">
                  {sc.description}
                </p>

                {/* MITRE Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {sc.mitre_tactics.map((tactic, i) => (
                    <span key={i} className="text-[11px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-semibold">
                      {tactic}
                    </span>
                  ))}
                  {sc.mitre_techniques.map((tech, i) => (
                    <span key={i} className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono font-medium">
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Scenario Stages Progress Preview */}
                <div className="mt-4 pt-4 border-t border-slate-200/80">
                  <span className="text-xs text-slate-500 font-medium">Attack Chain Execution Path:</span>
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-xs text-slate-500">
                    {sc.stages.map((st, i) => (
                      <React.Fragment key={i}>
                        <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 whitespace-nowrap font-medium">
                          {st.name}
                        </span>
                        {i < sc.stages.length - 1 && <span className="text-slate-400 font-bold">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">5 Steps • Auto-Containment Enabled</span>
                <button
                  disabled={isRunning}
                  onClick={() => handleLaunchSimulation(sc.code)}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-red-500/20 transition disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Launch Scenario
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Simulation History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-600" />
          Recent Cyber Range Execution Telemetry
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-mono text-xs uppercase border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-4">Scenario Code</th>
                <th className="py-3 px-4">Target Agent</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Containment</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {recentRuns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No simulations executed yet. Select a scenario above to test autonomous detection.
                  </td>
                </tr>
              ) : (
                recentRuns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">#{r.id}</td>
                    <td className="py-3 px-4 text-red-600 font-semibold">{r.scenario_code}</td>
                    <td className="py-3 px-4 text-slate-800">{r.target_agent_id}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-blue-600 font-medium">{r.containment_action}</td>
                    <td className="py-3 px-4 text-slate-500">{r.duration_ms ? `${r.duration_ms}ms` : '1,420ms'}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {(r.timestamp || r.completed_at || r.started_at)
                        ? new Date(r.timestamp || r.completed_at || r.started_at || '').toLocaleTimeString() 
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

