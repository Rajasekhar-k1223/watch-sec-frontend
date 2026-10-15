import { useState, useEffect } from 'react';
import { Keyboard, Clipboard, ShieldAlert, WifiOff } from 'lucide-react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

interface AuditEvent {
  AgentId: string;
  Type: string;
  Details: string;
  Timestamp: string;
  Severity: string;
  IsAlert?: boolean;
}

interface Props {
  agentId: string | null;
  token: string | null;
}

export default function InputAuditViewer({ agentId, token }: Props) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!agentId || !token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      query: { token },
      transports: ['polling', 'websocket']
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit("join_room", { room: agentId });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('new_audit_event', (data: AuditEvent) => {
      if (data.AgentId === agentId) {
        setEvents(prev => [data, ...prev].slice(0, 50)); // Keep last 50
      }
    });

    return () => {
      socket.off('new_audit_event');
      socket.disconnect();
    };
  }, [agentId, token]);

  const renderHighlightedText = (text: string, severity: string) => {
    if (severity !== 'High' && severity !== 'Critical') return <span>{text}</span>;
    
    // Simple regex to highlight sensitive words, case insensitive
    const sensitiveWords = ['password', 'confidential', 'secret', 'ssn', 'credit card', 'api_key'];
    const regex = new RegExp(`(${sensitiveWords.join('|')})`, 'gi');
    
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, i) => {
          if (sensitiveWords.some(w => w.toLowerCase() === part.toLowerCase())) {
            return <mark key={i} className="bg-red-500/30 text-red-400 rounded px-1 font-bold">{part}</mark>;
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="bg-[#111] p-4 rounded-lg border border-gray-800 flex flex-col h-[500px]">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-cyan-500" />
          Live Input Audit Stream
        </h3>
        <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest">
          {connected ? (
            <span className="text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Streaming</span>
          ) : (
            <span className="text-red-500 flex items-center gap-1"><WifiOff className="w-3 h-3" /> Disconnected</span>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50 space-y-3">
            <Keyboard className="w-8 h-8" />
            <p className="text-xs uppercase font-bold tracking-widest">Awaiting Input Events...</p>
          </div>
        ) : (
          events.map((evt, idx) => {
            const isKeystroke = evt.Type === 'KeystrokeLog';
            const isHighRisk = evt.Severity === 'High' || evt.Severity === 'Critical' || evt.IsAlert;
            
            return (
              <div key={idx} className={`p-3 rounded border transition-colors ${isHighRisk ? 'bg-red-900/10 border-red-500/30' : 'bg-[#1a1a1a] border-gray-800 hover:border-gray-700'}`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {isKeystroke ? <Keyboard className="w-3 h-3 text-cyan-500" /> : <Clipboard className="w-3 h-3 text-purple-500" />}
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isKeystroke ? 'text-cyan-500' : 'text-purple-500'}`}>
                      {isKeystroke ? 'Keystroke Buffer' : 'Clipboard Read'}
                    </span>
                    {isHighRisk && (
                      <span className="flex items-center gap-1 text-[9px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        <ShieldAlert className="w-3 h-3" /> DLP Alert
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(evt.Timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="bg-black/50 p-2.5 rounded border border-gray-800/50 font-mono text-xs text-gray-300 break-all leading-relaxed max-h-32 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                  {renderHighlightedText(evt.Details, evt.Severity)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
