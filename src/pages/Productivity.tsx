import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Activity, Clock, Monitor, Coffee, AlertTriangle, TrendingUp, Brain
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend
} from 'recharts';
import { API_URL } from '../config';

interface AppUsage {
    name: string;
    duration: number; // in seconds
    category: 'Productive' | 'Unproductive' | 'Neutral';
}

interface ProductivityData {
    agentId: string;
    score: number; // 0-100
    totalSeconds: number;
    breakdown: {
        productive: number;
        unproductive: number;
        neutral: number;
        idle: number;
    };
    topApps: AppUsage[];
    trend?: { time: string; score: number }[];
}

interface Agent {
    agentId: string;
    status: string;
}

export default function Productivity() {
    const { token } = useAuth();
    const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string>("");
    const [data, setData] = useState<ProductivityData | null>(null);
    const [loading, setLoading] = useState(false);

    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // 1. Fetch Agents List First
    useEffect(() => {
        if (!authToken) return;
        fetch(`${API_URL}/status`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        })
            .then(res => res.json())
            .then((res: any[]) => {
                setAgents(res);
                if (res.length > 0) setSelectedAgent(res[0].agentId);
            })
            .catch(err => console.error("Failed to load agents", err));
    }, [authToken]);

    // 2. Fetch Productivity Data when Agent Selected
    useEffect(() => {
        if (!selectedAgent || !authToken) return;
        setLoading(true);

        let url = `${API_URL}/productivity/summary/${selectedAgent}`;

        if (startDate || endDate) {
            let from = startDate ? `${startDate}T00:00:00` : '';
            let to = endDate ? `${endDate}T23:59:59` : '';

            const params = new URLSearchParams();
            if (from) params.append('from_date', from);
            if (to) params.append('to_date', to);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }
        }

        fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        })
            .then(res => res.json())
            .then(apiData => {
                // Ensure trend data strictly adheres to real backend records
                if (!apiData.trend) {
                    apiData.trend = [];
                }
                setData(apiData);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [selectedAgent, authToken, startDate, endDate]);

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#64748b']; // Green, Red, Yellow, Gray

    const pieData = data ? [
        { name: 'Productive', value: data.breakdown.productive },
        { name: 'Unproductive', value: data.breakdown.unproductive },
        { name: 'Neutral', value: data.breakdown.neutral },
        { name: 'Idle', value: data.breakdown.idle }
    ] : [];

    return (
        <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6 text-slate-900 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-slate-900">
                        <div className="p-2 bg-blue-50 rounded-lg shrink-0 border border-blue-100">
                            <Activity className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                        </div>
                        Activity Analytics
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Real-time Productivity & Behavior Monitoring</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="flex bg-white border border-slate-200 shadow-sm rounded-lg p-1 items-center gap-2">
                        <input
                            type="date"
                            className="bg-transparent text-slate-800 text-xs font-semibold px-2 py-1.5 outline-none cursor-pointer"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            title="From Date"
                        />
                        <span className="text-slate-400 text-xs">to</span>
                        <input
                            type="date"
                            className="bg-transparent text-slate-800 text-xs font-semibold px-2 py-1.5 outline-none cursor-pointer"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            title="To Date"
                            min={startDate}
                        />
                        {(startDate || endDate) && (
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="mr-1 text-xs text-blue-600 hover:text-blue-800 font-bold px-2 py-1 hover:bg-slate-100 rounded"
                            >
                                CLEAR
                            </button>
                        )}
                    </div>

                    <div className="flex bg-white border border-slate-200 shadow-sm rounded-lg p-1">
                        <select
                            value={selectedAgent}
                            onChange={(e) => setSelectedAgent(e.target.value)}
                            className="bg-transparent text-slate-800 text-xs font-semibold px-3 py-1.5 outline-none cursor-pointer"
                        >
                            {agents.map(a => <option key={a.agentId} value={a.agentId}>{a.agentId} ({a.status})</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {loading && <div className="text-center py-20 text-blue-600 animate-pulse font-mono tracking-widest text-sm">SCANNING ACTIVITY LOGS...</div>}

            {!loading && data && (
                <>
                    {/* STAT CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Score Card */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Brain size={64} className="text-purple-600" />
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Efficiency Score</p>
                            <h2 className={`text-4xl font-black mt-2 ${data.score >= 70 ? 'text-emerald-600' : data.score >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {data.score}
                            </h2>
                            <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 font-medium">
                                <TrendingUp size={12} className="text-emerald-500" /> Top 10%
                            </div>
                        </div>

                        {/* Productive Time */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Productive</p>
                                    <h2 className="text-2xl font-bold mt-1 text-slate-900">{formatTime(data.breakdown.productive)}</h2>
                                </div>
                                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <Monitor size={20} className="text-emerald-600" />
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 mt-4 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full" style={{ width: `${(data.breakdown.productive / (data.totalSeconds || 1)) * 100}%` }}></div>
                            </div>
                        </div>

                        {/* Unproductive Time */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Distracted</p>
                                    <h2 className="text-2xl font-bold mt-1 text-slate-900">{formatTime(data.breakdown.unproductive)}</h2>
                                </div>
                                <div className="p-2 bg-rose-50 rounded-lg border border-rose-100">
                                    <Coffee size={20} className="text-rose-600" />
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 mt-4 rounded-full overflow-hidden">
                                <div className="bg-rose-500 h-full" style={{ width: `${(data.breakdown.unproductive / (data.totalSeconds || 1)) * 100}%` }}></div>
                            </div>
                        </div>

                        {/* Idle Time */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Idle</p>
                                    <h2 className="text-2xl font-bold mt-1 text-slate-900">{formatTime(data.breakdown.idle)}</h2>
                                </div>
                                <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                                    <Clock size={20} className="text-slate-500" />
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 mt-4 rounded-full overflow-hidden">
                                <div className="bg-slate-400 h-full" style={{ width: `${(data.breakdown.idle / (data.totalSeconds || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* FOCUS TREND CHART */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-slate-900 font-bold mb-6 flex items-center gap-2 text-sm">
                            <TrendingUp className="text-blue-600" size={18} />
                            Focus Trend (24h)
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.trend}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
                                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#0f172a' }}
                                        labelStyle={{ color: '#64748b' }}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CHARTS ROW */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* DONUT CHART */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm lg:col-span-1 flex flex-col items-center justify-center">
                            <h3 className="text-slate-900 font-bold mb-4 self-start text-sm">Time Distribution</h3>
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
                                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                                            itemStyle={{ color: '#0f172a' }}
                                            formatter={(val: any) => formatTime(val)}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <span className="text-2xl font-bold text-slate-900">{formatTime(data.totalSeconds)}</span>
                                    <span className="text-xs text-slate-500 uppercase font-semibold">Total Logged</span>
                                </div>
                            </div>
                        </div>

                        {/* TOP APPS BAR CHART */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
                            <h3 className="text-slate-900 font-bold mb-6 text-sm">Top Applications</h3>
                            <div className="w-full h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.topApps} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                                            itemStyle={{ color: '#0f172a' }}
                                            formatter={(val: any) => [formatTime(val), "Duration"]}
                                            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
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
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                            <h3 className="text-slate-900 font-bold text-sm">Session Detail</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-200">
                                    <tr>
                                        <th className="p-4">Application</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Time Spent</th>
                                        <th className="p-4 w-full">Impact</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {data.topApps.map((app, i) => (
                                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4 font-semibold text-slate-900 text-xs">{app.name}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${app.category === 'Productive' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                                    app.category === 'Unproductive' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                                                    }`}>
                                                    {app.category}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono text-xs">{formatTime(app.duration)}</td>
                                            <td className="p-4">
                                                <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${app.category === 'Productive' ? 'bg-emerald-500' : app.category === 'Unproductive' ? 'bg-rose-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${(app.duration / (data.totalSeconds || 1)) * 100}%` }}
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
                <div className="bg-white border border-slate-200 text-center py-20 rounded-xl shadow-sm">
                    <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">No Metric Data</h3>
                    <p className="text-slate-500 text-sm mt-1">No activity logs found for this agent.</p>
                </div>
            )}
        </div>
    );
}
