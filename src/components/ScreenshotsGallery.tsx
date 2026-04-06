
import { useState, useEffect, useMemo, useRef } from 'react';
import { Image, Settings as SettingsIcon, LayoutGrid, List, Grid2X2, Database, HardDrive, Layers, Clock, Shield, Search, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';

interface Props {
    agentId: string | null;
    apiUrl: string;
    token: string | null;
    onUpdate?: () => void;
}

const normalizeTimestamp = (ts: any) => {
    if (!ts) return new Date().toISOString();
    let str = String(ts).trim();
    if (str.includes(' ') && !str.includes('T')) str = str.replace(' ', 'T');
    const hasTimezone = str.endsWith('Z') || /[+-]\d{2}(:?\d{2})?$/.test(str);
    if (!hasTimezone) str += 'Z';
    return str;
};

export default function ScreenshotsGallery({ agentId, apiUrl, token, onUpdate }: Props) {
    const [images, setImages] = useState<any[]>([]);
    const [isEnabled, setIsEnabled] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({ quality: 80, resolution: 'Original', maxSize: 0, interval: 60 });
    const [viewMode, setViewMode] = useState<'grid' | 'table' | 'small'>('grid');

    const [ocrResults, setOcrResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    
    const observerTarget = useRef<HTMLDivElement>(null);
    const LIMIT = 50;

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
        setOffset(0);
        setImages([]);
        fetchImages(0, true);

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
                            maxSize: agent.MaxScreenshotSize || 0,
                            interval: agent.ScreenshotInterval || 60
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
                setImages(prev => [{
                    Filename: `Live Capture`,
                    Date: new Date().toISOString(),
                    Timestamp: new Date().toISOString(),
                    IsAlert: false,
                    Url: '',
                    ThumbnailUrl: '',
                    dataUri: dataUri
                }, ...prev]);
            }
        });
        return () => { newSocket.disconnect(); };
    }, [agentId, apiUrl, token]);

    const fetchImages = async (newOffset: number, reset: boolean = false) => {
        try {
            if (reset) {
                setIsInitialLoading(true);
            } else {
                setIsLoadingMore(true);
            }
            
            const res = await fetch(`${apiUrl}/screenshots/list/${agentId}?limit=${LIMIT}&offset=${newOffset}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setImages(prev => reset ? data : [...prev, ...data]);
                setHasMore(data.length === LIMIT);
                setOffset(newOffset);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsInitialLoading(false);
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (!hasMore || isLoadingMore || isInitialLoading) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    fetchImages(offset + LIMIT);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, isInitialLoading, offset]);

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
            const res = await fetch(`${apiUrl}/agents/${agentId}/toggle-screenshots?enabled=${newVal}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok && onUpdate) {
                onUpdate();
            }
        } catch (e: any) { setIsEnabled(!newVal); setError(e.message); }
    };

    const saveSettings = async () => {
        try {
            await fetch(`${apiUrl}/agents/${agentId}/settings`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ScreenshotQuality: settings.quality, 
                    ScreenshotResolution: settings.resolution, 
                    MaxScreenshotSize: settings.maxSize,
                    ScreenshotInterval: settings.interval
                })
            });
            setShowSettings(false);
        } catch (e) { console.error("Failed settings save", e); }
    };

    if (error) return <div className="p-4 text-red-500 bg-red-900/10 rounded">{error}</div>;

    return (
        <div className="space-y-6">
            {/* Forensic Stats Bar */}
            {/* Forensic Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 md:p-4 flex items-center gap-3 md:gap-4 hover:bg-gray-100 dark:hover:bg-white/10 transition-all group shadow-sm">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <Layers className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <div className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest">Total Frames</div>
                        <div className="text-lg md:text-xl font-black text-gray-900 dark:text-white">{stats.totalImages}</div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 md:p-4 flex items-center gap-3 md:gap-4 hover:bg-gray-100 dark:hover:bg-white/10 transition-all group shadow-sm">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                        <Database className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <div className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest">Storage</div>
                        <div className="text-lg md:text-xl font-black text-gray-900 dark:text-white">{formatSize(stats.totalSize)}</div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 md:p-4 flex items-center gap-3 md:gap-4 hover:bg-gray-100 dark:hover:bg-white/10 transition-all group shadow-sm">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                        <HardDrive className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <div className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest">Memory</div>
                        <div className="text-lg md:text-xl font-black text-gray-900 dark:text-white">~{formatSize(stats.memoryImpact)}</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white/90 dark:bg-gray-800/50 backdrop-blur-xl p-3 md:p-4 rounded-2xl md:rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl transition-colors">
                <div className="flex items-center justify-between lg:justify-start gap-4">
                    <h3 className="text-xs md:text-sm font-black text-gray-900 dark:text-white flex gap-2 uppercase tracking-tighter"><Image className="w-4 h-4 md:w-5 md:h-5 text-blue-500" /> Evidence</h3>
                    <div className="hidden sm:block h-4 w-[1px] bg-gray-200 dark:bg-white/10" />
                    <div className="flex bg-gray-100 dark:bg-black/40 rounded-xl p-1 border border-gray-200 dark:border-white/5">
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}><LayoutGrid size={14} /></button>
                        <button onClick={() => setViewMode('small')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'small' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}><Grid2X2 size={14} /></button>
                        <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}><List size={14} /></button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <form onSubmit={handleSearch} className="relative group flex-1 min-w-0">
                        <input
                            type="text"
                            placeholder="OCR Search..."
                            value={searchQuery}
                            onChange={(e: any) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl md:rounded-2xl px-4 md:px-5 py-2 text-[10px] md:text-[11px] text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 sm:w-48 md:w-64 transition-all focus:ring-1 focus:ring-blue-500/30"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-400">
                            {isSearching ? <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <Search size={14} />}
                        </button>
                    </form>
                    <div className="flex items-center gap-2">
                        <button onClick={async () => { await fetch(`${apiUrl}/agents/${agentId}/take-screenshot`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); }} className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl md:rounded-2xl text-white font-black text-[9px] md:text-[10px] shadow-lg shadow-blue-600/20 transition-all active:scale-95 uppercase tracking-widest">Capture</button>
                        <button onClick={() => setShowSettings(true)} className="p-2 md:p-2.5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl" title="Settings"><SettingsIcon className="w-4 h-4 md:w-5 md:h-5" /></button>
                        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                            <button onClick={toggleScreenshots} disabled={loadingSettings} className={`w-9 h-4 md:w-10 md:h-5 rounded-full p-1 relative transition-colors ${isEnabled ? 'bg-green-600' : 'bg-gray-700'}`}>
                                <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full bg-white shadow-sm transition-transform ${isEnabled ? 'translate-x-4 md:translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest min-w-[24px] ${isEnabled ? 'text-green-400' : 'text-gray-500'}`}>{isEnabled ? 'Live' : 'Off'}</span>
                        </div>
                    </div>
                </div>
            </div>
            {showSettings && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
                    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 sm:border dark:border-gray-800 p-6 md:p-8 rounded-t-3xl sm:rounded-3xl w-full sm:w-96 shadow-2xl animate-in slide-in-from-bottom duration-300 transition-colors">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">Forensic Config</h3>
                            <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white sm:hidden text-xs font-bold">Close</button>
                        </div>
                        <div className="space-y-6">
                            <div><label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">Resolution</label><select value={settings.resolution} onChange={e => setSettings({ ...settings, resolution: e.target.value })} className="w-full bg-gray-100 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-all"><option value="Original">Original (Full)</option><option value="720p">720p (Medium)</option><option value="480p">480p (Lite)</option></select></div>
                            <div><label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">Quality {settings.quality}%</label><input type="range" min="10" max="100" value={settings.quality} onChange={e => setSettings({ ...settings, quality: parseInt(e.target.value) })} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600" /></div>
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block flex justify-between">
                                    <span>Capture Interval</span>
                                    <span className="text-blue-400 font-bold">{settings.interval}s</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="3600" 
                                    step="5"
                                    value={settings.interval} 
                                    onChange={e => setSettings({ ...settings, interval: parseInt(e.target.value) })} 
                                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                                />
                                <div className="flex justify-between text-[8px] text-gray-500 uppercase font-black mt-2">
                                    <span>5s (RAPID)</span>
                                    <span>1h (STILL)</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
                            <button onClick={() => setShowSettings(false)} className="p-3 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Discard</button>
                            <button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95">Commit Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((img, i) => {
                        const ocrHit = ocrResults.find(r => r.screenshotId === img.Filename);
                        const isMatched = searchQuery && ocrHit;

                        return (
                            <div key={i} className={`group relative bg-gray-50 dark:bg-white/5 backdrop-blur-md rounded-2xl md:rounded-3xl overflow-hidden border transition-all duration-500 hover:shadow-2xl ${isMatched ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'border-gray-200 dark:border-white/10'}`}>
                                <div className="aspect-video bg-gray-100 dark:bg-black relative">
                                    <img 
                                        src={img.dataUri || (img.ThumbnailUrl ? `${img.ThumbnailUrl}?token=${token}` : `${img.Url}?token=${token}`)} 
                                        alt={img.Filename} 
                                        className={`w-full h-full object-cover transition-all duration-700 ${isMatched ? 'opacity-100' : 'opacity-80 group-hover:opacity-100 group-hover:scale-110'}`} 
                                    />
                                    <div className="absolute top-2 left-2 flex gap-2">
                                        {isMatched && (
                                            <div className="bg-blue-600 text-[8px] font-black text-white px-2 py-1 rounded-lg shadow-lg uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md border border-white/20">
                                                <Search size={10} /> Match
                                            </div>
                                        )}
                                        {img.IsAlert && (
                                            <div className="bg-red-600 text-[8px] font-black text-white px-2 py-1 rounded-lg shadow-lg uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md border border-white/20 animate-pulse">
                                                <Shield size={10} /> Alert
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute top-2 right-2 bg-gray-900/60 dark:bg-black/60 backdrop-blur-md text-[8px] font-mono text-white/80 px-2 py-1 rounded-lg border border-white/10">
                                        {formatSize(img.Size)}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-[10px] text-gray-900 dark:text-white/90 font-black truncate tracking-tight">{img.Filename}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock className="w-3 h-3 text-gray-500" />
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date(normalizeTimestamp(img.Timestamp || img.Date)).toLocaleString()}</p>
                                    </div>
                                </div>
                                <a href={`${img.Url}?token=${token}`} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-blue-600/20 backdrop-blur-[2px] transition-all duration-300">
                                    <span className="bg-white text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-2xl translate-y-4 group-hover:translate-y-0 transition-transform">Inspect</span>
                                </a>
                            </div>
                        );
                    })}
                </div>
            )}

            {viewMode === 'small' && (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-2">
                    {images.map((img, i) => (
                        <a key={i} href={`${img.Url}?token=${token}`} target="_blank" rel="noreferrer" className="group relative aspect-square bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden hover:border-blue-500 transition-all hover:scale-110 active:scale-95 z-0 hover:z-10 shadow-sm">
                            <img 
                                src={img.dataUri || (img.ThumbnailUrl ? `${img.ThumbnailUrl}?token=${token}` : `${img.Url}?token=${token}`)} 
                                alt={img.Filename} 
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                            />
                            {img.IsAlert && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_red] animate-pulse" />}
                        </a>
                    ))}
                </div>
            )}

            {viewMode === 'table' && (
                <div className="bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl md:rounded-3xl overflow-hidden backdrop-blur-xl">
                    {/* Desktop Table */}
                    <table className="w-full text-left hidden md:table">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Preview</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Metadata</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Timestamp</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Forensic Size</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                            {images.map((img, i) => (
                                <tr key={i} className="group hover:bg-white/[0.03] transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="w-16 h-10 bg-gray-100 dark:bg-black rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 relative">
                                            <img 
                                                src={img.dataUri || (img.ThumbnailUrl ? `${img.ThumbnailUrl}?token=${token}` : `${img.Url}?token=${token}`)} 
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100" 
                                            />
                                            {img.IsAlert && <div className="absolute inset-0 border-2 border-red-500/50 pointer-events-none" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex flex-col">
                                            <span className={`text-[11px] font-mono leading-none truncate max-w-xs ${img.IsAlert ? 'text-red-400 font-bold' : 'text-gray-900 dark:text-white/90'}`}>{img.Filename}</span>
                                            {img.IsAlert && <span className="text-[8px] text-red-500 font-black uppercase mt-1 tracking-tighter">Alert Triggered</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-[10px] text-gray-400 font-black uppercase">{new Date(normalizeTimestamp(img.Timestamp || img.Date)).toLocaleString()}</td>
                                    <td className="px-6 py-3">
                                        <span className="text-[10px] font-mono bg-white/5 border border-white/5 px-2 py-1 rounded-lg text-cyan-400 font-bold">{formatSize(img.Size)}</span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <a href={`${img.Url}?token=${token}`} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-tighter text-blue-400 hover:text-blue-300 transition-colors">Inspect</a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Mobile List View */}
                    <div className="md:hidden divide-y divide-gray-200 dark:divide-white/5">
                        {images.map((img, i) => (
                            <div key={i} className="p-4 flex gap-4 items-center">
                                <div className="w-20 h-14 bg-gray-100 dark:bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 relative flex-shrink-0">
                                    <img 
                                        src={img.dataUri || (img.ThumbnailUrl ? `${img.ThumbnailUrl}?token=${token}` : `${img.Url}?token=${token}`)} 
                                        className="w-full h-full object-cover" 
                                    />
                                    {img.IsAlert && <div className="absolute inset-0 border-2 border-red-500/50" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-[11px] font-mono truncate ${img.IsAlert ? 'text-red-400 font-bold' : 'text-gray-900 dark:text-white/90'}`}>{img.Filename}</div>
                                    <div className="text-[9px] text-gray-500 font-black uppercase mt-1">{new Date(normalizeTimestamp(img.Timestamp || img.Date)).toLocaleTimeString()} • {formatSize(img.Size)}</div>
                                </div>
                                <a href={`${img.Url}?token=${token}`} target="_blank" rel="noreferrer" className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
                                    <Layers size={14} />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Infinite Scroll Sentinel & Skeleton Feed */}
            <div ref={observerTarget} className="min-h-[100px] flex flex-col items-center justify-center py-10">
                {(isInitialLoading || isLoadingMore) && (
                    <div className="w-full">
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {[...Array(LIMIT)].map((_, i) => (
                                    <div key={i} className="aspect-video bg-white/5 rounded-3xl animate-pulse border border-white/5 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-white/10 animate-spin" />
                                    </div>
                                ))}
                            </div>
                        )}
                        {viewMode === 'small' && (
                            <div className="grid grid-cols-5 md:grid-cols-10 lg:grid-cols-12 gap-2">
                                {[...Array(LIMIT)].map((_, i) => (
                                    <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse border border-white/5" />
                                ))}
                            </div>
                        )}
                        {viewMode === 'table' && (
                            <div className="space-y-2">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                                ))}
                            </div>
                        )}
                        
                        <div className="flex flex-col items-center mt-12 space-y-4">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                                </div>
                            </div>
                            <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] animate-pulse">
                                Retrieving Forensic Evidence
                            </div>
                        </div>
                    </div>
                )}
                
                {!hasMore && images.length > 0 && (
                    <div className="flex flex-col items-center py-10 opacity-40">
                        <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Shield className="w-4 h-4" /> End of Evidence Pipeline
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
