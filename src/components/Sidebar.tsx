import { LayoutDashboard, Users, Shield, Server, Monitor, Mail, Share2, Image, Mic, List, FileText } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
    const { user } = useAuth();
    const role = user?.role || 'Analyst';

    const allNavItems = [
        { name: 'Status Monitor', path: '/status', icon: LayoutDashboard, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'] },
        { name: 'Central Server', path: '/central-server', icon: Server, roles: ['SuperAdmin'] }, // Global Config
        { name: 'Users and Privileges', path: '/users', icon: Users, roles: ['SuperAdmin', 'TenantAdmin'] },
        { name: 'Tenants', path: '/tenants', icon: Share2, roles: ['SuperAdmin'] }, // Org Management
        { name: 'Agents', path: '/agents', icon: Monitor, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'] }, // Device Monitoring
        { name: 'Mail Processing', path: '/mail', icon: Mail, roles: ['SuperAdmin', 'TenantAdmin'] },
        { name: 'ICAP Server', path: '/icap', icon: Share2, roles: ['SuperAdmin', 'TenantAdmin'] },
        { name: 'Image Recognition', path: '/image-recognition', icon: Image, roles: ['SuperAdmin', 'TenantAdmin'] },
        { name: 'Speech Recognition', path: '/speech-recognition', icon: Mic, roles: ['SuperAdmin', 'TenantAdmin'] },
        { name: 'Event Log', path: '/events', icon: List, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'] },
        { name: 'Reports', path: '/reports', icon: FileText, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'] },
        { name: 'DLP Policies', path: '/policies', icon: Shield, roles: ['SuperAdmin', 'TenantAdmin'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(role));

    return (
        <aside className="w-64 bg-gray-900 border-r border-gray-800 h-screen flex flex-col fixed left-0 top-0">
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-xl font-bold text-blue-500 flex items-center gap-2">
                    <Shield className="w-8 h-8" />
                    Watch Sec
                </h1>
                <p className="text-xs text-gray-400 mt-1">Enterprise EDR</p>
                <div className="mt-2 px-2 py-1 bg-gray-800 rounded border border-gray-700 inline-block">
                    <span className="text-[10px] text-gray-300 uppercase font-bold tracking-wider">
                        {user?.username} ({role})
                    </span>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 min-w-[20px]" />
                        <span className="font-medium text-sm truncate">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Current Tenant</p>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center font-bold text-white">
                            {user?.tenantId ? 'T' : 'G'}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">
                                {user?.tenantId ? 'Tenant Scope' : 'Global Scope'}
                            </p>
                            <p className="text-[10px] text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                Active
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
