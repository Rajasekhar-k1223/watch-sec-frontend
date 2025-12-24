import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { divIcon } from 'leaflet';
import { useMemo } from 'react';

// Fix for default marker icons if needed (though we use custom divIcon)
// import L from 'leaflet';
// import icon from 'leaflet/dist/images/marker-icon.png';
// import iconShadow from 'leaflet/dist/images/marker-shadow.png';

interface WorldMapProps {
    agents: { agentId: string; latitude: number; longitude: number; status: string }[];
}

export default function WorldMap({ agents }: WorldMapProps) {

    // Create custom icons dynamically
    const createCustomIcon = (status: string) => {
        const isOnline = status.toLowerCase() === 'running' || status.toLowerCase() === 'online';
        const colorClass = isOnline ? 'bg-green-500' : 'bg-red-500';
        const pulseClass = isOnline ? 'animate-pulse' : 'animate-ping'; // Ping for Offline/Threat? Or Pulse for Online? 
        // Let's say: Online = Stable Dot, Offline = Red Dot, Threat = Ping? 
        // For now: Simple Green/Red dots with shadow

        return divIcon({
            className: 'custom-marker',
            html: `<div class="relative w-4 h-4">
                      <div class="absolute inset-0 rounded-full ${colorClass} opacity-75 ${pulseClass}"></div>
                      <div class="absolute inset-0 rounded-full ${colorClass} border-2 border-white shadow-lg"></div>
                   </div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8], // Center
            popupAnchor: [0, -10]
        });
    };

    const markers = useMemo(() => agents.map(a => ({
        ...a,
        icon: createCustomIcon(a.status)
    })), [agents]);

    // Center map roughly
    const center: [number, number] = [20, 0];

    return (
        <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 shadow-lg h-full min-h-[400px] flex flex-col relative z-0">
            <div className="absolute top-6 left-6 z-[400] bg-gray-900/90 p-2 rounded border border-gray-700 pointer-events-none">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    Global Operations
                </h3>
            </div>

            <div className="flex-1 rounded-xl overflow-hidden border border-gray-700/50 relative z-0">
                <MapContainer
                    center={center}
                    zoom={2}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%', background: '#050b14' }}
                    attributionControl={false}
                >
                    {/* Dark Matter Tile Layer */}
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />

                    {markers.map((agent, idx) => (
                        <Marker
                            key={idx}
                            position={[agent.latitude, agent.longitude]}
                            icon={agent.icon}
                        >
                            <Popup className="custom-popup">
                                <div className="p-1">
                                    <div className="font-bold text-gray-900">{agent.agentId}</div>
                                    <div className="text-xs text-gray-600">Status: {agent.status}</div>
                                    <div className="text-xs text-gray-500 mt-1 font-mono">
                                        {agent.latitude.toFixed(2)}, {agent.longitude.toFixed(2)}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Legend */}
            <div className="mt-3 flex gap-4 text-xs font-mono px-2">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Offline / Threat
                </div>
            </div>
        </div>
    );
}
