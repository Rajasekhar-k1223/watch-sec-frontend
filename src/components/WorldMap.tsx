import { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../contexts/ThemeContext';
import { Layers } from 'lucide-react';

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const t1 = setTimeout(() => map.invalidateSize(), 100);
        const t2 = setTimeout(() => map.invalidateSize(), 300);
        const t3 = setTimeout(() => map.invalidateSize(), 800);
        const handleResize = () => map.invalidateSize();
        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            window.removeEventListener('resize', handleResize);
        };
    }, [map]);
    return null;
}

interface WorldMapProps {
    agents: { agentId: string; latitude: number; longitude: number; status: string; hostname?: string; publicIp?: string; osInfo?: string }[];
    forceDark?: boolean;
    hideChrome?: boolean;
}

const getStatusColor = (status: string): string => {
    const s = (status || '').toLowerCase();
    if (s.includes('threat') || s.includes('attack') || s.includes('critical')) return '#ef4444'; // Red
    if (s.includes('honeypot') || s.includes('deception')) return '#3b82f6'; // Blue
    if (s.includes('blocked') || s.includes('mitigated')) return '#10b981'; // Emerald Green
    if (s.includes('online') || s.includes('active')) return '#10b981'; // Emerald Green
    if (s.includes('offline') || s.includes('stale') || s.includes('monitor')) return '#f97316'; // Orange
    return '#f97316'; // Orange default for telemetry
};

const createCyberMarkerIcon = (color: string, isThreat: boolean, pulse = true) => {
    return L.divIcon({
        className: 'cyber-leaflet-marker',
        html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; cursor: pointer;">
                ${pulse ? `<div style="position: absolute; inset: 0; border-radius: 50%; background-color: ${color}; opacity: 0.45; animation: ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
                <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${color}; box-shadow: 0 0 10px ${color}, 0 0 4px #ffffff; border: 1.5px solid #ffffff; z-index: 2;"></div>
                <div style="position: absolute; width: 2.5px; height: 2.5px; border-radius: 50%; background-color: #ffffff; z-index: 3;"></div>
                ${isThreat ? `<div style="position: absolute; inset: -4px; border-radius: 50%; border: 1.5px solid #ef4444; opacity: 0.8; animation: pulse 1.8s infinite;"></div>` : ''}
            </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -13]
    });
};

const createContinentLabelIcon = (label: string) => {
    return L.divIcon({
        className: 'cyber-continent-label',
        html: `
            <div style="
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.14em;
                color: #cbd5e1;
                text-shadow: 0 1px 4px rgba(0,0,0,0.95), 0 0 12px rgba(15, 23, 42, 0.8);
                white-space: nowrap;
                pointer-events: none;
                user-select: none;
                opacity: 0.85;
            ">
                ${label}
            </div>
        `,
        iconSize: [120, 20],
        iconAnchor: [60, 10]
    });
};

// Interpolate curved coordinates between two geographic points
function calculateArcPositions(start: [number, number], end: [number, number], steps = 32): [number, number][] {
    const coords: [number, number][] = [];
    const lat1 = start[0], lon1 = start[1];
    const lat2 = end[0], lon2 = end[1];

    let dLon = lon2 - lon1;
    if (dLon > 180) dLon -= 360;
    if (dLon < -180) dLon += 360;

    const dist = Math.sqrt(Math.pow(dLon, 2) + Math.pow(lat2 - lat1, 2));
    const arcHeight = Math.min(dist * 0.25, 40);

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const curLat = lat1 + t * (lat2 - lat1) + arcHeight * 4 * t * (1 - t);
        const curLon = lon1 + t * dLon;
        coords.push([curLat, curLon]);
    }
    return coords;
}

export default function WorldMap({ agents = [], forceDark = false, hideChrome = false }: WorldMapProps) {
    const { theme } = useTheme();
    const isDark = forceDark || theme === 'dark';
    const [mapLayer, setMapLayer] = useState<'dark' | 'streets' | 'osm' | 'canvas'>(isDark ? 'dark' : 'streets');

    // Build real-time threat & telemetry trajectory arcs exclusively from enrolled fleet agents
    const arcLines = useMemo(() => {
        const lines: { positions: [number, number][]; color: string; label: string }[] = [];

        // Real enrolled agents with valid geographic coordinates
        const validAgents = agents.filter(a => a && a.latitude != null && a.longitude != null && !isNaN(Number(a.latitude)) && !isNaN(Number(a.longitude)));
        
        // Group agents into distinct geographical clusters
        const distinctLocations: { lat: number; lon: number; hostname: string; status: string }[] = [];
        validAgents.forEach(a => {
            const lat = Number(a.latitude);
            const lon = Number(a.longitude);
            const exists = distinctLocations.some(l => Math.abs(l.lat - lat) < 0.8 && Math.abs(l.lon - lon) < 0.8);
            if (!exists) {
                distinctLocations.push({
                    lat,
                    lon,
                    hostname: a.hostname || a.agentId || 'Fleet Node',
                    status: a.status || 'Online'
                });
            }
        });

        if (distinctLocations.length > 1) {
            for (let i = 0; i < distinctLocations.length - 1; i++) {
                const start = distinctLocations[i];
                const end = distinctLocations[i + 1];
                lines.push({
                    positions: calculateArcPositions([start.lat, start.lon], [end.lat, end.lon]),
                    color: getStatusColor(start.status),
                    label: `${start.hostname} ⟷ ${end.hostname} Live Sensor Mesh`
                });
            }
            if (distinctLocations.length > 2) {
                const first = distinctLocations[0];
                const last = distinctLocations[distinctLocations.length - 1];
                lines.push({
                    positions: calculateArcPositions([last.lat, last.lon], [first.lat, first.lon]),
                    color: '#3b82f6',
                    label: `${last.hostname} ⟷ ${first.hostname} Telemetry Sync`
                });
            }
        }

        return lines;
    }, [agents]);

    const activeLayer = hideChrome ? (isDark ? 'dark' : 'streets') : mapLayer;

    return (
        <div className={hideChrome ? 'w-full h-full flex flex-col relative z-0 overflow-hidden bg-[#040916]' : `backdrop-blur-xl border rounded-2xl p-4 shadow-lg h-full min-h-[400px] flex flex-col relative z-0 transition-colors ${isDark ? 'bg-[#040916]/80 border-gray-800' : 'bg-white border-gray-200'}`}>
            {!hideChrome && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 px-1">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Global Operations & Fleet Geospatial Map
                        </h3>
                    </div>

                    {/* Layer Selector */}
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-xs font-semibold">
                        <div className="px-2 py-0.5 text-gray-400 flex items-center gap-1 text-[11px]">
                            <Layers size={12} />
                            <span>Layer:</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setMapLayer('dark')}
                            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${mapLayer === 'dark' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            Dark Cyber
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapLayer('streets')}
                            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${mapLayer === 'streets' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            Streets
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapLayer('osm')}
                            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${mapLayer === 'osm' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            OSM
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapLayer('canvas')}
                            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${mapLayer === 'canvas' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            Light Canvas
                        </button>
                    </div>
                </div>
            )}

            <div className={`flex-1 w-full h-full overflow-hidden relative z-0 flex items-center justify-center ${!hideChrome ? 'rounded-xl border' : ''} ${!hideChrome && isDark ? 'border-gray-700/50' : !hideChrome ? 'border-gray-200' : ''}`}>
                <MapContainer
                    center={hideChrome ? [20, 15] : [20, 10]}
                    zoom={hideChrome ? 1.25 : 1.45}
                    zoomSnap={0.05}
                    minZoom={1}
                    maxZoom={18}
                    zoomControl={!hideChrome}
                    scrollWheelZoom={!hideChrome}
                    attributionControl={false}
                    style={{ width: '100%', height: '100%', background: (activeLayer === 'dark' || (hideChrome && isDark)) ? '#040916' : '#ffffff' }}
                >
                    <MapResizer />
                    {activeLayer === 'dark' && (
                        <>
                            <TileLayer
                                key="esri-dark-base"
                                attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                                maxZoom={16}
                            />
                            <TileLayer
                                key="esri-dark-ref"
                                attribution='Tiles &copy; Esri'
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                                maxZoom={16}
                            />
                        </>
                    )}
                    {activeLayer === 'streets' && (
                        <TileLayer
                            key="esri-streets-base"
                            attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, TomTom'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                            maxZoom={19}
                        />
                    )}
                    {activeLayer === 'osm' && (
                        <TileLayer
                            key="osm-base"
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            maxZoom={19}
                        />
                    )}
                    {activeLayer === 'canvas' && (
                        <>
                            <TileLayer
                                key="esri-light-base"
                                attribution='Tiles &copy; Esri'
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                                maxZoom={16}
                            />
                            <TileLayer
                                key="esri-light-ref"
                                attribution='Tiles &copy; Esri'
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                                maxZoom={16}
                            />
                        </>
                    )}

                    {/* Animated Cyber Threat Trajectory Arcs */}
                    {arcLines.map((arc, idx) => (
                        <Polyline
                            key={`threat-arc-${idx}`}
                            positions={arc.positions}
                            pathOptions={{
                                color: arc.color,
                                weight: 1.8,
                                opacity: 0.85,
                                dashArray: '6, 4',
                                className: 'threat-arc-animated'
                            }}
                        >
                            <Popup>
                                <div className="p-1 text-xs">
                                    <div className="font-bold text-slate-800">{arc.label}</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">Live Trajectory Correlation</div>
                                </div>
                            </Popup>
                        </Polyline>
                    ))}

                    {/* Continent Cyber Headings for Global Operations matching user layout */}
                    {hideChrome && (
                        <>
                            <Marker position={[48, -102]} icon={createContinentLabelIcon('NORTH AMERICA')} />
                            <Marker position={[22, -96]} icon={createContinentLabelIcon('AMERICA')} />
                            <Marker position={[-16, -58]} icon={createContinentLabelIcon('SOUTH AMERICA')} />
                            <Marker position={[54, 18]} icon={createContinentLabelIcon('EUROPE')} />
                            <Marker position={[4, 22]} icon={createContinentLabelIcon('AFRICA')} />
                            <Marker position={[48, 92]} icon={createContinentLabelIcon('ASIA')} />
                            <Marker position={[-24, 135]} icon={createContinentLabelIcon('OCEANIA')} />
                        </>
                    )}

                    {/* Live Enrolled Fleet Agent Markers from Backend */}
                    {agents.map((agent, idx) => {
                        if (agent.latitude == null || agent.longitude == null) return null;
                        const color = getStatusColor(agent.status);
                        const isThreat = color === '#ef4444';

                        return (
                            <Marker
                                key={`fleet-agent-${agent.agentId || idx}`}
                                position={[Number(agent.latitude), Number(agent.longitude)]}
                                icon={createCyberMarkerIcon(color, isThreat, true)}
                            >
                                <Popup>
                                    <div className="p-2 min-w-[160px] text-xs">
                                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                                            {agent.hostname || agent.agentId}
                                        </div>
                                        <div className="text-[11px] text-slate-600 mt-1">
                                            Status: <span className="font-bold" style={{ color }}>{agent.status || 'Active'}</span>
                                        </div>
                                        {agent.publicIp && (
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                IP: {agent.publicIp}
                                            </div>
                                        )}
                                        {agent.osInfo && (
                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                OS: {agent.osInfo}
                                            </div>
                                        )}
                                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                            {Number(agent.latitude).toFixed(4)}°, {Number(agent.longitude).toFixed(4)}°
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>

            {/* Bottom Legend if chrome visible */}
            {!hideChrome && (
                <div className={`mt-3 flex gap-4 text-xs font-mono px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span> Monitored
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Live Attack / Threat
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> HoneyPot / Deception
                    </div>
                </div>
            )}
        </div>
    );
}
