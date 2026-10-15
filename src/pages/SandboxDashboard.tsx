import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, FileSearch, Download } from 'lucide-react';

interface SandboxEvent {
  id: string;
  filename: string;
  status: 'SAFE' | 'MALICIOUS' | 'ANALYZING';
  hash: string;
  reason: string;
  timestamp: string;
  agentId: string;
}

export default function SandboxDashboard() {
  const [events, setEvents] = useState<SandboxEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/sandbox/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (err) {
        console.error('Failed to fetch sandbox history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileSearch className="text-blue-400" size={32} />
        <h1 className="text-3xl font-bold text-white tracking-tight">RedRainbow Sandbox</h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-800/50 text-gray-400 text-sm">
              <tr>
                <th className="p-4 font-medium">Timestamp</th>
                <th className="p-4 font-medium">Agent</th>
                <th className="p-4 font-medium">Filename</th>
                <th className="p-4 font-medium">Verdict</th>
                <th className="p-4 font-medium">Reason</th>
                <th className="p-4 font-medium">SHA-256</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
              {loading ? (
                <tr><td colSpan={6} className="p-4 text-center">Loading sandbox history...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-gray-500">No sandbox analysis events recorded.</td></tr>
              ) : (
                events.map(ev => (
                  <tr key={ev.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 whitespace-nowrap text-gray-400">
                      {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(ev.timestamp))}
                    </td>
                    <td className="p-4 font-medium text-white">{ev.agentId}</td>
                    <td className="p-4 font-mono">{ev.filename}</td>
                    <td className="p-4">
                      {ev.status === 'SAFE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-semibold uppercase tracking-wider border border-green-500/20">
                          <ShieldCheck size={14} /> Safe
                        </span>
                      ) : ev.status === 'MALICIOUS' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-semibold uppercase tracking-wider border border-red-500/20">
                          <ShieldAlert size={14} /> Malicious
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-500/10 text-yellow-400 text-xs font-semibold uppercase tracking-wider border border-yellow-500/20">
                          <Download size={14} className="animate-bounce" /> Analyzing
                        </span>
                      )}
                    </td>
                    <td className="p-4 max-w-[200px] truncate" title={ev.reason}>{ev.reason}</td>
                    <td className="p-4 font-mono text-xs text-gray-500 max-w-[200px] truncate" title={ev.hash}>
                      {ev.hash}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
