
import { useState, useEffect } from 'react';
import { Image, Settings as SettingsIcon } from 'lucide-react';
import { io } from 'socket.io-client';

interface Props {
    agentId: string | null;
    apiUrl: string;
    token: string | null;
}

const normalizeTimestamp = (ts: any) => {
    if (!ts) return new Date().toISOString();
    let str = String(ts).trim();
    if (str.includes(' ') && !str.includes('T')) str = str.replace(' ', 'T');
    const hasTimezone = str.endsWith('Z') || /[+-]\d{2}(:?\d{2})?$/.test(str);
    if (!hasTimezone) str += 'Z';
    return str;
};

export default function ScreenshotsGallery({ agentId, apiUrl, token }: Props) {
    const [images, setImages] = useState<any[]>([]);
    const [isEnabled, setIsEnabled] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({ quality: 80, resolution: 'Original', maxSize: 0 });

    useEffect(() => {
        if (!agentId) return;
        setLoadingSettings(true);
        setError(null);
        fetch(`${apiUrl}/api/screenshots/list/${agentId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setImages(Array.isArray(data) ? data : []))
            .catch(e => setError(e.message));

        fetch(`${apiUrl}/api/agents`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then((data: any[]) => {
                if (Array.isArray(data)) {
                    const agent = data.find(a => a.agentId === agentId || a.AgentId === agentId);
                    if (agent) {
                        setIsEnabled((agent.screenshotsEnabled ?? agent.ScreenshotsEnabled) === true);
                        setSettings({
                            quality: agent.ScreenshotQuality || 80,
                            resolution: agent.ScreenshotResolution || 'Original',
                            maxSize: agent.MaxScreenshotSize || 0
                        });
                    }
                }
                setLoadingSettings(false);
            })
            .catch(e => { console.error(e); setLoadingSettings(false); });

        const newSocket = io(apiUrl, { transports: ['websocket'], query: { token } });
        newSocket.on('connect', () => newSocket.emit('join_room', { room: agentId }));
        newSocket.on('ReceiveScreen', (id: string, dataUri: string) => {
            if (id === agentId) {
                setImages(prev => [{ Filename: `Live Capture`, Date: new Date().toISOString(), Timestamp: new Date().toISOString(), IsAlert: false, Url: '', dataUri: dataUri }, ...prev]);
            }
        });
        return () => { newSocket.disconnect(); };
    }, [agentId, apiUrl, token]);

    const toggleScreenshots = async () => {
        const newVal = !isEnabled;
        setIsEnabled(newVal);
        try {
            await fetch(`${apiUrl}/api/agents/${agentId}/toggle-screenshots?enabled=${newVal}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
        } catch (e: any) { setIsEnabled(!newVal); setError(e.message); }
    };

    const saveSettings = async () => {
        try {
            await fetch(`${apiUrl}/api/agents/${agentId}/settings`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ScreenshotQuality: settings.quality, ScreenshotResolution: settings.resolution, MaxScreenshotSize: settings.maxSize })
            });
            setShowSettings(false);
        } catch (e) { console.error("Failed settings save", e); }
    };

    if (error) return <div className="p-4 text-red-500 bg-red-900/10 rounded">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-white flex gap-2"><Image className="w-5 h-5 text-blue-500" /> Captured Evidence</h3>
                <div className="flex items-center gap-3">
                    <button onClick={async () => { await fetch(`${apiUrl}/api/agents/${agentId}/take-screenshot`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); }} className="px-3 py-1 bg-blue-600 rounded text-white font-bold text-sm">Capture Now</button>
                    <button onClick={() => setShowSettings(true)} className="p-1.5 text-gray-400 hover:text-white" title="Settings"><SettingsIcon className="w-5 h-5" /></button>
                    <span className={`text-sm font-bold ${isEnabled ? 'text-green-400' : 'text-gray-500'}`}>{isEnabled ? 'Active' : 'Paused'}</span>
                    <button onClick={toggleScreenshots} disabled={loadingSettings} className={`w-12 h-6 rounded-full p-1 relative ${isEnabled ? 'bg-green-600' : 'bg-gray-700'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg w-96 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-4">Settings</h3>
                        <div className="space-y-4">
                            <div><label className="text-xs text-gray-400">Resolution</label><select value={settings.resolution} onChange={e => setSettings({ ...settings, resolution: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"><option value="Original">Original</option><option value="720p">720p</option></select></div>
                            <div><label className="text-xs text-gray-400">Quality {settings.quality}%</label><input type="range" min="10" max="100" value={settings.quality} onChange={e => setSettings({ ...settings, quality: parseInt(e.target.value) })} className="w-full" /></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowSettings(false)} className="text-gray-400 text-sm">Cancel</button>
                            <button onClick={saveSettings} className="bg-blue-600 text-white rounded px-3 py-1 text-sm font-bold">Save</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img, i) => (
                    <div key={i} className="group relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                        <div className="aspect-video bg-black relative">
                            <img src={img.dataUri || `${apiUrl}${img.Url}?token=${token}`} alt={img.Filename} className="w-full h-full object-cover opacity-75 group-hover:opacity-100" />
                        </div>
                        <div className="p-2">
                            <p className="text-xs text-gray-300 font-mono truncate">{img.Filename}</p>
                            <p className="text-[10px] text-gray-500">{new Date(normalizeTimestamp(img.Timestamp || img.Date)).toLocaleString()}</p>
                        </div>
                        <a href={`${apiUrl}${img.Url}?token=${token}`} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50"><span className="text-white border px-2 py-1 rounded-full text-xs">View</span></a>
                    </div>
                ))}
            </div>
        </div>
    );
}
