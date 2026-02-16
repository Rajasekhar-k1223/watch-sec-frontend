import { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Shield, ExternalLink } from 'lucide-react';

interface VulnerabilityAlert {
    Id: number;
    AgentId: string;
    Type: string;
    Details: string;
    Timestamp: string;
}

interface AgentSecurityLedgerProps {
    agentId: string;
    apiUrl: string;
    token: string;
}

export default function AgentSecurityLedger({ agentId, apiUrl, token }: AgentSecurityLedgerProps) {
    const [alerts, setAlerts] = useState<VulnerabilityAlert[]>([]);
    const [loading, setLoading] = useState(true);

    const [triggering, setTriggering] = useState(false);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/vulnerabilities/alerts?agent_id=${agentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setAlerts(await res.json());
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
                import('react-hot-toast').then(t => t.default.success("Vulnerability scan triggered successfully."));
                // Auto-refresh after a delay
                setTimeout(fetchAlerts, 5000);
            } else {
                import('react-hot-toast').then(t => t.default.error("Failed to trigger scan."));
            }
        } catch (e) {
            console.error("Scan trigger error", e);
            import('react-hot-toast').then(t => t.default.error("Error triggering scan."));
        } finally {
            setTriggering(false);
        }
    };

    useEffect(() => {
        if (agentId && token) fetchAlerts();
    }, [agentId, token]);

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <ShieldAlert className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Security Audit Ledger</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Automated Intelligence Scan Results</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchAlerts}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-bold uppercase rounded-lg border border-gray-700 transition-all disabled:opacity-50"
                        title="Refresh detection list"
                    >
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        Refresh List
                    </button>
                    <button
                        onClick={triggerScan}
                        disabled={triggering}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase rounded-lg shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
                        title="Force fresh vulnerability scan"
                    >
                        {triggering ? <RefreshCw size={12} className="animate-spin" /> : <Shield size={12} />}
                        {triggering ? 'Triggering...' : 'Trigger New Scan'}
                    </button>
                </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-950 text-gray-500 uppercase font-bold tracking-wider">
                        <tr>
                            <th className="p-4 w-40">Detection Time</th>
                            <th className="p-4 w-32">Type</th>
                            <th className="p-4">Intelligence Details</th>
                            <th className="p-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {loading ? (
                            <tr><td colSpan={4} className="p-16 text-center text-gray-500 italic animate-pulse">Synchronizing with intelligence feed...</td></tr>
                        ) : alerts.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-16 text-center">
                                    <div className="flex flex-col items-center gap-3 opacity-40">
                                        <Shield size={32} className="text-emerald-500" />
                                        <p className="text-gray-400 italic">No significant vulnerabilities detected on this machine.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : alerts.map(alert => (
                            <tr key={alert.Id} className="hover:bg-gray-800/30 transition-colors">
                                <td className="p-4 text-gray-500 font-mono">
                                    {new Date(alert.Timestamp).toLocaleString()}
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 font-black text-[9px]">
                                        {alert.Type || 'VULN'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="bg-black/30 p-2.5 rounded border border-gray-700/50 text-gray-300 font-mono text-[11px] leading-relaxed">
                                        {alert.Details}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <button className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="View Intelligence Details">
                                        <ExternalLink size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                <Shield className="w-4 h-4 text-blue-500" />
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-tight">Enterprise Patch Intelligence is active. All system manifests are being correlated with global CVE databases.</p>
            </div>
        </div>
    );
}
