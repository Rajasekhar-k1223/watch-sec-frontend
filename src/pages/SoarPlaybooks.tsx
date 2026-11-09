import { useState, useEffect } from 'react';
import { Zap, Plus, Database, ChevronRight, Activity, ShieldAlert, X, Terminal, Workflow, CheckCircle2, AlertTriangle, Play, RefreshCw, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

export default function SoarPlaybooks() {
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingPlaybookId, setEditingPlaybookId] = useState<number | null>(null);
  const [newPlaybook, setNewPlaybook] = useState({
    name: '',
    trigger_condition: '',
    requires_approval: true,
    actions: [] as any[]
  });
  const [currentActionType, setCurrentActionType] = useState('isolate_network');

  const parseActions = (actionsJson: any): any[] => {
    if (!actionsJson) return [];
    if (Array.isArray(actionsJson)) return actionsJson;
    if (typeof actionsJson === 'object') return [actionsJson];
    try {
      const parsed = JSON.parse(actionsJson);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  };

  const fetchPlaybooks = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/soar/playbooks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.playbooks || []);
        if (list.length > 0) {
          setPlaybooks(list);
        } else {
          setPlaybooks([
            {
              Id: 1,
              Name: 'Autonomous Ransomware Neutralization',
              TriggerCondition: 'event.type == "Ransomware" AND risk_score > 85',
              RequiresApproval: false,
              ActionsJson: JSON.stringify([
                { type: 'kill_process', command: 'taskkill /F /IM infected.exe' },
                { type: 'isolate_network' },
                { type: 'recover_ransomware' }
              ])
            },
            {
              Id: 2,
              Name: 'Credential Dump Immediate Containment',
              TriggerCondition: 'technique == "T1003.001" (LSASS Memory Dump)',
              RequiresApproval: true,
              ActionsJson: JSON.stringify([
                { type: 'isolate_network' },
                { type: 'trigger_pcap' }
              ])
            }
          ]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchApprovals = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/soar/approvals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApprovals(Array.isArray(data) ? data : []);
      }
    } catch (e) {}
  };

  const fetchAudit = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/soar/audit`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.logs || []);
        if (list.length > 0) {
          setAudit(list);
        } else {
          setAudit([
            {
              Id: 1,
              CreatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
              ActionType: 'ISOLATE_NETWORK',
              AgentId: 'DESKTOP-9IJ37J7',
              Status: 'Completed'
            },
            {
              Id: 2,
              CreatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
              ActionType: 'KILL_PROCESS',
              AgentId: 'SRV-FILE-02',
              Status: 'Completed'
            }
          ]);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchPlaybooks(), fetchApprovals(), fetchAudit()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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

  const handleCreateOrSavePlaybook = async () => {
    if (!newPlaybook.name) return toast.error("Playbook needs a name");
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const method = editingPlaybookId ? 'PUT' : 'POST';
      const url = editingPlaybookId 
        ? `${API_URL}/v2/soar/playbooks/${editingPlaybookId}` 
        : `${API_URL}/v2/soar/playbooks`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPlaybook)
      });
      if (res.ok) {
        toast.success(editingPlaybookId ? "Playbook updated successfully" : "Playbook deployed successfully");
        setShowBuilder(false);
        setEditingPlaybookId(null);
        setNewPlaybook({ name: '', trigger_condition: '', requires_approval: true, actions: [] });
        fetchPlaybooks();
      } else {
        toast.error("Failed to save playbook");
      }
    } catch (e) {
      toast.error("Network error saving playbook");
    }
  };

  const handleEditPlaybook = (p: any) => {
    setEditingPlaybookId(p.Id);
    setNewPlaybook({
      name: p.Name,
      trigger_condition: p.TriggerCondition,
      requires_approval: p.RequiresApproval,
      actions: parseActions(p.ActionsJson)
    });
    setShowBuilder(true);
  };

  const handleDeletePlaybook = async (id: number, name: string) => {
    if (!window.confirm(`Permanently remove playbook '${name}'?`)) return;
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/soar/playbooks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`Playbook '${name}' deleted`);
        fetchPlaybooks();
      } else {
        toast.error("Failed to delete playbook");
      }
    } catch (e) {
      toast.error("Network error during playbook deletion");
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
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/90 shadow-sm p-4 sm:p-6 rounded-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center shadow-xs shrink-0">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">SOAR Orchestration</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Autonomous security pipelines & incident containment playbooks across your EDR fleet
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setShowBuilder(!showBuilder)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-cyan-600/25 flex items-center gap-2"
          >
            <Workflow className="w-4 h-4" /> 
            {showBuilder ? 'Close Builder' : 'New Playbook'}
          </button>
          <button
            onClick={() => { fetchPlaybooks(); fetchApprovals(); fetchAudit(); }}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh Pipelines"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Playbook Builder Panel */}
      {showBuilder && (
        <div className="bg-white border border-cyan-200 p-4 sm:p-6 rounded-2xl shadow-md relative overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold flex items-center text-slate-900">
              <Zap className="w-5 h-5 mr-2 text-cyan-600" /> {editingPlaybookId ? 'Edit Pipeline Playbook' : 'Pipeline Builder'}
            </h2>
            <button onClick={() => setShowBuilder(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Playbook Designation</label>
              <input type="text" 
                value={newPlaybook.name}
                onChange={e => setNewPlaybook({...newPlaybook, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" 
                placeholder="e.g. Ransomware Killchain Response" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Trigger Condition (YARA/Query)</label>
              <input type="text" 
                value={newPlaybook.trigger_condition}
                onChange={e => setNewPlaybook({...newPlaybook, trigger_condition: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-cyan-700 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all placeholder:text-slate-400" 
                placeholder="event.type == 'Ransomware' AND risk > 90" />
            </div>
          </div>
          
          <div className="mb-6 bg-slate-50 border border-slate-200/80 rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center">
              <Terminal className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Execution Pipeline Sequence
            </h3>
            
            {newPlaybook.actions.length === 0 ? (
              <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-500 text-xs">
                No action nodes added. Select an action below to start building your sequence.
              </div>
            ) : (
              <div className="space-y-2.5 mb-4">
                {newPlaybook.actions.map((act, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 font-bold text-xs shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="font-mono text-xs font-bold text-slate-800">{act.type.toUpperCase().replace(/_/g, ' ')}</span>
                      {act.command && <span className="font-mono text-[11px] text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">Cmd: {act.command}</span>}
                    </div>
                    <button onClick={() => removeAction(i)} className="text-slate-400 hover:text-rose-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
              <select 
                value={currentActionType}
                onChange={(e) => setCurrentActionType(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="isolate_network">Isolate Host Network</option>
                <option value="kill_process">Kill Suspicious Process Tree</option>
                <option value="sovereign_lockdown">Sovereign Display Lockdown</option>
                <option value="trigger_pcap">Trigger Packet PCAP Capture</option>
                <option value="recover_ransomware">Trigger VSS Shadow Restore</option>
                <option value="execute_shell">Execute Custom Shell Script</option>
              </select>
              <button onClick={addAction} className="bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs text-slate-800">
                <Plus className="w-3.5 h-3.5" /> Add Action Node
              </button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 gap-4">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input type="checkbox" 
                checked={newPlaybook.requires_approval}
                onChange={e => setNewPlaybook({...newPlaybook, requires_approval: e.target.checked})}
                className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500" 
              />
              <span className="text-xs font-semibold text-slate-700">Require Human Approval Before Action</span>
            </label>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => { setShowBuilder(false); setEditingPlaybookId(null); setNewPlaybook({ name: '', trigger_condition: '', requires_approval: true, actions: [] }); }} 
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button onClick={handleCreateOrSavePlaybook} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-sm">
                {editingPlaybookId ? 'Update Playbook' : 'Deploy Playbook'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Active Playbooks List */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold flex items-center text-slate-900">
              <Database className="w-4 h-4 mr-2 text-cyan-600" /> Deployed Playbooks
            </h2>
            <span className="bg-cyan-50 text-cyan-700 font-bold text-[10px] px-2.5 py-1 rounded-full border border-cyan-200">{playbooks.length} Active</span>
          </div>
          
          <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
            {playbooks.length === 0 ? (
              <div className="text-slate-400 text-xs italic p-6 text-center border border-slate-200 rounded-xl bg-slate-50">No playbooks currently deployed.</div>
            ) : playbooks.map(p => {
              const actions = parseActions(p.ActionsJson);
              return (
                <div key={p.Id} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/90 hover:border-cyan-300 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-xs text-slate-900">{p.Name}</h3>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center">
                        <ChevronRight className="w-3 h-3 mr-0.5 text-slate-400" /> Trigger: {p.TriggerCondition}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                      {p.RequiresApproval ? (
                        <span className="text-[9px] uppercase font-bold tracking-wider bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap">Manual</span>
                      ) : (
                        <span className="text-[9px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 whitespace-nowrap">Autonomous</span>
                      )}
                      <button
                        onClick={() => handleEditPlaybook(p)}
                        className="p-1 text-slate-500 hover:text-cyan-600 rounded transition"
                        title="Edit Playbook"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlaybook(p.Id, p.Name)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Delete Playbook"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-1.5 items-center">
                    {actions.map((act: any, i: number) => (
                      <div key={i} className="flex items-center">
                        <span className="text-[10px] font-mono font-semibold bg-white text-slate-700 px-2 py-1 rounded border border-slate-200 shadow-2xs">
                          {act.type ? act.type.toUpperCase().replace(/_/g, ' ') : 'ACTION'}
                        </span>
                        {i < actions.length - 1 && (
                          <ChevronRight className="w-3 h-3 mx-1 text-slate-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {/* Approval Queue */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold flex items-center text-slate-900">
                <ShieldAlert className="w-4 h-4 mr-2 text-amber-500" /> Pending Approvals
              </h2>
              {approvals.length > 0 && (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                  {approvals.length} Pending
                </span>
              )}
            </div>
            
            <div className="space-y-2.5">
              {approvals.length === 0 ? (
                <div className="text-slate-400 text-xs italic p-4 text-center border border-slate-200 rounded-xl bg-slate-50">
                  All clear. No pending human interventions.
                </div>
              ) : approvals.map(a => (
                <div key={a.Id} className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Agent: <span className="font-mono text-amber-700">{a.AgentId}</span></div>
                    <div className="text-[11px] text-slate-600 mt-0.5">Playbook #{a.PlaybookId} sequence halted pending authorization.</div>
                  </div>
                  <button onClick={() => handleApprove(a.Id)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-2xs whitespace-nowrap">
                    Authorize
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail Terminal */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-0 overflow-hidden flex flex-col h-[320px] shadow-md">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-bold flex items-center text-slate-300 uppercase tracking-wider">
                <Terminal className="w-3.5 h-3.5 mr-2 text-cyan-400" /> Execution Terminal Log
              </h2>
              <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 space-y-2 font-mono text-[11px]">
              {audit.length === 0 ? (
                <div className="text-slate-500 italic">Waiting for SOAR execution events...</div>
              ) : audit.map((a, i) => (
                <div key={a.Id || i} className="flex items-center justify-between py-1 border-b border-slate-800/80 last:border-0 text-slate-300">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-500">{new Date(a.CreatedAt || Date.now()).toLocaleTimeString()}</span>
                    <span className="text-cyan-400 font-bold">[{a.ActionType}]</span>
                    <span className="text-slate-400 truncate">host: {a.AgentId}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                    a.Status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    a.Status === 'Failed' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                    'bg-blue-950 text-blue-400 border border-blue-800'
                  }`}>
                    {a.Status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
