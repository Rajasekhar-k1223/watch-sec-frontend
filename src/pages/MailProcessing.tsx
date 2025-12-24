import { Mail, ShieldAlert, CheckCircle, RefreshCw, Paperclip } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MailLog {
    id: string;
    sender: string;
    recipient: string;
    subject: string;
    bodyPreview: string;
    hasAttachments: boolean;
    isBlocked: boolean;
    timestamp: string;
}

export default function MailProcessing() {
    const [logs, setLogs] = useState<MailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL || "https://192.168.1.10:7033";

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/mail`);
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
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Mail className="text-yellow-500" />
                        Mail Processing (SMTP)
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Intercept, inspect, and block email traffic via internal SMTP relay (Port 2525).
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Total Emails</h3>
                    <p className="text-3xl font-bold text-white">{logs.length}</p>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Blocked / Sensitive</h3>
                    <p className="text-3xl font-bold text-red-400">
                        {logs.filter(l => l.isBlocked).length}
                    </p>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">With Attachments</h3>
                    <p className="text-3xl font-bold text-blue-400">
                        {logs.filter(l => l.hasAttachments).length}
                    </p>
                </div>

                {/* Main List */}
                <div className="col-span-1 lg:col-span-3 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-700 bg-gray-900/50">
                        <h3 className="font-bold text-white">Intercepted Emails</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Sender</th>
                                <th className="p-4">Recipient</th>
                                <th className="p-4">Subject</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 text-gray-300">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading logs...</td></tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="p-4 font-mono text-blue-300">{log.sender}</td>
                                    <td className="p-4 font-mono text-purple-300">{log.recipient}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-white mb-1 flex items-center gap-2">
                                            {log.subject}
                                            {log.hasAttachments && <Paperclip size={12} className="text-gray-400" />}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate max-w-md">{log.bodyPreview}</div>
                                    </td>
                                    <td className="p-4">
                                        {log.isBlocked ? (
                                            <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded w-fit text-xs font-bold border border-red-500/20">
                                                <ShieldAlert size={12} /> BLOCKED
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-1 rounded w-fit text-xs font-bold border border-green-500/20">
                                                <CheckCircle size={12} /> ALLOWED
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && logs.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            No emails intercepted yet. Configure your mail client to use localhost:2525.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
