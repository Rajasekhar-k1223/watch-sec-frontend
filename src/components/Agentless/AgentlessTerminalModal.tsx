import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { X, Terminal as TerminalIcon, Minus, Maximize2 } from 'lucide-react';
import { SOCKET_URL } from '../../config';
import 'xterm/css/xterm.css';

interface AgentlessTerminalModalProps {
  terminalId: string;
  endpointIp: string;
  offsetIndex?: number;
  onClose: () => void;
  onFocus?: () => void;
}

export function AgentlessTerminalModal({ terminalId, endpointIp, offsetIndex = 0, onClose, onFocus }: AgentlessTerminalModalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Dragging state
  const [position, setPosition] = useState({ x: 150 + offsetIndex * 30, y: 50 + offsetIndex * 30 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return;
    setIsDragging(true);
    if (onFocus) onFocus();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: dragRef.current.initialX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.initialY + (e.clientY - dragRef.current.startY)
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"Fira Code", monospace',
      fontSize: 14,
      theme: {
        background: '#0f172a', // slate-900
        foreground: '#10b981', // emerald-500
        cursor: '#10b981',
      },
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect to Socket.IO backend
    const socket = io(SOCKET_URL, {
      path: "/socket.io",
      auth: { token },
      query: { token: token || '' },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      term.writeln('\x1b[33m[+] WebSocket connected. Requesting SSH channel...\x1b[0m');
      socket.emit('start_agentless_terminal', { terminal_id: terminalId, ip: endpointIp });
    });

    socket.on('agentless_terminal_output', (data: { terminal_id?: string, ip?: string, output: string }) => {
      if (!data.terminal_id || data.terminal_id === terminalId) {
        term.write(data.output);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      term.writeln('\x1b[31m[-] WebSocket disconnected.\x1b[0m');
    });

    // Handle user input
    term.onData((data) => {
      socket.emit('agentless_terminal_input', { terminal_id: terminalId, ip: endpointIp, input: data });
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.disconnect();
      term.dispose();
    };
  }, [endpointIp, token, terminalId]);

  useEffect(() => {
    if (fitAddonRef.current && !isMinimized) {
      setTimeout(() => fitAddonRef.current?.fit(), 100);
    }
  }, [isMinimized]);

  return (
    <div 
      className="fixed z-50 pointer-events-auto transition-all duration-300 ease-in-out"
      style={isMinimized ? {
        top: 'auto',
        bottom: '0px',
        right: `${24 + (offsetIndex * 310)}px`,
        left: 'auto',
        width: '300px',
        height: '48px',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0
      } : {
        top: `${Math.max(0, Math.min(position.y, window.innerHeight - 500))}px`,
        left: `${Math.max(0, Math.min(position.x, window.innerWidth - 800))}px`,
        width: '800px',
        height: '500px'
      }}
      onClick={() => onFocus && onFocus()}
    >
      <div className="relative glass-card bg-slate-900 border border-emerald-500/30 w-full h-full flex flex-col rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.5)]">
        
        {/* Terminal Header */}
        <div 
          className={`flex items-center justify-between ${isMinimized ? 'p-2 px-4 h-full' : 'p-4'} border-b border-emerald-500/20 bg-black/50 ${isMinimized ? 'cursor-default' : 'cursor-move'}`}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <TerminalIcon className="text-emerald-500 w-5 h-5 flex-shrink-0" />
            <h2 className="text-emerald-500 font-mono font-bold tracking-widest uppercase truncate">
              {isMinimized ? endpointIp : `Secure Shell: ${endpointIp}`}
            </h2>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                {isConnected ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                )}
              </span>
              {!isMinimized && (
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isMinimized ? (
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded transition-colors"
                title="Minimize"
              >
                <Minus size={14} />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded transition-colors"
                title="Restore"
              >
                <Maximize2 size={14} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-red-600 rounded transition-colors"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className={`flex-1 p-2 bg-[#0f172a] overflow-hidden ${isMinimized ? 'hidden' : ''}`} ref={terminalRef}></div>
      </div>
    </div>
  );
}
