// NetworkGraph replaced with a lightweight static list view.
// react-force-graph-2d runs a WebGL/Canvas physics simulation that freezes low-end browsers.
import { useEffect, useState } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { Server, Wifi, WifiOff } from 'lucide-react';

interface AgentNode {
    agentId: string;
    localIp: string;
    status: string;
    gateway?: string;
}

export const NetworkTopology = () => {
    const { token } = useAuth();
    const [agents, setAgents] = useState<AgentNode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        const fetchTopology = async () => {
            try {
                const res = await fetch(`${API_URL}/dashboard/topology`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAgents(Array.isArray(data) ? data : []);
                }
            } catch { /* silent */ } finally {
                setLoading(false);
            }
        };
        fetchTopology();
        // Poll every 60s — not 30s — to reduce server load
        const interval = setInterval(fetchTopology, 60000);
        return () => clearInterval(interval);
    }, [token]);

    if (loading) return (
        <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Loading topology...
        </div>
    );

    if (agents.length === 0) return (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <Server className="w-8 h-8 text-gray-300" />
            <p className="text-sm">No agents discovered yet.</p>
        </div>
    );

    // Group by gateway
    const groups: Record<string, AgentNode[]> = {};
    agents.forEach(a => {
        const gw = a.gateway || 'Direct';
        if (!groups[gw]) groups[gw] = [];
        groups[gw].push(a);
    });

    return (
        <div className="w-full h-full overflow-y-auto p-4 space-y-4">
            {Object.entries(groups).map(([gw, nodes]) => (
                <div key={gw}>
                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100">
                        <Wifi className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{gw}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">{nodes.length} nodes</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-4">
                        {nodes.map(node => {
                            const online = node.status?.toLowerCase() === 'online';
                            return (
                                <div key={node.agentId} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    {online
                                        ? <Wifi className="w-3 h-3 text-emerald-500 shrink-0" />
                                        : <WifiOff className="w-3 h-3 text-red-400 shrink-0" />
                                    }
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-bold text-gray-700 truncate">{node.agentId}</div>
                                        <div className="text-[9px] text-gray-400 font-mono">{node.localIp}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};
