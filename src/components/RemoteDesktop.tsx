import { useRef, useEffect, useState } from 'react';
import { Lock, Wifi, WifiOff, Video, StopCircle, Maximize2, Minimize2 } from 'lucide-react';
import { API_URL } from '../config';

interface Props {
    agentId: string;
}

export default function RemoteDesktop({ agentId }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [status, setStatus] = useState<string>('Disconnected');
    const [isConnected, setIsConnected] = useState(false);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Fullscreen State
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        // Auto-reconnect logic is inherent here: 
        // On page reload, component mounts -> useEffect runs -> connects.
        const connect = () => {
            const wsUrl = API_URL.replace('http', 'ws') + `/api/ws/admin/${agentId}`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;
            ws.binaryType = 'blob';

            ws.onopen = () => {
                setStatus('Connected');
                setIsConnected(true);
            };

            ws.onclose = () => {
                setStatus('Disconnected');
                setIsConnected(false);
                // Optional: Retry logic could go here if connection drops without page reload
            };

            ws.onmessage = async (event) => {
                if (event.data instanceof Blob) {
                    const bitmap = await createImageBitmap(event.data);
                    const canvas = canvasRef.current;
                    if (!canvas) return;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
                        canvas.width = bitmap.width;
                        canvas.height = bitmap.height;
                    }

                    ctx.drawImage(bitmap, 0, 0);
                }
            };
        };

        connect();

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [agentId]);

    const sendInput = (type: string, data: any = {}) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, ...data }));
        }
    };

    const handleLock = () => {
        if (confirm("Are you sure you want to lock the remote workstation?")) {
            sendInput('lock');
        }
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            // Stop
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
            }
        } else {
            // Start
            const canvas = canvasRef.current;
            if (!canvas) return;

            try {
                const stream = canvas.captureStream(30); // 30 FPS
                const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
                chunksRef.current = [];

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };

                recorder.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `remote-session-${agentId}-${new Date().toISOString()}.webm`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                };

                recorder.start();
                mediaRecorderRef.current = recorder;
                setIsRecording(true);
            } catch (e) {
                console.error("Recording failed", e);
                alert("Failed to start recording. Browser might not support Canvas capture.");
            }
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
