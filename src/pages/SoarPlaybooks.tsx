import { useState, useEffect } from 'react';
import { Zap, Plus, CheckCircle, Clock, Database } from 'lucide-react';
import toast from 'react-hot-toast';

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
      const res = await fetch(`http://localhost:8000/api/v2/soar/playbooks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setPlaybooks(await res.json());
    } catch (e) {}
  };

  const fetchApprovals = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/api/v2/soar/approvals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setApprovals(await res.json());
    } catch (e) {}
  };

  const fetchAudit = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/api/v2/soar/audit`, {
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
      const res = await fetch(`http://localhost:8000/api/v2/soar/approvals/${id}/approve`, {
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
      const res = await fetch(`http://localhost:8000/api/v2/soar/playbooks`, {
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

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#0a0a0a] min-h-screen text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center text-[#00ff8e]">
            <Zap className="w-8 h-8 mr-3 text-yellow-400" /> SOAR Automation & Playbooks
          </h1>
          <p className="text-gray-400 mt-1">Automated Security Orchestration and Response Pipelines</p>
        </div>
        <button 
          onClick={() => setShowBuilder(!showBuilder)}
          className="mt-4 md:mt-0 bg-[#00ff8e] text-black px-4 py-2 rounded font-bold hover:bg-[#00cc72] transition flex items-center">
          <Plus className="w-5 h-5 mr-2" /> New Playbook
        </button>
      </div>

      {showBuilder && (
        <div className="bg-[#1a1a1a] border border-gray-800 p-6 rounded-lg mb-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#00ff8e]" />
          <h2 className="text-xl font-bold mb-4">Playbook Builder</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Playbook Name</label>
              <input type="text" 
                value={newPlaybook.name}
                onChange={e => setNewPlaybook({...newPlaybook, name: e.target.value})}
                className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                placeholder="e.g. Ransomware Isolation" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Trigger Condition (YARA/Query)</label>
              <input type="text" 
                value={newPlaybook.trigger_condition}
                onChange={e => setNewPlaybook({...newPlaybook, trigger_condition: e.target.value})}
                className="w-full bg-black border border-gray-700 rounded p-2 text-white font-mono text-sm" 
                placeholder="event.type == 'Ransomware' AND risk > 90" />
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-400 mb-2">Execution Pipeline</h3>
            <div className="space-y-2 mb-2">
              {newPlaybook.actions.map((act, i) => (
                <div key={i} className="bg-black border border-gray-700 p-3 rounded flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded mr-3">Step {i+1}</span>
                    <span className="font-mono text-sm text-[#00ff8e]">{act.type}</span>
                  </div>
                  {act.command && <span className="font-mono text-xs text-gray-500">Cmd: {act.command}</span>}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <select 
                value={currentActionType}
                onChange={(e) => setCurrentActionType(e.target.value)}
                className="bg-black border border-gray-700 rounded p-2 text-sm text-white">
                <option value="isolate_network">Isolate Network</option>
                <option value="kill_process">Kill Suspicious Processes</option>
                <option value="sovereign_lockdown">Sovereign Lockdown (Screen Lock)</option>
                <option value="execute_shell">Execute Shell Command</option>
              </select>
              <button onClick={addAction} className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded text-sm transition">Add Action</button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-6 border-t border-gray-800 pt-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" 
                checked={newPlaybook.requires_approval}
                onChange={e => setNewPlaybook({...newPlaybook, requires_approval: e.target.checked})}
                className="form-checkbox text-[#00ff8e] bg-black border-gray-700 rounded" />
              <span className="text-sm text-gray-300">Require Human Approval Before Execution</span>
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowBuilder(false)} className="text-gray-400 hover:text-white px-4 py-2">Cancel</button>
              <button onClick={handleCreatePlaybook} className="bg-[#00ff8e] text-black px-4 py-2 rounded font-bold hover:bg-[#00cc72]">Save Playbook</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Playbooks List */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-400" /> Active Playbooks
          </h2>
          <div className="space-y-3">
            {playbooks.length === 0 ? (
              <div className="text-gray-500 text-sm italic">No playbooks configured.</div>
            ) : playbooks.map(p => (
              <div key={p.Id} className="bg-black p-4 rounded border border-gray-800 hover:border-gray-600 transition">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-[#00ff8e]">{p.Name}</h3>
                  {p.RequiresApproval ? (
                    <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded">Approval Required</span>
                  ) : (
                    <span className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded">Fully Autonomous</span>
                  )}
                </div>
                <div className="text-sm text-gray-400 font-mono mb-3">IF: {p.TriggerCondition}</div>
                <div className="flex flex-wrap gap-1">
                  {p.ActionsJson && JSON.parse(p.ActionsJson).map((act: any, i: number) => (
                    <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                      {act.type}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Approval Queue & Audit */}
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] border border-yellow-900/50 rounded-lg p-5">
            <h2 className="text-lg font-bold mb-4 flex items-center text-yellow-500">
              <Clock className="w-5 h-5 mr-2" /> Pending Human Approvals
            </h2>
            <div className="space-y-3">
              {approvals.length === 0 ? (
                <div className="text-gray-500 text-sm italic">Queue is empty.</div>
              ) : approvals.map(a => (
                <div key={a.Id} className="bg-black p-3 rounded border border-yellow-900 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm">Agent: {a.AgentId}</div>
                    <div className="text-xs text-gray-400">Playbook #{a.PlaybookId} Triggered</div>
                  </div>
                  <button onClick={() => handleApprove(a.Id)} className="bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-1 text-sm font-bold rounded">
                    Approve
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-5 h-[400px] flex flex-col">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-400" /> Execution Audit Trail
            </h2>
            <div className="overflow-y-auto flex-1 pr-2 space-y-2">
              {audit.map(a => (
                <div key={a.Id} className="flex items-start text-sm p-2 hover:bg-black rounded">
                  <div className="w-1/4 text-gray-500">{new Date(a.CreatedAt).toLocaleString()}</div>
                  <div className="w-3/4">
                    <span className="font-mono text-[#00ff8e]">{a.ActionType}</span> executed on Agent {a.AgentId}
                    <div className="text-xs text-gray-400 mt-1 truncate">Status: {a.Status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
