import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Activity, Server, AlertTriangle } from 'lucide-react';

export default function RansomwareDashboard() {
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    // Mocking response from /api/v2/ransomware/incidents
    setIncidents([
      {
        id: 1,
        agent_id: "WIN-SRV-FINANCE",
        process_id: 4092,
        heuristic: "MassFileRename",
        timestamp: "2026-06-07T13:42:15Z",
        mitigations: [
          { action: "ProcessKilled", success: true },
          { action: "HostQuarantined", success: true }
        ]
      },
      {
        id: 2,
        agent_id: "WIN-DESK-CEO",
        process_id: 1044,
        heuristic: "VssadminDeletion",
        timestamp: "2026-06-07T10:15:00Z",
        mitigations: [
          { action: "ProcessKilled", success: true }
        ]
      }
    ]);
  }, []);

  return (
    <div className="p-6 space-y-6 bg-[#0a0a0a] min-h-screen text-white">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Ransomware Shield</h1>
            <p className="text-gray-400">Autonomous Outbreak Defense & Orchestration</p>
          </div>
        </div>
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center space-x-2 bg-[#1a1a1a] px-4 py-2 rounded border border-gray-800">
            <Activity className="w-4 h-4 text-[#00ff8e]" />
            <span>Engine Status: <strong className="text-[#00ff8e]">Active</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] border-gray-800">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-semibold">Active Incidents (24h)</p>
              <p className="text-4xl font-bold text-red-500 mt-2">2</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-500 opacity-20" />
          </div>
        </div>
        
        <div className="bg-[#1a1a1a] border-gray-800">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-semibold">Autonomous Mitigations</p>
              <p className="text-4xl font-bold text-[#00ff8e] mt-2">3</p>
            </div>
            <Shield className="w-10 h-10 text-[#00ff8e] opacity-20" />
          </div>
        </div>
        
        <div className="bg-[#1a1a1a] border-gray-800">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-semibold">Protected Endpoints</p>
              <p className="text-4xl font-bold text-blue-400 mt-2">1,402</p>
            </div>
            <Server className="w-10 h-10 text-blue-400 opacity-20" />
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border-gray-800">
        <div className="border-b border-gray-800 pb-3">
          <h3 className="text-lg font-bold">Recent Outbreak Activity & Mitigations</h3>
        </div>
        <div className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-[#0a0a0a]">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4">Heuristic Trigger</th>
                <th className="px-6 py-4">Process ID</th>
                <th className="px-6 py-4">Actions Taken</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id} className="border-b border-gray-800 hover:bg-[#2a2a2a]">
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">{new Date(inc.timestamp).toLocaleTimeString()}</td>
                  <td className="px-6 py-4 font-bold text-white">{inc.agent_id}</td>
                  <td className="px-6 py-4">
                    <span className="bg-red-500 bg-opacity-20 text-red-400 px-2 py-1 rounded text-xs font-bold border border-red-500">
                      {inc.heuristic}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-400">{inc.process_id}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {inc.mitigations.map((m: any, idx: number) => (
                        <span key={idx} className="bg-[#00ff8e] bg-opacity-20 text-[#00ff8e] px-2 py-1 rounded text-xs border border-[#00ff8e]">
                          {m.action}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
