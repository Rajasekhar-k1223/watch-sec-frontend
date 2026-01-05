import { useRef, useEffect, useState, useCallback } from 'react';
import { Lock, Wifi, WifiOff, Video, StopCircle, Maximize2, Minimize2, Play, Square } from 'lucide-react';
import { API_URL } from '../config';
import { io, Socket } from 'socket.io-client';

interface Props {
    agentId: string;
}

export default function RemoteDesktop({ agentId }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const [status, setStatus] = useState<string>('Disconnected');
    const [isConnected, setIsConnected] = useState(false);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);

    // Fullscreen State
    const [isFullscreen, setIsFullscreen] = useState(false);

    const connectSocket = useCallback(() => {
        if (socketRef.current?.connected) return;

        console.log("[RemoteDesktop] Connecting...");
        const socket = io(API_URL, {
            transports: ['websocket'],
            reconnection: true,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setStatus('Connected');
            setIsConnected(true);
            // Join Agent Room to receive stream
            socket.emit('join', { room: agentId });
        });

        socket.on('disconnect', () => {
            setStatus('Disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error("Socket Error:", err);
            setStatus('Error');
        });

        // Handle Stream Frames (Base64)
        socket.on('receive_stream_frame', async (data: { image: string }) => {
            if (!data.image) return;

            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const img = new Image();
            img.onload = () => {
                if (canvas.width !== img.width || canvas.height !== img.height) {
                    canvas.width = img.width;
                    canvas.height = img.height;
                }
                ctx.drawImage(img, 0, 0);
            };
            img.src = `data:image/jpeg;base64,${data.image}`;
        });
    }, [agentId]);

    const disconnectSocket = useCallback(() => {
        if (socketRef.current) {
            console.log("[RemoteDesktop] Disconnecting...");
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
            setStatus('Disconnected');
        }
    }, []);

    useEffect(() => {
        connectSocket();
        return () => disconnectSocket();
    }, [connectSocket, disconnectSocket]);

    const sendInput = (type: string, data: any = {}) => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('RemoteInput', {
                agentId,
                type,
                ...data
            });
        }
    };

    const handleLock = () => {
        if (confirm("Are you sure you want to lock the remote workstation?")) {
            sendInput('lock');
        }
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            // Stop Agent Recording
            sendInput('stop_recording');
            setIsRecording(false);
            alert("Recording stopped. Agent is uploading the video to the backend.");
        } else {
            // Start Agent Recording
            sendInput('start_recording');
            setIsRecording(true);
        }
    };

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => console.error(err));
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        sendInput('mousemove', { x, y });
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        sendInput('click', { x, y, button: e.button === 0 ? 'left' : 'right' });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        sendInput('keypress', { key: e.key.toLowerCase() });
        if (['Tab', 'Alt', 'Control', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
        }
    };

    return (
        <div ref={containerRef} className="flex flex-col h-full bg-black rounded-lg overflow-hidden border border-gray-800 outline-none" tabIndex={0} onKeyDown={handleKeyDown}>
            {/* Toolbar */}
            <div className="bg-gray-900 border-b border-gray-800 p-2 flex justify-between items-center text-xs shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <span className={`flex items-center gap-1 font-bold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                        {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />} {status}
                    </span>
                    <span className="text-gray-500 hidden md:inline">
                        {canvasRef.current ? `${canvasRef.current.width}x${canvasRef.current.height}` : 'No Signal'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-gray-500 italic hidden md:block mr-2">Click screen to focus</div>

                    {/* Connect/Disconnect Buttons */}
                    {!isConnected ? (
                        <button onClick={connectSocket} className="bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded border border-green-600 flex items-center gap-1 transition-colors">
                            <Play size={12} fill="currentColor" /> Connect
                        </button>
                    ) : (
                        <button onClick={disconnectSocket} className="bg-red-900/50 hover:bg-red-900 text-red-300 px-2 py-1 rounded border border-red-800 flex items-center gap-1 transition-colors">
                            <Square size={12} fill="currentColor" /> Disconnect
                        </button>
                    )}

                    <div className="w-px h-4 bg-gray-700 mx-1"></div>

                    <button onClick={handleToggleRecording} className={`px-2 py-1 rounded border flex items-center gap-1 transition-colors ${isRecording ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'}`}>
                        {isRecording ? <StopCircle size={14} className="animate-pulse" /> : <Video size={14} />}
                        {isRecording ? 'Stop Rec' : 'Record'}
                    </button>

                    <button onClick={handleLock} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-700 flex items-center gap-1 transition-colors">
                        <Lock size={12} /> Lock
                    </button>

                    <button onClick={handleToggleFullscreen} className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-1.5 rounded border border-gray-700 transition-colors" title="Toggle Fullscreen">
                        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                </div>
            </div>

            {/* Screen */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-950 relative">
                {!isConnected && (
                    <div className="absolute text-center">
                        <div className="w-8 h-8 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">Waiting for Agent Stream...</p>
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-full cursor-crosshair shadow-2xl"
                    onMouseMove={handleMouseMove}
                    onClick={handleClick}
                    onContextMenu={(e) => { e.preventDefault(); handleClick(e); }}
                />
            </div>
        </div>
    );
}
