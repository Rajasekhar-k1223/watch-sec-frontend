import { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, Server, AlertCircle, ShieldCheck } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

interface SoftwareItem {
    Name: string;
    Version: string;
    AgentCount: number;
    Agents: string[];
}

export default function FleetInventory() {
    const { token } = useAuth();
    const [inventory, setInventory] = useState<SoftwareItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/vulnerabilities/fleet-software`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setInventory(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchInventory();
    }, [token]);

    const filtered = inventory.filter(item =>
        item.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Version.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 animate-in fade-in duration-500 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                            <Package className="text-blue-600 dark:text-blue-500 w-8 h-8" />
                        </div>
                        Fleet Software Inventory
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">
                        Consolidated software landscape across all active agents.
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 items-center shadow-sm">
                        <Search className="text-gray-400 dark:text-gray-500 ml-2" size={16} />
                        <input
                            type="text"
                            placeholder="Filter software..."
                            className="bg-transparent text-gray-900 dark:text-white text-xs px-3 py-1 outline-none w-64 placeholder-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchInventory}
                        className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-gray-200 dark:border-gray-700 shadow-sm font-medium"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Software Name</th>
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Version</th>
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Installations</th>
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Risk Level</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan={4} className="p-12 text-center text-gray-500 dark:text-gray-400 animate-pulse">Scanning fleet inventory...</td></tr>
                        ) : filtered.map((item, idx) => (
                            <tr key={`${item.Name}-${item.Version}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                <td className="p-4">
                                    <span className="font-bold text-gray-900 dark:text-white">{item.Name}</span>
                                </td>
                                <td className="p-4">
                                    <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">{item.Version}</span>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
                                        <Server size={12} />
                                        {item.AgentCount} Agents
                                    </div>
                                </td>
                                <td className="p-4">
                                    {item.Name.toLowerCase().includes('google chrome') || item.Name.toLowerCase().includes('java') ? (
                                        <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                                            <AlertCircle size={14} />
                                            Needs Audit
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                                            <ShieldCheck size={14} />
                                            Verified
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && filtered.length === 0 && (
                    <div className="p-16 text-center text-gray-500 dark:text-gray-400">
                        <Package size={48} className="mx-auto opacity-20 mb-4" />
                        <p className="font-bold text-gray-900 dark:text-white">No software matching your search</p>
                    </div>
                )}
            </div>
        </div>
    );
}
