import { useState, useEffect } from 'react';
import { CredentialModal } from '../components/Agentless/CredentialModal';
import { EndpointConfigModal } from '../components/Agentless/EndpointConfigModal';
import { AgentlessTerminalModal } from '../components/Agentless/AgentlessTerminalModal';
import { AgentlessMetricsModal } from '../components/Agentless/AgentlessMetricsModal';
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

  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`${API_URL}/v2/agentless/endpoints`, {
          headers: { 'Authorization': `Bearer ${token}` }
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
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
        path: "/socket.io",
        transports: ['websocket'],
        auth: { token }
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
  }, [token]);

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
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/agentless/manual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
    <div className="p-6 bg-slate-50 dark:bg-[#0a0f16] min-h-screen text-slate-800 dark:text-gray-300 font-mono transition-colors">
      <div className="flex justify-between items-center mb-6 border-b border-emerald-300 dark:border-emerald-900 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-widest">Agentless Control Matrix</h1>
          <p className="text-xs text-slate-500 mt-1">Remote telemetry pulling, enforcement, and sensor orchestration.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowCreds(true)}
            className="px-4 py-2 border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition rounded shadow-[0_0_10px_rgba(16,185,129,0.1)] dark:shadow-[0_0_10px_rgba(16,185,129,0.2)] bg-white dark:bg-transparent"
          >
            [ VAULT CREDENTIALS ]
          </button>
        </div>
        {/* Top Bar: Subnet Scan & Manual Add */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-4 mb-6 flex flex-wrap gap-4 items-end shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">TARGET_SUBNET</label>
          <input 
            type="text" 
            value={subnet}
            onChange={e => setSubnet(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-emerald-700 dark:text-emerald-500 font-mono text-sm p-2 outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <button 
          onClick={handleScan}
          disabled={scanning}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white dark:text-slate-950 font-bold text-sm disabled:opacity-50"
        >
          {scanning ? 'SCANNING...' : 'INITIATE_SWEEP'}
        </button>
        
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2 self-center"></div>
        
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
        >
          {isAdding ? 'CANCEL_MANUAL' : 'MANUAL_INJECT'}
        </button>
      </div>

      {isAdding && (
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-blue-200 dark:border-blue-900/50 rounded p-4 mb-6 flex flex-wrap gap-4 items-end animate-fade-in shadow-sm">
              <div>
                  <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">STATIC_IP_ADDRESS</label>
                  <input 
                    type="text" 
                    value={manualIp}
                    onChange={e => setManualIp(e.target.value)}
                    placeholder="10.0.0.50"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-blue-700 dark:text-blue-400 font-mono text-sm p-2 outline-none focus:border-blue-500"
                  />
              </div>
              <div>
                  <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">OPERATING_SYSTEM</label>
                  <select 
                      value={manualOs} 
                      onChange={e => setManualOs(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-sm p-2 outline-none focus:border-blue-500"
                  >
                      <option value="linux">Linux / Unix</option>
                      <option value="windows">Windows</option>
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">USERNAME</label>
                  <input 
                    type="text" 
                    value={manualUsername}
                    onChange={e => setManualUsername(e.target.value)}
                    placeholder="root"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-sm p-2 outline-none focus:border-blue-500"
                  />
              </div>
              <div>
                  <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">PASSWORD (VAULTED)</label>
                  <input 
                    type="password" 
                    value={manualPassword}
                    onChange={e => setManualPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-sm p-2 outline-none focus:border-blue-500"
                  />
              </div>
              <button 
                onClick={handleManualAdd}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
              >
                BIND_ENDPOINT
              </button>
          </div>
      )}
      </div>

      <div className="bg-white dark:bg-black border border-slate-200 dark:border-gray-800 rounded overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-[#0f1722] text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-gray-800">
            <tr>
              <th className="p-4 font-normal tracking-widest">TARGET_IP</th>
              <th className="p-4 font-normal tracking-widest">HOSTNAME</th>
              <th className="p-4 font-normal tracking-widest">OS_TYPE</th>
              <th className="p-4 font-normal tracking-widest">CPU / RAM</th>
              <th className="p-4 font-normal tracking-widest">STATUS</th>
              <th className="p-4 font-normal tracking-widest text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {endpoints.map((ep, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#0f1722] transition group">
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">{ep.ip}</td>
                <td className="p-4 text-slate-800 dark:text-gray-300">{ep.hostname}</td>
                <td className="p-4 text-slate-500 dark:text-gray-500">{ep.os}</td>
                <td className="p-4 text-blue-500 font-mono text-sm">
                  {ep.cpu_percent !== undefined ? `${ep.cpu_percent.toFixed(1)}%` : '--'} / {ep.mem_percent !== undefined ? `${ep.mem_percent.toFixed(1)}%` : '--'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded font-bold ${ep.status.includes('Active') ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800'}`}>
                    {ep.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2 transition">
                  <button 
                    onClick={() => triggerPoll(ep.ip, ep.os)}
                    className="px-3 py-1 bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300 text-xs hover:bg-slate-300 dark:hover:bg-gray-700 border border-slate-300 dark:border-gray-600 transition"
                  >
                    POLL_NOW
                  </button>
                  <button 
                    onClick={() => { setConfigIp(ep.ip); setOsType(ep.os); }}
                    className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs hover:bg-emerald-200 dark:hover:bg-emerald-800 border border-emerald-300 dark:border-emerald-700 transition"
                  >
                    DEPLOY_SENSORS
                  </button>
                  <button 
                    onClick={() => {
                      const newId = crypto.randomUUID();
                      setActiveTerminals(prev => [...prev, { id: newId, ip: ep.ip }]);
                    }}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs hover:bg-blue-200 dark:hover:bg-blue-800 border border-blue-300 dark:border-blue-700 transition"
                  >
                    REMOTE_SHELL
                  </button>
                </td>
              </tr>
            ))}
            {endpoints.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-gray-600">No targets discovered. Initiate a subnet sweep.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
