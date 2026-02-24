import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend
} from 'recharts';
import { ArrowLeft, Monitor, ShieldAlert, Cpu, Play, Square, BarChart2, Video, Calendar } from 'lucide-react';
import { API_URL, SOCKET_URL } from '../config';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// ... (Rest of imports or interfaces if needed, keeping AgentReport)

interface AgentReport {
    agentId: string;
    hostname: string;
    status: string;
    cpuUsage: number;
    memoryUsage: number;
    timestamp: string;
}

export default function LiveMonitor() {
    const { token, user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedAgentId = searchParams.get('agentId');

    // State
    const [reports, setReports] = useState<AgentReport[]>([]);
    const [events, setEvents] = useState<Record<string, any[]>>({});
    const [history] = useState<any[]>([]);
    const [screens] = useState<Record<string, boolean>>({});
    const [isStreamActive, setIsStreamActive] = useState(false);
    const [activeTab, setActiveTab] = useState<'stream' | 'analytics'>('stream');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setHours(d.getHours() - 24);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const setQuickFilter = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    // Refs
    const socketRef = useRef<Socket | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    // Fetch Agents Loop (Grid View)
    useEffect(() => {
        const fetchAgents = async () => {
            if (!token) return;
            try {
                const query = user?.tenantId ? `?tenantId=${user.tenantId}` : '';
                const res = await fetch(`${API_URL}/status${query}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setReports(data.map((a: any) => ({
                        agentId: a.agentId || a.AgentId,
                        hostname: a.hostname || a.Hostname,
                        status: a.status || a.Status,
                        cpuUsage: a.cpuUsage ?? a.CpuUsage,
                        memoryUsage: a.memoryUsage ?? a.MemoryUsage,
                        timestamp: a.timestamp || a.Timestamp
                    })).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
                }
            } catch (e) {
                console.error("Failed to fetch status", e);
            }
        };

        fetchAgents();
        const interval = setInterval(fetchAgents, 5000);
        return () => clearInterval(interval);
    }, [token, user]);

    // Socket & History Connection
    useEffect(() => {
        if (!selectedAgentId || !token) return;

        // 1. Fetch History
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate + "T00:00:00");
        if (endDate) params.append('end_date', endDate + "T23:59:59");

        fetch(`${API_URL}/events/${selectedAgentId}?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setEvents(prev => ({ ...prev, [selectedAgentId]: data }));
                }
            })
            .catch(err => console.error("Failed to fetch event history:", err));

        // 2. Connect Socket
        console.log("[LiveMonitor] Connecting Socket for:", selectedAgentId);
        const socket = io(SOCKET_URL, {
            path: "/socket.io",
            transports: ['websocket'],
            auth: { token }
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log("Socket Connected");
            socket.emit('join', { room: selectedAgentId });
        });

        // Live Stream Frames
        socket.on('stream_frame', (data) => {
            if (imgRef.current && data.image) {
                imgRef.current.src = "data:image/jpeg;base64," + data.image;
            }
        });

        // Event Stream
        socket.on('new_event', (evt) => {
            setEvents(prev => ({
                ...prev,
                [selectedAgentId]: [evt, ...(prev[selectedAgentId] || [])].slice(0, 100)
            }));
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [selectedAgentId, token, startDate, endDate]);


    // Stream Handlers
    const handleStartStream = () => {
        if (socketRef.current && selectedAgentId) {
            console.log(`[LiveMonitor] Manual Start Stream: ${selectedAgentId}`);
            socketRef.current.emit('start_stream', { agentId: selectedAgentId });
            setIsStreamActive(true);
        }
    };

    const handleStopStream = () => {
        if (socketRef.current && selectedAgentId) {
            console.log(`[LiveMonitor] Manual Stop Stream: ${selectedAgentId}`);
            socketRef.current.emit('stop_stream', { agentId: selectedAgentId });
            setIsStreamActive(false);
            if (imgRef.current) {
                imgRef.current.src = "";
            }
        }
    };

    // Analytics Helper
    const analyticsData = useMemo(() => {
        const agentEvents = events[selectedAgentId || ''] || [];

        // 1. By Type (Pie)
        const typeCounts: Record<string, number> = {};
        agentEvents.forEach((e: any) => {
            const t = e.Type || e.type || "Unknown";
            typeCounts[t] = (typeCounts[t] || 0) + 1;
        });
        const pieData = Object.keys(typeCounts).map(k => ({ name: k, value: typeCounts[k] }));

        // 2. Over Time (Bar/Area) - Last 24h bucketed by Hour
        // Since we only fetch 100, we might group by minute if recent, or hour if spread.
        // Let's simple group by Hour string
        const timeCounts: Record<string, number> = {};
        agentEvents.forEach((e: any) => {
            const ts = new Date(e.Timestamp || e.timestamp);
            const key = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            timeCounts[key] = (timeCounts[key] || 0) + 1;
        });
        // Sort by time (tricky with strings, but better than nothing)
        const lineData = Object.keys(timeCounts)
            .sort() // Rough sort
            .slice(-20) // Last 20 data points
            .map(k => ({ time: k, count: timeCounts[k] }));

        return { pieData, lineData, total: agentEvents.length };
    }, [events, selectedAgentId]);

    const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];


    // --- RENDER ---

    if (selectedAgentId) {
        // --- SINGLE AGENT VIEW ---
        return (
            <div className="flex flex-col h-full text-gray-900 dark:text-white p-6 overflow-hidden transition-colors">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSearchParams({})} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <ArrowLeft size={20} /> Back
                        </button>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Monitor size={20} className="text-blue-500" />
                            {selectedAgentId}
                        </h2>
                    </div>

                    {/* TABS */}
                    <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1 border border-gray-300 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('stream')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'stream' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Video size={16} /> Live Stream
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <BarChart2 size={16} /> Analytics
                        </button>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">

                    {activeTab === 'stream' ? (
                        <>
                            {/* LEFT COL: Stream & Stats */}
                            <div className="lg:col-span-2 flex flex-col gap-6">
                                {/* Live Screen */}
                                <div className="bg-black border border-gray-700 rounded-xl overflow-hidden shadow-2xl relative aspect-video group">
                                    <img
                                        ref={imgRef}
                                        className="w-full h-full object-contain bg-black"
                                        alt="Live Stream"
                                    />
                                    {/* Controls Overlay */}
                                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                                        <div className={`text-xs px-2 py-1 rounded shadow text-white flex items-center gap-2 ${screens[selectedAgentId] ? 'bg-red-600 animate-pulse' : 'bg-gray-600'}`}>
                                            {screens[selectedAgentId] ? 'LIVE' : 'IDLE'}
                                        </div>
                                    </div>

                                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button
                                            onClick={handleStartStream}
                                            disabled={isStreamActive}
                                            className={`px-3 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition-all ${isStreamActive ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-500 shadow-lg'}`}
                                        >
                                            <Play size={14} fill={!isStreamActive ? "currentColor" : "none"} /> Connect
                                        </button>
                                        <button
                                            onClick={handleStopStream}
                                            disabled={!isStreamActive}
                                            className={`px-3 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition-all ${!isStreamActive ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-500 shadow-lg'}`}
                                        >
                                            <Square size={14} fill={isStreamActive ? "currentColor" : "none"} /> Disconnect
                                        </button>
                                    </div>
                                </div>

                                {/* Performance Chart */}
                                <div className="glass-panel rounded-xl p-6 shadow-sm">
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Cpu size={18} className="text-purple-400" /> Live Performance Data</h3>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                            <LineChart data={history}>
                                                <XAxis dataKey="time" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
                                                <YAxis stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
                                                <Line type="monotone" dataKey="cpu" stroke="#EF4444" strokeWidth={2} dot={false} name="CPU %" isAnimationActive={false} />
                                                <Line type="monotone" dataKey="mem" stroke="#3B82F6" strokeWidth={2} dot={false} name="RAM %" isAnimationActive={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* ANALYTICS TAB CONTENT */
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
                            {/* 1. PIE CHART */}
                            <div className="glass-panel border-gray-200 dark:border-gray-700/50 rounded-xl p-6 flex flex-col items-center shadow-lg">
                                <h3 className="text-lg font-bold mb-4 self-start text-gray-900 dark:text-white">Event Distribution</h3>
                                <div className="w-full h-64 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analyticsData.pieData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {analyticsData.pieData.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{analyticsData.total}</span>
                                        <span className="text-xs text-gray-500 uppercase">Events</span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. BAR CHART (Top Events) */}
                            <div className="glass-panel border-gray-200 dark:border-gray-700/50 rounded-xl p-6 shadow-lg">
                                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Event Frequency</h3>
                                <div className="w-full h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analyticsData.pieData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                            <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20}>
                                                {analyticsData.pieData.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* 3. AREA CHART (Timeline) */}
                            <div className="glass-panel border-gray-200 dark:border-gray-700/50 rounded-xl p-6 md:col-span-2 shadow-lg">
                                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Event Velocity (Last 100)</h3>
                                <div className="w-full h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analyticsData.lineData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                            <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }} cursor={false} />
                                            <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RIGHT COL: Event Log */}
                    <div className="glass-panel border-gray-200 dark:border-gray-700/50 rounded-xl p-0 flex flex-col h-full lg:h-auto overflow-hidden shadow-lg">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 bg-gray-50/10 dark:bg-black/20">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                    <ShieldAlert size={18} className="text-red-400" /> Event Feed
                                </h3>
                            </div>

                            {/* Simulate Event Button (Top of stack) */}
                            <button
                                onClick={async () => {
                                    try {
                                        // Use a default agent ID for simulation if none selected, or the selected one
                                        const targetId = selectedAgentId || 'vmi3011362-root-F39F2ABC';
                                        const res = await fetch(`${API_URL}/events/simulate/${targetId}`, {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        if (res.ok) {
                                            toast.success("Event Simulated!");
                                        }
                                    } catch (e) { console.error(e); }
                                }}
                                className="w-full mb-3 px-3 py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 text-xs font-bold border border-red-600/50 transition-colors flex items-center justify-center gap-2"
                            >
                                <ShieldAlert size={14} /> Simulate Event
                            </button>

                            {/* Standardized Filtering UI (Stacked) */}
                            <div className="flex flex-col gap-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex bg-gray-200 dark:bg-gray-800 rounded p-1 shadow-inner">
                                        <button onClick={() => setQuickFilter(1)} className={`text-[10px] px-3 py-1 rounded transition-colors font-bold ${startDate === new Date(Date.now() - 86400000).toISOString().split('T')[0] ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-200'}`}>24H</button>
                                        <button onClick={() => setQuickFilter(7)} className={`text-[10px] px-3 py-1 rounded transition-colors font-bold ${startDate === new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-200'}`}>7D</button>
                                        <button onClick={() => setQuickFilter(30)} className={`text-[10px] px-3 py-1 rounded transition-colors font-bold ${startDate === new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0] ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-200'}`}>30D</button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setStartDate('');
                                            setEndDate('');
                                        }}
                                        className="text-[10px] text-gray-500 hover:text-red-500 font-bold px-2 uppercase tracking-wide"
                                    >
                                        Clear
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 bg-gray-200/50 dark:bg-gray-800/50 p-2 rounded border border-gray-300 dark:border-gray-700/50">
                                    <Calendar size={14} className="text-gray-500" />
                                    <div className="flex flex-col flex-1 gap-1">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-transparent text-[11px] text-gray-600 dark:text-gray-300 outline-none w-full"
                                        />
                                        <div className="h-px bg-gray-300 dark:bg-gray-700 w-full my-0.5"></div>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-transparent text-[11px] text-gray-600 dark:text-gray-300 outline-none w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                            {startDate && (
                                <div className="mt-1">
                                    <span className="text-[10px] bg-blue-500/10 text-blue-500 px-3 py-1 rounded border border-blue-500/20 font-bold uppercase tracking-wider block w-full text-center">
                                        Showing: {startDate.split('-').reverse().join('-')} to {endDate.split('-').reverse().join('-')}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs custom-scrollbar">
                            {events[selectedAgentId]?.map((evt, i) => (
                                <div key={i} className="p-2 bg-gray-100 dark:bg-black/30 rounded border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
                                    <div className="flex justify-between text-gray-500 mb-1">
                                        <span>{new Date(evt.timestamp || evt.Timestamp).toLocaleTimeString()}</span>
                                        <span className={`font-bold ${(evt.type || evt.Type || "").includes('Block') ? 'text-red-600 dark:text-red-500' :
                                            (evt.type || evt.Type || "").includes('Error') ? 'text-yellow-600 dark:text-yellow-500' : 'text-blue-600 dark:text-blue-400'
                                            }`}>{evt.type || evt.Type}</span>
                                    </div>
                                    <div className="text-gray-700 dark:text-gray-300 break-all">{evt.details || evt.Details}</div>
                                    {evt.type === 'Process Started' && (evt.details || "").includes('PID:') && (
                                        <button
                                            onClick={() => {
                                                const pid = parseInt((evt.details || "").match(/PID: (\d+)/)?.[1] || "0");
                                                if (pid && socketRef.current) socketRef.current.emit("KillProcess", { target: pid, agentId: selectedAgentId });
                                            }}
                                            className="mt-2 w-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-500 py-1 rounded text-center uppercase tracking-wider font-bold transition-colors"
                                        >
                                            Kill Process
                                        </button>
                                    )}
                                </div>
                            ))}
                            {(!events[selectedAgentId] || events[selectedAgentId].length === 0) && (
                                <div className="text-center text-gray-500 dark:text-gray-600 py-10">No recent events recorded.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- GRID VIEW (Default) ---
    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Monitor</h1>
                <div className="flex gap-2">
                    <span className="bg-green-500/10 text-green-600 dark:text-green-500 px-3 py-1 rounded-full text-sm border border-green-500/20 animate-pulse">
                        System Online
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map(report => (
                    <div key={report.agentId} className="glass-panel rounded-lg p-6 border-gray-200 dark:border-gray-700/50 shadow-xl hover:border-cyan-500/50 transition-colors">
                        <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setSearchParams({ agentId: report.agentId })}>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex flex-col group">
                                <div className="flex items-center gap-2">
                                    {report.agentId}
                                    <ArrowLeft className="rotate-180 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 dark:text-blue-400" size={16} />
                                </div>
                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 font-normal">{report.hostname || 'Unknown Host'}</span>
                            </h2>
                            <span className={`px-3 py-1 rounded-full text-sm ${report.status === 'Running' || report.status === 'Online' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
                                {report.status}
                            </span>
                        </div>

                        {/* Status Summary */}
                        <div className="mb-6 grid grid-cols-2 gap-4">
                            <div className="bg-gray-50/50 dark:bg-black/30 rounded p-4 border border-gray-200 dark:border-gray-700/50 text-center">
                                <span className="text-gray-500 text-xs uppercase">CPU</span>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{(report.cpuUsage || 0).toFixed(1)}%</div>
                            </div>
                            <div className="bg-gray-50/50 dark:bg-black/30 rounded p-4 border border-gray-200 dark:border-gray-700/50 text-center">
                                <span className="text-gray-500 text-xs uppercase">Memory</span>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{(report.memoryUsage || 0).toFixed(0)} MB</div>
                            </div>
                        </div>

                        {/* Events Preview */}
                        <div className="bg-gray-50/50 dark:bg-black/30 rounded p-4 h-32 overflow-hidden mb-4 border border-gray-200 dark:border-gray-700/50 font-mono text-xs relative">
                            {/* Assuming events might be global or we fetch per agent, for now we leave empty or mock */}
                            <div className="text-gray-400 dark:text-gray-500 text-center italic mt-10">Click to view details</div>

                            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-gray-50 dark:from-black/50 to-transparent" />
                        </div>
                    </div>
                ))}

                {reports.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                        No agents connected.
                    </div>
                )}
            </div>
        </div>
    );
}


