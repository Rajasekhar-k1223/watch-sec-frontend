import { ShieldAlert, AlertCircle, Search, RefreshCw, Server, Shield, CheckCircle, Lock, Zap, Download, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

const PLAN_LEVELS: Record<string, number> = {
    "starter": 1,
    "professional": 2,
    "pro": 2,
    "enterprise": 3,
    "unlimited": 100
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
    const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
    const [alerts, setAlerts] = useState<VulnerabilityAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchAgent, setSearchAgent] = useState('');
    const [planLevel, setPlanLevel] = useState<number>(3);

    const [triggeringAll, setTriggeringAll] = useState(false);
    const [scanMap, setScanMap] = useState<Record<string, boolean>>({});

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const query = searchAgent ? `?agent_id=${searchAgent}` : '';
            const res = await fetch(`${API_URL}/vulnerabilities/alerts${query}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
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
                headers: { 'Authorization': `Bearer ${authToken}` }
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
                headers: { 'Authorization': `Bearer ${authToken}` }
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
                headers: { 'Authorization': `Bearer ${authToken}` }
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
        // Fetch Plan
        if (user?.tenantId && authToken) {
            fetch(`${API_URL}/tenants/${user.tenantId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
                .then(res => res.json())
                .then(data => {
                    const p = data.Plan || data.plan || "Starter";
                    setPlanLevel(PLAN_LEVELS[p.toLowerCase()] || 1);
                })
                .catch(e => console.error("Plan error", e));
        }

        fetchAlerts();
    }, [authToken, searchAgent, user?.tenantId]);

    const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin' || user?.role?.toLowerCase() === 'admin';
    const isLocked = !isSuperAdmin && planLevel < (FEATURE_TIERS["vulnerabilities"] || 3);

    return (
        <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6 relative">
            {isLocked && (
                <div className="absolute inset-0 z-[60] bg-slate-900/40 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-center p-6">
                    <div className="p-8 bg-white/95 rounded-3xl border border-slate-200 shadow-2xl flex flex-col items-center max-w-lg">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl mb-4 border border-blue-200">
                            <Lock className="w-12 h-12" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Enterprise Access Required</h2>
                        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                            Autonomous Vulnerability Orchestration and Threat Forensics are reserved for Enterprise Plan users.
                        </p>
                        <button
                            onClick={() => window.location.hash = '#billing'}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-xs uppercase tracking-wider"
                        >
                            <Zap className="w-4 h-4" /> Upgrade to Enterprise
                        </button>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200/90 shadow-sm p-6 rounded-2xl">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shadow-xs">
                        <ShieldAlert className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vulnerability Intelligence</h1>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Continuous forensic auditing of endpoint software stacks & live CVE cross-referencing
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2">
                        <Search className="text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Filter agent..."
                            className="bg-transparent text-slate-900 text-xs font-medium outline-none w-32 placeholder-slate-400"
                            value={searchAgent}
                            onChange={(e) => setSearchAgent(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={triggerGlobalScan}
                        disabled={triggeringAll || isLocked}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-blue-600/25 font-bold text-xs disabled:opacity-50"
                    >
                        {triggeringAll ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
                        Sync Fleet Scan
                    </button>
                    <button
                        onClick={() => navigate('/fleet-inventory')}
                        disabled={isLocked}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-bold text-xs disabled:opacity-50 shadow-2xs"
                    >
                        <Package size={14} /> Inventory
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={loading || isLocked}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-bold text-xs disabled:opacity-50 shadow-2xs"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Anomalies</div>
                        <div className="text-3xl font-black text-slate-900 mt-2">{alerts.length}</div>
                        <div className="text-[11px] text-blue-600 font-semibold mt-1">Fleet CVE Matches</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                        <Shield size={22} />
                    </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Exposures</div>
                        <div className="text-3xl font-black text-rose-600 mt-2">
                            {alerts.filter(a => a.Details?.toLowerCase().includes('critical') || a.Details?.toLowerCase().includes('high')).length}
                        </div>
                        <div className="text-[11px] text-rose-600 font-semibold mt-1">Immediate Action Required</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                        <AlertCircle size={22} />
                    </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sync Status</div>
                        <div className="text-lg font-bold text-slate-900 mt-2 truncate">
                            {alerts.length > 0 ? new Date(alerts[0].Timestamp).toLocaleDateString() : 'REAL-TIME'}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-semibold mt-1">Global Intelligence Active</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                        <CheckCircle size={22} />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Agent Identity</th>
                                <th className="p-4">Risk Category</th>
                                <th className="p-4">Forensic Details</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <RefreshCw size={24} className="animate-spin mx-auto text-blue-500 mb-2" />
                                        Retrieving vulnerability feed...
                                    </td>
                                </tr>
                            ) : alerts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <Shield size={36} className="mx-auto text-slate-300 mb-2" />
                                        <p className="font-bold text-slate-700">No vulnerabilities detected</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Your endpoint scope appears fully patched and secure.</p>
                                    </td>
                                </tr>
                            ) : alerts.map(alert => (
                                <tr key={alert.Id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="p-4 text-slate-500 font-mono whitespace-nowrap">
                                        {new Date(alert.Timestamp).toLocaleString()}
                                    </td>
                                    <td className="p-4 font-bold text-slate-900">
                                        <div className="flex items-center gap-2">
                                            <Server size={14} className="text-blue-500" />
                                            <span>{alert.AgentId}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                            VULNERABILITY
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-700">
                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 font-mono text-[11px] leading-relaxed">
                                            {alert.Details}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => triggerAgentScan(alert.AgentId)}
                                            disabled={scanMap[alert.AgentId]}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                            title="Trigger fresh agent scan"
                                        >
                                            <Zap size={14} className={scanMap[alert.AgentId] ? 'animate-pulse' : ''} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
