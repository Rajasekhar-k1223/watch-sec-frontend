import { useState } from 'react';
import { Lock, Bell, User, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
    const { user } = useAuth();
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

    const API_URL = import.meta.env.VITE_API_URL || "https://192.168.1.10:7033";

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
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/users/change-password`, {
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
        <div className="p-8 bg-gray-900 min-h-screen text-white font-sans animate-fade-in">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-800">
                <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                    <User size={32} className="text-blue-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Account Settings</h1>
                    <p className="text-gray-400">Manage your profile, security, and preferences.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'security' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <Lock size={18} /> Security
                    </button>
                    <button
                        onClick={() => setActiveTab('preferences')}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'preferences' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <Bell size={18} /> Notifications
                    </button>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-xl">
                    {activeTab === 'security' && (
                        <div className="max-w-md">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Lock className="text-blue-400" /> Change Password
                            </h2>

                            {msg.text && (
                                <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${msg.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                                    {msg.type === 'success' ? <Check size={18} className="mt-0.5" /> : <AlertCircle size={18} className="mt-0.5" />}
                                    <p>{msg.text}</p>
                                </div>
                            )}

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none transition-colors"
                                        value={oldPassword}
                                        onChange={e => setOldPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none transition-colors"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none transition-colors"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                    {isLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="max-w-xl">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Bell className="text-yellow-400" /> notification Preferences
                            </h2>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                                    <div>
                                        <h3 className="font-bold text-white">Email Security Alerts</h3>
                                        <p className="text-sm text-gray-400">Receive immediate emails for critical threats.</p>
                                    </div>
                                    <ToggleSwitch enabled={emailAlerts} onChange={setEmailAlerts} />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                                    <div>
                                        <h3 className="font-bold text-white">Weekly Summary Report</h3>
                                        <p className="text-sm text-gray-400">Get a PDF summary every Monday morning.</p>
                                    </div>
                                    <ToggleSwitch enabled={weeklyReport} onChange={setWeeklyReport} />
                                </div>
                            </div>
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
            className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${enabled ? 'bg-green-500' : 'bg-gray-600'}`}
        >
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    );
}
