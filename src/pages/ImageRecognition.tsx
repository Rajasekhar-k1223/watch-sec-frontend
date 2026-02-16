import { Image as ImageIcon, Search, AlertTriangle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

interface OCRLog {
    id: string;
    agentId: string;
    screenshotId: string;
    extractedText: string;
    confidence: number;
    sensitiveKeywordsFound: string[];
    riskLevel: 'Normal' | 'High' | 'Critical';
    category: string;
    timestamp: string;
}

export default function ImageRecognition() {
    const { token } = useAuth();
    const [logs, setLogs] = useState<OCRLog[]>([]);
    const [searchAgent, setSearchAgent] = useState('');
    const [riskFilter, setRiskFilter] = useState<string>('All');
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const query = searchAgent ? `?agent_id=${searchAgent}` : '';
            const res = await fetch(`${API_URL}/ocr${query}`, {
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

    const filteredLogs = logs.filter(log => {
        if (riskFilter === 'All') return true;
        return log.riskLevel === riskFilter;
    });

    return (
        <div className="p-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-lg">
                            <ImageIcon className="text-purple-600 dark:text-purple-500 w-8 h-8" />
                        </div>
                        Image Recognition (OCR)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">
                        Automatic text extraction and PII/Sensitive data detection from screenshots.
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 items-center shadow-sm">
                        <Search className="text-gray-400 dark:text-gray-500 ml-2" size={16} />
                        <input
                            type="text"
                            placeholder="Filter by Agent ID..."
                            className="bg-transparent text-gray-900 dark:text-white text-xs px-3 py-1 outline-none w-48 placeholder-gray-400"
                            value={searchAgent}
                            onChange={(e) => setSearchAgent(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-white dark:bg-gray-800 text-gray-700 dark:text-white text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 outline-none shadow-sm"
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value)}
                    >
                        <option value="All">All Risks</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Normal">Normal</option>
                    </select>
                    <button
                        onClick={fetchLogs}
                        className="bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-gray-200 dark:border-gray-600 shadow-sm font-medium"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {/* Stats Cards */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-xl dark:shadow-lg transition-colors">
                    <h3 className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-2 tracking-wider">Scanned Images</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{logs.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-xl dark:shadow-lg transition-colors border-l-4 border-l-red-500">
                    <h3 className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-2 tracking-wider">Critical PII High Risk</h3>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-500">
                        {logs.filter(l => l.riskLevel === 'Critical').length}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-xl dark:shadow-lg transition-colors border-l-4 border-l-orange-500">
                    <h3 className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-2 tracking-wider">High Risk Findings</h3>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-500">
                        {logs.filter(l => l.riskLevel === 'High').length}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-xl dark:shadow-lg transition-colors border-l-4 border-l-blue-500">
                    <h3 className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-2 tracking-wider">Avg Confidence</h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {(logs.length > 0 ? (logs.reduce((acc, l) => acc + l.confidence, 0) / logs.length * 100) : 0).toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Main List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl dark:shadow-2xl transition-colors">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-gray-500" /> Recent OCR Scans ({filteredLogs.length})
                    </h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase font-bold text-xs">
                        <tr>
                            <th className="p-4 border-b border-gray-200 dark:border-gray-700">Timestamp</th>
                            <th className="p-4 border-b border-gray-200 dark:border-gray-700">Agent</th>
                            <th className="p-4 border-b border-gray-200 dark:border-gray-700">Risk Level</th>
                            <th className="p-4 border-b border-gray-200 dark:border-gray-700">Category</th>
                            <th className="p-4 border-b border-gray-200 dark:border-gray-700">Extracted Text</th>
                            <th className="p-4 border-b border-gray-200 dark:border-gray-700">Confidence</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-gray-700 dark:text-gray-300">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500 animate-pulse">Loading logs...</td></tr>
                        ) : filteredLogs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 text-gray-500 dark:text-gray-400 text-xs font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="p-4 font-bold text-gray-900 dark:text-white">{log.agentId}</td>
                                <td className="p-4">
                                    <span className={`flex items-center gap-1 px-2 py-1 rounded w-fit text-[10px] font-bold border ${log.riskLevel === 'Critical' ? 'text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20' :
                                        log.riskLevel === 'High' ? 'text-orange-600 bg-orange-100 border-orange-200 dark:text-orange-400 dark:bg-orange-500/10 dark:border-orange-500/20' :
                                            'text-green-600 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/20'
                                        }`}>
                                        <AlertTriangle size={12} /> {log.riskLevel}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{log.category}</span>
                                </td>
                                <td className="p-4 max-w-md">
                                    <div className="truncate text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/50 p-1.5 rounded border border-gray-200 dark:border-gray-700/50" title={log.extractedText}>
                                        {log.extractedText}
                                    </div>
                                    {log.sensitiveKeywordsFound.length > 0 && (
                                        <div className="mt-1 flex gap-1 flex-wrap">
                                            {log.sensitiveKeywordsFound.map(k => (
                                                <span key={k} className="text-[10px] bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-200 px-1.5 rounded border border-red-100 dark:border-red-800 font-medium">{k}</span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${log.confidence > 0.8 ? 'bg-green-500' : log.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${log.confidence * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{(log.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && logs.length === 0 && (
                    <div className="p-16 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center gap-4">
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <ImageIcon size={48} className="opacity-20 text-gray-900 dark:text-white" />
                        </div>
                        <p className="text-lg font-medium">No OCR logs found.</p>
                        <p className="text-sm">Screenshots will appear here once agents start reporting.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
