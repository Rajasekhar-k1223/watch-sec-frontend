
import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import { API_URL } from '../config';

interface Props {
    agentId: string | null;
    apiUrl: string;
    token: string | null;
}

const normalizeTimestamp = (ts: any) => {
    if (!ts) return new Date().toISOString();
    let str = String(ts).trim();
    if (str.includes(' ') && !str.includes('T')) str = str.replace(' ', 'T');
    const hasTimezone = str.endsWith('Z') || /[+-]\d{2}(:?\d{2})?$/.test(str);
    if (!hasTimezone) str += 'Z';
    return str;
};

export default function ActivityLogViewer({ agentId, apiUrl, token }: Props) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { logout } = useAuth();

    const fetchLogs = useCallback(() => {
        if (!agentId) return;
        setLoading(true);
        fetch(`${apiUrl}/api/events/activity/${agentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (res.status === 401) { logout(); return []; }
                return res.json();
            })
            .then(data => { if (Array.isArray(data)) setLogs(data); })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [agentId, logout, apiUrl, token]);

    useEffect(() => {
        fetchLogs();
        // Optional: Auto-refresh every 30s
        const interval = setInterval(fetchLogs, 30000);
        return () => clearInterval(interval);
    }, [fetchLogs]);

    // Real-time updates via Socket.IO
    useEffect(() => {
        if (!agentId) return;
        const socket = io(API_URL); // Use API_URL from config

        socket.on('connect', () => {
            console.log("ActivityViewer Connected to Socket");
        });

        socket.on('new_client_activity', (data: any) => {
            if (data.AgentId === agentId) {
                setLogs(prev => [data, ...prev]);
            }
        });

        return () => {
            socket.off('new_client_activity');
            socket.disconnect();
        };
    }, [agentId]);

    const handleDownloadReport = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/export/activity/${agentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ActivityReport_${agentId}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error("Download failed", e);
            alert("Failed to download report");
        }
    };

    const formatDuration = (seconds: number) => {
        const d = Number(seconds || 0);
        if (d < 60) return `${d.toFixed(1)}s`;
        const m = Math.floor(d / 60);
        const s = Math.floor(d % 60);
        return `${m}m ${s}s`;
    };

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                <h4 className="text-sm font-bold text-gray-300">Activity History</h4>
                <div className="flex gap-2">
                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
                        title="Refresh Logs"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                const res = await fetch(`${apiUrl}/api/events/simulate/${agentId}`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) {
                                    alert("Event Simulated! Check Events tab.");
                                    fetchLogs(); // Refresh after simulation
                                }
                            } catch (e) { console.error(e); }
                        }}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded"
                    >
                        Simulate Event
                    </button>
                    <button
                        onClick={handleDownloadReport}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded flex items-center gap-2"
                    >
                        <Download className="w-3 h-3" /> Export CSV
                    </button>
                </div>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs sticky top-0">
                    <tr><th className="p-4">Timestamp</th><th className="p-4">Type</th><th className="p-4">Details</th><th className="p-4">Risk</th><th className="p-4">Duration</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-gray-300 font-mono">
                    {logs.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">No activity recorded.</td></tr>
                    ) : (
                        logs.map((log, i) => (
                            <tr key={i} className="hover:bg-gray-700/30">
                                <td className="p-4 text-gray-500">{new Date(normalizeTimestamp(log.timestamp || log.Timestamp)).toLocaleString()}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs ${(log.activityType || log.ActivityType) === 'Web' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                        {log.activityType || log.ActivityType}
                                    </span>
                                </td>
                                <td className="p-4 break-all">
                                    {(log.activityType || log.ActivityType) === 'Web' ? (
                                        <a href={log.url || log.Url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{log.url || log.Url}</a>
                                    ) : (<span>{log.processName || log.ProcessName} - {log.windowTitle || log.WindowTitle}</span>)}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${(log.riskLevel === 'High' || log.RiskLevel === 'High') ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                        {log.riskLevel || log.RiskLevel || 'Normal'}
                                    </span>
                                </td>
                                <td className="p-4">{formatDuration(log.durationSeconds || log.DurationSeconds)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
