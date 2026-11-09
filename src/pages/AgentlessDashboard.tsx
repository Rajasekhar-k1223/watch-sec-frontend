import { useState, useEffect } from 'react';
import { CredentialModal } from '../components/Agentless/CredentialModal';
import { EndpointConfigModal } from '../components/Agentless/EndpointConfigModal';
import { AgentlessTerminalModal } from '../components/Agentless/AgentlessTerminalModal';
import { AgentlessMetricsModal } from '../components/Agentless/AgentlessMetricsModal';
import { CspmPanel } from '../components/Agentless/CspmPanel';
import { agentlessApi } from '../services/agentless_api';
import { API_URL, SOCKET_URL } from '../config';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

export default function AgentlessDashboard() {
  const [showCreds, setShowCreds] = useState(false);
  const [configIp, setConfigIp] = useState<string | null>(null);
  const [osType, setOsType] = useState<string>('linux');
  const [activeTerminals, setActiveTerminals] = useState<{id: string, ip: string}[]>([]);
  const [metricsData, setMetricsData] = useState<any>(null);
  const { token } = useAuth();
  
  const [scanning, setScanning] = useState(false);
  const [subnet, setSubnet] = useState('192.168.1.0/24');
  
  const [isAdding, setIsAdding] = useState(false);
  const [manualIp, setManualIp] = useState('');
  const [manualOs, setManualOs] = useState('linux');
  const [manualUsername, setManualUsername] = useState('root');
  const [manualPassword, setManualPassword] = useState('');
  
  const [endpoints, setEndpoints] = useState<any[]>([]);

  const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');

  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        const res = await fetch(`${API_URL}/v2/agentless/endpoints`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEndpoints(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchEndpoints();
  }, [authToken]);

  useEffect(() => {
    if (!authToken) return;
    const socket = io(SOCKET_URL, {
        path: "/socket.io",
        transports: ['websocket'],
        auth: { token: authToken }
    });

    socket.on('AgentlessTelemetry', (incomingData) => {
        setEndpoints(prev => prev.map(ep => {
            if (ep.ip === incomingData.ip) {
                return {
                    ...ep,
                    cpu_percent: incomingData.cpu_percent,
                    mem_percent: incomingData.mem_percent,
                    status: 'Active (Live)'
                };
            }
            return ep;
        }));
    });

    return () => {
        socket.disconnect();
    };
  }, [authToken]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res: any = await agentlessApi.scanSubnet(subnet);
      if (res.found_devices) {
         setEndpoints(prev => [...prev, ...res.found_devices.map((d: any) => ({...d, status: 'Discovered', logs: []}))]);
      }
    } catch (e) {
      console.error(e);
    }
    setScanning(false);
  };

  const handleManualAdd = async () => {
    if (!manualIp) return;
    try {
      const res = await fetch(`${API_URL}/v2/agentless/manual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
          body: JSON.stringify({ 
              ip: manualIp, 
              os_type: manualOs,
              username: manualUsername,
              password: manualPassword
          })
      });
      if (res.ok) {
          setEndpoints(prev => [...prev, { ip: manualIp, os: manualOs, hostname: `Manual-${manualIp}`, status: 'Added', logs: []}]);
          setManualIp('');
          setManualPassword('');
          setIsAdding(false);
      } else {
          const err = await res.json();
          alert(`Failed to add: ${err.detail}`);
      }
    } catch (e) {
        console.error(e);
    }
  };

  const triggerPoll = async (ip: string, os: string) => {
    try {
      const res: any = await agentlessApi.pollEndpoint(ip, os, 'vault-default');
      setMetricsData({ ...res, ip });
    } catch (e: any) {
      alert(`Poll failed: ${e.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/90 shadow-sm p-6 rounded-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
            <span className="font-mono text-sm font-black">SSH</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agentless Control Matrix</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Remote telemetry pulling, enforcement, and sensor orchestration across agentless nodes
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowCreds(true)}
            className="px-4 py-2 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition rounded-xl font-bold text-xs shadow-2xs"
          >
            Vault Credentials
          </button>
        </div>
      </div>
      {/* Top Bar: Subnet Scan & Manual Add */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Target Subnet</label>
          <input 
            type="text" 
            value={subnet}
            onChange={e => setSubnet(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs p-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          />
        </div>
        <button 
          onClick={handleScan}
          disabled={scanning}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          {scanning ? 'Scanning Subnet...' : 'Initiate Sweep'}
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2 self-center hidden sm:block"></div>
        
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          {isAdding ? 'Cancel Manual' : 'Manual Inject'}
        </button>
      </div>

      {isAdding && (
          <div className="bg-slate-50 border border-blue-200 rounded-2xl p-5 flex flex-wrap gap-4 items-end animate-fade-in shadow-sm">
              <div className="min-w-[160px]">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Static IP Address</label>
                  <input 
                    type="text" 
                    value={manualIp}
                    onChange={e => setManualIp(e.target.value)}
                    placeholder="10.0.0.50"
                    className="w-full bg-white border border-slate-300 text-blue-700 font-mono text-xs p-2.5 rounded-xl outline-none focus:border-blue-500"
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Operating System</label>
                  <select 
                      value={manualOs} 
                      onChange={e => setManualOs(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-700 font-mono text-xs p-2.5 rounded-xl outline-none focus:border-blue-500"
                  >
                      <option value="linux">Linux / Unix</option>
                      <option value="windows">Windows</option>
                  </select>
              </div>
              <div className="min-w-[140px]">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Username</label>
                  <input 
                    type="text" 
                    value={manualUsername}
                    onChange={e => setManualUsername(e.target.value)}
                    placeholder="root"
                    className="w-full bg-white border border-slate-300 text-slate-700 font-mono text-xs p-2.5 rounded-xl outline-none focus:border-blue-500"
                  />
              </div>
              <div className="min-w-[140px]">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
                  <input 
                    type="password" 
                    value={manualPassword}
                    onChange={e => setManualPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-300 text-slate-700 font-mono text-xs p-2.5 rounded-xl outline-none focus:border-blue-500"
                  />
              </div>
              <button 
                onClick={handleManualAdd}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Bind Endpoint
              </button>
          </div>
      )}

      {/* Discovered Endpoints Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-4">Target IP</th>
              <th className="p-4">Hostname</th>
              <th className="p-4">OS Type</th>
              <th className="p-4">CPU / RAM</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {endpoints.map((ep, i) => (
              <tr key={i} className="hover:bg-slate-50/60 transition group">
                <td className="p-4 text-emerald-600 font-mono font-bold">{ep.ip}</td>
                <td className="p-4 font-semibold text-slate-900">{ep.hostname}</td>
                <td className="p-4 text-slate-500">{ep.os}</td>
                <td className="p-4 text-blue-600 font-mono">
                  {ep.cpu_percent !== undefined ? `${ep.cpu_percent.toFixed(1)}%` : '--'} / {ep.mem_percent !== undefined ? `${ep.mem_percent.toFixed(1)}%` : '--'}
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 text-[10px] rounded-md font-bold uppercase tracking-wider ${ep.status.includes('Active') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {ep.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button 
                    onClick={() => triggerPoll(ep.ip, ep.os)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 border border-slate-300/80 transition"
                  >
                    Poll Telemetry
                  </button>
                  <button 
                    onClick={() => { setConfigIp(ep.ip); setOsType(ep.os); }}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 border border-emerald-200 transition"
                  >
                    Deploy Sensors
                  </button>
                  <button 
                    onClick={() => {
                      const newId = crypto.randomUUID();
                      setActiveTerminals(prev => [...prev, { id: newId, ip: ep.ip }]);
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 border border-blue-200 transition"
                  >
                    Remote Shell
                  </button>
                </td>
              </tr>
            ))}
            {endpoints.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">No agentless targets discovered. Initiate a subnet sweep above.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <CspmPanel />

      {showCreds && <CredentialModal onClose={() => setShowCreds(false)} />}
      {configIp && <EndpointConfigModal ip={configIp} osType={osType} onClose={() => setConfigIp(null)} />}
      {metricsData && <AgentlessMetricsModal data={metricsData} onClose={() => setMetricsData(null)} />}
      
      {/* Active Terminals Layer */}
      {activeTerminals.map((term, index) => (
        <AgentlessTerminalModal 
          key={term.id} 
          terminalId={term.id}
          endpointIp={term.ip} 
          onClose={() => setActiveTerminals(prev => prev.filter(t => t.id !== term.id))}
          onFocus={() => setActiveTerminals(prev => {
            const others = prev.filter(t => t.id !== term.id);
            return [...others, term];
          })}
          offsetIndex={index}
        />
      ))}
    </div>
  );
}
