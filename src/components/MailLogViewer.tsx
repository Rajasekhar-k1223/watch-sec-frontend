
import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';

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

    useEffect(() => {
        if (!agentId || !token) return;
        setLoading(true);
        fetch(`${apiUrl}/api/mail/${agentId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setMails(data); })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [agentId, apiUrl, token]);

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2"><Mail size={16} /> Email Interception Logs</h4>
                <div className="text-xs text-gray-500">{mails.length} Records</div>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs sticky top-0">
                    <tr><th className="p-4">Time</th><th className="p-4">Sender & Recipient</th><th className="p-4">Subject</th><th className="p-4">Risk</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-gray-300 font-mono">
                    {mails.length === 0 ? (
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
