import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Save, X, Activity, Users } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

interface Policy {
    id?: number;
    name: string;
    rulesJson: string;
    actions: string;
    isActive: boolean;
    tenantId: number;
    blockedAppsJson?: string;
    blockedWebsitesJson?: string;
    remediationJson: string;
    bandwidthJson?: string;
    screenshotInterval?: number;
    GeolocationEnabled?: boolean; // [NEW] v1.8.27
    autonomousRemediationEnabled?: boolean; // [v2.6.8]
    threatScoreThreshold?: number; // [v2.6.8]
    exclusionsJson?: string; // [v2.6.9]
    productivityJson?: string; // [v2.7.5]
}

export default function Policies() {
    const { user, token } = useAuth();
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPolicy, setNewPolicy] = useState<Policy>({
        name: '',
        rulesJson: '[]',
        actions: 'Block',
        isActive: true,
        tenantId: 1,
        blockedAppsJson: '[]',
        blockedWebsitesJson: '[]',
        remediationJson: '[]',
        bandwidthJson: '{}',
        screenshotInterval: 60,
        GeolocationEnabled: true,
        autonomousRemediationEnabled: false,
        threatScoreThreshold: 90,
        exclusionsJson: '[]',
        productivityJson: '{}'
    });

    // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5140";

    useEffect(() => {
        if (token) fetchPolicies();
    }, [token]);

    const fetchPolicies = async () => {
        try {
            const query = new URLSearchParams(window.location.search);
            const targetTenantId = query.get('tenantId') || user?.tenantId || 1;
            
            const res = await fetch(`${API_URL}/policies?tenantId=${targetTenantId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPolicies(await res.json());
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `${API_URL}/policies/${editingId}` : `${API_URL}/policies`;

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newPolicy)
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchPolicies();
                resetForm();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setNewPolicy({
            name: '',
            rulesJson: '[]',
            actions: 'Block',
            isActive: true,
            tenantId: 1,
            blockedAppsJson: '[]',
            blockedWebsitesJson: '[]',
            remediationJson: '[]',
            bandwidthJson: '{}',
            screenshotInterval: 60,
            GeolocationEnabled: true,
            autonomousRemediationEnabled: false,
            threatScoreThreshold: 90,
            exclusionsJson: '[]',
            productivityJson: '{}'
        });
    };

    const addRemediationRule = () => {
        const rules = JSON.parse(newPolicy.remediationJson || "[]");
        rules.push({ if: { risk_level: 'Critical' }, then: { action: 'KillProcess', params: {} } });
        setNewPolicy({ ...newPolicy, remediationJson: JSON.stringify(rules) });
    };

    const updateRemediationRule = (idx: number, group: 'if' | 'then', key: string, val: any) => {
        const rules = JSON.parse(newPolicy.remediationJson || "[]");
        rules[idx][group][key] = val;
        setNewPolicy({ ...newPolicy, remediationJson: JSON.stringify(rules) });
    };

    const removeRemediationRule = (idx: number) => {
        const rules = JSON.parse(newPolicy.remediationJson || "[]");
        rules.splice(idx, 1);
        setNewPolicy({ ...newPolicy, remediationJson: JSON.stringify(rules) });
    };

    // [NEW] Bandwidth Helpers
    const updateBandwidth = (key: string, val: any) => {
        try {
            const current = JSON.parse(newPolicy.bandwidthJson || "{}");
            if (key.includes('.')) {
                const [parent, child] = key.split('.');
                current[parent] = current[parent] || {};
                current[parent][child] = val;
            } else {
                current[key] = val;
            }
            setNewPolicy({ ...newPolicy, bandwidthJson: JSON.stringify(current) });
        } catch (e) { console.error(e); }
    };

    const getBandwidth = (key: string, defaultVal: any = undefined) => {
        try {
            const current = JSON.parse(newPolicy.bandwidthJson || "{}");
            if (key.includes('.')) {
                const [parent, child] = key.split('.');
                return current[parent]?.[child] ?? defaultVal;
            }
            return current[key] ?? defaultVal;
        } catch { return defaultVal; }
    };

    const handleEdit = (policy: Policy) => {
        setEditingId(policy.id!);
        setNewPolicy(policy);
        setIsModalOpen(true);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`${API_URL}/policies/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchPolicies();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-6 transition-colors">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-purple-600 dark:text-purple-500" />
                        DLP Policies
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Define rules to prevent data leaks and unauthorized activities.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-purple-500/20"
                >
                    <Plus size={18} />
                    New Policy
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {policies.map(policy => (
                    <div key={policy.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-500/50 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{policy.name}</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(policy)}
                                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-xs border border-gray-200 dark:border-gray-600 px-2 py-1 rounded hover:border-blue-400 transition-colors"
                                >
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(policy.id!)} className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-500">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 mb-4 font-mono text-xs text-gray-700 dark:text-green-400 border border-gray-100 dark:border-gray-800 overflow-x-auto">
                            {policy.rulesJson}
                        </div>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="text-gray-500 dark:text-gray-400">Action: <span className="text-gray-900 dark:text-white font-bold">{policy.actions}</span></span>
                            <span className="text-gray-500 dark:text-gray-400">
                                Rules: <span className="text-purple-600 dark:text-purple-400 font-bold">{JSON.parse(policy.remediationJson || "[]").length} Active</span>
                            </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${policy.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                            {policy.isActive ? 'ACTIVE' : 'DISABLED'}
                        </span>
                    </div>
                ))}
            </div>

            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-lg shadow-2xl">

                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Policy' : 'Create New Policy'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Policy Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white focus:border-purple-500 outline-none transition-colors"
                                        value={newPolicy.name}
                                        onChange={e => setNewPolicy({ ...newPolicy, name: e.target.value })}
                                        placeholder="e.g., Block Torrent Clients"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Rules (JSON)</label>
                                    <textarea
                                        value={newPolicy.rulesJson}
                                        onChange={e => setNewPolicy({ ...newPolicy, rulesJson: e.target.value })}
                                        readOnly disabled className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-gray-600 dark:text-white font-mono text-xs focus:border-purple-500 outline-none h-32 opacity-70 cursor-not-allowed hidden"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Blocked Apps (Comma Separated)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white focus:border-purple-500 outline-none transition-colors"
                                        value={JSON.parse(newPolicy.blockedAppsJson || "[]").join(", ")}
                                        onChange={e => setNewPolicy({
                                            ...newPolicy,
                                            blockedAppsJson: JSON.stringify(e.target.value.split(',').map(s => s.trim()).filter(s => s))
                                        })}
                                        placeholder="e.g., spotify.exe, uTorrent.exe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Blocked Websites (Comma Separated)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white focus:border-purple-500 outline-none transition-colors"
                                        value={JSON.parse(newPolicy.blockedWebsitesJson || "[]").join(", ")}
                                        onChange={e => setNewPolicy({
                                            ...newPolicy,
                                            blockedWebsitesJson: JSON.stringify(e.target.value.split(',').map(s => s.trim()).filter(s => s))
                                        })}
                                        placeholder="e.g., facebook.com, gambling.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Violation Action</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white focus:border-purple-500 outline-none transition-colors"
                                        value={newPolicy.actions.replace(',Screenshot', '').replace('Screenshot', 'Block')}
                                        onChange={e => {
                                            const base = e.target.value;
                                            const hasScreenshot = newPolicy.actions.includes('Screenshot');
                                            const combined = hasScreenshot ? `${base},Screenshot` : base;
                                            setNewPolicy({ ...newPolicy, actions: combined });
                                        }}
                                    >
                                        <option value="Block">Block Process</option>
                                        <option value="Alert">Alert Only</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="chkScreenshot"
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-purple-600 focus:ring-purple-500"
                                        checked={newPolicy.actions.includes('Screenshot')}
                                        onChange={e => {
                                            const base = newPolicy.actions.replace(',Screenshot', '').replace('Screenshot', 'Block');
                                            let cleanBase = base;
                                            if (base === '') cleanBase = 'Block';

                                            if (e.target.checked) {
                                                setNewPolicy({ ...newPolicy, actions: `${cleanBase},Screenshot` });
                                            } else {
                                                setNewPolicy({ ...newPolicy, actions: cleanBase });
                                            }
                                        }}
                                    />
                                    <label htmlFor="chkScreenshot" className="text-sm text-gray-600 dark:text-gray-300">Enable Agent Screenshots</label>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 mt-2">
                                    <input
                                        type="checkbox"
                                        id="chkGeolocation"
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                                        checked={newPolicy.GeolocationEnabled}
                                        disabled={user?.role !== 'SuperAdmin' && user?.role !== 'TenantAdmin'}
                                        onChange={e => setNewPolicy({ ...newPolicy, GeolocationEnabled: e.target.checked })}
                                    />
                                    <div className="flex flex-col">
                                        <label htmlFor="chkGeolocation" className="text-sm text-gray-600 dark:text-gray-300 font-bold">
                                            Enable Geolocation Tracking
                                            {(user?.role !== 'SuperAdmin' && user?.role !== 'TenantAdmin') && <span className="ml-2 text-[8px] text-red-400 uppercase">(Admin Only)</span>}
                                        </label>
                                        <p className="text-[10px] text-gray-500">Collects GPS/IP-based location data from agents.</p>
                                    </div>
                                </div>
                                {newPolicy.actions.includes('Screenshot') && (
                                    <div className="mt-2 pl-6 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-500">
                                            <span>Capture Interval</span>
                                            <span className="text-purple-500 font-black">{newPolicy.screenshotInterval || 60}s</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="5" 
                                            max="3600" 
                                            step="5"
                                            value={newPolicy.screenshotInterval || 60}
                                            onChange={(e) => setNewPolicy({ ...newPolicy, screenshotInterval: parseInt(e.target.value) })}
                                            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                        />
                                        <div className="flex justify-between text-[8px] text-gray-400 font-bold">
                                            <span>5s</span>
                                            <span>1h</span>
                                        </div>
                                    </div>
                                )}

                                {/* Bandwidth Configuration Section */}
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Activity size={16} className="text-purple-500" />
                                        Bandwidth Throttling
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Max Upload Rate (KB/s)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500"
                                                value={getBandwidth('max_rate_kbps', 0)}
                                                onChange={e => updateBandwidth('max_rate_kbps', parseInt(e.target.value) || 0)}
                                                placeholder="0 (Unlimited)"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Min Available (Mbps)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500"
                                                value={getBandwidth('min_available_bandwidth_mbps', 5)}
                                                onChange={e => updateBandwidth('min_available_bandwidth_mbps', parseInt(e.target.value) || 5)}
                                                placeholder="Default: 5"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Business Hours Throttling</label>
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                                                checked={getBandwidth('business_hours.enabled', false)}
                                                onChange={e => updateBandwidth('business_hours.enabled', e.target.checked)}
                                            />
                                        </div>

                                        {getBandwidth('business_hours.enabled', false) && (
                                            <div className="grid grid-cols-3 gap-2 mt-2">
                                                <div>
                                                    <label className="block text-[9px] text-gray-400 mb-1">Start Time</label>
                                                    <input
                                                        type="time"
                                                        className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded p-1 text-xs"
                                                        value={getBandwidth('business_hours.start', "09:00")}
                                                        onChange={e => updateBandwidth('business_hours.start', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] text-gray-400 mb-1">End Time</label>
                                                    <input
                                                        type="time"
                                                        className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded p-1 text-xs"
                                                        value={getBandwidth('business_hours.end', "17:00")}
                                                        onChange={e => updateBandwidth('business_hours.end', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] text-gray-400 mb-1">Throttle %</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded p-1 text-xs"
                                                        value={getBandwidth('business_hours.throttle_percent', 30)}
                                                        onChange={e => updateBandwidth('business_hours.throttle_percent', parseInt(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* [v2.6.8] Autonomous Defense Section */}
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Shield size={16} className="text-red-500" />
                                            Autonomous AI Defense
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${newPolicy.autonomousRemediationEnabled ? 'text-red-500' : 'text-gray-400'}`}>
                                                {newPolicy.autonomousRemediationEnabled ? 'Active' : 'Disabled'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setNewPolicy({ ...newPolicy, autonomousRemediationEnabled: !newPolicy.autonomousRemediationEnabled })}
                                                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${newPolicy.autonomousRemediationEnabled ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                                            >
                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${newPolicy.autonomousRemediationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {newPolicy.autonomousRemediationEnabled && (
                                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-4 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-300">
                                            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-red-700 dark:text-red-400">
                                                <span>Remediation Sensitivity Threshold</span>
                                                <span className="text-red-600 dark:text-red-500 font-black">{newPolicy.threatScoreThreshold || 90}%</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="10" 
                                                max="100" 
                                                step="5"
                                                value={newPolicy.threatScoreThreshold || 90}
                                                onChange={(e) => setNewPolicy({ ...newPolicy, threatScoreThreshold: parseInt(e.target.value) })}
                                                className="w-full h-1.5 bg-red-200 dark:bg-red-900/40 rounded-lg appearance-none cursor-pointer accent-red-600"
                                            />
                                            <p className="text-[10px] text-red-900/60 dark:text-red-400/60 leading-relaxed italic">
                                                * If an agent's AI Threat Score reaches or exceeds this threshold, the platform will automatically trigger a Monitorix Lockdown.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* [v2.6.9] AI Threat Intelligence & Exclusions Section */}
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Activity size={16} className="text-blue-500" />
                                        AI Threat Intelligence & Whitelisting
                                    </h3>
                                    
                                    <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-4 rounded-xl space-y-4">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Active Exclusions</label>
                                                <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                                                    {JSON.parse(newPolicy.exclusionsJson || "[]").length} RULES
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                                {JSON.parse(newPolicy.exclusionsJson || "[]").map((ex: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 text-[10px]">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded font-black uppercase">{ex.type}</span>
                                                            <span className="text-gray-600 dark:text-gray-400 font-mono truncate max-w-[200px]">{ex.value}</span>
                                                        </div>
                                                        <button 
                                                            onClick={() => {
                                                                const current = JSON.parse(newPolicy.exclusionsJson || "[]");
                                                                const updated = current.filter((_: any, i: number) => i !== idx);
                                                                setNewPolicy({ ...newPolicy, exclusionsJson: JSON.stringify(updated) });
                                                            }}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {JSON.parse(newPolicy.exclusionsJson || "[]").length === 0 && (
                                                    <p className="text-center py-4 text-gray-400 text-[10px] italic">No exclusions defined. AI will analyze all events.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <select 
                                                id="exType"
                                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-1.5 text-[10px] outline-none focus:border-blue-500"
                                            >
                                                <option value="path">PATH</option>
                                                <option value="hash">SHA256</option>
                                                <option value="ip">IP/CIDR</option>
                                            </select>
                                            <input 
                                                id="exValue"
                                                type="text"
                                                placeholder="Enter value..."
                                                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-1.5 text-[10px] outline-none focus:border-blue-500"
                                            />
                                            <button 
                                                onClick={() => {
                                                    const type = (document.getElementById('exType') as HTMLSelectElement).value;
                                                    const val = (document.getElementById('exValue') as HTMLInputElement).value;
                                                    if (!val) return;
                                                    const current = JSON.parse(newPolicy.exclusionsJson || "[]");
                                                    const updated = [...current, { type, value: val }];
                                                    setNewPolicy({ ...newPolicy, exclusionsJson: JSON.stringify(updated) });
                                                    (document.getElementById('exValue') as HTMLInputElement).value = "";
                                                }}
                                                className="px-3 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-500 transition-colors"
                                            >
                                                ADD
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* [v2.7.5] Workforce Productivity & Behavioral Mapping Section */}
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Users size={16} className="text-emerald-500" />
                                        Workforce Productivity & Behavioral Mapping
                                    </h3>
                                    
                                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-4 rounded-xl space-y-4">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Productivity Benchmarks</label>
                                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                                                    {Object.keys(JSON.parse(newPolicy.productivityJson || "{}")).length} MAPPINGS
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                                {Object.entries(JSON.parse(newPolicy.productivityJson || "{}")).map(([app, cat]: [string, any], idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 text-[10px]">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-1.5 py-0.5 rounded font-black uppercase ${
                                                                cat === 'Productive' ? 'bg-emerald-500/10 text-emerald-500' :
                                                                cat === 'Distraction' ? 'bg-red-500/10 text-red-500' :
                                                                'bg-gray-500/10 text-gray-500'
                                                            }`}>{cat}</span>
                                                            <span className="text-gray-600 dark:text-gray-400 font-mono truncate max-w-[200px]">{app}</span>
                                                        </div>
                                                        <button 
                                                            onClick={() => {
                                                                const current = JSON.parse(newPolicy.productivityJson || "{}");
                                                                delete current[app];
                                                                setNewPolicy({ ...newPolicy, productivityJson: JSON.stringify(current) });
                                                            }}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {Object.keys(JSON.parse(newPolicy.productivityJson || "{}")).length === 0 && (
                                                    <p className="text-center py-4 text-gray-400 text-[10px] italic">No productivity rules defined. Behavior is marked as Neutral.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <input 
                                                id="prodApp"
                                                type="text"
                                                placeholder="Application/Process Name (e.g. excel.exe)"
                                                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-1.5 text-[10px] outline-none focus:border-emerald-500"
                                            />
                                            <select 
                                                id="prodCat"
                                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-1.5 text-[10px] outline-none focus:border-emerald-500"
                                            >
                                                <option value="Productive">PRODUCTIVE</option>
                                                <option value="Neutral">NEUTRAL</option>
                                                <option value="Distraction">DISTRACTION</option>
                                            </select>
                                            <button 
                                                onClick={() => {
                                                    const app = (document.getElementById('prodApp') as HTMLInputElement).value;
                                                    const cat = (document.getElementById('prodCat') as HTMLSelectElement).value;
                                                    if (!app) return;
                                                    const current = JSON.parse(newPolicy.productivityJson || "{}");
                                                    current[app] = cat;
                                                    setNewPolicy({ ...newPolicy, productivityJson: JSON.stringify(current) });
                                                    (document.getElementById('prodApp') as HTMLInputElement).value = "";
                                                }}
                                                className="px-3 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-500 transition-colors"
                                            >
                                                ADD
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 italic px-1 leading-relaxed">
                                        * These benchmarks power the AI Behavioral Analytics to calculate Focus Scores and identify Burnout risks.
                                    </p>
                                </div>

                                {/* Remediation Playbooks Section */}
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Automated Remediation Playbooks</h3>
                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {JSON.parse(newPolicy.remediationJson || "[]").map((rule: any, idx: number) => (
                                            <div key={idx} className="bg-gray-50 dark:bg-gray-900/70 p-3 rounded-lg border border-gray-200 dark:border-gray-700 relative group transition-all hover:border-purple-500/30">
                                                <button
                                                    onClick={() => removeRemediationRule(idx)}
                                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase mb-2">Enforcement Rule #{idx + 1}</div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider">Target Trigger</label>
                                                        <select
                                                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-1.5 text-xs text-gray-700 dark:text-gray-200 outline-none focus:border-purple-500"
                                                            value={rule.if.risk_level}
                                                            onChange={(e) => updateRemediationRule(idx, 'if', 'risk_level', e.target.value)}
                                                        >
                                                            <option value="Critical">Risk: Critical</option>
                                                            <option value="High">Risk: High</option>
                                                            <option value="Normal">Risk: Normal</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] text-gray-500 mb-1 font-bold uppercase tracking-wider">Action To Taken</label>
                                                        <select
                                                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-1.5 text-xs text-gray-700 dark:text-gray-200 outline-none focus:border-purple-500"
                                                            value={rule.then.action}
                                                            onChange={(e) => updateRemediationRule(idx, 'then', 'action', e.target.value)}
                                                        >
                                                            <option value="KillProcess">Kill Process</option>
                                                            <option value="LockSession">Lock Session</option>
                                                            <option value="SecurityPopup">Show Warning</option>
                                                            <option value="IsolateNetwork">Isolate Network</option>
                                                            <option value="SOVEREIGN_LOCKDOWN">Monitorix Lockdown (Deep)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            onClick={addRemediationRule}
                                            className="w-full py-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold text-gray-400 hover:text-purple-500 hover:border-purple-400 hover:bg-purple-50/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={12} /> Add Automated Response Rule
                                        </button>
                                    </div>
                                </div>


                                <button
                                    onClick={handleSave}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-bold mt-4 flex justify-center items-center gap-2 shadow-lg shadow-purple-500/20"
                                >
                                    <Save size={18} />
                                    {editingId ? 'Update Policy' : 'Save Policy'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
