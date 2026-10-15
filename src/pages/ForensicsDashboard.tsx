import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Server, RefreshCw, ArrowLeft, Camera, FileText, Download, Shield } from 'lucide-react';
import { SOCKET_URL, API_URL } from '../config';

interface TelemetryEvent {
  _id: string;
  _ingest_time: string;
  EventType: string;
  [key: string]: any;
}

interface AgentItem {
  AgentId: string;
  HostName?: string;
}

const ForensicsDashboard: React.FC = () => {
  const { agentId: routeAgentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [agentsList, setAgentsList] = useState<AgentItem[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string>(routeAgentId || '');
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch agents if needed
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/agents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.agents || []);
          const formatted = list.map((a: any) => ({
            AgentId: a.agent_id || a.AgentId,
            HostName: a.hostname || a.HostName || a.agent_id || a.AgentId
          }));
          setAgentsList(formatted);
          if (!activeAgentId && formatted.length > 0) {
            setActiveAgentId(formatted[0].AgentId);
          }
        }
      } catch (err) {
        console.error('Failed to load agents for forensics:', err);
      }
    };
    fetchAgents();
  }, []);

  const fetchTelemetry = async (targetId: string) => {
    if (!targetId) return;
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/agents/${targetId}/telemetry`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch telemetry:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeAgentId) {
      fetchTelemetry(activeAgentId);

      // Connect to real-time telemetry stream
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const socket = io(SOCKET_URL, {
        path: '/socket.io/',
        transports: ['websocket'],
        query: { token }
      });

      socket.on('connect', () => {
        socket.emit('join_room', { room: activeAgentId });
      });

      socket.on('telemetry_update', (newEvent: TelemetryEvent) => {
        if (newEvent.agentId === activeAgentId) {
          setEvents(prev => [newEvent, ...prev].slice(0, 100));
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [activeAgentId]);

  return (
    <div className="p-6 md:p-8 bg-gray-900 min-h-screen text-gray-100 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            Forensics & Deep Telemetry Hub
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Deep endpoint memory dumps, PCAP network captures, and display audits
          </p>
        </div>

        <div className="flex items-center gap-3">
          {agentsList.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5">
              <Server className="w-4 h-4 text-blue-400" />
              <select
                value={activeAgentId}
                onChange={(e) => setActiveAgentId(e.target.value)}
                className="bg-transparent text-sm text-white font-mono outline-none"
              >
                {agentsList.map(a => (
                  <option key={a.AgentId} value={a.AgentId} className="bg-gray-900">
                    {a.HostName} ({a.AgentId.slice(0, 8)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-gray-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        </div>
      </div>

      {loading && events.length === 0 ? (
        <div className="p-24 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span>Streaming endpoint forensic records...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Timeline Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/80 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                  Live Forensic Ingestion Stream
                </h2>
                <span className="text-xs font-mono text-gray-400">
                  Target: {activeAgentId || 'None'}
                </span>
              </div>

              <div className="space-y-4 max-h-[650px] overflow-y-auto pr-2">
                {events.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    No forensic telemetry events captured yet for this host.
                  </div>
                ) : (
                  events.map(ev => (
                    <div key={ev._id || Math.random()} className="bg-gray-900/90 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-xs font-mono font-bold uppercase">
                          {ev.EventType}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {new Date(ev._ingest_time || Date.now()).toLocaleString()}
                        </span>
                      </div>

                      {ev.EventType === 'ScreenshotCaptureReport' && ev.image_base64 ? (
                        <div className="mt-4">
                          <img 
                            src={`data:image/png;base64,${ev.image_base64}`} 
                            alt="Agent Screenshot" 
                            className="w-full rounded-lg border border-gray-700 shadow-lg object-contain bg-black/50"
                            style={{ maxHeight: '400px' }}
                          />
                          <p className="text-[10px] text-gray-500 mt-2 text-right">Captured on active display</p>
                        </div>
                      ) : ev.EventType === 'ClipboardAuditReport' && ev.clipboard_text ? (
                        <div className="mt-4 p-4 bg-gray-950/80 rounded border border-purple-500/30">
                          <p className="text-xs text-purple-400 font-bold uppercase mb-2">Clipboard Content Captured</p>
                          <p className="text-sm text-gray-300 font-mono break-words whitespace-pre-wrap">
                            {ev.clipboard_text}
                          </p>
                        </div>
                      ) : ev.EventType === 'PcapCaptureCompleted' && ev.FilePath ? (
                        <div className="mt-4 p-4 bg-gray-950/80 rounded border border-blue-500/30">
                          <p className="text-xs text-blue-400 font-bold uppercase mb-2">Network Packet Capture Generated</p>
                          <p className="text-sm text-gray-300 font-mono break-words whitespace-pre-wrap mb-4">
                            {ev.Message}
                          </p>
                          <a 
                            href={`${API_URL.replace('/api', '')}/storage/pcaps/${activeAgentId}/${ev.FilePath}`}
                            download
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors inline-block"
                          >
                            Download PCAP ({ev.FilePath})
                          </a>
                        </div>
                      ) : (
                        <pre className="text-xs text-gray-400 whitespace-pre-wrap overflow-x-auto mt-2 p-2 bg-black/40 rounded">
                          {JSON.stringify(ev, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Analytics */}
          <div className="space-y-6">
            <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/80 shadow-xl">
              <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                Forensic Artifact Status
              </h2>
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                  <span className="text-gray-500 block mb-1">TOTAL EVENTS LOGGED</span>
                  <span className="text-2xl font-bold text-indigo-400">{events.length}</span>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                  <span className="text-gray-500 block mb-1">LIVE STREAM CHANNEL</span>
                  <span className="text-emerald-400 font-bold">Encrypted WebSockets</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForensicsDashboard;
