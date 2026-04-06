
import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl">
            <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                        <Mail size={18} />
                    </div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Intercepted Intel</h4>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full lg:w-auto">
                    <div className="flex bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1 items-center gap-1 shadow-inner overflow-x-auto no-scrollbar">
                        <div className="flex bg-white dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-transparent">
                            <button onClick={() => setQuickFilter(1)} className="px-3 py-1.5 text-[10px] font-black hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all text-gray-500 hover:text-gray-900 dark:hover:text-white uppercase tracking-tighter">24H</button>
                            <button onClick={() => setQuickFilter(7)} className="px-3 py-1.5 text-[10px] font-black hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all text-gray-500 hover:text-gray-900 dark:hover:text-white uppercase tracking-tighter">7D</button>
                            <button onClick={() => setQuickFilter(30)} className="px-3 py-1.5 text-[10px] font-black hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all text-gray-500 hover:text-gray-900 dark:hover:text-white uppercase tracking-tighter">30D</button>
                        </div>
                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1 shrink-0" />
                        <div className="flex items-center gap-2 px-2 shrink-0">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-gray-700 dark:text-gray-300 text-[11px] font-mono focus:ring-0 w-24 p-0"
                            />
                            <span className="text-gray-400 dark:text-gray-600 text-[10px]">→</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-gray-700 dark:text-gray-300 text-[11px] font-mono focus:ring-0 w-24 p-0"
                            />
                        </div>
                        {(startDate || endDate) && (
                            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="ml-2 pr-3 text-[9px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest">Clear</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/80 text-gray-500 uppercase font-black text-[10px] tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Time Intelligence</th>
                            <th className="px-6 py-4">Transmission</th>
                            <th className="px-6 py-4">Subject Vector</th>
                            <th className="px-6 py-4 text-right">Risk Protocol</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-700 dark:text-gray-300 font-mono">
                        {loading && (
                            <tr><td colSpan={4} className="p-12 text-center text-gray-500 animate-pulse">Synchronizing Logs...</td></tr>
                        )}
                        {!loading && mails.length === 0 ? (
                            <tr><td colSpan={4} className="p-12 text-center text-gray-400 italic text-xs font-sans">No intercepted communications detected in this window.</td></tr>
                        ) : (
                            mails.map((m, i) => (
                                <tr key={m.Id || i} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 group transition-colors">
                                    <td className="px-6 py-4 text-gray-400 dark:text-gray-500 text-[10px] whitespace-nowrap font-sans">{new Date(normalizeTimestamp(m.Timestamp)).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-sans">
                                        <div className="text-gray-900 dark:text-white font-bold text-xs truncate max-w-xs">{m.Sender}</div>
                                        <div className="text-[10px] text-gray-400 dark:text-gray-500">→ {m.Recipient}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-blue-400 text-xs truncate max-w-md">{m.Subject}</div>
                                        {m.HasAttachments && <span className="text-[8px] bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-blue-300 mt-1 inline-block uppercase font-black">Encrypted Attachment</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${m.RiskLevel === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                            {m.RiskLevel}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
                {loading && <div className="p-12 text-center text-gray-400 animate-pulse text-xs">Syncing communications...</div>}
                {!loading && mails.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic text-xs font-sans">No intercepted communications.</div>
                ) : (
                    mails.map((m, i) => (
                        <div key={m.Id || i} className="p-4 space-y-3 font-sans">
                            <div className="flex justify-between items-start">
                                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase">{new Date(normalizeTimestamp(m.Timestamp)).toLocaleTimeString()}</div>
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${m.RiskLevel === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                    {m.RiskLevel}
                                </span>
                            </div>
                            <div>
                                <div className="text-gray-900 dark:text-white font-black text-xs break-all">{m.Sender}</div>
                                <div className="text-[10px] text-gray-400 dark:text-gray-500 break-all">→ {m.Recipient}</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                <div className="text-blue-500 dark:text-blue-300 text-xs font-bold leading-relaxed">{m.Subject}</div>
                                {m.HasAttachments && <div className="text-[8px] text-blue-500 font-black uppercase mt-2">Clip Attachment Detected</div>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
