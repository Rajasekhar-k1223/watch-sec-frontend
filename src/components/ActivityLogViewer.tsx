
import { useState, useCallback, useEffect, useMemo } from 'react';

import { RefreshCw, Download, BarChart2, Clock, Zap, Monitor, LineChart, Calendar, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

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
    const [showInsights, setShowInsights] = useState(true);
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const { user, logout } = useAuth();

    const fetchLogs = useCallback(() => {
        if (!agentId) return;
        setLoading(true);

        // [FIX] URL Encode AgentId to handle special characters like '$'
        let url = `${apiUrl}/events/activity/${encodeURIComponent(agentId)}`;
        if (startDate || endDate) {
            let start = startDate ? `${startDate}T00:00:00` : '';
            let end = endDate ? `${endDate}T23:59:59` : '';

            const params = new URLSearchParams();
            if (start) params.append('start_date', start);
            if (end) params.append('end_date', end);

            if (params.toString()) url += `?${params.toString()}`;
        }

        fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (res.status === 401) { logout(); return []; }
                return res.json();
            })
            .then(data => { if (Array.isArray(data)) setLogs(data); })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [agentId, logout, apiUrl, token, startDate, endDate]);

    useEffect(() => {
        fetchLogs();
        // Only auto-refresh if no date selected (Live Mode)
        if (!startDate && !endDate) {
            const interval = setInterval(fetchLogs, 30000);
            return () => clearInterval(interval);
        }
    }, [fetchLogs, startDate, endDate]);

    // Data Processing for Charts
    const { volumeData, topApps, timeMetrics } = useMemo(() => {
        if (!logs.length) return { volumeData: [], topApps: [], timeMetrics: { total: 0, active: 0, idle: 0 } };

        // 1. Volume Data (Group by hour/time)
        const volMap = new Map<string, number>();
        // 2. Type Data
        const typeMap = new Map<string, number>();
        // 3. App Data (Group by ProcessName)
        const appMap = new Map<string, number>();

        let totalDuration = 0;
        let totalIdle = 0;

        logs.forEach(l => {
            // Volume
            const date = new Date(normalizeTimestamp(l.timestamp || l.Timestamp));
            const key = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            volMap.set(key, (volMap.get(key) || 0) + 1);

            // Type
            const type = l.activityType || l.ActivityType || 'Other';
            typeMap.set(type, (typeMap.get(type) || 0) + 1);

            // Metrics & Apps
            const duration = Number(l.durationSeconds || l.DurationSeconds || 0);
            const idle = Number(l.idleSeconds || l.IdleSeconds || 0);
            // Ensure data sanity
            const active = Math.max(0, duration - idle);

            totalDuration += duration;
            totalIdle += idle;

            // App Usage (Active Time Only)
            if (type !== 'System' && type !== 'Web') { // Focus on apps for 'Top Apps', or include Web? Let's include non-system.
                const name = l.processName || l.ProcessName || l.windowTitle || 'Unknown';
                appMap.set(name, (appMap.get(name) || 0) + active);
            } else if (type === 'Web') {
                // aggregate web as 'Browser' or specific domain if available, for now 'Browser Activity'
                appMap.set('Web Browsing', (appMap.get('Web Browsing') || 0) + active);
            }
        });

        // Format Volume
        const volumeData = Array.from(volMap.entries())
            .map(([time, count]) => ({ time, count }))
            .reverse().slice(0, 20).reverse();

        // Format Type
        const typeData = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));

        // Format Top Apps
        const topApps = Array.from(appMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5

        const timeMetrics = {
            total: totalDuration,
            idle: totalIdle,
            active: Math.max(0, totalDuration - totalIdle)
        };

        return { volumeData, typeData, topApps, timeMetrics };
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(l =>
            (l.processName || l.ProcessName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.windowTitle || l.WindowTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.activityType || l.ActivityType || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [logs, searchTerm]);


    const APP_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

    // Real-time updates via Socket.IO
    useEffect(() => {
        if (!agentId || startDate || endDate) return; // Disable live updates if filtering history

        // [FIX] Use central SOCKET_URL and pass auth token
        const socket = io(SOCKET_URL, {
            auth: { token: token },
            query: { token: token },
            transports: ['polling', 'websocket']
        });

        socket.on('connect', () => {
            console.log("ActivityViewer Connected to Socket");
            // [DEBUG] Log user state to backend
            socket.emit("client_debug", { component: 'ActivityLogViewer', user: user, agentId: agentId });

            // Join the tenant room to receive activity updates
            if (user?.tenantId) {
                socket.emit("join_room", { room: `tenant_${user.tenantId}` });
            }
        });

        socket.on('new_client_activity', (data: any) => {
            if (data.AgentId === agentId) {
                setLogs(prev => {
                    const first = prev[0];
                    if (first &&
                        first.ProcessName === data.ProcessName &&
                        first.WindowTitle === data.WindowTitle &&
                        first.ActivityType === data.ActivityType
                    ) {
                        // User is still doing the same thing. Update duration of the TOP item.
                        // NOTE: Backend sends strict chunks (e.g. 60s).
                        // If we just replace 'first' with 'data', we only see the latest chunk (e.g. 60s).
                        // We want TOTAL TIME.
                        // So we add the new duration to the existing accumulated duration.

                        const newDuration = (Number(first.DurationSeconds) || 0) + (Number(data.DurationSeconds) || 0);
                        const newIdle = (Number(first.IdleSeconds) || 0) + (Number(data.IdleSeconds) || 0);

                        // Create updated item
                        const updatedItem = { ...first, DurationSeconds: newDuration, IdleSeconds: newIdle };

                        // Return new array with updated first item
                        return [updatedItem, ...prev.slice(1)];
                    } else {
                        // Different activity, prepend as new
                        return [data, ...prev];
                    }
                });
            }
        });

        return () => {
            socket.off('new_client_activity');
            socket.disconnect();
        };
    }, [agentId, startDate, endDate, user, token, SOCKET_URL]);

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

    const setQuickFilter = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);

        // Format to YYYY-MM-DD for the <input type="date">
        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Activity History</h4>
                    {startDate && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase">
                            Showing: {startDate.split('-').reverse().join('-')} to {endDate.split('-').reverse().join('-')}
                        </span>
                    )}
                </div>
                <div className="flex gap-2 items-center">
                    <div className="flex items-center gap-2 mr-4">
                        <button
                            onClick={fetchLogs}
                            disabled={loading}
                            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50 rounded transition-colors"
                            title="Refresh Logs"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setShowInsights(!showInsights)}
                            className={`p-1 rounded transition-colors ${showInsights ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-400/10' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}
                            title={showInsights ? "Hide Insights" : "Show Insights"}
                        >
                            <LineChart className="w-4 h-4" />
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

                    <div className="flex bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-1 items-center gap-1 shadow-inner">
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded p-0.5 mr-1">
                            <button
                                onClick={() => setQuickFilter(1)}
                                className="px-2 py-0.5 text-[10px] font-bold hover:bg-white dark:hover:bg-gray-700 rounded transition-all text-gray-600 dark:text-gray-400"
                            >
                                24H
                            </button>
                            <button
                                onClick={() => setQuickFilter(7)}
                                className="px-2 py-0.5 text-[10px] font-bold hover:bg-white dark:hover:bg-gray-700 rounded transition-all text-gray-600 dark:text-gray-400 border-l border-gray-300 dark:border-gray-700"
                            >
                                7D
                            </button>
                            <button
                                onClick={() => setQuickFilter(30)}
                                className="px-2 py-0.5 text-[10px] font-bold hover:bg-white dark:hover:bg-gray-700 rounded transition-all text-gray-600 dark:text-gray-400 border-l border-gray-300 dark:border-gray-700"
                            >
                                30D
                            </button>
                        </div>
                        <Calendar className="w-3.5 h-3.5 text-gray-400 ml-1" />
                        <input
                            type="date"
                            className="bg-transparent border-none text-gray-900 dark:text-gray-300 text-xs focus:ring-0 w-28 p-0"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="text-gray-400 text-[10px]">-</span>
                        <input
                            type="date"
                            className="bg-transparent border-none text-gray-900 dark:text-gray-300 text-xs focus:ring-0 w-28 p-0"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                        />
                        {(startDate || endDate) && (
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="px-2 text-[10px] font-bold text-cyan-600 hover:text-cyan-500 uppercase"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Visualizations Section */}
            {logs.length > 0 && showInsights && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Session Insights</h3>
                    </div>

                    {/* 1. Metric Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700/50 flex flex-col shadow-sm">
                            <span className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Total Logged</span>
                            <span className="text-xl font-mono text-gray-900 dark:text-white font-bold">{formatDuration(timeMetrics.total)}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700/50 flex flex-col relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><Zap className="w-8 h-8 text-green-500" /></div>
                            <span className="text-xs text-green-600 dark:text-green-500 uppercase font-bold flex items-center gap-1"><Zap className="w-3 h-3" /> Active Work</span>
                            <span className="text-xl font-mono text-gray-900 dark:text-white font-bold">{formatDuration(timeMetrics.active)}</span>
                            <span className="text-[10px] text-gray-500">{(timeMetrics.active / (timeMetrics.total || 1) * 100).toFixed(1)}% Efficiency</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700/50 flex flex-col relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><Monitor className="w-8 h-8 text-gray-400" /></div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold flex items-center gap-1"><Monitor className="w-3 h-3" /> Idle Time</span>
                            <span className="text-xl font-mono text-gray-900 dark:text-white font-bold">{formatDuration(timeMetrics.idle)}</span>
                        </div>
                    </div>

                    {/* 2. Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* Efficiency Donut */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700/50 col-span-1 shadow-sm">
                            <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-2">Efficiency Breakdown</h5>
                            <div className="h-32 w-full flex justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Active', value: timeMetrics.active },
                                                { name: 'Idle', value: timeMetrics.idle }
                                            ]}
                                            cx="50%" cy="50%"
                                            innerRadius={35} outerRadius={50}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            <Cell fill="#10b981" /> {/* Green for Active */}
                                            <Cell fill="#4b5563" /> {/* Gray for Idle */}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => formatDuration(value)}
                                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', fontSize: '10px' }}
                                        />
                                        <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Apps Bar */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700/50 col-span-1 shadow-sm">
                            <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Top Applications (Active)</h5>
                            <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topApps} layout="vertical" margin={{ left: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                        <Tooltip
                                            formatter={(value: any) => formatDuration(value)}
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', fontSize: '10px' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                                            {topApps.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={APP_COLORS[index % APP_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Event Volume (Existing) */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700/50 col-span-1 shadow-sm">
                            <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Event Volume</h5>
                            <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={volumeData}>
                                        <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} interval="preserveStartEnd" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', fontSize: '10px' }}
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={12} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                    {startDate && (
                        <div className="ml-2">
                            <span className="px-3 py-1 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 uppercase shadow-sm">
                                Showing: {startDate.split('-').reverse().join('-')} to {endDate.split('-').reverse().join('-')}
                            </span>
                        </div>
                    )}
                </div>
            )}

            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search logs (Process, Title, Type)..."
                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all dark:text-gray-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                    Showing {filteredLogs.length} of {logs.length} entries
                </div>
            </div>

            <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase font-bold text-xs sticky top-0">
                    <tr><th className="p-4">Timestamp</th><th className="p-4">Type</th><th className="p-4">Details</th><th className="p-4">Risk</th><th className="p-4">Duration</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300 font-mono">
                    {filteredLogs.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">No activity matching your search.</td></tr>
                    ) : (
                        filteredLogs.map((log, i) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
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
