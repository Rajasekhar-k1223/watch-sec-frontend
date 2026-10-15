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
        fetch(`${API_URL}/api/v2/simulation/scenarios`, { headers }),
        fetch(`${API_URL}/api/v2/simulation/runs`, { headers }),
        fetch(`${API_URL}/api/agents/`, { headers })
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
      const res = await fetch(`${API_URL}/api/v2/simulation/run`, {
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
    <div className="p-6 space-y-6 bg-gray-900 text-gray-100 min-h-screen">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-950/60 border border-red-500/30 rounded-xl text-red-400">
              <Crosshair className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Cyber Range & Attack Simulation
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-red-900/60 border border-red-500/40 text-red-300">
                  LIVE ADVERSARY ENGINE
                </span>
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Automated multi-stage adversary attack validation, detection regression, and autonomous SOAR containment testing.
              </p>
            </div>
          </div>
        </div>

        {/* Target Agent Selector */}
        <div className="flex items-center gap-3 bg-gray-800/80 p-2 rounded-xl border border-gray-700">
          <Server className="w-5 h-5 text-blue-400" />
          <span className="text-xs text-gray-400 font-medium">Target Asset:</span>
          <select 
            value={selectedAgent} 
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="bg-gray-900 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-red-500 font-mono"
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
            className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 transition"
            title="Refresh Cyber Range telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Execution Output Drawer (if triggered) */}
      {activeRunResult && (
        <div className="bg-gray-950/90 border border-red-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500"></div>
          
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="font-semibold text-lg text-white">Live Execution Result: {activeRunResult.scenario.name}</h3>
                <span className="text-xs text-gray-400 font-mono">Run ID #{activeRunResult.run_id} • Target: {activeRunResult.target_agent.hostname}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> {activeRunResult.status}
              </span>
              <span className="px-3 py-1 bg-blue-950/80 border border-blue-500/50 text-blue-300 rounded-lg text-xs font-mono">
                Containment: {activeRunResult.containment_action}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            {activeRunResult.execution_log.map((step: any, idx: number) => (
              <div key={idx} className="bg-gray-900/90 border border-gray-800 p-3 rounded-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-2">
                  <span>STEP 0{step.step}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${step.status === 'CONTAINED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-gray-800 text-gray-300'}`}>
                    {step.status}
                  </span>
                </div>
                <div className="font-semibold text-sm text-gray-200">{step.action}</div>
                <div className="text-xs text-gray-400 mt-2 line-clamp-2">{step.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scenario Catalog Grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-red-400" />
          Pre-Packaged Adversary Scenarios
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {scenarios.map((sc) => (
            <div 
              key={sc.id}
              className="bg-gray-850/80 border border-gray-800 hover:border-red-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono px-2.5 py-1 bg-gray-800 rounded-lg text-gray-300 border border-gray-700">
                    {sc.category}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    sc.severity === 'Critical' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {sc.severity}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition">
                  {sc.name}
                </h3>
                <p className="text-sm text-gray-400 mt-2 line-clamp-3">
                  {sc.description}
                </p>

                {/* MITRE Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {sc.mitre_tactics.map((tactic, i) => (
                    <span key={i} className="text-[11px] bg-red-950/40 text-red-300 border border-red-800/40 px-2 py-0.5 rounded">
                      {tactic}
                    </span>
                  ))}
                  {sc.mitre_techniques.map((tech, i) => (
                    <span key={i} className="text-[11px] bg-gray-800/60 text-gray-300 border border-gray-700 px-2 py-0.5 rounded font-mono">
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Scenario Stages Progress Preview */}
                <div className="mt-4 pt-4 border-t border-gray-800/80">
                  <span className="text-xs text-gray-400 font-medium">Attack Chain Execution Path:</span>
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-xs text-gray-400">
                    {sc.stages.map((st, i) => (
                      <React.Fragment key={i}>
                        <span className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-[11px] whitespace-nowrap">
                          {st.name}
                        </span>
                        {i < sc.stages.length - 1 && <span className="text-gray-600 font-bold">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-mono">5 Steps • Auto-Containment Enabled</span>
                <button
                  disabled={isRunning}
                  onClick={() => handleLaunchSimulation(sc.code)}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-red-950/50 transition disabled:opacity-50"
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
      <div className="bg-gray-850/80 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-400" />
          Recent Cyber Range Execution Telemetry
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-900/80 text-gray-400 font-mono text-xs uppercase border-b border-gray-800">
              <tr>
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-4">Scenario Code</th>
                <th className="py-3 px-4">Target Agent</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Alerts Raised</th>
                <th className="py-3 px-4">Containment Action</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono text-xs">
              {recentRuns.length > 0 ? (
                recentRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-800/40 transition">
                    <td className="py-3 px-4 text-gray-400">#{run.id}</td>
                    <td className="py-3 px-4 font-bold text-white">{run.scenario_code}</td>
                    <td className="py-3 px-4 text-blue-400">{run.target_agent_id}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                        {run.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-amber-400 font-bold">{run.alerts_triggered} Alerts</td>
                    <td className="py-3 px-4 text-purple-300">{run.containment_action || 'None'}</td>
                    <td className="py-3 px-4 text-gray-400">{new Date(run.completed_at).toLocaleTimeString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500 font-sans">
                    No cyber range simulation runs recorded yet. Launch a scenario above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
