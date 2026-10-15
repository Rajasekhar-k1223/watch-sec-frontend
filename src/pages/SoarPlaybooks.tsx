import { useState, useEffect } from 'react';
import { Zap, Plus, Database, ChevronRight, Activity, ShieldAlert, X, Terminal, Workflow } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

export default function SoarPlaybooks() {
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  
  const [showBuilder, setShowBuilder] = useState(false);
  const [newPlaybook, setNewPlaybook] = useState({
    name: '',
    trigger_condition: '',
    requires_approval: true,
    actions: [] as any[]
  });
  const [currentActionType, setCurrentActionType] = useState('isolate_network');

  const fetchPlaybooks = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/soar/playbooks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setPlaybooks(await res.json());
    } catch (e) {}
  };

  const fetchApprovals = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/soar/approvals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setApprovals(await res.json());
    } catch (e) {}
  };

  const fetchAudit = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/soar/audit`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setAudit(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchPlaybooks();
    fetchApprovals();
    fetchAudit();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/soar/approvals/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Action Approved and Executing");
        fetchApprovals();
        fetchAudit();
      }
    } catch (e) {
      toast.error("Failed to approve action");
    }
  };

  const handleCreatePlaybook = async () => {
    if (!newPlaybook.name) return toast.error("Playbook needs a name");
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/soar/playbooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPlaybook)
      });
      if (res.ok) {
        toast.success("Playbook created successfully");
        setShowBuilder(false);
        setNewPlaybook({ name: '', trigger_condition: '', requires_approval: true, actions: [] });
        fetchPlaybooks();
      }
    } catch (e) {
      toast.error("Failed to create playbook");
    }
  };

  const addAction = () => {
    setNewPlaybook({
      ...newPlaybook,
      actions: [...newPlaybook.actions, { type: currentActionType, command: currentActionType === 'execute_shell' ? 'whoami' : undefined }]
    });
  };

  const removeAction = (index: number) => {
    const updated = [...newPlaybook.actions];
    updated.splice(index, 1);
    setNewPlaybook({ ...newPlaybook, actions: updated });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#030712] min-h-screen text-white font-sans selection:bg-emerald-500/30">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide uppercase">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Active Operations</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight flex items-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            SOAR Orchestration
          </h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base max-w-xl leading-relaxed">
            Design and deploy autonomous security pipelines. Intercept threats at wire-speed and orchestrate complex incident response playbooks across your entire fleet.
          </p>
        </div>
        <button 
          onClick={() => setShowBuilder(!showBuilder)}
          className="mt-6 md:mt-0 group relative px-6 py-3 font-bold text-black rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 flex items-center">
          <Workflow className="w-5 h-5 mr-2" /> 
          {showBuilder ? 'Close Builder' : 'New Playbook'}
        </button>
      </div>

      {/* Playbook Builder Panel */}
      {showBuilder && (
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-emerald-500/30 p-8 rounded-2xl shadow-2xl shadow-emerald-900/20 relative overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-top-4">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500" />
          
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center text-white">
              <Zap className="w-6 h-6 mr-3 text-emerald-400" /> Pipeline Builder
            </h2>
            <button onClick={() => setShowBuilder(false)} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Playbook Designation</label>
              <input type="text" 
                value={newPlaybook.name}
                onChange={e => setNewPlaybook({...newPlaybook, name: e.target.value})}
                className="w-full bg-[#020617] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" 
                placeholder="e.g. Ransomware Killchain" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trigger Condition (YARA/Query)</label>
              <input type="text" 
                value={newPlaybook.trigger_condition}
                onChange={e => setNewPlaybook({...newPlaybook, trigger_condition: e.target.value})}
                className="w-full bg-[#020617] border border-white/10 rounded-lg p-3 text-emerald-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder-gray-600" 
                placeholder="event.type == 'Ransomware' AND risk > 90" />
            </div>
          </div>
          
          <div className="mb-8 bg-[#020617] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider flex items-center">
              <Terminal className="w-4 h-4 mr-2" /> Execution Pipeline Sequence
            </h3>
            
            {newPlaybook.actions.length === 0 ? (
              <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center text-gray-500">
                No actions defined. Add an action below to start building your pipeline.
              </div>
            ) : (
              <div className="space-y-3 mb-6 relative">
                {/* Visual connecting line */}
                <div className="absolute left-[1.15rem] top-4 bottom-4 w-0.5 bg-emerald-500/20 z-0"></div>
                
                {newPlaybook.actions.map((act, i) => (
                  <div key={i} className="relative z-10 flex items-center group">
                    <div className="w-10 h-10 rounded-full bg-[#0f172a] border-2 border-emerald-500 flex items-center justify-center text-emerald-400 font-bold text-sm shadow-[0_0_10px_rgba(16,185,129,0.3)] shrink-0">
                      {i + 1}
                    </div>
                    <div className="ml-4 flex-1 bg-[#0f172a] border border-white/10 p-4 rounded-lg flex items-center justify-between group-hover:border-emerald-500/50 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-bold text-white tracking-wide">{act.type.toUpperCase().replace(/_/g, ' ')}</span>
                        {act.command && <span className="font-mono text-xs text-cyan-400 mt-1 bg-cyan-900/20 px-2 py-0.5 rounded border border-cyan-500/20 w-fit">Cmd: {act.command}</span>}
                      </div>
                      <button onClick={() => removeAction(i)} className="text-gray-500 hover:text-red-400 transition-colors p-2">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <select 
                value={currentActionType}
                onChange={(e) => setCurrentActionType(e.target.value)}
                className="flex-1 bg-[#0f172a] border border-white/10 rounded-lg p-3 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none">
                <option value="isolate_network">Isolate Network</option>
                <option value="kill_process">Kill Suspicious Processes</option>
                <option value="sovereign_lockdown">Sovereign Lockdown (Screen Lock)</option>
                <option value="trigger_pcap">Trigger Network PCAP Capture</option>
                <option value="deploy_deception">Deploy Deception Traps</option>
                <option value="recover_ransomware">Trigger Ransomware VSS Rollback</option>
                <option value="execute_shell">Execute Shell Command</option>
              </select>
              <button onClick={addAction} className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-lg text-sm font-bold transition-all flex items-center whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" /> Add Action Node
              </button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between mt-8 border-t border-white/10 pt-6">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input type="checkbox" 
                  checked={newPlaybook.requires_approval}
                  onChange={e => setNewPlaybook({...newPlaybook, requires_approval: e.target.checked})}
                  className="peer sr-only" />
                <div className="w-10 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer-checked:bg-emerald-500 transition-colors"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
              </div>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Require Human Approval Before Execution</span>
            </label>
            <div className="flex gap-3 mt-6 md:mt-0 w-full md:w-auto">
              <button onClick={() => setShowBuilder(false)} className="flex-1 md:flex-none text-gray-400 hover:text-white px-6 py-3 font-semibold transition-colors">Cancel</button>
              <button onClick={handleCreatePlaybook} className="flex-1 md:flex-none bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black px-8 py-3 rounded-lg font-bold shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40 hover:-translate-y-0.5">
                Deploy Playbook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Active Playbooks List */}
        <div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center text-white">
              <Database className="w-5 h-5 mr-3 text-cyan-400" /> Deployed Playbooks
            </h2>
            <span className="bg-cyan-900/30 text-cyan-400 text-xs px-3 py-1 rounded-full border border-cyan-500/20">{playbooks.length} Active</span>
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {playbooks.length === 0 ? (
              <div className="text-gray-500 text-sm italic p-4 text-center border border-white/5 rounded-lg bg-black/20">No playbooks currently deployed.</div>
            ) : playbooks.map(p => (
              <div key={p.Id} className="bg-[#020617] p-5 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all duration-300 group hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">{p.Name}</h3>
                    <div className="text-xs text-gray-500 font-mono mt-1 flex items-center">
                      <ChevronRight className="w-3 h-3 mr-1" /> TRIGGER: {p.TriggerCondition}
                    </div>
                  </div>
                  {p.RequiresApproval ? (
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-900/30 text-amber-400 px-2.5 py-1 rounded border border-amber-500/20 whitespace-nowrap ml-2">Manual Approval</span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-900/30 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/20 whitespace-nowrap ml-2">Autonomous</span>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                  {p.ActionsJson && JSON.parse(p.ActionsJson).map((act: any, i: number) => (
                    <div key={i} className="flex items-center">
                      <span className="text-xs font-mono bg-white/5 text-gray-300 px-2.5 py-1.5 rounded-md border border-white/10">
                        {act.type.toUpperCase().replace(/_/g, ' ')}
                      </span>
                      {i < JSON.parse(p.ActionsJson).length - 1 && (
                        <ChevronRight className="w-4 h-4 mx-1 text-gray-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {/* Approval Queue */}
          <div className="bg-[#0f172a]/40 backdrop-blur-md border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-50" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center text-white">
                <ShieldAlert className="w-5 h-5 mr-3 text-amber-500" /> Pending Approvals
              </h2>
              {approvals.length > 0 && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              )}
            </div>
            
            <div className="space-y-3">
              {approvals.length === 0 ? (
                <div className="text-gray-500 text-sm italic p-4 text-center border border-white/5 rounded-lg bg-black/20">All clear. No pending interventions.</div>
              ) : approvals.map(a => (
                <div key={a.Id} className="bg-amber-950/20 p-4 rounded-xl border border-amber-900/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:bg-amber-950/40 transition-colors">
                  <div>
                    <div className="font-bold text-white text-sm">Agent: <span className="font-mono text-amber-400">{a.AgentId}</span></div>
                    <div className="text-xs text-gray-400 mt-1">Playbook #{a.PlaybookId} sequence halted pending authorization.</div>
                  </div>
                  <button onClick={() => handleApprove(a.Id)} className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                    AUTHORIZE EXECUTION
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail Terminal */}
          <div className="bg-[#020617] border border-white/10 rounded-2xl p-0 overflow-hidden flex flex-col h-[400px] shadow-2xl">
            <div className="bg-[#0f172a] px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center text-gray-300 uppercase tracking-widest">
                <Terminal className="w-4 h-4 mr-3 text-gray-400" /> Execution Terminal
              </h2>
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6 space-y-3 font-mono text-xs custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-opacity-5">
              {audit.length === 0 ? (
                <div className="text-gray-600 italic">Waiting for telemetry...</div>
              ) : audit.map(a => (
                <div key={a.Id} className="flex flex-col sm:flex-row items-start sm:items-center py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded transition-colors group">
                  <div className="text-gray-500 w-32 shrink-0">{new Date(a.CreatedAt).toLocaleTimeString()}</div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center w-full">
                    <span className="text-emerald-400 font-bold mr-2 group-hover:text-emerald-300 transition-colors">[{a.ActionType}]</span> 
                    <span className="text-gray-400">deployed to</span> 
                    <span className="text-cyan-400 ml-2 bg-cyan-900/20 px-2 py-0.5 rounded">{a.AgentId}</span>
                  </div>
                  <div className="mt-2 sm:mt-0 shrink-0">
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                      a.Status === 'Completed' ? 'bg-emerald-900/30 text-emerald-400' :
                      a.Status === 'Failed' ? 'bg-red-900/30 text-red-400' :
                      'bg-blue-900/30 text-blue-400'
                    }`}>
                      {a.Status}
                    </span>
                  </div>
                </div>
              ))}
              {/* Fake cursor at bottom */}
              <div className="w-2 h-4 bg-emerald-500/50 animate-pulse mt-4 inline-block"></div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
}
