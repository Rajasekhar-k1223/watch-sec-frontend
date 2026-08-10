import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

interface TelemetryEvent {
  _id: string;
  _ingest_time: string;
  EventType: string;
  [key: string]: any;
}

const ForensicsDashboard: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTelemetry = async () => {
    if (!agentId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/agent/${agentId}/telemetry`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Failed to fetch telemetry:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    
    // Connect to real-time telemetry stream
    const socket = io(SOCKET_URL, {
      path: '/socket.io/',
      transports: ['websocket'],
      query: { token: localStorage.getItem('token') }
    });
    
    socket.on('connect', () => {
      console.log('Forensics socket connected');
    });
    
    socket.on('telemetry_update', (newEvent: TelemetryEvent) => {
      if (newEvent.agentId === agentId) {
        setEvents(prev => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events
      }
    });
    
    return () => {
      socket.disconnect();
    };
  }, [agentId]);

  if (loading) {
    return <div className="flex justify-center items-center h-full text-white">Loading advanced telemetry...</div>;
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-gray-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            Forensics & Telemetry Hub
          </h1>
          <p className="text-gray-400 mt-2">Deep endpoint inspection for Agent {agentId}</p>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          &larr; Back to Fleet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timeline Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 shadow-2xl">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              Live Event Stream
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {events.length === 0 ? (
                <p className="text-gray-400 italic">No telemetry data available yet...</p>
              ) : (
                events.map(ev => (
                  <div key={ev._id} className="bg-gray-900/80 p-4 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs font-mono uppercase">
                        {ev.EventType}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {new Date(ev._ingest_time).toLocaleString()}
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
          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-md rounded-xl p-6 border border-indigo-500/20 shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-2">Endpoint Status</h2>
            <div className="flex flex-col gap-4 mt-4">
              <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400 mb-1">Total Events Captured</p>
                <p className="text-2xl font-mono text-indigo-400">{events.length}</p>
              </div>
              <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400 mb-1">Last Sync</p>
                <p className="text-sm font-mono text-gray-300">
                  {events.length > 0 ? new Date(events[0]._ingest_time).toLocaleTimeString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 shadow-lg">
             <h2 className="text-lg font-semibold text-white mb-2">Deep Compliance</h2>
             <p className="text-xs text-gray-400 mb-4">Firewalls, Passwords, Admins</p>
             <div className="space-y-3">
               <div className="flex items-center justify-between p-2 bg-gray-900/40 rounded border border-gray-700/30">
                 <span className="text-sm text-gray-300">Firewall Rules</span>
                 <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Auditing</span>
               </div>
               <div className="flex items-center justify-between p-2 bg-gray-900/40 rounded border border-gray-700/30">
                 <span className="text-sm text-gray-300">Local Admins</span>
                 <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">Auditing</span>
               </div>
               <div className="flex items-center justify-between p-2 bg-gray-900/40 rounded border border-gray-700/30">
                 <span className="text-sm text-gray-300">Crash Dumps</span>
                 <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">Monitoring</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForensicsDashboard;
