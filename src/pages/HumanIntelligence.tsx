import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Brain, Users, AlertTriangle, TrendingDown, TrendingUp, 
    Activity, ShieldAlert, Zap, Clock, UserCheck
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts';
import { API_URL } from '../config';

interface HIStats {
    FocusScore: number;
    DistractionRatio: number;
    BurnoutRisk: 'Low' | 'Medium' | 'High';
    BehavioralDrift: string;
    TotalActiveMinutes: number;
    LateHoursMinutes: number;
    LastAnalyzed: string;
}

interface Agent {
    agentId: string;
    hostname: string;
    status: string;
    behavioralMetadataJson?: string;
}

export default function HumanIntelligence() {
    const { token } = useAuth();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        fetch(`${API_URL}/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setAgents(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [token]);

    const processedData = useMemo(() => {
        const stats = agents.map(a => {
            try {
                const hi = JSON.parse(a.behavioralMetadataJson || "{}");
                return { ...a, hi: hi as HIStats };
            } catch {
                return { ...a, hi: null };
            }
        }).filter(a => a.hi);

        const avgFocus = stats.length > 0 ? stats.reduce((acc, curr) => acc + (curr.hi?.FocusScore || 0), 0) / stats.length : 0;
        const highRiskCount = stats.filter(a => a.hi?.BurnoutRisk === 'High').length;
        const driftCount = stats.filter(a => a.hi?.BehavioralDrift !== 'Stable').length;

        return {
            stats,
            avgFocus: Math.round(avgFocus),
            highRiskCount,
            driftCount
        };
    }, [agents]);

    const COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Green, Yellow, Red

    const burnoutData = [
        { name: 'Low Risk', value: processedData.stats.filter(a => a.hi?.BurnoutRisk === 'Low').length },
        { name: 'Medium Risk', value: processedData.stats.filter(a => a.hi?.BurnoutRisk === 'Medium').length },
        { name: 'High Risk', value: processedData.stats.filter(a => a.hi?.BurnoutRisk === 'High').length },
    ];

    return (
        <div className="space-y-6 text-gray-900 dark:text-white pb-12">
            <div>
                <h1 className="text-3xl font-black flex items-center gap-3">
                    <Brain className="text-emerald-500 w-10 h-10" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Human Intelligence</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 uppercase tracking-widest font-bold">Workforce Wellness & Behavioral Insights</p>
            </div>

            {loading ? (
                <div className="text-center py-20 animate-pulse font-mono tracking-widest text-emerald-500">DECRYPTING BEHAVIORAL TELEMETRY...</div>
            ) : (
                <>
                    {/* KEY METRICS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all"><Users size={64} /></div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Aggregate Focus</p>
                            <h2 className="text-4xl font-black mt-2 text-emerald-500">{processedData.avgFocus}%</h2>
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 font-bold uppercase">
                                <TrendingUp size={12} /> Optimization target
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group border-red-500/20">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all text-red-500"><AlertTriangle size={64} /></div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Burnout Alerts</p>
                            <h2 className="text-4xl font-black mt-2 text-red-500">{processedData.highRiskCount}</h2>
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-red-600 font-bold uppercase italic">
                                High Risk Detected
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group border-amber-500/20">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all text-amber-500"><Zap size={64} /></div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Behavioral Drift</p>
                            <h2 className="text-4xl font-black mt-2 text-amber-500">{processedData.driftCount}</h2>
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-600 font-bold uppercase italic">
                                Unusual Activity Patterns
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group border-blue-500/20">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all text-blue-500"><Clock size={64} /></div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">After-Hours Active</p>
                            <h2 className="text-4xl font-black mt-2 text-blue-500">
                                {Math.round(processedData.stats.reduce((acc, curr) => acc + (curr.hi?.LateHoursMinutes || 0), 0) / 60)}h
                            </h2>
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-blue-600 font-bold uppercase italic">
                                Total Fleet Late Work
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Burnout Risk Distribution */}
                        <div className="glass-panel p-6 rounded-2xl h-[400px] flex flex-col">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                <ShieldAlert size={18} className="text-red-500" />
                                Workforce Burnout Risk
                            </h3>
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={burnoutData}
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {burnoutData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Focus Score Comparison */}
                        <div className="glass-panel p-6 rounded-2xl h-[400px] flex flex-col">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Activity size={18} className="text-emerald-500" />
                                Individual Focus Performance
                            </h3>
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={processedData.stats.slice(0, 10)} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                                        <XAxis type="number" domain={[0, 100]} hide />
                                        <YAxis dataKey="hostname" type="category" width={100} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                        <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} />
                                        <Bar dataKey={(item) => item.hi?.FocusScore ?? 0} fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} name="Focus Score (%)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* HI ALERT FEED */}
                    <div className="glass-panel rounded-2xl overflow-hidden border-t-4 border-emerald-500">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-emerald-50/20 dark:bg-emerald-900/10 flex justify-between items-center">
                            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <UserCheck size={18} className="text-emerald-500" />
                                Behavioral Intelligence Reports
                            </h3>
                            <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">Monitorix Analysis</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4">Individual (Asset)</th>
                                        <th className="p-4">Focus Score</th>
                                        <th className="p-4">Burnout Risk</th>
                                        <th className="p-4">Behavioral Drift</th>
                                        <th className="p-4">Health Check</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                                    {processedData.stats.map((agent, i) => (
                                        <tr key={i} className="hover:bg-emerald-50/10 transition-colors group">
                                            <td className="p-4">
                                                <div className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">{agent.hostname}</div>
                                                <div className="text-[9px] text-gray-500 font-mono italic">{agent.agentId}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-black text-lg ${(agent.hi?.FocusScore ?? 0) >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{agent.hi?.FocusScore ?? 0}%</span>
                                                    <div className="flex-1 w-20 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${agent.hi?.FocusScore ?? 0}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full font-black text-[9px] uppercase border ${
                                                    agent.hi?.BurnoutRisk === 'High' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                                    agent.hi?.BurnoutRisk === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                                }`}>
                                                    {agent.hi?.BurnoutRisk} Risk
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {agent.hi?.BehavioralDrift === 'Stable' ? (
                                                        <TrendingUp size={14} className="text-emerald-500" />
                                                    ) : (
                                                        <TrendingDown size={14} className="text-red-500" />
                                                    )}
                                                    <span className="font-bold">{agent.hi?.BehavioralDrift}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-[10px] text-gray-400 italic">
                                                    Last Analyzed: {new Date(agent.hi?.LastAnalyzed || "").toLocaleTimeString()}
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
        </div>
    );
}
