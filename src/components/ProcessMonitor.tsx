import React, { useState, useEffect, useRef } from 'react';
import { 
    Activity, Search, XCircle, RefreshCw, Cpu, Server, 
    GitFork, ArrowRight, CornerDownRight, X, ShieldAlert, AlertTriangle
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { SOCKET_URL, API_URL } from '../config';

interface ProcessInfo {
    PID: number;
    PPID?: number;
    Name: string;
    CommandLine: string;
    CPU_Usage: number;
    Memory_Bytes: number;
    Disk_Written_Bytes: number;
    Disk_Read_Bytes: number;
}

interface ProcessMonitorProps {
    agentId: string;
    token: string;
}

export default function ProcessMonitor({ agentId, token }: ProcessMonitorProps) {
    const [processes, setProcesses] = useState<ProcessInfo[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [connected, setConnected] = useState(false);
    const [killing, setKilling] = useState<number | null>(null);
    const [treeRootProcess, setTreeRootProcess] = useState<ProcessInfo | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Connect to Socket.IO backend
        const socket = io(SOCKET_URL, {
            path: "/socket.io",
            transports: ['websocket'],
            auth: { token }
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join_room', { room: agentId });
        });

        socket.on('agent_processes', (data: { agent_id: string, processes: ProcessInfo[] }) => {
            if (data.agent_id === agentId) {
                setProcesses(data.processes);
            }
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, [agentId, token]);

    const handleKillProcess = (pid: number) => {
        if (!socketRef.current || !connected) {
            toast.error("Not connected to the live stream.");
            return;
        }

        if (window.confirm(`Are you sure you want to terminate process ID ${pid}?`)) {
            setKilling(pid);
            socketRef.current.emit('KillProcess', { agentId, pid });
            toast.success(`Kill command sent for PID ${pid}`);
            
            setTimeout(() => {
                setKilling(null);
            }, 3000);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const filteredProcesses = processes.filter(p => 
        p.Name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.CommandLine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.PID.toString().includes(searchTerm)
    );

    // Parent & Children for the currently selected tree modal
    const parentProcess = treeRootProcess?.PPID 
        ? processes.find(p => p.PID === treeRootProcess.PPID) 
        : null;

    const childProcesses = treeRootProcess 
        ? processes.filter(p => p.PPID === treeRootProcess.PID) 
        : [];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden font-sans relative shadow-inner">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Live Process Monitor & Execution Tree</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                                {connected ? 'Connected' : 'Disconnected'}
                            </span>
                            <span className="text-gray-300 dark:text-gray-700">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{processes.length} Processes</span>
                        </div>
                    </div>
                </div>

                <div className="relative w-64">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Search Name, PID, Command..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm rounded-lg pl-9 pr-4 py-2 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                <div className="col-span-1">PID (PPID)</div>
                <div className="col-span-3">Process Name</div>
                <div className="col-span-1 text-right flex items-center justify-end gap-1"><Cpu className="w-3.5 h-3.5" /> CPU</div>
                <div className="col-span-2 text-right flex items-center justify-end gap-1"><Server className="w-3.5 h-3.5" /> Memory</div>
                <div className="col-span-3">Command Line</div>
                <div className="col-span-2 text-right">Lineage & Actions</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto">
                {processes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                        <RefreshCw className={`w-8 h-8 ${connected ? 'animate-spin' : ''} text-gray-300 dark:text-gray-700`} />
                        <p className="text-sm font-medium">{connected ? 'Waiting for telemetry snapshot...' : 'Connecting to stream...'}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredProcesses.map(p => (
                            <div key={p.PID} className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                <div className="col-span-1 text-xs font-mono text-gray-500 dark:text-gray-400">
                                    <span className="font-bold text-gray-900 dark:text-gray-200">{p.PID}</span>
                                    {p.PPID ? <span className="text-[10px] text-gray-400 block font-normal">p:{p.PPID}</span> : null}
                                </div>
                                <div className="col-span-3 text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex items-center gap-2">
                                    {p.Name}
                                </div>
                                <div className="col-span-1 text-sm text-right font-mono font-medium">
                                    <span className={p.CPU_Usage > 10 ? 'text-amber-500' : 'text-gray-600 dark:text-gray-400'}>
                                        {p.CPU_Usage.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="col-span-2 text-sm text-right font-mono text-gray-600 dark:text-gray-400">
                                    {formatBytes(p.Memory_Bytes)}
                                </div>
                                <div className="col-span-3 text-xs font-mono text-gray-500 truncate" title={p.CommandLine}>
                                    {p.CommandLine || '-'}
                                </div>
                                <div className="col-span-2 text-right flex items-center justify-end gap-1.5">
                                    <button
                                        onClick={() => setTreeRootProcess(p)}
                                        className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all text-xs font-semibold flex items-center gap-1"
                                        title="View Process Tree Lineage"
                                    >
                                        <GitFork className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Tree</span>
                                    </button>

                                    <button 
                                        onClick={() => handleKillProcess(p.PID)}
                                        disabled={killing === p.PID}
                                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all disabled:opacity-50"
                                        title="Kill Process"
                                    >
                                        {killing === p.PID ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredProcesses.length === 0 && searchTerm && (
                            <div className="p-8 text-center text-sm text-gray-500">
                                No processes matched your search.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* PROCESS TREE MODAL */}
            {treeRootProcess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-gray-100">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <GitFork className="w-5 h-5 text-indigo-400" />
                                <div>
                                    <h3 className="text-base font-bold text-white">
                                        Execution Lineage Tree — PID {treeRootProcess.PID} ({treeRootProcess.Name})
                                    </h3>
                                    <p className="text-xs text-gray-400">Agent: {agentId}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setTreeRootProcess(null)}
                                className="text-gray-400 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Visual Tree Body */}
                        <div className="p-6 overflow-y-auto space-y-4">
                            {/* 1. Parent Process (if exists) */}
                            {parentProcess ? (
                                <div className="p-4 bg-gray-800/80 rounded-xl border border-gray-700">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                            Parent Process (PPID {parentProcess.PID})
                                        </span>
                                        <button
                                            onClick={() => handleKillProcess(parentProcess.PID)}
                                            className="text-xs text-red-400 hover:text-red-300 font-medium"
                                        >
                                            Terminate Parent
                                        </button>
                                    </div>
                                    <div className="text-sm font-bold text-white">{parentProcess.Name}</div>
                                    <div className="text-xs font-mono text-gray-400 truncate mt-1">{parentProcess.CommandLine || '-'}</div>
                                </div>
                            ) : treeRootProcess.PPID && treeRootProcess.PPID > 0 ? (
                                <div className="p-3 bg-gray-800/40 rounded-xl border border-gray-800 text-xs text-gray-500 font-mono">
                                    Parent PID: {treeRootProcess.PPID} (Process terminated or elevated outside current snapshot)
                                </div>
                            ) : (
                                <div className="p-3 bg-gray-800/40 rounded-xl border border-gray-800 text-xs text-gray-500 font-mono">
                                    Root Process (No parent PPID)
                                </div>
                            )}

                            {/* Arrow connector */}
                            <div className="flex justify-center text-indigo-400">
                                <CornerDownRight className="w-6 h-6" />
                            </div>

                            {/* 2. Target Process */}
                            <div className="p-5 bg-indigo-950/40 rounded-xl border-2 border-indigo-500 shadow-lg">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                                        Selected Process (PID {treeRootProcess.PID})
                                    </span>
                                    <button
                                        onClick={() => handleKillProcess(treeRootProcess.PID)}
                                        className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-all shadow"
                                    >
                                        Kill Process
                                    </button>
                                </div>
                                <div className="text-base font-bold text-white">{treeRootProcess.Name}</div>
                                <div className="text-xs font-mono text-gray-300 mt-1 break-all bg-black/40 p-2.5 rounded border border-gray-700">
                                    {treeRootProcess.CommandLine || 'No commandline parameters'}
                                </div>
                                <div className="flex items-center gap-4 text-xs font-mono text-gray-400 mt-3 pt-2 border-t border-indigo-900/50">
                                    <span>CPU: {treeRootProcess.CPU_Usage.toFixed(1)}%</span>
                                    <span>Memory: {formatBytes(treeRootProcess.Memory_Bytes)}</span>
                                    <span>Disk Written: {formatBytes(treeRootProcess.Disk_Written_Bytes)}</span>
                                </div>
                            </div>

                            {/* 3. Child Processes */}
                            {childProcesses.length > 0 && (
                                <>
                                    <div className="flex justify-center text-indigo-400">
                                        <CornerDownRight className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                            Spawned Child Processes ({childProcesses.length})
                                        </span>
                                        {childProcesses.map(child => (
                                            <div key={child.PID} className="p-3 bg-gray-800/80 rounded-xl border border-gray-700 flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-bold text-white flex items-center gap-2">
                                                        <span>PID {child.PID}: {child.Name}</span>
                                                    </div>
                                                    <div className="text-[11px] font-mono text-gray-400 truncate max-w-md">{child.CommandLine}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleKillProcess(child.PID)}
                                                    className="text-xs text-red-400 hover:text-red-300 font-semibold"
                                                >
                                                    Kill
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-800 flex items-center justify-end">
                            <button
                                onClick={() => setTreeRootProcess(null)}
                                className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold"
                            >
                                Close Lineage View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
