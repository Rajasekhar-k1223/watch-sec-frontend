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
                    const p = data.Plan || data.plan || "Starter";
                    setPlanLevel(PLAN_LEVELS[p.toLowerCase()] || 1);
                })
                .catch(e => console.error("Plan error", e));
        }

        fetchAlerts();
    }, [token, searchAgent, user?.tenantId]);

    const isLocked = planLevel < (FEATURE_TIERS["vulnerabilities"] || 3);

    return (
        <div className="p-8 animate-in fade-in duration-700 min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors relative">
            {isLocked && (
                <div className="absolute inset-0 z-[60] bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center text-center p-6">
                    <div className="p-10 bg-blue-500/10 rounded-[3rem] mb-10 ring-1 border border-blue-500/20 shadow-2xl shadow-blue-500/20 animate-pulse-slow">
                        <Lock className="w-24 h-24 text-blue-500" />
                    </div>
                    <h2 className="text-6xl font-black text-white mb-6 tracking-tighter">
                        <span className="text-gradient">Monitorix Intelligence</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mb-14 text-2xl font-medium leading-tight tracking-tight">
                        Autonomous <b>Vulnerability Orchestration</b> and <b>Threat Forensics</b> are locked for this identity tier.
                    </p>
                    <button
                        onClick={() => window.location.hash = '#billing'}
                        className="px-16 py-6 bg-white text-slate-950 font-black rounded-3xl shadow-2xl shadow-blue-500/40 hover:scale-105 transition-all flex items-center gap-6 group text-xs uppercase tracking-[0.3em]"
                    >
                        <Zap className="w-6 h-6 group-hover:rotate-12 transition-transform text-blue-600" />
                        Authorize Enterprise Suite
                    </button>
                    <div className="mt-12 flex gap-8 text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] opacity-50">
                        <span>CVE Correlation</span>
                        <span>•</span>
                        <span>Autonomous Patching</span>
                        <span>•</span>
                        <span>Zero-Day Guard</span>
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                         <div className="p-1.5 bg-red-500/20 rounded-lg text-red-500 ring-1 ring-red-500/30">
                            <ShieldAlert size={18} />
                         </div>
                         <span className="text-[10px] font-black tracking-[0.2em] uppercase text-red-500/80">Threat Surface Audit</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                        <span className="text-gradient">Vulnerability Intel</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-3 font-medium max-w-xl leading-relaxed">
                        Continuous forensic auditing of endpoint software stacks. Cross-referencing fleet inventory against global CVE repositories in real-time.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="glass px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <Search className="text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="OPERATOR SEARCH..."
                            className="bg-transparent text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest outline-none w-40 placeholder-slate-500"
                            value={searchAgent}
                            onChange={(e) => setSearchAgent(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={triggerGlobalScan}
                        disabled={triggeringAll || isLocked}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl flex items-center gap-3 transition-all shadow-xl shadow-blue-500/10 font-black text-[10px] uppercase tracking-widest disabled:opacity-50 active:scale-95"
                    >
                        {triggeringAll ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
                        Sync Fleet Scan
                    </button>
                    <button
                        onClick={() => navigate('/fleet-inventory')}
                        disabled={isLocked}
                        className="glass px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-50 active:scale-95"
                    >
                        <Package size={14} /> Inventory
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={loading || isLocked}
                        className="glass px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-50 active:scale-95"
                    >
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="glass-card p-8 relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 ring-1 ring-blue-500/20">
                            <Shield size={24} />
                        </div>
                        <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 tracking-widest uppercase">Validated</span>
                    </div>
                    <div className="text-5xl font-black text-slate-900 dark:text-white mb-2 leading-none">{alerts.length}</div>
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Total Anomalies</div>
                </div>

                <div className="glass-card p-8 relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 ring-1 ring-red-500/20">
                            <AlertCircle size={24} />
                        </div>
                        <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 tracking-widest uppercase">High Risk</span>
                    </div>
                    <div className="text-5xl font-black text-slate-900 dark:text-white mb-2 leading-none">
                        {alerts.filter(a => a.Details.toLowerCase().includes('critical') || a.Details.toLowerCase().includes('high')).length}
                    </div>
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Critical Exposures</div>
                </div>

                <div className="glass-card p-8 relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 ring-1 ring-emerald-500/20">
                            <CheckCircle size={24} />
                        </div>
                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 tracking-widest uppercase">Sync Status</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-none truncate">
                        {alerts.length > 0 ? new Date(alerts[0].Timestamp).toLocaleDateString() : 'REAL-TIME'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Last Intelligence Pulse</div>
                </div>
            </div>

            <div className="glass-card overflow-hidden shadow-2xl transition-colors">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Timestamp</th>
                            <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Agent Identity</th>
                            <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Risk Category</th>
                            <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Forensic Details</th>
                            <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Actions</th>
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
