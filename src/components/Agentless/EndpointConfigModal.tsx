import { useState } from 'react';
import { agentlessApi } from '../../services/agentless_api';

interface EndpointConfigModalProps {
  ip: string;
  osType: string;
  onClose: () => void;
}

export const EndpointConfigModal: React.FC<EndpointConfigModalProps> = ({ ip, osType, onClose }) => {
  const [deploying, setDeploying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const handleDeploy = async () => {
    setDeploying(true);
    setLogs(prev => [...prev, `[INFO] Connecting to ${ip}...`]);
    try {
      const res = await agentlessApi.deployNativeSensors(ip, osType);
      setLogs(prev => [...prev, `[SUCCESS] Bootstrap complete. Response: ${JSON.stringify(res)}`]);
    } catch (e: any) {
      setLogs(prev => [...prev, `[ERROR] Deployment failed: ${e.message}`]);
    }
    setDeploying(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-emerald-500/30 p-6 rounded-lg w-full max-w-2xl shadow-2xl shadow-emerald-900/20 flex flex-col h-[60vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-emerald-400 font-mono">Endpoint Configuration: {ip}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        
        <div className="mb-4 text-sm text-gray-300 font-mono">
          <p>This wizard will remotely bootstrap native OS sensors without installing the Monitorix Agent.</p>
          <ul className="list-disc ml-5 mt-2 text-emerald-500/80">
            {osType === 'windows' && <li>Microsoft Sysmon (Kernel ETW hooks)</li>}
            {osType === 'windows' && <li>Windows Event Forwarding (WEF) Cache</li>}
            {osType === 'linux' && <li>Linux auditd (Syscall monitoring)</li>}
            {osType === 'linux' && <li>rsyslog Streaming (Zero Data Loss cache)</li>}
          </ul>
        </div>
        
        <div className="flex-1 bg-black rounded border border-gray-800 p-4 font-mono text-xs overflow-y-auto mb-4">
          {logs.map((log, i) => (
            <div key={i} className={log.includes('[ERROR]') ? 'text-red-400' : 'text-emerald-400'}>
              {log}
            </div>
          ))}
          {!logs.length && <div className="text-gray-600">Waiting to initialize deployment sequence...</div>}
        </div>
        
        <div className="flex justify-end space-x-3 mt-auto">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded font-mono hover:bg-gray-700 transition"
          >
            Close
          </button>
          <button 
            onClick={handleDeploy}
            disabled={deploying}
            className="px-4 py-2 bg-emerald-600 text-black font-bold rounded font-mono hover:bg-emerald-500 transition shadow-[0_0_15px_rgba(16,185,129,0.5)] disabled:opacity-50"
          >
            {deploying ? 'Deploying...' : 'INITIALIZE DEPLOYMENT'}
          </button>
        </div>
      </div>
    </div>
  );
};
