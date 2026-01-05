import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Monitor, ShieldAlert, Cpu, Play, Square } from 'lucide-react';
import { API_URL } from '../config';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

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

    // Refs
    const socketRef = useRef<Socket | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Fetch Agents Loop (Grid View)
    useEffect(() => {
        const fetchAgents = async () => {
            if (!token) return;
            try {
                const query = user?.tenantId ? `?tenantId=${user.tenantId}` : '';
                const res = await fetch(`${API_URL}/api/status${query}`, {
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

    // Socket Connection (Single View)
    useEffect(() => {
        if (!selectedAgentId || !token) return;

        console.log("[LiveMonitor] Connecting Socket for:", selectedAgentId);
        const socket = io(API_URL, {
            transports: ['websocket'],
            query: { token }
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log("Socket Connected");
            socket.emit('join', { room: selectedAgentId });
            // socket.emit('join_room', { room: selectedAgentId }); // Try both conventions
        });

        // Event Stream
        socket.on('new_event', (evt) => {
            setEvents(prev => ({
                ...prev,
                [selectedAgentId]: [evt, ...(prev[selectedAgentId] || [])].slice(0, 50)
            }));
        });

        // Metrics Stream
        // Assuming metrics come via events or a specific channel. For now, we mock history from report updates.

        // WebRTC/MJPEG Stream Handling
        // Implementation depends on backend. Assuming MJPEG blobs or similar.
        // If using Base64 frames:
        socket.on('stream_frame', (_frame) => {
            // Handle frame
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [selectedAgentId, token]);


    // Stream Handlers
    const handleStartStream = () => {
        if (socketRef.current && selectedAgentId) {
            console.log(`[LiveMonitor] Manual Start Stream: ${selectedAgentId}`);
            socketRef.current.emit('start_stream', { agentId: selectedAgentId });
            setIsStreamActive(true);

            // Note: Actual stream consumption (WebRTC/Canvas) should be initialized here.
            // For now, we assume the backend pushes frames to the video element source or similar.
        }
    };

    const handleStopStream = () => {
        if (socketRef.current && selectedAgentId) {
            console.log(`[LiveMonitor] Manual Stop Stream: ${selectedAgentId}`);
            socketRef.current.emit('stop_stream', { agentId: selectedAgentId });
            setIsStreamActive(false);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    };

    // --- RENDER ---

    if (selectedAgentId) {
        // --- SINGLE AGENT VIEW ---
        return (
            <div className="flex flex-col h-full bg-gray-900 text-white p-6 overflow-hidden">
                <div className="mb-4 flex items-center justify-between">
                    <button onClick={() => setSearchParams({})} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} /> Back to Grid
                    </button>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Monitor size={20} className="text-blue-500" />
                        {selectedAgentId}
                    </h2>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                    {/* LEFT COL: Stream & Stats */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Live Screen */}
                        <div className="bg-black border border-gray-700 rounded-xl overflow-hidden shadow-2xl relative aspect-video group">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-contain"
                                autoPlay
                                playsInline
                                muted
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
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Cpu size={18} className="text-purple-400" /> Live Performance Data</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
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

                    {/* RIGHT COL: Event Log */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-0 flex flex-col h-full lg:h-auto overflow-hidden">
                        <div className="p-4 border-b border-gray-800 bg-gray-800/50">
                            <h3 className="font-bold flex items-center gap-2"><ShieldAlert size={18} className="text-red-400" /> Recent Activities</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs custom-scrollbar">
                            {events[selectedAgentId]?.map((evt, i) => (
                                <div key={i} className="p-2 bg-black/30 rounded border border-gray-800 hover:border-gray-600 transition-colors">
                                    <div className="flex justify-between text-gray-500 mb-1">
                                        <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                                        <span className={`font-bold ${evt.type.includes('Block') ? 'text-red-500' : 'text-blue-400'}`}>{evt.type}</span>
                                    </div>
                                    <div className="text-gray-300 break-all">{evt.details}</div>
                                    {evt.type === 'Process Started' && evt.details.includes('PID:') && (
                                        <button
                                            onClick={() => {
                                                const pid = parseInt(evt.details.match(/PID: (\d+)/)?.[1] || "0");
                                                if (pid && socketRef.current) socketRef.current.emit("KillProcess", { target: pid, agentId: selectedAgentId });
                                            }}
                                            className="mt-2 w-full bg-red-900/30 hover:bg-red-900/50 text-red-500 py-1 rounded text-center uppercase tracking-wider font-bold transition-colors"
                                        >
                                            Kill Process
                                        </button>
                                    )}
                                </div>
                            ))}
                            {(!events[selectedAgentId] || events[selectedAgentId].length === 0) && (
                                <div className="text-center text-gray-600 py-10">No recent events recorded.</div>
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
                <h1 className="text-3xl font-bold text-white">Live Monitor</h1>
                <div className="flex gap-2">
                    <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm border border-green-500/20 animate-pulse">
                        System Online
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map(report => (
                    <div key={report.agentId} className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-xl hover:border-blue-500/50 transition-colors">
                        <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setSearchParams({ agentId: report.agentId })}>
                            <h2 className="text-xl font-semibold text-white flex flex-col group">
                                <div className="flex items-center gap-2">
                                    {report.agentId}
                                    <ArrowLeft className="rotate-180 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" size={16} />
                                </div>
                                <span className="text-xs font-mono text-gray-400 font-normal">{report.hostname || 'Unknown Host'}</span>
                            </h2>
                            <span className={`px-3 py-1 rounded-full text-sm ${report.status === 'Running' || report.status === 'Online' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                {report.status}
                            </span>
                        </div>

                        {/* Status Summary */}
                        <div className="mb-6 grid grid-cols-2 gap-4">
                            <div className="bg-gray-900 rounded p-4 border border-gray-700 text-center">
                                <span className="text-gray-500 text-xs uppercase">CPU</span>
                                <div className="text-2xl font-bold text-white mt-1">{(report.cpuUsage || 0).toFixed(1)}%</div>
                            </div>
                            <div className="bg-gray-900 rounded p-4 border border-gray-700 text-center">
                                <span className="text-gray-500 text-xs uppercase">Memory</span>
                                <div className="text-2xl font-bold text-white mt-1">{(report.memoryUsage || 0).toFixed(0)} MB</div>
                            </div>
                        </div>

                        {/* Events Preview */}
                        <div className="bg-gray-900 rounded p-4 h-32 overflow-hidden mb-4 border border-gray-700 font-mono text-xs relative">
                            {/* Assuming events might be global or we fetch per agent, for now we leave empty or mock */}
                            <div className="text-gray-500 text-center italic mt-10">Click to view details</div>

                            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-gray-900 to-transparent" />
                        </div>
                    </div>
                ))}

                {reports.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-12 border border-dashed border-gray-700 rounded-xl">
                        No agents connected.
                    </div>
                )}
            </div>
        </div>
    );
}


