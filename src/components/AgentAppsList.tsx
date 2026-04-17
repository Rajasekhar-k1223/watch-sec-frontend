import { useState, useEffect } from 'react';
import { Package, Search, AppWindow, HardDrive, RefreshCw } from 'lucide-react';

interface SoftwareItem {
    Name: string;
    Version: string;
    Publisher?: string;
    InstallDate?: string;
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

    useEffect(() => {
        if (agentId && token) fetchApps();
    }, [agentId, token]);

    const filtered = apps.filter(a => 
        a.Name.toLowerCase().includes(search.toLowerCase()) || 
        (a.Publisher && a.Publisher.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="flex flex-col gap-4 h-full animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <AppWindow className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-sm md:text-lg font-bold text-gray-900 dark:text-white tracking-tight">Software Inventory</h3>
                        <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{apps.length} Applications Installed</p>
                    </div>
                </div>

                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Filter applications..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={fetchApps}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center"
                        title="Refresh Inventory"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden flex-1 flex flex-col">
                <div className="overflow-y-auto flex-1 p-0">
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
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filtered.map((app, i) => (
                                <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                            <Package className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white text-sm">{app.Name}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-500/20">
                                                    v{app.Version}
                                                </span>
                                                {app.Publisher && <span className="text-[10px] text-gray-500 truncate max-w-[150px]">{app.Publisher}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {app.InstallDate && (
                                        <div className="text-[10px] font-mono text-gray-400">
                                            {app.InstallDate}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 tracking-tight">
                Read-Only Mode active. Active App Blocking features require a Professional license update.
            </div>
        </div>
    );
}
