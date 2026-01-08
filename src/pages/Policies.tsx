import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Save, X } from 'lucide-react';
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
}

export default function Policies() {
    const { token } = useAuth();
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
        blockedWebsitesJson: '[]'
    });

    // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5140";

    useEffect(() => {
        if (token) fetchPolicies();
    }, [token]);

    const fetchPolicies = async () => {
        try {
            const res = await fetch(`${API_URL}/api/policies?tenantId=1`, {
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
            const url = editingId ? `${API_URL}/api/policies/${editingId}` : `${API_URL}/api/policies`;

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
            blockedWebsitesJson: '[]'
        });
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
            await fetch(`${API_URL}/api/policies/${id}`, {
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
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Action: <span className="text-gray-900 dark:text-white font-bold">{policy.actions}</span></span>
                            <span className={`px-2 py-1 rounded text-xs ${policy.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                {policy.isActive ? 'ACTIVE' : 'DISABLED'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
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
            )}
        </div>
    );
}
