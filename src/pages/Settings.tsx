import { useState } from 'react';
import { Lock, Bell, User, Check, AlertCircle, Building2, Shield, Key } from 'lucide-react';
import MaintenanceSettings from '../components/MaintenanceSettings';
import SystemSettingsPanel from '../components/SystemSettingsPanel';
import ApiKeysPanel from '../components/ApiKeysPanel';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export default function Settings() {
    const { token, user } = useAuth();
    const [activeTab, setActiveTab] = useState('security');

    // Security State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    // Preferences State (Mock)
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [weeklyReport, setWeeklyReport] = useState(false);

    // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5140";

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
                    'Authorization': `Bearer ${token}`
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
                setMsg({ type: 'error', text: err || 'Failed to change password.' });
            }
        } catch (error) {
            setMsg({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-10 bg-slate-50 dark:bg-[#020617] min-h-screen text-slate-900 dark:text-white transition-colors animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12 pb-8 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-6">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
                        <User size={32} className="text-blue-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <div className="p-1 bg-blue-500/20 rounded text-blue-500 ring-1 ring-blue-500/30">
                                <Lock size={12} />
                             </div>
                             <span className="text-[10px] font-black tracking-[0.2em] uppercase text-blue-500/80">Identity Control</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter">
                            <span className="text-gradient">Console Settings</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-2">Protocol configuration and identity security management.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Sidebar Navigation */}
                <div className="space-y-3">
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full text-left px-6 py-4 rounded-2xl flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'security' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl shadow-slate-500/10' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        <Lock size={16} /> Security
                    </button>
                    <button
                        onClick={() => setActiveTab('preferences')}
                        className={`w-full text-left px-6 py-4 rounded-2xl flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'preferences' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl shadow-slate-500/10' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        <Bell size={16} /> Notifications
                    </button>
                    {(user?.role === 'TenantAdmin' || user?.role === 'SuperAdmin') && (
                        <>
                            <button
                                onClick={() => setActiveTab('organization')}
                                className={`w-full text-left px-6 py-4 rounded-2xl flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'organization' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl shadow-slate-500/10' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                <Building2 size={16} /> Organization
                            </button>
                            <button
                                onClick={() => setActiveTab('developer_keys')}
                                className={`w-full text-left px-6 py-4 rounded-2xl flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'developer_keys' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl shadow-slate-500/10' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                <Key size={16} /> Developer Keys
                            </button>
                        </>
                    )}
                    {user?.role === 'SuperAdmin' && (
                        <button
                            onClick={() => setActiveTab('global_security')}
                            className={`w-full text-left px-6 py-4 rounded-2xl flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'global_security' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl shadow-slate-500/10' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            <Shield size={16} /> Global Security
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 glass-card p-10 transition-colors relative overflow-hidden">
                    <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[80px] pointer-events-none"></div>

                    {activeTab === 'security' && (
                        <div className="max-w-md relative z-10">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-10 flex items-center gap-3">
                                <Lock className="text-blue-500" size={16} /> Update Cryptographic Key
                            </h2>

                            {msg.text && (
                                <div className={`p-5 rounded-2xl mb-8 flex items-start gap-4 text-[10px] font-black uppercase tracking-widest ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'}`}>
                                    {msg.type === 'success' ? <Check size={16} className="mt-0.5" /> : <AlertCircle size={16} className="mt-0.5" />}
                                    <p className="mt-1">{msg.text}</p>
                                </div>
                            )}

                            <form onSubmit={handleChangePassword} className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Current Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white outline-none transition-all font-black"
                                        value={oldPassword}
                                        onChange={e => setOldPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">New Identity Secret</label>
                                    <input
                                        type="password"
                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white outline-none transition-all font-black"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Confirm Secret</label>
                                    <input
                                        type="password"
                                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white outline-none transition-all font-black"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-slate-500/10 hover:scale-[1.02] active:scale-95 ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                    {isLoading ? 'Encrypting...' : 'Commit Changes'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="max-w-xl relative z-10">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-10 flex items-center gap-3">
                                <Bell className="text-amber-500" size={16} /> Notification Pulse
                            </h2>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-slate-200 dark:border-slate-800 transition-all hover:border-blue-500/30">
                                    <div className="max-w-[70%]">
                                        <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Critical Alert Broadcast</h3>
                                        <p className="text-[10px] text-slate-500 font-medium mt-2 leading-relaxed">Immediate SMTP/Webhook transmission for high-severity threat detections.</p>
                                    </div>
                                    <ToggleSwitch enabled={emailAlerts} onChange={setEmailAlerts} />
                                </div>

                                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-slate-200 dark:border-slate-800 transition-all hover:border-blue-500/30">
                                    <div className="max-w-[70%]">
                                        <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Weekly Intelligence Sync</h3>
                                        <p className="text-[10px] text-slate-500 font-medium mt-2 leading-relaxed">Consolidated forensic digest transmitted every UTC Monday 00:00.</p>
                                    </div>
                                    <ToggleSwitch enabled={weeklyReport} onChange={setWeeklyReport} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'organization' && (
                        <div className="max-w-xl relative z-10">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-10 flex items-center gap-3">
                                <Building2 className="text-blue-500" size={16} /> Organization Protocol
                            </h2>
                            <MaintenanceSettings />
                        </div>
                    )}

                    {activeTab === 'developer_keys' && (user?.role === 'TenantAdmin' || user?.role === 'SuperAdmin') && (
                        <div className="max-w-5xl relative z-10">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-10 flex items-center gap-3">
                                <Key className="text-blue-500" size={16} /> Developer API Keys
                            </h2>
                            <ApiKeysPanel />
                        </div>
                    )}

                    {activeTab === 'global_security' && user?.role === 'SuperAdmin' && (
                        <div className="max-w-xl relative z-10">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-10 flex items-center gap-3">
                                <Shield className="text-red-500" size={16} /> Global System Security
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
            className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${enabled ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`}
        >
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    );
}
