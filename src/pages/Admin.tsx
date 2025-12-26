import { Shield, Lock, Mail, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

interface UserDto {
    id: number;
    username: string;
    role: string;
    tenantId: number | null;
    tenantName?: string;
}

export default function Admin() {
    const [users, setUsers] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();
    // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5140";

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/api/users`, {
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

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <Shield className="text-purple-500" />
                    User Management
                </h1>
                <p className="text-gray-400 mt-2">Manage platform access, roles, and global configurations.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Management Panel */}
                <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users className="text-blue-400" size={20} />
                            Users List
                        </h2>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
                            + Invite User
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Tenant</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 text-gray-300">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-4 text-center">Loading users...</td></tr>
                                ) : users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                                    {(user.username || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-sm">{user.username}</p>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Mail size={10} />
                                                        {user.username}@watchsec.io
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs border ${user.role === 'SuperAdmin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                user.role === 'TenantAdmin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    'bg-gray-700 text-gray-400 border-gray-600'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-gray-300">
                                                {user.tenantName || (user.role === 'SuperAdmin' ? 'Global' : 'Unknown')}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400 hover:text-white cursor-pointer">
                                            Edit
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Security Settings Panel */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-6 h-fit">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                        <Lock className="text-green-400" size={20} />
                        Security Policy
                    </h2>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Enforce 2FA</p>
                                <p className="text-xs text-gray-400">Require two-factor auth for all admins</p>
                            </div>
                            <div className="w-10 h-5 bg-green-600 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow"></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">SSO Enforcement</p>
                                <p className="text-xs text-gray-400">Only allow login via Corporate IdP</p>
                            </div>
                            <div className="w-10 h-5 bg-gray-600 rounded-full relative cursor-pointer">
                                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow"></div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-700">
                            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition-colors">
                                View Audit Logs
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
