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
    const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authToken) return;
        setLoading(true);
        fetch(`${API_URL}/status`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        })
            .then(res => res.json())
            .then(data => setAgents(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [authToken]);

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
        <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6 text-slate-900 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-slate-900">
                    <div className="p-2 bg-emerald-50 rounded-lg shrink-0 border border-emerald-100">
                        <Brain className="text-emerald-600 w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    Human Intelligence
                </h1>
                <p className="text-slate-500 text-sm font-medium">Workforce Wellness & Behavioral Insights</p>
            </div>

            {loading ? (
                <div className="text-center py-20 animate-pulse font-mono tracking-widest text-emerald-600 text-sm">DECRYPTING BEHAVIORAL TELEMETRY...</div>
            ) : (
                <>
                    {/* KEY METRICS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all text-slate-500"><Users size={64} /></div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aggregate Focus</p>
                            <h2 className="text-4xl font-black mt-2 text-emerald-600">{processedData.avgFocus}%</h2>
                            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-semibold">
                                <TrendingUp size={12} /> Optimization target
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all border-l-4 border-l-rose-500">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all text-rose-500"><AlertTriangle size={64} /></div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Burnout Alerts</p>
                            <h2 className="text-4xl font-black mt-2 text-rose-600">{processedData.highRiskCount}</h2>
                            <div className="flex items-center gap-1 mt-2 text-xs text-rose-600 font-semibold">
                                High Risk Detected
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all border-l-4 border-l-amber-500">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all text-amber-500"><Zap size={64} /></div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Behavioral Drift</p>
                            <h2 className="text-4xl font-black mt-2 text-amber-600">{processedData.driftCount}</h2>
                            <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 font-semibold">
                                Unusual Activity Patterns
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all border-l-4 border-l-blue-500">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all text-blue-500"><Clock size={64} /></div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">After-Hours Active</p>
                            <h2 className="text-4xl font-black mt-2 text-blue-600">
                                {Math.round(processedData.stats.reduce((acc, curr) => acc + (curr.hi?.LateHoursMinutes || 0), 0) / 60)}h
                            </h2>
                            <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 font-semibold">
                                Total Fleet Late Work
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Burnout Risk Distribution */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-[400px] flex flex-col">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <ShieldAlert size={18} className="text-rose-500" />
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
                                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Focus Score Comparison */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-[400px] flex flex-col">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Activity size={18} className="text-emerald-500" />
                                Individual Focus Performance
                            </h3>
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={processedData.stats.slice(0, 10)} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" domain={[0, 100]} hide />
                                        <YAxis dataKey="hostname" type="category" width={100} tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
                                        <Bar dataKey={(item) => item.hi?.FocusScore ?? 0} fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} name="Focus Score (%)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* HI ALERT FEED */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <UserCheck size={18} className="text-emerald-600" />
                                Behavioral Intelligence Reports
                            </h3>
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full uppercase border border-emerald-200">Monitorix Analysis</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="p-4">Individual (Asset)</th>
                                        <th className="p-4">Focus Score</th>
                                        <th className="p-4">Burnout Risk</th>
                                        <th className="p-4">Behavioral Drift</th>
                                        <th className="p-4">Health Check</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                                    {processedData.stats.map((agent, i) => (
                                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900">{agent.hostname}</div>
                                                <div className="text-[10px] text-slate-500 font-mono">{agent.agentId}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-bold text-base ${(agent.hi?.FocusScore ?? 0) >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>{agent.hi?.FocusScore ?? 0}%</span>
                                                    <div className="flex-1 w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${agent.hi?.FocusScore ?? 0}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                    agent.hi?.BurnoutRisk === 'High' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                                    agent.hi?.BurnoutRisk === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                    'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                }`}>
                                                    {agent.hi?.BurnoutRisk} Risk
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {agent.hi?.BehavioralDrift === 'Stable' ? (
                                                        <TrendingUp size={14} className="text-emerald-600" />
                                                    ) : (
                                                        <TrendingDown size={14} className="text-rose-600" />
                                                    )}
                                                    <span className="font-semibold text-slate-800">{agent.hi?.BehavioralDrift}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-[11px] text-slate-500">
                                                    {agent.hi?.LastAnalyzed ? new Date(agent.hi.LastAnalyzed).toLocaleTimeString() : 'N/A'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {processedData.stats.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-500">
                                                No behavioral telemetry data found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
