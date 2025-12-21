import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Save, X } from 'lucide-react';

interface Policy {
    id?: number;
    name: string;
    rulesJson: string;
    actions: string;
    isActive: boolean;
    tenantId: number;
}

export default function Policies() {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPolicy, setNewPolicy] = useState<Policy>({
        name: '',
        rulesJson: '[{"type": "process", "value": "notepad", "action": "kill"}]',
        actions: 'Block',
        isActive: true,
        tenantId: 1 // Default for now
    });

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5140";

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const res = await fetch(`${API_URL}/api/policies?tenantId=1`);
            if (res.ok) {
                setPolicies(await res.json());
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreate = async () => {
        try {
            const res = await fetch(`${API_URL}/api/policies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPolicy)
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchPolicies();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`${API_URL}/api/policies/${id}`, { method: 'DELETE' });
            fetchPolicies();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Shield className="text-purple-500" />
                        DLP Policies
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Define rules to prevent data leaks and unauthorized activities.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} />
                    New Policy
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {policies.map(policy => (
                    <div key={policy.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg hover:border-purple-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-white">{policy.name}</h3>
                            <button onClick={() => handleDelete(policy.id!)} className="text-gray-500 hover:text-red-500">
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div className="bg-gray-900 rounded p-3 mb-4 font-mono text-xs text-green-400 overflow-x-auto">
                            {policy.rulesJson}
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Action: <span className="text-white font-bold">{policy.actions}</span></span>
                            <span className={`px-2 py-1 rounded text-xs ${policy.isActive ? 'bg-green-500/10 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                                {policy.isActive ? 'ACTIVE' : 'DISABLED'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Create New Policy</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Policy Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-purple-500 outline-none"
                                    value={newPolicy.name}
                                    onChange={e => setNewPolicy({ ...newPolicy, name: e.target.value })}
                                    placeholder="e.g., Block Torrent Clients"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Rules (JSON)</label>
                                <textarea
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono text-xs focus:border-purple-500 outline-none h-32"
                                    value={newPolicy.rulesJson}
                                    onChange={e => setNewPolicy({ ...newPolicy, rulesJson: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Action</label>
                                <select
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-purple-500 outline-none"
                                    value={newPolicy.actions}
                                    onChange={e => setNewPolicy({ ...newPolicy, actions: e.target.value })}
                                >
                                    <option value="Block">Block Process</option>
                                    <option value="Alert">Alert Only</option>
                                    <option value="Screenshot">Take Screenshot</option>
                                </select>
                            </div>

                            <button
                                onClick={handleCreate}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-bold mt-4 flex justify-center items-center gap-2"
                            >
                                <Save size={18} />
                                Save Policy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
