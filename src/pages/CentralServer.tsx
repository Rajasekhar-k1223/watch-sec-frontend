import { Server } from 'lucide-react';
import { useState } from 'react';

export default function CentralServer() {
    const tabs = [
        "General", "Server Authorization", "Search thesauruses",
        "Digital Fingerprints", "Hash banks", "License information",
        "Recognition", "Searches"
    ];
    const [activeTab, setActiveTab] = useState("General");

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white">
            {/* Top Tabs Bar */}
            <div className="flex items-center gap-1 px-4 border-b border-gray-700 bg-gray-800/50">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                            ? 'border-blue-500 text-white bg-gray-800'
                            : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 overflow-y-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Server className="text-blue-500" />
                        {activeTab}
                    </h1>
                </div>

                {activeTab === 'General' && (
                    <GeneralSettingsTab />
                )}

                {activeTab === 'Server Authorization' && (
                    <AuthSettingsTab />
                )}

                {!['General', 'Server Authorization'].includes(activeTab) && (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center border-dashed">
                        <p className="text-gray-500">Placeholder for {activeTab} settings</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function GeneralSettingsTab() {
    const [settings, setSettings] = useState({
        DataRetentionDays: "90",
        LogLevel: "INFO",
        StoragePath: "/var/lib/watchsec/data"
    });

    // Mock Load
    // useEffect(() => { fetch('/api/system/settings')... }, [])

    const handleSave = () => {
        // fetch('/api/system/settings', { method: 'POST', body: JSON.stringify(...) })
        alert("Settings Saved!");
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Data Retention & Storage</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Activity Log Retention (Days)</label>
                        <input type="number" value={settings.DataRetentionDays} onChange={e => setSettings({ ...settings, DataRetentionDays: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-blue-500 outline-none" />
                        <p className="text-xs text-gray-500 mt-1">Logs older than this will be automatically archived/deleted.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Storage Path</label>
                        <input type="text" value={settings.StoragePath} readOnly className="w-full bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-gray-400 cursor-not-allowed" />
                        <p className="text-xs text-gray-500 mt-1">Physical path where recordings and screenshots are stored.</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">System Logging</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Log Level</label>
                    <select value={settings.LogLevel} onChange={e => setSettings({ ...settings, LogLevel: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-blue-500 outline-none">
                        <option value="DEBUG">DEBUG (Verbose)</option>
                        <option value="INFO">INFO (Standard)</option>
                        <option value="WARN">WARN (Issues Only)</option>
                        <option value="ERROR">ERROR (Critical Only)</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all">Save Changes</button>
            </div>
        </div>
    );
}

function AuthSettingsTab() {
    const [settings, setSettings] = useState({
        EnableGlobalLockdown: false,
        TrustedIps: "127.0.0.1\n192.168.1.0/24",
        Require2FA: true
    });

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Critical Security Controls</h3>

                <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
                    <div>
                        <h4 className="font-bold text-red-400">System Lockdown</h4>
                        <p className="text-sm text-gray-400">Prevents ANY new agent registrations or connections. Existing sessions maintained.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.EnableGlobalLockdown} onChange={e => setSettings({ ...settings, EnableGlobalLockdown: e.target.checked })} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div>
                        <h4 className="font-bold text-white">Enforce 2FA for Admin Access</h4>
                        <p className="text-sm text-gray-400">Require Two-Factor Authentication for all Tenant Admins.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.Require2FA} onChange={e => setSettings({ ...settings, Require2FA: e.target.checked })} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Network Access Control (NAC)</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Trusted IP Whitelist (One per line)</label>
                    <textarea rows={5} value={settings.TrustedIps} onChange={e => setSettings({ ...settings, TrustedIps: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-blue-500 outline-none" />
                    <p className="text-xs text-gray-500 mt-1">Only APIs requests from these IPs/Subnets will be allowed administrative privileges.</p>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={() => alert("Auth Settings Saved")} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all">Save Security Settings</button>
            </div>
        </div>
    );
}
