import { Monitor, Server, Wifi, WifiOff, AlertTriangle, X, List, Image, Maximize2, Minimize2, Download, Trash2, Settings as SettingsIcon, Video, StopCircle } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
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

export default function Agents() {
    const { user, token } = useAuth();
    const [agents, setAgents] = useState<AgentReport[]>([]);
    const [loading, setLoading] = useState(true);



    useEffect(() => {
        fetchAgents();
        const interval = setInterval(fetchAgents, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const fetchAgents = async () => {
        try {
            // Pass tenantId if user is TenantAdmin (controlled by backend logical check usually, but sending param doesn't hurt)
            const query = user?.tenantId ? `?tenantId=${user.tenantId}` : '';
            const res = await fetch(`${API_URL}/api/status${query}`);
            if (res.ok) {
                const data = await res.json();
                const normalizedData = (Array.isArray(data) ? data : []).map((a: any) => {
                    let ts = a.timestamp || a.Timestamp || new Date().toISOString();
                    if (!ts.endsWith('Z') && !ts.includes('+') && !ts.includes('-')) ts += 'Z';
                    return {
                        ...a,
                        status: a.status || a.Status || 'Unknown',
                        cpuUsage: a.cpuUsage ?? a.CpuUsage ?? 0,
                        memoryUsage: a.memoryUsage ?? a.MemoryUsage ?? 0,
                        timestamp: ts,
                        tenantId: a.tenantId ?? a.TenantId ?? 0,
                        agentId: a.agentId || a.AgentId || 'Unknown',
                        hostname: a.hostname || a.Hostname || 'Unknown'
                    };
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

    // OTP Token Logic
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpToken, setOtpToken] = useState<string | null>(null);

    // WebRTC Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);

    const handleGenerateToken = async () => {
        try {
            const res = await fetch(`${API_URL}/api/install/token`, { method: 'POST' });
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
                fetchAgents(); // Refresh list
            } else {
                alert("Failed to delete agent");
            }
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    // isOnline check moved to Backend for reliability
    // const isOnline = (timestamp: string) => { ... }

    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'logs' | 'monitor' | 'screenshots' | 'activity' | null>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [liveScreen, setLiveScreen] = useState<string | null>(null);
    const [isScreenMaximized, setIsScreenMaximized] = useState(false);
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
            chunksRef.current = []; // Clear previous chunks

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

            // Only assign if different to avoid reloading
            if (videoEl.srcObject !== remoteStreamRef.current) {
                console.log("[Agents.tsx] Attaching stream to video element");
                videoEl.srcObject = remoteStreamRef.current;
            }

            // Attempt play
            const playPromise = videoEl.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log("[Agents.tsx] Play Success");
                    })
                    .catch(e => {
                        if (e.name === 'AbortError') {
                            console.warn("[Agents.tsx] Play aborted (likely buffering or new load).");
                        } else {
                            console.error("[Agents.tsx] Play error:", e);
                        }
                    });
            }
        }
    }, [liveScreen]);

    // Fetch Logs and Connect SignalR when Modal Opens
    useEffect(() => {
        if (!selectedAgentId) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Security Events (MongoDB)
                const eventsRes = await fetch(`${API_URL}/api/events/${selectedAgentId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                let eventsData = await eventsRes.json();

                if (!Array.isArray(eventsData)) {
                    console.warn("[Agents] Events data is not an array, defaulting to empty:", eventsData);
                    eventsData = [];
                }

                // 2. Fetch Metrics History (MySQL)
                const historyRes = await fetch(`${API_URL}/api/history/${selectedAgentId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                let historyData: AgentReport[] = await historyRes.json();

                if (!Array.isArray(historyData)) {
                    console.error("History data is not an array:", historyData);
                    historyData = [];
                }

                // 3. Merge and Sort
                // Map history items to "Event-like" structure
                const historyAsEvents = historyData.map((h: any) => {
                    const status = h.status || h.Status || 'Unknown';
                    const cpu = h.cpuUsage ?? h.CpuUsage ?? 0;
                    const mem = h.memoryUsage ?? h.MemoryUsage ?? 0;
                    let ts = h.timestamp || h.Timestamp || new Date().toISOString();
                    // Ensure UTC interpretation if no offset is present
                    if (!ts.endsWith('Z') && !ts.includes('+') && !ts.includes('-')) {
                        ts += 'Z';
                    }

                    return {
                        type: "System Heartbeat",
                        details: `Status: ${status} | CPU: ${Number(cpu).toFixed(1)}% | MEM: ${Number(mem).toFixed(1)}MB`,
                        timestamp: ts,
                        isMetric: true
                    };
                });

                // Combine
                const combined = [...eventsData, ...historyAsEvents].sort((a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );

                setEvents(combined);
            } catch (err) {
                console.error("Failed to fetch logs/history", err);
            }
        };

        fetchData();

        // 2. Socket.IO for Live Screen (and new events)
        const socket = io(API_URL, {
            query: { token: token },
            transports: ['websocket']
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("[Agents.tsx] Socket Connected:", socket.id);
            setSocketStatus('Connected');
            if (selectedAgentId) {
                console.log("[Agents.tsx] Joining Room:", selectedAgentId);
                socket.emit("join_room", { room: selectedAgentId });
                setSocketStatus(`Joined Room: ${selectedAgentId}`);
            }
        });

        socket.on("disconnect", () => {
            setSocketStatus('Disconnected');
        });

        socket.on("ReceiveScreen", (agentId: string, base64: string) => {
            // Backend emits (agentId, dataUri)
            console.log("[Agents.tsx] ReceiveScreen Event from:", agentId);
            if (selectedAgentId && agentId.toLowerCase() === selectedAgentId.toLowerCase()) {
                setLiveScreen(base64);
            }
        });

        socket.on("ReceiveEvent", (data: any) => {
            // Backend emits single object: { agentId, title, details, timestamp }
            console.log("[Agents.tsx] ReceiveEvent Object:", data);
            const agentId = data.agentId || data.AgentId;
            const title = data.title || data.Type || 'Info';
            const details = data.details || data.Details || '';
            const timestamp = data.timestamp || data.Timestamp || new Date().toISOString();

            if (agentId && selectedAgentId && agentId.toLowerCase() === selectedAgentId.toLowerCase()) {
                setEvents(prev => [{ type: title, details, timestamp }, ...prev]);
            }
        });

        // --- WebRTC Logic ---
        socket.on("webrtc_offer", async (data: any) => {
            console.log("[Agents.tsx] WebRTC Offer Received", data);

            // 1. Reset PC
            if (pcRef.current) pcRef.current.close();
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            pcRef.current = pc;

            // 2. Handle Track
            pc.ontrack = (event) => {
                console.log("[Agents.tsx] Track Received", event.streams[0]);
                if (event.streams && event.streams[0]) {
                    const stream = event.streams[0];
                    console.log("[Agents.tsx] Track Received", stream.id, stream.getTracks());
                    remoteStreamRef.current = stream;
                    setLiveScreen(stream.id);
                }
            };

            // 3. ICE Candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice_candidate', {
                        target: selectedAgentId,
                        candidate: event.candidate
                    });
                }
            };

            try {
                // 4. Set Remote Desc
                await pc.setRemoteDescription(new RTCSessionDescription({
                    type: data.type,
                    sdp: data.sdp
                }));

                // 5. Create Answer
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                // 6. Send Answer
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

    const handleSimulateEvent = async (agentId: string) => {
        try {
            await fetch(`${API_URL}/api/events/simulate/${agentId}`, { method: 'POST' });
        } catch (e) {
            console.error("Failed to trigger simulation", e);
        }
    };

    const handleStartStream = () => {
        console.log(`[STREAM_DEBUG] Start Button Clicked for ${selectedAgentId}`);
        if (socketRef.current && selectedAgentId) {
            console.log(`[STREAM_DEBUG] Emitting start_stream for ${selectedAgentId}`);
            socketRef.current.emit('start_stream', { agentId: selectedAgentId });
            setIsStreaming(true);
        } else {
            console.error("[STREAM_DEBUG] Cannot Start Stream: Socket or AgentId missing", { socket: !!socketRef.current, agentId: selectedAgentId });
        }
    };

    const handleStopStream = () => {
        console.log(`[STREAM_DEBUG] Stop Button Clicked for ${selectedAgentId}`);
        if (socketRef.current && selectedAgentId) {
            console.log(`[STREAM_DEBUG] Emitting stop_stream for ${selectedAgentId}`);
            socketRef.current.emit('stop_stream', { agentId: selectedAgentId });
            setIsStreaming(false);
        }
    };



    // Full Screen Logic
    const monitorContainerRef = useRef<HTMLDivElement>(null);

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            monitorContainerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsScreenMaximized(!!document.fullscreenElement);
        };

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
                    {/* RBAC: Only TenantAdmin can deploy */}
                    {user?.role === 'TenantAdmin' && (
                        <>
                            <button
                                onClick={() => setShowDeployModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold shadow-lg shadow-blue-900/20"
                            >
                                <Download size={18} />
                                Deploy New Agent
                            </button>
                            <button
                                onClick={handleGenerateToken}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold border border-gray-600"
                            >
                                <AlertTriangle size={18} className="text-yellow-500" />
                                Generate OTP
                            </button>
                        </>
                    )}

                    <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                        <span className="text-gray-400 text-xs uppercase font-bold">Total Agents</span>
                        <p className="text-2xl font-bold text-white text-right">{agents.length}</p>
                    </div>
                </div>
            </div>


            {/* DEPLOYMENT MODAL */}
            {showDeployModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Server className="w-5 h-5 text-blue-500" />
                                Deploy Enterprise Agent
                            </h2>
                            <button onClick={() => setShowDeployModal(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* OS Selection */}
                            <div className="flex gap-4 border-b border-gray-800 pb-6">
                                <button
                                    onClick={() => setDeployOS('windows')}
                                    className={`flex-1 py-3 rounded-lg border font-bold flex flex-col items-center gap-2 transition-all ${deployOS === 'windows' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                                >
                                    <span className="text-lg">Windows</span>
                                    <span className="text-xs opacity-75">Server / Desktop</span>
                                </button>
                                <button
                                    onClick={() => setDeployOS('linux')}
                                    className={`flex-1 py-3 rounded-lg border font-bold flex flex-col items-center gap-2 transition-all ${deployOS === 'linux' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                                >
                                    <span className="text-lg">Linux</span>
                                    <span className="text-xs opacity-75">Ubuntu / RHEL / Debian</span>
                                </button>
                                <button
                                    onClick={() => setDeployOS('mac')}
                                    className={`flex-1 py-3 rounded-lg border font-bold flex flex-col items-center gap-2 transition-all ${deployOS === 'mac' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                                >
                                    <span className="text-lg">macOS</span>
                                    <span className="text-xs opacity-75">Intel / Apple Silicon</span>
                                </button>
                            </div>

                            {/* Instructions */}
                            <div className="space-y-6">
                                {/* Step 1 */}
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0">1</div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold mb-1">Download Agent Package</h3>
                                        <p className="text-gray-400 text-sm mb-3">
                                            Download the pre-configured agent bundle. This package includes your unique Tenant API Key.
                                        </p>
                                        <button
                                            onClick={() => handleDownload(deployOS)}
                                            disabled={isDownloading}
                                            className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold text-sm ${isDownloading ? 'opacity-75 cursor-not-allowed' : ''}`}
                                        >
                                            {isDownloading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Preparing Download...
                                                </>
                                            ) : (
                                                <>
                                                    <Download size={16} />
                                                    Download Installer ({deployOS === 'windows' ? '.exe' : '.sh'})
                                                </>
                                            )}
                                        </button>

                                        {/* Browser Warning Tip */}
                                        <div className="mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded p-2 flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                                            <div className="text-xs text-yellow-200/80">
                                                <p className="font-bold">Browser Warning?</p>
                                                <p>If you see "Commonly not downloaded", click the <span className="text-white font-mono bg-white/10 px-1 rounded">...</span> menu and select <b>Keep</b> or <b>Run Anyway</b>. Our installer is self-signed for internal use.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white shrink-0">2</div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold mb-1">Install & Run</h3>
                                        <p className="text-gray-400 text-sm mb-2">
                                            Run the installation script with <span className="text-red-400 font-bold">Administrator / Root</span> privileges.
                                        </p>
                                        <div className="p-3 bg-gray-950 rounded border border-gray-800 font-mono text-xs text-green-400">
                                            {deployOS === 'windows' ? '> ./watch-sec-setup.exe' : '$ sudo ./watch-sec-install.sh'}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-800/50 border-t border-gray-800 text-center rounded-lg">
                                    <p className="text-xs text-gray-500">
                                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                                        This agent runs as a system service and requires elevated permissions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* OTP MODAL */}
            {showOtpModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-8 max-w-sm w-full text-center">
                        <h2 className="text-xl font-bold text-white mb-4">Installation PIN</h2>
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-4">
                            <span className="text-4xl font-mono mobile-nums text-blue-400 font-bold tracking-widest">
                                {otpToken?.substring(0, 3)}-{otpToken?.substring(3)}
                            </span>
                            <p className="text-gray-500 text-xs mt-2">Valid for 30 minutes</p>
                        </div>
                        <p className="text-gray-400 text-sm mb-6">
                            Provide this code to remote employees to authorize installation on non-domain devices.
                        </p>
                        <button
                            onClick={() => setShowOtpModal(false)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-900/50 text-gray-400 text-sm uppercase font-semibold">
                        <tr>
                            <th className="p-4">Agent ID</th>
                            <th className="p-4">Hostname</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Resources</th>
                            <th className="p-4">Last Seen</th>
                            <th className="p-4">Tenant ID</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-300 divide-y divide-gray-700">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading agents...</td></tr>
                        ) : agents.map(agent => {
                            // Trust the backend's computed status (which handles Server-Side LastSeen check)
                            const online = agent.status === 'Online';
                            return (
                                <tr key={agent.agentId} className="hover:bg-gray-700/50 transition-colors group">
                                    <td className="p-4 font-bold text-white flex items-center gap-2">
                                        <Server className="w-4 h-4 text-gray-500" />
                                        {agent.agentId}
                                    </td>
                                    <td className="p-4 text-sm font-mono text-gray-400">
                                        {agent.hostname || 'Unknown'}
                                    </td>
                                    <td className="p-4">
                                        <div className={`flex items-center gap-2 px-2 py-1 rounded w-fit text-xs font-bold border ${online
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                            {online ? 'ONLINE' : 'OFFLINE'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between w-32">
                                                <span className="text-gray-500">CPU:</span>
                                                <span className={`${(agent.cpuUsage || 0) > 80 ? 'text-red-400 font-bold' : 'text-gray-300'}`}>{(agent.cpuUsage || 0).toFixed(1)}%</span>
                                            </div>
                                            <div className="flex justify-between w-32">
                                                <span className="text-gray-500">MEM:</span>
                                                <span className="text-gray-300">{(agent.memoryUsage || 0).toFixed(0)} MB</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-400 text-sm">
                                        {new Date(agent.timestamp).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-gray-400 font-mono text-xs">
                                        {agent.tenantId}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-3 items-center">
                                            <button
                                                onClick={() => handleViewLogs(agent.agentId)}
                                                className="text-gray-400 hover:text-white text-sm font-medium hover:underline flex items-center gap-1"
                                                title="View Historical Logs"
                                            >
                                                <List className="w-4 h-4" /> Logs
                                            </button>
                                            <button
                                                onClick={() => handleMonitor(agent.agentId)}
                                                className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline flex items-center gap-1"
                                                title="Live Monitor"
                                            >
                                                <Monitor className="w-4 h-4" /> Monitor
                                            </button>
                                            <button
                                                onClick={() => handleDelete(agent.id)}
                                                className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                                title="Delete Agent"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {!loading && agents.length === 0 && (
                    <div className="p-12 text-center text-gray-500 border-t border-dashed border-gray-700">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No connected agents found.
                    </div>
                )}
            </div>

            {/* MODALS */}
            {selectedAgentId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col">

                        {/* Header */}
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Server className="w-5 h-5 text-blue-500" />
                                    Agent: <span className="text-blue-400 font-mono">{selectedAgentId}</span>
                                </h2>
                                <div className="flex gap-4 mt-2">
                                    <button
                                        onClick={() => setViewMode('logs')}
                                        className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors ${viewMode === 'logs' ? 'text-white border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'
                                            }`}
                                    >
                                        Event Logs
                                    </button>
                                    <button
                                        onClick={() => setViewMode('monitor')}
                                        className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors ${viewMode === 'monitor' ? 'text-white border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'
                                            }`}
                                    >
                                        Live Monitor
                                    </button>
                                    <button
                                        onClick={() => setViewMode('screenshots')}
                                        className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors ${viewMode === 'screenshots' ? 'text-white border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'
                                            }`}
                                    >
                                        Screenshots
                                    </button>
                                    <button
                                        onClick={() => setViewMode('activity')}
                                        className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors ${viewMode === 'activity' ? 'text-white border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'
                                            }`}
                                    >
                                        Activity
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => handleSimulateEvent(selectedAgentId)}
                                    className="px-3 py-1 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-500 border border-yellow-600/50 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                                    title="Trigger a test event on the agent to verify logging"
                                >
                                    Simulate Event
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* MODE 1: LOGS TABLE VIEW */}
                        {viewMode === 'logs' && (
                            <div className="flex-1 overflow-hidden p-6 bg-gray-900/50 flex flex-col">
                                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex-1 flex flex-col">
                                    <div className="overflow-y-auto flex-1">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs sticky top-0">
                                                <tr>
                                                    <th className="p-4 w-48">Timestamp</th>
                                                    <th className="p-4 w-48">Event Type</th>
                                                    <th className="p-4">Details</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700 text-gray-300 font-mono">
                                                {events.length === 0 ? (
                                                    <tr><td colSpan={3} className="p-8 text-center text-gray-500 italic">No logs recorded.</td></tr>
                                                ) : (
                                                    events.map((evt, i) => (
                                                        <tr key={i} className="hover:bg-gray-700/30">
                                                            <td className="p-4 text-gray-500">{new Date(evt.timestamp).toLocaleString()}</td>
                                                            <td className="p-4 font-bold">
                                                                <span className={`px-2 py-1 rounded text-xs ${evt.type.includes('USB') ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                                    evt.type.includes('Process') ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                                                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                                    }`}>
                                                                    {evt.type}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 break-all">{evt.details}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MODE 2: MONITOR SPLIT VIEW */}
                        {viewMode === 'monitor' && (
                            <div className={`flex-1 ${isScreenMaximized ? 'flex flex-col' : 'grid grid-cols-1 lg:grid-cols-3'} gap-0 overflow-hidden min-h-0`}>
                                {/* Left: Logs (Smaller) - Hide if maximized */}
                                {!isScreenMaximized && (
                                    <div className="flex flex-col border-r border-gray-800 bg-gray-900/50 col-span-1 overflow-hidden min-h-0">
                                        <div className="p-3 bg-gray-800/30 border-b border-gray-800 flex items-center gap-2">
                                            <List className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-bold text-gray-300 uppercase">Recent Activity</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
                                            {events.map((evt, i) => (
                                                <div key={i} className="p-3 bg-gray-800 rounded border border-gray-700/50 hover:border-gray-600">
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                        <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                                                        <span className={`font-bold ${evt.type.includes('USB') ? 'text-yellow-500' :
                                                            evt.type.includes('Process') ? 'text-cyan-500' : 'text-blue-500'
                                                            }`}>{evt.type}</span>
                                                    </div>
                                                    <p className="text-gray-300 break-all line-clamp-2" title={evt.details}>{evt.details}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Right: Live Screen (Larger) */}
                                <div
                                    ref={monitorContainerRef}
                                    className={`flex flex-col bg-black ${isScreenMaximized ? 'fixed inset-0 z-50' : 'col-span-2'} overflow-hidden min-h-0`}
                                >
                                    {/* Hide Header in Full Screen unless hovered (optional improvement), for now keep it but maybe minimal? */}
                                    <div className={`p-3 bg-gray-800/30 border-b border-gray-800 flex items-center gap-2 ${isScreenMaximized ? 'absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm transition-opacity opacity-0 hover:opacity-100' : ''}`}>
                                        <Image className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs font-bold text-gray-300 uppercase">Live Screen Feed</span>
                                        <div className="ml-auto flex items-center gap-3">
                                            {/* Streaming Controls */}
                                            {isStreaming ? (
                                                <button
                                                    onClick={handleStopStream}
                                                    className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-600/50 rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                                    Stop Stream
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleStartStream}
                                                    className="px-3 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-500 border border-green-600/50 rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                                                >
                                                    <Server className="w-3 h-3" />
                                                    Start Stream
                                                </button>
                                            )}

                                            {/* Recording Button */}
                                            {isStreaming && (
                                                <button
                                                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                                                    className={`px-3 py-1 border rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${isRecording
                                                        ? 'bg-red-500/20 hover:bg-red-500/40 text-red-500 border-red-500/50'
                                                        : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300 border-gray-600'
                                                        }`}
                                                >
                                                    {isRecording ? <StopCircle className="w-3 h-3 animate-pulse" /> : <Video className="w-3 h-3" />}
                                                    {isRecording ? 'Rec ON' : 'Record'}
                                                </button>
                                            )}


                                            {liveScreen && <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold px-2 py-0.5 bg-red-500/10 rounded animate-pulse"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> LIVE</span>}
                                            <button
                                                onClick={handleToggleFullscreen}
                                                className="text-gray-400 hover:text-white transition-colors"
                                                title={isScreenMaximized ? "Exit Full Screen" : "Enter Full Screen"}
                                            >
                                                {isScreenMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative overflow-hidden bg-black min-h-0">
                                        {liveScreen ? (
                                            <>
                                                <video
                                                    ref={videoRef}
                                                    className="absolute inset-0 w-full h-full object-contain z-10"
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    onTimeUpdate={(e) => {
                                                        const v = e.currentTarget;
                                                        // Update debug info periodically or on frame
                                                        const debugEl = document.getElementById('debug-stats');
                                                        if (debugEl) {
                                                            debugEl.innerText = `Res: ${v.videoWidth}x${v.videoHeight} | State: ${v.readyState} | Paused: ${v.paused} | Muted: ${v.muted}`;
                                                        }
                                                    }}
                                                />
                                                <div className="absolute top-2 left-2 bg-black/70 text-green-400 font-mono text-[10px] p-2 rounded pointer-events-none z-10 border border-green-500/30">
                                                    <p className="font-bold underline mb-1">DEBUG INFO</p>
                                                    <p id="debug-stats">Waiting for video data...</p>
                                                    <p>Time: {new Date().toLocaleTimeString()}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center text-gray-600 bg-gray-900/50 p-8 rounded-xl border border-dashed border-gray-700">
                                                <div className="w-12 h-12 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                                                <h3 className="text-white font-bold mb-2">Waiting for video stream...</h3>

                                                <div className="text-xs font-mono text-left inline-block bg-black/50 p-3 rounded border border-gray-800 space-y-1">
                                                    <p className="text-gray-400">Target Agent: <span className="text-blue-400">{selectedAgentId}</span></p>
                                                    <p className="text-gray-400">Socket Status: <span className={socketStatus.includes('Joined') ? 'text-green-400' : 'text-yellow-400'}>{socketStatus}</span></p>
                                                    <p className="text-gray-400">Stream Active: <span className={isStreaming ? 'text-green-400' : 'text-red-400'}>{isStreaming ? 'YES' : 'NO'}</span></p>
                                                </div>

                                                <p className="text-xs mt-4 text-gray-500 max-w-xs mx-auto">
                                                    If stuck here: Ensure Agent {selectedAgentId} is running and has localized the same ID.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MODE 3: SCREENSHOTS GALLERY */}
                        {viewMode === 'screenshots' && (
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50">
                                <ScreenshotsGallery agentId={selectedAgentId} apiUrl={API_URL} token={token} />
                            </div>
                        )}

                        {/* MODE 4: ACTIVITY LOGS */}
                        {viewMode === 'activity' && (
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50">
                                <ActivityLogViewer agentId={selectedAgentId} apiUrl={API_URL} token={token} />
                            </div>
                        )}

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-800 bg-gray-800/50 flex justify-between items-center">
                            <div className="text-xs text-gray-500">
                                {viewMode === 'logs' && <span>Showing all historical events. Updates live.</span>}
                                {viewMode === 'monitor' && <span>Viewing live stream and recent events.</span>}
                                {viewMode === 'screenshots' && <span>Archive of captured screens and alert evidence.</span>}
                                {viewMode === 'activity' && <span>User activity (Web & App usage).</span>}
                            </div>
                            <button
                                onClick={closeModal}
                                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Close Viewer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ActivityLogViewer({ agentId, apiUrl, token }: { agentId: string, apiUrl: string, token: string | null }) {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        fetch(`${apiUrl}/api/events/activity/${agentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setLogs(data))
            .catch(e => console.error(e));
    }, [agentId]);

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs sticky top-0">
                    <tr>
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Details</th>
                        <th className="p-4">Duration</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-gray-300 font-mono">
                    {logs.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-500 italic">No activity recorded.</td></tr>
                    ) : (
                        logs.map((log, i) => (
                            <tr key={i} className="hover:bg-gray-700/30">
                                <td className="p-4 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs ${log.activityType === 'Web' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                        {log.activityType}
                                    </span>
                                </td>
                                <td className="p-4 break-all">
                                    {log.activityType === 'Web' ? (
                                        <a href={log.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{log.url}</a>
                                    ) : (
                                        <span>{log.processName} - {log.windowTitle}</span>
                                    )}
                                </td>
                                <td className="p-4">{log.durationSeconds.toFixed(1)}s</td>
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
    const { logout } = useAuth();

    useEffect(() => {
        setLoadingSettings(true);
        setError(null);

        // 1. Fetch Images (Historic)
        fetch(`${apiUrl}/api/screenshots/list/${agentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (res.status === 401) throw new Error("Unauthorized (Session Expired)");
                if (!res.ok) throw new Error("Failed to fetch images");
                return res.json();
            })
            .then(data => setImages(data))
            .catch(e => {
                console.error(e);
                setError(e.message);
            });

        // 2. Fetch Settings
        fetch(`${apiUrl}/api/agents`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (res.status === 401) throw new Error("Unauthorized");
                return res.json();
            })
            .then((data: any[]) => {
                if (Array.isArray(data)) {
                    const agent = data.find(a => a.agentId === agentId || a.AgentId === agentId);
                    if (agent) {
                        const val = agent.screenshotsEnabled ?? agent.ScreenshotsEnabled;
                        setIsEnabled(val === true);
                    }
                } else {
                    console.warn("[Agents.tsx] Expected array for agents list but got:", data);
                    // Safely check for error detail
                    const errData = data as any;
                    if (errData && errData.detail) {
                        setError(errData.detail);
                    }
                }
                setLoadingSettings(false);
            })
            .catch(e => {
                console.error("[Agents.tsx] Failed to fetch settings:", e);
                setLoadingSettings(false);
                setError("Session expired or unauthorized. Please re-login.");
            });

        // 3. Socket Listener for Live Updates
        const newSocket = io(apiUrl, {
            transports: ['websocket'],
            query: { token }
        });

        newSocket.on('connect', () => {
            console.log("[Gallery] Socket Connected");
            newSocket.emit('join_room', { room: agentId });
        });

        newSocket.on('ReceiveScreen', (id: string, dataUri: string) => {
            if (id === agentId) {
                // Prepend new image
                const newImg = {
                    Filename: `Live Capture`,
                    Date: 'Just Now',
                    Timestamp: new Date().toISOString(),
                    IsAlert: false,
                    Url: '', // We use dataUri for src
                    dataUri: dataUri
                };
                setImages(prev => [newImg, ...prev]);
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [agentId, apiUrl, token]);

    const toggleScreenshots = async () => {
        const newVal = !isEnabled;
        setIsEnabled(newVal); // Optimistic UI
        try {
            const res = await fetch(`${apiUrl}/api/agents/${agentId}/toggle-screenshots?enabled=${newVal}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                throw new Error("Unauthorized (Session Expired)");
            }
            if (!res.ok) throw new Error("Failed to toggle settings");
        } catch (e: any) {
            console.error("Toggle failed", e);
            setIsEnabled(!newVal); // Revert
            setError(e.message || "Failed to update settings");
        }
    };

    // --- Settings Logic ---
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({
        quality: 80,
        resolution: 'Original',
        maxSize: 0 // KB
    });

    const loadSettings = async () => {
        // Fetch current agent details to populate settings
        // Ideally we should have a GET /settings, but GET /agents will work if we expose the fields
        // Since we didn't update GET /agents explicitly to return these (pydantic model might default), let's assume valid default
        // Actually, we should update the DTO on backend, but let's try reading what we have.
        // For now, simpler to rely on defaults or what comes back from the toggle/report if we stored it.
        // Let's implement a fetch inside `useEffect` above or just here.
        // Rely on report data if we can, but let's do a specific fetch.
        // Actually, the best way for now is just assume defaults or fetch agent again.
        // Let's rely on the previous fetch in useEffect (commented out logic) or fetch specifically.
        // To save time, we'll fetch agent again here when opening modal.
        try {
            const res = await fetch(`${apiUrl}/api/agents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const agent = data.find((a: any) => a.agentId === agentId || a.AgentId === agentId);
            if (agent) {
                setSettings({
                    quality: agent.ScreenshotQuality || 80,
                    resolution: agent.ScreenshotResolution || 'Original',
                    maxSize: agent.MaxScreenshotSize || 0
                });
            }
        } catch (e) { console.error(e); }
    };

    const saveSettings = async () => {
        try {
            await fetch(`${apiUrl}/api/agents/${agentId}/settings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ScreenshotQuality: settings.quality,
                    ScreenshotResolution: settings.resolution,
                    MaxScreenshotSize: settings.maxSize
                })
            });
            setShowSettings(false);
            // Could show toast success
        } catch (e) {
            console.error("Failed settings save", e);
        }
    };


    if (error) {
        return (
            <div className="p-8 text-center border-t border-dashed border-red-900/50 bg-red-900/10 rounded-lg mt-4">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <h3 className="text-white font-bold mb-1">Connection Error</h3>
                <p className="text-red-400 text-sm mb-4">{error}</p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold uppercase tracking-wider"
                    >
                        Retry
                    </button>
                    <button
                        onClick={() => logout()}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold uppercase tracking-wider"
                    >
                        Login Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Controls */}
            <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Image className="w-5 h-5 text-blue-500" />
                        Captured Evidence
                    </h3>
                    <p className="text-xs text-gray-400">Manage automated screenshot collection for this agent.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={async () => {
                            try {
                                await fetch(`${apiUrl}/api/agents/${agentId}/take-screenshot`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                            } catch (e) {
                                console.error("Manual capture failed", e);
                            }
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded shadow-sm mr-2"
                    >
                        Capture Now
                    </button>

                    {/* Settings Button */}
                    <button
                        onClick={() => { setShowSettings(true); loadSettings(); }}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors mr-2"
                        title="Configure Quality"
                    >
                        <SettingsIcon className="w-5 h-5" />
                    </button>

                    <span className={`text-sm font-bold ${isEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                        {isEnabled ? 'Active' : 'Paused'}
                    </span>
                    <button
                        onClick={toggleScreenshots}
                        disabled={loadingSettings}
                        className={`w-12 h-6 rounded-full p-1 transition-colors relative ${isEnabled ? 'bg-green-600' : 'bg-gray-700'}`}
                    >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>

                    {/* Settings Modal */}
                    {showSettings && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg w-96 shadow-xl">
                                <h3 className="text-lg font-bold text-white mb-4">Screenshot Settings</h3>

                                <div className="space-y-4">
                                    {/* Resolution */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Resolution</label>
                                        <select
                                            value={settings.resolution}
                                            onChange={e => setSettings({ ...settings, resolution: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 text-sm"
                                        >
                                            <option value="Original">Original (Full Size)</option>
                                            <option value="720p">720p (HD)</option>
                                            <option value="480p">480p (SD)</option>
                                        </select>
                                    </div>

                                    {/* Quality Slider */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1 flex justify-between">
                                            <span>Quality (Compression)</span>
                                            <span>{settings.quality}%</span>
                                        </label>
                                        <input
                                            type="range" min="10" max="100" step="10"
                                            value={settings.quality}
                                            onChange={e => setSettings({ ...settings, quality: parseInt(e.target.value) })}
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Max Size */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Max File Size (KB)</label>
                                        <input
                                            type="number"
                                            placeholder="0 for Unlimited"
                                            value={settings.maxSize}
                                            onChange={e => setSettings({ ...settings, maxSize: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 text-sm"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">Set to 0 for unlimited size.</p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        onClick={() => setShowSettings(false)}
                                        className="px-3 py-1.5 text-gray-400 hover:text-white text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveSettings}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img, i) => (
                    <div key={i} className={`group relative bg-gray-800 rounded-lg overflow-hidden border ${img.IsAlert ? 'border-red-500/50' : 'border-gray-700'} hover:border-blue-500 transition-colors`}>
                        <div className="aspect-video bg-black relative">
                            <img
                                src={img.dataUri || `${apiUrl}${img.Url}?token=${token}`}
                                alt={img.Filename}
                                loading="lazy"
                                className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity"
                            />
                            {img.IsAlert && <div className="absolute top-1 right-1 bg-red-600 text-white text-[10px] uppercase font-bold px-1.5 rounded">Alert</div>}
                        </div>
                        <div className="p-2">
                            <p className="text-xs text-gray-300 font-mono">{img.Filename}</p>
                            <p className="text-[10px] text-gray-500">{new Date(img.Timestamp).toLocaleString()}</p>
                        </div>
                        <a
                            href={`${apiUrl}${img.Url}?token=${token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <span className="text-white text-xs font-bold border border-white/50 px-3 py-1 rounded-full hover:bg-white hover:text-black transition-colors">View Full</span>
                        </a>
                    </div>
                ))}
                {images.length === 0 && <div className="col-span-full text-center text-gray-500 py-12">No screenshots found for this agent.</div>}
            </div>
        </div>
    );
}
