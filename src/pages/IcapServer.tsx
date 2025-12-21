import { Share2, Activity, ShieldCheck, Globe, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function IcapServer() {
    // Simulated Stats (Since we don't persist ICAP logs yet)
    const [stats, setStats] = useState({
        activeConnections: 0,
        totalRequests: 1245,
        blockedRequests: 42,
        uptime: "2d 4h 12m"
    });

    const refreshStats = () => {
        // Simulate live updates
        setStats(prev => ({
            ...prev,
            activeConnections: Math.floor(Math.random() * 5),
            totalRequests: prev.totalRequests + Math.floor(Math.random() * 10),
            blockedRequests: prev.blockedRequests + (Math.random() > 0.8 ? 1 : 0)
        }));
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Share2 className="text-green-500" />
                        ICAP Server
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Web Proxy Integration (Squid/Bluecoat) via ICAP Protocol (Port 1344).
                    </p>
                </div>
                <button
                    onClick={refreshStats}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <RefreshCw size={18} />
                    Refresh Stats
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="text-blue-400" size={20} />
                        <h3 className="text-gray-400 text-sm uppercase font-bold">Active Connections</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.activeConnections}</p>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Globe className="text-purple-400" size={20} />
                        <h3 className="text-gray-400 text-sm uppercase font-bold">Total Requests</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalRequests}</p>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="text-red-400" size={20} />
                        <h3 className="text-gray-400 text-sm uppercase font-bold">Blocked Content</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.blockedRequests}</p>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Share2 className="text-green-400" size={20} />
                        <h3 className="text-gray-400 text-sm uppercase font-bold">Service Uptime</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.uptime}</p>
                </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
                <div className="max-w-2xl mx-auto">
                    <h3 className="text-xl font-bold text-white mb-4">Configuration Guide</h3>
                    <p className="text-gray-400 mb-6">
                        To integrate with your existing proxy (e.g., Squid), add the following configuration to your <code>squid.conf</code>:
                    </p>
                    <div className="bg-gray-900 rounded-lg p-4 text-left font-mono text-sm text-green-400 overflow-x-auto border border-gray-700">
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
