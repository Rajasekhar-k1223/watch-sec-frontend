import { useEffect, useState, useRef } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid, LineChart, Line, Legend
} from 'recharts';
import { Activity, Server, Users, AlertTriangle, ShieldAlert, Network, Terminal, Wifi, Download, ArrowRight, Globe, Zap } from 'lucide-react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
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

// Threat Colors for Pie Chart
const THREAT_COLORS = ['#EF4444', '#F59E0B', '#6366F1', '#10B981'];

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [mapAgents, setMapAgents] = useState<any[]>([]);
    const [timeRange, setTimeRange] = useState(24);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5140";

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

                // 2. Agent List for Map
                const resAgents = await fetch(`${API_URL}/api/status`);
                if (resAgents.ok) {
                    setMapAgents(await resAgents.json());
                }
            } catch { }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000);

        // Socket.IO Connection
        const socket = io(API_URL, {
            path: "/socket.io",
            transports: ["websocket"],
            reconnectionAttempts: 5
        });

        socket.on("connect", () => {
            console.log("[Socket.IO] Connected to Dashboard Stream");
        });

        socket.on("security_event", (data: any) => {
            const newLog: LogEntry = {
                type: data.Type || "Security",
                details: data.Details || "Unknown Event",
                timestamp: data.Timestamp || new Date().toISOString(),
                agentId: data.AgentId
            };
            setLogs(prev => [newLog, ...prev].slice(0, 100));

            setStats(prev => {
                if (!prev) return null;
                const next = { ...prev };
                next.threats.total24h++;
                return next;
            });
        });

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, [timeRange]);

    // Prepare Pie Data
    const pieData = stats?.threats.byType.map((t, i) => ({
        name: t.type,
        value: t.count,
        color: THREAT_COLORS[i % THREAT_COLORS.length]
    })) || [];

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 text-white">

            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Activity className="w-8 h-8 text-blue-500" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            Command Center
                        </span>
                    </h1>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        Global Security Operations Real-time View
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-gray-800/50 p-1 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                    {[24, 7, 30].map((h) => (
                        <button
                            key={h}
                            onClick={() => setTimeRange(h)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === h
                                ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/50'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
                        >
                            {h === 24 ? '24H' : h + 'D'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Agents Card */}
                <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all shadow-lg hover:shadow-blue-500/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 blur-xl"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/20">
                            <Server className="w-6 h-6" />
                        </div>
                        <span className="flex items-center gap-1.5 text-xs font-semibold bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full border border-green-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                            {stats?.agents.online || 0} Online
                        </span>
                    </div>
                    <div className="text-4xl font-bold text-white mb-2 tracking-tight">{stats?.agents.total || 0}</div>
                    <div className="text-sm text-gray-400 font-medium">Active Endpoints</div>
                </div>

                {/* Threats Card */}
                <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 p-6 rounded-2xl relative overflow-hidden group hover:border-red-500/30 transition-all shadow-lg hover:shadow-red-500/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 blur-xl"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-500/20 rounded-xl text-red-400 border border-red-500/20">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-semibold bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full border border-red-500/20">
                            <ArrowRight className="w-3 h-3 rotate-45" />
                            +{stats?.threats.total24h || 0} New
                        </span>
                    </div>
                    <div className="text-4xl font-bold text-white mb-2 tracking-tight">{stats?.threats.total24h || 0}</div>
                    <div className="text-sm text-gray-400 font-medium">Critical Threats</div>
                </div>

                {/* Network Card */}
                <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all shadow-lg hover:shadow-purple-500/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 blur-xl"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/20">
                            <Wifi className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full border border-gray-700">
                            Running
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <div className="text-4xl font-bold text-white mb-2 tracking-tight">{stats?.network.inboundMbps || 0}</div>
                        <span className="text-lg text-gray-500">Mbps</span>
                    </div>
                    <div className="text-sm text-gray-400 font-medium">Inbound Traffic</div>
                </div>

                {/* Productivity / Custom Card */}
                <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-lg hover:shadow-emerald-500/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 blur-xl"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/20">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white">{stats?.productivity.globalScore || 0}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Score</div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-400 mt-2 font-medium">Productivity Index</div>
                    <div className="w-full bg-gray-800 h-1.5 mt-3 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${stats?.productivity.globalScore || 0}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Middle Section: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Graph: System Load Trend */}
                <div className="lg:col-span-2 bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 min-h-[400px] shadow-lg">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-purple-400" />
                            System Health Trends
                        </h2>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span className="w-3 h-3 rounded-full bg-purple-500/50"></span> CPU
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span className="w-3 h-3 rounded-full bg-blue-500/50"></span> Memory
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.resources.trend || []}>
                                <defs>
                                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="time" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="cpu" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                                <Area type="monotone" dataKey="mem" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorMem)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart: Threats by Type */}
                <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-400" />
                        Threat Distribution
                    </h2>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.2)" />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text Overlays */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                            <div className="text-3xl font-bold text-white">{stats?.threats.total24h || 0}</div>
                            <div className="text-xs text-gray-500 uppercase">Total</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Map & Topology & Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Network Topology */}
                <div className="lg:col-span-2 bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 relative overflow-hidden group shadow-lg min-h-[400px]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Network className="w-5 h-5 text-blue-400" />
                            Network Topology
                        </h2>
                        <span className="text-[10px] font-mono font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">LIVE SCAN</span>
                    </div>
                    <div className="h-[350px] w-full bg-gray-950/50 rounded-xl border border-gray-800/50 relative overflow-hidden">
                        <NetworkTopology />
                    </div>
                </div>

                {/* Live Logs */}
                <div className="lg:col-span-2 bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 flex flex-col h-[400px] shadow-lg">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        Live Security Feed
                    </h2>
                    <div
                        ref={logContainerRef}
                        className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent custom-scrollbar"
                    >
                        {logs.map((log, i) => (
                            <div key={i} className="p-3 bg-gray-950/50 rounded-lg border border-gray-800 hover:border-gray-600 transition-all group animate-in slide-in-from-right-2 duration-300">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${log.type.includes('Security') || log.type.includes('Threat')
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                        {log.type}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-sm text-gray-300 group-hover:text-white transition-colors line-clamp-1" title={log.details}>{log.details}</div>
                                {log.agentId && <div className="text-[10px] text-gray-600 mt-1 flex items-center gap-1 font-mono"><Server className="w-3 h-3" /> {log.agentId}</div>}
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-2">
                                <Activity className="w-8 h-8 opacity-20" />
                                <span>Waiting for events...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* World Map Overlay/Modal OR Bottom Component? Let's hide it for now to reduce clutter or put at very bottom */}
            <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">Global Threat Map</h2>
                    <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span> Active Endpoint</div>
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span> Threat Detected</div>
                    </div>
                </div>
                <div className="h-[400px] w-full rounded-xl overflow-hidden relative border border-gray-800/50">
                    <WorldMap agents={mapAgents} />
                </div>
            </div>

        </div>
    );
}
