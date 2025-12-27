import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Monitor, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { API_URL, SOCKET_URL } from '../config';
import { io, Socket } from 'socket.io-client';

interface Report {
    agentId: string;
    status: string;
    cpuUsage: number;
    memoryUsage: number;
    timestamp: string;
    screenshotsEnabled?: boolean;
    hostname?: string;
}

interface SecurityEvent {
    type: string;
    details: string;
    timestamp: string;
}

export default function LiveMonitor() {
    const [reports, setReports] = useState<Report[]>([]);
    const [screens, setScreens] = useState<Record<string, string>>({});
    const [events, setEvents] = useState<Record<string, SecurityEvent[]>>({});
    const [history, setHistory] = useState<any[]>([]); // For Single View

    const [searchParams, setSearchParams] = useSearchParams();
    const selectedAgentId = searchParams.get('agentId');

    const socketRef = useRef<Socket | null>(null);

    // 1. Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                // A. Metrics
                const res = await fetch(`${API_URL}/api/status`);
                if (res.ok) {
                    const agents: Report[] = await res.json();
                    setReports(agents);

                    // B. Event History (Grid Pre-load)
                    agents.forEach(async (agent) => {
                        if (!events[agent.agentId] && !selectedAgentId) {
                            fetchEvents(agent.agentId);
                        }
                    });
                }
            } catch (e) {
                console.error("Failed to connect to backend", e);
            }
        };

        const fetchEvents = async (id: string) => {
            try {
                const evtRes = await fetch(`${API_URL}/api/events/${id}`);
                if (evtRes.ok) {
                    const hist = await evtRes.json();
                    setEvents(prev => ({ ...prev, [id]: hist }));
                }
            } catch { }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000);

        return () => clearInterval(interval);
    }, [selectedAgentId]);

    // 2. Single Agent History Fetch (Initial load)
    useEffect(() => {
        if (selectedAgentId) {
            const fetchHistory = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/history/${selectedAgentId}`);
                    if (res.ok) {
                        const data = await res.json();
                        // Reverse for Chart (Oldest -> Newest)
                        setHistory(data.reverse().map((h: any) => ({
                            time: new Date(h.timestamp).toLocaleTimeString(),
                            cpu: h.cpuUsage,
                            mem: h.memoryUsage
                        })));

                        // Ensure events are loaded for this specific agent
                        const evtRes = await fetch(`${API_URL}/api/events/${selectedAgentId}`);
                        if (evtRes.ok) {
                            const hist = await evtRes.json();
                            setEvents(prev => ({ ...prev, [selectedAgentId]: hist }));
                        }
                    }
                } catch { }
            };
            fetchHistory();
        }
    }, [selectedAgentId]);

    // 3. Socket.IO Connection
    useEffect(() => {
        // Initialize Socket
        const socket = io(SOCKET_URL, {
            path: '/socket.io/',
            transports: ['websocket', 'polling'],
            reconnection: true,
        });

        socket.on("connect", () => {
            console.log("Connected to Socket.IO Endpoint");
            // If agent selected, join its room
            if (selectedAgentId) {
                console.log(`Joining Room: ${selectedAgentId}`);
                socket.emit('join_room', { room: selectedAgentId });
            }
        });

        // Listen for Screen Frames
        socket.on("ReceiveScreen", (data: any) => {
            const [agentId, base64Image] = Array.isArray(data) ? data : [data.agentId, data.image];

            // Update screen state
            if (!selectedAgentId || selectedAgentId === agentId) {
                setScreens(prev => ({ ...prev, [agentId]: base64Image }));
            }
        });

        // Listen for Events (and parse metrics for live chart appending)
        socket.on("ReceiveEvent", (evt: any) => {
            // evt = { agentId, title, details, timestamp }
            const { agentId, title, details, timestamp } = evt;

            // 1. Append to Event Log
            setEvents(prev => {
                const agentEvents = prev[agentId] || [];
                // Add new event at start
                const newEvents = [{ type: title, details, timestamp }, ...agentEvents].slice(0, 50);
                return { ...prev, [agentId]: newEvents };
            });

            // 2. If selected agent, parse metrics and append to history/chart
            if (selectedAgentId && agentId === selectedAgentId) {
                // details format: "Status: Online | CPU: 12.5% | MEM: 4096.0MB"
                const cpuMatch = details.match(/CPU:\s*([\d.]+)%/);
                const memMatch = details.match(/MEM:\s*([\d.]+)MB/);

                if (cpuMatch && memMatch) {
                    const newPoint = {
                        time: new Date(timestamp).toLocaleTimeString(),
                        cpu: parseFloat(cpuMatch[1]),
                        mem: parseFloat(memMatch[1])
                    };

                    setHistory(prev => {
                        // Append and keep last 60 points (1 hour approx if 1m interval, but here it's 5s so 60 points = 5 min windown, maybe keep more)
                        // User wants "live data", let's keep 100 points
                        const newHist = [...prev, newPoint].slice(-100);
                        return newHist;
                    });
                }
            }
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [selectedAgentId]);


    // === RENDER ===

    // --- MODE 1: SINGLE AGENT DASHBOARD ---
    if (selectedAgentId) {
        const agent = reports.find(r => r.agentId === selectedAgentId);

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Header / Nav */}
                <div className="flex items-center justify-between">
                    <button onClick={() => setSearchParams({})} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} /> Back to Fleet
                    </button>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Monitor className="text-blue-400" /> {selectedAgentId}
                        {agent && (
                            <span className={`text-xs px-2 py-1 rounded-full ${agent.status === 'Running' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                {agent.status}
                            </span>
                        )}
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT COL: Live Screen & Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Live Screen (Large) */}
                        <div className="bg-black border border-gray-700 rounded-xl overflow-hidden shadow-2xl relative aspect-video">
                            {screens[selectedAgentId] ? (
                                <img src={`data:image/webp;base64,${screens[selectedAgentId]}`} className="w-full h-full object-contain" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                                    <Activity className="animate-spin" size={32} />
                                    <span>Waiting for optimized stream...</span>
                                </div>
                            )}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <div className={`text-xs px-2 py-1 rounded shadow animate-pulse text-white ${screens[selectedAgentId] ? 'bg-red-600' : 'bg-gray-600'}`}>
                                    {screens[selectedAgentId] ? 'LIVE' : 'IDLE'}
                                </div>
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
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-0 flex flex-col h-[800px]">
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

    // --- MODE 2: GRID VIEW (Existing) ---
    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Live Monitor</h1>
                <div className="flex gap-2">
                    <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm border border-green-500/20 animate-pulse">
                        System Online
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-4">
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
                            <span className={`px-3 py-1 rounded-full text-sm ${report.status === 'Running' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                {report.status}
                            </span>
                        </div>

                        {/* Status Summary */}
                        < div className="mb-6 grid grid-cols-2 gap-4" >
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
                            {events[report.agentId]?.slice(0, 3).map((evt, i) => (
                                <div key={i} className="mb-1 truncate text-gray-400">
                                    <span className={evt.type === 'USB Inserted' ? 'text-yellow-400' : 'text-blue-400'}>[{evt.type}]</span> {evt.details}
                                </div>
                            ))}
                            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-gray-900 to-transparent" />
                        </div>
                    </div>
                ))
                }

                {
                    reports.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-12 border border-dashed border-gray-700 rounded-xl">
                            No agents connected.
                        </div>
                    )
                }
            </div >
        </div >
    );
}


