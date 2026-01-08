import { LayoutDashboard, Users, Shield, Server, Monitor, Share2, List, FileText, Brain, ShieldCheck, CreditCard, Settings, Sun, Moon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
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
        <aside className="w-64 bg-white/90 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col fixed left-0 top-0 z-50 transition-all">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800/50 bg-gray-50/50 dark:bg-black/20">
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500 flex items-center gap-2">
                    <Shield className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                    Watch Sec
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">Enterprise EDR v2.1.0-FIXED</p>
                <div className="mt-3 px-3 py-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 inline-flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] text-gray-600 dark:text-gray-300 uppercase font-bold tracking-wider">
                        {user?.username} ({role})
                    </span>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${isActive
                                ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white hover:translate-x-1'
                            }`
                        }
                    >

                        <item.icon className="w-5 h-5 min-w-[20px]" />
                        <span className="font-medium text-sm truncate">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Appearance</span>
                    {theme === 'dark' ? (
                        <Moon className="w-4 h-4 text-purple-400" />
                    ) : (
                        <Sun className="w-4 h-4 text-orange-500" />
                    )}
                </button>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Current Tenant</p>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center font-bold text-white">
                            {user?.tenantId ? 'T' : 'G'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate w-32">
                                {user?.tenantId ? 'Tenant Scope' : 'Global Scope'}
                            </p>
                            <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                Active
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/20 rounded-md py-1.5 text-xs font-bold transition-all"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </aside>
    );
}
