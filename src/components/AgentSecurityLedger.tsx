import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Package, RefreshCw, Activity, ArrowUpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface VulnerabilityAlert {
    Id: number;
    AgentId: string;
    Type: string;
    Details: string;
    Timestamp: string;
    Severity: string;
}

interface SoftwarePackage {
    Name: string;
    InstalledVersion: string;
    LatestVersion: string;
    UpdateStatus: string;
    IsVulnerable: boolean;
    VulnerabilityCount: number;
    Severity: string;
    FileVersion?: string;
    ProductVersion?: string;
}

interface AgentSecurityLedgerProps {
    agentId: string;
    apiUrl: string;
    token: string;
}

export default function AgentSecurityLedger({ agentId, apiUrl, token }: AgentSecurityLedgerProps) {
    const [alerts, setAlerts] = useState<VulnerabilityAlert[]>([]);
    const [software, setSoftware] = useState<SoftwarePackage[]>([]);
    const [vulnerabilityScore, setVulnerabilityScore] = useState<number>(100);
    const [deductions, setDeductions] = useState<{points: number, reason: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);
    const [patching, setPatching] = useState<string | null>(null);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/vulnerabilities/alerts?agent_id=${agentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setAlerts(await res.json());

            const swRes = await fetch(`${apiUrl}/vulnerabilities/software-audit/${agentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (swRes.ok) {
                const data = await swRes.json();
                setSoftware(data.Software || []);
                setVulnerabilityScore(data.VulnerabilityScore ?? 100);
                setDeductions(data.Deductions || []);
            }
        } catch (e) {
            console.error("Failed to fetch agent security alerts", e);
        } finally {
            setLoading(false);
        }
    };

    const triggerScan = async () => {
        setTriggering(true);
        try {
            const res = await fetch(`${apiUrl}/vulnerabilities/scan/${agentId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Vulnerability scan triggered successfully.");
                setTimeout(fetchAlerts, 5000);
            } else {
                toast.error("Failed to trigger scan.");
            }
        } catch (e) {
            toast.error("Error triggering scan.");
        } finally {
            setTriggering(false);
        }
    };

    const triggerPatch = async (pkgName?: string) => {
        setPatching(pkgName || 'all');
        try {
            const url = pkgName 
                ? `${apiUrl}/vulnerabilities/patch/${agentId}?package=${encodeURIComponent(pkgName)}` 
                : `${apiUrl}/vulnerabilities/patch/${agentId}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success(`Patch command dispatched for ${pkgName || 'all software'}.`);
                setTimeout(fetchAlerts, 10000); // Give it time to patch
            } else {
                toast.error("Failed to dispatch patch.");
            }
        } catch (e) {
            toast.error("Error dispatching patch.");
        } finally {
            setPatching(null);
        }
    };

    useEffect(() => {
        if (agentId && token) fetchAlerts();
    }, [agentId, token]);

    // Determine score color
    const scoreColor = vulnerabilityScore >= 90 ? 'text-emerald-500' : 
                       vulnerabilityScore >= 70 ? 'text-yellow-500' : 
                       'text-red-500';
    const scoreBg = vulnerabilityScore >= 90 ? 'bg-emerald-500/10' : 
                    vulnerabilityScore >= 70 ? 'bg-yellow-500/10' : 
                    'bg-red-500/10';
    const scoreBorder = vulnerabilityScore >= 90 ? 'border-emerald-500/20' : 
                        vulnerabilityScore >= 70 ? 'border-yellow-500/20' : 
                        'border-red-500/20';

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <ShieldAlert className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-sm md:text-lg font-bold text-gray-900 dark:text-white tracking-tight">Security Audit Ledger</h3>
                        <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Automated Intelligence Scan Results</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={fetchAlerts}
                        disabled={loading}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold uppercase rounded-lg border border-gray-200 dark:border-gray-700 transition-all disabled:opacity-50"
                        title="Refresh detection list"
                    >
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button 
                        onClick={() => triggerPatch()}
                        disabled={patching === 'all'}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                        {patching === 'all' ? <RefreshCw size={12} className="animate-spin" /> : <ArrowUpCircle size={12} />}
                        Patch All
                    </button>
                    <button
                        onClick={triggerScan}
                        disabled={triggering}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-lg shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50"
                        title="Force fresh vulnerability scan"
                    >
                        {triggering ? <RefreshCw size={12} className="animate-spin" /> : <Shield size={12} />}
                        New Scan
                    </button>
                </div>
            </div>

            {/* Score Dashboard */}
            <div className={`rounded-xl border ${scoreBorder} ${scoreBg} p-6 flex flex-col md:flex-row items-center gap-8 shadow-2xl`}>
                <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="relative flex items-center justify-center w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-gray-200 dark:text-gray-700 stroke-current"
                                strokeWidth="3"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className={`${scoreColor} stroke-current drop-shadow-md`}
                                strokeWidth="3"
                                strokeDasharray={`${vulnerabilityScore}, 100`}
                                strokeLinecap="round"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className={`text-4xl font-black ${scoreColor}`}>{vulnerabilityScore}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Score</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 w-full">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Activity size={16} className={scoreColor} />
                        Score Impacts
                    </h4>
                    {deductions.length === 0 ? (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                            ✓ System is fully secured. No known vulnerabilities detected.
                        </div>
                    ) : (
                        <ul className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                            {deductions.map((deduction, idx) => (
                                <li key={idx} className="flex items-start gap-3 bg-white/50 dark:bg-black/20 p-2.5 rounded border border-gray-200 dark:border-gray-800">
                                    <span className="shrink-0 px-2 py-0.5 rounded bg-red-500/20 text-red-500 font-black text-[10px]">
                                        {deduction.points}
                                    </span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400 font-mono leading-tight">
                                        {deduction.reason}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Alerts Table */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4 w-40">Detection Time</th>
                                <th className="p-4 w-32">Type</th>
                                <th className="p-4">Intelligence Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={3} className="p-16 text-center text-gray-500 italic animate-pulse">Synchronizing with intelligence feed...</td></tr>
                            ) : alerts.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-40">
                                            <Shield size={32} className="text-emerald-500" />
                                            <p className="text-gray-400 italic">No significant vulnerabilities detected on this machine.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : alerts.map(alert => (
                                <tr key={alert.Id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="p-4 text-gray-500 font-mono">
                                        {new Date(alert.Timestamp).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 font-black text-[9px]">
                                            {alert.Type || 'VULN'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="bg-gray-50 dark:bg-black/30 p-2.5 rounded border border-gray-200 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 font-mono text-[11px] leading-relaxed">
                                            {alert.Details}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SBOM Table */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl">
                <div className="bg-gray-50 dark:bg-gray-950 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Software Bill of Materials (SBOM)</h4>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">
                        {software.length} PACKAGES
                    </span>
                </div>
                <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
                    <table className="w-full text-left text-xs relative">
                        <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 uppercase font-bold tracking-wider sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4">Software Name</th>
                                <th className="p-4">Version</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">CVEs</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {loading && software.length === 0 ? (
                                <tr><td colSpan={5} className="p-16 text-center text-gray-500 italic animate-pulse">Loading software inventory...</td></tr>
                            ) : software.length === 0 ? (
                                <tr><td colSpan={5} className="p-16 text-center text-gray-500">No software inventory found.</td></tr>
                            ) : software.map((pkg, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                    <td className="p-4 font-bold text-gray-700 dark:text-gray-300 max-w-xs truncate" title={pkg.Name}>
                                        {pkg.Name}
                                    </td>
                                    <td className="p-4 font-mono text-gray-500">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[10px] uppercase font-bold text-gray-400">File: <span className="text-xs font-mono text-gray-500">{pkg.FileVersion || pkg.InstalledVersion || 'Unknown'}</span></span>
                                            <span className="text-[10px] uppercase font-bold text-gray-400">Product: <span className="text-xs font-mono text-gray-500">{pkg.ProductVersion || pkg.InstalledVersion || 'Unknown'}</span></span>
                                            {pkg.UpdateStatus === "Update Available" && (
                                                <span className="text-[9px] text-emerald-500 font-bold mt-1">→ PATCH TO: {pkg.LatestVersion}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {pkg.IsVulnerable ? (
                                            <span className={`px-2 py-1 rounded font-black text-[9px] ${pkg.Severity === 'Critical' ? 'bg-red-500/20 text-red-500' : pkg.Severity === 'High' ? 'bg-orange-500/20 text-orange-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                {pkg.Severity} VULN
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 font-black text-[9px]">SECURE</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center font-mono font-bold text-gray-500">
                                        {pkg.VulnerabilityCount > 0 ? (
                                            <span className="text-red-500">{pkg.VulnerabilityCount}</span>
                                        ) : (
                                            "0"
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        {pkg.UpdateStatus === "Update Available" && (
                                            <button 
                                                onClick={() => triggerPatch(pkg.Name)}
                                                disabled={patching === pkg.Name}
                                                className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold uppercase transition-all disabled:opacity-50 flex items-center gap-1 ml-auto"
                                            >
                                                {patching === pkg.Name ? <RefreshCw size={10} className="animate-spin" /> : <ArrowUpCircle size={10} />}
                                                Update
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                <Shield className="w-4 h-4 text-blue-500" />
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tight">Enterprise Patch Intelligence is active. All system manifests are being correlated with global CVE databases.</p>
            </div>
        </div>
    );
}
