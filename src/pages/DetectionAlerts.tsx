import { useState, useEffect } from 'react';
import { ShieldAlert, Zap, Server, Clock, Brain } from 'lucide-react';
import { io } from 'socket.io-client';
import { SOCKET_URL, API_URL } from '../config';
import { AiReportModal } from '../components/AiReportModal';

interface DetectionAlert {
  Id: number;
  AgentId: string;
  RuleId: number;
  MatchedContent: string;
  Status: string;
  Timestamp: string;
}

export default function DetectionAlerts() {
  const [alerts, setAlerts] = useState<DetectionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCopilotAlertId, setActiveCopilotAlertId] = useState<number | null>(null);

  const fetchAlerts = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_URL}/v2/detection/alerts?status=New`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Connect to real-time alerts stream
    const socket = io(SOCKET_URL, {
      path: '/socket.io/',
      transports: ['websocket'],
      query: { token: sessionStorage.getItem('token') }
    });
    
    socket.on('connect', () => {
      console.log('Detection alerts socket connected');
    });
    
    socket.on('detection_alert', (newAlert: DetectionAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);

  const triggerSoar = async (alertId: number) => {
    // Placeholder for manual SOAR execution
    alert(`Triggering SOAR Playbook for Alert #${alertId}`);
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-gray-100">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-red-500" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Detection Alerts Queue</h1>
          <p className="text-gray-400">High-fidelity threats awaiting SOC review</p>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading alerts...</div>
      ) : (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="p-8 bg-gray-800/50 rounded-xl border border-gray-700/50 text-center text-gray-500">
              No new detection alerts. You're all clear!
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.Id} className="bg-gray-800/80 rounded-xl p-5 border border-red-500/30 flex items-start justify-between hover:border-red-500/50 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      CRITICAL
                    </span>
                    <span className="text-sm font-mono text-gray-400 flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(alert.Timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white">Rule #{alert.RuleId} Triggered</h3>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Server size={14} className="text-blue-400" />
                    <span className="font-mono text-blue-400">{alert.AgentId}</span>
                  </div>

                  <div className="bg-black/40 p-3 rounded border border-gray-700/50 mt-2 font-mono text-xs text-red-300">
                    {alert.MatchedContent}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setActiveCopilotAlertId(alert.Id)}
                    className="flex items-center gap-2 bg-indigo-900/50 hover:bg-indigo-600 text-indigo-300 hover:text-white px-4 py-2 rounded-lg font-medium border border-indigo-500/30 hover:border-indigo-500 transition-colors shadow-lg shadow-indigo-500/10"
                  >
                    <Brain size={16} /> AI Analyze
                  </button>
                  <button 
                    onClick={() => triggerSoar(alert.Id)}
                    className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-4 py-2 rounded-lg font-medium border border-emerald-500/30 hover:border-emerald-500 transition-colors"
                  >
                    <Zap size={16} /> Execute SOAR
                  </button>
                  <button className="text-sm text-gray-400 hover:text-white px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
                    Mark False Positive
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {activeCopilotAlertId !== null && (
        <AiReportModal 
          alertId={activeCopilotAlertId} 
          onClose={() => setActiveCopilotAlertId(null)} 
        />
      )}
    </div>
  );
}
