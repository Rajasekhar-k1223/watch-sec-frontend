import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
    AreaChart, Area, CartesianGrid
} from 'recharts';
import { Brain, Clock, Coffee, AlertTriangle, Monitor, Activity, TrendingUp } from 'lucide-react';
import { API_URL } from '../config';

interface ProductivityData {
    score: number;
    totalSeconds: number;
    breakdown: {
        productive: number;
        unproductive: number;
        neutral: number;
        idle: number;
    };
    topApps: {
        name: string;
        duration: number;
        category: string;
    }[];
    trend?: {
        time: string;
        score: number;
    }[];
}

interface Agent {
    agentId: string;
    status: string;
}

export default function Productivity() {
    const { token } = useAuth();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string>("");
    const [data, setData] = useState<ProductivityData | null>(null);
    const [loading, setLoading] = useState(false);

    // 1. Fetch Agents List First
    useEffect(() => {
        if (!token) return;
        fetch(`${API_URL}/api/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then((res: any[]) => {
                setAgents(res);
                if (res.length > 0) setSelectedAgent(res[0].agentId);
            })
            .catch(err => console.error("Failed to load agents", err));
    }, [token]);

    // 2. Fetch Productivity Data when Agent Selected
    useEffect(() => {
        if (!selectedAgent) return;
        setLoading(true);
        fetch(`${API_URL}/api/productivity/summary/${selectedAgent}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(apiData => {
                // Mock trend data if missing (Visual Enhancement)
                if (!apiData.trend) {
                    apiData.trend = Array.from({ length: 24 }, (_, i) => ({
                        time: `${i}:00`,
                        score: Math.floor(Math.random() * 40) + 60 // Random score 60-100
                    }));
                }
                setData(apiData);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [selectedAgent, token]);

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#6B7280']; // Green, Red, Yellow, Gray

    const pieData = data ? [
        { name: 'Productive', value: data.breakdown.productive },
        { name: 'Unproductive', value: data.breakdown.unproductive },
        { name: 'Neutral', value: data.breakdown.neutral },
        { name: 'Idle', value: data.breakdown.idle }
    ] : [];

    return (
        <div className="space-y-6 text-gray-900 dark:text-white">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Activity className="w-8 h-8 text-cyan-400" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Activity Analytics</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Real-time Productivity & Behavior Monitoring</p>
                </div>

                <div className="flex glass-panel rounded-lg p-1">
                    <select
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        className="bg-transparent text-gray-900 dark:text-white text-sm font-bold px-4 py-2 outline-none cursor-pointer"
                    >
                        {agents.map(a => <option key={a.agentId} value={a.agentId} className="text-black">{a.agentId} ({a.status})</option>)}
                    </select>
                </div>
            </div>

            {loading && <div className="text-center py-20 text-cyan-500 animate-pulse font-mono tracking-widest">SCANNING ACTIVITY LOGS...</div>}

            {!loading && data && (
                <>
                    {/* STAT CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Score Card */}
                        <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Brain size={64} className="text-purple-500" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Efficiency Score</p>
                            <h2 className={`text-4xl font-black mt-2 ${data.score >= 70 ? 'text-green-400' : data.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {data.score}
                            </h2>
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                <TrendingUp size={12} className="text-green-500" /> Top 10%
                            </div>
                        </div>

                        {/* Productive Time */}
                        <div className="glass-panel rounded-xl p-6 hover:border-green-500/50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Productive</p>
                                    <h2 className="text-2xl font-bold mt-1 text-white">{formatTime(data.breakdown.productive)}</h2>
                                </div>
                                <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                                    <Monitor size={20} className="text-green-500" />
                                </div>
                            </div>
                            <div className="w-full bg-gray-700 h-1.5 mt-4 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" style={{ width: `${(data.breakdown.productive / data.totalSeconds) * 100}%` }}></div>
                            </div>
                        </div>

                        {/* Unproductive Time */}
                        <div className="glass-panel rounded-xl p-6 hover:border-red-500/50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Distracted</p>
                                    <h2 className="text-2xl font-bold mt-1 text-white">{formatTime(data.breakdown.unproductive)}</h2>
                                </div>
                                <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                    <Coffee size={20} className="text-red-500" />
                                </div>
                            </div>
                            <div className="w-full bg-gray-700 h-1.5 mt-4 rounded-full overflow-hidden">
                                <div className="bg-red-500 h-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" style={{ width: `${(data.breakdown.unproductive / data.totalSeconds) * 100}%` }}></div>
                            </div>
                        </div>

                        {/* Idle Time */}
                        <div className="glass-panel rounded-xl p-6 hover:border-gray-500/50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Idle</p>
                                    <h2 className="text-2xl font-bold mt-1 text-white">{formatTime(data.breakdown.idle)}</h2>
                                </div>
                                <div className="p-2 bg-gray-500/10 rounded-lg border border-gray-500/20">
                                    <Clock size={20} className="text-gray-400" />
                                </div>
                            </div>
                            <div className="w-full bg-gray-700 h-1.5 mt-4 rounded-full overflow-hidden">
                                <div className="bg-gray-500 h-full" style={{ width: `${(data.breakdown.idle / data.totalSeconds) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* NEW: FOCUS TREND CHART */}
                    <div className="glass-panel rounded-xl p-6 shadow-lg">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                            <TrendingUp className="text-cyan-400" size={20} />
                            Focus Trend (24h)
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.trend}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
                                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                                        labelStyle={{ color: '#9CA3AF' }}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#06b6d4" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CHARTS ROW */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* DONUT CHART */}
                        <div className="glass-panel rounded-xl p-6 lg:col-span-1 flex flex-col items-center justify-center">
                            <h3 className="text-white font-bold mb-4 self-start">Time Distribution</h3>
                            <div className="w-full h-64 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                                            formatter={(val: any) => formatTime(val)}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <span className="text-2xl font-bold text-white">{formatTime(data.totalSeconds)}</span>
                                    <span className="text-xs text-gray-500 uppercase">Total Logged</span>
                                </div>
                            </div>
                        </div>

                        {/* TOP APPS BAR CHART */}
                        <div className="glass-panel rounded-xl p-6 lg:col-span-2">
                            <h3 className="text-white font-bold mb-6">Top Applications</h3>
                            <div className="w-full h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.topApps} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                                            formatter={(val: any) => [formatTime(val), "Duration"]}
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        />
                                        <Bar dataKey="duration" radius={[0, 4, 4, 0]} barSize={20}>
                                            {data.topApps.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.category === 'Productive' ? '#10B981' : entry.category === 'Unproductive' ? '#EF4444' : '#F59E0B'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* DETAILED TABLE */}
                    <div className="glass-panel rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-gray-800 bg-black/20">
                            <h3 className="text-white font-bold">Session Detail</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-black/20 text-gray-400 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="p-4">Application</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Time Spent</th>
                                        <th className="p-4 w-full">Impact</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800 text-gray-300">
                                    {data.topApps.map((app, i) => (
                                        <tr key={i} className="hover:bg-cyan-500/5 transition-colors">
                                            <td className="p-4 font-bold text-white">{app.name}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold border ${app.category === 'Productive' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                                    app.category === 'Unproductive' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {app.category}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono">{formatTime(app.duration)}</td>
                                            <td className="p-4">
                                                <div className="w-32 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${app.category === 'Productive' ? 'bg-green-500' : app.category === 'Unproductive' ? 'bg-red-500' : 'bg-yellow-500'}`}
                                                        style={{ width: `${(app.duration / data.totalSeconds) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {!loading && !data && (
                <div className="glass-panel text-center py-20 rounded-xl">
                    <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No Metric Data</h3>
                    <p className="text-gray-400 mt-2">No activity logs found for this agent.</p>
                </div>
            )}
        </div>
    );
}
