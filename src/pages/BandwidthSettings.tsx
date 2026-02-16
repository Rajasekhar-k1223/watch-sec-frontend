import { useState, useEffect } from 'react';
import { Save, Pause, Play, Activity, Clock, Shield, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export default function BandwidthSettings() {
    const { user, token } = useAuth();
    const [config, setConfig] = useState({
        max_rate_kbps: 0,
        business_hours: {
            enabled: false,
            start: "09:00",
            end: "17:00",
            throttle_percent: 30
        },
        compression_enabled: true,
        min_available_bandwidth_mbps: 5
    });
    const [plan, setPlan] = useState<string>('Starter');
    const [loading, setLoading] = useState(false);
    const [pauseLoading, setPauseLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Auto-dismiss notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.tenantId) return;
            try {
                const [resConfig, resTenant] = await Promise.all([
                    fetch(`${API_URL}/tenants/${user.tenantId}/bandwidth/config`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_URL}/tenants/${user.tenantId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (resConfig.ok) {
                    setConfig(await resConfig.json());
                }
                if (resTenant.ok) {
                    const tenantData = await resTenant.json();
                    setPlan(tenantData.Plan || 'Starter');
                }
            } catch (error) {
                console.error("Failed to load bandwidth data", error);
            }
        };
        fetchData();
    }, [user, token]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await fetch(`${API_URL}/tenants/${user?.tenantId}/bandwidth/config`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });
            setNotification({ type: 'success', message: 'Configuration saved and broadcast to all agents.' });
        } catch (error) {
            setNotification({ type: 'error', message: 'Failed to save configuration.' });
        } finally {
            setLoading(false);
        }
    };

    const handlePause = async (minutes: number) => {
        // if (!confirm(`Pause all agent uploads for ${minutes} minutes?`)) return; // Remove confirm for smoother UX or keep if critical
        setPauseLoading(true);
        try {
            await fetch(`${API_URL}/tenants/${user?.tenantId}/bandwidth/pause?duration_minutes=${minutes}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const msg = minutes === 0 ? "All uploads resumed successfully." : `Uploads paused for ${minutes} minutes.`;
            setNotification({ type: 'success', message: msg });
        } catch (error) {
            setNotification({ type: 'error', message: "Failed to update pause state." });
        } finally {
            setPauseLoading(false);
        }
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white font-sans relative">

            {/* Notification Banner */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 transition-all duration-500 transform translate-y-0 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {notification.type === 'success' ? <Shield size={20} /> : <Activity size={20} />}
                    <span className="font-medium">{notification.message}</span>
                </div>
            )}

            <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Activity className="text-blue-500" />
                Bandwidth Optimization
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Shield size={20} className="text-green-500" /> General Settings
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Global Max Upload Rate (KB/s per Agent)</label>
                            <input
                                type="number"
                                value={config.max_rate_kbps}
                                onChange={e => setConfig({ ...config, max_rate_kbps: parseInt(e.target.value) || 0 })}
                                className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-1">Set to 0 for unlimited.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Min Available Bandwidth (Mbps)</label>
                            <input
                                type="number"
                                value={config.min_available_bandwidth_mbps}
                                onChange={e => setConfig({ ...config, min_available_bandwidth_mbps: parseInt(e.target.value) || 0 })}
                                className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-1">Agents will pause if network speed drops below this.</p>
                            {plan.toLowerCase() === 'starter' && (
                                <p className="text-xs text-orange-500 flex items-center gap-1 mt-1">
                                    <Lock size={10} /> Fixed to 5Mbps on Starter Plan
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                            <input
                                type="checkbox"
                                checked={config.compression_enabled}
                                onChange={e => setConfig({ ...config, compression_enabled: e.target.checked })}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div>
                                <span className="font-bold text-sm">Enable Data Compression (GZIP)</span>
                                <p className="text-xs text-gray-500">Reduces bandwidth usage by ~70%.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Business Hours Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Clock size={20} className="text-yellow-500" /> Business Hours
                        </h2>
                        <label className={`relative inline-flex items-center cursor-pointer ${plan.toLowerCase() === 'starter' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input
                                type="checkbox"
                                checked={config.business_hours.enabled}
                                onChange={e => setConfig({ ...config, business_hours: { ...config.business_hours, enabled: e.target.checked } })}
                                className="sr-only peer"
                                disabled={plan.toLowerCase() === 'starter'}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {plan.toLowerCase() === 'starter' && (
                        <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm rounded flex items-center gap-2">
                            <Lock size={16} />
                            <span>Upgrade to <strong>Pro</strong> to enable Business Hours scheduling.</span>
                        </div>
                    )}

                    <div className={`space-y-4 transition-opacity duration-300 ${!config.business_hours.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Start Time</label>
                                <input
                                    type="time"
                                    value={config.business_hours.start}
                                    onChange={e => setConfig({ ...config, business_hours: { ...config.business_hours, start: e.target.value } })}
                                    className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">End Time</label>
                                <input
                                    type="time"
                                    value={config.business_hours.end}
                                    onChange={e => setConfig({ ...config, business_hours: { ...config.business_hours, end: e.target.value } })}
                                    className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Throttle Speed (%)</label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={config.business_hours.throttle_percent}
                                onChange={e => setConfig({ ...config, business_hours: { ...config.business_hours, throttle_percent: parseInt(e.target.value) } })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Slow (10%)</span>
                                <span className="font-bold text-blue-500">{config.business_hours.throttle_percent}% Speed</span>
                                <span>Full Speed (100%)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-8 flex flex-col md:flex-row gap-6 items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">

                {/* Pause Controls (Enterprise Only) */}
                <div className="relative">
                    <div className={`flex items-center gap-4 ${plan.toLowerCase() !== 'enterprise' ? 'opacity-40 pointer-events-none blur-[1px]' : ''}`}>
                        <button
                            onClick={() => handlePause(30)}
                            disabled={pauseLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-bold text-sm disabled:opacity-50"
                        >
                            <Pause size={16} /> Pause 30m
                        </button>
                        <button
                            onClick={() => handlePause(60)}
                            disabled={pauseLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-bold text-sm disabled:opacity-50"
                        >
                            <Pause size={16} /> Pause 1h
                        </button>
                        <button
                            onClick={() => handlePause(0)}
                            disabled={pauseLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-bold text-sm disabled:opacity-50"
                        >
                            <Play size={16} /> Resume All
                        </button>
                    </div>

                    {plan.toLowerCase() !== 'enterprise' && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="bg-gray-900/80 backdrop-blur-sm text-white shadow-lg border border-gray-700 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold">
                                <Lock size={12} className="text-orange-400" />
                                <span>Enterprise Only</span>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                        </>
                    ) : (
                        <><Save size={18} /> Save Configuration</>
                    )}
                </button>
            </div>
        </div >
    );
}
