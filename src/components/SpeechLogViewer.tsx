
import { useState, useEffect } from 'react';
import { Mic, Play, Clock } from 'lucide-react';

interface SpeechLog {
    Id: number;
    AgentId: string;
    AudioUrl: string;
    TranscribedText: string;
    Confidence: number;
    DurationSeconds: number;
    FlaggedKeywordsJson: string;
    Timestamp: string;
}

interface SpeechLogViewerProps {
    agentId: string;
    apiUrl: string;
    token: string;
}

export default function SpeechLogViewer({ agentId, apiUrl, token }: SpeechLogViewerProps) {
    const [logs, setLogs] = useState<SpeechLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/speech/list/${agentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setLogs(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch speech logs", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [agentId]);

    return (
        <div className="flex flex-col h-full bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-800/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Audio Transcription History</span>
                </div>
                <button onClick={fetchLogs} className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase">Refresh</button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-950 text-gray-500 uppercase text-[10px] font-bold sticky top-0 z-10">
                        <tr>
                            <th className="p-4">Timestamp</th>
                            <th className="p-4">Transcription Snippet</th>
                            <th className="p-4">Keywords</th>
                            <th className="p-4 text-center">Duration</th>
                            <th className="p-4 text-right">Playback</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {loading ? (
                            <tr><td colSpan={5} className="p-12 text-center text-gray-500 italic animate-pulse">Synchronizing audio data...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} className="p-12 text-center text-gray-500 italic">No audio logs captured for this period.</td></tr>
                        ) : logs.map(log => (
                            <tr key={log.Id} className="hover:bg-gray-800/30 transition-colors group">
                                <td className="p-4 text-xs font-mono text-gray-500">
                                    {new Date(log.Timestamp).toLocaleString()}
                                </td>
                                <td className="p-4 text-gray-300 italic max-w-md truncate">
                                    "{log.TranscribedText}"
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {JSON.parse(log.FlaggedKeywordsJson || "[]").map((k: string) => (
                                            <span key={k} className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-bold uppercase">
                                                {k}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                                        <Clock size={10} /> {log.DurationSeconds.toFixed(1)}s
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors border border-blue-500/30">
                                        <Play size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
