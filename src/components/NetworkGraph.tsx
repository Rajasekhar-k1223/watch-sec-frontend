import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Globe, Network } from 'lucide-react';

interface NetworkNode {
    agentId: string;
    localIp: string;
    gateway: string;
    lastSeen: string;
    status: string;
}

interface SubnetCluster {
    gateway: string;
    agents: NetworkNode[];
}

export const NetworkTopology: React.FC = () => {
    const [subnets, setSubnets] = useState<SubnetCluster[]>([]);
    const [loading, setLoading] = useState(true);
    const canvasRef = useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const fetchTopology = async () => {
            try {
                // Mock or Real? Real endpoint exists: /api/dashboard/topology
                // For dev/demo if backend is empty, fallback to mock data
                const res = await fetch('http://localhost:5140/api/dashboard/topology');

                let data: NetworkNode[] = [];
                if (res.ok) {
                    data = await res.json();
                }

                if (data.length === 0) {
                    // Fallback Mock Data for Visualization Demo
                    data = [
                        { agentId: "DESKTOP-HQ-01", localIp: "192.168.1.10", gateway: "192.168.1.1", lastSeen: new Date().toISOString(), status: "Online" },
                        { agentId: "DESKTOP-HQ-02", localIp: "192.168.1.15", gateway: "192.168.1.1", lastSeen: new Date().toISOString(), status: "Online" },
                        { agentId: "SERVER-DB-01", localIp: "10.0.0.5", gateway: "10.0.0.1", lastSeen: new Date().toISOString(), status: "Online" },
                        { agentId: "SERVER-WEB-01", localIp: "10.0.0.6", gateway: "10.0.0.1", lastSeen: new Date().toISOString(), status: "Online" },
                        { agentId: "GUEST-LAPTOP", localIp: "172.16.0.45", gateway: "172.16.0.1", lastSeen: new Date().toISOString(), status: "Offline" },
                    ];
                }

                // Group by Gateway
                const groups: { [key: string]: NetworkNode[] } = {};
                data.forEach(a => {
                    const gw = a.gateway || "Unknown";
                    if (!groups[gw]) groups[gw] = [];
                    groups[gw].push(a);
                });

                const clusters = Object.keys(groups).map(gw => ({
                    gateway: gw,
                    agents: groups[gw]
                }));
                setSubnets(clusters);
            } catch (err) {
                console.error("Failed to load topology", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTopology();
        const interval = setInterval(fetchTopology, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, []);

    // Responsive Canvas
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current && canvasRef.current.parentElement) {
                setDimensions({
                    width: canvasRef.current.parentElement.clientWidth,
                    height: 600
                });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-emerald-400" /></div>;

    // Visualization Logic: Force Directed-ish
    // Center: Internet/Cloud
    // Ring 1: Gateways
    // Ring 2: Agents connected to Gateways

    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    const cloudRadius = 60;
    const gatewayOrbit = 180;
    const agentOrbit = 100; // Relative properly used below

    return (
        <div className="w-full h-[600px] bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden relative">
            <h2 className="absolute top-4 left-4 text-emerald-400 font-mono text-sm uppercase tracking-wider flex items-center gap-2">
                <Network className="w-4 h-4" /> Live Network Topology
            </h2>

            <svg ref={canvasRef} width={dimensions.width} height={dimensions.height} className="pointer-events-none">
                <defs>
                    <radialGradient id="grad-cloud" cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </radialGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Draw Lines First (Behind Nodes) */}
                {/* 1. Cloud to Gateways */}
                {subnets.map((sub, i) => {
                    const angle = (2 * Math.PI * i) / subnets.length;
                    const gx = cx + Math.cos(angle) * gatewayOrbit;
                    const gy = cy + Math.sin(angle) * gatewayOrbit;

                    return (
                        <g key={`link-cloud-${i}`}>
                            <line x1={cx} y1={cy} x2={gx} y2={gy} stroke="#10b981" strokeWidth="1" strokeOpacity="0.3" />
                            {/* Agents to This Gateway */}
                            {sub.agents.map((agent, j) => {
                                // Fan out agents around gateway
                                const subAngle = (2 * Math.PI * j) / sub.agents.length + angle;
                                const ax = gx + Math.cos(subAngle) * agentOrbit;
                                const ay = gy + Math.sin(subAngle) * agentOrbit;

                                return (
                                    <line key={`link-agent-${agent.agentId}`} x1={gx} y1={gy} x2={ax} y2={ay} stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.3" />
                                );
                            })}
                        </g>
                    );
                })}


                {/* Central Cloud Node */}
                <circle cx={cx} cy={cy} r={cloudRadius} fill="url(#grad-cloud)" />
                <Globe x={cx - 16} y={cy - 16} className="w-8 h-8 text-emerald-400" />
                <text x={cx} y={cy + 40} textAnchor="middle" fill="#10b981" fontSize="12" className="font-mono">INTERNET</text>

                {/* Subnet Cluster Nodes */}
                {subnets.map((sub, i) => {
                    const angle = (2 * Math.PI * i) / subnets.length;
                    const gx = cx + Math.cos(angle) * gatewayOrbit;
                    const gy = cy + Math.sin(angle) * gatewayOrbit;

                    return (
                        <g key={`group-${sub.gateway}`}>
                            {/* Gateway Node */}
                            <circle cx={gx} cy={gy} r="25" fill="#1e293b" stroke="#10b981" strokeWidth="2" filter="url(#glow)" />
                            <Network x={gx - 12} y={gy - 12} className="w-6 h-6 text-emerald-400" />
                            <text x={gx} y={gy + 40} textAnchor="middle" fill="#94a3b8" fontSize="10" className="font-mono">{sub.gateway}</text>

                            {/* Agents in Subnet */}
                            {sub.agents.map((agent, j) => {
                                const subAngle = (2 * Math.PI * j) / sub.agents.length + angle;
                                const ax = gx + Math.cos(subAngle) * agentOrbit;
                                const ay = gy + Math.sin(subAngle) * agentOrbit;
                                const isOnline = agent.status === 'Online';

                                return (
                                    <g key={`node-${agent.agentId}`} className="group cursor-pointer">
                                        <circle
                                            cx={ax} cy={ay} r="8"
                                            fill={isOnline ? "#3b82f6" : "#64748b"}
                                            stroke={isOnline ? "#60a5fa" : "#94a3b8"}
                                            strokeWidth="1"
                                        />
                                        {/* Hover Tooltip (Basic implementation via SVG title, or overlay div) */}
                                        <title>{`${agent.agentId}\nIP: ${agent.localIp}\nStatus: ${agent.status}`}</title>

                                        <text x={ax} y={ay + 20} textAnchor="middle" fill="#cbd5e1" fontSize="9" className="opacity-0 group-hover:opacity-100 transition-opacity font-mono select-none pointer-events-none">
                                            {agent.agentId}
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}

            </svg>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-black/60 p-2 rounded border border-white/5 text-xs font-mono text-gray-400">
                <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Gateway</div>
                <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Agent (Online)</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-500"></div> Agent (Offline)</div>
            </div>
        </div>
    );
};
