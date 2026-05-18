import { useEffect, useState, useRef } from 'react';
import { 
    Wifi, Activity, Zap, ArrowUp, ArrowDown, Network, 
    RefreshCw, Globe, List, Settings
} from 'lucide-react';
import { io } from 'socket.io-client';
import { API_URL, SOCKET_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import BandwidthSettings from './BandwidthSettings';

interface TrafficPoint {
    time: string;
    ingress: number;
    egress: number;
}

interface NodeTraffic {
    agentId: string;
    hostname: string;
    ingressMbps: number;
    egressMbps: number;
    activeConns: number;
    status: 'Online' | 'Offline';
}

export default function NetworkAnalytics() {
    const { token, user } = useAuth();
    const [activeTab, setActiveTab] = useState<'live' | 'settings'>('live');
    const [trafficHistory, setTrafficHistory] = useState<TrafficPoint[]>([]);
    const [nodeTraffic, setNodeTraffic] = useState<NodeTraffic[]>([]);
    const [totalIngress, setTotalIngress] = useState(0);
    const [totalEgress, setTotalEgress] = useState(0);

    const socketRef = useRef<any>(null);

    useEffect(() => {
        if (!token) return;

        // Initial Fetch
        const fetchNetworkState = async () => {
            try {
                const res = await fetch(`${API_URL}/network/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setNodeTraffic(data.nodes || []);
                    setTotalIngress(data.totalIngress || 0);
                    setTotalEgress(data.totalEgress || 0);
                }
            } catch (e) { }
        };

        fetchNetworkState();

        // Socket Integration
        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket"]
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            if (user?.tenantId) {
                socket.emit("join", { room: `tenant_${user.tenantId}` });
            }
        });

        socket.on("network_telemetry", (data: any) => {
            // Real-time Mbps update
            setTrafficHistory(prev => {
                const newPoint = {
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    ingress: data.totalIngress || 0,
                    egress: data.totalEgress || 0
                };
                return [...prev, newPoint].slice(-30); // Keep last 30 points
            });

            if (data.nodes) {
                setNodeTraffic(data.nodes);
            }
            setTotalIngress(data.totalIngress || 0);
            setTotalEgress(data.totalEgress || 0);
        });

        return () => {
            socket.disconnect();
        };
    }, [token, user?.tenantId]);

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500 ring-1 ring-indigo-500/20">
                            <Wifi className="w-5 h-5 animate-pulse" />
                        </div>
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-500">Fleet Operations</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Network <span className="text-indigo-500">Analytics</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-2 font-medium flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-400" />
                        Real-time ingress/egress monitoring and bandwidth optimization.
                    </p>
                </div>

                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button 
                        onClick={() => setActiveTab('live')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'live' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-xl' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        Live Explorer
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-xl' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        Optimization
                    </button>
                </div>
            </div>

            {activeTab === 'live' ? (
                <>
                    {/* Real-time Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-card p-6 border-indigo-500/10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                                    <ArrowDown className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">Live Ingress</span>
                            </div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{totalIngress.toFixed(2)} <span className="text-sm font-bold text-slate-500">Mbps</span></div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Aggregate Traffic Inbound</p>
                        </div>

                        <div className="glass-card p-6 border-blue-500/10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                    <ArrowUp className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest">Live Egress</span>
                            </div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{totalEgress.toFixed(2)} <span className="text-sm font-bold text-slate-500">Mbps</span></div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Aggregate Traffic Outbound</p>
                        </div>

                        <div className="glass-card p-6 border-purple-500/10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                                    <Network className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 uppercase tracking-widest">Active Paths</span>
                            </div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{nodeTraffic.reduce((acc, n) => acc + n.activeConns, 0)} <span className="text-sm font-bold text-slate-500">Sockets</span></div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Fleet Connections</p>
                        </div>
                    </div>

                    {/* Live Streaming Graph */}
                    <div className="glass-card p-8 min-h-[450px]">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-indigo-500" />
                                    Real-time Traffic Stream
                                </h2>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Monitorix infrastructure throughput</p>
                            </div>
                            <div className="flex gap-6">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div> Inbound
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> Outbound
                                </div>
                            </div>
                        </div>
                        
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trafficHistory}>
                                    <defs>
                                        <linearGradient id="colorIngress" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorEgress" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis dataKey="time" hide />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                                        labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 800, marginBottom: '4px' }}
                                    />
                                    <Area type="monotone" dataKey="ingress" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIngress)" animationDuration={500} />
                                    <Area type="monotone" dataKey="egress" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEgress)" animationDuration={500} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Node Performance Table */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <List className="w-4 h-4 text-slate-400" /> Per-Node Telemetry
                            </h2>
                            <button className="text-[10px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                <RefreshCw size={12} /> Refresh Data
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800">
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Node ID</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ingress (Mbps)</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Egress (Mbps)</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Connections</th>
                                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {nodeTraffic.map((node, i) => (
                                        <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors border-b border-slate-200/50 dark:border-slate-800/50 last:border-0">
                                            <td className="py-4">
                                                <div className="font-bold text-slate-900 dark:text-white text-xs">{node.hostname}</div>
                                                <div className="text-[10px] text-slate-500 font-mono tracking-tighter">{node.agentId}</div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex justify-center">
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${node.status === 'Online' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                        {node.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-right font-black text-slate-900 dark:text-white text-xs">{node.ingressMbps.toFixed(2)}</td>
                                            <td className="py-4 text-right font-black text-slate-900 dark:text-white text-xs">{node.egressMbps.toFixed(2)}</td>
                                            <td className="py-4 text-right">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-slate-500 font-bold text-[10px]">
                                                    <Zap size={10} className={node.activeConns > 50 ? 'text-amber-500' : 'text-slate-400'} />
                                                    {node.activeConns}
                                                </div>
                                            </td>
                                            <td className="py-4 text-right">
                                                <button className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
                                                    <Settings size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="animate-in slide-in-from-right-4 duration-500">
                    <BandwidthSettings />
                </div>
            )}

        </div>
    );
}
