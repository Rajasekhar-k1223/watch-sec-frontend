import { Shield, Lock, Mail, Users, Activity, Key, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL, SOCKET_URL } from '../config';
import { io } from 'socket.io-client';

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

export default function Admin() {
    const [users, setUsers] = useState<UserDto[]>([]);
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [tenant, setTenant] = useState<TenantDto | null>(null);
    const [loading, setLoading] = useState(true);
    const { token, user } = useAuth();
    const navigate = useNavigate();

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
        </div>
    );
}
