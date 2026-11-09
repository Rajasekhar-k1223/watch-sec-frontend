import { Trash2, Lock, ShieldAlert, X, Edit, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Tenant {
    id: number;
    name: string;
    apiKey: string;
    plan: string;
    AgentlessEnabled?: boolean;
    agentlessEnabled?: boolean;
    AgentLimit?: number;
}

function getTenantProp(t: any, key: string) {
    if (key === 'apiKey') return t.apiKey || t.ApiKey || t.api_key;
    if (key === 'name') return t.name || t.Name;
    if (key === 'plan') return t.plan || t.Plan;
    if (key === 'id') return t.id || t.Id;
    if (key === 'agentLimit') return t.agentLimit || t.AgentLimit || 50;
    return '';
}

export default function Tenants() {
    const { token } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTenantName, setNewTenantName] = useState("");
    const [newTenantPlan, setNewTenantPlan] = useState("Starter");

    // Edit Tenant & Plan State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<{ id: number; name: string; plan: string; agentLimit: number } | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    
    // [v2.6.0] Monitorix Lockdown State
    const [isLockdownModalOpen, setIsLockdownModalOpen] = useState(false);
    const [targetTenant, setTargetTenant] = useState<{ id: number, name: string } | null>(null);
    const [unlockKey, setUnlockKey] = useState("");
    const [isLocking, setIsLocking] = useState(false);

    useEffect(() => {
        if (token) {
            fetchTenants();
        }
    }, [token]);

    const fetchTenants = async () => {
        try {
            const res = await fetch(`${API_URL}/tenants`, {
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
        if (!newTenantName.trim()) {
            toast.error("Please enter a tenant name");
            return;
        }

        setIsCreating(true);
        try {
            const res = await fetch(`${API_URL}/tenants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newTenantName.trim(), plan: newTenantPlan })
            });
            if (res.ok) {
                setNewTenantName("");
                setNewTenantPlan("Starter");
                fetchTenants(); // Refresh list
                toast.success(`Tenant '${newTenantName}' created successfully with ${newTenantPlan} plan!`);
            } else {
                toast.error("Failed to create tenant");
            }
        } catch (e) {
            toast.error("Failed to create tenant");
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTenant) return;
        setIsSavingEdit(true);
        try {
            const res = await fetch(`${API_URL}/tenants/${editingTenant.id}?agent_limit=${editingTenant.agentLimit}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    Name: editingTenant.name,
                    Plan: editingTenant.plan
                })
            });
            if (res.ok) {
                toast.success(`Tenant '${editingTenant.name}' plan updated to ${editingTenant.plan}!`);
                setIsEditModalOpen(false);
                fetchTenants();
            } else {
                toast.error("Failed to update tenant details");
            }
        } catch (e) {
            toast.error("Network error during tenant update");
        } finally {
            setIsSavingEdit(false);
        }
    };

    const [lockdownReason, setLockdownReason] = useState("");
    const [confirmationText, setConfirmationText] = useState("");

    const handleLockTenant = async () => {
        if (!targetTenant || !unlockKey || !lockdownReason) return;
        if (confirmationText !== targetTenant.name) {
            toast.error("Confirmation failed: Please type the exact tenant name.");
            return;
        }
        
        setIsLocking(true);
        try {
            const res = await fetch(`${API_URL}/remediation/lock-tenant/${targetTenant.id}`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    unlock_key: unlockKey,
                    reason: lockdownReason 
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Monitorix Lockdown triggered for ${data.nodesAffected} nodes.`, {
                    style: { background: '#1e1b4b', color: '#fff', border: '1px solid #4338ca' },
                    icon: '🔒'
                });
                setIsLockdownModalOpen(false);
                setUnlockKey("");
                setLockdownReason("");
                setConfirmationText("");
            } else {
                const err = await res.json();
                toast.error(`Lockdown Failed: ${err.detail || 'Unknown error'}`);
            }
        } catch (e) {
            toast.error("Network error during tenant lockdown.");
        } finally {
            setIsLocking(false);
        }
    };

    return (
        <div className="p-4 md:p-8 animate-fade-in transition-colors text-gray-900 dark:text-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Tenant Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage customer organizations and API access.</p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <input
                        type="text"
                        placeholder="New Tenant Name"
                        className="flex-1 min-w-[160px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        value={newTenantName}
                        onChange={e => setNewTenantName(e.target.value)}
                    />
                    <select
                        value={newTenantPlan}
                        onChange={e => setNewTenantPlan(e.target.value)}
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                        <option value="Starter">Starter (5 Nodes)</option>
                        <option value="Professional">Professional (50 Nodes)</option>
                        <option value="Enterprise">Enterprise (1,000 Nodes)</option>
                        <option value="Sovereign">Sovereign (Unlimited)</option>
                    </select>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 font-medium whitespace-nowrap text-sm shadow-sm"
                    >
                        {isCreating ? "Creating..." : "+ Add Tenant"}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[580px]">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm uppercase font-semibold">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Tenant Name</th>
                            <th className="p-4">API Key (Secrets)</th>
                            <th className="p-4">Plan & Quota</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-gray-300 divide-y divide-gray-200 dark:divide-gray-700">
                        {tenants.map(tenant => (
                            <tr key={getTenantProp(tenant, 'id')} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 text-gray-500">#{getTenantProp(tenant, 'id')}</td>
                                <td className="p-4 font-bold text-gray-900 dark:text-white">{getTenantProp(tenant, 'name')}</td>
                                <td className="p-4">
                                    <code className="text-blue-600 dark:text-yellow-500 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded w-fit select-all text-xs font-mono border border-gray-300 dark:border-gray-700">
                                        {getTenantProp(tenant, 'apiKey')}
                                    </code>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getTenantProp(tenant, 'plan') === 'Enterprise' ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'}`}>
                                        {getTenantProp(tenant, 'plan')} ({getTenantProp(tenant, 'agentLimit')} Nodes)
                                    </span>
                                </td>
                                <td className="p-4 flex items-center gap-2">
                                    <button 
                                        onClick={() => {
                                            setEditingTenant({
                                                id: Number(getTenantProp(tenant, 'id')),
                                                name: getTenantProp(tenant, 'name'),
                                                plan: getTenantProp(tenant, 'plan') || 'Starter',
                                                agentLimit: Number(getTenantProp(tenant, 'agentLimit')) || 50
                                            });
                                            setIsEditModalOpen(true);
                                        }}
                                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-bold text-xs uppercase bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800"
                                        title="Edit Tenant & Plan"
                                    >
                                        Edit Plan
                                    </button>
                                    <button 
                                        onClick={() => window.location.hash = `/policies?tenantId=${getTenantProp(tenant, 'id')}`}
                                        className="text-blue-500 hover:text-blue-600 font-bold text-xs uppercase"
                                    >
                                        Config
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            if(confirm(`Permanently decommission tenant ${getTenantProp(tenant, 'name')}?`)) {
                                                const res = await fetch(`${API_URL}/tenants/${getTenantProp(tenant, 'id')}`, {
                                                    method: 'DELETE',
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                });
                                                if(res.ok) { toast.success("Tenant successfully deleted"); fetchTenants(); }
                                                else { toast.error("Failed to delete tenant"); }
                                            }
                                        }}
                                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                                        title="Decommission Tenant"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setTargetTenant({ id: Number(getTenantProp(tenant, 'id')), name: getTenantProp(tenant, 'name') });
                                            setIsLockdownModalOpen(true);
                                        }}
                                        className="text-red-500 hover:text-red-600 transition-all flex items-center gap-1 group bg-red-500/10 px-2 py-1 rounded border border-red-500/20"
                                        title="LOCK ENTIRE TENANT"
                                    >
                                        <Lock size={14} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Lock All</span>
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            // The API returns it now because it's a column in Tenant model
                                            const isCurrentlyEnabled = !!(tenant.AgentlessEnabled ?? tenant.agentlessEnabled);
                                            const nextState = !isCurrentlyEnabled;
                                            
                                            try {
                                                const res = await fetch(`${API_URL}/tenants/${getTenantProp(tenant, 'id')}/agentless?enabled=${nextState}`, {
                                                    method: 'PUT',
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                });
                                                if (res.ok) {
                                                    toast.success(`Agentless ${nextState ? 'Enabled' : 'Disabled'} for ${getTenantProp(tenant, 'name')}`);
                                                    fetchTenants();
                                                } else {
                                                    toast.error("Failed to toggle feature");
                                                }
                                            } catch(e) { toast.error("Network error"); }
                                        }}
                                        className={`transition-all flex items-center gap-1 group px-2 py-1 rounded border ${
                                            (tenant.AgentlessEnabled || tenant.agentlessEnabled) 
                                                ? 'text-emerald-500 hover:text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
                                                : 'text-gray-500 hover:text-gray-600 bg-gray-500/10 border-gray-500/20'
                                        }`}
                                        title="Toggle Agentless Access"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-tighter">
                                            {(tenant.AgentlessEnabled || tenant.agentlessEnabled) ? 'Agentless: ON' : 'Agentless: OFF'}
                                        </span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
                {tenants.length === 0 && (
                    <div className="p-12 text-center text-gray-500 border-t border-dashed border-gray-200 dark:border-gray-700">
                        No tenants found. Create one above!
                    </div>
                )}
            </div>

            {/* [v2.6.0] Monitorix Lockdown Modal */}
            {isLockdownModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 border border-red-500/30 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl shadow-red-500/20">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 ring-1 ring-red-500/20">
                                    <ShieldAlert size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Tenant Lockdown</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Monitorix Asset Neutralization</p>
                                </div>
                            </div>
                            <button onClick={() => { setIsLockdownModalOpen(false); setUnlockKey(""); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                                <p className="text-xs text-red-500/80 leading-relaxed font-medium">
                                    <b>CRITICAL ACTION:</b> This will force <b>ALL agents</b> belonging to <b className="text-red-600">{targetTenant?.name}</b> into a secure hibernate state. 
                                    Assets will remain <b>locked at the kernel level</b> until the unlock key is provided.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex justify-between items-center">
                                    Establish Unlock Key
                                    <button 
                                        onClick={() => {
                                            const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
                                            let key = "";
                                            for(let i=0; i<16; i++) {
                                                if (i > 0 && i % 4 === 0) key += "-";
                                                key += chars.charAt(Math.floor(Math.random() * chars.length));
                                            }
                                            setUnlockKey(key);
                                            toast.success("16-Char Secure Key Generated", { icon: "🔑" });
                                        }}
                                        className="text-blue-500 hover:text-blue-600 font-bold hover:underline"
                                    >
                                        Generate
                                    </button>
                                </label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={unlockKey}
                                        onChange={(e) => setUnlockKey(e.target.value)}
                                        placeholder="Enter secure unlock password..."
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                                    />
                                    {unlockKey && (
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(unlockKey);
                                                toast.success("Key copied to clipboard");
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded"
                                        >
                                            Copy
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Justification (Audit Log)</label>
                                <textarea 
                                    value={lockdownReason}
                                    onChange={(e) => setLockdownReason(e.target.value)}
                                    placeholder="Explain why this lockdown is necessary..."
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/50 outline-none transition-all min-h-[80px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Step-Up Confirmation</label>
                                <input 
                                    type="text"
                                    value={confirmationText}
                                    onChange={(e) => setConfirmationText(e.target.value)}
                                    placeholder={`Type "${targetTenant?.name}" to confirm`}
                                    className="w-full bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-red-300"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => { setIsLockdownModalOpen(false); setUnlockKey(""); setLockdownReason(""); setConfirmationText(""); }}
                                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleLockTenant}
                                    disabled={!unlockKey || !lockdownReason || confirmationText !== targetTenant?.name || isLocking}
                                    className={`flex-1 px-6 py-3 bg-red-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-red-500/40 hover:bg-red-500 transition-all flex items-center justify-center gap-2 ${(!unlockKey || !lockdownReason || confirmationText !== targetTenant?.name || isLocking) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isLocking ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Lock size={14} />}
                                    Initiate Global Lock
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Tenant & Plan Configuration Modal */}
            {isEditModalOpen && editingTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3 border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <Edit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Tenant & Plan Configuration</h3>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateTenant} className="space-y-4 text-xs font-medium">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1 font-semibold">Tenant Legal Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editingTenant.name}
                                    onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1 font-semibold">Subscription Plan Tier</label>
                                <select
                                    value={editingTenant.plan}
                                    onChange={(e) => {
                                        const p = e.target.value;
                                        const limits: Record<string, number> = { "Starter": 5, "Professional": 50, "Enterprise": 1000, "Sovereign": 100000 };
                                        setEditingTenant({ ...editingTenant, plan: p, agentLimit: limits[p] || 50 });
                                    }}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                                >
                                    <option value="Starter">Starter Plan (5 Endpoint Nodes)</option>
                                    <option value="Professional">Professional Plan (50 Endpoint Nodes)</option>
                                    <option value="Enterprise">Enterprise Plan (1,000 Endpoint Nodes)</option>
                                    <option value="Sovereign">Sovereign Cluster (Unlimited Fleet)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1 font-semibold">Max Agent Node Quota</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="500000"
                                    required
                                    value={editingTenant.agentLimit}
                                    onChange={(e) => setEditingTenant({ ...editingTenant, agentLimit: Number(e.target.value) })}
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingEdit}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-sm"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{isSavingEdit ? 'Saving...' : 'Save Plan Changes'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
