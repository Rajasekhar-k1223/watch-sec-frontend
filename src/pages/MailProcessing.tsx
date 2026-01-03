
import { Mail, ShieldAlert, CheckCircle, Paperclip, RefreshCw, Eye, EyeOff, Printer, Download, FileText, File } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

interface Attachment {
    Id: number;
    FileName: string;
    Size: number;
}

interface MailLog {
    Id: number;
    AgentId: string;
    Sender: string;
    Recipient: string;
    Subject: string;
    BodyPreview: string;
    HasAttachments: boolean;
    RiskLevel: string;
    Timestamp: string;
    Attachments?: Attachment[];
}

export default function MailProcessing() {
    const { token } = useAuth();
    const [logs, setLogs] = useState<MailLog[]>([]);
    const [selectedLog, setSelectedLog] = useState<MailLog | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/mail/`, {
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
        if (token) {
            fetchLogs();
            const interval = setInterval(fetchLogs, 5000);
            return () => clearInterval(interval);
        }
    }, [token]);

    const handlePrint = () => {
        const content = document.getElementById('mail-print-area')?.innerHTML;
        const win = window.open('', '', 'height=700,width=800');
        if (win) {
            win.document.write(`<html><head><title>Print Mail</title></head><body style="font-family:monospace; padding: 20px; background: #fff; color: #000;">${content}</body></html>`);
            win.document.close();
            win.print();
        }
    };

    const handleExportCSV = () => {
        if (logs.length === 0) return;
        const headers = ["Timestamp", "Agent ID", "Sender", "Recipient", "Subject", "Risk", "Attachments"];
        const csvContent = [
            headers.join(","),
            ...logs.map(l => [
                l.Timestamp,
                l.AgentId,
                l.Sender,
                l.Recipient,
                `"${l.Subject ? l.Subject.replace(/"/g, '""') : ''}"`,
                l.RiskLevel,
                l.HasAttachments ? "Yes" : "No"
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mail_logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Mail className="text-yellow-500" />
                        Mail Processing (SMTP/Agent)
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Intercept, inspect, and audit email traffic from Outlook and Webmail.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold text-xs"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                    <button
                        onClick={fetchLogs}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold text-xs"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </div>

            {/* View Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Mail className="text-blue-500" /> Message Details
                            </h2>
                            <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-white"><EyeOff className="w-5 h-5" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 font-mono text-sm" id="mail-print-area">
                            {/* Header Info */}
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 uppercase font-bold">Timestamp</span>
                                    <div className="text-white">{new Date(selectedLog.Timestamp).toLocaleString()}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 uppercase font-bold">Risk Level</span>
                                    <div className={`${selectedLog.RiskLevel === 'High' ? 'text-red-400' : 'text-green-400'} font-bold border border-current px-2 py-0.5 rounded w-fit text-xs`}>
                                        {selectedLog.RiskLevel}
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1 border-t border-gray-700 pt-2 mt-2">
                                    <span className="text-xs text-gray-500 uppercase font-bold">Agent ID</span>
                                    <div className="text-gray-300 font-mono text-xs">{selectedLog.AgentId}</div>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <span className="text-xs text-gray-500 uppercase font-bold">Subject</span>
                                    <div className="text-white font-bold text-lg">{selectedLog.Subject}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 uppercase font-bold">From</span>
                                    <div className="text-blue-300 break-all bg-blue-900/10 p-1 rounded border border-blue-500/20">{selectedLog.Sender}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 uppercase font-bold">To</span>
                                    <div className="text-purple-300 break-all bg-purple-900/10 p-1 rounded border border-purple-500/20">{selectedLog.Recipient}</div>
                                </div>
                            </div>

                            {/* Attachments */}
                            {selectedLog.HasAttachments && (
                                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs text-gray-400 uppercase flex items-center gap-2 font-bold">
                                            <Paperclip size={14} />
                                            {selectedLog.Attachments?.length || 0} Attachments Detected
                                        </span>
                                    </div>

                                    {selectedLog.Attachments && selectedLog.Attachments.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedLog.Attachments.map(att => (
                                                <div key={att.Id} className="flex justify-between items-center bg-gray-900 p-2 rounded border border-gray-700 hover:border-gray-500 transition-colors">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <File size={16} className="text-blue-400 shrink-0" />
                                                        <span className="truncate text-gray-300">{att.FileName}</span>
                                                        <span className="text-xs text-gray-500">({formatBytes(att.Size)})</span>
                                                    </div>
                                                    <a
                                                        href={`${API_URL}/api/mail/attachment/${att.Id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                                                    >
                                                        <Download size={12} /> Download
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-yellow-400 italic text-xs">
                                            * File metadata captured, but no content available for download.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Body */}
                            <div className="space-y-2">
                                <span className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2"><FileText size={14} /> Body Content</span>
                                <div className="bg-black p-4 rounded border border-gray-800 text-gray-300 whitespace-pre-wrap leading-relaxed h-[300px] overflow-y-auto">
                                    {selectedLog.BodyPreview || "(No Content)"}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-gray-800 bg-gray-800/50 flex justify-end gap-3">
                            <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors">
                                <Printer size={16} /> Print / Save PDF
                            </button>
                            <button onClick={() => setSelectedLog(null)} className="px-4 py-2 text-gray-400 hover:text-white font-bold">Close</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Total Emails</h3>
                    <p className="text-3xl font-bold text-white">{logs.length}</p>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Blocked / Sensitive</h3>
                    <p className="text-3xl font-bold text-red-400">
                        {logs.filter(l => l.RiskLevel === 'High').length}
                    </p>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">With Attachments</h3>
                    <p className="text-3xl font-bold text-blue-400">
                        {logs.filter(l => l.HasAttachments).length}
                    </p>
                </div>

                {/* Main List */}
                <div className="col-span-1 lg:col-span-3 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex justify-between">
                        <h3 className="font-bold text-white">Intercepted Emails</h3>
                        <div className="text-xs text-gray-500">{logs.length} Records</div>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Agent ID</th>
                                <th className="p-4">Sender</th>
                                <th className="p-4">Recipient</th>
                                <th className="p-4">Subject</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 text-gray-300">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading logs...</td></tr>
                            ) : logs.map((log, i) => (
                                <tr key={log.Id || i} className="hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 text-gray-400 text-xs">{new Date(log.Timestamp).toLocaleString()}</td>
                                    <td className="p-4 font-mono text-gray-500 text-xs">{log.AgentId}</td>
                                    <td className="p-4 font-mono text-blue-300 text-xs">{log.Sender}</td>
                                    <td className="p-4 font-mono text-purple-300 text-xs truncate max-w-[150px]" title={log.Recipient}>{log.Recipient}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-white mb-1 flex items-center gap-2">
                                            <span className="truncate max-w-[200px]" title={log.Subject}>{log.Subject}</span>
                                            {log.HasAttachments && <Paperclip size={12} className="text-gray-400" />}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{log.BodyPreview}</div>
                                    </td>
                                    <td className="p-4">
                                        {log.RiskLevel === 'High' ? (
                                            <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded w-fit text-xs font-bold border border-red-500/20">
                                                <ShieldAlert size={12} /> HIGH RISK
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-1 rounded w-fit text-xs font-bold border border-green-500/20">
                                                <CheckCircle size={12} /> SAFE
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setSelectedLog(log)}
                                            className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white p-2 rounded transition-all"
                                            title="View Details"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && logs.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            No emails intercepted recently.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
