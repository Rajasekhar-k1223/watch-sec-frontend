import { Mic, AlertCircle, Play, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

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
    const { token } = useAuth();
    const [logs, setLogs] = useState<AudioLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchAgent, setSearchAgent] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // If searchAgent is empty, we might need a global endpoint or just fetch for a demo agent.
            // Backend speech.py has /list/{agent_id}. 
            // For now, let's assume we can fetch all if agent_id omitted (if we update backend)
            // or just fetch for what we have.
            const url = searchAgent ? `${API_URL}/speech/list/${searchAgent}` : `${API_URL}/speech/list/ALL`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
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
        if (token) fetchLogs();
    }, [token, searchAgent]);

    return (
        <div className="p-8 animate-fade-in transition-colors text-gray-900 dark:text-white">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                <Mic className="text-red-500" />
                Speech Recognition (Audio Analysis)
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Info Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">System Status</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                            <span className="text-gray-500 dark:text-gray-400">Engine</span>
                            <span className="text-green-600 dark:text-green-400 font-mono font-bold">System.Speech (Windows Native)</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                            <span className="text-gray-500 dark:text-gray-400">Recording Interval</span>
                            <span className="text-gray-900 dark:text-white font-mono">30 Seconds</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                            <span className="text-gray-500 dark:text-gray-400">Storage Path</span>
                            <span className="text-yellow-600 dark:text-yellow-500 font-mono text-xs">/Storage/Audio/</span>
                        </div>
                    </div>
                </div>

                {/* Manual Transcribe Tool */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Manual Transcription</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                        Enter a filename from the storage directory to trigger on-demand transcription.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="e.g. 123456_mic_chunk.wav"
                            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:border-blue-500"
                        />
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium">
                            Transcribe
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Transcriptions List */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white">Recent Transcriptions</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Filter by Agent ID..."
                            className="text-xs bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 px-2 py-1 rounded"
                            value={searchAgent}
                            onChange={(e) => setSearchAgent(e.target.value)}
                        />
                        <button onClick={fetchLogs} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                            <Search size={14} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-bold">
                            <tr>
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Agent</th>
                                <th className="p-4">Transcription</th>
                                <th className="p-4">Keywords</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-gray-400">Loading audio logs...</td></tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="p-4 text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="p-4 font-mono text-blue-500 dark:text-blue-400 text-xs">
                                        {log.agentId}
                                    </td>
                                    <td className="p-4 text-gray-700 dark:text-gray-300 italic">
                                        "{log.transcribedText}"
                                    </td>
                                    <td className="p-4">
                                        {JSON.parse(log.flaggedKeywordsJson || "[]").map((k: string) => (
                                            <span key={k} className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 mr-1 font-bold">
                                                {k}
                                            </span>
                                        ))}
                                    </td>
                                    <td className="p-4">
                                        <button className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-shadow shadow-md">
                                            <Play size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && logs.length === 0 && (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
                        <p>No transcriptions found for this agent.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
