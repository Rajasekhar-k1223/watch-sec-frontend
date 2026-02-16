import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Clock, WifiOff, AlertTriangle, Activity } from 'lucide-react';

interface BandwidthStats {
    status: 'active' | 'throttled' | 'paused';
    reason: string;
    buffered_bytes: number;
    timestamp: number;
}

interface BandwidthStatusProps {
    agentId: string;
    socket: Socket | null;
}

const BandwidthStatus: React.FC<BandwidthStatusProps> = ({ agentId, socket }) => {
    const [stats, setStats] = useState<BandwidthStats | null>(null);

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = (data: { agent_id: string; stats: BandwidthStats }) => {
            if (data.agent_id === agentId) {
                setStats(data.stats);
            }
        };

        socket.on('agent_bandwidth_update', handleUpdate);

        return () => {
            socket.off('agent_bandwidth_update', handleUpdate);
        };
    }, [socket, agentId]);

    if (!stats) return <span className="text-gray-500 text-xs animate-pulse">Syncing...</span>;

    // Formatting
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getStatusIcon = () => {
        switch (stats.status) {
            case 'active': return <Activity size={14} className="text-green-400" />;
            case 'throttled': return <Clock size={14} className="text-yellow-400" />;
            case 'paused': return <WifiOff size={14} className="text-red-400" />;
            default: return <AlertTriangle size={14} className="text-gray-400" />;
        }
    };

    const getStatusText = () => {
        if (stats.status === 'active') return 'Live Upload';
        if (stats.status === 'throttled') return 'Throttled';
        if (stats.status === 'paused') return 'Paused';
        return 'Unknown';
    };

    const getColorClass = () => {
        switch (stats.status) {
            case 'active': return 'border-green-500/30 bg-green-500/10 text-green-400';
            case 'throttled': return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
            case 'paused': return 'border-red-500/30 bg-red-500/10 text-red-400';
            default: return 'border-gray-500/30 bg-gray-500/10 text-gray-400';
        }
    };

    return (
        <div className={`flex items-center space-x-3 px-3 py-1.5 rounded-full border ${getColorClass()} transition-all duration-300`}>

            {/* Icon with Tooltip */}
            <div className="relative group flex items-center">
                {getStatusIcon()}

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 border border-gray-700 text-white text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none z-50">
                    <span className="font-bold">{stats.status.toUpperCase()}</span>
                    {stats.reason && <span className="block text-gray-400 text-[10px]">{stats.reason}</span>}
                </div>
            </div>

            {/* Status Text & Buffer */}
            <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold tracking-wide uppercase opacity-90">
                    {getStatusText()}
                </span>
                {stats.buffered_bytes > 0 && (
                    <span className="text-[9px] opacity-70 mt-0.5">
                        Buf: {formatBytes(stats.buffered_bytes)}
                    </span>
                )}
            </div>
        </div>
    );
};

export default BandwidthStatus;
