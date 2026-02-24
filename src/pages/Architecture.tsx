import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Database, Activity, Heart,
    Lock,
    ShieldCheck,
    Wifi, RefreshCcw, Info, XCircle, FileText,
    CircleDashed, Radio, Server, Cpu,
    Monitor, Keyboard, MousePointer2, Globe, Mail, Printer, Clipboard, Files, MapPin
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { API_URL, SOCKET_URL } from '../config';

type ConnectionState = 'stable' | 'interrupted' | 'critical';

interface AgentReport {
    id: number;
    agentId: string;
    status: string;
    cpuUsage: number;
    memoryUsage: number;
    timestamp: string;
}

const Architecture = () => {
    const { token, user } = useAuth();
    const { theme } = useTheme();
    const [connState, setConnState] = useState<ConnectionState>('stable');
    const [showDiagnostic, setShowDiagnostic] = useState(false);
    const [isLive, setIsLive] = useState(true);
    const [agents, setAgents] = useState<AgentReport[]>([]);
    const [socketStatus, setSocketStatus] = useState<'connected' | 'disconnected'>('disconnected');
    const socketRef = useRef<any>(null);

    // Initial Fetch
    const fetchAgents = useCallback(async () => {
        try {
            const query = user?.tenantId ? `?tenantId=${user.tenantId}` : '';
            if (!token) return;
            const res = await fetch(`${API_URL}/agents${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setAgents(await res.json());
            }
        } catch (e) {
            console.error("[Architecture] Fetch error:", e);
        }
    }, [token, user?.tenantId]);

    // Socket Setup
    useEffect(() => {
        if (!token || !user?.tenantId) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            query: { token },
            transports: ['polling', 'websocket']
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setSocketStatus('connected');
            socket.emit("join_room", { room: `tenant_${user.tenantId}` });
        });

        socket.on("disconnect", () => setSocketStatus('disconnected'));

        socket.on("agent_list_update", (updatedAgent: any) => {
            setAgents(prev => {
                const index = prev.findIndex(a => a.agentId === updatedAgent.agentId);
                if (index === -1) return [...prev, updatedAgent];
                const next = [...prev];
                next[index] = { ...next[index], ...updatedAgent };
                return next;
            });
        });

        fetchAgents();

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token, user?.tenantId, fetchAgents]);

    // Live State Calculation
    useEffect(() => {
        if (!isLive) return;

        if (socketStatus === 'disconnected') {
            setConnState('interrupted');
            return;
        }

        const onlineCount = agents.filter(a => a.status.toLowerCase() === 'online').length;

        if (onlineCount > 0) {
            setConnState('stable');
        } else if (agents.length > 0) {
            setConnState('critical');
        } else {
            setConnState('stable'); // Default for fresh tenant
        }
    }, [agents, isLive, socketStatus]);

    // Auto-rotate diagnostic info if critical
    useEffect(() => {
        if (connState === 'critical') setShowDiagnostic(true);
    }, [connState]);

    const getDiagnosticInfo = () => {
        if (isLive) {
            switch (connState) {
                case 'interrupted': return {
                    title: 'WSS Connectivity Loss',
                    detail: 'Sub-second stream interrupted. Re-negotiating handshake with Nexus...',
                    code: 'SOCKET_IO_503',
                    color: 'text-amber-400'
                };
                case 'critical': return {
                    title: 'Fleet Connection Death',
                    detail: 'Database checks confirm agents exist, but 0/X are broadcasting telemetry.',
                    code: 'FLEET_OFFLINE_404',
                    color: 'text-red-400'
                };
                default: return {
                    title: 'Live Telemetry Active',
                    detail: `${agents.filter(a => a.status.toLowerCase() === 'online').length} active nodes streaming through Nexus central processing.`,
                    code: 'PROD_LINK_OK',
                    color: 'text-cyan-400'
                };
            }
        }

        switch (connState) {
            case 'interrupted': return {
                title: 'High Latency / Packet Loss',
                detail: 'Heartbeat response timed out (>5000ms). Retrying via data_queue.py buffer.',
                code: 'ERR_TIMEOUT_RETRY',
                color: 'text-amber-400'
            };
            case 'critical': return {
                title: 'Connection Refused',
                detail: 'Handshake failed: Invalid Tenant API Key or Nexus Hub is unreachable.',
                code: 'AUTH_FAILED_403',
                color: 'text-red-400'
            };
            default: return {
                title: 'Simulation Operational',
                detail: 'Encrypted telemetry flowing via HTTPS/WSS tunnels.',
                code: 'STATUS_OK_200',
                color: 'text-cyan-400'
            };
        }
    };

    const diag = getDiagnosticInfo();

    // Plan-Based Module Configuration
    const PLAN_LEVELS: Record<string, number> = {
        'Starter': 1,
        'Professional': 2,
        'Enterprise': 3
    };

    const MODULE_PLAN_REQUIREMENTS: Record<string, string> = {
        'FIM': 'Starter',
        'NET': 'Starter',
        'USB': 'Starter',
        'SEC': 'Starter',
        'SCR': 'Professional',
        'KEY': 'Professional',
        'ACT': 'Starter',
        'WEB': 'Professional',
        'MAL': 'Enterprise',
        'PRT': 'Professional',
        'CLP': 'Enterprise',
        'SHA': 'Enterprise',
        'VUL': 'Enterprise',
        'HBT': 'Starter',
        'LIV': 'Professional',
        'RSS': 'Enterprise',
        'LOC': 'Professional',
    };

    // State for Dynamic Activity Visualization
    const [activeModules, setActiveModules] = useState<Set<string>>(new Set());
    const [hoveredModule, setHoveredModule] = useState<string | null>(null);
    const [availableModules, setAvailableModules] = useState<string[]>([]);
    const [tenantPlan, setTenantPlan] = useState<string>('Starter');
    const [recentEvents, setRecentEvents] = useState<any[]>([]);
    const [recentCheckins, setRecentCheckins] = useState<any[]>([]);
    const [telemetryCount, setTelemetryCount] = useState<number>(0);
    const [handshakePulse, setHandshakePulse] = useState<boolean>(false);

    // Module Config with Descriptions for Tooltips
    const modules = [
        { id: 'FIM', name: 'File Integrity Monitor', desc: 'Real-time tracking of unauthorized file system modifications.', icon: FileText, color: 'text-orange-500', border: 'border-orange-500/30' },
        { id: 'NET', name: 'Network Analyzer', desc: 'Deep packet inspection of inbound/outbound traffic.', icon: Wifi, color: 'text-emerald-500', border: 'border-emerald-500/30' },
        { id: 'USB', name: 'Peripheral Control', desc: 'Monitors and blocks unauthorized USB/External devices.', icon: RefreshCcw, color: 'text-blue-500', border: 'border-blue-500/30' },
        { id: 'SEC', name: 'Security Policy', desc: 'Enforces system hardening and access control rules.', icon: ShieldCheck, color: 'text-red-500', border: 'border-red-500/30' },
        { id: 'SCR', name: 'Screen Recorder', desc: 'Captures user activity snapshots for forensic audit.', icon: Monitor, color: 'text-purple-500', border: 'border-purple-500/30' },
        { id: 'KEY', name: 'Keystroke Logger', desc: 'Logs keyboard input for sensitive data leak prevention.', icon: Keyboard, color: 'text-pink-500', border: 'border-pink-500/30' },
        { id: 'ACT', name: 'User Activity', desc: 'Tracks application usage and window focus time.', icon: MousePointer2, color: 'text-yellow-500', border: 'border-yellow-500/30' },
        { id: 'WEB', name: 'Web Filter', desc: 'Blocks malicious domains and tracks browsing history.', icon: Globe, color: 'text-cyan-500', border: 'border-cyan-500/30' },
        { id: 'MAL', name: 'Malware Sandbox', desc: 'Isolates and analyzes suspicious email attachments and processes.', icon: Mail, color: 'text-indigo-500', border: 'border-indigo-500/30' },
        { id: 'VUL', name: 'Vulnerability Intel', desc: 'Identifies known CVEs and software flaws across the fleet.', icon: Info, color: 'text-amber-500', border: 'border-amber-500/30' },
        { id: 'PRT', name: 'Print Spooler', desc: 'Audits physical document printing and content.', icon: Printer, color: 'text-teal-500', border: 'border-teal-500/30' },
        { id: 'CLP', name: 'Clipboard Monitor', desc: 'Prevents sensitive data copy/paste operations.', icon: Clipboard, color: 'text-lime-500', border: 'border-lime-500/30' },
        { id: 'SHA', name: 'Shadow Copy', desc: 'Maintains backup snapshots for ransomware recovery.', icon: Files, color: 'text-gray-400', border: 'border-gray-500/30' },
        { id: 'LIV', name: 'Live Desktop', desc: 'Sub-second real-time screen broadcast for active monitoring.', icon: Monitor, color: 'text-cyan-400', border: 'border-cyan-400/30' },
        { id: 'RSS', name: 'Remote Shell', desc: 'Direct encrypted CLI access to the endpoint system.', icon: Server, color: 'text-indigo-400', border: 'border-indigo-400/30' },
        { id: 'LOC', name: 'Geo-Location', desc: 'Real-time GPS and IP-based physical asset tracking.', icon: MapPin, color: 'text-violet-500', border: 'border-violet-500/30' },
        { id: 'HBT', name: 'Agent Heartbeat', desc: 'Vital sign signal indicating agent health and connectivity.', icon: Heart, color: 'text-rose-500', border: 'border-rose-500/30' },
    ];

    // Fetch Tenant Plan from Backend API
    useEffect(() => {
        const fetchTenantPlan = async () => {
            if (!token || !user?.tenantId) {
                setTenantPlan(user?.plan || 'Starter');
                return;
            }
            try {
                const response = await fetch(`${API_URL}/tenants/${user.tenantId}?t=${Date.now()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const tenant = await response.json();
                    setTenantPlan(tenant.Plan || 'Starter');
                } else {
                    setTenantPlan(user?.plan || 'Starter');
                }
            } catch (error) {
                setTenantPlan(user?.plan || 'Starter');
            }
        };
        fetchTenantPlan();
    }, [token, user?.tenantId]);

    // Filter Modules Based on Tenant Plan (from Backend)
    useEffect(() => {
        const userPlanLevel = PLAN_LEVELS[tenantPlan] || 1;

        const enabled = modules
            .filter(mod => {
                const requiredPlan = MODULE_PLAN_REQUIREMENTS[mod.id];
                const requiredLevel = PLAN_LEVELS[requiredPlan] || 1;
                return userPlanLevel >= requiredLevel;
            })
            .map(m => m.id);

        setAvailableModules(enabled);
    }, [tenantPlan]);

    // Real-time Data Listener for Dynamic Visualization
    useEffect(() => {
        if (!socketRef.current) return;

        const triggerModule = (ids: string[]) => {
            setActiveModules(prev => {
                const next = new Set(prev);
                ids.forEach(id => next.add(id));
                return next;
            });

            // Clear after delay
            setTimeout(() => {
                setActiveModules(prev => {
                    const next = new Set(prev);
                    ids.forEach(id => next.delete(id));
                    return next;
                });
            }, 1200); // Faster pulse (1.2s)
        };

        const handleActivity = (data: any) => {
            // Map Event Types to Module IDs
            const type = (data.ActivityType || '').toLowerCase();
            const proc = (data.ProcessName || '').toLowerCase();

            let targetIds: string[] = ['ACT']; // Always trigger Activity module

            if (type.includes('web') || proc.includes('chrome') || proc.includes('edge')) targetIds.push('WEB');
            if (type.includes('file') || type.includes('disk') || type.includes('modification')) targetIds.push('FIM');
            if (type.includes('net') || type.includes('connection')) targetIds.push('NET');
            if (type.includes('usb') || type.includes('drive')) targetIds.push('USB');
            if (type.includes('print')) targetIds.push('PRT');
            if (type.includes('clip')) targetIds.push('CLP');
            if (type.includes('screen') || type.includes('capture')) targetIds.push('SCR');
            if (type.includes('key') || type.includes('type')) targetIds.push('KEY'); // Fixed Mapping
            if (type.includes('shell') || data.ProcessName?.toLowerCase().includes('cmd') || data.ProcessName?.toLowerCase().includes('powershell')) targetIds.push('RSS');
            if (type.includes('live') || type.includes('stream')) targetIds.push('LIV');
            if (type.includes('location') || type.includes('gps')) targetIds.push('LOC');
            triggerModule(targetIds);

            // Add to Recent Events list (max 5)
            setRecentEvents(prev => {
                const newEv = {
                    id: Date.now(),
                    type: data.ActivityType || 'Activity',
                    process: data.ProcessName || 'System',
                    detail: data.WindowTitle || data.Url || 'Interaction',
                    timestamp: new Date().toLocaleTimeString(),
                    agentId: data.AgentId,
                    color: targetIds.includes('WEB') ? 'bg-cyan-500' : 'bg-blue-500'
                };
                return [newEv, ...prev].slice(0, 5);
            });

            // Increment Telemetry Count
            setTelemetryCount(prev => prev + 1);
        };

        const handleAlert = (data: any) => {
            // Security Alerts trigger SEC + Specific Module
            let targetIds = ['SEC'];
            const type = (data.Type || '').toLowerCase();
            const detail = (data.Details || '').toLowerCase();

            if (type.includes('usb')) targetIds.push('USB');
            if (type.includes('malware') || type.includes('virus') || type.includes('trojan')) targetIds.push('MAL');
            if (type.includes('net') || type.includes('intrusion')) targetIds.push('NET');
            if (type.includes('vulnerability') || type.includes('cve') || detail.includes('cve-')) targetIds.push('VUL');

            triggerModule(targetIds);

            // Add Security Alert to Recent Events (Priority Red/Amber)
            setRecentEvents(prev => {
                const isVuln = targetIds.includes('VUL');
                const newEv = {
                    id: Date.now(),
                    type: isVuln ? 'VULNERABILITY' : 'SECURITY ALERT',
                    process: data.Type || 'Policy',
                    detail: data.Details || 'Violation Detected',
                    timestamp: new Date().toLocaleTimeString(),
                    agentId: data.AgentId,
                    color: isVuln ? 'bg-amber-500' : 'bg-red-500'
                };
                return [newEv, ...prev].slice(0, 5);
            });

            // Increment Telemetry Count (Multiple for Alerts)
            setTelemetryCount(prev => prev + 5);
        };

        const handleBandwidth = () => {
            // Bandwidth updates strictly trigger NET
            triggerModule(['NET']);
        };

        // Network is always active if connected
        if (socketStatus === 'connected') {
            setActiveModules(prev => new Set(prev).add('HBT')); // Heartbeat always active
        }

        socketRef.current.on('new_client_activity', handleActivity);
        socketRef.current.on('new_alert', handleAlert);
        socketRef.current.on('agent_bandwidth_update', handleBandwidth);

        // Also listen for heartbeat updates to trigger HBT
        socketRef.current.on('agent_list_update', (data: any) => {
            setActiveModules(prev => new Set(prev).add('HBT').add('NET'));
            setHandshakePulse(true);

            if (data.hostname || data.agentId) {
                setRecentCheckins(prev => {
                    const id = data.hostname || data.agentId;
                    const filtered = prev.filter(c => c.id !== id);
                    return [{ id, time: new Date().toLocaleTimeString(), status: data.status || 'Online' }, ...filtered].slice(0, 3);
                });
            }

            setTimeout(() => {
                setActiveModules(prev => {
                    const next = new Set(prev);
                    next.delete('HBT');
                    return next;
                });
                setHandshakePulse(false);
            }, 2000);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.off('new_client_activity', handleActivity);
                socketRef.current.off('new_alert', handleAlert);
                socketRef.current.off('agent_bandwidth_update', handleBandwidth);
                socketRef.current.off('agent_list_update');
            }
        };
    }, [socketStatus]);

    // Layout Calculations
    // Layout Calculations
    const GRID_LEFT_X = 30;
    const GRID_TOP_Y = 190;
    const GRID_W = 60;
    const GRID_H = 60;
    const GRID_GAP = 15; // Increased gap for 3-column layout

    // Node Positions (Center/Edge Calculations)
    const AGENT_LEFT_X = 300;
    const AGENT_RIGHT_X = AGENT_LEFT_X + 320; // 620
    const AGENT_CENTER_Y = 210 + (360 / 2); // 390

    const NEXUS_LEFT_X = 660;
    const NEXUS_RIGHT_X = 660 + 350; // 1010
    const NEXUS_CENTER_X = 660 + (350 / 2); // 835
    const NEXUS_CENTER_Y = 190 + (400 / 2); // 390
    const NEXUS_BOTTOM_Y = 190 + 400; // 590

    const DB_TOP_Y = 620;
    const DB_CENTER_X = 685 + (300 / 2); // 835 (Aligned with Nexus Center)

    // SOC Command Position
    const SOC_LEFT_X = 1100;
    const SOC_CENTER_Y = 390;

    return (
        // <div className="fixed inset-0 w-screen h-screen overflow-hidden flex items-center justify-center bg-[#020408]">
        <div>

            {/* 3D ISOMETRIC WORKSPACE */}
            <div className={`relative w-full max-w-[1800px] h-[800px] bg-[#020408] border transition-all duration-1000 rounded-[60px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] ring-1 ring-white/10 flex items-center justify-center perspective-[2000px] pr-40 ${connState === 'critical' ? 'border-red-500/30' : connState === 'interrupted' ? 'border-amber-500/30' : 'border-white/10'}`}>

                {/* INTERNAL HEADER - Integrated inside 3D Container */}
                <div className="absolute top-0 left-0 w-full p-10 z-50 flex justify-between items-start pointer-events-auto">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 uppercase">
                            Isometric Intelligence v8.3.51
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium flex items-center gap-4 text-sm uppercase tracking-[0.3em]">
                            <Activity className="w-5 h-5 text-cyan-500" />
                            {isLive ? 'Real-time Production 3D Twin' : 'Simulated Diagnostic Prototype'}
                        </p>
                    </div>

                    <div className="flex bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl">
                        <button
                            onClick={() => setIsLive(true)}
                            className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${isLive ? 'bg-cyan-500 text-black shadow-[0_0_30px_rgba(6,182,212,0.4)]' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Radio className={`w-4 h-4 ${isLive ? 'animate-pulse' : ''}`} /> Live Data
                        </button>
                        <button
                            onClick={() => setIsLive(false)}
                            className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${!isLive ? 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(79,70,229,0.4)]' : 'text-gray-500 hover:text-white'}`}
                        >
                            <CircleDashed className="w-4 h-4" /> Simulation
                        </button>
                    </div>
                </div>

                {/* 3D Container Transform - Flattened to Straight Angle */}
                <div className="relative w-[1600px] h-[750px] transition-transform duration-1000 ease-out" style={{
                    transform: 'none',
                    transformStyle: 'preserve-3d'
                }}>

                    {/* SVG Data Flow Plane - MOVED TO Z=10px TO BEHIND NODES (Z=20px) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ transform: 'translateZ(10px)' }}>
                        <defs>
                            <filter id="glow-v8">
                                <feGaussianBlur stdDeviation="5" result="blur" />
                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                            <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
                                <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* FLOW: SUB-NODES -> AGENT */}
                        {modules.map((mod, i) => {
                            const col = i % 3; // Use 3 columns for 6 rows
                            const row = Math.floor(i / 3);
                            const startX = GRID_LEFT_X + (col * (GRID_W + GRID_GAP)) + (GRID_W / 2);
                            const startY = GRID_TOP_Y + (row * (GRID_H + GRID_GAP)) + (GRID_H / 2);
                            const targetX = 300;
                            const targetY = 390;

                            const cp1x = startX + 50;
                            const cp1y = startY;
                            const cp2x = targetX - 50;
                            const cp2y = targetY;

                            const isActive = activeModules.has(mod.id);

                            return (
                                <g key={mod.id}>
                                    <path
                                        d={`M ${startX} ${startY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${targetX} ${targetY}`}
                                        stroke={isActive ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.05)"}
                                        strokeWidth={isActive ? "2" : "1"}
                                        fill="none"
                                        className="transition-all duration-1000"
                                    />
                                    {isActive && <circle cx={targetX} cy={targetY} r="2" fill="rgba(34,211,238,0.8)" filter="url(#glow-v8)" />}
                                </g>
                            );
                        })}

                        {/* Active Data Particles */}
                        {/* Active Data Particles - Dynamic from Modules to Agent */}
                        {connState === 'stable' && modules.map((mod, i) => {
                            // Only animate if the module is ACTIVE
                            if (!activeModules.has(mod.id)) return null;

                            const col = i % 3;
                            const row = Math.floor(i / 3);
                            const startX = GRID_LEFT_X + (col * (GRID_W + GRID_GAP)) + (GRID_W / 2);
                            const startY = GRID_TOP_Y + (row * (GRID_H + GRID_GAP)) + (GRID_H / 2);
                            const targetX = 300;
                            const targetY = 390;
                            const cp1x = startX + 50;
                            const cp1y = startY;
                            const cp2x = targetX - 50;
                            const cp2y = targetY;

                            // Staggered timing based on index
                            const dur = 2 + (i % 3); // 2s, 3s, 4s durations

                            return (
                                <circle key={`p-${i}`} r={i % 4 === 0 ? 5 : 3} fill={mod.id === 'SEC' || mod.id === 'MAL' ? '#ef4444' : '#22d3ee'} filter="url(#glow-v8)" opacity={0.9}>
                                    <animateMotion
                                        dur={`${dur * 0.5}s`} // FAST Flow (Double Speed)
                                        begin="0s"
                                        repeatCount="indefinite"
                                        path={`M ${startX} ${startY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${targetX} ${targetY}`}
                                    />
                                </circle>
                            );
                        })}


                        {/* FLOW 1: Agent -> Nexus */}
                        {/* Connects Agent Right Edge to Nexus Left Edge */}
                        <path id="path1" d={`M ${AGENT_RIGHT_X} ${AGENT_CENTER_Y} L ${NEXUS_LEFT_X} ${AGENT_CENTER_Y}`} stroke={handshakePulse ? "rgba(34,211,238,0.8)" : "rgba(34,211,238,0.3)"} strokeWidth={handshakePulse ? "5" : "3"} fill="none" className="transition-all duration-300" />
                        {(connState === 'stable' || handshakePulse) && (
                            <>
                                {/* Primary Telemetry Stream */}
                                <circle r={handshakePulse ? "8" : "6"} fill={handshakePulse ? "#fff" : "#22d3ee"} filter="url(#glow-v8)">
                                    <animateMotion dur={handshakePulse ? "0.5s" : "2s"} repeatCount={handshakePulse ? "3" : "indefinite"} path={`M ${AGENT_RIGHT_X} ${AGENT_CENTER_Y} L ${NEXUS_LEFT_X} ${AGENT_CENTER_Y}`} />
                                </circle>
                            </>
                        )}

                        {/* FLOW 2: Nexus -> DB (Async Write) */}
                        {/* Connects Nexus Bottom to DB Top */}
                        <path id="path2" d={`M ${NEXUS_CENTER_X} ${NEXUS_BOTTOM_Y} L ${DB_CENTER_X} ${DB_TOP_Y}`} stroke="rgba(79,70,229,0.3)" strokeWidth="3" fill="none" />
                        {connState === 'stable' && (
                            <circle r="6" fill="#6366f1" filter="url(#glow-v8)">
                                <animateMotion dur="1.5s" repeatCount="indefinite" path={`M ${NEXUS_CENTER_X} ${NEXUS_BOTTOM_Y} L ${DB_CENTER_X} ${DB_TOP_Y}`} />
                            </circle>
                        )}

                        {/* FLOW 3: Nexus -> SOC (API/Stream Delivery) */}
                        {/* Connects Nexus Right to SOC Left - HORIZONTAL ALIGNMENT @ 90px GAP */}
                        <path id="path3" d={`M ${NEXUS_RIGHT_X} ${NEXUS_CENTER_Y} L ${SOC_LEFT_X} ${SOC_CENTER_Y}`} stroke="rgba(236,72,153,0.4)" strokeWidth="3" fill="none" />
                        {connState === 'stable' && (
                            <circle r="6" fill="#ec4899" filter="url(#glow-v8)">
                                <animateMotion dur="0.8s" repeatCount="indefinite" path={`M ${NEXUS_RIGHT_X} ${NEXUS_CENTER_Y} L ${SOC_LEFT_X} ${SOC_CENTER_Y}`} />
                            </circle>
                        )}
                    </svg>

                    {/* --- SUB-NODES (LEFT GRID) --- */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none perspective-[1000px]">
                        {modules.map((mod, i) => {
                            const col = i % 3;
                            const row = Math.floor(i / 3);
                            const left = GRID_LEFT_X + (col * (GRID_W + GRID_GAP));
                            const top = GRID_TOP_Y + (row * (GRID_H + GRID_GAP));

                            return (
                                <div
                                    key={mod.id}
                                    onMouseEnter={() => !availableModules.includes(mod.id) ? null : setHoveredModule(mod.id)}
                                    onMouseLeave={() => setHoveredModule(null)}
                                    className={`absolute w-[60px] h-[60px] bg-black/40 border ${mod.border} rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg transform transition-transform cursor-pointer pointer-events-auto group isolate 
                                    ${hoveredModule === mod.id ? 'z-[999]' : 'z-10'} 
                                    ${!availableModules.includes(mod.id) ? 'opacity-40 grayscale-[0.8] cursor-not-allowed hover:scale-100' : 'hover:scale-110 active:scale-95'}`}
                                    style={{
                                        left: `${left}px`,
                                        top: `${top}px`,
                                        transform: 'translateZ(20px)'
                                    }}
                                >
                                    <mod.icon className={`w-6 h-6 transition-all duration-300 ${activeModules.has(mod.id) ? mod.color : 'text-gray-400 opacity-60 blur-[1px]'}`} />
                                    <span className="text-[9px] font-bold text-gray-300 tracking-wider">{mod.id}</span>

                                    {/* Lock Icon for Disabled Modules */}
                                    {!availableModules.includes(mod.id) && (
                                        <div className="absolute top-1 right-1">
                                            <Lock className="w-3 h-3 text-red-500" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>


                    {/* --- NODE 1: 3D ENDPOINT AGENT (FRONT LEFT) --- */}
                    {/* FLATTENED TO Z=50px, SHIFTED TO TOP 210, H 360, LEFT 450 */}
                    <div className="absolute top-[210px] left-[300px] w-[320px] h-[360px] transition-all duration-1000" style={{ transform: 'translateZ(50px)' }}>
                        <div className={`w-full h-full bg-white/[0.03] border-2 backdrop-blur-sm rounded-[40px] p-8 flex flex-col gap-6 shadow-[0_30px_60px_rgba(0,0,0,0.5)] ${connState === 'stable' ? 'border-cyan-500/30' : 'border-red-500/30'}`}>
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-cyan-500/10 rounded-2xl">
                                    <Cpu className="w-8 h-8 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">Endpoint Agent</h3>
                                    <span className="text-[10px] text-cyan-400/60 font-black tracking-widest uppercase">Telemetry Source</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                    <div className="text-[8px] text-gray-500 uppercase font-black mb-1">Fleet</div>
                                    <div className="text-2xl font-black text-white">{agents.length}</div>
                                </div>
                                <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                    <div className="text-[8px] text-gray-500 uppercase font-black mb-1">Live</div>
                                    <div className="text-2xl font-black text-cyan-400">{agents.filter(a => a.status.toLowerCase() === 'online').length}</div>
                                </div>
                            </div>

                            <div className="space-y-2 mt-2">
                                <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Recent Check-ins</div>
                                {recentCheckins.length === 0 ? (
                                    <div className="text-[10px] text-gray-600 italic">Listening for handshake...</div>
                                ) : (
                                    recentCheckins.map((c: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between bg-black/20 p-2 rounded-xl border border-white/5 animate-in fade-in slide-in-from-left-2 transition-all">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></div>
                                                <span className="text-[10px] font-bold text-white truncate max-w-[120px]">{c.id}</span>
                                            </div>
                                            <span className="text-[9px] text-cyan-400/50 font-mono tracking-tighter">{c.time}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-auto p-5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-[30px] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-cyan-400" />
                                    <span className="text-xs font-bold text-white uppercase">Active</span>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${connState === 'stable' ? 'bg-cyan-400 animate-pulse shadow-[0_0_15px_#22d3ee]' : 'bg-red-500'}`}></div>
                            </div>
                        </div>
                    </div>

                    {/* --- NODE 2: 3D NEXUS CORE (CENTER) --- */}
                    {/* FLATTENED TO Z=50px, SHIFTED TO TOP 190, H 400, LEFT 810 */}
                    <div className="absolute top-[190px] left-[660px] w-[350px] h-[400px] transition-all duration-1000" style={{ transform: 'translateZ(50px)' }}>
                        <div className="absolute inset-0 bg-indigo-600/20 blur-[100px] opacity-20"></div>
                        <div className="w-full h-full bg-indigo-500/[0.05] border-2 border-indigo-500/30 backdrop-blur-sm rounded-[50px] p-8 flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">Nexus Hub</h3>
                                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Central Processing</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full h-full">
                                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 group hover:bg-indigo-500/20 transition-all">
                                    <Server className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                                    <div className="text-center">
                                        <div className="text-xs font-black text-white">API</div>
                                        <div className="text-[8px] text-white/50 uppercase">FastAPI</div>
                                    </div>
                                </div>
                                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 group hover:bg-indigo-500/20 transition-all">
                                    <RefreshCcw className="w-6 h-6 text-emerald-400 group-hover:rotate-180 transition-transform duration-700" />
                                    <div className="text-center">
                                        <div className="text-xs font-black text-white">TELEMETRY</div>
                                        <div className="text-[8px] text-white/50 uppercase">{telemetryCount} processed</div>
                                    </div>
                                </div>
                                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 group hover:bg-indigo-500/20 transition-all">
                                    <Lock className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" />
                                    <div className="text-center">
                                        <div className="text-xs font-black text-white">GUARD</div>
                                        <div className="text-[8px] text-white/50 uppercase">JWT Auth</div>
                                    </div>
                                </div>
                                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 group hover:bg-indigo-500/20 transition-all">
                                    <Cpu className="w-6 h-6 text-orange-400 group-hover:scale-110 transition-transform" />
                                    <div className="text-center">
                                        <div className="text-xs font-black text-white">REALTIME</div>
                                        <div className="text-[8px] text-white/50 uppercase">{recentEvents.length > 0 ? 'ACTIVE' : 'IDLE'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- NODE 3: 3D APP DATABASE (BOTTOM CENTER) --- */}
                    {/* FLATTENED TO Z=50px, SHIFTED TO LEFT 835 (Center 985) */}
                    <div className="absolute top-[620px] left-[685px] w-[300px] h-[120px] transition-all duration-1000" style={{ transform: 'translateZ(50px)' }}>
                        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black border-2 border-white/5 rounded-[30px] p-6 flex flex-col justify-center gap-2 shadow-2xl">
                            <div className="flex items-center gap-4">
                                <Database className={`w-10 h-10 ${connState === 'stable' ? 'text-indigo-400' : 'text-gray-600'}`} />
                                <div>
                                    <div className="text-sm font-black text-white uppercase">AppDB (Persistence)</div>
                                    <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Async Write Commit</div>
                                </div>
                            </div>
                            <div className="flex gap-1 mt-2">
                                {[...Array(8)].map(() => (
                                    <div key={Math.random()} className={`h-1.5 flex-1 rounded-full ${connState === 'stable' ? 'bg-cyan-500' : 'bg-red-500/20'}`}></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- NODE 4: 3D SOC COMMAND (BACK RIGHT) --- */}
                    {/* FLATTENED TO Z=50px, SHIFTED TO X=1250 */}
                    <div className="absolute top-[65px] left-[1100px] w-[350px] h-[520px] transition-all duration-1000" style={{ transform: 'translateZ(50px)' }}>
                        <div className="w-full h-full bg-[#0d1117] border-4 border-white/10 rounded-[50px] p-8 flex flex-col gap-6 shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-8">
                                <Activity className="w-12 h-12 text-indigo-500/30" />
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">User interface</span>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">SOC Command</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="text-[10px] text-white/60 font-mono">FIM: <span className="text-orange-400">ACTIVE</span></div>
                                <div className="text-[10px] text-white/60 font-mono">NET: <span className="text-emerald-400">SCANNING</span></div>
                                <div className="text-[10px] text-white/60 font-mono">SEC: <span className="text-red-400">LOCKED</span></div>
                                <div className="text-[10px] text-white/60 font-mono">VUL: <span className="text-amber-400">AUDITING</span></div>
                                <div className="text-[10px] text-white/60 font-mono">MAL: <span className="text-indigo-400">ISOLATED</span></div>
                                <div className="text-[10px] text-white/60 font-mono">HBT: <span className="text-rose-400">SYNCED</span></div>
                            </div>

                            <div className="space-y-3">
                                {recentEvents.length === 0 ? (
                                    <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-30">
                                        <CircleDashed className="w-10 h-10 text-gray-500 mx-auto mb-2 animate-spin-slow" />
                                        <span className="text-[10px] font-black uppercase text-gray-500">Awaiting Telemetry...</span>
                                    </div>
                                ) : (
                                    recentEvents.map((ev) => (
                                        <div key={ev.id} className={`p-3 bg-white/[0.03] border ${ev.type === 'VULNERABILITY' || ev.type === 'SECURITY ALERT' ? 'border-red-500/20 animate-pulse' : 'border-white/10'} rounded-2xl flex items-center justify-between hover:bg-white/[0.05] transition-all animate-in fade-in slide-in-from-right-4`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 ${ev.color} rounded-xl flex items-center justify-center text-white shadow-lg ${ev.type === 'VULNERABILITY' || ev.type === 'SECURITY ALERT' ? 'animate-bounce' : ''}`}>
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="text-sm font-black text-white truncate max-w-[150px]">{ev.process}</div>
                                                    <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest truncate max-w-[180px]">{ev.detail}</div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-cyan-400/50 font-mono">{ev.timestamp.split(' ')[0]}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Diagnostic Mirror */}
                        <div className={`absolute inset-0 bg-black/80 backdrop-blur-md rounded-[50px] transition-all duration-700 flex flex-col p-10 gap-8 ${showDiagnostic ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
                            <div className="flex justify-between items-center">
                                <div className={`p-4 rounded-3xl ${connState === 'critical' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                                    <Info className={`w-10 h-10 ${diag.color}`} />
                                </div>
                                <button onClick={() => setShowDiagnostic(false)} className="p-3 hover:bg-white/5 rounded-full transition-colors text-white/50">
                                    <XCircle className="w-8 h-8" />
                                </button>
                            </div>
                            <div>
                                <h4 className={`text-3xl font-black uppercase tracking-tighter mb-4 ${diag.color}`}>{diag.title}</h4>
                                <p className="text-gray-400 text-sm font-medium leading-relaxed">{diag.detail}</p>
                            </div>
                            <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[10px] font-black text-gray-600 tracking-widest uppercase">Code: {diag.code}</span>
                                <button onClick={() => fetchAgents()} className="text-cyan-400 text-xs font-black uppercase hover:underline">Retry Link</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Perspective Legend Footer - Moved to Bottom Right */}
                <div className="absolute bottom-8 right-8 flex items-center gap-6 bg-black/60 backdrop-blur-sm border border-white/10 px-6 py-4 rounded-2xl shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${connState === 'critical' ? 'bg-red-500' : 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'}`}></div>
                        <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">Digital Twin Active</span>
                    </div>
                    <div className="w-px h-6 bg-white/20"></div>
                    <div className="flex items-center gap-3">
                        <RefreshCcw className={`w-4 h-4 ${socketStatus === 'connected' ? 'text-emerald-400' : 'text-white/20'}`} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {socketStatus === 'connected' ? 'SUBSYSTEM_SYNC_200' : 'LINK_TIMEOUT_503'}
                        </span>
                    </div>
                </div>
            </div>

            {/* --- TOOLTIPS LAYER (OUTSIDE 3D CONTAINER FOR PROPER Z-INDEX) --- */}
            {hoveredModule && (
                <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999999999 }}>
                    {modules.map((mod, i) => {
                        if (hoveredModule !== mod.id) return null;

                        const col = i % 3;
                        const row = Math.floor(i / 3);
                        const left = GRID_LEFT_X + (col * (GRID_W + GRID_GAP));
                        const top = GRID_TOP_Y + (row * (GRID_H + GRID_GAP));

                        return (
                            <div
                                key={`tooltip-${mod.id}`}
                                className="absolute pointer-events-none"
                                style={{
                                    left: `${left + 70}px`,
                                    top: `${top + 10}px`
                                }}
                            >
                                {/* Background Layer - THEME AWARE */}
                                <div
                                    className="absolute inset-0 w-[240px] rounded-xl border-2 shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
                                    style={{
                                        backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 1)' : 'rgba(15, 23, 42, 1)',
                                        background: theme === 'dark' ? '#FFFFFF' : '#0F172A',
                                        opacity: '1',
                                        zIndex: 1,
                                        backdropFilter: 'none',
                                        WebkitBackdropFilter: 'none',
                                        isolation: 'isolate',
                                        borderColor: !availableModules.includes(mod.id) ? '#ef4444' : '#06b6d4'
                                    }}
                                />

                                {/* Content Layer */}
                                <div className="relative z-10 w-[240px] p-4">
                                    {!availableModules.includes(mod.id) ? (
                                        // Locked Module - Upgrade Required
                                        <>
                                            <div className={`flex items-center gap-3 mb-2 pb-2 ${theme === 'dark' ? 'border-b border-red-200' : 'border-b border-red-700'}`}>
                                                <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-red-100' : 'bg-red-900'}`}>
                                                    <Lock className="w-5 h-5 text-red-500" />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-wider text-red-500">{mod.id}</span>
                                            </div>
                                            <h4 className={`font-bold text-sm mb-1 ${theme === 'dark' ? 'text-gray-900' : 'text-gray-100'}`}>{mod.name}</h4>
                                            <p className={`text-xs leading-relaxed font-medium mb-3 ${theme === 'dark' ? 'text-gray-700' : 'text-gray-300'}`}>{mod.desc}</p>
                                            <div className={`mt-3 p-2 rounded-lg ${theme === 'dark' ? 'bg-red-50' : 'bg-red-900/30'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Lock className="w-3 h-3 text-red-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Upgrade Required</span>
                                                </div>
                                                <p className={`text-[10px] leading-relaxed ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    This module requires <b>{MODULE_PLAN_REQUIREMENTS[mod.id]} Plan</b> or higher.
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        // Available Module - Normal Info
                                        <>
                                            <div className={`flex items-center gap-3 mb-2 pb-2 ${theme === 'dark' ? 'border-b border-gray-200' : 'border-b border-gray-700'}`}>
                                                <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-gray-100' : 'bg-gray-800'}`}>
                                                    <mod.icon className={`w-5 h-5 ${mod.color}`} />
                                                </div>
                                                <span className={`text-xs font-black uppercase tracking-wider ${mod.color}`}>{mod.id}</span>
                                            </div>
                                            <h4 className={`font-bold text-sm mb-1 ${theme === 'dark' ? 'text-gray-900' : 'text-gray-100'}`}>{mod.name}</h4>
                                            <p className={`text-xs leading-relaxed font-medium ${theme === 'dark' ? 'text-gray-700' : 'text-gray-300'}`}>{mod.desc}</p>
                                            <div className={`mt-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${activeModules.has(mod.id) ? (theme === 'dark' ? 'text-emerald-600' : 'text-emerald-400') : (theme === 'dark' ? 'text-red-600' : 'text-red-400')}`}>
                                                <div className={`w-2 h-2 rounded-full ${activeModules.has(mod.id) ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                                {activeModules.has(mod.id) ? 'ACTIVE • COLLECTING' : 'INACTIVE • NO SIGNAL'}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin 10s linear infinite; }
            `}</style>
        </div>
    );
};

export default Architecture;
