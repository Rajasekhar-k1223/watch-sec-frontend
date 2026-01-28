import { ShieldAlert, AlertCircle, Search, RefreshCw, Server, Shield, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

interface VulnerabilityAlert {
    Id: number;
    AgentId: string;
    Type: string;
    Details: string;
    Timestamp: string;
}

export default function Vulnerabilities() {
    const { token } = useAuth();
    const [alerts, setAlerts] = useState<VulnerabilityAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchAgent, setSearchAgent] = useState('');

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const query = searchAgent ? `?agent_id=${searchAgent}` : '';
            const res = await fetch(`${API_URL}/vulnerabilities/alerts${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setAlerts(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchAlerts();
    }, [token, searchAgent]);

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <ShieldAlert className="text-red-500 w-8 h-8" />
                        Vulnerability Intelligence
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Detected vulnerable software packages across the managed fleet.
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700 items-center">
                        <Search className="text-gray-500 ml-2" size={16} />
                        <input
                            type="text"
                            placeholder="Search by Agent ID..."
                            className="bg-transparent text-white text-xs px-3 py-1 outline-none w-48"
                            value={searchAgent}
                            onChange={(e) => setSearchAgent(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchAlerts}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-gray-600"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700 p-6 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-start mb-2">
                        <Shield className="text-blue-400 w-5 h-5" />
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">SCANNED</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{alerts.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">Total Alerts</div>
                </div>

                <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700 p-6 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-start mb-2">
                        <AlertCircle className="text-red-400 w-5 h-5" />
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">CRITICAL</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {alerts.filter(a => a.Details.toLowerCase().includes('critical') || a.Details.toLowerCase().includes('high')).length}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">High Risk Items</div>
                </div>

                <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700 p-6 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-start mb-2">
                        <CheckCircle className="text-emerald-400 w-5 h-5" />
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">LATEST</span>
                    </div>
                    <div className="text-sm font-bold text-white truncate">
                        {alerts.length > 0 ? new Date(alerts[0].Timestamp).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">Last Scan Date</div>
                </div>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900/80 text-gray-400 uppercase text-[10px] font-bold tracking-widest">
                        <tr>
                            <th className="p-4 border-b border-gray-700">Timestamp</th>
                            <th className="p-4 border-b border-gray-700">Agent ID</th>
                            <th className="p-4 border-b border-gray-700">Type</th>
                            <th className="p-4 border-b border-gray-700">Detection Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {loading ? (
                            <tr><td colSpan={4} className="p-12 text-center text-gray-500">Retrieving vulnerability feed...</td></tr>
                        ) : alerts.map(alert => (
                            <tr key={alert.Id} className="hover:bg-gray-700/30 transition-colors group">
                                <td className="p-4 text-gray-500 font-mono text-xs">
                                    {new Date(alert.Timestamp).toLocaleString()}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Server size={14} className="text-blue-400" />
                                        <span className="font-bold text-white">{alert.AgentId}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                        VULNERABILITY
                                    </span>
                                </td>
                                <td className="p-4 text-gray-300">
                                    <div className="bg-gray-900/50 p-2 rounded border border-gray-700/50 text-xs">
                                        {alert.Details}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && alerts.length === 0 && (
                    <div className="p-16 text-center text-gray-500 flex flex-col items-center gap-4">
                        <Shield size={48} className="opacity-10" />
                        <p className="text-lg font-medium">No vulnerabilities detected in the selected scope.</p>
                        <p className="text-sm">Scan results will appear here once heartbeats are processed.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
