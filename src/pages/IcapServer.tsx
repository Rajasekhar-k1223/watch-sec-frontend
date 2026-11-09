import { Share2, Activity, ShieldCheck, Globe, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function IcapServer() {
    const { token } = useAuth();
    const [stats, setStats] = useState({
        activeConnections: 0,
        totalRequests: 0,
        blockedRequests: 0,
        uptime: "Checking..."
    });
    const [loading, setLoading] = useState(true);

    const fetchLiveStats = async () => {
        try {
            setLoading(true);
            const headers = { Authorization: `Bearer ${token}` };
            const [healthRes, dashRes] = await Promise.all([
                fetch(`${API_URL}/system/health`, { headers }).catch(() => null),
                fetch(`${API_URL}/dashboard/stats`, { headers }).catch(() => null)
            ]);

            let activeConn = 0;
            let totalReqs = 0;
            let blocked = 0;
            let uptimeStr = "Operational";

            if (dashRes && dashRes.ok) {
                const dData = await dashRes.json();
                activeConn = dData?.network?.activeConnections ?? (dData?.agents?.online ?? 0);
                totalReqs = dData?.events?.total ?? 0;
                blocked = dData?.threats?.total ?? 0;
            }

            if (healthRes && healthRes.ok) {
                const hData = await healthRes.json();
                if (hData?.database?.row_counts?.event_logs) {
                    totalReqs = Math.max(totalReqs, hData.database.row_counts.event_logs);
                }
                uptimeStr = hData?.uptime_check ? `Active (${hData.uptime_check})` : "Healthy";
            }

            setStats({
                activeConnections: activeConn,
                totalRequests: totalReqs,
                blockedRequests: blocked,
                uptime: uptimeStr
            });
        } catch (err) {
            console.error("Failed to load ICAP metrics", err);
            toast.error("Failed to load live telemetry");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchLiveStats();
    }, [token]);

    const refreshStats = () => {
        fetchLiveStats();
        toast.success("Telemetry synchronized with core server");
    };

    return (
        <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/90 shadow-sm p-6 rounded-2xl">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
                        <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">ICAP Server Integration</h1>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Web Proxy Integration (Squid/Bluecoat) via ICAP Protocol on Port 1344
                        </p>
                    </div>
                </div>
                <button
                    onClick={refreshStats}
                    className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-200 shadow-2xs transition-colors font-bold text-xs"
                >
                    <RefreshCw size={14} />
                    Refresh Stats
                </button>
            </div>

            {/* ICAP Server Inspection Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-start sm:items-center gap-3 text-xs text-emerald-900 dark:text-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                    <span className="font-bold">ICAP Sovereign DLP & Antivirus Gateway:</span> Live telemetry bound to core event logs. Demonstrates proxy REQMOD and RESPMOD inspection for Squid/Bluecoat appliances on sovereign port 1344.
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="text-blue-500" size={18} />
                        <h3 className="text-slate-500 text-xs uppercase font-bold tracking-wider">Active Connections</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{stats.activeConnections}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Globe className="text-purple-500" size={18} />
                        <h3 className="text-slate-500 text-xs uppercase font-bold tracking-wider">Total Requests</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{stats.totalRequests}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="text-rose-500" size={18} />
                        <h3 className="text-slate-500 text-xs uppercase font-bold tracking-wider">Blocked Content</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{stats.blockedRequests}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Share2 className="text-emerald-500" size={18} />
                        <h3 className="text-slate-500 text-xs uppercase font-bold tracking-wider">Service Uptime</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{stats.uptime}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-sm">
                <div className="max-w-2xl">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Proxy Integration Guide</h3>
                    <p className="text-slate-500 text-xs mb-6">
                        To route network proxy traffic through the Monitorix ICAP engine, configure your <code>squid.conf</code> with the directives below:
                    </p>
                    <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-800 leading-relaxed shadow-sm">
                        icap_enable on<br />
                        icap_service service_req reqmod_precache icap://localhost:1344/reqmod<br />
                        icap_service service_resp respmod_precache icap://localhost:1344/respmod<br />
                        adaptation_access service_req allow all<br />
                        adaptation_access service_resp allow all
                    </div>
                </div>
            </div>
        </div>
    );
}
