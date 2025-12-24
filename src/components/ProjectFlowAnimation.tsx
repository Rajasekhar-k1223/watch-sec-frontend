import { useEffect, useRef } from 'react';

export default function ProjectFlowAnimation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = canvas.parentElement?.clientWidth || 800;
        let height = canvas.height = 500; // Increased height

        // Nodes configuration
        const nodes = [
            { id: 'agent1', x: width * 0.1, y: height * 0.2, label: 'Agent A', color: '#64748b' }, // Slate
            { id: 'agent2', x: width * 0.1, y: height * 0.5, label: 'Agent B', color: '#64748b' },
            { id: 'agent3', x: width * 0.1, y: height * 0.8, label: 'Agent C', color: '#64748b' },

            { id: 'gateway', x: width * 0.3, y: height * 0.5, label: 'Usage Gateway', color: '#3b82f6' }, // Blue
            { id: 'analysis', x: width * 0.55, y: height * 0.5, label: 'Threat Analysis', color: '#a855f7' }, // Purple

            { id: 'db', x: width * 0.55, y: height * 0.85, label: 'Secure Storage', color: '#10b981' }, // Green
            { id: 'dashboard', x: width * 0.85, y: height * 0.5, label: 'Live Dashboard', color: '#f59e0b' } // Orange
        ];

        // Particle System
        interface Packet {
            x: number;
            y: number;
            targetIndex: number;
            speed: number;
            color: string;
            type: 'raw' | 'analyzed' | 'stored';
            progress: number;
            path: { from: number, to: number }[]; // Sequence of hops
            currentPathIndex: number;
        }

        const packets: Packet[] = [];

        // Define paths
        // const _paths = {
        //     main: [
        //         { from: 0, to: 3 }, // Agent -> Gateway
        //         { from: 3, to: 4 }, // Gateway -> Analysis
        //         { from: 4, to: 6 }  // Analysis -> Dashboard
        //     ],
        //     storage: [
        //         { from: 4, to: 5 }  // Analysis -> DB
        //     ]
        // };

        const spawnPacket = (startNodeIndex: number) => {
            // Path: Start -> Gateway -> Analysis -> Dashboard
            const path = [
                { from: startNodeIndex, to: 3 }, // To Gateway
                { from: 3, to: 4 }, // To Analysis
                { from: 4, to: 6 }  // To Dashboard
            ];

            packets.push({
                x: nodes[startNodeIndex].x,
                y: nodes[startNodeIndex].y,
                targetIndex: 3,
                speed: 0.008 + Math.random() * 0.004,
                color: '#64748b', // Raw data color
                type: 'raw',
                progress: 0,
                path: path,
                currentPathIndex: 0
            });
        };

        // Spawn loops
        setInterval(() => spawnPacket(0), 2000);
        setInterval(() => spawnPacket(1), 2500);
        setInterval(() => spawnPacket(2), 3000);

        let t = 0;

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            t += 0.02;

            // Draw Static Connections (Circuit board style)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;

            // Draw Paths
            nodes.forEach((node, i) => {
                // Connect to logical neighbors for visual diagram
                if (i < 3) { // Agents to Gateway
                    ctx.beginPath(); ctx.moveTo(node.x, node.y); ctx.lineTo(nodes[3].x, nodes[3].y); ctx.stroke();
                }
            });
            // Gateway -> Analysis
            ctx.beginPath(); ctx.moveTo(nodes[3].x, nodes[3].y); ctx.lineTo(nodes[4].x, nodes[4].y); ctx.stroke();
            // Analysis -> Dashboard
            ctx.beginPath(); ctx.moveTo(nodes[4].x, nodes[4].y); ctx.lineTo(nodes[6].x, nodes[6].y); ctx.stroke();
            // Analysis -> DB
            ctx.beginPath(); ctx.moveTo(nodes[4].x, nodes[4].y); ctx.lineTo(nodes[5].x, nodes[5].y); ctx.stroke();


            // Update and Draw Packets
            for (let i = packets.length - 1; i >= 0; i--) {
                const p = packets[i];
                const currentLeg = p.path[p.currentPathIndex];
                const startNode = nodes[currentLeg.from];
                const endNode = nodes[currentLeg.to];

                // Calculate position
                const dx = endNode.x - startNode.x;
                const dy = endNode.y - startNode.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                p.progress += p.speed * (800 / dist); // Normalize speed by distance

                if (p.progress >= 1) {
                    // Reached a node
                    p.progress = 0;
                    p.x = endNode.x;
                    p.y = endNode.y;

                    // Node Interaction Logic
                    if (endNode.id === 'analysis') {
                        p.color = '#a855f7'; // Turn Purple (Analyzed)
                        p.type = 'analyzed';
                        // Fork a packet to storage
                        packets.push({
                            x: endNode.x,
                            y: endNode.y,
                            targetIndex: 5,
                            speed: 0.01,
                            color: '#10b981', // Green
                            type: 'stored',
                            progress: 0,
                            path: [{ from: 4, to: 5 }],
                            currentPathIndex: 0
                        });
                    }

                    // Move to next leg
                    p.currentPathIndex++;
                    if (p.currentPathIndex >= p.path.length) {
                        packets.splice(i, 1); // Finished
                        continue;
                    }
                } else {
                    p.x = startNode.x + dx * p.progress;
                    p.y = startNode.y + dy * p.progress;
                }

                // Draw Packet
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.type === 'stored' ? 3 : 4, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Draw Nodes
            nodes.forEach(node => {
                // Outer ring
                ctx.beginPath();
                ctx.arc(node.x, node.y, 25, 0, Math.PI * 2);
                ctx.fillStyle = '#0f172a';
                ctx.fill();
                ctx.strokeStyle = node.color;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Icon / Inner
                ctx.beginPath();
                ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = node.color;
                ctx.fill();

                // Pulse Effect
                const pulse = (Math.sin(t * 3) + 1) / 2; // 0 to 1
                ctx.beginPath();
                ctx.arc(node.x, node.y, 25 + pulse * 5, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${parseInt(node.color.slice(1, 3), 16)}, ${parseInt(node.color.slice(3, 5), 16)}, ${parseInt(node.color.slice(5, 7), 16)}, ${0.3 * (1 - pulse)})`;
                ctx.stroke();

                // Label
                ctx.fillStyle = '#94a3b8';
                ctx.font = '11px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(node.label, node.x, node.y + 45);
            });

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        const handleResize = () => {
            width = canvas.width = canvas.parentElement?.clientWidth || 800;
            height = canvas.height = 500;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    return (
        <div className="w-full h-[500px] bg-slate-900/50 rounded-3xl border border-slate-800 relative overflow-hidden backdrop-blur-sm">
            <canvas ref={canvasRef} className="absolute inset-0" />

            {/* Status Overlay */}
            <div className="absolute top-6 left-6 font-mono text-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                    INGESTION RATE: 1.2 GB/s
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                    THREAT ANALYSIS: ACTIVE
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    STORAGE ENCRYPTION: AES-256
                </div>
            </div>
        </div>
    );
}

