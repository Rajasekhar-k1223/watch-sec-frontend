import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Brain, Clock, Coffee, AlertTriangle, Monitor } from 'lucide-react';
import { API_URL } from '../config';

interface ProductivityData {
    score: number;
    totalSeconds: number;
    breakdown: {
        productive: number;
        unproductive: number;
        neutral: number;
    };
    topApps: {
        name: string;
        duration: number;
        category: string;
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
        }) // Assuming this returns list of agents
            .then(res => res.json())
            .then((res: any[]) => {
                setAgents(res);
                if (res.length > 0) setSelectedAgent(res[0].agentId);
            })
            .catch(err => console.error("Failed to load agents", err));
    }, [API_URL]);

    // 2. Fetch Productivity Data when Agent Selected
    useEffect(() => {
        if (!selectedAgent) return;
        setLoading(true);
        fetch(`${API_URL}/api/productivity/summary/${selectedAgent}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(setData)
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [selectedAgent, API_URL, token]);

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const COLORS = ['#10B981', '#EF4444', '#F59E0B']; // Green, Red, Yellow (Neutral)

    const pieData = data ? [
        { name: 'Productive', value: data.breakdown.productive },
        { name: 'Unproductive', value: data.breakdown.unproductive },
        { name: 'Neutral', value: data.breakdown.neutral }
    ] : [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Brain className="w-8 h-8 text-purple-600 dark:text-purple-500" />
                        Employee Pulse
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">AI-Driven Productivity & Focus Analytics</p>
                </div>

                <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <select
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        className="bg-transparent text-gray-900 dark:text-white text-sm font-bold px-4 py-2 outline-none cursor-pointer"
                    >
                        {agents.map(a => <option key={a.agentId} value={a.agentId}>{a.agentId} ({a.status})</option>)}
                    </select>
                </div>
            </div>

            {loading && <div className="text-center py-20 text-gray-500 animate-pulse">Analyzing Work Patterns...</div>}

            {!loading && data && (
                <>
                    {/* TOP STATS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg relative overflow-hidden transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Brain size={64} className="text-purple-500" /></div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">Productivity Score</p>
                            <h2 className={`text-4xl font-bold mt-2 ${data.score >= 70 ? 'text-green-500 dark:text-green-400' : data.score >= 40 ? 'text-yellow-500 dark:text-yellow-400' : 'text-red-500 dark:text-red-400'}`}>
                                {data.score}%
                            </h2>
                            <p className="text-xs text-gray-500 mt-2">Efficiency Rating</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg transition-colors">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">Work Time</p>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatTime(data.breakdown.productive)}</h2>
                                </div>
                                <Monitor className="text-green-500 opacity-50" />
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1 mt-4 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full" style={{ width: `${(data.breakdown.productive / data.totalSeconds) * 100}%` }}></div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg transition-colors">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">Distractions</p>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatTime(data.breakdown.unproductive)}</h2>
                                </div>
                                <Coffee className="text-red-500 opacity-50" />
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1 mt-4 rounded-full overflow-hidden">
                                <div className="bg-red-500 h-full" style={{ width: `${(data.breakdown.unproductive / data.totalSeconds) * 100}%` }}></div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg transition-colors">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">Total Logged</p>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatTime(data.totalSeconds)}</h2>
                                </div>
                                <Clock className="text-blue-500 opacity-50" />
                            </div>
                            <p className="text-xs text-gray-500 mt-4">Last 24 Hours</p>
                        </div>
                    </div>

                    {/* CHARTS ROW */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 1. DONUT CHART */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 lg:col-span-1 flex flex-col items-center justify-center transition-colors">
                            <h3 className="text-gray-900 dark:text-white font-bold mb-4 self-start">Time Distribution</h3>
                            <div className="w-full h-64 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                            formatter={(val: any) => formatTime(val)}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{formatTime(data.totalSeconds)}</span>
                                    <span className="text-xs text-gray-500 uppercase">Total</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. TOP APPS BAR CHART */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2 transition-colors">
                            <h3 className="text-gray-900 dark:text-white font-bold mb-6">Top Applications</h3>
                            <div className="w-full h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.topApps} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                            formatter={(val: any) => [formatTime(val), "Duration"]}
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        />
                                        <Bar dataKey="duration" radius={[0, 4, 4, 0]}>
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-gray-900 dark:text-white font-bold">Application Breakdown</h3>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-4">Application</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Time Spent</th>
                                    <th className="p-4 w-full">Impact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-600 dark:text-gray-300">
                                {data.topApps.map((app, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4 font-bold text-gray-900 dark:text-white">{app.name}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${app.category === 'Productive' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400' :
                                                app.category === 'Unproductive' ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400' : 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                                                }`}>
                                                {app.category}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono">{formatTime(app.duration)}</td>
                                        <td className="p-4">
                                            <div className="w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
                </>
            )}

            {!loading && !data && (
                <div className="text-center py-20 bg-gray-800 rounded-xl border border-gray-700">
                    <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No Metrics Available</h3>
                    <p className="text-gray-400 mt-2">No activity logs found for this agent in the last 24 hours.</p>
                </div>
            )}
        </div>
    );
}
