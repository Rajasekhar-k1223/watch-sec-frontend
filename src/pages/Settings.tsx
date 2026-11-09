import { useState } from 'react';
import { Lock, Bell, User, Check, AlertCircle, Building2, Shield, Key } from 'lucide-react';
import MaintenanceSettings from '../components/MaintenanceSettings';
import SystemSettingsPanel from '../components/SystemSettingsPanel';
import ApiKeysPanel from '../components/ApiKeysPanel';
import EnterpriseSsoPanel from '../components/EnterpriseSsoPanel';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export default function Settings() {
    const { token, user } = useAuth();
    const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
    const [activeTab, setActiveTab] = useState('security');

    // Security State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    // User Notification Preferences
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [weeklyReport, setWeeklyReport] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setMsg({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

        if (newPassword.length < 6) {
            setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            if (res.ok) {
                setMsg({ type: 'success', text: 'Password changed successfully.' });
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                const err = await res.text();
                setMsg({ type: 'error', err: err || 'Failed to change password.' } as any);
            }
        } catch (error) {
            setMsg({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6 text-slate-900 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                        <User size={28} className="text-blue-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <div className="p-1 bg-blue-50 rounded text-blue-600 border border-blue-200">
                                <Lock size={12} />
                             </div>
                             <span className="text-[10px] font-bold tracking-wider uppercase text-blue-700">Identity Control</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                            Console Settings
                        </h1>
                        <p className="text-slate-500 text-xs font-medium mt-1">Protocol configuration and identity security management.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full text-left px-5 py-3.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'security' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                        <Lock size={16} /> Security
                    </button>
                    <button
                        onClick={() => setActiveTab('preferences')}
                        className={`w-full text-left px-5 py-3.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'preferences' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                        <Bell size={16} /> Notifications
                    </button>
                    {(user?.role === 'TenantAdmin' || user?.role === 'SuperAdmin') && (
                        <>
                            <button
                                onClick={() => setActiveTab('organization')}
                                className={`w-full text-left px-5 py-3.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'organization' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                            >
                                <Building2 size={16} /> Organization
                            </button>
                            <button
                                onClick={() => setActiveTab('sso')}
                                className={`w-full text-left px-5 py-3.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'sso' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                            >
                                <Shield size={16} /> SSO & Directory Sync
                            </button>
                            <button
                                onClick={() => setActiveTab('developer_keys')}
                                className={`w-full text-left px-5 py-3.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'developer_keys' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                            >
                                <Key size={16} /> Developer Keys
                            </button>
                        </>
                    )}
                    {user?.role === 'SuperAdmin' && (
                        <button
                            onClick={() => setActiveTab('global_security')}
                            className={`w-full text-left px-5 py-3.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'global_security' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                        >
                            <Shield size={16} /> Global Security
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 relative overflow-hidden">
                    {activeTab === 'security' && (
                        <div className="max-w-md relative z-10">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
                                <Lock className="text-blue-600" size={16} /> Update Password
                            </h2>

                            {msg.text && (
                                <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-xs font-semibold ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                                    {msg.type === 'success' ? <Check size={16} className="mt-0.5 text-emerald-600" /> : <AlertCircle size={16} className="mt-0.5 text-rose-600" />}
                                    <p>{msg.text}</p>
                                </div>
                            )}

                            <form onSubmit={handleChangePassword} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-none transition-all text-sm font-medium"
                                        value={oldPassword}
                                        onChange={e => setOldPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">New Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-none transition-all text-sm font-medium"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-none transition-all text-sm font-medium"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-3.5 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm hover:bg-slate-800 ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                    {isLoading ? 'Updating...' : 'Save Password'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="max-w-xl relative z-10">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
                                <Bell className="text-amber-500" size={16} /> Notification Pulse
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-200 transition-all hover:border-slate-300">
                                    <div className="max-w-[70%]">
                                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Critical Alert Broadcast</h3>
                                        <p className="text-xs text-slate-500 font-medium mt-1">Immediate SMTP/Webhook transmission for high-severity threat detections.</p>
                                    </div>
                                    <ToggleSwitch enabled={emailAlerts} onChange={setEmailAlerts} />
                                </div>

                                <div className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-200 transition-all hover:border-slate-300">
                                    <div className="max-w-[70%]">
                                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Weekly Intelligence Sync</h3>
                                        <p className="text-xs text-slate-500 font-medium mt-1">Consolidated forensic digest transmitted every UTC Monday 00:00.</p>
                                    </div>
                                    <ToggleSwitch enabled={weeklyReport} onChange={setWeeklyReport} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'organization' && (
                        <div className="max-w-xl relative z-10">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
                                <Building2 className="text-blue-600" size={16} /> Organization Protocol
                            </h2>
                            <MaintenanceSettings />
                        </div>
                    )}

                    {activeTab === 'sso' && (user?.role === 'TenantAdmin' || user?.role === 'SuperAdmin') && (
                        <div className="max-w-6xl relative z-10">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
                                <Shield className="text-blue-600" size={16} /> Enterprise SSO & SCIM Directory Provisioning
                            </h2>
                            <EnterpriseSsoPanel />
                        </div>
                    )}

                    {activeTab === 'developer_keys' && (user?.role === 'TenantAdmin' || user?.role === 'SuperAdmin') && (
                        <div className="max-w-5xl relative z-10">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
                                <Key className="text-blue-600" size={16} /> Developer API Keys
                            </h2>
                            <ApiKeysPanel />
                        </div>
                    )}

                    {activeTab === 'global_security' && user?.role === 'SuperAdmin' && (
                        <div className="max-w-xl relative z-10">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
                                <Shield className="text-rose-600" size={16} /> Global System Security
                            </h2>
                            <SystemSettingsPanel />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ToggleSwitch({ enabled, onChange }: any) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
        >
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    );
}
