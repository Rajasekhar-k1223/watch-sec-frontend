import { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, Server, AlertCircle, ShieldCheck } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

interface SoftwareItem {
    Name: string;
    InstalledVersion: string;
    AgentCount: number;
    Agents: string[];
}

export default function FleetInventory() {
    const { token } = useAuth();
    const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
    const [inventory, setInventory] = useState<SoftwareItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/vulnerabilities/fleet-software`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInventory(data.software || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authToken) fetchInventory();
    }, [authToken]);

    const filtered = inventory.filter(item =>
        item.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.InstalledVersion && item.InstalledVersion.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200/90 shadow-sm p-6 rounded-2xl">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fleet Software Inventory</h1>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Consolidated software landscape and installed packages across all active endpoints
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex min-w-[220px] bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 items-center">
                        <Search className="text-slate-400 mr-2 shrink-0" size={14} />
                        <input
                            type="text"
                            placeholder="Filter software name..."
                            className="bg-transparent text-slate-900 text-xs outline-none w-full placeholder-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchInventory}
                        className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors border border-slate-200 shadow-2xs font-bold text-xs"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="p-4">Software Name</th>
                                <th className="p-4">Version</th>
                                <th className="p-4 text-center">Installations</th>
                                <th className="p-4">Audit Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-12 text-center text-slate-400">Scanning fleet inventory...</td></tr>
                            ) : filtered.map((item, idx) => (
                                <tr key={`${item.Name}-${item.InstalledVersion}-${idx}`} className="hover:bg-slate-50/60 transition-colors group">
                                    <td className="p-4">
                                        <span className="font-bold text-slate-900">{item.Name}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-slate-500 font-mono">{item.InstalledVersion}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                                            <Server size={11} />
                                            {item.AgentCount} Nodes
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {item.Name.toLowerCase().includes('google chrome') || item.Name.toLowerCase().includes('java') ? (
                                            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
                                                <AlertCircle size={14} />
                                                Needs Audit
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                                                <ShieldCheck size={14} />
                                                Verified
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && filtered.length === 0 && (
                    <div className="p-16 text-center text-slate-400">
                        <Package size={42} className="mx-auto opacity-30 mb-2" />
                        <p className="font-bold text-slate-700">No software matching your search</p>
                    </div>
                )}
            </div>
        </div>
    );
}
