import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, ShieldAlert, FileSearch, Download, Upload, 
  Terminal, Server, Zap, RefreshCw, AlertTriangle, CheckCircle, 
  X, Copy, ExternalLink, Play, Layers, Cpu, Activity, Lock, ArrowUpRight
} from 'lucide-react';
import { io } from 'socket.io-client';
import { API_URL, SOCKET_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface BehavioralIoc {
  type: string;
  indicator: string;
}

interface ProcessNode {
  name: string;
  pid: number;
  cmd: string;
  status: string;
}

interface SandboxEvent {
  id: string;
  filename: string;
  status: 'SAFE' | 'MALICIOUS' | 'SUSPICIOUS' | 'ANALYZING';
  hash: string;
  reason: string;
  risk_score?: number;
  classification?: string;
  mitre_tactics?: string[];
  behavioral_iocs?: BehavioralIoc[];
  process_tree?: ProcessNode[];
  registry_mutations?: Array<{ key: string; action: string }>;
  network_beacons?: Array<{ destination: string; protocol: string; action: string }>;
  iocs_count?: number;
  timestamp: string;
  agentId: string;
  source?: string;
}

interface SandboxMetrics {
  total_detonations: number;
  malicious_quarantined: number;
  safe_samples: number;
  suspicious_samples: number;
  zero_day_extracted: number;
  redrainbow_engine_status: string;
  native_engine_status?: string;
  active_vm_pool: string;
  avg_detonation_latency_sec: number;
}

export default function SandboxDashboard() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState<SandboxEvent[]>([]);
  const [metrics, setMetrics] = useState<SandboxMetrics>({
    total_detonations: 0,
    malicious_quarantined: 0,
    safe_samples: 0,
    suspicious_samples: 0,
    zero_day_extracted: 0,
    redrainbow_engine_status: 'ONLINE (Monitorix Native Hypervisor)',
    native_engine_status: 'ONLINE (Monitorix Native Hypervisor)',
    active_vm_pool: '16/16 Isolated QEMU/KVM Pods Ready',
    avg_detonation_latency_sec: 2.3
  });
  const [loading, setLoading] = useState(true);
  const [filterVerdict, setFilterVerdict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Detonation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'upload' | 'hash'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hashInput, setHashInput] = useState('');
  const [detonationNotes, setDetonationNotes] = useState('');
  const [isDetonating, setIsDetonating] = useState(false);
  const [detonationStep, setDetonationStep] = useState(0);

  // Inspection Drawer State
  const [inspectEvent, setInspectEvent] = useState<SandboxEvent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'verdict' | 'mitre' | 'iocs' | 'processes'>('verdict');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch telemetry
  const fetchData = async () => {
    try {
      setLoading(true);
      const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token');
      
      const [histRes, metRes] = await Promise.all([
        fetch(`${API_URL}/sandbox/history`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch(`${API_URL}/sandbox/metrics`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);

      if (histRes.ok) {
        const histData = await histRes.json();
        setEvents(Array.isArray(histData) ? histData : []);
      }
      if (metRes.ok) {
        const metData = await metRes.json();
        setMetrics(metData);
      }
    } catch (err) {
      console.error('Failed to fetch sandbox data:', err);
      toast.error('Failed to load sandbox telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Socket.IO real-time updates
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });

    socket.on('SandboxTelemetryUpdate', (updatedRecord: SandboxEvent) => {
      toast.success(`Detonation Complete: ${updatedRecord.filename} evaluated as ${updatedRecord.status}`, {
        icon: updatedRecord.status === 'MALICIOUS' ? '🚨' : '🛡️'
      });
      setEvents(prev => [updatedRecord, ...prev.filter(e => e.id !== updatedRecord.id)]);
      setMetrics(prev => ({
        ...prev,
        total_detonations: prev.total_detonations + 1,
        malicious_quarantined: updatedRecord.status === 'MALICIOUS' ? prev.malicious_quarantined + 1 : prev.malicious_quarantined,
        safe_samples: updatedRecord.status === 'SAFE' ? prev.safe_samples + 1 : prev.safe_samples
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Handle Detonation Submission
  const handleStartDetonation = async () => {
    if (modalTab === 'upload' && !selectedFile) {
      toast.error('Please select a file to detonate');
      return;
    }
    if (modalTab === 'hash' && (!hashInput || hashInput.trim().length < 32)) {
      toast.error('Please provide a valid SHA-256 or MD5 hash');
      return;
    }

    try {
      setIsDetonating(true);
      setDetonationStep(1);

      const formData = new FormData();
      if (modalTab === 'upload' && selectedFile) {
        formData.append('file', selectedFile);
        formData.append('filename', selectedFile.name);
      } else {
        formData.append('file_hash', hashInput.trim());
        formData.append('filename', `hash_sample_${hashInput.trim().substring(0, 8)}.bin`);
      }
      formData.append('notes', detonationNotes || 'Submitted via Analyst Portal');

      // Progress animation
      setTimeout(() => setDetonationStep(2), 600);
      setTimeout(() => setDetonationStep(3), 1300);
      setTimeout(() => setDetonationStep(4), 1900);

      const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/sandbox/detonate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Detonation failed: ${res.statusText}`);
      }

      const result = await res.json();
      setDetonationStep(5);

      setTimeout(() => {
        setIsDetonating(false);
        setIsModalOpen(false);
        setSelectedFile(null);
        setHashInput('');
        setDetonationNotes('');
        setDetonationStep(0);
        
        toast.success(`Detonation complete: ${result.filename} (${result.status})`);
        fetchData();
        handleOpenInspect(result.id);
      }, 700);

    } catch (err: any) {
      console.error('Detonation submission error:', err);
      toast.error(err.message || 'Detonation request failed');
      setIsDetonating(false);
      setDetonationStep(0);
    }
  };

  // Inspect specific analysis
  const handleOpenInspect = async (id: string | number) => {
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/sandbox/analysis/${id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const fullData = await res.json();
        setInspectEvent(fullData);
      } else {
        const fallback = events.find(e => String(e.id) === String(id));
        setInspectEvent(fallback || null);
      }
    } catch (err) {
      const fallback = events.find(e => String(e.id) === String(id));
      setInspectEvent(fallback || null);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Fleet Quarantine Action
  const handleQuarantineHash = async (hash: string, filename: string) => {
    try {
      const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/sandbox/quarantine-hash`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: json_payload({
          hash,
          reason: `Quarantined by ${user?.username || 'analyst'} for sample: ${filename}`
        })
      });
      if (res.ok) {
        toast.success(`Hash ${hash.substring(0, 10)}... quarantined across all endpoints!`, { icon: '🛑' });
        fetchData();
      } else {
        toast.error('Quarantine action failed');
      }
    } catch (e) {
      toast.error('Error applying quarantine');
    }
  };

  const json_payload = (obj: any) => JSON.stringify(obj);

  // Quick EICAR test detonation
  const handleRunEicarTest = async () => {
    try {
      const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token');
      const formData = new FormData();
      formData.append('filename', 'eicar_antivirus_validation.com');
      formData.append('file_b64', btoa('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'));
      formData.append('notes', 'Automated EICAR anti-malware verification payload');

      toast.loading('Dispatching EICAR payload to Monitorix Detonation Sandbox...', { id: 'eicar-det' });
      const res = await fetch(`${API_URL}/sandbox/detonate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
      });

      if (res.ok) {
        const resData = await res.json();
        toast.success(`EICAR Detonated: Verdict ${resData.status} (${resData.classification})`, { id: 'eicar-det' });
        fetchData();
        handleOpenInspect(resData.id);
      } else {
        toast.error('EICAR test failed', { id: 'eicar-det' });
      }
    } catch (err) {
      toast.error('Error running test sample', { id: 'eicar-det' });
    }
  };

  // Filtered telemetry
  const filteredEvents = events.filter(e => {
    if (filterVerdict !== 'ALL' && e.status !== filterVerdict) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchFile = e.filename?.toLowerCase().includes(q);
      const matchHash = e.hash?.toLowerCase().includes(q);
      const matchAgent = e.agentId?.toLowerCase().includes(q);
      const matchClass = e.classification?.toLowerCase().includes(q);
      if (!matchFile && !matchHash && !matchAgent && !matchClass) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <FileSearch size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monitorix Detonation Sandbox</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Native Hypervisor v3.0
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Automated multi-OS VM detonation, deep heuristic memory tracing & MITRE ATT&CK mapping
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {metrics.redrainbow_engine_status}
          </span>

          <button
            onClick={handleRunEicarTest}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/80 flex items-center gap-1.5 transition-all shadow-sm"
            title="Detonate benign EICAR standard test payload to verify engine integrity"
          >
            <Play size={14} className="text-indigo-600" />
            Quick EICAR Test
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Upload size={14} />
            Detonate Sample
          </button>

          <button
            onClick={fetchData}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Refresh Sandbox Telemetry"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Detonations */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Detonated</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{metrics.total_detonations}</span>
            <span className="text-xs font-medium text-emerald-600">Live Telemetry</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Samples executed in isolated hypervisors</p>
        </div>

        {/* Malicious Quarantined */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Malware Confirmed</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 tracking-tight">{metrics.malicious_quarantined}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Quarantined
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Hashes auto-blacklisted in HashBank</p>
        </div>

        {/* Clean Samples */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Verified Clean</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{metrics.safe_samples}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Whitelisted
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Legitimate signed binaries & scripts</p>
        </div>

        {/* VM Fleet Ready */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">VM Sandbox Pool</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cpu size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{metrics.active_vm_pool.split(' ')[0]}</span>
            <span className="text-xs font-medium text-slate-500">Avg {metrics.avg_detonation_latency_sec}s</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">KVM/QEMU microVMs awaiting payload</p>
        </div>
      </div>

      {/* Main Detonation Table & Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Verdict:</span>
            {(['ALL', 'MALICIOUS', 'SUSPICIOUS', 'SAFE'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterVerdict(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterVerdict === tab
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab === 'ALL' ? 'All Telemetry' : tab}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by file, hash, agent..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400 shadow-sm"
            />
          </div>
        </div>

        {/* Telemetry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/90 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Detonation Time</th>
                <th className="p-4">Origin / Agent</th>
                <th className="p-4">Sample Filename</th>
                <th className="p-4">Verdict & Risk</th>
                <th className="p-4">Classification</th>
                <th className="p-4">MITRE ATT&CK</th>
                <th className="p-4">SHA-256</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Fetching real-time sandbox forensics...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                    No detonation telemetry matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredEvents.map(ev => {
                  const isMalicious = ev.status === 'MALICIOUS';
                  const isSuspicious = ev.status === 'SUSPICIOUS';
                  const risk = ev.risk_score || (isMalicious ? 90 : 5);
                  
                  return (
                    <tr 
                      key={ev.id} 
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => handleOpenInspect(ev.id)}
                    >
                      <td className="p-4 whitespace-nowrap text-slate-500 font-medium">
                        {new Intl.DateTimeFormat('en-US', { 
                          month: 'short', day: 'numeric', 
                          hour: '2-digit', minute: '2-digit', second: '2-digit', 
                          hour12: false 
                        }).format(new Date(ev.timestamp))}
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {ev.agentId}
                        </span>
                      </td>

                      <td className="p-4 font-mono font-medium text-slate-900 max-w-[200px] truncate" title={ev.filename}>
                        {ev.filename}
                      </td>

                      <td className="p-4">
                        {isMalicious ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold uppercase tracking-wider border border-rose-200">
                              <ShieldAlert size={12} /> Malicious
                            </span>
                            <span className="text-[11px] font-bold text-rose-600 bg-rose-100/70 px-1.5 py-0.5 rounded">
                              {risk}/100
                            </span>
                          </div>
                        ) : isSuspicious ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wider border border-amber-200">
                              <AlertTriangle size={12} /> Suspicious
                            </span>
                            <span className="text-[11px] font-bold text-amber-600 bg-amber-100/70 px-1.5 py-0.5 rounded">
                              {risk}/100
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider border border-emerald-200">
                              <ShieldCheck size={12} /> Safe
                            </span>
                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                              0/100
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-4 font-medium text-slate-700">
                        {ev.classification || (isMalicious ? 'Trojan / Malware' : 'Benign File')}
                      </td>

                      <td className="p-4">
                        {ev.mitre_tactics && ev.mitre_tactics.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {ev.mitre_tactics.slice(0, 2).map((t, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono border border-slate-200">
                                {t.split(' ')[0]}
                              </span>
                            ))}
                            {ev.mitre_tactics.length > 2 && (
                              <span className="text-[10px] text-slate-400 font-semibold">
                                +{ev.mitre_tactics.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="p-4 font-mono text-[11px] text-slate-500 max-w-[150px] truncate" title={ev.hash}>
                        {ev.hash}
                      </td>

                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenInspect(ev.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                          >
                            Inspect
                          </button>

                          {isMalicious && (
                            <button
                              onClick={() => handleQuarantineHash(ev.hash, ev.filename)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                              title="Block fleet-wide in HashBank"
                            >
                              Quarantine
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detonation Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Sandbox Payload Detonation</h3>
                  <p className="text-xs text-slate-500">Dispatch binary or cryptographic hash to Monitorix Native Detonation hypervisor</p>
                </div>
              </div>
              <button 
                onClick={() => !isDetonating && setIsModalOpen(false)}
                disabled={isDetonating}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
              <button
                onClick={() => setModalTab('upload')}
                disabled={isDetonating}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  modalTab === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                File Binary Upload (.exe, .pdf, .dll, .sh)
              </button>
              <button
                onClick={() => setModalTab('hash')}
                disabled={isDetonating}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  modalTab === 'hash' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SHA-256 Hash Lookup
              </button>
            </div>

            {/* Input Areas */}
            {modalTab === 'upload' ? (
              <div 
                onClick={() => !isDetonating && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                  selectedFile 
                    ? 'border-blue-500 bg-blue-50/30' 
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  disabled={isDetonating}
                  onChange={e => e.target.files && setSelectedFile(e.target.files[0])}
                  className="hidden"
                />
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                {selectedFile ? (
                  <div>
                    <span className="font-semibold text-slate-900 text-sm">{selectedFile.name}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB — Ready to detonate</p>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-slate-800 text-sm">Click to browse or drag file here</span>
                    <p className="text-xs text-slate-500 mt-1">Supports PE (.exe/.dll), Scripts (.ps1/.sh), MS Office, PDF</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cryptographic Hash</label>
                <input
                  type="text"
                  placeholder="e.g. 275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f"
                  value={hashInput}
                  disabled={isDetonating}
                  onChange={e => setHashInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400"
                />
                <p className="text-[11px] text-slate-400">Queries threat intel graph and analyzes historical execution footprints.</p>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Analyst Notes & Context</label>
              <input
                type="text"
                placeholder="Optional incident ticket or detection context..."
                value={detonationNotes}
                disabled={isDetonating}
                onChange={e => setDetonationNotes(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400"
              />
            </div>

            {/* Live Detonation Progress Stepper */}
            {isDetonating && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span className="flex items-center gap-2">
                    <RefreshCw size={13} className="animate-spin text-blue-600" />
                    Executing Sandboxed Detonation...
                  </span>
                  <span className="text-blue-600 font-mono">{detonationStep * 20}%</span>
                </div>
                
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300 ease-out"
                    style={{ width: `${detonationStep * 20}%` }}
                  ></div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono">
                  {detonationStep === 1 && "Ingesting payload & calculating SHA-256 fingerprint..."}
                  {detonationStep === 2 && "Provisioning isolated QEMU/KVM microVM guest instance..."}
                  {detonationStep === 3 && "Hooking NtCreateUserProcess, RegSetValue, & network sockets..."}
                  {detonationStep === 4 && "Correlating behavioral heuristics with MITRE ATT&CK Matrix..."}
                  {detonationStep === 5 && "Verdict sealed! Persisting to HashBank & generating report..."}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isDetonating}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartDetonation}
                disabled={isDetonating}
                className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isDetonating ? 'Detonating...' : 'Start Detonation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Behavioral Forensics Inspection Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Forensics Report</span>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      ID #{inspectEvent?.id}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1 break-all">
                    {inspectEvent?.filename || 'Detonation Analysis'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Verdict Summary Bar */}
              {inspectEvent && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  inspectEvent.status === 'MALICIOUS'
                    ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                    : inspectEvent.status === 'SUSPICIOUS'
                    ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-3">
                    {inspectEvent.status === 'MALICIOUS' ? (
                      <ShieldAlert size={28} className="text-rose-600" />
                    ) : inspectEvent.status === 'SUSPICIOUS' ? (
                      <AlertTriangle size={28} className="text-amber-600" />
                    ) : (
                      <ShieldCheck size={28} className="text-emerald-600" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold uppercase tracking-wide">
                          {inspectEvent.status}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 border border-current">
                          Score: {inspectEvent.risk_score || (inspectEvent.status === 'MALICIOUS' ? 90 : 5)}/100
                        </span>
                      </div>
                      <p className="text-xs opacity-80 mt-0.5 font-medium">
                        {inspectEvent.classification || (inspectEvent.status === 'MALICIOUS' ? 'Malware Payload' : 'Clean Sample')}
                      </p>
                    </div>
                  </div>

                  {inspectEvent.status === 'MALICIOUS' && (
                    <button
                      onClick={() => handleQuarantineHash(inspectEvent.hash, inspectEvent.filename)}
                      className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-all"
                    >
                      Quarantine Fleet
                    </button>
                  )}
                </div>
              )}

              {/* Drawer Sub-Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
                {(['verdict', 'mitre', 'iocs', 'processes'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDrawerTab(tab)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                      drawerTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'mitre' ? 'MITRE ATT&CK' : tab === 'iocs' ? 'Behavioral IOCs' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Body Content */}
            <div className="p-6 flex-1 space-y-6">
              {drawerLoading ? (
                <div className="py-20 text-center text-slate-400 font-medium">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                  Loading behavioral graph...
                </div>
              ) : !inspectEvent ? (
                <div className="text-center text-slate-400 py-10">Record details unavailable.</div>
              ) : (
                <>
                  {drawerTab === 'verdict' && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detonation Summary</span>
                        <div className="mt-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-medium">
                          {inspectEvent.reason}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Detonation Engine</span>
                          <p className="font-semibold text-slate-800 mt-0.5">{inspectEvent.source || 'Monitorix Native Detonation Sandbox'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Origin Host</span>
                          <p className="font-semibold text-slate-800 mt-0.5">{inspectEvent.agentId}</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cryptographic SHA-256</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(inspectEvent.hash);
                              toast.success('SHA-256 copied to clipboard');
                            }}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Copy size={12} /> Copy
                          </button>
                        </div>
                        <div className="mt-1.5 p-2.5 bg-slate-100 rounded-xl font-mono text-xs text-slate-700 break-all border border-slate-200 select-all">
                          {inspectEvent.hash}
                        </div>
                      </div>
                    </div>
                  )}

                  {drawerTab === 'mitre' && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Correlated MITRE ATT&CK Matrix</span>
                      {inspectEvent.mitre_tactics && inspectEvent.mitre_tactics.length > 0 ? (
                        <div className="space-y-2">
                          {inspectEvent.mitre_tactics.map((tac, idx) => (
                            <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md font-mono text-xs font-bold">
                                  {tac.split(' ')[0]}
                                </span>
                                <span className="text-xs font-semibold text-slate-800">
                                  {tac.substring(tac.indexOf(' ') + 1) || tac}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Confirmed
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 p-6 text-center border border-dashed rounded-xl">
                          No adversary MITRE techniques observed during this sample detonation.
                        </p>
                      )}
                    </div>
                  )}

                  {drawerTab === 'iocs' && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Extracted Behavioral IOCs</span>
                        {inspectEvent.behavioral_iocs && inspectEvent.behavioral_iocs.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {inspectEvent.behavioral_iocs.map((ioc, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold uppercase text-[10px] text-slate-400">{ioc.type}</span>
                                  <p className="font-mono text-slate-900 font-medium mt-0.5">{ioc.indicator}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(ioc.indicator);
                                    toast.success('Indicator copied');
                                  }}
                                  className="text-slate-400 hover:text-slate-700 p-1"
                                >
                                  <Copy size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 p-6 text-center border border-dashed rounded-xl mt-2">
                            Zero malicious external network beacons or registry persistence keys detected.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {drawerTab === 'processes' && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Process Execution Lineage</span>
                      {inspectEvent.process_tree && inspectEvent.process_tree.length > 0 ? (
                        <div className="space-y-2">
                          {inspectEvent.process_tree.map((proc, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <Terminal size={13} className="text-blue-600" />
                                  {proc.name} (PID {proc.pid})
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  proc.status === 'Blocked' || proc.status === 'Terminated'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {proc.status}
                                </span>
                              </div>
                              <p className="text-[11px] font-mono text-slate-600 break-all bg-white p-1.5 rounded border border-slate-200">
                                {proc.cmd}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 p-6 text-center border border-dashed rounded-xl">
                          Single-process execution without secondary process injection or child branching.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Monitorix Detonation Sandbox Engine</span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl transition-colors shadow-sm"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
