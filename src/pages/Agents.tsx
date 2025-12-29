import { Monitor, Server, Wifi, WifiOff, AlertTriangle, X, List, Image, Maximize2, Minimize2, Download, Trash2, Settings as SettingsIcon, Video, StopCircle, Cpu, Activity } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { API_URL } from '../config';

interface AgentReport {
    id: number;
    agentId: string;
    tenantId: number;
    status: string;
    cpuUsage: number;
    memoryUsage: number;
    timestamp: string;
    hostname: string;
}

// Helper for consistent date parsing (SQL -> ISO UTC -> Local)
const normalizeTimestamp = (ts: any) => {
    if (!ts) return new Date().toISOString();
    let str = String(ts).trim();
    // Fix SQL format "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
    if (str.includes(' ') && !str.includes('T')) str = str.replace(' ', 'T');

    // Ensure UTC 'Z' if missing timezone info (check for Z or +HH:mm / -HH:mm)
    // Previous bug: !str.includes('-') failed because date 'YYYY-MM-DD' has hyphens
    const hasTimezone = str.endsWith('Z') || /[+-]\d{2}(:?\d{2})?$/.test(str);
    if (!hasTimezone) str += 'Z';

    return str;
};

export default function Agents() {
    const { user, token, logout } = useAuth();
    const [agents, setAgents] = useState<AgentReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgents();
        const interval = setInterval(fetchAgents, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const fetchAgents = async () => {
        try {
            const query = user?.tenantId ? `?tenantId=${user.tenantId}` : '';
            if (!token) return;
            const res = await fetch(`${API_URL}/api/status${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                logout();
                return;
            }
            if (res.ok) {
                const data = await res.json();
                const normalizedData = (Array.isArray(data) ? data : []).map((a: any) => {
                    return {
                        ...a,
                        status: a.status || a.Status || 'Unknown',
                        cpuUsage: a.cpuUsage ?? a.CpuUsage ?? 0,
                        memoryUsage: a.memoryUsage ?? a.MemoryUsage ?? 0,
                        timestamp: normalizeTimestamp(a.timestamp || a.Timestamp),
                        tenantId: a.tenantId ?? a.TenantId ?? 0,
                        agentId: a.agentId || a.AgentId || 'Unknown',
                        hostname: a.hostname || a.Hostname || 'Unknown'
                    };
                });

                // Sort: Online first, then by timestamp desc
                normalizedData.sort((a: any, b: any) => {
                    if (a.status === 'Online' && b.status !== 'Online') return -1;
                    if (a.status !== 'Online' && b.status === 'Online') return 1;
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                });

                setAgents(normalizedData);
            }
        } catch (e) {
            console.error("Failed to fetch agents", e);
        } finally {
            setLoading(false);
        }
    };

    const [showDeployModal, setShowDeployModal] = useState(false);
    const [deployOS, setDeployOS] = useState<'windows' | 'linux' | 'mac'>('windows');
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpToken, setOtpToken] = useState<string | null>(null);

    // WebRTC Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);

    const handleGenerateToken = async () => {
        try {
            const res = await fetch(`${API_URL}/api/install/token`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOtpToken(data.token);
                setShowOtpModal(true);
            }
        } catch (e) {
            console.error("Failed to generate OTP", e);
        }
    };

    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async (os: string) => {
        setIsDownloading(true);
        try {
            const res = await fetch(`${API_URL}/api/downloads/agent?os=${os}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Download failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `watch-sec-agent-${os}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error("Download error:", e);
            alert("Failed to download agent. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return;

        try {
            const res = await fetch(`${API_URL}/api/agents/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchAgents();
            } else {
                alert("Failed to delete agent");
            }
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'logs' | 'monitor' | 'activity' | 'screenshots' | null>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [showGraphs, setShowGraphs] = useState(false);

    // Live Screen State
    const [isScreenMaximized, setIsScreenMaximized] = useState(false);
    const [liveScreen, setLiveScreen] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [socketStatus, setSocketStatus] = useState<string>('Disconnected');
    const socketRef = useRef<any>(null);

    // Recording Logic
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const handleStartRecording = () => {
        if (!remoteStreamRef.current) return;

        try {
            const recorder = new MediaRecorder(remoteStreamRef.current);
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `recording-${selectedAgentId}-${new Date().toISOString()}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                chunksRef.current = [];
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
        } catch (err) {
            console.error("Failed to start recording:", err);
            alert("Failed to start recording. MediaRecorder might not be supported.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    useEffect(() => {
        if (liveScreen && remoteStreamRef.current && videoRef.current) {
            const videoEl = videoRef.current;
            if (videoEl.srcObject !== remoteStreamRef.current) {
                videoEl.srcObject = remoteStreamRef.current;
            }
            videoEl.play().catch(e => {
                if (e.name !== 'AbortError') console.error("[Agents.tsx] Play error:", e);
            });
        }
    }, [liveScreen]);

    useEffect(() => {
        if (!selectedAgentId) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Security Events
                const eventsRes = await fetch(`${API_URL}/api/events/${selectedAgentId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                let eventsData = await eventsRes.json();

                // Normalize Events
                const normalizedEvents = eventsData.map((e: any) => ({
                    ...e,
                    timestamp: normalizeTimestamp(e.timestamp || e.Timestamp)
                }));

                // 2. Fetch Metrics History
                const historyRes = await fetch(`${API_URL}/api/history/${selectedAgentId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                let historyData: AgentReport[] = await historyRes.json();
                if (!Array.isArray(historyData)) historyData = [];

                // 3. Merge and Sort
                const historyAsEvents = historyData.map((h: any) => {
                    const status = h.status || h.Status || 'Unknown';
                    let cpu = h.cpuUsage ?? h.CpuUsage ?? 0;
                    let mem = h.memoryUsage ?? h.MemoryUsage ?? 0;

                    return {
                        type: "System Heartbeat",
                        details: `Status: ${status} | CPU: ${Number(cpu).toFixed(1)}% | MEM: ${Number(mem).toFixed(1)}MB`,
                        timestamp: normalizeTimestamp(h.timestamp || h.Timestamp),
                        isMetric: true,
                        cpu: Number(cpu),
                        mem: Number(mem)
                    };
                });

                const combined = [...normalizedEvents, ...historyAsEvents].sort((a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );

                setEvents(combined);
            } catch (err) {
                console.error("Failed to fetch logs/history", err);
            }
        };

        fetchData();

        const socket = io(API_URL, {
            query: { token: token },
            transports: ['websocket']
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setSocketStatus('Connected');
            if (selectedAgentId) {
                socket.emit("join_room", { room: selectedAgentId });
                setSocketStatus(`Joined Room: ${selectedAgentId}`);
            }
        });

        socket.on("disconnect", () => setSocketStatus('Disconnected'));

        socket.on("ReceiveScreen", (agentId: string, base64: string) => {
            if (selectedAgentId && agentId.toLowerCase() === selectedAgentId.toLowerCase()) {
                setLiveScreen(base64);
            }
        });

        socket.on("ReceiveEvent", (data: any) => {
            const agentId = data.agentId || data.AgentId;
            const title = data.title || data.Type || 'Info';
            const details = data.details || data.Details || '';
            const timestamp = normalizeTimestamp(data.timestamp || data.Timestamp);

            if (agentId && selectedAgentId && agentId.toLowerCase() === selectedAgentId.toLowerCase()) {
                setEvents(prev => [{ type: title, details, timestamp }, ...prev]);
            }
        });

        socket.on("webrtc_offer", async (data: any) => {
            if (pcRef.current) pcRef.current.close();
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            pcRef.current = pc;

            pc.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    remoteStreamRef.current = event.streams[0];
                    setLiveScreen(event.streams[0].id);
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice_candidate', {
                        target: selectedAgentId,
                        candidate: event.candidate
                    });
                }
            };

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('webrtc_answer', {
                    target: selectedAgentId,
                    sdp: answer.sdp,
                    type: answer.type
                });
            } catch (err) {
                console.error("[Agents.tsx] WebRTC Error:", err);
            }
        });

        socket.on('ice_candidate', async (data) => {
            if (pcRef.current) {
                try {
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) { console.error("Error adding ICE:", e); }
            }
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            setLiveScreen(null);
            setEvents([]);
            setIsStreaming(false);
        };
    }, [selectedAgentId, token]);

    const handleViewLogs = (agentId: string) => {
        setSelectedAgentId(agentId);
        setViewMode('logs');
    };

    const handleMonitor = (agentId: string) => {
        setSelectedAgentId(agentId);
        setViewMode('monitor');
    };

    const closeModal = () => {
        setSelectedAgentId(null);
        setViewMode(null);
        setIsScreenMaximized(false);
    };

    const handleSimulateEvent = async () => {
        if (!selectedAgentId) return;
        try {
            await fetch(`${API_URL}/api/events/simulate/${selectedAgentId}`, { method: 'POST' });
        } catch (e) {
            console.error("Failed to trigger simulation", e);
        }
    };

    const handleStartStream = () => {
        if (socketRef.current && selectedAgentId) {
            socketRef.current.emit('start_stream', { agentId: selectedAgentId });
            setIsStreaming(true);
        }
    };

    const handleStopStream = () => {
        if (socketRef.current && selectedAgentId) {
            socketRef.current.emit('stop_stream', { agentId: selectedAgentId });
            setIsStreaming(false);
        }
    };

    const monitorContainerRef = useRef<HTMLDivElement>(null);
    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            monitorContainerRef.current?.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => setIsScreenMaximized(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div>
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Monitor className="w-8 h-8 text-blue-500" />
                        Agent Management
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Monitor connected endpoints and devices across your network.</p>
                </div>
                <div className="flex gap-3 items-center">
                    {user?.role === 'TenantAdmin' && (
                        <>
                            <button onClick={() => setShowDeployModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold shadow-lg shadow-blue-900/20">
                                <Download size={18} /> Deploy New Agent
                            </button>
                            <button onClick={handleGenerateToken} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold border border-gray-600">
                                <AlertTriangle size={18} className="text-yellow-500" /> Generate OTP
                            </button>
                        </>
                    )}
                    <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                        <span className="text-gray-400 text-xs uppercase font-bold">Total Agents</span>
                        <p className="text-2xl font-bold text-white text-right">{agents.length}</p>
                    </div>
                </div>
            </div>

            {showDeployModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2"> <Server className="w-5 h-5 text-blue-500" /> Deploy Enterprise Agent </h2>
                            <button onClick={() => setShowDeployModal(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex gap-4 border-b border-gray-800 pb-6">
                                {(['windows', 'linux', 'mac'] as const).map(os => (
                                    <button key={os} onClick={() => setDeployOS(os)} className={`flex-1 py-3 rounded-lg border font-bold flex flex-col items-center gap-2 transition-all ${deployOS === os ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                                        <span className="text-lg capitalize">{os}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => handleDownload(deployOS)} disabled={isDownloading} className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold text-sm ${isDownloading ? 'opacity-75 cursor-not-allowed' : ''}`}>
                                    {isDownloading ? 'Downloading...' : 'Download Installer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showOtpModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-8 max-w-sm w-full text-center">
                        <h2 className="text-xl font-bold text-white mb-4">Installation PIN</h2>
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-4">
                            <span className="text-4xl font-mono mobile-nums text-blue-400 font-bold tracking-widest">{otpToken?.substring(0, 3)}-{otpToken?.substring(3)}</span>
                        </div>
                        <button onClick={() => setShowOtpModal(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg">Close</button>
                    </div>
                </div>
            )}

            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-900/50 text-gray-400 text-sm uppercase font-semibold">
                        <tr><th className="p-4">Agent ID</th><th className="p-4">Hostname</th><th className="p-4">Status</th><th className="p-4">Resources</th><th className="p-4">Last Seen</th><th className="p-4">Actions</th></tr>
                    </thead>
                    <tbody className="text-gray-300 divide-y divide-gray-700">
                        {loading ? <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading agents...</td></tr> : agents.map(agent => (
                            <tr key={agent.agentId} className="hover:bg-gray-700/50 transition-colors group">
                                <td className="p-4 font-bold text-white flex items-center gap-2"> <Server className="w-4 h-4 text-gray-500" /> {agent.agentId} </td>
                                <td className="p-4 text-sm font-mono text-gray-400"> {agent.hostname || 'Unknown'} </td>
                                <td className="p-4">
                                    <div className={`flex items-center gap-2 px-2 py-1 rounded w-fit text-xs font-bold border ${agent.status === 'Online' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                        {agent.status === 'Online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />} {agent.status === 'Online' ? 'ONLINE' : 'OFFLINE'}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-xs space-y-1">
                                        <div className="flex justify-between w-32"> <span className="text-gray-500">CPU:</span> <span className={`${(agent.cpuUsage || 0) > 80 ? 'text-red-400 font-bold' : 'text-gray-300'}`}>{(agent.cpuUsage || 0).toFixed(1)}%</span> </div>
                                        <div className="flex justify-between w-32"> <span className="text-gray-500">MEM:</span> <span className="text-gray-300">{(agent.memoryUsage || 0).toFixed(0)} MB</span> </div>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-400 text-sm"> {new Date(agent.timestamp).toLocaleString()} </td>
                                <td className="p-4">
                                    <div className="flex gap-3 items-center">
                                        <button onClick={() => handleViewLogs(agent.agentId)} className="text-gray-400 hover:text-white text-sm font-medium hover:underline flex items-center gap-1"> <List className="w-4 h-4" /> Logs </button>
                                        <button onClick={() => handleMonitor(agent.agentId)} className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline flex items-center gap-1"> <Monitor className="w-4 h-4" /> Monitor </button>
                                        <button onClick={() => handleDelete(agent.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"> <Trash2 className="w-4 h-4" /> </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedAgentId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2"> <Server className="w-5 h-5 text-blue-500" /> Agent: <span className="text-blue-400 font-mono">{selectedAgentId}</span> </h2>
                                <div className="flex gap-4 mt-2">
                                    {['logs', 'monitor', 'screenshots', 'activity'].map(m => (
                                        <button key={m} onClick={() => setViewMode(m as any)} className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors ${viewMode === m ? 'text-white border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}> {m} </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 items-center">
                                {viewMode === 'logs' && (
                                    <button onClick={() => setShowGraphs(!showGraphs)} className={`p-2 rounded-full transition-colors ${showGraphs ? 'bg-purple-900/50 text-purple-400' : 'hover:bg-gray-700 text-gray-400'}`} title="Toggle Graphs"> <Activity className="w-5 h-5" /> </button>
                                )}
                                <button onClick={handleSimulateEvent} className="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 text-xs font-bold border border-red-600/50"> Simulate Event </button>
                                <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"> <X className="w-6 h-6" /> </button>
                            </div>
                        </div>

                        {viewMode === 'logs' && (
                            <div className="flex-1 overflow-hidden p-6 bg-gray-900/50 flex flex-col">
                                {showGraphs && events.length > 0 && (
                                    <div className="mb-4 grid grid-cols-2 gap-4 h-48">
                                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col">
                                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase"> <Activity className="w-3 h-3 text-cyan-400" /> Event Distribution </div>
                                            <div className="flex-1 w-full text-xs">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={Object.entries(events.reduce((acc: any, curr: any) => { acc[curr.type] = (acc[curr.type] || 0) + 1; return acc; }, {})).map(([name, count]) => ({ name, count })).slice(0, 10)}>
                                                        <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} />
                                                        <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                                                        <Tooltip contentStyle={{ backgroundColor: '#111827', fontSize: '10px' }} />
                                                        <Bar dataKey="count" fill="#3b82f6" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col">
                                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase"> <Cpu className="w-3 h-3 text-purple-400" /> System Performance </div>
                                            <div className="flex-1 w-full text-xs">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={events.filter(e => e.isMetric).slice(0, 50).reverse()}>
                                                        <XAxis dataKey="timestamp" hide />
                                                        <YAxis domain={[0, 100]} stroke="#6b7280" tick={{ fontSize: 10 }} />
                                                        <Tooltip contentStyle={{ backgroundColor: '#111827', fontSize: '10px' }} />
                                                        <Line type="monotone" name="CPU" dataKey="cpu" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                                        <Line type="monotone" name="Memory" dataKey="mem" stroke="#10b981" strokeWidth={2} dot={false} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex-1 flex flex-col">
                                    <div className="overflow-y-auto flex-1">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs sticky top-0">
                                                <tr><th className="p-4 w-48">Timestamp</th><th className="p-4 w-48">Event Type</th><th className="p-4">Details</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700 text-gray-300 font-mono">
                                                {events.length === 0 ? <tr><td colSpan={3} className="p-8 text-center text-gray-500 italic">No logs recorded.</td></tr> : events.map((evt, i) => (
                                                    <tr key={i} className="hover:bg-gray-700/30">
                                                        <td className="p-4 text-gray-500">{new Date(evt.timestamp).toLocaleString()}</td>
                                                        <td className="p-4 font-bold"> <span className="text-blue-400">{evt.type}</span> </td>
                                                        <td className="p-4 break-all">{evt.details}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {viewMode === 'monitor' && (
                            <div className={`flex-1 ${isScreenMaximized ? 'flex flex-col' : 'grid grid-cols-1 lg:grid-cols-3'} gap-0 overflow-hidden min-h-0`}>
                                {!isScreenMaximized && (
                                    <div className="flex flex-col border-r border-gray-800 bg-gray-900/50 col-span-1 overflow-hidden min-h-0">
                                        <div className="p-3 bg-gray-800/30 border-b border-gray-800 flex items-center gap-2"> <List className="w-4 h-4 text-gray-400" /> <span className="text-xs font-bold text-gray-300 uppercase">Recent Activity</span> </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
                                            <div className="mb-4 bg-black/40 p-2 rounded border border-gray-700 h-32">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={events.filter(e => e.isMetric).slice(0, 50).reverse()}>
                                                        <YAxis hide domain={[0, 100]} />
                                                        <Line type="monotone" dataKey="cpu" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                            {events.map((evt, i) => (
                                                <div key={i} className="p-3 bg-gray-800 rounded border border-gray-700/50 hover:border-gray-600">
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1"> <span>{new Date(normalizeTimestamp(evt.timestamp)).toLocaleTimeString()}</span> <span className="font-bold text-blue-500">{evt.type}</span> </div>
                                                    <p className="text-gray-300 break-all line-clamp-2" title={evt.details}>{evt.details}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div ref={monitorContainerRef} className={`flex flex-col bg-black ${isScreenMaximized ? 'fixed inset-0 z-50' : 'col-span-2'} overflow-hidden min-h-0`}>
                                    <div className={`p-3 bg-gray-800/30 border-b border-gray-800 flex items-center gap-2 ${isScreenMaximized ? 'absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm transition-opacity opacity-0 hover:opacity-100' : ''}`}>
                                        <Image className="w-4 h-4 text-gray-400" /> <span className="text-xs font-bold text-gray-300 uppercase">Live Screen Feed</span>
                                        <div className="ml-auto flex items-center gap-3">
                                            {isStreaming ? (
                                                <button onClick={handleStopStream} className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-600/50 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2"> <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Stop Stream </button>
                                            ) : (
                                                <button onClick={handleStartStream} className="px-3 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-500 border border-green-600/50 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2"> <Server className="w-3 h-3" /> Start Stream </button>
                                            )}
                                            {isStreaming && (
                                                <button onClick={isRecording ? handleStopRecording : handleStartRecording} className={`px-3 py-1 border rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isRecording ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-gray-700/50 text-gray-300 border-gray-600'}`}>
                                                    {isRecording ? <StopCircle className="w-3 h-3 animate-pulse" /> : <Video className="w-3 h-3" />} {isRecording ? 'Rec ON' : 'Record'}
                                                </button>
                                            )}
                                            <button onClick={handleToggleFullscreen} className="text-gray-400 hover:text-white transition-colors"> {isScreenMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />} </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative overflow-hidden bg-black min-h-0">
                                        {liveScreen ? (
                                            <video ref={videoRef} className="absolute inset-0 w-full h-full object-contain z-10" autoPlay playsInline muted />
                                        ) : (
                                            <div className="text-center text-gray-600 bg-gray-900/50 p-8 rounded-xl border border-dashed border-gray-700 h-full flex flex-col justify-center items-center">
                                                <div className="w-12 h-12 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                                                <h3 className="text-white font-bold mb-2">Waiting for video stream...</h3>
                                                <div className="text-xs font-mono text-left inline-block bg-black/50 p-3 rounded border border-gray-800 space-y-1">
                                                    <p className="text-gray-400">Agent: <span className="text-blue-400">{selectedAgentId}</span></p>
                                                    <p className="text-gray-400">Socket: <span className={socketStatus.includes('Joined') ? 'text-green-400' : 'text-yellow-400'}>{socketStatus}</span></p>
                                                    <p className="text-gray-400">Streaming: <span className={isStreaming ? 'text-green-400' : 'text-red-400'}>{isStreaming ? 'YES' : 'NO'}</span></p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {viewMode === 'screenshots' && (
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 font-sans">
                                <ScreenshotsGallery agentId={selectedAgentId} apiUrl={API_URL} token={token} />
                            </div>
                        )}

                        {viewMode === 'activity' && (
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 font-sans">
                                <ActivityLogViewer agentId={selectedAgentId} apiUrl={API_URL} token={token} />
                            </div>
                        )}

                        <div className="p-4 border-t border-gray-800 bg-gray-800/50 flex justify-end">
                            <button onClick={closeModal} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">Close Viewer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ActivityLogViewer({ agentId, apiUrl, token }: { agentId: string, apiUrl: string, token: string | null }) {
    const [logs, setLogs] = useState<any[]>([]);
    const { logout } = useAuth();
    useEffect(() => {
        fetch(`${apiUrl}/api/events/activity/${agentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (res.status === 401) { logout(); return []; }
                return res.json();
            })
            .then(data => { if (Array.isArray(data)) setLogs(data); })
            .catch(e => console.error(e));
    }, [agentId, logout, apiUrl, token]);

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                <h4 className="text-sm font-bold text-gray-300">Activity History</h4>
                <button
                    onClick={async () => {
                        try {
                            const res = await fetch(`${apiUrl}/api/events/simulate/${agentId}`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (res.ok) alert("Event Simulated! Check Events tab.");
                        } catch (e) { console.error(e); }
                    }}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded"
                >
                    Simulate Event
                </button>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs sticky top-0">
                    <tr><th className="p-4">Timestamp</th><th className="p-4">Type</th><th className="p-4">Details</th><th className="p-4">Risk</th><th className="p-4">Duration</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-gray-300 font-mono">
                    {logs.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">No activity recorded.</td></tr>
                    ) : (
                        logs.map((log, i) => (
                            <tr key={i} className="hover:bg-gray-700/30">
                                <td className="p-4 text-gray-500">{new Date(normalizeTimestamp(log.timestamp || log.Timestamp)).toLocaleString()}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs ${(log.activityType || log.ActivityType) === 'Web' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                        {log.activityType || log.ActivityType}
                                    </span>
                                </td>
                                <td className="p-4 break-all">
                                    {(log.activityType || log.ActivityType) === 'Web' ? (
                                        <a href={log.url || log.Url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{log.url || log.Url}</a>
                                    ) : (<span>{log.processName || log.ProcessName} - {log.windowTitle || log.WindowTitle}</span>)}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${(log.riskLevel === 'High' || log.RiskLevel === 'High') ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                        {log.riskLevel || log.RiskLevel || 'Normal'}
                                    </span>
                                </td>
                                <td className="p-4">{(log.durationSeconds || log.DurationSeconds || 0).toFixed(1)}s</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

function ScreenshotsGallery({ agentId, apiUrl, token }: { agentId: string, apiUrl: string, token: string | null }) {
    const [images, setImages] = useState<any[]>([]);
    const [isEnabled, setIsEnabled] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({ quality: 80, resolution: 'Original', maxSize: 0 });

    useEffect(() => {
        setLoadingSettings(true);
        setError(null);
        fetch(`${apiUrl}/api/screenshots/list/${agentId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setImages(Array.isArray(data) ? data : []))
            .catch(e => setError(e.message));

        fetch(`${apiUrl}/api/agents`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then((data: any[]) => {
                if (Array.isArray(data)) {
                    const agent = data.find(a => a.agentId === agentId || a.AgentId === agentId);
                    if (agent) {
                        setIsEnabled((agent.screenshotsEnabled ?? agent.ScreenshotsEnabled) === true);
                        setSettings({
                            quality: agent.ScreenshotQuality || 80,
                            resolution: agent.ScreenshotResolution || 'Original',
                            maxSize: agent.MaxScreenshotSize || 0
                        });
                    }
                }
                setLoadingSettings(false);
            })
            .catch(e => { console.error(e); setLoadingSettings(false); });

        const newSocket = io(apiUrl, { transports: ['websocket'], query: { token } });
        newSocket.on('connect', () => newSocket.emit('join_room', { room: agentId }));
        newSocket.on('ReceiveScreen', (id: string, dataUri: string) => {
            if (id === agentId) {
                setImages(prev => [{ Filename: `Live Capture`, Date: new Date().toISOString(), Timestamp: new Date().toISOString(), IsAlert: false, Url: '', dataUri: dataUri }, ...prev]);
            }
        });
        return () => { newSocket.disconnect(); };
    }, [agentId, apiUrl, token]);

    const toggleScreenshots = async () => {
        const newVal = !isEnabled;
        setIsEnabled(newVal);
        try {
            await fetch(`${apiUrl}/api/agents/${agentId}/toggle-screenshots?enabled=${newVal}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
        } catch (e: any) { setIsEnabled(!newVal); setError(e.message); }
    };

    const saveSettings = async () => {
        try {
            await fetch(`${apiUrl}/api/agents/${agentId}/settings`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ScreenshotQuality: settings.quality, ScreenshotResolution: settings.resolution, MaxScreenshotSize: settings.maxSize })
            });
            setShowSettings(false);
        } catch (e) { console.error("Failed settings save", e); }
    };

    if (error) return <div className="p-4 text-red-500 bg-red-900/10 rounded">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-white flex gap-2"><Image className="w-5 h-5 text-blue-500" /> Captured Evidence</h3>
                <div className="flex items-center gap-3">
                    <button onClick={async () => { await fetch(`${apiUrl}/api/agents/${agentId}/take-screenshot`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); }} className="px-3 py-1 bg-blue-600 rounded text-white font-bold text-sm">Capture Now</button>
                    <button onClick={() => setShowSettings(true)} className="p-1.5 text-gray-400 hover:text-white" title="Settings"><SettingsIcon className="w-5 h-5" /></button>
                    <span className={`text-sm font-bold ${isEnabled ? 'text-green-400' : 'text-gray-500'}`}>{isEnabled ? 'Active' : 'Paused'}</span>
                    <button onClick={toggleScreenshots} disabled={loadingSettings} className={`w-12 h-6 rounded-full p-1 relative ${isEnabled ? 'bg-green-600' : 'bg-gray-700'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg w-96 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-4">Settings</h3>
                        <div className="space-y-4">
                            <div><label className="text-xs text-gray-400">Resolution</label><select value={settings.resolution} onChange={e => setSettings({ ...settings, resolution: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"><option value="Original">Original</option><option value="720p">720p</option></select></div>
                            <div><label className="text-xs text-gray-400">Quality {settings.quality}%</label><input type="range" min="10" max="100" value={settings.quality} onChange={e => setSettings({ ...settings, quality: parseInt(e.target.value) })} className="w-full" /></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowSettings(false)} className="text-gray-400 text-sm">Cancel</button>
                            <button onClick={saveSettings} className="bg-blue-600 text-white rounded px-3 py-1 text-sm font-bold">Save</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img, i) => (
                    <div key={i} className="group relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                        <div className="aspect-video bg-black relative">
                            <img src={img.dataUri || `${apiUrl}${img.Url}?token=${token}`} alt={img.Filename} className="w-full h-full object-cover opacity-75 group-hover:opacity-100" />
                        </div>
                        <div className="p-2">
                            <p className="text-xs text-gray-300 font-mono truncate">{img.Filename}</p>
                            <p className="text-[10px] text-gray-500">{new Date(normalizeTimestamp(img.Timestamp || img.Date)).toLocaleString()}</p>
                        </div>
                        <a href={`${apiUrl}${img.Url}?token=${token}`} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50"><span className="text-white border px-2 py-1 rounded-full text-xs">View</span></a>
                    </div>
                ))}
            </div>
        </div>
    );
}
