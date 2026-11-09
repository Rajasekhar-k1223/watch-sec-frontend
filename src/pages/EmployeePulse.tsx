import { useEffect, useState } from 'react';
import { Activity, Clock, Users, Briefcase, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function EmployeePulse() {
    const { token } = useAuth();
    const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!authToken) return;
            try {
                const res = await fetch(`${API_URL}/productivity/pulse`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (res.ok) setStats(await res.json());
            } catch (e) {
                console.error("Failed to fetch pulse stats", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [authToken]);

    if (loading) return <div className="p-8 text-blue-600 animate-pulse font-mono tracking-widest text-center text-sm">ANALYZING COMPANY PULSE...</div>;

    if (!stats) return <div className="p-8 text-center text-slate-500">Failed to load pulse data.</div>;

    const departmentData = stats?.departments || stats?.departmentData || [];

    return (
        <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6 text-slate-900 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-6">
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-slate-900">
                    <div className="p-2 bg-purple-50 rounded-lg shrink-0 border border-purple-100">
                        <Activity className="text-purple-600 w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    Employee Pulse
                </h1>
                <p className="text-slate-500 text-sm font-medium">Organization-wide productivity insights and health metrics.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Company Score */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:border-slate-300 transition-all">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Company Efficiency</h3>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[{ val: stats.companyScore }, { val: Math.max(0, 100 - stats.companyScore) }]}
                                    innerRadius={40}
                                    outerRadius={50}
                                    startAngle={90}
                                    endAngle={-270}
                                    dataKey="val"
                                    stroke="none"
                                >
                                    <Cell fill={stats.companyScore > 70 ? '#8B5CF6' : stats.companyScore > 50 ? '#F59E0B' : '#EF4444'} />
                                    <Cell fill="#f1f5f9" stroke="none" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-slate-900">
                            {stats.companyScore}%
                        </div>
                    </div>
                </div>

                {/* 2. Total Hours */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Work Hours</h3>
                            <Clock className="text-blue-500 w-5 h-5 opacity-80" />
                        </div>
                        <p className="text-4xl font-bold mt-4 text-slate-900">{stats.totalHoursLogged}</p>
                        <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                            <TrendingUp size={12} /> +12% vs last week
                        </p>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 mt-4 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full w-3/4"></div>
                    </div>
                </div>

                {/* 3. Active Agents */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Employees</h3>
                            <Users className="text-emerald-500 w-5 h-5 opacity-80" />
                        </div>
                        <p className="text-4xl font-bold mt-4 text-slate-900">{stats.activeAgents}</p>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Currently Online</p>
                    </div>
                </div>

                {/* 4. Retention / Engagement */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Engagement Rate</h3>
                            <Briefcase className="text-amber-500 w-5 h-5 opacity-80" />
                        </div>
                        <p className="text-4xl font-bold mt-4 text-slate-900">{stats.retention}%</p>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Daily Active Users</p>
                    </div>
                </div>
            </div>

            {/* Detailed Analytics Section */}
            <div className="bg-white rounded-xl p-6 md:p-8 border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="text-purple-600 w-5 h-5" />
                    Departmental Productivity Matrix
                </h3>
                
                <div className="h-80 w-full mt-4">
                    {departmentData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={departmentData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#0f172a' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="productivity" name="Productivity Score (%)" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={40} />
                                <Bar dataKey="activeHours" name="Total Hours Logged" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                            <Users className="w-8 h-8 mb-2 opacity-50" />
                            <span>No departmental productivity telemetry recorded for this timeframe</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
