import React, { useState, useEffect } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import { API_URL } from '../config';
import { Shield, Wifi, Globe, Map as MapIcon, Crosshair } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface LocationReport {
  AgentId: string;
  Hostname: string;
  Latitude: number;
  Longitude: number;
  Source: string;
  Timestamp: string;
  OsInfo?: string;
  IsOnline?: boolean;
}

const LocationMap: React.FC = () => {
  const [locations, setLocations] = useState<LocationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [popupInfo, setPopupInfo] = useState<any | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [token]);

  const fetchLocations = async () => {
    try {
      if (!token) return;
      const response = await fetch(`${API_URL}/agents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Map agents with valid coordinates into our location format
        const mappedLocations: LocationReport[] = data
          .filter((agent: any) => agent.latitude && agent.longitude)
          .map((agent: any) => ({
            AgentId: agent.agentId || agent.AgentId,
            Hostname: agent.hostname || agent.Hostname || agent.IpAddress || 'Unknown Agent',
            Latitude: parseFloat(agent.latitude),
            Longitude: parseFloat(agent.longitude),
            Source: 'Native GPS/OS', // Simulated source
            Timestamp: agent.lastSeen || agent.LastSeen || new Date().toISOString(),
            OsInfo: agent.os || agent.OsInfo,
            IsOnline: agent.status === 'Online' || agent.IsOnline
          }));
          
        setLocations(mappedLocations);
      } else {
        toast.error('Failed to fetch locations');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching fleet locations');
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('gps') || s.includes('windows') || s.includes('native')) return <Crosshair size={14} className="text-blue-500 mr-1" />;
    if (s.includes('wifi')) return <Wifi size={14} className="text-indigo-500 mr-1" />;
    return <Globe size={14} className="text-gray-400 mr-1" />;
  };

  const initialLongitude = -98.5795;
  const initialLatitude = 39.8283;

  // Group locations by precise coordinates
  const groupedLocations = Object.values(locations.reduce((acc, loc) => {
      const key = `${loc.Latitude.toFixed(5)},${loc.Longitude.toFixed(5)}`;
      if (!acc[key]) {
          acc[key] = { Latitude: loc.Latitude, Longitude: loc.Longitude, Agents: [] };
      }
      acc[key].Agents.push(loc);
      return acc;
  }, {} as Record<string, any>));

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <MapIcon className="mr-2 text-indigo-600" /> Fleet Location Map
          </h2>
          <p className="text-gray-500 mt-1">Real-time geospatial tracking of all active agents</p>
        </div>
        <div className="flex space-x-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-sm">
          <div className="flex items-center"><Crosshair size={14} className="text-blue-500 mr-1" /> Native GPS/OS</div>
          <div className="flex items-center"><Globe size={14} className="text-gray-400 mr-1 ml-4" /> IP Triangulation</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style={{ height: '70vh' }}>
        {loading && locations.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">Loading map data...</div>
        ) : (
          <Map
            mapLib={(window as any).maplibregl}
            initialViewState={{
                longitude: initialLongitude,
                latitude: initialLatitude,
                zoom: 2.5,
                pitch: 0
            }}
            mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
            interactive={true}
            attributionControl={false}
          >
            {groupedLocations.map((group, idx) => (
              <Marker 
                key={idx} 
                longitude={group.Longitude} 
                latitude={group.Latitude}
                anchor="bottom"
                onClick={e => {
                    e.originalEvent.stopPropagation();
                    setPopupInfo(group);
                }}
              >
                <div className="cursor-pointer text-blue-600 drop-shadow-md relative">
                    {group.Agents.length > 1 && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10 border-2 border-white shadow-sm">
                            {group.Agents.length}
                        </div>
                    )}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                </div>
              </Marker>
            ))}

            {popupInfo && (
                <Popup
                    anchor="top"
                    longitude={Number(popupInfo.Longitude)}
                    latitude={Number(popupInfo.Latitude)}
                    onClose={() => setPopupInfo(null)}
                    className="z-50 rounded-lg shadow-xl"
                    maxWidth="300px"
                >
                  <div className="p-1 min-w-[200px] max-h-[300px] overflow-y-auto">
                    <div className="text-xs font-bold text-gray-500 mb-2 border-b pb-2 uppercase tracking-wider">
                        {popupInfo.Agents.length} Agent{popupInfo.Agents.length > 1 ? 's' : ''} at this location
                    </div>
                    <div className="space-y-4">
                        {popupInfo.Agents.map((agent: any, idx: number) => (
                            <div key={idx} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                                <div className="flex items-center font-bold text-gray-900 mb-2">
                                  <Shield size={16} className="text-indigo-600 mr-2" />
                                  {agent.Hostname}
                                </div>
                                <div className="text-xs text-gray-600 space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400 font-semibold">AGENT ID:</span>
                                    <span className="font-mono text-gray-800">{agent.AgentId.slice(0, 8)}...</span>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <span className="text-gray-400 font-semibold mr-2">OS INFO:</span>
                                    <span className="truncate max-w-[140px] text-gray-800 font-medium">{agent.OsInfo || 'Unknown'}</span>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <span className="text-gray-400 font-semibold mr-2">STATUS:</span>
                                    <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${agent.IsOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                      {agent.IsOnline ? 'ONLINE' : 'OFFLINE'}
                                    </div>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <span className="text-gray-400 font-semibold mr-2">SOURCE:</span>
                                    <div className="flex items-center bg-gray-100 px-2 py-0.5 rounded-full">
                                      {getSourceIcon(agent.Source)}
                                      <span className="truncate max-w-[120px]">{agent.Source}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <span className="text-gray-400 font-semibold mr-2">UPDATED:</span>
                                    <span>{new Date(agent.Timestamp).toLocaleTimeString()}</span>
                                  </div>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
                </Popup>
            )}
          </Map>
        )}
      </div>
    </div>
  );
};

export default LocationMap;
