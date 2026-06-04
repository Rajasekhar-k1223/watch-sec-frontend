import { useState, useEffect } from 'react';
import { Shield, Save, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export default function SystemSettingsPanel() {
    const { token, user } = useAuth();
    const [antiTamperEnabled, setAntiTamperEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        if (user?.role !== 'SuperAdmin') return;
        try {
            const res = await fetch(`${API_URL}/system/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Settings are grouped by Category. We look in "Security" or "General"
                const allSettings = Object.values(data).flat() as any[];
                const antiTamperSetting = allSettings.find(s => s.Key === 'EnableGlobalAntiTamper');
                
                if (antiTamperSetting) {
                    setAntiTamperEnabled(antiTamperSetting.Value === 'true');
                }
            }
        } catch (error) {
            console.error("Failed to fetch system settings", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMsg({ type: '', text: '' });

        const payload = [
            {
                Key: 'EnableGlobalAntiTamper',
                Value: antiTamperEnabled ? 'true' : 'false',
                Category: 'Security',
                Description: 'Enable strict UI obfuscation and anti-debugging globally.'
            }
        ];

        try {
            const res = await fetch(`${API_URL}/system/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setMsg({ type: 'success', text: 'System settings updated successfully.' });
                window.dispatchEvent(new Event('configChanged'));
            } else {
                setMsg({ type: 'error', text: 'Failed to update system settings.' });
            }
        } catch (error) {
            setMsg({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield size={20} className="text-red-500" /> UI Anti-Tampering
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Restricts browser inspection, right-click, and DevTools globally.</p>
                </div>
                <button
                    onClick={() => setAntiTamperEnabled(!antiTamperEnabled)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${antiTamperEnabled ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${antiTamperEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                <h4 className="text-sm font-bold text-red-800 dark:text-red-400 mb-2">SuperAdmin Exemption</h4>
                <p className="text-xs text-red-600 dark:text-red-300">
                    Regardless of this toggle, <strong>SuperAdmin</strong> accounts are fully exempted from Anti-Tampering. You will always be able to inspect elements and use the console to debug the application in production.
                </p>
            </div>

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
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold transition-all shadow-lg hover:shadow-slate-500/20 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
            >
                {isSaving ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                        Saving...
                    </div>
                ) : (
                    <>
                        <Save size={18} /> Save Global Security
                    </>
                )}
            </button>
        </div>
    );
}
