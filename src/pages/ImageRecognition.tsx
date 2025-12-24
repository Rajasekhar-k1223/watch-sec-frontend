import { Image, Search, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface OCRLog {
    id: string;
    agentId: string;
    screenshotId: string;
    extractedText: string;
    confidence: number;
    sensitiveKeywordsFound: string[];
    timestamp: string;
}

export default function ImageRecognition() {
    const [logs, setLogs] = useState<OCRLog[]>([]);
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL || "https://192.168.1.10:7033";

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/ocr`);
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
        fetchLogs();
    }, []);

    const triggerSimulation = async () => {
        // Simulate processing a random screenshot
        await fetch(`${API_URL}/api/ocr/process/simulated-screen-123?agentId=DESKTOP-DEMO`, { method: 'POST' });
        fetchLogs();
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Image className="text-purple-500" />
                        Image Recognition (OCR)
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Automatic text extraction and sensitive data detection from captured screenshots.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={triggerSimulation}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw size={18} />
                        Refresh Logs
                    </button>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                        <Search size={18} />
                        Scan History
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Scanned Images</h3>
                    <p className="text-3xl font-bold text-white">{logs.length}</p>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Sensitive Data Found</h3>
                    <p className="text-3xl font-bold text-red-400">
                        {logs.filter(l => l.sensitiveKeywordsFound.length > 0).length}
                    </p>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Avg Confidence</h3>
                    <p className="text-3xl font-bold text-blue-400">
                        {(logs.reduce((acc, l) => acc + l.confidence, 0) / (logs.length || 1) * 100).toFixed(1)}%
                    </p>
                </div>

                {/* Main List */}
                <div className="col-span-1 lg:col-span-3 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-700 bg-gray-900/50">
                        <h3 className="font-bold text-white">Recent OCR Scans</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Agent</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Extracted Text</th>
                                <th className="p-4">Confidence</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 text-gray-300">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading logs...</td></tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="p-4 font-mono text-blue-300">{log.agentId}</td>
                                    <td className="p-4">
                                        {log.sensitiveKeywordsFound.length > 0 ? (
                                            <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded w-fit text-xs font-bold border border-red-500/20">
                                                <AlertTriangle size={12} /> DETECTED
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-1 rounded w-fit text-xs font-bold border border-green-500/20">
                                                <CheckCircle size={12} /> CLEAN
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 max-w-md truncate" title={log.extractedText}>
                                        {log.extractedText}
                                        {log.sensitiveKeywordsFound.length > 0 && (
                                            <div className="mt-1 flex gap-1">
                                                {log.sensitiveKeywordsFound.map(k => (
                                                    <span key={k} className="text-[10px] bg-red-900/50 text-red-200 px-1 rounded border border-red-800">{k}</span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500"
                                                    style={{ width: `${log.confidence * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500">{(log.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && logs.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            No OCR logs found. Click "Simulate Scan" to test.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
