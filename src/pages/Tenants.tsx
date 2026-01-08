import { useEffect, useState } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

interface Tenant {
    id: number;
    name: string;
    apiKey: string;
    plan: string;
}

function getTenantProp(t: any, key: string) {
    if (key === 'apiKey') return t.apiKey || t.ApiKey || t.api_key;
    if (key === 'name') return t.name || t.Name;
    if (key === 'plan') return t.plan || t.Plan;
    if (key === 'id') return t.id || t.Id;
    return '';
}

export default function Tenants() {
    const { token } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTenantName, setNewTenantName] = useState("");

    // Toggle for Mock Mode
    // Toggle for Mock Mode
    const USE_MOCK = false;
    // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5140";

    useEffect(() => {
        if (!USE_MOCK && token) {
            fetchTenants();
        }
    }, [token]);

    const fetchTenants = async () => {
        try {
            const res = await fetch(`${API_URL}/api/tenants`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTenants(data);
            }
        } catch (e) {
            console.error("Failed to fetch tenants", e);
        }
    };

    const handleCreate = async () => {
        if (!newTenantName) return;

        setIsCreating(true);
        try {
            const res = await fetch(`${API_URL}/api/tenants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newTenantName, plan: "Starter" })
            });
            if (res.ok) {
                setNewTenantName("");
                fetchTenants(); // Refresh list
            }
        } catch (e) {
            alert("Failed to create tenant");
        }
        setIsCreating(false);
    };

    return (
        <div>
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Tenant Management</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage customer organizations and API access.</p>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="New Tenant Name"
                        className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                        value={newTenantName}
                        onChange={e => setNewTenantName(e.target.value)}
                    />
                    <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                        {isCreating ? "Creating..." : "+ Add Tenant"}
                    </button>
                </div>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-900/50 text-gray-400 text-sm uppercase font-semibold">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Tenant Name</th>
                            <th className="p-4">API Key (Secrets)</th>
                            <th className="p-4">Plan</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-300 divide-y divide-gray-700">
                        {tenants.map(tenant => (
                            <tr key={getTenantProp(tenant, 'id')} className="hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 text-gray-500">#{getTenantProp(tenant, 'id')}</td>
                                <td className="p-4 font-bold text-white">{getTenantProp(tenant, 'name')}</td>
                                <td className="p-4">
                                    <code className="text-yellow-500 bg-gray-900 px-2 py-1 rounded w-fit select-all text-xs font-mono border border-gray-700">
                                        {getTenantProp(tenant, 'apiKey')}
                                    </code>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getTenantProp(tenant, 'plan') === 'Enterprise' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                        {getTenantProp(tenant, 'plan')}
                                    </span>
                                </td>
                                <td className="p-4 text-blue-400 cursor-pointer hover:text-blue-300 font-medium text-sm">
                                    Config
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {tenants.length === 0 && (
                    <div className="p-12 text-center text-gray-500 border-t border-dashed border-gray-700">
                        No tenants found. Create one above!
                    </div>
                )}
            </div>


        </div>
    );
}
