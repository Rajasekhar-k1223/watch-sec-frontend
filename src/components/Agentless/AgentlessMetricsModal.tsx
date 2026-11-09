import { useState, useEffect } from 'react';
import { X, Activity, Server, Clock, RefreshCw, Cpu, List, FileKey, ShieldAlert, TerminalSquare, Users, Shield } from 'lucide-react';
import { agentlessApi } from '../../services/agentless_api';
import { SOCKET_URL } from '../../config';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';

interface Process {
  pid: number;
  name: string;
  cpu: number;
  mem?: number;
}

interface AgentlessMetricsModalProps {
  data: {
    ip: string;
    os: string;
    status: string;
    timestamp: string;
    processes: Process[];
    cpu_percent?: number;
    mem_percent?: number;
    services?: string[];
    fim_files?: string[];
    auth_logs?: string[];
    group_policies?: string[];
    firewall_rules?: string[];
  };
  onClose: () => void;
}

export function AgentlessMetricsModal({ data: initialData, onClose }: AgentlessMetricsModalProps) {
  const [data, setData] = useState(initialData);
  const [isPolling, setIsPolling] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'services' | 'fim' | 'events' | 'policies' | 'firewall'>('metrics');
  const { token } = useAuth();
  const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');

  useEffect(() => {
    const fetchInitial = async () => {
      setIsPolling(true);
      try {
        const res: any = await agentlessApi.pollEndpoint(data.ip, data.os, 'vault-default');
        setData({ ...res, ip: data.ip });
      } catch (e) {
        console.error('Failed to poll:', e);
      }
      setIsPolling(false);
    };
    fetchInitial();

    const socket = io(SOCKET_URL, {
        path: "/socket.io",
        transports: ['websocket'],
        auth: { token: authToken }
    });

    socket.on('AgentlessTelemetry', (incomingData) => {
        if (incomingData.ip === data.ip) {
            setIsPolling(true);
            setData(incomingData);
            setTimeout(() => setIsPolling(false), 1000);
        }
    });

    return () => {
        socket.disconnect();
    };
  }, [data.ip, data.os, authToken]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl text-slate-900 font-bold tracking-tight">Endpoint Telemetry</h2>
                {isPolling && <RefreshCw size={16} className="text-emerald-600 animate-spin" />}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Live Agentless Endpoint Metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white text-slate-800">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col shadow-sm">
              <span className="text-xs text-slate-500 font-mono mb-1 uppercase tracking-wider flex items-center gap-2"><Server size={12}/> Target IP</span>
              <span className="text-lg text-blue-600 font-bold font-mono">{data.ip}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col shadow-sm">
              <span className="text-xs text-slate-500 font-mono mb-1 uppercase tracking-wider flex items-center gap-2"><Cpu size={12}/> CPU / RAM</span>
              <span className="text-lg text-emerald-600 font-bold font-mono">
                {data.cpu_percent !== undefined ? `${data.cpu_percent.toFixed(1)}%` : '---'} / {data.mem_percent !== undefined ? `${data.mem_percent.toFixed(1)}%` : '---'}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col shadow-sm">
              <span className="text-xs text-slate-500 font-mono mb-1 uppercase tracking-wider flex items-center gap-2"><Server size={12}/> OS</span>
              <span className="text-lg text-slate-900 font-bold">{data.os}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col shadow-sm">
              <span className="text-xs text-slate-500 font-mono mb-1 uppercase tracking-wider flex items-center gap-2"><Clock size={12}/> Timestamp</span>
              <span className="text-xs text-slate-600 font-mono mt-1">{new Date(data.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-2 mb-4 border-b border-slate-200 pb-2 overflow-x-auto">
            <button
                onClick={() => setActiveTab('metrics')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${activeTab === 'metrics' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
                <Activity size={14} /> Processes
            </button>
            <button
                onClick={() => setActiveTab('services')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${activeTab === 'services' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
                <List size={14} /> Services
            </button>
            <button
                onClick={() => setActiveTab('fim')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${activeTab === 'fim' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
                <FileKey size={14} /> FIM (Modified)
            </button>
            <button
                onClick={() => setActiveTab('events')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${activeTab === 'events' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
                <TerminalSquare size={14} /> Events/Logs
            </button>
            <button
                onClick={() => setActiveTab('policies')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${activeTab === 'policies' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
                <Users size={14} /> Group Policies
            </button>
            <button
                onClick={() => setActiveTab('firewall')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${activeTab === 'firewall' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
                <Shield size={14} /> Firewall
            </button>
          </div>

          {activeTab === 'metrics' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Top Resource Consumers (Top 10)</h3>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200 font-mono font-semibold">
                        {data.processes.length} Processes
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-mono">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs font-semibold">
                            <tr>
                                <th className="p-3.5">PID</th>
                                <th className="p-3.5">Process Name</th>
                                <th className="p-3.5 text-right">CPU %</th>
                                {data.os.toLowerCase() === 'linux' && <th className="p-3.5 text-right">MEM %</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                            {data.processes.map((proc, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-3.5 text-emerald-700 font-bold">{proc.pid}</td>
                                    <td className="p-3.5 text-slate-900 font-medium">{proc.name}</td>
                                    <td className="p-3.5 text-right text-amber-700 font-semibold">{proc.cpu}%</td>
                                    {data.os.toLowerCase() === 'linux' && (
                                        <td className="p-3.5 text-right text-blue-700 font-semibold">{proc.mem}%</td>
                                    )}
                                </tr>
                            ))}
                            {data.processes.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">No process data available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <List size={16} className="text-blue-600" /> Running System Services
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {data.services?.map((svc, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-700 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            {svc}
                        </div>
                    ))}
                    {(!data.services || data.services.length === 0) && (
                        <div className="text-slate-500 italic p-4 text-xs">No services data available yet.</div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'fim' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4 bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-800 text-xs font-medium">
                    <ShieldAlert size={16} /> 
                    <span>Tracking files modified in the last 60 minutes in sensitive directories.</span>
                </div>
                <div className="space-y-2">
                    {data.fim_files?.map((file, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700 break-all">
                            {file}
                        </div>
                    ))}
                    {(!data.fim_files || data.fim_files.length === 0) && (
                        <div className="text-emerald-700 italic p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-center text-xs">
                            No sensitive files modified recently. All clear.
                        </div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4 bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-800 text-xs font-medium">
                    <TerminalSquare size={16} /> 
                    <span>Recent Security Events & Auth Logs</span>
                </div>
                <div className="space-y-2">
                    {data.auth_logs?.map((log, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700 break-all">
                            <span className="text-blue-600 font-bold mr-2">&gt;</span> {log}
                        </div>
                    ))}
                    {(!data.auth_logs || data.auth_logs.length === 0) && (
                        <div className="text-slate-500 italic p-4 text-center text-xs">No logs available.</div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4 bg-purple-50 border border-purple-200 p-3 rounded-lg text-purple-800 text-xs font-medium">
                    <Users size={16} /> 
                    <span>Group Policies & Sudoers Configurations</span>
                </div>
                <div className="space-y-2">
                    {data.group_policies?.map((pol, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700">
                            {pol}
                        </div>
                    ))}
                    {(!data.group_policies || data.group_policies.length === 0) && (
                        <div className="text-slate-500 italic p-4 text-center text-xs">No group policies available.</div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'firewall' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4 bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-800 text-xs font-medium">
                    <Shield size={16} /> 
                    <span>Active Firewall Rules / iptables</span>
                </div>
                <div className="space-y-2">
                    {data.firewall_rules?.map((rule, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700">
                            {rule}
                        </div>
                    ))}
                    {(!data.firewall_rules || data.firewall_rules.length === 0) && (
                        <div className="text-slate-500 italic p-4 text-center text-xs">No active firewall rules detected.</div>
                    )}
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
