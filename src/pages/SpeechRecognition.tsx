import { Mic, AlertCircle, Play, Search, Lock, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

const PLAN_LEVELS: Record<string, number> = {
    "starter": 1,
    "professional": 2,
    "pro": 2,
    "enterprise": 3,
    "unlimited": 100
};

const FEATURE_TIERS: Record<string, number> = {
    "speech": 3
};

interface AudioLog {
    id: number;
    agentId: string;
    audioUrl: string;
    transcribedText: string;
    confidence: number;
    durationSeconds: number;
    flaggedKeywordsJson: string;
    timestamp: string;
}

export default function SpeechRecognition() {
    const { token, user } = useAuth();
    const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
    const [logs, setLogs] = useState<AudioLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchAgent, setSearchAgent] = useState('');
    const [planLevel, setPlanLevel] = useState<number>(1);

    const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin' || user?.role?.toLowerCase() === 'admin';
    const isLocked = !isSuperAdmin && planLevel < (FEATURE_TIERS["speech"] || 3);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const url = searchAgent ? `${API_URL}/speech/list/${searchAgent}` : `${API_URL}/speech/list/ALL`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                setLogs(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authToken) return;

        // Fetch Plan
        if (user?.tenantId) {
            fetch(`${API_URL}/tenants/${user.tenantId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
                .then(res => res.json())
                .then(data => {
                    const p = data.Plan || data.plan || "Starter";
                    setPlanLevel(PLAN_LEVELS[p.toLowerCase()] || 1);
                })
                .catch(e => console.error("Plan error", e));
        }

        fetchLogs();
    }, [authToken, searchAgent, user?.tenantId]);

    return (
        <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6 relative animate-in fade-in duration-500">
            {isLocked && (
                <div className="absolute inset-0 z-[60] bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-slate-200">
                    <div className="p-6 bg-rose-50 rounded-full mb-6 ring-8 ring-rose-50 border border-rose-100">
                        <Lock className="w-16 h-16 text-rose-500" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Enterprise Access Required</h2>
                    <p className="text-slate-600 max-w-md mb-8 text-base leading-relaxed">
                        <b>Speech Recognition</b> and Real-time Audio Intelligence are premium modules reserved for <b>Enterprise Plan</b> customers.
                    </p>
                    <button
                        onClick={() => window.location.hash = '#billing'}
                        className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 group text-base"
                    >
                        <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Upgrade to Enterprise
                    </button>
                    <p className="mt-4 text-slate-500 text-xs">
                        Contact support for an evaluation license.
                    </p>
                </div>
            )}

            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-rose-50 rounded-lg shrink-0 border border-rose-100">
                        <Mic className="text-rose-600 w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    Speech Recognition (Audio Analysis)
                </h1>
                <p className="text-slate-500 text-sm font-medium">Real-time voice capture, audio telemetry, and keyword flagging across endpoints.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Info Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">System Status</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-slate-500 text-sm font-medium">Engine</span>
                            <span className="text-emerald-700 font-mono font-bold text-sm">System.Speech (Windows Native)</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-slate-500 text-sm font-medium">Recording Interval</span>
                            <span className="text-slate-800 font-mono font-semibold text-sm">30 Seconds</span>
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-slate-500 text-sm font-medium">Storage Path</span>
                            <span className="text-amber-700 font-mono text-xs font-semibold">/Storage/Audio/</span>
                        </div>
                    </div>
                </div>

                {/* Manual Transcribe Tool */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Manual Transcription</h2>
                    <p className="text-slate-500 text-sm mb-4">
                        Enter a filename from the storage directory to trigger on-demand transcription.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="e.g. 123456_mic_chunk.wav"
                            className="flex-1 bg-white border border-slate-200 text-slate-900 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-400"
                        />
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm">
                            Transcribe
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Transcriptions List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-sm">Recent Transcriptions</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Filter by Agent ID..."
                            className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg outline-none text-slate-800 placeholder-slate-400"
                            value={searchAgent}
                            onChange={(e) => setSearchAgent(e.target.value)}
                        />
                        <button onClick={fetchLogs} className="p-2 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                            <Search size={14} className="text-slate-500" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Agent</th>
                                <th className="p-4">Transcription</th>
                                <th className="p-4">Keywords</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-500 animate-pulse">Loading audio logs...</td></tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-4 text-xs text-slate-500 font-mono">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="p-4 font-mono text-blue-600 text-xs font-semibold">
                                        {log.agentId}
                                    </td>
                                    <td className="p-4 text-slate-700 italic">
                                        "{log.transcribedText}"
                                    </td>
                                    <td className="p-4">
                                        {(() => {
                                            try {
                                                const keywords = JSON.parse(log.flaggedKeywordsJson || "[]");
                                                return keywords.map((k: string) => (
                                                    <span key={k} className="text-[11px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 mr-1 font-bold">
                                                        {k}
                                                    </span>
                                                ));
                                            } catch {
                                                return null;
                                            }
                                        })()}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => {
                                                const url = log.audioUrl.startsWith('http') ? log.audioUrl : `${API_URL}${log.audioUrl}`;
                                                fetch(url, { headers: { 'Authorization': `Bearer ${authToken}` } })
                                                    .then(res => res.blob())
                                                    .then(blob => {
                                                        const blobUrl = URL.createObjectURL(blob);
                                                        const a = new Audio(blobUrl);
                                                        a.play();
                                                    })
                                                    .catch(e => console.error("Playback error", e));
                                            }}
                                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-shadow shadow-sm"
                                            title="Play Audio"
                                        >
                                            <Play size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && logs.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        <AlertCircle className="mx-auto mb-2 text-slate-400" size={32} />
                        <p className="font-medium text-slate-700">No transcriptions found for this agent.</p>
                        <p className="text-xs text-slate-400 mt-1">Audio telemetry will appear once microphones record chunks.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
