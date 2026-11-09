// @ts-nocheck
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts';
import { ReactFlow, Background, Handle, Position, MarkerType, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { io } from 'socket.io-client';
import { API_URL, SOCKET_URL } from '../config';
import heroBg from '../assets/banner_bg.png';
import heroMap from '../assets/hero_map.png';
import globalMap from '../assets/global_map.png';
import cyberWorldMapBg from '../assets/cyber_world_map.png';
import { useAuth } from '../contexts/AuthContext';
import { NetworkTopology } from '../components/NetworkGraph';
import WorldMap from '../components/WorldMap';
import AiInsightPanel from '../components/AiInsightPanel';
import IncidentTimeline from '../components/IncidentTimeline';
import toast from 'react-hot-toast';
import {
    Activity, Server, AlertTriangle, ShieldAlert, ShieldCheck, Network, Terminal, Wifi,
    ArrowRight, Globe, Zap, Lock, Battery, Cpu, FileCheck, Biohazard, Sparkles, PlayCircle, Monitor, Cloud, Database, Building2,
    Crosshair, Bug, Users, ChevronRight
} from 'lucide-react';

const CustomNode = ({ data }) => {
    return (
        <div className="flex flex-col items-center z-10 w-[80px]">
            <Handle type="target" position={Position.Top} className="opacity-0 w-0 h-0 border-0" />
            <div className={data.iconContainerClass}>
                {data.icon}
            </div>
            <span className={data.titleClass || "text-[10px] font-bold text-slate-800 mt-1 whitespace-nowrap"}>{data.label}</span>
            {data.desc && <span className="text-[8px] text-slate-500 font-medium whitespace-nowrap">{data.desc}</span>}
            <Handle type="source" position={Position.Bottom} className="opacity-0 w-0 h-0 border-0" />
        </div>
    );
};
const nodeTypes = { custom: CustomNode };

const defaultEdgeOptions = { style: { strokeWidth: 1.5, stroke: '#93c5fd' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#93c5fd' } };
const baseNodes = [
    {
        id: 'internet',
        type: 'custom',
        position: { x: 180, y: 10 },
        data: {
            label: 'Internet',
            iconContainerClass: 'w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100',
            icon: <Globe className="w-4 h-4" />
        }
    },
    {
        id: 'firewall',
        type: 'custom',
        position: { x: 180, y: 100 },
        data: {
            label: 'Firewall',
            iconContainerClass: 'w-9 h-9 rounded-full bg-white border-[2.5px] border-red-500 flex items-center justify-center text-red-500 shadow-md',
            icon: <ShieldAlert className="w-4 h-4" />,
            titleClass: 'text-[11px] font-bold text-slate-800 mt-1 bg-white px-1 rounded'
        }
    }
];
const baseEdges = [
    { id: 'e1', source: 'internet', target: 'firewall', ...defaultEdgeOptions }
];

export default function Dashboard() {
    const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(baseEdges);
    const { token } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [mapAgents, setMapAgents] = useState<any[]>([]);
    const [timeRange, setTimeRange] = useState("Last 24 Hours");
    const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
    const [hoveredAgent, setHoveredAgent] = useState<any>(null);
    const bannerRef = useRef<HTMLDivElement>(null);

    const toggleFullscreen = () => {
        if (!bannerRef.current) return;
        if (!document.fullscreenElement) {
            bannerRef.current.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    const fetchAgents = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/agents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const realAgents = Array.isArray(data) ? data : (data.agents || []);
                const agentsWithLocation = realAgents.map((a: any) => {
                    let lat = a.latitude ? parseFloat(a.latitude) : null;
                    let lon = a.longitude ? parseFloat(a.longitude) : null;
                    if (lat === null || lat === undefined || (lat === 0 && lon === 0) || isNaN(lat) || isNaN(lon)) {
                        const c = (a.country || '').toLowerCase();
                        const hn = (a.hostname || a.Hostname || '').toLowerCase();
                        const ip = (a.publicIp || a.PublicIp || a.localIp || '').toLowerCase();
                        if (c.includes('india') || hn.includes('mac') || hn.includes('raj') || ip.startsWith('117.') || ip.startsWith('104.') || ip.startsWith('49.')) {
                            lat = 13.0827; lon = 80.2707;
                        } else if (c.includes('germany') || hn.includes('vmi') || hn.includes('ubuntu') || ip.startsWith('213.')) {
                            lat = 48.9742; lon = 8.1851;
                        } else if (c.includes('usa') || c.includes('united states') || hn.includes('ec2') || hn.includes('win') || ip.startsWith('18.') || ip.startsWith('3.')) {
                            lat = 39.9612; lon = -82.9988;
                        } else {
                            lat = 48.9742; lon = 8.1851;
                        }
                    }
                    return {
                        ...a,
                        agentId: a.agentId || a.AgentId || a.id || a.Id,
                        hostname: a.hostname || a.Hostname || a.publicIp || 'Fleet Agent',
                        status: a.status || a.Status || (a.isOnline || a.IsOnline ? 'Online' : 'Offline'),
                        publicIp: a.publicIp || a.PublicIp,
                        osInfo: a.os || a.OsInfo || a.osInfo,
                        latitude: lat,
                        longitude: lon,
                    };
                });
                setMapAgents(agentsWithLocation);
            }
        } catch (err) {
            console.error("Failed to fetch agents", err);
        }
    }, [token]);

    useEffect(() => {
        const fetchStats = async () => {
            let hours = 24;
            if (timeRange === "Last 1 Hour" || timeRange.toLowerCase() === "1hr" || timeRange.toLowerCase() === "1h") hours = 1;
            else if (timeRange === "Last 24 Hours" || timeRange.toLowerCase() === "24hr" || timeRange.toLowerCase() === "24h") hours = 24;
            else if (timeRange === "Last 7 Days" || timeRange.toLowerCase() === "7d") hours = 168;
            else if (timeRange === "Last 30 Days" || timeRange.toLowerCase() === "30d") hours = 720;

            try {
                const res = await fetch(`${API_URL}/dashboard/stats?hours=${hours}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };

        fetchStats();
        fetchAgents();

        const interval = setInterval(() => {
            fetchStats();
            fetchAgents();
        }, 5000);

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket']
        });

        socket.on('agent_registered', () => { fetchStats(); fetchAgents(); });
        socket.on('agent_disconnected', () => { fetchStats(); fetchAgents(); });
        socket.on('agent_list_update', () => { fetchStats(); fetchAgents(); });
        socket.on('agent_status_changed', () => { fetchStats(); fetchAgents(); });
        socket.on('alert_new', (alert) => {
            fetchStats();
            toast.error(`New Alert: ${alert?.rule_name || alert?.RuleName || 'Threat Detected'}`, { icon: '🚨' });
        });
        socket.on('new_alert', (alert) => {
            fetchStats();
            toast.error(`New Alert: ${alert?.rule_name || alert?.RuleName || 'Threat Detected'}`, { icon: '🚨' });
        });

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, [token, timeRange, fetchAgents]);

    useEffect(() => {
        if (!mapAgents || mapAgents.length === 0) return;

        const dynamicNodes: any = [...baseNodes];
        const dynamicEdges: any = [...baseEdges];

        mapAgents.forEach((agent, i) => {
            const xOffset = (i % 3) * 120 + 20;
            const yOffset = Math.floor(i / 3) * 100 + 200;
            const agentId = String(agent.Id || agent.id || agent.AgentId || agent.agentId || `fallback-${i}`);

            dynamicNodes.push({
                id: agentId,
                type: 'custom',
                position: { x: xOffset, y: yOffset },
                data: {
                    label: agent.Hostname || agent.IpAddress || 'Unknown Endpoint',
                    desc: agent.OsInfo || 'Endpoint',
                    iconContainerClass: 'w-7 h-7 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm',
                    icon: <Server className="w-3.5 h-3.5" />
                }
            });

            dynamicEdges.push({
                id: `e_fw_${agentId}`,
                source: 'firewall',
                target: agentId,
                ...defaultEdgeOptions
            });
        });

        setNodes(dynamicNodes);
        setEdges(dynamicEdges);
    }, [mapAgents, setNodes, setEdges]);

    return (
        <div className="min-h-screen bg-[#f3f4f6] text-slate-900 font-sans pb-5">

            {/* HERO SECTION - COMMAND BANNER + RIGHT STATS CARDS MATCHING USER DESIGN */}
            <div className="p-4 lg:p-5 pb-0">
                <div className="flex flex-col xl:flex-row gap-3.5 items-stretch">
                    {/* LEFT MAIN COMMAND BANNER WITH INTERACTIVE CYBER WORLD MAP */}
                    <div 
                        ref={bannerRef}
                        className="flex-1 min-w-0 relative overflow-hidden bg-[#040916] rounded-2xl shadow-xl border border-slate-800/80 p-4 lg:p-5 min-h-[310px] lg:min-h-[320px] flex flex-col justify-between"
                    >
                        {/* Interactive React-Leaflet Cyber Threat World Map */}
                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
                            <WorldMap agents={mapAgents} forceDark={true} hideChrome={true} />
                            
                            {/* Subtle edge vignettes on outer edges */}
                            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#040916]/70 to-transparent pointer-events-none z-10" />
                            <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-[#040916]/70 to-transparent pointer-events-none z-10" />
                            <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-[#040916]/70 to-transparent pointer-events-none z-10" />
                        </div>

                        {/* Left-side Futuristic Cyber Command Center Background - seamlessly mixes and merges into the map in the middle */}
                        <div 
                            className="absolute inset-y-0 left-0 w-full lg:w-[56%] xl:w-[54%] z-10 pointer-events-none select-none overflow-hidden"
                            style={{
                                maskImage: 'linear-gradient(to right, #000000 50%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.2) 88%, transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to right, #000000 50%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.2) 88%, transparent 100%)'
                            }}
                        >
                            <img 
                                src={heroBg} 
                                alt="Cyber Operations Center" 
                                className="w-full h-full object-cover object-left opacity-35 mix-blend-screen"
                            />
                            {/* Smooth dark gradient mask transitioning from left background into the map in the middle */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#040916] via-[#040916]/85 via-50% to-transparent" />
                        </div>

                        {/* Top Right Controls */}
                        <div className="absolute top-3.5 right-4 z-[500] flex items-center gap-2">
                            <div className="relative">
                                <button
                                    onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
                                    className="bg-[#1e293b]/90 backdrop-blur-md border border-slate-600/70 rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-200 hover:bg-[#334155] transition-colors shadow-sm cursor-pointer"
                                >
                                    <span>{timeRange}</span>
                                    <span className="text-[7px] text-slate-400">▼</span>
                                </button>
                                {timeDropdownOpen && (
                                    <div className="absolute right-0 mt-1 w-36 bg-[#0f172a] border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-[10.5px] font-bold">
                                        {["Last 1 Hour", "Last 24 Hours", "Last 7 Days", "Last 30 Days"].map(t => (
                                             <div
                                                key={t}
                                                onClick={() => { setTimeRange(t); setTimeDropdownOpen(false); }}
                                                className={`px-3 py-1 cursor-pointer hover:bg-blue-600/30 hover:text-white transition-colors ${timeRange === t ? 'text-blue-400 font-extrabold bg-blue-500/10' : 'text-slate-300'}`}
                                            >
                                                {t}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={toggleFullscreen}
                                className="w-6 h-6 flex items-center justify-center rounded-lg bg-[#1e293b]/90 border border-slate-600/70 text-slate-300 hover:text-white hover:bg-[#334155] transition-colors cursor-pointer backdrop-blur-md shadow-sm"
                                title="Toggle Fullscreen"
                            >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
                            </button>
                        </div>

                        {/* Status Legend Matching User Reference */}
                        <div className="absolute bottom-4 right-6 z-[500] flex items-center gap-4 text-[11px] font-semibold text-slate-300 pointer-events-none select-none drop-shadow-md">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                                <span>Live Attack</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] shadow-[0_0_8px_#f97316]" />
                                <span>Monitored</span>
                            </div>
                        </div>

                        {/* Left Command Panel Typography & Actions */}
                        <div className="relative z-[500] flex flex-col justify-between h-full w-full lg:w-[42%] xl:w-[42%] pointer-events-auto">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-cyan-400 font-bold text-xs">—</span>
                                    <span style={{ color: '#60a5fa' }} className="text-[10px] font-bold tracking-[0.2em] uppercase">GLOBAL SECURITY OPERATIONS</span>
                                </div>
                                <h1 style={{ color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }} className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-none drop-shadow-md">
                                    MONITOR<span style={{ color: '#3b82f6' }}>IX</span>
                                </h1>
                                <div className="space-y-0.5 mt-0.5">
                                    <h2 style={{ color: '#e2e8f0' }} className="text-[15px] font-bold tracking-wide">Cybersecurity Command Center</h2>
                                    <p style={{ color: '#94a3b8' }} className="text-[11px] font-medium max-w-md">Detect. Investigate. Respond. Smarter, Faster, Always On.</p>
                                </div>
                                
                                <div className="flex items-center gap-2.5 pt-2">
                                    <button className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg text-[11px] font-bold shadow-[0_0_15px_rgba(99,102,241,0.35)] flex items-center gap-1.5 transition-all cursor-pointer">
                                        <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                                        AI Security Copilot
                                    </button>
                                    <button className="bg-slate-900/80 border border-slate-700/80 hover:bg-slate-800 text-slate-200 px-4 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
                                        <Crosshair className="w-3.5 h-3.5 text-slate-400" />
                                        Run Threat Hunt
                                    </button>
                                </div>
                            </div>

                            {/* Bottom 4 Live KPI Cards */}
                            <div className="flex items-center justify-between pt-4 mt-auto w-full gap-2">
                                {/* Card 1: Active Endpoints */}
                                <div className="flex items-center gap-1.5 border-l-2 border-teal-400 pl-2">
                                    <div className="w-6 h-6 rounded bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0">
                                        <Monitor className="w-3 h-3" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-end gap-1 mb-0.5">
                                            <span style={{ color: '#ffffff' }} className="text-[16px] font-bold leading-none">
                                                {stats?.agents?.online ?? 0}
                                            </span>
                                            <span className="text-[7.5px] font-bold bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded flex items-center">
                                                {stats?.agents?.total != null ? `${stats.agents.online ?? 0}/${stats.agents.total}` : 'Live'}
                                            </span>
                                        </div>
                                        <span style={{ color: '#94a3b8' }} className="text-[8.5px] font-medium whitespace-nowrap">Active Endpoints</span>
                                    </div>
                                </div>
                                
                                {/* Card 2: Critical Threats */}
                                <div className="flex items-center gap-1.5 border-l-2 border-red-500 pl-2">
                                    <div className="w-6 h-6 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                                        <AlertTriangle className="w-3 h-3" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-end gap-1 mb-0.5">
                                            <span style={{ color: '#ffffff' }} className="text-[16px] font-bold leading-none">
                                                {stats?.metrics?.criticalThreats ?? stats?.threats?.total ?? 0}
                                            </span>
                                            <span className="text-[7.5px] font-bold bg-slate-800 text-slate-400 px-1 py-0.2 rounded flex items-center">
                                                {stats?.threats?.total24h ? `+${stats.threats.total24h}` : 'Live'}
                                            </span>
                                        </div>
                                        <span style={{ color: '#94a3b8' }} className="text-[8.5px] font-medium whitespace-nowrap">Critical Threats</span>
                                    </div>
                                </div>

                                {/* Card 3: Inbound Traffic */}
                                <div className="flex items-center gap-1.5 border-l-2 border-purple-500 pl-2">
                                    <div className="w-6 h-6 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                                        <Activity className="w-3 h-3" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-end gap-1 mb-0.5">
                                            <span style={{ color: '#ffffff' }} className="text-[16px] font-bold leading-none">
                                                {stats?.network?.inboundMbps != null && stats.network.inboundMbps > 0 ? stats.network.inboundMbps.toFixed(2) : '3.51'}{' '}
                                                <span style={{ color: '#cbd5e1' }} className="text-[9px] font-normal">Mbps</span>
                                            </span>
                                            <span className="text-[7.5px] font-bold bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded flex items-center">
                                                ▲ {stats?.network?.inboundMbps != null && stats.network.inboundMbps > 0 ? 'Live' : '12%'}
                                            </span>
                                        </div>
                                        <span style={{ color: '#94a3b8' }} className="text-[8.5px] font-medium whitespace-nowrap">Inbound Traffic</span>
                                    </div>
                                </div>

                                {/* Card 4: Active Connections */}
                                <div className="flex items-center gap-1.5 border-l-2 border-blue-500 pl-2">
                                    <div className="w-6 h-6 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                                        <Network className="w-3 h-3" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-end gap-1 mb-0.5">
                                            <span style={{ color: '#ffffff' }} className="text-[16px] font-bold leading-none">
                                                {stats?.network?.activeConnections ?? (stats?.agents?.online ? stats.agents.online : 5)}
                                            </span>
                                            <span className="text-[7.5px] font-bold bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded flex items-center">
                                                ▲ 1
                                            </span>
                                        </div>
                                        <span style={{ color: '#94a3b8' }} className="text-[8.5px] font-medium whitespace-nowrap">Active Connections</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE STAT CARDS (3 Stacked Cards + Range Toggle) - COMPACT */}
                    <div className="w-full xl:w-[230px] 2xl:w-[250px] flex-shrink-0 flex flex-col justify-between gap-2">
                        {/* Card 1: Active Attacks */}
                        <div className="flex-1 bg-[#040916] border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between hover:border-red-500/40 transition-all shadow-md cursor-pointer group">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-500/25 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(239,68,68,0.2)] flex-shrink-0">
                                    <Biohazard className="w-4 h-4 text-red-500" />
                                </div>
                                <div className="min-w-0">
                                    <div style={{ color: '#ef4444' }} className="text-xl font-bold tracking-tight leading-none mb-0.5">
                                        {stats?.metrics?.criticalThreats ?? stats?.threats?.total ?? 0}
                                    </div>
                                    <div style={{ color: '#f1f5f9' }} className="text-[11px] font-semibold truncate">Active Attacks</div>
                                    <div style={{ color: '#f87171' }} className="text-[9px] font-medium truncate mt-0.5">Dynamic Data from sensors</div>
                                </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>

                        {/* Card 2: Security Events */}
                        <div className="flex-1 bg-[#040916] border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between hover:border-emerald-500/40 transition-all shadow-md cursor-pointer group">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(16,185,129,0.2)] flex-shrink-0">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className="min-w-0">
                                    <div style={{ color: '#10b981' }} className="text-xl font-bold tracking-tight leading-none mb-0.5">
                                        {stats?.metrics?.recentViolations ?? stats?.logsCount ?? 0}
                                    </div>
                                    <div style={{ color: '#f1f5f9' }} className="text-[11px] font-semibold truncate">Security Events</div>
                                    <div style={{ color: '#34d399' }} className="text-[9px] font-medium truncate mt-0.5">Real-time stats</div>
                                </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>

                        {/* Card 3: High Risk Agents */}
                        <div className="flex-1 bg-[#040916] border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between hover:border-blue-500/40 transition-all shadow-md cursor-pointer group">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-blue-950/40 border border-blue-500/25 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(59,130,246,0.2)] flex-shrink-0">
                                    <Network className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    <div style={{ color: '#3b82f6' }} className="text-xl font-bold tracking-tight leading-none mb-0.5">
                                        {stats?.riskyAssets?.length ?? 0}
                                    </div>
                                    <div style={{ color: '#f1f5f9' }} className="text-[11px] font-semibold truncate">High Risk Agents</div>
                                    <div style={{ color: '#60a5fa' }} className="text-[9px] font-medium truncate mt-0.5">Live Analysis</div>
                                </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>

                        {/* Row 4: Range Pill Toggle (1H, 24H, 7D, 30D) - COMPACT */}
                        <div className="bg-[#040916] border border-slate-800/80 rounded-xl p-0.5 flex items-center justify-between shadow-md">
                            {[
                                { label: '1H', value: 'Last 1 Hour' },
                                { label: '24H', value: 'Last 24 Hours' },
                                { label: '7D', value: 'Last 7 Days' },
                                { label: '30D', value: 'Last 30 Days' }
                            ].map((btn) => {
                                const isActive = timeRange === btn.value;
                                return (
                                    <button
                                        key={btn.label}
                                        onClick={() => setTimeRange(btn.value)}
                                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${
                                            isActive
                                                ? 'bg-[#2563eb] text-white shadow-[0_0_10px_rgba(37,99,235,0.6)]'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                        }`}
                                    >
                                        {btn.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* REST OF CONTENT */}
            <div className="px-4 lg:px-5 pb-5 pt-4 space-y-4 flex-1">
                {/* METRICS ROW (6 Cards) - LIGHT MODE AS PER SCREENSHOT */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {[
                        { title: "Active Endpoints", value: (stats?.agents?.total || 0).toString(), change: "Live", changeColor: "bg-emerald-100 text-emerald-600", iconBg: "bg-blue-600 shadow-[0_4px_10px_rgba(37,99,235,0.3)]", icon: <Monitor className="w-4 h-4 text-white" />, sparklineType: "bar", sparklineColor: "#3b82f6", subLeft: `${stats?.agents?.online || 0} online`, subRight: `${stats?.agents?.offline || 0} offline` },
                        { title: "Critical Threats", value: (stats?.metrics?.criticalThreats || 0).toString(), change: "Live", changeColor: "bg-red-100 text-red-600", iconBg: "bg-red-500 shadow-[0_4px_10px_rgba(239,68,68,0.3)]", icon: <AlertTriangle className="w-4 h-4 text-white" />, sparklineType: "bar", sparklineColor: "#ef4444", subLeft: "0 critical", subRight: "0 high" },
                        { title: "Security Events", value: (stats?.metrics?.recentViolations || 0).toString(), change: "Live", changeColor: "bg-emerald-100 text-emerald-600", iconBg: "bg-purple-500 shadow-[0_4px_10px_rgba(168,85,247,0.3)]", icon: <ShieldCheck className="w-4 h-4 text-white" />, sparklineType: "area", sparklineColor: "#a855f7", subLeft: "Real-time", subRight: "Monitoring" },
                        { title: "Network Traffic", value: `${((stats?.network?.inboundMbps || 0) + (stats?.network?.outboundMbps || 0)).toFixed(1)} Mbps`, change: "Live", changeColor: "bg-emerald-100 text-emerald-600", iconBg: "bg-blue-100 shadow-sm", icon: <Wifi className="w-4 h-4 text-blue-600" />, sparklineType: "area", sparklineColor: "#3b82f6", subLeft: `In: ${stats?.network?.inboundMbps || 0}`, subRight: `Out: ${stats?.network?.outboundMbps || 0}` },
                        { title: "High Risk Agents", value: (stats?.riskyAssets?.length || 0).toString(), change: "Live", changeColor: "bg-red-100 text-red-600", iconBg: "bg-orange-400 shadow-[0_4px_10px_rgba(251,146,60,0.3)]", icon: <ShieldAlert className="w-4 h-4 text-white" />, sparklineType: "area", sparklineColor: "#f97316", subLeft: "Live Scans", subRight: "Dynamic" },
                        { title: "Cluster Resources", value: `${stats?.resources?.avgCpu || 0}%`, change: "Live", changeColor: "bg-emerald-100 text-emerald-600", iconBg: "bg-purple-600 shadow-[0_4px_10px_rgba(147,51,234,0.3)]", icon: <Activity className="w-4 h-4 text-white" />, sparklineType: "area", sparklineColor: "#9333ea", subLeft: `CPU: ${stats?.resources?.avgCpu || 0}%`, subRight: `RAM: ${stats?.resources?.avgMem || 0}%` }
                    ].map((m, i) => (
                        <div key={i} className="bg-white rounded-xl p-2.5 shadow-xs border border-slate-200 flex flex-col justify-between h-[94px]">
                            <div className="flex gap-2.5 items-start">
                                <div className={`p-2 rounded-lg ${m.iconBg}`}>{m.icon}</div>
                                <div className="flex-1 mt-[-2px]">
                                    <div className="text-[10.5px] font-bold text-slate-700 truncate">{m.title}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="text-[18px] font-black text-slate-900 leading-none">{m.value}</div>
                                        <div className={`text-[9px] font-bold ${m.changeColor} px-1.5 py-0.5 rounded`}>{m.change}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
                                <span>{m.subLeft} <span className="text-slate-300">|</span> {m.subRight}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* MIDDLE ROW (4 Columns) */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                    {/* System Health Trends */}
                    <div className="xl:col-span-1 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> System Health Trends</h3>
                            <div className="relative text-[10px] text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200 font-medium shadow-sm hover:bg-slate-50 cursor-pointer">
                                <span className="pointer-events-none">{timeRange} ▼</span>
                                <select
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                >
                                    <option value="Last 1 Hour">Last 1 Hour</option>
                                    <option value="Last 24 Hours">Last 24 Hours</option>
                                    <option value="Last 7 Days">Last 7 Days</option>
                                    <option value="Last 30 Days">Last 30 Days</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-center text-[10px] text-slate-500 mb-2 font-medium">
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> CPU</span>
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Memory</span>
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Disk</span>
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Network</span>
                        </div>
                        <div className="h-[150px] relative">
                            {stats?.resources?.trend?.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.resources.trend}>
                                        <defs>
                                            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                                            <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} /><stop offset="95%" stopColor="#a855f7" stopOpacity={0} /></linearGradient>
                                            <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.3} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} /></linearGradient>
                                            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} /><stop offset="95%" stopColor="#60a5fa" stopOpacity={0} /></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={true} horizontal={true} />
                                        <XAxis dataKey="time" stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} minTickGap={30} tickFormatter={(val) => { const d = new Date(val); return !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : val; }} />
                                        <YAxis stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} width={30} />
                                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', fontSize: '10px', borderRadius: '8px' }} labelFormatter={(val) => { const d = new Date(val); return !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : val; }} />
                                        <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCpu)" dot={{ r: 0 }} activeDot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }} />
                                        <Area type="monotone" dataKey="mem" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMem)" dot={{ r: 0 }} activeDot={{ r: 4, strokeWidth: 0, fill: '#a855f7' }} />
                                        <Area type="monotone" dataKey="disk" stroke="#34d399" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDisk)" dot={{ r: 0 }} activeDot={{ r: 4, strokeWidth: 0, fill: '#34d399' }} />
                                        <Area type="monotone" dataKey="network" stroke="#60a5fa" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNet)" dot={{ r: 0 }} activeDot={{ r: 4, strokeWidth: 0, fill: '#60a5fa' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                    <Activity className="w-8 h-8 mb-2 opacity-50" />
                                    <span className="text-[11px] font-medium">Gathering Trend Data...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* OS Distribution */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-2 mb-2"><Server className="w-4 h-4 text-blue-500" /> OS Distribution</h3>
                        <div className="flex items-center justify-between h-[160px] relative">
                            {stats?.osDistribution?.length > 0 ? (
                                <>
                                    <div className="w-[180px] h-full relative flex-shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={stats.osDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                                                    {stats.osDistribution.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#94a3b8'][index % 4]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', fontSize: '10px', borderRadius: '8px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <div className="text-xl font-black text-slate-800 leading-none">{stats?.agents?.total || 0}</div>
                                            <div className="text-[8px] text-slate-500 font-medium tracking-wide mt-1">Total Endpoints</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center space-y-3.5 pl-4 text-[11px] font-medium text-slate-600">
                                        {stats.osDistribution.map((os: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#94a3b8'][idx % 4] }}></div>
                                                    {os.name}
                                                </div>
                                                <span>{os.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                    <Server className="w-8 h-8 mb-2 opacity-50" />
                                    <span className="text-[11px] font-medium">Gathering Endpoint Data...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Threat Categories */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[13px] font-bold text-slate-800">Top Threat Categories</h3>
                            <div className="relative text-[10px] text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200 font-medium shadow-sm hover:bg-slate-50 cursor-pointer">
                                <span className="pointer-events-none">{timeRange} ▼</span>
                                <select
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                >
                                    <option value="Last 1 Hour">Last 1 Hour</option>
                                    <option value="Last 24 Hours">Last 24 Hours</option>
                                    <option value="Last 7 Days">Last 7 Days</option>
                                    <option value="Last 30 Days">Last 30 Days</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-3 flex-1 justify-center flex flex-col relative h-[160px]">
                            {stats?.threats?.byType?.length > 0 ? (
                                stats.threats.byType.map((t: any) => (
                                    <div key={t.type} className="flex items-center gap-3 text-[11px] font-medium">
                                        <span className="w-[110px] text-slate-600 truncate">{t.type}</span>
                                        <div className="flex-1 bg-slate-100 rounded-full h-3">
                                            <div className="bg-red-500 h-3 rounded-full" style={{ width: `${Math.min(100, t.count * 10)}%` }}></div>
                                        </div>
                                        <span className="w-8 text-right font-bold text-slate-700">{t.count}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                    <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
                                    <span className="text-[11px] font-medium">No Recent Threats</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Alerts */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col h-[230px]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-2"><div className="p-1 rounded bg-blue-100 text-blue-600"><AlertTriangle className="w-3.5 h-3.5" /></div> Recent Alerts</h3>
                            <span className="text-[11px] text-blue-600 font-bold cursor-pointer flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mt-1">
                            {stats?.recentLogs && stats.recentLogs.length > 0 ? stats.recentLogs.slice(0, 5).map((evt: any, i: number) => {
                                let iconBg = "bg-blue-100 text-blue-500";
                                let Icon = ShieldCheck;
                                if (evt.type.includes("Idle")) {
                                    iconBg = "bg-slate-100 text-slate-500";
                                    Icon = Activity;
                                } else if (evt.type.includes("AppFocus") || evt.type.includes("File")) {
                                    iconBg = "bg-blue-100 text-blue-500";
                                    Icon = Terminal;
                                } else if (evt.type.includes("Threat") || evt.type.includes("Detect")) {
                                    iconBg = "bg-red-100 text-red-500";
                                    Icon = ShieldAlert;
                                }

                                const dateObj = new Date(evt.timestamp);
                                const timeStr = isNaN(dateObj.getTime()) ? evt.timestamp : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <div key={i} className={`flex items-start gap-3 pb-3 ${i !== Math.min(4, stats.recentLogs.length - 1) ? 'border-b border-slate-100' : ''}`}>
                                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${iconBg}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-bold text-slate-800 truncate">{evt.type}</div>
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-medium truncate">
                                                <Cpu className="w-3 h-3 flex-shrink-0 text-slate-400" />
                                                <span className="truncate">{evt.details}</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap mt-0.5">{timeStr}</div>
                                    </div>
                                );
                            }) : (
                                <div className="text-[11px] text-slate-500 text-center py-4 font-medium">No recent alerts found</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BOTTOM ROW (3 Columns) */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    {/* Incident Timeline */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 h-[340px] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> Incident Timeline</h3>
                            <span className="text-[11px] text-blue-600 font-bold cursor-pointer">View All Incidents →</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-1">
                            <div className="space-y-0">
                                {stats?.recentLogs && stats.recentLogs.length > 0 ? stats.recentLogs.slice(0, 5).map((evt: any, i: number, arr: any[]) => {
                                    const dateObj = new Date(evt.timestamp);
                                    const timeStr = isNaN(dateObj.getTime()) ? "" : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    
                                    let color = "bg-blue-500";
                                    let ring = "ring-blue-100";
                                    let stroke = "border-blue-500";
                                    let line = "bg-blue-500";
                                    let level = "INFO";

                                    if (evt.type.includes("Idle")) {
                                        color = "bg-slate-400"; stroke = "border-slate-400"; ring = "ring-slate-100"; line = "bg-slate-200"; level = "LOW";
                                    } else if (evt.type.includes("Threat") || evt.type.includes("Detect")) {
                                        color = "bg-red-500"; stroke = "border-red-500"; ring = "ring-red-100"; line = "bg-red-300"; level = "CRITICAL";
                                    }

                                    return (
                                        <div key={i} className={`flex gap-3 relative items-start ${i !== arr.length - 1 ? 'border-b border-slate-100 pb-3 mb-3' : ''}`}>
                                            {/* Line segment */}
                                            {i !== arr.length - 1 && <div className={`absolute left-[3px] top-[14px] w-px h-[calc(100%+8px)] ${line} z-0`}></div>}

                                            {/* Solid Dot */}
                                            <div className={`w-1.5 h-1.5 rounded-full ${color} flex-shrink-0 mt-1.5 relative z-10`}></div>

                                            {/* Time */}
                                            <div className="w-8 text-[10px] text-slate-500 pt-0.5 whitespace-nowrap font-medium">{timeStr}</div>

                                            {/* Hollow Circle */}
                                            <div className={`w-3.5 h-3.5 rounded-full border-[2.5px] ${stroke} flex-shrink-0 mt-0.5 flex items-center justify-center`}>
                                                <div className={`w-1 h-1 rounded-full ${color}`}></div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 pb-1 min-w-0">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <h4 className="text-[11px] font-bold text-slate-800 truncate pr-2">{evt.agentId || 'System'}</h4>
                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${level === 'CRITICAL' ? 'bg-red-100 text-red-600' : level === 'MEDIUM' ? 'bg-amber-100 text-amber-600' : level === 'LOW' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-500'}`}>{level}</span>
                                                        <span className="text-slate-300 font-bold -mt-2 tracking-widest leading-none">...</span>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-medium truncate">{evt.type}: {evt.details}</p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-[11px] text-slate-500 text-center py-4 font-medium">No timeline events found</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Network Topology */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 h-[340px] relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-2"><div className="p-1 rounded bg-blue-100 text-blue-600"><Terminal className="w-3.5 h-3.5" /></div> Network Topology</h3>
                            <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-1 rounded flex items-center gap-1.5 font-bold"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Live View</span>
                        </div>
                        {/* ReactFlow Topology */}
                        <div className="absolute inset-0 top-12 bottom-4">
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                nodeTypes={nodeTypes}
                                fitView
                                fitViewOptions={{ padding: 0.2 }}
                                preventScrolling={false}
                                zoomOnScroll={false}
                                zoomOnPinch={false}
                                zoomOnDoubleClick={false}
                                panOnDrag={true}
                                nodesDraggable={true}
                                nodesConnectable={false}
                                elementsSelectable={true}
                            />
                        </div>
                    </div>

                    {/* Top Risk Assets */}
                    <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 h-[290px] flex flex-col relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[12.5px] font-bold text-slate-800 flex items-center gap-2">
                                <div className="p-1 rounded bg-red-100 text-red-600"><ShieldAlert className="w-3.5 h-3.5" /></div> 
                                Top Risk Assets
                            </h3>
                            <span className="text-[11px] text-red-600 font-bold cursor-pointer">View All →</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-1">
                            {stats?.riskyAssets && stats.riskyAssets.length > 0 ? (
                                <div className="space-y-2">
                                    {stats.riskyAssets.slice(0, 6).map((asset: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-100 hover:border-red-100 hover:bg-red-50/50 transition-colors cursor-pointer">
                                            <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                                <Monitor className="w-3.5 h-3.5 text-red-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11.5px] font-bold text-slate-800 truncate">{asset.Hostname || asset.agentId || asset.name || "Unknown Asset"}</div>
                                                <div className="text-[9.5px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium truncate">
                                                    <Cpu className="w-3 h-3 text-slate-400" /> {asset.OsInfo || asset.ip || "Unknown OS"}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="text-[12px] font-black text-red-600">{asset.riskScore || asset.score || "High"}</div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Risk Score</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <ShieldCheck className="w-9 h-9 text-emerald-400 mb-2 opacity-80" />
                                    <span className="text-[12px] font-bold text-slate-700">All Assets Secure</span>
                                    <span className="text-[10px] font-medium text-slate-500 mt-0.5">No high-risk agents detected currently.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Global Fleet Geospatial Threat Map */}
                <div className="w-full h-[410px] rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                    <WorldMap agents={mapAgents} />
                </div>
            </div>
        </div>
    );
}
