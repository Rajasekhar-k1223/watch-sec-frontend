import { useMemo } from 'react';
import { MapPin } from 'lucide-react';

interface WorldMapProps {
    agents: { agentId: string; latitude: number; longitude: number; status: string }[];
}

export default function WorldMap({ agents }: WorldMapProps) {
    // Simple Equirectangular Projection
    // Width: 800, Height: 400
    const project = (lat: number, lon: number) => {
        const x = (lon + 180) * (800 / 360);
        const y = ((-1 * lat) + 90) * (400 / 180);
        return { x, y };
    };

    const markers = useMemo(() => {
        return agents.map(a => {
            const { x, y } = project(a.latitude, a.longitude);
            return { ...a, x, y };
        });
    }, [agents]);

    return (
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 shadow-xl relative overflow-hidden">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4 absolute top-6 left-6 z-10">
                <MapPin className="text-cyan-400" size={20} /> Global Threat Map
            </h3>

            <div className="aspect-[2/1] w-full bg-[#0B1121] relative rounded-lg border border-gray-800 overflow-hidden">
                {/* Abstract Grid Background */}
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(#1F2937 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                        opacity: 0.3
                    }}
                />

                <svg viewBox="0 0 800 400" className="w-full h-full">
                    {/* Simplified World Map Paths (Approximate for visual context) */}
                    <g fill="#1F2937" stroke="#374151" strokeWidth="0.5">
                        {/* This is a very rough approximation of continents for visual flair */}
                        <path d="M50 50 Q 200 100 250 50 T 400 100 T 600 50 T 750 100 V 300 H 50 Z" opacity="0.1" />
                        {/* A REAL implementation would look better with actual GeoJSON paths, 
                             but this abstract approach fits the "Cyber" aesthetic without 500KB of SVG data */}
                    </g>

                    {/* Connection Lines (Decor) */}
                    {markers.length > 1 && (
                        <path
                            d={`M ${markers[0].x} ${markers[0].y} ${markers.slice(1).map(m => `L ${m.x} ${m.y}`).join(' ')}`}
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="1"
                            strokeOpacity="0.2"
                            strokeDasharray="5,5"
                        />
                    )}

                    {/* Agent Markers */}
                    {markers.map((m, i) => (
                        <g key={i}>
                            <circle cx={m.x} cy={m.y} r="4" fill={m.status === 'Running' ? '#10B981' : '#EF4444'} className="animate-pulse" />
                            <circle cx={m.x} cy={m.y} r="8" fill={m.status === 'Running' ? '#10B981' : '#EF4444'} opacity="0.3">
                                <animate attributeName="r" from="4" to="12" dur="1.5s" repeatCount="indefinite" />
                                <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                            <text x={m.x + 10} y={m.y + 4} fill="#9CA3AF" fontSize="10" className="font-mono">
                                {m.agentId}
                            </text>
                        </g>
                    ))}
                </svg>

                {/* Legend */}
                <div className="absolute bottom-4 right-4 bg-gray-900/80 p-2 rounded border border-gray-700 text-xs font-mono">
                    <div className="flex items-center gap-2 text-green-400">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                    </div>
                    <div className="flex items-center gap-2 text-red-400">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Offline
                    </div>
                </div>
            </div>
        </div>
    );
}
