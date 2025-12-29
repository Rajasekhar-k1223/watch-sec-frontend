import { useEffect, useState } from 'react';
import { Activity, Clock, CheckCircle, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function EmployeeDashboard() {
    const { user, token } = useAuth();
    const [stats, setStats] = useState<any>(null);
    // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5140";

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/api/productivity/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setStats(await res.json());
            } catch (e) {
                console.error("Failed to fetch my stats", e);
            }
        };
        fetchStats();
    }, [token]);

    if (!stats) return <div className="p-8 text-gray-500 animate-pulse">Loading your dashboard...</div>;

    const data = [
        { name: 'Productive', value: stats.breakdown?.productive || 0, color: '#10B981' },
        { name: 'Neutral', value: stats.breakdown?.neutral || 0, color: '#6B7280' },
        { name: 'Unproductive', value: stats.breakdown?.unproductive || 0, color: '#EF4444' },
    ];

    return (
        <div className="p-8 bg-gray-900 min-h-screen text-white font-sans animate-fade-in">
            <div className="mb-8 border-b border-gray-800 pb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                    <Activity className="text-blue-400" />
                    My Dashboard
                </h1>
                <p className="text-gray-400 mt-1">Welcome back, {user?.username}. Here is your daily summary.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* 1. Productivity Score */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">Productivity Score</h3>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[{ val: stats.score }, { val: 100 - stats.score }]}
                                    innerRadius={40}
                                    outerRadius={50}
                                    startAngle={90}
                                    endAngle={-270}
                                    dataKey="val"
                                    stroke="none"
                                >
                                    <Cell fill={stats.score > 70 ? '#10B981' : stats.score > 40 ? '#F59E0B' : '#EF4444'} />
                                    <Cell fill="#374151" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                            {stats.score}%
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Based on active application usage</p>
                </div>

                {/* 2. Device Health */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Smartphone size={16} /> Device Health
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-green-900/20 border border-green-900/50 rounded-lg">
                            <CheckCircle className="text-green-500" />
                            <div>
                                <p className="font-bold text-green-400">System Secure</p>
                                <p className="text-xs text-gray-500">Antivirus Active, Firewall On</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Policy Compliance</span>
                            <span className="text-green-400 font-bold">100%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Agent Status</span>
                            <span className="text-blue-400 font-bold flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Connected</span>
                        </div>
                    </div>
                </div>

                {/* 3. Time Breakdown */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Clock size={16} /> Time Management
                    </h3>
                    <div className="space-y-3">
                        {data.map((d, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-300">{d.name}</span>
                                    <span className="font-mono text-gray-500">
                                        {Math.round((d.value / (stats.totalSeconds || 1)) * 100)}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${(d.value / (stats.totalSeconds || 1)) * 100}%`, backgroundColor: d.color }}
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="mt-4 pt-4 border-t border-gray-700 text-center text-xs text-gray-500">
                            Total Tracked Time: <span className="text-white font-bold">{Math.round(stats.totalSeconds / 60)} mins</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Apps Table */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
                <h3 className="font-bold mb-4">Your Top Applications (24h)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.topApps?.map((app: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-2 h-8 rounded-full ${app.category === 'Productive' ? 'bg-green-500' : app.category === 'Unproductive' ? 'bg-red-500' : 'bg-gray-500'}`} />
                                <span className="truncate font-medium text-gray-300" title={app.name}>{app.name}</span>
                            </div>
                            <span className="text-gray-500 text-xs font-mono">{Math.round(app.duration / 60)}m</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
