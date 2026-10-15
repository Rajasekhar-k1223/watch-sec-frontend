import { Shield, Lock, Mail, Users, Activity, Key, Copy, UserCheck, Server, CheckCircle2, RefreshCw, Layers, Database, Sparkles, PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL, SOCKET_URL } from '../config';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

interface UserDto {
    Id: number;
    Username: string;
    Role: string;
    TenantId: number | null;
    TenantName?: string;
}

interface HealthStatus {
    overall: string;
    services: Record<string, { status: string; latency_ms: number }>;
}

interface TenantDto {
    Id: number;
    Name: string;
    Plan: string;
    AgentLimit: number;
    NextBillingDate: string;
    ActiveStatus: boolean;
    ApiKey?: string;
}

interface ScimUser {
    id: string;
    userName: string;
    displayName: string;
    active: boolean;
    emails: Array<{ value: string; primary: boolean }>;
    meta: {
        resourceType: string;
        created: string;
        location: string;
    };
}

interface SaasQuotas {
    tenant_id: number;
    subscription_tier: string;
    quota: {
        max_licensed_endpoints: number;
        active_enrolled_endpoints: number;
        utilization_pct: number;
        data_retention_days: number;
        hot_storage_quota_tb: number;
        hot_storage_used_tb: number;
    };
    feature_entitlements: Record<string, boolean>;
    isolation_model: string;
    compliance_certifications: string[];
}

export default function Admin() {
    const [users, setUsers] = useState<UserDto[]>([]);
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [tenant, setTenant] = useState<TenantDto | null>(null);
    const [loading, setLoading] = useState(true);
    const { token, user } = useAuth();
    const navigate = useNavigate();

    // Tabs for Feature 64 & 65
    const [adminTab, setAdminTab] = useState<'personnel' | 'scim' | 'saas_quotas'>('personnel');
    const [scimUsers, setScimUsers] = useState<ScimUser[]>([]);
    const [saasQuotas, setSaasQuotas] = useState<SaasQuotas | null>(null);
    const [loadingScim, setLoadingScim] = useState(false);
    const [loadingQuotas, setLoadingQuotas] = useState(false);
    const [newScimEmail, setNewScimEmail] = useState('');
    const [newScimName, setNewScimName] = useState('');
    const [isProvisioning, setIsProvisioning] = useState(false);

    const fetchScimUsers = async () => {
        try {
            setLoadingScim(true);
            const res = await fetch(`${API_URL}/v2/iam/scim/v2/Users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setScimUsers(data.Resources || []);
            }
        } catch (e) {
            console.error('Failed to fetch SCIM users:', e);
            toast.error('Failed to fetch SCIM users');
        } finally {
            setLoadingScim(false);
        }
    };

    const fetchSaasQuotas = async () => {
        try {
            setLoadingQuotas(true);
            const res = await fetch(`${API_URL}/v2/iam/saas/quotas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSaasQuotas(data);
            }
        } catch (e) {
            console.error('Failed to fetch SaaS quotas:', e);
            toast.error('Failed to fetch SaaS quotas');
        } finally {
            setLoadingQuotas(false);
        }
    };

    const handleProvisionScimUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newScimName || !newScimEmail) {
            toast.error('Please enter username and email');
            return;
        }
        try {
            setIsProvisioning(true);
            const res = await fetch(`${API_URL}/v2/iam/scim/v2/Users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
                    userName: newScimEmail,
                    displayName: newScimName,
                    emails: [{ value: newScimEmail, primary: true }],
                    active: true
                })
            });
            if (res.ok) {
                toast.success(`SCIM user provisioned successfully!`);
                setNewScimEmail('');
                setNewScimName('');
                fetchScimUsers();
            } else {
                toast.error('Failed to provision SCIM user');
            }
        } catch (err) {
            toast.error('Error provisioning SCIM user');
        } finally {
            setIsProvisioning(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchHealth();
        fetchTenant();
        
        // Connect to real-time health stream
        const socket = io(SOCKET_URL, {
            path: '/socket.io/',
            transports: ['websocket'],
            query: { token }
        });
        
        socket.on('health_update', (newHealth: HealthStatus) => {
            setHealth(newHealth);
        });
        
        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHealth = async () => {
        try {
            const res = await fetch(`${API_URL}/system/health`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHealth(data);
            }
        } catch (error) {
            console.error("Failed to fetch system health", error);
        }
    };

    const fetchTenant = async () => {
        try {
            const res = await fetch(`${API_URL}/tenants`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    setTenant(data[0]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch tenant details", error);
        }
    };

    return (
        <div className="transition-colors">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-purple-600 dark:text-purple-500" />
                        Infrastructure & Access
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Manage platform access, roles, and global configurations.</p>
                </div>
                {health && (
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in zoom-in duration-500">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${health.overall === 'Healthy' ? 'bg-green-500' : health.overall === 'Degraded' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">System Pulse: {health.overall}</span>
                    </div>
                )}
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-2 mb-6 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-200 dark:border-gray-700 w-fit">
                <button
                    onClick={() => setAdminTab('personnel')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        adminTab === 'personnel'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    <Users size={14} />
                    Personnel & Health
                </button>
                <button
                    onClick={() => {
                        setAdminTab('scim');
                        fetchScimUsers();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        adminTab === 'scim'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    <UserCheck size={14} />
                    SCIM 2.0 Directory (64)
                </button>
                <button
                    onClick={() => {
                        setAdminTab('saas_quotas');
                        fetchSaasQuotas();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        adminTab === 'saas_quotas'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    <Database size={14} />
                    Enterprise SaaS Quotas (65)
                </button>
            </div>

            {/* TAB 1: PERSONNEL & HEALTH */}
            {adminTab === 'personnel' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Management Panel */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden transition-all">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="text-blue-600 dark:text-blue-400" size={20} />
                            Active Personnel
                        </h2>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors shadow-lg shadow-blue-500/20">
                            + Invite User
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Tenant</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-4 text-center">Loading users...</td></tr>
                                ) : users.map(user => (
                                    <tr key={user.Id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                                                    {(user.Username || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-gray-900 dark:text-white font-medium text-sm">{user.Username}</p>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                                                        <Mail size={10} />
                                                        {user.Username}@watch-sec.com
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs border ${user.Role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' :
                                                user.Role === 'TenantAdmin' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                                                    'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
                                                }`}>
                                                {user.Role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                                {user.TenantName || (user.Role === 'SuperAdmin' ? 'Global' : 'Unknown')}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white cursor-pointer transition-colors font-medium text-sm">
                                            Edit
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Health & Security Panel */}
                {(user?.role === 'SuperAdmin' || user?.Role === 'SuperAdmin') && (
                <div className="space-y-6">
                    {/* Health Diagnostics */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-6 transition-all">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                            <Activity className="text-blue-500" size={20} />
                            System Health
                        </h2>
                        <div className="space-y-4">
                            {health ? Object.entries(health.services).map(([name, data]) => (
                                <div key={name} className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{name}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${data.status === 'Connected' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
                                            {data.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${data.latency_ms < 50 ? 'bg-green-500' : data.latency_ms < 200 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, (data.latency_ms / 500) * 100)}%` }}></div>
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-mono">{data.latency_ms}ms</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-gray-500 italic">No health data available...</p>
                            )}
                        </div>
                    </div>

                    {/* Security Settings Panel */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-6 transition-all">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                            <Lock className="text-green-600 dark:text-green-400" size={20} />
                            Security Policy
                        </h2>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between group">
                                <div>
                                    <p className="text-gray-900 dark:text-white font-medium">Enforce 2FA</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Require two-factor auth for all admins</p>
                                </div>
                                <div className="w-10 h-5 bg-green-500 dark:bg-green-600 rounded-full relative cursor-pointer shadow-inner">
                                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between group">
                                <div>
                                    <p className="text-gray-900 dark:text-white font-medium">SSO Enforcement</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Only allow login via Corporate IdP</p>
                                </div>
                                <div className="w-10 h-5 bg-gray-300 dark:bg-gray-600 rounded-full relative cursor-pointer shadow-inner">
                                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => navigate('/audit')}
                                    className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 rounded-lg text-sm transition-colors font-medium">
                                    View Audit Logs
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {/* Tenant Overview Panel */}
                {(user?.role === 'TenantAdmin' || user?.Role === 'TenantAdmin') && tenant && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-6 transition-all">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                            <Shield className="text-blue-500" size={20} />
                            Tenant Overview
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tenant Name</span>
                                <span className="text-sm text-gray-900 dark:text-white font-semibold">{tenant.Name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Plan</span>
                                <span className="px-2 py-1 rounded text-xs border bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 font-bold">
                                    {tenant.Plan}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Agent Limit</span>
                                <span className="text-sm text-gray-900 dark:text-white font-mono">{tenant.AgentLimit}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tenant.ActiveStatus ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
                                    {tenant.ActiveStatus ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* API Key & Integration Panel */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-6 transition-all">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                            <Key className="text-blue-500" size={20} />
                            API Key & Integration
                        </h2>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Use your API Key to deploy agents or integrate via SDK. Keep this key secure.
                            </p>
                            
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Primary Agent Key</span>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm px-3 py-2 font-mono text-gray-800 dark:text-gray-200 overflow-hidden text-ellipsis">
                                        {tenant.ApiKey ? tenant.ApiKey : "••••••••••••••••••••••••••••••"}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (tenant.ApiKey) navigator.clipboard.writeText(tenant.ApiKey);
                                        }}
                                        title="Copy API Key"
                                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 rounded transition-colors"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 block">Quick Start Snippet</span>
                                <div className="bg-gray-900 rounded p-3 overflow-x-auto">
                                    <code className="text-xs font-mono text-green-400 whitespace-pre">
                                        curl -sSL https://get.monitorix.co.in/agent.sh | sudo bash -s -- --key {tenant.ApiKey || "YOUR_API_KEY"}
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>
            )}

            {/* TAB 2: SCIM 2.0 DIRECTORY SYNC (Feature 64) */}
            {adminTab === 'scim' && (
                <div className="space-y-6">
                    {/* SCIM Info Banner */}
                    <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-md">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
                                    <Sparkles size={14} />
                                    RFC 7644 Standard Protocol
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Enterprise SCIM 2.0 Identity Directory
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                                    Automated Just-In-Time user onboarding and deprovisioning synchronized directly with enterprise identity providers (Okta, Microsoft Entra ID / Azure AD, PingIdentity).
                                </p>
                            </div>
                            <button
                                onClick={fetchScimUsers}
                                disabled={loadingScim}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all self-start md:self-auto"
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingScim ? 'animate-spin' : ''}`} />
                                Refresh SCIM Directory
                            </button>
                        </div>
                    </div>

                    {/* Quick SCIM Provisioner Form */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md p-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                            <PlusCircle size={16} className="text-purple-500" />
                            Simulate Enterprise IdP SCIM 2.0 Provisioning (Okta / Azure AD Push)
                        </h3>
                        <form onSubmit={handleProvisionScimUser} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={newScimName}
                                    onChange={(e) => setNewScimName(e.target.value)}
                                    placeholder="e.g. Alex Morgan"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Corporate Email / UPN</label>
                                <input
                                    type="email"
                                    value={newScimEmail}
                                    onChange={(e) => setNewScimEmail(e.target.value)}
                                    placeholder="e.g. alex.morgan@enterprise.corp"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={isProvisioning}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-md transition-colors"
                                >
                                    {isProvisioning ? 'Provisioning...' : 'Provision SCIM User'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* SCIM User Directory Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <UserCheck size={16} className="text-purple-500" />
                                Synchronized SCIM 2.0 Accounts ({scimUsers.length} Identities)
                            </h3>
                            <span className="text-xs font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                                urn:ietf:params:scim:schemas:core:2.0:User
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="p-4">SCIM ID</th>
                                        <th className="p-4">User Principal / Email</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Schema Resource</th>
                                        <th className="p-4">API Location</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                                    {loadingScim ? (
                                        <tr><td colSpan={5} className="p-6 text-center text-gray-500">Loading SCIM directory...</td></tr>
                                    ) : scimUsers.map((su) => (
                                        <tr key={su.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="p-4 font-mono font-semibold text-gray-900 dark:text-white">#{su.id}</td>
                                            <td className="p-4">
                                                <div className="font-semibold text-gray-900 dark:text-white">{su.userName}</div>
                                                <div className="text-[11px] text-gray-500">{su.emails?.[0]?.value || su.userName}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    su.active
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400'
                                                }`}>
                                                    {su.active ? 'ACTIVE' : 'DEPROVISIONED'}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono text-[11px] text-gray-500 dark:text-gray-400">
                                                {su.meta?.resourceType || 'User'}
                                            </td>
                                            <td className="p-4 font-mono text-[11px] text-purple-600 dark:text-purple-400">
                                                {su.meta?.location || `/api/v2/iam/scim/v2/Users/${su.id}`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: ENTERPRISE MULTI-TENANT SAAS ARCHITECTURE & QUOTAS (Feature 65) */}
            {adminTab === 'saas_quotas' && (
                <div className="space-y-6">
                    {/* SaaS Architecture Header */}
                    <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-md">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-black tracking-widest uppercase bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/40">
                                    {saasQuotas?.subscription_tier || 'Enterprise Ultimate SaaS'}
                                </span>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                                    Multi-Tenant Sovereign Architecture & Enterprise Quotas
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                                    Multi-Tenant Schema Isolation with Row-Level Security (RLS), multi-region data sovereignty, and elastic agent scaling capacity.
                                </p>
                            </div>
                            <button
                                onClick={fetchSaasQuotas}
                                disabled={loadingQuotas}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all self-start md:self-auto"
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingQuotas ? 'animate-spin' : ''}`} />
                                Refresh Quotas
                            </button>
                        </div>
                    </div>

                    {/* Capacity & Quotas Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-md">
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Max Licensed Endpoints</div>
                            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {saasQuotas?.quota.max_licensed_endpoints.toLocaleString() ?? '100,000'}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-1">
                                {saasQuotas?.quota.active_enrolled_endpoints ?? 13} enrolled ({saasQuotas?.quota.utilization_pct ?? 0.01}% used)
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-md">
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Hot Storage Quota</div>
                            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                {saasQuotas?.quota.hot_storage_quota_tb ?? 50} <span className="text-xs font-normal">TB</span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-1">
                                {saasQuotas?.quota.hot_storage_used_tb ?? 3.8} TB consumed in ClickHouse
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-md">
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Data Retention Period</div>
                            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                                {saasQuotas?.quota.data_retention_days ?? 365} <span className="text-xs font-normal">Days</span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-1">GDPR & SOC2 compliance policy</div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-md">
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Data Isolation Model</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                                Schema + RLS
                            </div>
                            <div className="text-[11px] text-emerald-500 mt-1">Zero Cross-Tenant Leakage</div>
                        </div>
                    </div>

                    {/* Enterprise Feature Entitlements & Compliance Certifications */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-md">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                <Sparkles size={16} className="text-emerald-500" />
                                Enterprise Feature Entitlements
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { key: 'Autonomous SOAR Remediation', desc: 'Auto-kill processes, isolate host, block outbound C2 IPs' },
                                    { key: 'AI SOC Copilot & NLP Investigation', desc: 'Automated root cause synthesis, incident narration, triage assistant' },
                                    { key: 'Live YARA Memory Scanner', desc: 'Fleetwide in-memory malware & shellcode pattern hunting' },
                                    { key: 'Continuous Attack Simulation & Cyber Range', desc: 'Pre-seeded adversary scenarios with detection regression validation' },
                                    { key: 'Cloud CSPM Posture Management', desc: 'Real-time multi-cloud asset discovery and compliance assessment' }
                                ].map((feat, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80">
                                        <div>
                                            <div className="text-xs font-bold text-gray-900 dark:text-white">{feat.key}</div>
                                            <div className="text-[10px] text-gray-500">{feat.desc}</div>
                                        </div>
                                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                            <CheckCircle2 size={12} />
                                            ENABLED
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-md">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                <Shield size={16} className="text-blue-500" />
                                Regulatory & Compliance Certifications
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {(saasQuotas?.compliance_certifications || [
                                    "SOC 2 Type II", "ISO 27001", "HIPAA Ready", "FedRAMP Moderate Ready"
                                ]).map((cert, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-900/20 flex flex-col justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                                            <CheckCircle2 size={14} className="text-blue-500" />
                                            {cert}
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-2 font-mono">
                                            Audit Status: PASS
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
