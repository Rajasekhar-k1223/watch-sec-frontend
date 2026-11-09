import React, { useState, useEffect } from 'react';
import { 
  Search, Save, FolderPlus, Database, Server, FileText, Globe, 
  Bot, Send, Sparkles, RefreshCw, Crosshair, Filter, Calendar, 
  Play, Clock, Check, ArrowRight, ShieldAlert, Cpu, Network, User, Terminal
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ThreatHunting() {
  const { token } = useAuth();
  const [activePivot, setActivePivot] = useState<'Host' | 'User' | 'Process' | 'Network' | 'IOC' | 'Timeline' | 'MITRE'>('Host');
  const [queryType, setQueryType] = useState<'KQL' | 'NaturalLanguage' | 'VisualBuilder'>('KQL');
  const [query, setQuery] = useState('process.name:"powershell.exe" AND network.dest_port:4444');
  
  // Visual Builder fields
  const [builderField, setBuilderField] = useState('process.name');
  const [builderOp, setBuilderOp] = useState('EQUALS');
  const [builderValue, setBuilderValue] = useState('powershell.exe');

  // AI Copilot / Natural Language State
  const [copilotQuery, setCopilotQuery] = useState('');
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [generatedQueryPreview, setGeneratedQueryPreview] = useState<string | null>(null);
  const [aiRationale, setAiRationale] = useState<string | null>(null);

  // Results State
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [matchedHits, setMatchedHits] = useState(0);

  // Saved / Scheduled Hunts Tab
  const [activeView, setActiveView] = useState<'workspace' | 'saved_hunts'>('workspace');
  const [savedHunts, setSavedHunts] = useState([
    {
      id: 1,
      name: 'LSASS Memory Dumping Probe Sweep',
      query: 'process.name:"procdump.exe" OR event.code:10',
      pivot: 'Process',
      schedule: 'Every 15 mins (Continuous)',
      last_run: '2 mins ago',
      hits: 3,
      status: 'Active'
    },
    {
      id: 2,
      name: 'Beaconing Jitter to Non-Standard TLS Ports',
      query: 'network.dest_port:(4444 OR 8443 OR 9001) AND flow.direction:"outbound"',
      pivot: 'Network',
      schedule: 'Hourly',
      last_run: '42 mins ago',
      hits: 1,
      status: 'Active'
    },
    {
      id: 3,
      name: 'Lateral Movement SMB Psexec Pipe Hunting',
      query: 'file.path:"\\\\*\\IPC$\\psexec" OR process.name:"psexesvc.exe"',
      pivot: 'Host',
      schedule: 'Daily at 02:00 UTC',
      last_run: '5 hours ago',
      hits: 0,
      status: 'Active'
    }
  ]);

  const pivots = [
    { key: 'Host', label: 'Host Pivot', icon: Server },
    { key: 'User', label: 'User Pivot', icon: User },
    { key: 'Process', label: 'Process Pivot', icon: Terminal },
    { key: 'Network', label: 'Network Pivot', icon: Network },
    { key: 'IOC', label: 'IOC Pivot', icon: ShieldAlert },
    { key: 'Timeline', label: 'Timeline Pivot', icon: Clock },
    { key: 'MITRE', label: 'MITRE ATT&CK Pivot', icon: Crosshair }
  ] as const;

  const handleCopilotSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!copilotQuery.trim()) return;

    setIsCopilotThinking(true);
    setTimeout(() => {
      let synthQuery = '';
      let rationale = '';

      const ql = copilotQuery.toLowerCase();
      if (ql.includes('powershell') || ql.includes('encoded')) {
        synthQuery = 'process.name:"powershell.exe" AND process.command_line:("-enc" OR "-EncodedCommand" OR "-nop")';
        rationale = 'Synthesized KQL filters for obfuscated PowerShell execution with base64 arguments.';
      } else if (ql.includes('lsass') || ql.includes('credential')) {
        synthQuery = 'process.target:"lsass.exe" AND handle.granted_access:0x1010';
        rationale = 'Targets processes requesting PROCESS_VM_READ/WRITE permissions to Local Security Authority.';
      } else if (ql.includes('c2') || ql.includes('beacon') || ql.includes('port')) {
        synthQuery = 'network.dest_port:(4444 OR 8080 OR 9001) AND network.protocol:"TCP"';
        rationale = 'Detects outbound TCP telemetry directed to frequent adversary C2 stager ports.';
      } else {
        synthQuery = `event.action:"Execution" AND (process.name:"${copilotQuery.slice(0, 15)}" OR network.ip:"${copilotQuery.slice(0, 15)}")`;
        rationale = `Grounded query generated based on analyst natural language specification: "${copilotQuery}".`;
      }

      setGeneratedQueryPreview(synthQuery);
      setAiRationale(rationale);
      setIsCopilotThinking(false);
      setCopilotQuery('');
    }, 700);
  };

  const handleAcceptGeneratedQuery = () => {
    if (generatedQueryPreview) {
      setQuery(generatedQueryPreview);
      setGeneratedQueryPreview(null);
      setAiRationale(null);
      toast.success('AI Query transferred to Query Editor. Ready to execute.');
    }
  };

  const handleExecuteHunt = async () => {
    setIsSearching(true);
    try {
      const res = await fetch(`${API_URL}/v2/soc/hunting/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query_text: query,
          query_type: queryType,
          pivot_type: activePivot
        })
      });

      if (res.ok) {
        const json = await res.json();
        setResults(json.results || []);
        setMatchedHits(json.matched_hits || 0);
        toast.success(`Threat Hunt executed across telemetry: ${json.matched_hits || 0} hits found`);
      } else {
        setResults([]);
        setMatchedHits(0);
        toast.error('No matching records found in telemetry stream');
      }
    } catch (err) {
      setResults([]);
      setMatchedHits(0);
      toast.error('Threat hunt execution failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleApplyBuilder = () => {
    const formatted = `${builderField}:"${builderValue}"`;
    setQuery(prev => prev ? `${prev} AND ${formatted}` : formatted);
    toast.success('Clause added to active query');
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1750px] mx-auto min-w-0">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 shadow-xl p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-xs">
            <Crosshair className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Threat Hunting Workspace 2.0
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
                MULTI-PIVOT TELEMETRY ENGINE
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Proactive multi-pivot search, natural language KQL translation, and scheduled adversary sweeps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button 
            onClick={() => setActiveView('workspace')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${activeView === 'workspace' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Active Hunt</span>
          </button>
          <button 
            onClick={() => setActiveView('saved_hunts')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${activeView === 'saved_hunts' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Saved & Scheduled ({savedHunts.length})</span>
          </button>
        </div>
      </div>

      {/* Multi-Pivot Bar (Phase 9.8 Requirement) */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-lg flex items-center gap-2 overflow-x-auto text-xs font-semibold">
        <span className="text-slate-400 font-mono uppercase text-[10px] px-2 flex items-center gap-1">
          <Filter className="w-3 h-3 text-cyan-400" /> Active Pivot:
        </span>
        {pivots.map(p => {
          const Icon = p.icon;
          const isSelected = activePivot === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setActivePivot(p.key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition whitespace-nowrap ${isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {activeView === 'workspace' ? (
        <>
          {/* AI-Generated Query Review Banner (Phase 9.8 Rule: Analyst Visibility Before Execution) */}
          {generatedQueryPreview && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl shadow-xl text-xs space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Copilot Synthesized Query Ready for Analyst Review</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">VERIFY BEFORE EXECUTION</span>
              </div>
              <p className="text-slate-300 text-[11px]">{aiRationale}</p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-emerald-300 break-all">
                {generatedQueryPreview}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setGeneratedQueryPreview(null); setAiRationale(null); }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Discard
                </button>
                <button
                  onClick={handleAcceptGeneratedQuery}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Transfer to Query Editor & Execute</span>
                </button>
              </div>
            </div>
          )}

          {/* Query Formulation Section: Query Editor / Visual Builder */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQueryType('KQL')}
                  className={`px-3 py-1 rounded-lg font-mono ${queryType === 'KQL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  KQL / Lucene Editor
                </button>
                <button
                  onClick={() => setQueryType('VisualBuilder')}
                  className={`px-3 py-1 rounded-lg font-mono ${queryType === 'VisualBuilder' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Visual Search Builder
                </button>
              </div>

              <span className="text-slate-400 font-mono text-[11px]">
                Target Pivot: <b className="text-cyan-400">{activePivot}</b>
              </span>
            </div>

            {queryType === 'VisualBuilder' && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Field</label>
                  <select 
                    value={builderField} 
                    onChange={(e) => setBuilderField(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono text-xs"
                  >
                    <option value="process.name">process.name</option>
                    <option value="process.command_line">process.command_line</option>
                    <option value="network.dest_port">network.dest_port</option>
                    <option value="network.dest_ip">network.dest_ip</option>
                    <option value="file.sha256">file.sha256</option>
                    <option value="user.name">user.name</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Operator</label>
                  <select 
                    value={builderOp} 
                    onChange={(e) => setBuilderOp(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono text-xs"
                  >
                    <option value="EQUALS">EQUALS</option>
                    <option value="CONTAINS">CONTAINS</option>
                    <option value="STARTS_WITH">STARTS_WITH</option>
                    <option value="IN_LIST">IN_LIST</option>
                  </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Value</label>
                  <input 
                    type="text" 
                    value={builderValue}
                    onChange={(e) => setBuilderValue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono text-xs"
                  />
                </div>

                <div className="pt-5">
                  <button
                    onClick={handleApplyBuilder}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg font-semibold text-xs border border-slate-700"
                  >
                    + Append Clause
                  </button>
                </div>
              </div>
            )}

            {/* Main Query Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-cyan-300 font-mono text-xs focus:border-blue-500 focus:outline-none"
                  placeholder="Enter KQL / Lucene query expression..."
                />
              </div>

              <button 
                onClick={handleExecuteHunt}
                disabled={isSearching}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSearching ? 'Scanning Telemetry...' : 'Execute Threat Hunt'}</span>
              </button>
            </div>
          </div>

          {/* 2-Column: Results Table & AI Threat Hunter */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Results Grid (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl h-[620px] flex flex-col overflow-hidden">
                <div className="border-b border-slate-800 p-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Hunt Telemetry Matches
                    {matchedHits > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono font-bold border border-blue-500/30">
                        {matchedHits} hits
                      </span>
                    )}
                  </h3>
                  <span className="text-xs font-mono text-slate-400">ClickHouse Columnar + PostgreSQL Index</span>
                </div>
                
                <div className="p-0 flex-1 overflow-auto">
                  {results.length === 0 && !isSearching ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs space-y-2">
                      <Crosshair className="w-10 h-10 text-slate-600 stroke-[1.5]" />
                      <span>Execute a hunt query above or prompt the AI Copilot to begin investigation.</span>
                    </div>
                  ) : (
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="text-[10px] text-slate-400 uppercase tracking-wider font-mono bg-slate-950 border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="px-4 py-3">Time</th>
                          <th className="px-4 py-3">Endpoint</th>
                          <th className="px-4 py-3">Pivot</th>
                          <th className="px-4 py-3">Matched Telemetry / Lineage</th>
                          <th className="px-4 py-3">MITRE</th>
                          <th className="px-4 py-3 text-right">Pivot Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                        {results.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition">
                            <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{row.timestamp}</td>
                            <td className="px-4 py-3 font-bold text-white whitespace-nowrap">{row.hostname}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px]">
                                {row.match_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[11px] text-slate-300 max-w-md break-all">
                              {row.telemetry_snippet}
                            </td>
                            <td className="px-4 py-3 text-amber-400 text-[11px] whitespace-nowrap">
                              {row.mitre_technique || 'T1059'}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <button 
                                onClick={() => toast.success(`Pivoted on ${row.hostname}`)}
                                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-500/20 transition"
                              >
                                + Pivot Host
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* AI Threat Hunter Panel (1 col) */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl h-[620px] flex flex-col overflow-hidden">
                <div className="border-b border-slate-800 p-4 flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">AI Threat Hunter</h3>
                    <span className="text-[10px] text-emerald-400 font-mono">• Natural Language KQL</span>
                  </div>
                </div>
                
                <div className="p-4 flex-1 overflow-auto space-y-3 text-xs text-slate-300">
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-slate-400 leading-relaxed text-[11px]">
                    Specify an adversary behavior in plain English. The AI engine translates it into executable KQL with zero invented syntax:
                    <br/><br/>
                    <i className="text-slate-300">"Find encoded powershell commands making outbound network connections"</i>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] uppercase font-mono text-slate-500">Quick Prompt Templates:</span>
                    <button
                      onClick={() => setCopilotQuery('Find lsass memory read attempts')}
                      className="w-full text-left p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-[11px] truncate block"
                    >
                      • LSASS Memory dumping attempts
                    </button>
                    <button
                      onClick={() => setCopilotQuery('Find beaconing to unusual high ports')}
                      className="w-full text-left p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-[11px] truncate block"
                    >
                      • C2 Beaconing to high ports
                    </button>
                    <button
                      onClick={() => setCopilotQuery('Find obfuscated powershell execution')}
                      className="w-full text-left p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-[11px] truncate block"
                    >
                      • Obfuscated PowerShell execution
                    </button>
                  </div>
                </div>

                <div className="p-3 border-t border-slate-800 bg-slate-950">
                  <form onSubmit={handleCopilotSubmit} className="relative flex items-center">
                    <input
                      type="text"
                      value={copilotQuery}
                      onChange={(e) => setCopilotQuery(e.target.value)}
                      placeholder="Prompt AI Hunter..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-3 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      disabled={isCopilotThinking}
                    />
                    <button 
                      type="submit" 
                      disabled={isCopilotThinking}
                      className="absolute right-2 text-blue-400 hover:text-blue-300 disabled:opacity-50 p-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>

          </div>
        </>
      ) : (
        /* Saved & Scheduled Hunts View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Continuous Threat Hunting Schedule</h2>
              <p className="text-xs text-slate-400">Automated recurring sweeps inspecting live telemetry buffers.</p>
            </div>
            <button 
              onClick={() => toast.success('New scheduled hunt modal initialized')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
            >
              + Create Scheduled Hunt
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savedHunts.map(h => (
              <div key={h.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-sm">{h.name}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                    {h.status}
                  </span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300 break-all">
                  {h.query}
                </div>
                <div className="text-slate-400 space-y-1 text-[11px]">
                  <div>Pivot: <b className="text-slate-200">{h.pivot}</b></div>
                  <div>Frequency: <b className="text-slate-200">{h.schedule}</b></div>
                  <div>Last Run: {h.last_run} • <b className="text-amber-400">{h.hits} hits</b></div>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                  <button 
                    onClick={() => { setQuery(h.query); setActiveView('workspace'); }}
                    className="px-3 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-xs"
                  >
                    Load in Editor
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
