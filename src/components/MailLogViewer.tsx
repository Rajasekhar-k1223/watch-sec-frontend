
import { useState, useEffect } from 'react';
import { Mail, Calendar } from 'lucide-react';
import { useCallback } from 'react';

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

export default function MailLogViewer({ agentId, apiUrl, token }: Props) {
    const [mails, setMails] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

    const fetchLogs = useCallback(() => {
        if (!agentId || !token) return;
        setLoading(true);
        let url = `${apiUrl}/mail/${agentId}`;
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', `${startDate}T00:00:00`);
        if (endDate) params.append('end_date', `${endDate}T23:59:59`);
        if (params.toString()) url += `?${params.toString()}`;

        fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setMails(data); })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [agentId, apiUrl, token, startDate, endDate]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const setQuickFilter = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
    };

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2"><Mail size={16} /> Email Interception Logs</h4>
                </div>
                <div className="flex gap-4 items-center">
                    {(startDate || endDate) && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                            Showing: {startDate.split('-').reverse().join('-')} - {(endDate || '').split('-').reverse().join('-')}
                        </span>
                    )}
                    <div className="flex bg-gray-900 border border-gray-700 rounded-lg p-1 items-center gap-1 shadow-inner">
                        <div className="flex bg-gray-800 rounded p-0.5 mr-1">
                            <button onClick={() => setQuickFilter(1)} className="px-2 py-0.5 text-[10px] font-bold hover:bg-gray-700 rounded transition-all text-gray-400">24H</button>
                            <button onClick={() => setQuickFilter(7)} className="px-2 py-0.5 text-[10px] font-bold hover:bg-gray-700 rounded transition-all text-gray-400 border-l border-gray-700">7D</button>
                            <button onClick={() => setQuickFilter(30)} className="px-2 py-0.5 text-[10px] font-bold hover:bg-gray-700 rounded transition-all text-gray-400 border-l border-gray-700">30D</button>
                        </div>
                        <Calendar className="w-3.5 h-3.5 text-gray-500 ml-1" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-none text-gray-300 text-xs focus:ring-0 w-28 p-0"
                        />
                        <span className="text-gray-500 text-[10px]">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border-none text-gray-300 text-xs focus:ring-0 w-28 p-0"
                        />
                        {(startDate || endDate) && (
                            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="px-2 text-[10px] font-bold text-teal-500 hover:text-teal-400 uppercase">Clear</button>
                        )}
                    </div>
                </div>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs sticky top-0">
                    <tr><th className="p-4">Time</th><th className="p-4">Sender & Recipient</th><th className="p-4">Subject</th><th className="p-4">Risk</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-gray-300 font-mono">
                    {loading && (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading logs...</td></tr>
                    )}
                    {!loading && mails.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-500 italic">No email logs found.</td></tr>
                    ) : (
                        mails.map((m, i) => (
                            <tr key={m.Id || i} className="hover:bg-gray-700/30">
                                <td className="p-4 text-gray-500 text-xs">{new Date(normalizeTimestamp(m.Timestamp)).toLocaleString()}</td>
                                <td className="p-4">
                                    <div className="text-white font-bold">{m.Sender}</div>
                                    <div className="text-xs text-gray-400">→ {m.Recipient}</div>
                                </td>
                                <td className="p-4">
                                    <div className="text-blue-300">{m.Subject}</div>
                                    {m.HasAttachments && <span className="text-xs bg-gray-700 px-1 rounded text-gray-300 mt-1 inline-block">📎 Attachment</span>}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${m.RiskLevel === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                        {m.RiskLevel}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
