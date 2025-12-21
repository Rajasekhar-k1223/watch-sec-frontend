import { Mic, AlertCircle } from 'lucide-react';

export default function SpeechRecognition() {
    // Future: const [logs, setLogs] = useState<AudioLog[]>([]);
    // Future: const [loading, setLoading] = useState(false);
    // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5140";

    // Mock Data for UI (since backend endpoint for *listing* audio isn't explicitly created, only transcribing)
    // Ideally we would have a GET /api/audio endpoint.
    // For now, I will create a simple UI that allows "On Demand" transcription of a known file or shows a placeholder list.

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2 mb-6">
                <Mic className="text-red-500" />
                Speech Recognition (Audio Analysis)
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Info Card */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                            <span className="text-gray-400">Engine</span>
                            <span className="text-green-400 font-mono font-bold">System.Speech (Windows Native)</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                            <span className="text-gray-400">Recording Interval</span>
                            <span className="text-white font-mono">30 Seconds</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                            <span className="text-gray-400">Storage Path</span>
                            <span className="text-yellow-500 font-mono text-xs">/Storage/Audio/</span>
                        </div>
                    </div>
                </div>

                {/* Manual Transcribe Tool */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Manual Transcription</h2>
                    <p className="text-gray-400 text-sm mb-4">
                        Enter a filename from the storage directory to trigger on-demand transcription.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="e.g. 123456_mic_chunk.wav"
                            className="flex-1 bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:border-blue-500"
                        />
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                            Transcribe
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Transcriptions List */}
            <div className="mt-8 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700 bg-gray-900/50">
                    <h3 className="font-bold text-white">Recent Transcriptions</h3>
                </div>
                <div className="p-12 text-center text-gray-500">
                    <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
                    <p>No transcriptions available yet. Audio is being recorded in the background.</p>
                </div>
            </div>
        </div>
    );
}
