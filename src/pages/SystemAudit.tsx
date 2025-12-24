import { useEffect, useState } from 'react';
import { ShieldCheck, Clock, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

interface AuditLog {
    id: number;
    tenantId: number;
    actor: string;
    action: string;
    target: string;
    details: string;
    timestamp: string;
}

export default function SystemAudit() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5140";

    useEffect(() => {
        const fetchLogs = async () => {
            const res = await fetch(`${API_URL}/api/audit?tenantId=${user?.tenantId || ''}`);
            if (res.ok) {
                setLogs(await res.json());
            }
        };
        fetchLogs();
    }, [user]);

    const filteredLogs = logs.filter(log =>
        log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 bg-gray-900 min-h-screen text-white font-sans animate-fade-in">
            <div className="flex justify-between items-end border-b border-gray-800 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">
                        <ShieldCheck className="text-teal-400" />
                        System Audit Logs
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Track administrative actions and compliance events.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-teal-500 outline-none w-64"
                    />
                </div>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-900 text-gray-200 uppercase font-bold text-xs">
                        <tr>
                            <th className="p-4 px-6">Timestamp</th>
                            <th className="p-4 px-6">Actor</th>
                            <th className="p-4 px-6">Action</th>
                            <th className="p-4 px-6">Target</th>
                            <th className="p-4 px-6">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {filteredLogs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 px-6 flex items-center gap-2 font-mono text-gray-500">
                                    <Clock size={14} /> {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="p-4 px-6 font-bold text-white">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">{(log.actor[0] || 'U').toUpperCase()}</div>
                                        {log.actor}
                                    </div>
                                </td>
                                <td className="p-4 px-6">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.action.includes('Delete') ? 'bg-red-900/50 text-red-400 border border-red-800' :
                                        log.action.includes('Create') ? 'bg-green-900/50 text-green-400 border border-green-800' :
                                            'bg-blue-900/50 text-blue-400 border border-blue-800'
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="p-4 px-6 font-mono text-gray-300">{log.target}</td>
                                <td className="p-4 px-6 text-gray-400">{log.details}</td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-gray-500 italic">No audit records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
