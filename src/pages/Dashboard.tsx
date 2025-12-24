import { useEffect, useState, useRef } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid, LineChart, Line, Legend
} from 'recharts';
import { Activity, Server, Users, AlertTriangle, ShieldAlert, Network, Terminal, Wifi, Download, ArrowRight } from 'lucide-react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { useNavigate } from 'react-router-dom';
import WorldMap from '../components/WorldMap';
import { NetworkTopology } from '../components/NetworkGraph';

interface LogEntry {
    type: string;
    details: string;
    timestamp: string;
    agentId?: string;
}

interface DashboardStats {
    agents: { total: number; online: number; offline: number };
    resources: { avgCpu: number; avgMem: number; trend: { time: string; cpu: number; mem: number }[] };
    threats: {
        total24h: number;
        byType: { type: string; count: number }[];
        trend: { hour: number; count: number }[];
    };
    recentLogs: LogEntry[];
    network: {
        inboundMbps: number;
        outboundMbps: number;
        activeConnections: number;
    };
    riskyAssets: { agentId: string; threatCount: number }[];
    productivity: { globalScore: number };
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [mapAgents, setMapAgents] = useState<any[]>([]); // For World Map
    const [timeRange, setTimeRange] = useState(24); // Hours
    const logContainerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || "https://192.168.1.10:7033";

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Dashboard Aggregate Stats
                const res = await fetch(`${API_URL}/api/dashboard/stats?hours=${timeRange}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                    if (data.recentLogs) setLogs(data.recentLogs);
                }

                // 2. Agent List for Map (Lat/Long)
                const resAgents = await fetch(`${API_URL}/api/status`);
                if (resAgents.ok) {
                    setMapAgents(await resAgents.json());
                }
            } catch { }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000);

        const connection = new HubConnectionBuilder()
            .withUrl(`${API_URL}/streamHub`)
            .withAutomaticReconnect()
            .build();

        connection.on("ReceiveEvent", (agentId, type, details, timestamp) => {
            const newLog = { agentId, type, details, timestamp };
            setLogs(prev => [newLog, ...prev].slice(0, 100));

            setStats(prev => {
                if (!prev) return null;
                const next = { ...prev };
                next.threats.total24h++;

                if (next.riskyAssets) {
                    const idx = next.riskyAssets.findIndex(r => r.agentId === agentId);
                    if (idx >= 0) next.riskyAssets[idx].threatCount++;
                    else next.riskyAssets.push({ agentId, threatCount: 1 });
                    next.riskyAssets.sort((a, b) => b.threatCount - a.threatCount);
                }

                return next;
            });
        });

        connection.start().catch(e => console.error(e));

        return () => {
            clearInterval(interval);
            connection.stop();
        };
    }, [timeRange]);

    const handleExportCsv = () => {
        const headers = ["Timestamp,Type,Thread,Details,AgentId"];
        const rows = logs.map(l => `${l.timestamp},${l.type},,${l.details.replace(/,/g, ' ')},${l.agentId || 'N/A'}`);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `watch-sec_logs_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    if (!stats) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900">
                <div className="text-xl text-blue-400 animate-pulse flex items-center gap-2 font-mono">
                    <Activity className="animate-spin" />
                    INITIALIZING WATCH-SEC KERNEL...
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
    const COLORS = ['#10B981', '#EF4444'];
    // Handle colors generically
    const getColor = (i: number) => COLORS[i % COLORS.length];

    return (
        <div className="p-4 space-y-6 bg-gray-900 min-h-screen text-white font-sans">
            <div className="flex justify-between items-end border-b border-gray-800 pb-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        <ShieldAlert className="text-blue-500" />
                        Command Center
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Enterprise Security Posture & Real-time Telemetry</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                        {[1, 24, 168].map(h => (
                            <button
                                key={h}
                                onClick={() => setTimeRange(h)}
                                className={`px-3 py-1 text-xs font-bold rounded ${timeRange === h ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                {h === 1 ? '1H' : h === 24 ? '24H' : '7D'}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-mono animate-pulse">
                        <Wifi size={12} /> SYSTEM ONLINE
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <KpiCard icon={<Users size={24} />} label="Total Agents" value={stats.agents.total.toString()} subValue={`${stats.agents.online} Online`} color="blue" />
                <KpiCard icon={<ShieldAlert size={24} />} label={`Threats (${timeRange}h)`} value={stats.threats.total24h.toString()} subValue={timeRange === 24 ? "+12% vs yesterday" : "Filtered Range"} color="red" />
                <KpiCard icon={<Network size={24} />} label="Network Traffic" value={`${stats.network.inboundMbps} Mbps`} subValue={`${stats.network.activeConnections} Connections`} color="purple" />
                <KpiCard icon={<Terminal size={24} />} label="Global Productivity" value={`${stats.productivity?.globalScore || 0}%`} subValue="Company Avg" color="yellow" />
                <KpiCard icon={<Server size={24} />} label="System Health" value="98.5%" subValue={`Avg Load: ${stats.resources.avgCpu}%`} color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Activity className="text-purple-500" size={20} /> Threat Velocity
                            </h3>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="time" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} itemStyle={{ color: '#E5E7EB' }} />
                                    <Area type="monotone" dataKey="events" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorThreats)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Server className="text-green-500" size={20} /> System Resource Trends
                            </h3>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.resources.trend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="time" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(t) => t.split(' ')[1]} />
                                    <YAxis stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} itemStyle={{ fontSize: '12px' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="cpu" stroke="#EF4444" strokeWidth={2} dot={false} name="Avg CPU %" />
                                    <Line type="monotone" dataKey="mem" stroke="#3B82F6" strokeWidth={2} dot={false} name="Avg RAM %" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 shadow-xl">
                            <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                                <AlertTriangle className="text-yellow-500" size={20} /> Top Threat Vectors
                            </h3>
                            <div className="space-y-3">
                                {stats.threats.byType.map((t, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${t.count > 20 ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                            <span className="text-sm font-medium text-gray-300">{t.type}</span>
                                        </div>
                                        <span className="font-mono text-blue-400 font-bold">{t.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 shadow-xl">
                            <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                                <ShieldAlert className="text-red-500" size={20} /> Risky Assets
                            </h3>
                            <div className="space-y-3">
                                {stats.riskyAssets?.map((a, i) => (
                                    <div
                                        key={i}
                                        onClick={() => navigate(`/events?agentId=${a.agentId}`)}
                                        className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-red-900/20 group hover:border-red-500/50 transition-colors cursor-pointer hover:bg-gray-800"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-500 font-mono text-xs">#{i + 1}</span>
                                            <span className="text-sm font-bold text-white group-hover:text-red-400 flex items-center gap-1">
                                                {a.agentId} <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </span>
                                        </div>
                                        <span className="bg-red-500/20 text-red-500 text-xs px-2 py-1 rounded font-bold border border-red-500/30">
                                            {a.threatCount} Alerts
                                        </span>
                                    </div>
                                ))}
                                {(!stats.riskyAssets || stats.riskyAssets.length === 0) && (
                                    <div className="text-center text-gray-500 py-4 italic">No risky assets detected.</div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                <div className="space-y-6">
                    {/* World Map Visualization */}
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <WorldMap agents={mapAgents} />
                    </div>

                    {/* Network Topology */}
                    <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 shadow-xl">
                        <h3 className="font-bold text-lg mb-4 text-center">Network Topology</h3>
                        <div className="h-64 w-full">
                            <NetworkTopology />
                        </div>
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 shadow-xl">
                        <h3 className="font-bold text-lg mb-4 text-center">Fleet Availability</h3>
                        <div className="h-48 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                        {pieData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getColor(index)} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold">{stats.agents.total}</span>
                                <span className="text-xs text-gray-500 uppercase">Agents</span>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-4 text-xs font-mono">
                            <span className="text-green-400">● {stats.agents.online} Online</span>
                            <span className="text-red-400">● {stats.agents.offline} Offline</span>
                        </div>
                    </div>

                    <div className="bg-black border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
                        <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-gray-400 flex items-center gap-2 uppercase tracking-widest">
                                <Terminal size={14} /> Live Activity Log
                            </h3>
                            <button onClick={handleExportCsv} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
                                <Download size={14} /> CSV
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 custom-scrollbar" ref={logContainerRef}>
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-2 text-gray-300 animate-fade-in hover:bg-gray-900 p-1 rounded transition-colors">
                                    <span className="text-gray-600 min-w-[70px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    <span className={`font-bold min-w-[100px] ${log.type.includes('Threat') || log.type.includes('USB') ? 'text-red-400' :
                                        log.type.includes('Process') ? 'text-blue-400' : 'text-green-400'
                                        }`}>
                                        [{log.type}]
                                    </span>
                                    <span className="truncate">{log.details}</span>
                                </div>
                            ))}
                            {logs.length === 0 && <div className="text-gray-600 italic text-center mt-20">No recent activity...</div>}
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}

function KpiCard({ icon, label, value, subValue, color }: any) {
    const colors: any = {
        blue: "bg-blue-500/20 text-blue-500 border-blue-500/30",
        red: "bg-red-500/20 text-red-500 border-red-500/30",
        purple: "bg-purple-500/20 text-purple-500 border-purple-500/30",
        green: "bg-green-500/20 text-green-500 border-green-500/30",
        yellow: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    };

    return (
        <div className={`p-6 rounded-xl border border-gray-700/50 bg-gray-800/50 backdrop-blur shadow-lg flex items-center gap-4 hover:bg-gray-800 transition-all group`}>
            <div className={`p-4 rounded-xl ${colors[color]} group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</p>
                <div className="flex flex-col">
                    <span className="text-2xl font-bold text-white">{value}</span>
                    <span className="text-xs text-gray-500 mt-1">{subValue}</span>
                </div>
            </div>
        </div>
    );
}
