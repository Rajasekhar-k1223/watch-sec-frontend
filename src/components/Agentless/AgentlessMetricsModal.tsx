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
        auth: { token }
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
  }, [data.ip, data.os, token]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative glass-card bg-slate-900 border border-blue-500/30 w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.15)]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-500/20 bg-slate-950/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Activity className="text-blue-400 w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl text-white font-bold tracking-wider">TELEMETRY_REPORT</h2>
                {isPolling && <RefreshCw size={16} className="text-emerald-400 animate-spin" />}
              </div>
              <p className="text-sm text-slate-400 font-mono mt-1">Live Endpoint Metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700/50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col">
              <span className="text-xs text-slate-500 font-mono mb-1 uppercase tracking-widest flex items-center gap-2"><Server size={12}/> TARGET_IP</span>
              <span className="text-lg text-blue-400 font-bold font-mono">{data.ip}</span>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col">
              <span className="text-xs text-slate-500 font-mono mb-1 uppercase tracking-widest flex items-center gap-2"><Cpu size={12}/> CPU / RAM</span>
              <span className="text-lg text-emerald-400 font-bold font-mono">
                {data.cpu_percent !== undefined ? `${data.cpu_percent.toFixed(1)}%` : '---'} / {data.mem_percent !== undefined ? `${data.mem_percent.toFixed(1)}%` : '---'}
              </span>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col">
              <span className="text-xs text-slate-500 font-mono mb-1 uppercase tracking-widest flex items-center gap-2"><Server size={12}/> OS</span>
              <span className="text-lg text-slate-200 font-bold">{data.os}</span>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col">
              <span className="text-xs text-slate-500 font-mono mb-1 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> TIMESTAMP</span>
              <span className="text-sm text-emerald-400 font-mono mt-1">{new Date(data.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-2 mb-4 border-b border-slate-800 pb-2">
            <button
                onClick={() => setActiveTab('metrics')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'metrics' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <Activity size={16} /> Processes
            </button>
            <button
                onClick={() => setActiveTab('services')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'services' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <List size={16} /> Services
            </button>
            <button
                onClick={() => setActiveTab('fim')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 ${activeTab === 'fim' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <FileKey size={16} /> FIM (Modified)
            </button>
            <button
                onClick={() => setActiveTab('events')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 ${activeTab === 'events' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <TerminalSquare size={16} /> Events/Logs
            </button>
            <button
                onClick={() => setActiveTab('policies')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 ${activeTab === 'policies' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <Users size={16} /> Group Policies
            </button>
            <button
                onClick={() => setActiveTab('firewall')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 ${activeTab === 'firewall' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <Shield size={16} /> Firewall
            </button>
          </div>

          {activeTab === 'metrics' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Top Resource Consumers (Top 10)</h3>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/30 font-mono">
                    {data.processes.length} Processes
                </span>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                        <th className="p-4 font-normal">PID</th>
                        <th className="p-4 font-normal">PROCESS_NAME</th>
                        <th className="p-4 font-normal text-right">CPU_%</th>
                        {data.os.toLowerCase() === 'linux' && <th className="p-4 font-normal text-right">MEM_%</th>}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                    {data.processes.map((proc, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-emerald-500">{proc.pid}</td>
                        <td className="p-4 text-slate-300">{proc.name}</td>
                        <td className="p-4 text-right text-orange-400">{proc.cpu}%</td>
                        {data.os.toLowerCase() === 'linux' && (
                            <td className="p-4 text-right text-blue-400">{proc.mem}%</td>
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
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden animate-fade-in p-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <List size={16} className="text-blue-400" /> Running System Services
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {data.services?.map((svc, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded p-2 text-sm font-mono text-slate-300 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            {svc}
                        </div>
                    ))}
                    {(!data.services || data.services.length === 0) && (
                        <div className="text-slate-500 italic p-4">No services data available yet.</div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'fim' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden animate-fade-in p-4">
                <div className="flex items-center gap-2 mb-4 bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg text-orange-400 text-sm">
                    <ShieldAlert size={16} /> 
                    <span>Tracking files modified in the last 60 minutes in sensitive directories.</span>
                </div>
                <div className="space-y-2">
                    {data.fim_files?.map((file, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded p-3 text-sm font-mono text-slate-300 break-all">
                            {file}
                        </div>
                    ))}
                    {(!data.fim_files || data.fim_files.length === 0) && (
                        <div className="text-emerald-500 italic p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-center">
                            No sensitive files modified recently. All clear.
                        </div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden animate-fade-in p-4">
                <div className="flex items-center gap-2 mb-4 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-blue-400 text-sm">
                    <TerminalSquare size={16} /> 
                    <span>Recent Security Events & Auth Logs</span>
                </div>
                <div className="space-y-2">
                    {data.auth_logs?.map((log, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded p-3 text-sm font-mono text-slate-300 break-all">
                            <span className="text-blue-500 mr-2">&gt;</span> {log}
                        </div>
                    ))}
                    {(!data.auth_logs || data.auth_logs.length === 0) && (
                        <div className="text-slate-500 italic p-4 text-center">No logs available.</div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden animate-fade-in p-4">
                <div className="flex items-center gap-2 mb-4 bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg text-purple-400 text-sm">
                    <Users size={16} /> 
                    <span>Group Policies & Sudoers Configurations</span>
                </div>
                <div className="space-y-2">
                    {data.group_policies?.map((pol, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded p-3 text-sm font-mono text-slate-300">
                            {pol}
                        </div>
                    ))}
                    {(!data.group_policies || data.group_policies.length === 0) && (
                        <div className="text-slate-500 italic p-4 text-center">No group policies available.</div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'firewall' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden animate-fade-in p-4">
                <div className="flex items-center gap-2 mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-sm">
                    <Shield size={16} /> 
                    <span>Active Firewall Rules / iptables</span>
                </div>
                <div className="space-y-2">
                    {data.firewall_rules?.map((rule, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded p-3 text-sm font-mono text-slate-300">
                            {rule}
                        </div>
                    ))}
                    {(!data.firewall_rules || data.firewall_rules.length === 0) && (
                        <div className="text-slate-500 italic p-4 text-center">No active firewall rules detected.</div>
                    )}
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
