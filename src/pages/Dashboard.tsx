import { useEffect, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { Activity, Server, Users, AlertTriangle, ShieldAlert, Cpu } from 'lucide-react';

// --- MOCK DATA GENERATOR ---
const MOCK_STATS = {
    agents: { total: 42, online: 38, offline: 4 },
    resources: { avgCpu: 45.2, avgMem: 62.8 },
    threats: {
        total24h: 128,
        byType: [
            { type: 'USB Unauthorized', count: 45 },
            { type: 'Malware Process', count: 32 },
            { type: 'Failed Login', count: 28 },
            { type: 'Admin Escalation', count: 12 },
            { type: 'Port Scan', count: 11 }
        ],
        trend: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            count: Math.floor(Math.random() * 50) + 10 // Random spikey data
        }))
    }
};

type DashboardStats = typeof MOCK_STATS;

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);

    // In "Mock Mode", we don't fetch. 
    // To enable backend later, we can toggle this.
    const USE_MOCK = false;

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5140";

    useEffect(() => {
        if (USE_MOCK) {
            setStats(MOCK_STATS);
        } else {
            const fetchStats = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/dashboard/stats`);
                    if (res.ok) setStats(await res.json());
                } catch { }
            };
            fetchStats();
            const interval = setInterval(fetchStats, 5000);

            // REAL-TIME SIGNALR CONNECTION
            // Listen for new events to update counters instantly without waiting for poll
            import('@microsoft/signalr').then(({ HubConnectionBuilder }) => {
                const connection = new HubConnectionBuilder()
                    .withUrl(`${API_URL}/streamHub`)
                    .withAutomaticReconnect()
                    .build();

                connection.on("ReceiveEvent", (_agentId, type, _details, _timestamp) => {
                    setStats(prev => {
                        if (!prev) return null;
                        // Clone stats
                        const next = { ...prev };

                        // 1. Increment Total Threats
                        next.threats.total24h++;

                        // 2. Update Type Counts
                        const typeIndex = next.threats.byType.findIndex(t => type.includes(t.type) || t.type.includes(type));
                        if (typeIndex >= 0) {
                            next.threats.byType[typeIndex].count++;
                        } else {
                            // Generic bucket or add new? For now, just increment total.
                        }

                        // 3. Update Trend (Add to current hour)
                        const currentHour = new Date().getHours();
                        const trendIndex = next.threats.trend.findIndex(t => t.hour === currentHour);
                        if (trendIndex >= 0) {
                            next.threats.trend[trendIndex].count++;
                        }

                        return next;
                    });
                });

                connection.start().catch(e => console.error("Dashboard SignalR Error", e));
            });

            return () => clearInterval(interval);
        }
    }, []);

    if (!stats) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-xl text-blue-400 animate-pulse flex items-center gap-2">
                    <Activity className="animate-spin" />
                    Initializing Security Dashboard...
                </div>
            </div>
        );
    }

    const trendData = stats.threats.trend.map(t => ({
        time: `${t.hour}:00`,
        events: t.count
    }));

    const pieData = [
        { name: 'Online', value: stats.agents.online },
        { name: 'Offline', value: stats.agents.offline },
    ];
    const COLORS = ['#10B981', '#EF4444']; // Green, Red

    return (
        <div className="p-2 space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Activity className="text-blue-500" />
                        Security Analytics
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Real-time threat monitoring and fleet health.</p>
                </div>
                <div className="text-right">
                    <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-xs border border-blue-500/20">
                        Environment: {USE_MOCK ? "DEMO MODE" : "PRODUCTION"}
                    </span>
                </div>
            </div>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4 hover:border-blue-500/50 transition-colors">
                    <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total Agents</p>
                        <p className="text-3xl font-bold text-white">{stats.agents.total}</p>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4 hover:border-red-500/50 transition-colors">
                    <div className="p-3 bg-red-500/20 rounded-lg text-red-500">
                        <ShieldAlert size={28} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Threats (24h)</p>
                        <p className="text-3xl font-bold text-white">{stats.threats.total24h}</p>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4 hover:border-purple-500/50 transition-colors">
                    <div className="p-3 bg-purple-500/20 rounded-lg text-purple-500">
                        <Cpu size={28} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Avg CPU Load</p>
                        <p className="text-3xl font-bold text-white">{stats.resources.avgCpu.toFixed(1)}%</p>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4 hover:border-green-500/50 transition-colors">
                    <div className="p-3 bg-green-500/20 rounded-lg text-green-500">
                        <Server size={28} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">System Health</p>
                        <p className="text-3xl font-bold text-white">98.5%</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart: Threat Velocity */}
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Activity size={18} className="text-purple-500" />
                            Threat Velocity
                        </h3>
                        <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">Last 24 Hours</span>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="time" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                                    itemStyle={{ color: '#E5E7EB' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="events"
                                    stroke="#8B5CF6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorEvents)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Secondary Chart: Agent Health */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col">
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                        <Server size={18} className="text-green-500" />
                        Fleet Status
                    </h3>
                    <div className="flex-1 min-h-[200px] flex items-center justify-center relative">
                        {/* Center Text Stats */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-bold text-white">{stats.agents.total}</span>
                            <span className="text-xs text-gray-400 uppercase">Total Agents</span>
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-8 mt-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-gray-300 text-sm">Online ({stats.agents.online})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                            <span className="text-gray-300 text-sm">Offline ({stats.agents.offline})</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI INSIDER THREAT WIDGET (Phase 8) */}
            <div className="grid grid-cols-1 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">AI Insider Threat Risk</p>
                            <h3 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                                Low Risk
                                <span className="text-xs font-normal text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">Safe</span>
                            </h3>
                        </div>
                        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <ShieldAlert className="text-purple-500 w-6 h-6" />
                        </div>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mb-2">
                        <div className="bg-gradient-to-r from-green-500 to-yellow-500 h-full w-[15%] rounded-full"></div>
                    </div>
                    <p className="text-xs text-gray-500">
                        AI Analysis of <span className="text-gray-300 font-bold">12,450</span> keylogs and <span className="text-gray-300 font-bold">450</span> activity events.
                    </p>
                </div>
            </div>

            {/* Detailed Threat Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <AlertTriangle size={18} className="text-yellow-500" />
                        Recent Incident Types
                    </h3>
                    <button className="text-blue-400 text-sm hover:underline">View All Logs</button>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase font-semibold tracking-wider">
                        <tr>
                            <th className="p-4">Threat Type</th>
                            <th className="p-4">Incidents (24h)</th>
                            <th className="p-4">Impact Score</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-300 divide-y divide-gray-700">
                        {stats.threats.byType.map((t, i) => (
                            <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                                <td className="p-4 font-medium text-white">{t.type}</td>
                                <td className="p-4 font-mono text-blue-300">{t.count}</td>
                                <td className="p-4">
                                    <div className="w-24 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${t.count > 30 ? 'bg-red-500' : 'bg-yellow-500'}`}
                                            style={{ width: `${Math.min(t.count * 2, 100)}%` }}
                                        ></div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs border ${t.count > 30 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                        {t.count > 30 ? 'CRITICAL' : 'WARNING'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
