import { LayoutDashboard, Users, Shield, Server, Monitor, Share2, List, FileText, Brain, ShieldCheck, CreditCard, Settings, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import logo from '../assets/logo.png';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const { user, logout } = useAuth();
    const role = user?.role || 'Analyst';

    const allNavItems = [
        { name: 'Dashboard', path: '/status', icon: LayoutDashboard, roles: ['SuperAdmin', 'TenantAdmin'] },
        { name: 'My Dashboard', path: '/my-dashboard', icon: LayoutDashboard, roles: ['Analyst'] },
        { name: 'Central Server', path: '/central-server', icon: Server, roles: ['SuperAdmin'] }, // Global Config
        { name: 'Users and Privileges', path: '/users', icon: Users, roles: ['SuperAdmin', 'TenantAdmin'] },
        { name: 'Tenants', path: '/tenants', icon: Share2, roles: ['SuperAdmin'] }, // Org Management
        { name: 'Agents', path: '/agents', icon: Monitor, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'] }, // Device Monitoring
        { name: 'Event Log', path: '/events', icon: List, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'] },
        { name: 'System Audit', path: '/audit', icon: ShieldCheck, roles: ['SuperAdmin', 'TenantAdmin'] },
        { name: 'Employee Pulse', path: '/productivity', icon: Brain, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'] },
        { name: 'Reports', path: '/reports', icon: FileText, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'] },
        { name: 'Billing', path: '/billing', icon: CreditCard, roles: ['TenantAdmin'] },
        { name: 'Settings', path: '/settings', icon: Settings, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'] },
        { name: 'DLP Policies', path: '/policies', icon: Shield, roles: ['SuperAdmin', 'TenantAdmin'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(role));

    return (
        <aside className={`
            w-64 glass-panel border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 font-mono
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900/60 -z-10"></div>

            <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 relative">
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:hover:text-white p-1"
                >
                    <X size={20} />
                </button>

                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 tracking-wider">
                    <div className="relative">
                        <img src={logo} alt="M" className="w-8 h-8 rounded-lg brightness-110" />
                        <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full"></div>
                    </div>
                    MONITORIX
                </h1>
                <p className="text-[10px] text-cyan-600 dark:text-cyan-500/80 mt-1 uppercase tracking-[0.2em] ml-10">System Secure</p>

                <div className="mt-4 px-3 py-2 bg-gray-100 dark:bg-gray-900/80 rounded border border-gray-200 dark:border-gray-800 inline-flex items-center gap-2 w-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 uppercase font-bold tracking-wider truncate">
                        {user?.username} :: {role}
                    </span>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-md text-xs font-bold transition-all group border ${isActive
                                ? 'bg-cyan-50/50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30'
                                : 'text-gray-500 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-200 dark:hover:border-gray-700'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={`w-4 h-4 transition-colors ${item.name === 'Employee Pulse' ? 'group-hover:text-purple-500 dark:group-hover:text-purple-400' : 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400'}`} />
                                <span className="uppercase tracking-wide truncate">{item.name}</span>
                                {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]"></div>}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3 bg-gray-50 dark:bg-black/20">
                <div className="bg-white dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-800 p-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full"></div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Active Session scope</p>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center font-bold text-purple-600 dark:text-purple-400 text-xs shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                            {user?.tenantId ? 'T' : 'G'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate w-32">
                                {user?.tenantId ? 'Tenant' : 'Global'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-800 rounded py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all"
                    >
                        Disconnect
                    </button>
                </div>
            </div>
        </aside>
    );
}
