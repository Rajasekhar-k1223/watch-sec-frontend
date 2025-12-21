import { useEffect, useState, useRef } from 'react';
import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';

interface Report {
    agentId: string;
    status: string;
    cpuUsage: number;
    memoryUsage: number;
    timestamp: string;
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
    const connectionRef = useRef<HubConnection>(null);

    // Configuration (Remote/Local)
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5140";

    useEffect(() => {
        // 1. Polling for Metrics & Event History
        const fetchData = async () => {
            try {
                // A. Metrics
                const res = await fetch(`${API_URL}/api/status`);
                if (res.ok) {
                    const agents: Report[] = await res.json();
                    setReports(agents);

                    // B. Event History (Sync DB logs)
                    agents.forEach(async (agent) => {
                        try {
                            const evtRes = await fetch(`${API_URL}/api/events/${agent.agentId}`);
                            if (evtRes.ok) {
                                const history = await evtRes.json();
                                setEvents(prev => ({ ...prev, [agent.agentId]: history }));
                            }
                        } catch { }
                    });
                }
            } catch (e) {
                console.error("Failed to connect to backend", e);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000); // Slower polling for data

        // 2. SignalR for Real-time Screens & Alerts
        const connection = new HubConnectionBuilder()
            .withUrl(`${API_URL}/streamHub`)
            .withAutomaticReconnect()
            .build();

        connection.on("ReceiveScreen", (agentId, base64Image) => {
            setScreens(prev => ({ ...prev, [agentId]: base64Image }));
        });

        connection.on("ReceiveEvent", (agentId, type, details, timestamp) => {
            setEvents(prev => {
                const agentEvents = prev[agentId] || [];
                // Keep last 20 events
                const newEvents = [{ type, details, timestamp }, ...agentEvents].slice(0, 20);
                return { ...prev, [agentId]: newEvents };
            });
        });

        connection.start()
            .then(() => {
                connectionRef.current = connection;
                console.log("Connected to SignalR at " + API_URL);
            })
            .catch(err => console.error("SignalR Connection Error: ", err));

        return () => {
            clearInterval(interval);
            connection.stop();
        };
    }, []);

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {reports.map(report => (
                    <div key={report.agentId} className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white">{report.agentId}</h2>
                            <span className={`px-3 py-1 rounded-full text-sm ${report.status === 'Running' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                {report.status}
                            </span>
                        </div>

                        {/* Live Screen Area */}
                        <div className="mb-6 bg-black rounded-lg overflow-hidden border border-gray-600 aspect-video relative group">
                            {screens[report.agentId] ? (
                                <img
                                    src={`data:image/webp;base64,${screens[report.agentId]}`}
                                    alt="Live Screen"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <span className="animate-pulse">Waiting for Stream...</span>
                                </div>
                            )}
                            <div className="absolute top-2 right-2 bg-red-600 text-xs px-2 py-1 rounded shadow animate-pulse text-white">
                                LIVE
                            </div>
                        </div>

                        {/* Event Log */}
                        <div className="bg-gray-900 rounded p-4 h-32 overflow-y-auto mb-4 border border-gray-700 font-mono text-xs">
                            <h3 className="text-gray-400 font-bold mb-2">ACTIVITY LOG</h3>
                            {events[report.agentId]?.map((evt, i) => {
                                // Try extract PID for Process Start events
                                const pidMatch = evt.details.match(/PID: (\d+)/);
                                const pid = pidMatch ? parseInt(pidMatch[1]) : null;

                                return (
                                    <div key={i} className="mb-1 flex items-center group/evt">
                                        <span className="text-gray-500">[{new Date(evt.timestamp).toLocaleTimeString()}]</span>
                                        <span className={`ml-2 font-bold ${evt.type === 'USB Inserted' ? 'text-yellow-400' : 'text-cyan-400'}`}>{evt.type}:</span>
                                        <span className="ml-2 text-gray-300 truncate max-w-xs" title={evt.details}>{evt.details}</span>

                                        {evt.type === 'Process Started' && pid && (
                                            <button
                                                onClick={() => {
                                                    if (connectionRef.current) {
                                                        connectionRef.current.invoke("KillProcess", report.agentId, pid)
                                                            .then(() => alert(`Kill command sent for PID ${pid} on agent ${report.agentId}.`))
                                                            .catch(err => console.error("Failed to send KillProcess command:", err));
                                                    } else {
                                                        alert("SignalR connection not established yet.");
                                                    }
                                                }}
                                                className="ml-auto bg-red-900 hover:bg-red-700 text-red-200 px-2 py-0.5 rounded text-[10px] opacity-0 group-hover/evt:opacity-100 transition-opacity text-white"
                                            >
                                                KILL
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            {!events[report.agentId] && <div className="text-gray-600 italic">No events detected...</div>}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm text-gray-400 mb-1">
                                    <span>CPU Usage</span>
                                    <span>{report.cpuUsage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${report.cpuUsage}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm text-gray-400 mb-1">
                                    <span>Memory Usage</span>
                                    <span>{report.memoryUsage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${report.memoryUsage}%` }}></div>
                                </div>
                            </div>

                            <div className="text-xs text-gray-500 mt-4 text-right">
                                Last heartbeat: {new Date(report.timestamp).toLocaleTimeString()}
                            </div>
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
