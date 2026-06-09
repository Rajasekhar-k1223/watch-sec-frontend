import { LayoutDashboard, Users, Shield, Server, Monitor, Share2, List, FileText, Brain, ShieldCheck, CreditCard, Settings, X, Image, Mic, ShieldAlert, Lock, Activity, Wifi, Mail, Package, Target, ShieldOff, Crosshair, SlidersHorizontal } from 'lucide-react';
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

    const tierLevels: Record<string, number> = {
        'Starter': 1,
        'Professional': 2,
        'Pro': 2,
        'Enterprise': 3,
        'Unlimited': 100
    };
    const currentTier = tierLevels[user?.plan || 'Starter'] || 1;

    const allNavItems = [
        { name: 'Dashboard', path: '/status', icon: LayoutDashboard, roles: ['SuperAdmin', 'TenantAdmin'], minTier: 1 },
        { name: 'My Insights', path: '/my-dashboard', icon: LayoutDashboard, roles: ['Analyst'], minTier: 1 },
        { name: 'Central Command', path: '/central-server', icon: Server, roles: ['SuperAdmin'], minTier: 1 },
        { name: 'Access Control', path: '/users', icon: Users, roles: ['SuperAdmin', 'TenantAdmin'], minTier: 1 },
        { name: 'Tenants', path: '/tenants', icon: Share2, roles: ['SuperAdmin'], minTier: 1 },
        { name: 'Asset Management', path: '/agents', icon: Monitor, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 1 },
        { name: 'Email Forensics', path: '/mail', icon: Mail, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 1 },
        { name: 'Security Logs', path: '/events', icon: List, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 1 },
        { name: 'System Audit', path: '/audit', icon: ShieldCheck, roles: ['SuperAdmin', 'TenantAdmin'], minTier: 1 },
        { name: 'Engagement Analytics', path: '/employee-pulse', icon: Brain, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 1 },
        { name: 'Human Intelligence', path: '/human-intelligence', icon: Brain, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 1 },
        { name: 'Performance Intel', path: '/productivity', icon: Activity, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 1 },
        { name: 'Network Analytics', path: '/bandwidth', icon: Wifi, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 1 },
        { name: 'Executive Reports', path: '/reports', icon: FileText, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 1 },
        { name: 'Infrastructure Map', path: '/architecture', icon: Share2, roles: ['SuperAdmin', 'TenantAdmin'], minTier: 1 },
        { name: 'AI Security Copilot', path: '/ai-copilot', icon: Brain, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 1 },

        { name: 'Billing', path: '/billing', icon: CreditCard, roles: ['TenantAdmin'], minTier: 1 },
        { name: 'Software Requests', path: '/software-requests', icon: Package, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 1 },
        { name: 'Settings', path: '/settings', icon: Settings, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 1 },
        { name: 'DLP Policies', path: '/policies', icon: Shield, roles: ['SuperAdmin', 'TenantAdmin'], minTier: 2 }, // Pro
        { name: 'Threat Resilience', path: '/vulnerabilities', icon: ShieldAlert, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 3 }, // Ent
        { name: 'YARA Malware Scanner', path: '/yara-scanner', icon: ShieldAlert, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 3 }, // Ent
        { name: 'Visual Intelligence', path: '/image-recognition', icon: Image, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 1 },
        { name: 'Acoustic Forensic', path: '/speech-recognition', icon: Mic, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 3 }, // Ent
        { name: 'Threat Hunting', path: '/threat-hunting', icon: Crosshair, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 3 }, // Ent
        { name: 'Ransomware Shield', path: '/ransomware', icon: ShieldOff, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 3 }, // Ent
        { name: 'Zero Trust Engine', path: '/zero-trust', icon: Target, roles: ['SuperAdmin', 'TenantAdmin', 'Analyst'], minTier: 3 }, // Ent
        { name: 'Bandwidth Settings', path: '/bandwidth-settings', icon: SlidersHorizontal, roles: ['SuperAdmin', 'TenantAdmin'], minTier: 2 }, // Pro
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(role));

    return (
        <aside className={`
            w-72 glass-card border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-500 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            {/* Ambient Background Element */}
            <div className="absolute inset-0 bg-slate-50/40 dark:bg-black/40 -z-10 backdrop-blur-3xl"></div>

            <div className="p-8 border-b border-slate-200 dark:border-slate-800/50 relative">
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="md:hidden absolute right-6 top-6 text-slate-500 hover:text-slate-900 dark:hover:text-white p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-blue-500/30 blur-xl group-hover:bg-blue-500/50 transition-all duration-700 rounded-full"></div>
                        <img src={logo} alt="M" className="w-10 h-10 rounded-2xl relative z-10 brightness-110 shadow-2xl" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-[0.3em] uppercase leading-none">
                            Monitorix
                        </h1>
                        <span className="text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-sm mt-1 inline-block tracking-widest uppercase">Enterprise</span>
                    </div>
                </div>

                <div className="px-4 py-3 bg-slate-900/5 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-slate-800/50 flex items-center gap-3 group transition-all hover:bg-slate-900/10 dark:hover:bg-white/10">
                    <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] text-slate-900 dark:text-white font-black uppercase tracking-widest truncate">
                            {user?.username}
                        </p>
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] truncate mt-0.5">
                            {role} // {user?.plan || 'Standard'}
                        </p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                <div className="mb-4 px-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Fleet Operations</p>
                </div>
                {navItems.map((item) => {
                    const isLocked = item.minTier > currentTier && role !== 'SuperAdmin';

                    if (isLocked) {
                        return (
                            <div key={item.path} className="relative group/lock cursor-not-allowed">
                                <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] text-slate-400/50 border border-transparent bg-slate-50/50 dark:bg-slate-900/20 transition-all grayscale opacity-50">
                                    <item.icon className="w-4 h-4 opacity-40" />
                                    <span className="truncate">{item.name}</span>
                                    <div className="ml-auto">
                                        <Lock size={12} className="opacity-40" />
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all group border ${isActive
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xl shadow-slate-500/20'
                                    : 'text-slate-500 dark:text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={`w-4 h-4 transition-all duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    <span className="truncate">{item.name}</span>
                                    {isActive && (
                                        <div className="ml-auto flex gap-1">
                                            <div className="w-1 h-1 rounded-full bg-current opacity-20 animate-pulse"></div>
                                            <div className="w-1 h-1 rounded-full bg-current opacity-40 animate-pulse delay-75"></div>
                                            <div className="w-1 h-1 rounded-full bg-current opacity-60 animate-pulse delay-150"></div>
                                        </div>
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-black/20">
                <div className="glass-card bg-white dark:bg-slate-900/40 p-5 relative overflow-hidden group">
                    <div className="absolute top-[-20%] right-[-20%] w-24 h-24 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                    
                    <div className="flex items-center justify-between mb-4">
                         <p className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em]">Runtime Scope</p>
                         <div className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20">
                             v2.1
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-xs shadow-2xl">
                            {user?.tenantId ? 'T' : 'G'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest truncate">
                                {user?.tenantId ? 'Tenant Node' : 'Global Hub'}
                            </p>
                            <p className="text-[8px] text-slate-500 font-black uppercase tracking-tight mt-0.5">Encrypted Tunnel</p>
                        </div>
                    </div>

                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 hover:border-red-500 rounded-xl py-3.5 text-[10px] uppercase font-black tracking-[0.2em] transition-all shadow-xl active:scale-95"
                    >
                        Disconnect
                    </button>
                </div>
            </div>
        </aside>
    );
}
