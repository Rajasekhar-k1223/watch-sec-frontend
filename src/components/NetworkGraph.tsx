import { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Loader2, Globe } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface NetworkNode {
    id: string;
    group: string; // 'cloud', 'gateway', 'agent'
    ip: string;
    status: string;
    val: number; // Size
    color?: string;
    icon?: string;
}

interface NetworkLink {
    source: string;
    target: string;
    value: number;
}

export const NetworkTopology = () => {
    const { token } = useAuth();
    const { theme } = useTheme();
    const [graphData, setGraphData] = useState<{ nodes: NetworkNode[], links: NetworkLink[] }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const graphRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    const fetchTopology = useCallback(async () => {
        try {
            // Mock or Real? Real endpoint exists: /api/dashboard/topology
            // For dev/demo if backend is empty, fallback to mock data
            // Use local mock data fallback if fetch fails or returns empty in a real scenario,
            // but for now we trust the API or handle error.

            // but for now we trust the API or handle error.

            if (!token) return;
            const res = await fetch(`${API_URL}/dashboard/topology`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let rawData: any[] = [];
            if (res.ok) {
                rawData = await res.json();
            }

            if (!rawData || rawData.length === 0) return;

            // Transform Flat Data into Graph (Cloud -> Gateways -> Agents)
            const nodes: NetworkNode[] = [];
            const links: NetworkLink[] = [];

            // 1. Central Cloud Node
            nodes.push({ id: "INTERNET", group: "cloud", ip: "0.0.0.0", status: "Online", val: 20, color: "#10b981" });

            const gateways = new Set<string>();

            rawData.forEach((item: any) => {
                const gw = item.gateway || "Unknown-Gateway";

                // 2. Gateway Nodes
                if (!gateways.has(gw)) {
                    gateways.add(gw);
                    nodes.push({ id: gw, group: "gateway", ip: gw, status: "Online", val: 10, color: "#3b82f6" });
                    links.push({ source: "INTERNET", target: gw, value: 2 });
                }

                // 3. Agent Nodes
                const isOnline = item.status?.toLowerCase() === 'online' || item.status?.toLowerCase() === 'running';
                nodes.push({
                    id: item.agentId,
                    group: "agent",
                    ip: item.localIp,
                    status: item.status,
                    val: 5,
                    color: isOnline ? "#60a5fa" : "#ef4444"
                });

                links.push({ source: gw, target: item.agentId, value: 1 });
            });

            console.log("Graph Data:", { nodes, links });
            setGraphData({ nodes, links });

            // Recenter Logic
            setTimeout(() => {
                if (graphRef.current) {
                    graphRef.current.zoomToFit(400);
                    graphRef.current.d3Force('charge')?.strength(-100); // Repel
                }
            }, 500);

        } catch (err) {
            console.error("Topology Error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (token) fetchTopology();
        const interval = setInterval(fetchTopology, 30000);
        return () => clearInterval(interval);
    }, [fetchTopology, token]);

    // Resize Handler
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };
        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 100); // Initial layout
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Node Paint Logic (Custom Icons on Canvas)
    const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const { x, y, val, color, group } = node;
        const size = val * 1.5;

        // Draw Circle Background
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();

        // Draw Icon Text (Simplified since loading images on canvas is async/complex here)
        // Instead, we use simple shapes or text characters
        ctx.font = `${size}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';

        if (group === 'cloud') ctx.fillText("☁️", x, y);
        else if (group === 'gateway') ctx.fillText("🌐", x, y);
        else ctx.fillText("💻", x, y);

        // Label (Only if Zoomed in or Gateway)
        if (globalScale > 1.2 || group !== 'agent') {
            const label = node.id;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(17, 24, 39, 0.8)';
            ctx.fillText(label, x, y + size + fontSize + 2);
        }
    }, [theme]);

    return (
        <div ref={containerRef} className="w-full h-[600px] bg-white dark:bg-gray-950 rounded-xl overflow-hidden relative border border-gray-200 dark:border-gray-800 shadow-2xl transition-colors">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                    <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
                </div>
            )}

            <h2 className="absolute top-4 left-4 z-10 text-emerald-400 font-mono text-sm uppercase tracking-wider flex items-center gap-2 pointer-events-none">
                <Globe className="w-4 h-4" /> Live Network Topology
            </h2>
            <p className="absolute bottom-4 left-4 z-10 text-gray-500 text-[10px] pointer-events-none">
                Drag nodes to rearrange • Scroll to Zoom
            </p>

            <ForceGraph2D
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                backgroundColor={theme === 'dark' ? "#0b0f19" : "#f9fafb"}
                nodeLabel="ip"
                nodeRelSize={6}
                linkColor={() => theme === 'dark' ? "#1f2937" : "#e5e7eb"} // Dark gray links vs light gray
                linkWidth={1.5}
                linkDirectionalParticles={2} // Flow animation
                linkDirectionalParticleSpeed={0.005} // Slow flow
                nodeCanvasObject={paintNode}
                cooldownTicks={100}
                onNodeDragEnd={(node: any) => {
                    node.fx = node.x;
                    node.fy = node.y;
                }}
            />
        </div>
    );
};
