import { Trash2, Lock, ShieldAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

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
    
    // [v2.6.0] Monitorix Lockdown State
    const [isLockdownModalOpen, setIsLockdownModalOpen] = useState(false);
    const [targetTenant, setTargetTenant] = useState<{ id: number, name: string } | null>(null);
    const [unlockKey, setUnlockKey] = useState("");
    const [isLocking, setIsLocking] = useState(false);

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
        if (!newTenantName) return;

        setIsCreating(true);
        try {
            const res = await fetch(`${API_URL}/tenants`, {
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
                toast.success("Tenant created successfully!");
            } else {
                toast.error("Failed to create tenant");
            }
        } catch (e) {
            toast.error("Failed to create tenant");
        } finally {
            setIsCreating(false);
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
        <div className="p-8 animate-fade-in transition-colors text-gray-900 dark:text-white">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tenant Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage customer organizations and API access.</p>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="New Tenant Name"
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                        value={newTenantName}
                        onChange={e => setNewTenantName(e.target.value)}
                    />
                    <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 font-medium"
                    >
                        {isCreating ? "Creating..." : "+ Add Tenant"}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm uppercase font-semibold">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Tenant Name</th>
                            <th className="p-4">API Key (Secrets)</th>
                            <th className="p-4">Plan</th>
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
                                        {getTenantProp(tenant, 'plan')}
                                    </span>
                                </td>
                                <td className="p-4 flex items-center gap-3">
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
                                                if(res.ok) { toast.success("Tenant deleted"); fetchTenants(); }
                                            }
                                        }}
                                        className="text-red-400 hover:text-red-600 transition-colors"
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
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {tenants.length === 0 && (
                    <div className="p-12 text-center text-gray-500 border-t border-dashed border-gray-200 dark:border-gray-700">
                        No tenants found. Create one above!
                    </div>
                )}
            </div>

            {/* [v2.6.0] Monitorix Lockdown Modal */}
            {isLockdownModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 border border-red-500/30 rounded-2xl max-w-md w-full p-8 shadow-2xl shadow-red-500/20">
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
        </div>
    );
}
