import { useState, useEffect } from 'react';
import { Package, Search, AppWindow, HardDrive, RefreshCw, Zap, ShieldAlert, CheckCircle, ArrowUpCircle, Download } from 'lucide-react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

interface SoftwareItem {
    Name: string;
    Version: string;
    Publisher?: string;
    InstallDate?: string;
    Type?: string;
    LastSeen?: string;
    Severity?: string;
    HasPatchAvailable?: boolean;
    LatestVersion?: string;
}

interface Props {
    agentId: string;
    apiUrl: string;
    token: string;
}

export default function AgentAppsList({ agentId, apiUrl, token }: Props) {
    const [apps, setApps] = useState<SoftwareItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [patching, setPatching] = useState<string | null>(null);

    const fetchApps = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/agents/${agentId}/software`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setApps(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePatch = async (softwareName: string) => {
        setPatching(softwareName);
        try {
            await fetch(`${apiUrl}/agents/${agentId}/software/patch`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ SoftwareName: softwareName })
            });
            // optimistic feedback, socket will refresh the list later
            setTimeout(() => setPatching(null), 3000);
        } catch (e) {
            console.error(e);
            setPatching(null);
        }
    };

    useEffect(() => {
        if (agentId && token) fetchApps();

        const socket = io(SOCKET_URL, {
            transports: ['polling', 'websocket']
        });

        socket.on("connect", () => {
            // Join agent room to receive updates
            socket.emit("join_room", { room: agentId });
        });

        socket.on("agent_software_update", () => {
            fetchApps();
        });

        return () => {
            socket.disconnect();
        };
    }, [agentId, token]);

    const filtered = apps.filter(a => 
        a.Name.toLowerCase().includes(search.toLowerCase()) || 
        (a.Publisher && a.Publisher.toLowerCase().includes(search.toLowerCase())) ||
        (a.Severity && a.Severity.toLowerCase().includes(search.toLowerCase()))
    );

    const getSeverityColor = (severity?: string) => {
        switch(severity) {
            case 'Critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'High': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'Medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
            case 'Low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        }
    };

    const handleDownload = () => {
        const csvRows = [];
        csvRows.push(['Software', 'Version', 'Type', 'Severity', 'Latest Version', 'Last Seen', 'Has Patch']);
        for (const app of filtered) {
            csvRows.push([
                `"${(app.Name || '').replace(/"/g, '""')}"`,
                `"${(app.Version || '').replace(/"/g, '""')}"`,
                `"${app.Type || 'OS'}"`,
                `"${app.Severity || 'None'}"`,
                `"${app.LatestVersion || ''}"`,
                `"${app.LastSeen ? new Date(app.LastSeen).toLocaleString() : ''}"`,
                `"${app.HasPatchAvailable ? 'Yes' : 'No'}"`
            ].join(','));
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `software_inventory_${agentId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col gap-4 h-full animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <AppWindow className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-sm md:text-lg font-bold text-gray-900 dark:text-white tracking-tight">Software Inventory & Patching</h3>
                        <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{apps.length} Applications Installed</p>
                    </div>
                </div>

                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Filter by name or severity..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-400"
                        />
                    </div>
                    <button
                        onClick={handleDownload}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
                        title="Download CSV"
                    >
                        <Download size={16} />
                        <span className="hidden md:inline text-xs font-bold uppercase">Export</span>
                    </button>
                    <button
                        onClick={fetchApps}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
                        title="Refresh Inventory"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden md:inline text-xs font-bold uppercase">Refresh</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="overflow-auto flex-1 p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <RefreshCw size={24} className="animate-spin text-blue-500" />
                            <span className="text-gray-500 text-sm font-mono animate-pulse">Syncing application manifests...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-50">
                            <HardDrive size={48} className="text-gray-400" />
                            <span className="text-gray-500 font-sans">No applications found matching '{search}'.</span>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300 relative">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase font-bold text-gray-500 dark:text-gray-400 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3">Software</th>
                                        <th className="px-4 py-3">Version Details</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 overflow-y-auto">
                                    {filtered.map((app, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="mt-0.5 flex-shrink-0">
                                                        {app.Type === 'Python' ? (
                                                            <div className="p-1.5 bg-emerald-500/10 rounded">
                                                                <Zap className="w-4 h-4 text-emerald-500" />
                                                            </div>
                                                        ) : (
                                                            <div className="p-1.5 bg-blue-500/10 rounded">
                                                                <Package className="w-4 h-4 text-blue-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                            {app.Name}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {app.Severity && app.Severity !== 'None' && (
                                                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${getSeverityColor(app.Severity)} flex items-center gap-1`}>
                                                                    <ShieldAlert size={10} />
                                                                    {app.Severity}
                                                                </span>
                                                            )}
                                                            {(!app.Severity || app.Severity === 'None') && (
                                                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1">
                                                                    <CheckCircle size={10} />
                                                                    Secure
                                                                </span>
                                                            )}
                                                            <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                                                                app.Type === 'Python' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                                                            }`}>
                                                                {app.Type || 'OS'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-mono bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                                                        v{app.Version}
                                                    </span>
                                                    {app.LatestVersion && (
                                                        <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-500/20">
                                                            → v{app.LatestVersion}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 justify-end">
                                                    <div className="text-[10px] font-mono text-gray-400 hidden lg:block whitespace-nowrap">
                                                        Seen: {app.LastSeen ? new Date(app.LastSeen).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                    {app.HasPatchAvailable ? (
                                                        <button 
                                                            onClick={() => handlePatch(app.Name)}
                                                            disabled={patching === app.Name}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all
                                                                ${patching === app.Name 
                                                                    ? 'bg-amber-500/20 text-amber-500 cursor-wait' 
                                                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-95'}`}
                                                        >
                                                            {patching === app.Name ? (
                                                                <><RefreshCw size={14} className="animate-spin" /> Patching...</>
                                                            ) : (
                                                                <><ArrowUpCircle size={14} /> Patch Now</>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <div className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 opacity-50 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-not-allowed">
                                                            <CheckCircle size={14} /> Up to date
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                    )}
                </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 p-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 tracking-tight">
                Patch commands execute silently in the background on the remote agent. Changes will reflect automatically upon next sync.
            </div>
        </div>
    );
}
