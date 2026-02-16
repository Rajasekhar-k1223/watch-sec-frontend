import { ShieldAlert, AlertCircle, Search, RefreshCw, Server, Shield, CheckCircle, Lock, Zap, Download, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

const PLAN_LEVELS: Record<string, number> = {
    "Starter": 1,
    "Professional": 2,
    "Pro": 2,
    "Enterprise": 3,
    "Unlimited": 100
};

const FEATURE_TIERS: Record<string, number> = {
    "vulnerabilities": 3
};

interface VulnerabilityAlert {
    Id: number;
    AgentId: string;
    Type: string;
    Details: string;
    Timestamp: string;
}

export default function Vulnerabilities() {
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const [alerts, setAlerts] = useState<VulnerabilityAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchAgent, setSearchAgent] = useState('');
    const [planLevel, setPlanLevel] = useState<number>(1);

    const [triggeringAll, setTriggeringAll] = useState(false);
    const [scanMap, setScanMap] = useState<Record<string, boolean>>({});

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

    const triggerGlobalScan = async () => {
        if (!window.confirm("Trigger vulnerability scans for ALL agents in your fleet?")) return;
        setTriggeringAll(true);
        try {
            const res = await fetch(`${API_URL}/vulnerabilities/scan-all`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                import('react-hot-toast').then(t => t.default.success("Global fleet scan triggered."));
                setTimeout(fetchAlerts, 5000);
            }
        } catch (e) { console.error(e); }
        finally { setTriggeringAll(false); }
    };

    const triggerAgentScan = async (agentId: string) => {
        setScanMap(prev => ({ ...prev, [agentId]: true }));
        try {
            const res = await fetch(`${API_URL}/vulnerabilities/scan/${agentId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                import('react-hot-toast').then(t => t.default.success(`Scan triggered for ${agentId}`));
                setTimeout(fetchAlerts, 5000);
            }
        } catch (e) { console.error(e); }
        finally { setScanMap(prev => ({ ...prev, [agentId]: false })); }
    };

    const handleExport = async () => {
        try {
            const res = await fetch(`${API_URL}/vulnerabilities/export/${searchAgent || 'all'}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `VulnerabilityReport_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (e) { console.error("Export error", e); }
    };

    useEffect(() => {
        if (!token) return;

        // Fetch Plan
        if (user?.tenantId) {
            fetch(`${API_URL}/tenants/${user.tenantId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    const p = data.Plan || "Starter";
                    setPlanLevel(PLAN_LEVELS[p] || 1);
                })
                .catch(e => console.error("Plan error", e));
        }

        fetchAlerts();
    }, [token, searchAgent, user?.tenantId]);

    const isLocked = planLevel < (FEATURE_TIERS["vulnerabilities"] || 3);

    return (
        <div className="p-8 animate-in fade-in duration-500 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors relative">
            {isLocked && (
                <div className="absolute inset-0 z-[60] bg-gray-950/95 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6">
                    <div className="p-8 bg-blue-500/10 rounded-3xl mb-8 ring-1 border border-blue-500/20 shadow-2xl shadow-blue-500/10">
                        <Lock className="w-20 h-20 text-blue-500" />
                    </div>
                    <h2 className="text-5xl font-black text-white mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-blue-400">Enterprise Intelligence</h2>
                    <p className="text-gray-400 max-w-lg mb-12 text-xl font-medium leading-relaxed">
                        Fleet-wide <b>Vulnerability Scanning</b> and <b>Threat Intelligence</b> are exclusive to our <b>Enterprise Plan</b>.
                    </p>
                    <button
                        onClick={() => window.location.hash = '#billing'}
                        className="px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-2xl shadow-blue-500/40 hover:shadow-blue-400/50 transition-all flex items-center gap-4 group text-xl"
                    >
                        <Zap className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                        Activate Enterprise Suite
                    </button>
                    <div className="mt-8 flex gap-6 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                        <span>CVE Tracking</span>
                        <span>•</span>
                        <span>Patch Management</span>
                        <span>•</span>
                        <span>Risk Scoring</span>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg">
                            <ShieldAlert className="text-red-600 dark:text-red-500 w-8 h-8" />
                        </div>
                        Vulnerability Intelligence
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">
                        Detected vulnerable software packages across the managed fleet.
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 items-center shadow-sm">
                        <Search className="text-gray-400 dark:text-gray-500 ml-2" size={16} />
                        <input
                            type="text"
                            placeholder="Search by Agent ID..."
                            className="bg-transparent text-gray-900 dark:text-white text-xs px-3 py-1 outline-none w-48 placeholder-gray-400"
                            value={searchAgent}
                            onChange={(e) => setSearchAgent(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={triggerGlobalScan}
                        disabled={triggeringAll || isLocked}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 font-bold disabled:opacity-50"
                    >
                        {triggeringAll ? <RefreshCw size={18} className="animate-spin" /> : <Shield size={18} />}
                        Scan All Fleet
                    </button>
                    <button
                        onClick={() => navigate('/fleet-inventory')}
                        disabled={isLocked}
                        className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-gray-200 dark:border-gray-700 shadow-sm font-medium disabled:opacity-50"
                        title="View whole fleet software inventory"
                    >
                        <Package size={18} />
                        Software Inventory
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={loading || isLocked}
                        className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-gray-200 dark:border-gray-700 shadow-sm font-medium disabled:opacity-50"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                    <button
                        onClick={fetchAlerts}
                        className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-gray-200 dark:border-gray-700 shadow-sm font-medium"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-xl dark:shadow-lg transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                            <Shield className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 px-2 py-1 rounded-full border border-blue-200 dark:border-blue-500/20">SCANNED</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{alerts.length}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Total Alerts</div>
                </div>

                <div className="bg-white dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-xl dark:shadow-lg transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                            <AlertCircle className="text-red-600 dark:text-red-400 w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 px-2 py-1 rounded-full border border-red-200 dark:border-red-500/20">CRITICAL</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {alerts.filter(a => a.Details.toLowerCase().includes('critical') || a.Details.toLowerCase().includes('high')).length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">High Risk Items</div>
                </div>

                <div className="bg-white dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-xl dark:shadow-lg transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                            <CheckCircle className="text-emerald-600 dark:text-emerald-400 w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">LATEST</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white truncate mb-1">
                        {alerts.length > 0 ? new Date(alerts[0].Timestamp).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Last Scan Date</div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl transition-colors">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agent ID</th>
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detection Details</th>
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan={4} className="p-12 text-center text-gray-500 dark:text-gray-400 animate-pulse">Retrieving vulnerability feed...</td></tr>
                        ) : alerts.map(alert => (
                            <tr key={alert.Id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                <td className="p-4 text-gray-600 dark:text-gray-500 font-mono text-xs whitespace-nowrap">
                                    {new Date(alert.Timestamp).toLocaleString()}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Server size={14} className="text-blue-500 dark:text-blue-400" />
                                        <span className="font-bold text-gray-900 dark:text-white">{alert.AgentId}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-2 py-1 rounded-md text-[10px] font-bold">
                                        VULNERABILITY
                                    </span>
                                </td>
                                <td className="p-4 text-gray-700 dark:text-gray-300">
                                    <div className="bg-gray-100 dark:bg-gray-900/50 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700/50 text-xs font-mono">
                                        {alert.Details}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => triggerAgentScan(alert.AgentId)}
                                        disabled={scanMap[alert.AgentId]}
                                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-500/20 group/btn"
                                        title="Trigger fresh scan"
                                    >
                                        <Zap size={14} className={scanMap[alert.AgentId] ? 'animate-pulse' : 'group-hover/btn:scale-125 transition-transform'} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && alerts.length === 0 && (
                    <div className="p-16 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center gap-4">
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <Shield size={48} className="opacity-20 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">No vulnerabilities detected</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Great job! Your selected scope appears to be secure.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
