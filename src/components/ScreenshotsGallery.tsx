
import { useState, useEffect, useMemo } from 'react';
import { Image, Settings as SettingsIcon, LayoutGrid, List, Grid2X2, Database, HardDrive, Layers, Clock, Shield, Search } from 'lucide-react';
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
    const [viewMode, setViewMode] = useState<'grid' | 'table' | 'small'>('grid');

    // OCR Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [ocrResults, setOcrResults] = useState<any[]>([]);

    const stats = useMemo(() => {
        const totalSize = images.reduce((acc, img) => acc + (img.Size || 0), 0);
        const totalImages = images.length;
        const memoryImpact = Math.round(totalSize * 1.5); // Estimated decoded size
        return { totalSize, totalImages, memoryImpact };
    }, [images]);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    useEffect(() => {
        if (!agentId) return;
        setLoadingSettings(true);
        setError(null);
        fetch(`${apiUrl}/screenshots/list/${agentId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setImages(Array.isArray(data) ? data : []))
            .catch(e => setError(e.message));

        fetch(`${apiUrl}/agents`, { headers: { 'Authorization': `Bearer ${token}` } })
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

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            setOcrResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`${apiUrl}/ocr?agent_id=${agentId}&q=${encodeURIComponent(searchQuery)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOcrResults(data);
            }
        } catch (e) {
            console.error("Search failed", e);
        } finally {
            setIsSearching(false);
        }
    };

    const toggleScreenshots = async () => {
        const newVal = !isEnabled;
        setIsEnabled(newVal);
        try {
            await fetch(`${apiUrl}/agents/${agentId}/toggle-screenshots?enabled=${newVal}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
        } catch (e: any) { setIsEnabled(!newVal); setError(e.message); }
    };

    const saveSettings = async () => {
        try {
            await fetch(`${apiUrl}/agents/${agentId}/settings`, {
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
            {/* Forensic Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Total Frames</div>
                        <div className="text-xl font-black text-white">{stats.totalImages} <span className="text-xs text-blue-500/50 underline decoration-blue-500/30">Stored</span></div>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Storage Consumed</div>
                        <div className="text-xl font-black text-white">{formatSize(stats.totalSize)}</div>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                        <HardDrive className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Memory Impact</div>
                        <div className="text-xl font-black text-white">~{formatSize(stats.memoryImpact)}</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-800/50 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-black text-white flex gap-2 uppercase tracking-tighter"><Image className="w-5 h-5 text-blue-500" /> Evidence Pipeline</h3>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}><LayoutGrid size={16} /></button>
                        <button onClick={() => setViewMode('small')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'small' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}><Grid2X2 size={16} /></button>
                        <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}><List size={16} /></button>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <form onSubmit={handleSearch} className="relative group flex-grow">
                        <input
                            type="text"
                            placeholder="OCR Forensic Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-black/50 border border-white/10 rounded-2xl px-5 py-2 text-[11px] text-gray-200 focus:outline-none focus:border-blue-500 w-64 transition-all focus:ring-1 focus:ring-blue-500/30"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-400">
                            {isSearching ? <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <Search size={14} />}
                        </button>
                    </form>
                    <button onClick={async () => { await fetch(`${apiUrl}/agents/${agentId}/take-screenshot`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); }} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-black text-[10px] shadow-lg shadow-blue-600/20 transition-all active:scale-95 uppercase tracking-widest">Capture</button>
                    <button onClick={() => setShowSettings(true)} className="p-2.5 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl" title="Settings"><SettingsIcon className="w-5 h-5" /></button>
                    <div className="flex items-center gap-3 pl-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isEnabled ? 'text-green-400' : 'text-gray-500'}`}>{isEnabled ? 'Live' : 'Off'}</span>
                        <button onClick={toggleScreenshots} disabled={loadingSettings} className={`w-10 h-5 rounded-full p-1 relative transition-colors ${isEnabled ? 'bg-green-600' : 'bg-gray-700'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
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
            {viewMode === 'grid' && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((img, i) => {
                        const ocrHit = ocrResults.find(r => r.screenshotId === img.Filename);
                        const isMatched = searchQuery && ocrHit;

                        return (
                            <div key={i} className={`group relative bg-white/5 backdrop-blur-md rounded-3xl overflow-hidden border transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${isMatched ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'border-white/10'}`}>
                                <div className="aspect-video bg-black relative">
                                    <img src={img.dataUri || `${img.Url}?token=${token}`} alt={img.Filename} className={`w-full h-full object-cover transition-all duration-700 ${isMatched ? 'opacity-100' : 'opacity-80 group-hover:opacity-100 group-hover:scale-110'}`} />
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        {isMatched && (
                                            <div className="bg-blue-600 text-[8px] font-black text-white px-2 py-1 rounded-lg shadow-lg uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md border border-white/20">
                                                <Search size={10} /> OCR Match
                                            </div>
                                        )}
                                        {img.IsAlert && (
                                            <div className="bg-red-600 text-[8px] font-black text-white px-2 py-1 rounded-lg shadow-lg uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md border border-white/20 animate-pulse">
                                                <Shield size={10} /> Alert
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-[8px] font-mono text-white/80 px-2 py-1 rounded-lg border border-white/10">
                                        {formatSize(img.Size)}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-[10px] text-white/90 font-black truncate tracking-tight">{img.Filename}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock className="w-3 h-3 text-gray-500" />
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date(normalizeTimestamp(img.Timestamp || img.Date)).toLocaleString()}</p>
                                    </div>
                                    {isMatched && ocrHit.extractedText && (
                                        <div className="mt-2 text-[9px] text-blue-300 font-mono italic truncate bg-blue-500/10 border border-blue-500/20 p-1.5 rounded-xl">
                                            {ocrHit.extractedText.toLowerCase().includes(searchQuery.toLowerCase()) ?
                                                `"...${ocrHit.extractedText.substr(Math.max(0, ocrHit.extractedText.toLowerCase().indexOf(searchQuery.toLowerCase()) - 10), 40)}..."` :
                                                `"...${ocrHit.extractedText.substr(0, 40)}..."`}
                                        </div>
                                    )}
                                </div>
                                <a href={`${img.Url}?token=${token}`} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-blue-600/20 backdrop-blur-[2px] transition-all duration-300">
                                    <span className="bg-white text-black px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl translate-y-4 group-hover:translate-y-0 transition-transform">Inspect Frame</span>
                                </a>
                            </div>
                        );
                    })}
                </div>
            )}

            {viewMode === 'small' && (
                <div className="grid grid-cols-5 md:grid-cols-10 lg:grid-cols-12 gap-2">
                    {images.map((img, i) => (
                        <a key={i} href={`${img.Url}?token=${token}`} target="_blank" rel="noreferrer" className="group relative aspect-square bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-blue-500 transition-all hover:scale-110 active:scale-95 z-0 hover:z-10">
                            <img src={img.dataUri || `${img.Url}?token=${token}`} alt={img.Filename} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            {img.IsAlert && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_red] animate-pulse" />}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-[6px] text-white p-0.5 text-center font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">
                                {img.Filename.split('_').pop()}
                            </div>
                        </a>
                    ))}
                </div>
            )}

            {viewMode === 'table' && (
                <div className="bg-black/20 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Preview</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Metadata / Filename</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Timestamp</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Forensic Size</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {images.map((img, i) => (
                                <tr key={i} className="group hover:bg-white/[0.03] transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="w-16 h-10 bg-black rounded-lg overflow-hidden border border-white/10 relative">
                                            <img src={img.dataUri || `${img.Url}?token=${token}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                                            {img.IsAlert && <div className="absolute inset-0 border-2 border-red-500/50 pointer-events-none" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex flex-col">
                                            <span className={`text-[11px] font-mono leading-none ${img.IsAlert ? 'text-red-400 font-bold' : 'text-white/90'}`}>{img.Filename}</span>
                                            {img.IsAlert && <span className="text-[8px] text-red-500 font-black uppercase mt-1 tracking-tighter">Security Alert Triggered</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-[10px] text-gray-400 font-black uppercase">{new Date(normalizeTimestamp(img.Timestamp || img.Date)).toLocaleString()}</td>
                                    <td className="px-6 py-3">
                                        <span className="text-[10px] font-mono bg-white/5 border border-white/5 px-2 py-1 rounded-lg text-cyan-400 font-bold">{formatSize(img.Size)}</span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <a href={`${img.Url}?token=${token}`} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-tighter text-blue-400 hover:text-blue-300 transition-colors">Inspect Frame</a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
