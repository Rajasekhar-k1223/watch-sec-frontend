import { useState, useMemo } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/maplibre';
import { useTheme } from '../contexts/ThemeContext';

interface WorldMapProps {
    agents: { agentId: string; latitude: number; longitude: number; status: string }[];
    forceDark?: boolean;
    hideChrome?: boolean;
}

export default function WorldMap({ agents, forceDark = false, hideChrome = false }: WorldMapProps) {
    const { theme } = useTheme();
    const isDark = forceDark || theme === 'dark';
    const [popupInfo, setPopupInfo] = useState<any>(null);

    // Group agents by status for colors
    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('threat') || s.includes('attack')) return '#ef4444'; // Red
        if (s.includes('honeypot')) return '#a855f7'; // Purple
        if (s.includes('blocked')) return '#2dd4bf'; // Teal
        return '#3b82f6'; // Blue
    };

    const mapStyleUrl = isDark 
        ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

    // Generate GeoJSON arcs
    const geojsonArcs = useMemo(() => {
        const features = [];
        if (agents.length > 1) {
            for (let i = 0; i < Math.min(agents.length - 1, 5); i++) {
                const start = agents[i];
                const end = agents[i + 1];
                if (start.longitude !== undefined && start.latitude !== undefined && end.longitude !== undefined && end.latitude !== undefined) {
                    features.push({
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: Array.from({ length: 50 }).map((_, step) => {
                                const t = step / 49;
                                const lon = start.longitude + t * (end.longitude - start.longitude);
                                const lat = start.latitude + t * (end.latitude - start.latitude);
                                // Calculate distance to determine arc height
                                const dist = Math.sqrt(Math.pow(end.longitude - start.longitude, 2) + Math.pow(end.latitude - start.latitude, 2));
                                const height = dist * 0.25; // Arc height is 25% of distance
                                // Parabola: 4 * h * t * (1 - t) gives 0 at ends and h in middle
                                const arcLat = lat + height * 4 * t * (1 - t);
                                return [lon, arcLat];
                            })
                        },
                        properties: {
                            color: getStatusColor(start.status)
                        }
                    });
                }
            }
        }
        return {
            type: 'FeatureCollection',
            features
        };
    }, [agents]);

    return (
        <div className={hideChrome ? 'w-full h-full flex flex-col relative z-0' : `backdrop-blur-xl border rounded-2xl p-4 shadow-lg h-full min-h-[400px] flex flex-col relative z-0 transition-colors ${isDark ? 'bg-[#040916]/80 border-gray-800' : 'bg-white border-gray-200'}`}>
            {!hideChrome && (
                <div className={`absolute top-6 left-6 z-[400] p-2 rounded border pointer-events-none shadow-sm transition-colors ${isDark ? 'bg-gray-900/90 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
                    <h3 className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Global Operations
                    </h3>
                </div>
            )}

            <div className={`flex-1 overflow-hidden relative z-0 flex items-center justify-center ${!hideChrome ? 'rounded-xl border' : 'rounded-lg border border-[#1e2e4e]/80 bg-[#040b1a]'} ${!hideChrome && isDark ? 'border-gray-700/50' : !hideChrome ? 'border-gray-200' : ''}`}>
                <Map
                    mapLib={(window as any).maplibregl}
                    initialViewState={{
                        longitude: 0,
                        latitude: 20,
                        zoom: hideChrome ? 0 : 1.5,
                        pitch: 0
                    }}
                    mapStyle={mapStyleUrl}
                    interactive={true}
                    attributionControl={false}
                    style={{ width: '100%', height: '100%' }}
                >
                    {/* Arcs Layer */}
                    <Source id="arcs" type="geojson" data={geojsonArcs}>
                        <Layer 
                            id="arc-line"
                            type="line"
                            paint={{
                                'line-color': ['get', 'color'],
                                'line-width': 2.5,
                                'line-opacity': 0.6
                            }}
                        />
                    </Source>

                    {/* Glowing Markers */}
                    {agents.map((agent, idx) => {
                        const colorClass = getStatusColor(agent.status) === '#ef4444' ? 'bg-red-500' 
                                        : getStatusColor(agent.status) === '#a855f7' ? 'bg-purple-500' 
                                        : getStatusColor(agent.status) === '#2dd4bf' ? 'bg-teal-400' : 'bg-blue-500';
                        const isThreat = colorClass === 'bg-red-500';
                        
                        if (agent.longitude === undefined || agent.latitude === undefined) return null;

                        return (
                            <Marker 
                                key={`marker-${idx}`} 
                                longitude={agent.longitude} 
                                latitude={agent.latitude}
                                anchor="center"
                                onClick={e => {
                                    e.originalEvent.stopPropagation();
                                    setPopupInfo(agent);
                                }}
                            >
                                <div className="relative w-4 h-4 cursor-pointer flex items-center justify-center">
                                    <div className={`absolute inset-0 rounded-full ${colorClass} opacity-75 animate-pulse blur-[2px]`}></div>
                                    <div className={`absolute inset-1 rounded-full ${colorClass} shadow-[0_0_10px_currentColor]`}></div>
                                    {isThreat && <div className={`absolute -inset-2 rounded-full border border-red-500 animate-ping opacity-60`}></div>}
                                    <div className="absolute inset-1.5 bg-white rounded-full"></div>
                                </div>
                            </Marker>
                        );
                    })}

                    {popupInfo && !hideChrome && (
                        <Popup
                            anchor="top"
                            longitude={Number(popupInfo.longitude)}
                            latitude={Number(popupInfo.latitude)}
                            onClose={() => setPopupInfo(null)}
                            className="z-50"
                        >
                            <div className="p-1">
                                <div className="font-bold text-gray-900">{popupInfo.agentId}</div>
                                <div className="text-xs text-gray-600">Status: {popupInfo.status}</div>
                                <div className="text-xs text-gray-500 mt-1 font-mono">
                                    {Number(popupInfo.latitude).toFixed(2)}, {Number(popupInfo.longitude).toFixed(2)}
                                </div>
                            </div>
                        </Popup>
                    )}
                </Map>
            </div>

            {/* Legend */}
            {!hideChrome && (
                <div className={`mt-3 flex gap-4 text-xs font-mono px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Offline / Threat
                    </div>
                </div>
            )}
        </div>
    );
}
