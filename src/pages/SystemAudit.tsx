import { useEffect, useState } from 'react';
import { ShieldCheck, Clock, Search, User as UserIcon, Monitor, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import BandwidthStatus from '../components/BandwidthStatus'; // [NEW]

interface AuditLog {
    Id: number;
    ActorType?: string; // [NEW] User or Agent
    Actor: string;
    Action: string;
    Target?: string;
    Details: string;
    Timestamp: string;
}

export default function SystemAudit() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSource, setFilterSource] = useState<'All' | 'Agent' | 'User'>('Agent'); // Default to Agent as requested
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
    const { user, token } = useAuth();

    useEffect(() => {
        const fetchLogs = async () => {
            let url = `${API_URL}/audit?tenantId=${user?.tenantId || ''}&include_agents=true`; // Always fetch both, filter client side for responsiveness
            if (startDate) url += `&start_date=${startDate}T00:00:00`;
            if (endDate) url += `&end_date=${endDate}T23:59:59`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setLogs(await res.json());
            }
        };
        if (token) fetchLogs();
    }, [user, token, startDate, endDate]); // Remove includeAgents from dependency as we fetch all

    const setQuickFilter = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = (log.Actor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.Action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.Details || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSource = filterSource === 'All' ? true :
            filterSource === 'Agent' ? log.ActorType === 'Agent' :
                log.ActorType !== 'Agent'; // User/System

        return matchesSearch && matchesSource;
    });

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white font-sans animate-fade-in transition-colors">
            <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600 dark:from-teal-400 dark:to-emerald-500">
                        <ShieldCheck className="text-teal-500 dark:text-teal-400" />
                        Unified Audit Trail
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Timeline of Administrative actions and Agent security events.</p>
                </div>
                {/* Bandwidth Monitor [NEW] */}
                <div className="mb-2">
                    <BandwidthStatus agentId={filterSource === 'Agent' ? 'Global' : 'Global'} socket={null} />
                </div>
                <div className="flex items-center gap-4 w-full justify-end items-end">
                    <div className="flex items-center gap-4 items-end">
                        <select
                            value={filterSource}
                            onChange={(e) => setFilterSource(e.target.value as any)}
                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg px-2 py-2 shadow-sm focus:ring-teal-500 outline-none self-end"
                        >
                            <option value="All">All Sources</option>
                            <option value="Agent">Agent Events Only</option>
                            <option value="User">Portal Events Only</option>
                        </select>
                        {(startDate || endDate) && (
                            <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded uppercase inline-block self-end mb-1">
                                Showing: {startDate.split('-').reverse().join('-')} - {(endDate || '').split('-').reverse().join('-')}
                            </div>
                        )}
                    </div>

                    <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-300 dark:border-gray-700 shadow-sm items-center gap-1 self-end">
                        <div className="flex bg-gray-100 dark:bg-gray-900 rounded p-0.5 border border-gray-200 dark:border-gray-800 mr-2 shadow-inner">
                            <button onClick={() => setQuickFilter(1)} className="px-2 py-1 text-[10px] font-bold hover:bg-white dark:hover:bg-gray-800 rounded transition-all text-gray-600 dark:text-gray-400">24H</button>
                            <button onClick={() => setQuickFilter(7)} className="px-2 py-1 text-[10px] font-bold hover:bg-white dark:hover:bg-gray-800 rounded transition-all text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-800">7D</button>
                            <button onClick={() => setQuickFilter(30)} className="px-2 py-1 text-[10px] font-bold hover:bg-white dark:hover:bg-gray-800 rounded transition-all text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-800">30D</button>
                        </div>

                        <div className="flex items-center gap-1 text-gray-500 bg-gray-50 dark:bg-gray-900/50 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 shadow-inner">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-[11px] focus:ring-0 w-24 dark:text-gray-300 p-0"
                            />
                            <span className="text-gray-400 text-[10px]">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-[11px] focus:ring-0 w-24 dark:text-gray-300 p-0"
                            />
                            {(startDate || endDate) && (
                                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-[10px] text-teal-500 font-bold px-1 hover:underline ml-1">CLEAR</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search audit trail (Actor, Action, Details)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-gray-900 dark:text-white outline-none w-full shadow-sm transition-all"
                    />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                    Found {filteredLogs.length} Records
                </div>
            </div>


            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-200 uppercase font-bold text-xs">
                        <tr>
                            <th className="p-4 px-6">Timestamp</th>
                            <th className="p-4 px-6">Actor</th>
                            <th className="p-4 px-6">Event Type</th>
                            <th className="p-4 px-6">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredLogs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 px-6 flex items-center gap-2 font-mono text-gray-500">
                                    <Clock size={14} /> {new Date(log.Timestamp).toLocaleString()}
                                </td>
                                <td className="p-4 px-6">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white ${log.ActorType === 'Agent' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                                            {log.ActorType === 'Agent' ? <Monitor size={14} /> : <UserIcon size={14} />}
                                        </div>
                                        <div>
                                            <div className="text-gray-900 dark:text-white font-bold">{log.Actor}</div>
                                            <div className="text-[10px] uppercase font-bold text-gray-500">{log.ActorType || 'User'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 px-6">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${log.Action?.includes('STARTUP') || log.Action?.includes('Create') ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800' :
                                        log.Action?.includes('SHUTDOWN') || log.Action?.includes('Delete') ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' :
                                            log.Action?.includes('ERROR') || log.Action?.includes('BLOCKED') ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800' :
                                                'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                        }`}>
                                        {log.Action}
                                    </span>
                                </td>
                                <td className="p-4 px-6 text-gray-600 dark:text-gray-400 break-all">{log.Details}</td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-12 text-gray-500 italic">No audit records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
}
