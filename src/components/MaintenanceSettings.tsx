import { useState, useEffect } from 'react';
import { Calendar, Clock, Save, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export default function MaintenanceSettings() {
    const { token, user } = useAuth();
    const [config, setConfig] = useState({
        enabled: false,
        days: [0, 1, 2, 3, 4, 5, 6],
        startTime: '00:00',
        endTime: '23:59',
        timezone: 'UTC'
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const days = [
        { id: 1, name: 'Mon' },
        { id: 2, name: 'Tue' },
        { id: 3, name: 'Wed' },
        { id: 4, name: 'Thu' },
        { id: 5, name: 'Fri' },
        { id: 6, name: 'Sat' },
        { id: 0, name: 'Sun' }
    ];

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        if (!user?.tenantId) return;
        try {
            const res = await fetch(`${API_URL}/tenants/${user.tenantId}/maintenance-window`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (error) {
            console.error("Failed to fetch maintenance config", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user?.tenantId) return;
        setIsSaving(true);
        setMsg({ type: '', text: '' });

        try {
            const res = await fetch(`${API_URL}/tenants/${user.tenantId}/maintenance-window`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                setMsg({ type: 'success', text: 'Maintenance window updated successfully.' });
            } else {
                setMsg({ type: 'error', text: 'Failed to update configuration.' });
            }
        } catch (error) {
            setMsg({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleDay = (dayId: number) => {
        if (config.days.includes(dayId)) {
            setConfig({ ...config, days: config.days.filter(d => d !== dayId) });
        } else {
            setConfig({ ...config, days: [...config.days, dayId] });
        }
    };

    if (isLoading) return <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar size={20} className="text-blue-500" /> Maintenance Windows
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Restricts agent updates to specific days and times.</p>
                </div>
                <button
                    onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                    className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${config.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>

            {config.enabled && (
                <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in">
                    {/* Days Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Allowed Update Days</label>
                        <div className="flex flex-wrap gap-2">
                            {days.map((day) => (
                                <button
                                    key={day.id}
                                    onClick={() => toggleDay(day.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${config.days.includes(day.id)
                                            ? 'bg-blue-600 text-white shadow-lg scale-105'
                                            : 'bg-gray-100 dark:bg-gray-900 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {day.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Clock size={16} /> Start Time (UTC)
                            </label>
                            <input
                                type="time"
                                value={config.startTime}
                                onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Clock size={16} /> End Time (UTC)
                            </label>
                            <input
                                type="time"
                                value={config.endTime}
                                onChange={(e) => setConfig({ ...config, endTime: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            )}

            {msg.text && (
                <div className={`p-4 rounded-lg flex items-center gap-3 animate-fade-in ${msg.type === 'success'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    }`}>
                    {msg.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    <p className="text-sm font-medium">{msg.text}</p>
                </div>
            )}

            <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg hover:shadow-blue-500/20 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
            >
                {isSaving ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Saving...
                    </div>
                ) : (
                    <>
                        <Save size={18} /> Save Maintenance Configuration
                    </>
                )}
            </button>
        </div>
    );
}
