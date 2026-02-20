import { useEffect, useState } from 'react';
import { Activity, Clock, Users, Briefcase, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function EmployeePulse() {
    const { token } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/productivity/pulse`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setStats(await res.json());
            } catch (e) {
                console.error("Failed to fetch pulse stats", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [token]);

    if (loading) return <div className="p-8 text-cyan-500 animate-pulse font-mono tracking-widest text-center">ANALYZING COMPANY PULSE...</div>;

    if (!stats) return <div className="p-8 text-center text-gray-500">Failed to load data.</div>;



    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white font-sans animate-fade-in transition-colors">
            <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg shadow-purple-500/20">
                        <Activity className="text-white w-6 h-6" />
                    </div>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
                        Employee Pulse
                    </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Organization-wide productivity insights and health metrics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* 1. Company Score */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:border-purple-500/30 transition-all">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
                    <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Company Efficiency</h3>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[{ val: stats.companyScore }, { val: 100 - stats.companyScore }]}
                                    innerRadius={40}
                                    outerRadius={50}
                                    startAngle={90}
                                    endAngle={-270}
                                    dataKey="val"
                                    stroke="none"
                                >
                                    <Cell fill={stats.companyScore > 70 ? '#8B5CF6' : stats.companyScore > 50 ? '#F59E0B' : '#EF4444'} />
                                    <Cell fill="#e5e7eb" stroke="none" />
                                    {/* dark mode fix needed for empty cell color? handled by css var or conditional? using generic gray for now */}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-gray-900 dark:text-white">
                            {stats.companyScore}%
                        </div>
                    </div>
                </div>

                {/* 2. Total Hours */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Work Hours</h3>
                            <Clock className="text-blue-500 w-5 h-5 opacity-80" />
                        </div>
                        <p className="text-4xl font-bold mt-4 text-gray-900 dark:text-white">{stats.totalHoursLogged}</p>
                        <p className="text-xs text-green-500 font-bold mt-2 flex items-center gap-1">
                            <TrendingUp size={12} /> +12% vs last week
                        </p>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-1 mt-4 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full w-3/4"></div>
                    </div>
                </div>

                {/* 3. Active Agents */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Active Employees</h3>
                            <Users className="text-emerald-500 w-5 h-5 opacity-80" />
                        </div>
                        <p className="text-4xl font-bold mt-4 text-gray-900 dark:text-white">{stats.activeAgents}</p>
                        <p className="text-xs text-gray-400 mt-2">Currently Online</p>
                    </div>
                </div>

                {/* 4. Retention / Engagement */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Engagement Rate</h3>
                            <Briefcase className="text-orange-500 w-5 h-5 opacity-80" />
                        </div>
                        <p className="text-4xl font-bold mt-4 text-gray-900 dark:text-white">{stats.retention}%</p>
                        <p className="text-xs text-gray-400 mt-2">Daily Active Users</p>
                    </div>
                </div>
            </div>

            {/* Bottom Section - Placeholder for more detailed analytics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                    <AlertTriangle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detailed Team Analytics</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-2 mb-6">
                    Detailed departmental breakdown and interaction graphs are coming soon in the next update.
                </p>
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors">
                    Download Summary Report
                </button>
            </div>
        </div>
    );
}
