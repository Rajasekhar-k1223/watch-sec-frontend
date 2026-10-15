import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Shield, Server, Monitor, List, FileText, Brain, Settings, X, ShieldAlert, Wifi, Mail, Package, Target, Crosshair, Zap, AlertTriangle, Search, FileCheck, HelpCircle, Activity, Globe, Share2, Map as MapIcon, Database, Gauge, Lock, PackageSearch, Image as ImageIcon, Mic, Key, Bot, History, LineChart, PieChart, Briefcase, Building, Download, CreditCard, Cpu, ScrollText, ChevronDown, ChevronRight, Terminal, Network, Radar, Fingerprint, UserCheck, LogOut, PanelLeftClose, PanelLeft } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export default function Sidebar({ isOpen = false, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
    const { user, logout } = useAuth();
    const location = useLocation();
    
    // Track which accordion categories are open
    const [openCategories, setOpenCategories] = useState<string[]>(['COMMAND CENTER']);
    
    // Define navigation categories based on the user's image
    const navCategories = [
        {
            title: 'COMMAND CENTER',
            categoryIcon: Terminal,
            color: 'blue-500',
            bgLight: 'bg-blue-50/50',
            items: [
                { name: 'Dashboard', path: '/status', icon: LayoutDashboard },
                { name: 'Central Server', path: '/central-server', icon: Monitor },
                { name: 'Active Agents', path: '/agents', icon: Server, badge: 12 },
                { name: 'Incidents', path: '/incidents', icon: AlertTriangle, badge: 8 },
                { name: 'Detection Alerts', path: '/alerts', icon: List, badge: 24 },
                { name: 'Vulnerabilities', path: '/vulnerabilities', icon: Target, badge: 5 },
            ]
        },
        {
            title: 'ASSET & INFRASTRUCTURE',
            categoryIcon: Network,
            color: 'teal-400',
            bgLight: 'bg-teal-50/50',
            items: [
                { name: 'Asset Management', path: '/fleet-inventory', icon: Package },
                { name: 'Fleet Management', path: '/fleet-map', icon: Globe },
                { name: 'Network Analytics', path: '/bandwidth', icon: Wifi },
                { name: 'Network Topology', path: '/architecture', icon: Share2 },
                { name: 'Infrastructure Map', path: '/infrastructure-map', icon: MapIcon },
                { name: 'Agentless Assets', path: '/agentless', icon: Database },
                { name: 'Policies', path: '/policies', icon: FileCheck },
                { name: 'Bandwidth Management', path: '/bandwidth-settings', icon: Gauge },
            ]
        },
        {
            title: 'THREAT INTELLIGENCE',
            categoryIcon: Radar,
            color: 'amber-500',
            bgLight: 'bg-amber-50/50',
            items: [
                { name: 'Threat Intelligence', path: '/threat-intelligence', icon: ShieldAlert },
                { name: 'Attack Chains & Correlation', path: '/attack-chains', icon: Network, badge: 2 },
                { name: 'Threat Hunting', path: '/threat-hunting', icon: Crosshair },
                { name: 'Cyber Range', path: '/cyber-range', icon: Crosshair },
                { name: 'YARA Scanner', path: '/yara-scanner', icon: Search },
                { name: 'Ransomware Protection', path: '/ransomware', icon: Lock },
                { name: 'Sandbox Analysis', path: '/sandbox', icon: PackageSearch },
                { name: 'Visual Intelligence', path: '/image-recognition', icon: ImageIcon },
                { name: 'Human Intelligence', path: '/human-intelligence', icon: Users },
            ]
        },
        {
            title: 'SECURITY & FORENSICS',
            categoryIcon: Fingerprint,
            color: 'fuchsia-500',
            bgLight: 'bg-fuchsia-50/50',
            items: [
                { name: 'Security Logs', path: '/security-logs', icon: ScrollText },
                { name: 'System Audit', path: '/audit', icon: Activity },
                { name: 'Email Security', path: '/mail', icon: Mail },
                { name: 'Email Forensics', path: '/email-forensics', icon: Search },
                { name: 'Acoustic Forensics', path: '/speech-recognition', icon: Mic },
                { name: 'DLP', path: '/dlp', icon: Shield },
                { name: 'Incident Forensics', path: '/incident-forensics', icon: History },
            ]
        },
        {
            title: 'IDENTITY & ZERO TRUST',
            categoryIcon: UserCheck,
            color: 'indigo-400',
            bgLight: 'bg-indigo-50/50',
            items: [
                { name: 'Identity & Access', path: '/identity', icon: Key },
                { name: 'User Identity', path: '/user-identity', icon: Users },
                { name: 'Zero Trust', path: '/zero-trust', icon: Shield },
            ]
        },
        {
            title: 'SECURITY OPERATIONS',
            categoryIcon: Zap,
            color: 'cyan-400',
            bgLight: 'bg-cyan-50/50',
            items: [
                { name: 'SOAR Playbooks', path: '/playbooks', icon: Zap },
                { name: 'Security Automation', path: '/automation', icon: Bot },
                { name: 'Audit Trail', path: '/audit-trail', icon: History },
                { name: 'Security Reports', path: '/reports', icon: FileText },
            ]
        },
        {
            title: 'INTELLIGENCE & ANALYTICS',
            categoryIcon: Brain,
            color: 'purple-500',
            bgLight: 'bg-purple-50/50',
            items: [
                { name: 'Performance Analytics', path: '/performance', icon: LineChart },
                { name: 'Engagement Analytics', path: '/productivity', icon: PieChart },
                { name: 'Executive Intelligence', path: '/executive', icon: Briefcase },
                { name: 'AI Security Copilot', path: '/ai-copilot', icon: Brain },
            ]
        },
        {
            title: 'ADMINISTRATION',
            categoryIcon: Settings,
            color: 'sky-400',
            bgLight: 'bg-sky-50/50',
            items: [
                { name: 'Users & Roles', path: '/users', icon: Users },
                { name: 'Tenants', path: '/tenants', icon: Building },
                { name: 'Software Requests', path: '/software-requests', icon: Download },
                { name: 'Billing', path: '/billing', icon: CreditCard },
                { name: 'Settings', path: '/settings', icon: Settings },
            ]
        },
        {
            title: 'PLATFORM',
            categoryIcon: Cpu,
            color: 'lime-400',
            bgLight: 'bg-lime-50/50',
            items: [
                { name: 'Runtime Scope', path: '/runtime-scope', icon: Cpu },
                { name: 'Platform Status', path: '/platform-status', icon: Activity },
            ]
        }
    ];

    // Auto-expand the category that contains the active route
    useEffect(() => {
        const activeCategory = navCategories.find(cat => 
            cat.items.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))
        );
        
        if (activeCategory && !openCategories.includes(activeCategory.title)) {
            setOpenCategories(prev => [...prev, activeCategory.title]);
        }
    }, [location.pathname]); // Only depend on location to expand automatically when navigating
    
    const toggleCategory = (title: string) => {
        setOpenCategories(prev => prev.includes(title) ? [] : [title]);
    };

    return (
        <aside className={`
            ${isCollapsed ? 'w-20' : 'w-64'} bg-white h-screen flex flex-col fixed left-0 top-0 z-50 transition-all duration-500 ease-in-out border-r border-slate-200 shadow-2xl shadow-slate-200/50
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            {/* Logo Area */}
            <div className="p-4 relative">
                <button
                    onClick={onClose}
                    className="md:hidden absolute right-4 top-5 text-slate-400 hover:text-slate-800 p-2"
                >
                    <X size={18} />
                </button>
                
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/30 ring-1 ring-blue-500/50 shrink-0">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col whitespace-nowrap overflow-hidden">
                                <span className="text-sm font-bold text-slate-800 tracking-wider">MONITORIX</span>
                                <span className="text-[9px] text-blue-400 font-bold tracking-[0.2em] uppercase">
                                    BY ELSEA
                                </span>
                            </div>
                        )}
                    </div>
                    {onToggleCollapse && !isCollapsed && (
                        <button 
                            onClick={onToggleCollapse} 
                            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Collapse Sidebar"
                        >
                            <span className="text-xs font-bold leading-none -mt-0.5">«</span>
                        </button>
                    )}
                    {onToggleCollapse && isCollapsed && (
                        <button 
                            onClick={onToggleCollapse} 
                            className="hidden md:flex absolute -right-3 top-6 items-center justify-center w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg border border-white transition-colors z-50"
                            title="Expand Sidebar"
                        >
                            <span className="text-xs font-bold leading-none -mt-0.5">»</span>
                        </button>
                    )}
                </div>

                {!isCollapsed && (
                    <>
                        {/* Tenant Box */}
                        <div className="px-3 py-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200 mb-3 group cursor-pointer hover:border-slate-300 transition-colors">
                            <div className="flex items-center gap-3">
                                <LayoutDashboard className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-800 font-bold tracking-widest uppercase">ENTERPRISE SOC</span>
                                    <span className="text-[10px] text-slate-500">Tenant: TenantAdmin</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                <ChevronDown size={14} className="text-slate-500" />
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative flex items-center bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 mb-2 group">
                            <Search className="w-4 h-4 text-slate-500 mr-2 group-focus-within:text-blue-400 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search menu..." 
                                className="bg-transparent border-none outline-none text-xs text-slate-800 w-full placeholder-slate-400"
                            />
                            <div className="flex items-center gap-1 shrink-0">
                                <kbd className="text-[9px] text-slate-500 font-mono bg-slate-200/80 px-1.5 py-0.5 rounded">Ctrl</kbd>
                                <kbd className="text-[9px] text-slate-500 font-mono bg-slate-200/80 px-1.5 py-0.5 rounded">K</kbd>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Navigation */}
            <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-3'} py-2 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden pb-10`}>
                {navCategories.map((category, idx) => {
                    const isCategoryOpen = !isCollapsed && (category.title === '' || openCategories.includes(category.title));
                    
                    const hasActiveChild = category.items.some(item => 
                        location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                    );

                    // If open or active, we might want to show the full background
                    const isBoxActive = isCategoryOpen || hasActiveChild;

                    return (
                        <div 
                            key={idx} 
                            className={`flex flex-col relative group/cat rounded-xl transition-all duration-300 overflow-hidden ${
                                isBoxActive && !isCollapsed ? category.bgLight : 'bg-white'
                            } ${!isCollapsed ? 'border border-slate-200' : ''}`}
                        >
                            {category.title && (
                                <button 
                                    onClick={() => {
                                        if (isCollapsed && onToggleCollapse) {
                                            onToggleCollapse();
                                            setTimeout(() => toggleCategory(category.title), 300);
                                        } else {
                                            toggleCategory(category.title);
                                        }
                                    }}
                                    className={`group w-full flex items-center ${isCollapsed ? 'justify-center p-3 rounded-xl bg-[#0a1122] border border-slate-200' : 'justify-between px-3 py-3'} text-left transition-all duration-300 ${
                                        !isCollapsed && `border-l-[3px] border-${category.color}`
                                    }`}
                                    title={isCollapsed ? category.title : undefined}
                                >
                                    <div className="flex items-center gap-3">
                                        <category.categoryIcon className={`w-4 h-4 transition-colors shrink-0 text-${category.color} ${isCollapsed && hasActiveChild ? `drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]` : ''}`} />
                                        {!isCollapsed && (
                                            <span className={`text-[11px] font-bold uppercase tracking-wide transition-colors whitespace-nowrap text-${category.color}`}>
                                                {category.title}
                                            </span>
                                        )}
                                    </div>
                                    {!isCollapsed && (
                                        <div className="flex items-center gap-2">
                                            {/* Category count badge */}
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                                                {category.items.length}
                                            </span>
                                            <span className={`transition-transform duration-300 text-slate-500 ${isCategoryOpen ? 'rotate-180' : ''}`}>
                                                <ChevronDown size={14} />
                                            </span>
                                        </div>
                                    )}
                                </button>
                            )}
                            
                            <div className={`grid transition-all duration-300 ease-in-out ${
                                isCategoryOpen 
                                ? 'grid-rows-[1fr] opacity-100' 
                                : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                            }`}>
                                <div className="overflow-hidden flex flex-col pb-2">
                                    {!isCollapsed && category.items.map((item) => {
                                    // Cast item to any to check for badge which we dynamically added
                                    const itemWithBadge = item as any;
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) =>
                                                `group/item relative flex items-center justify-between mx-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-300 whitespace-nowrap overflow-hidden ${
                                                    isActive
                                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-500/50'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }`
                                            }
                                            title={item.name}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className={`w-[18px] h-[18px] transition-transform duration-300 group-hover/item:scale-110 shrink-0 opacity-80`} />
                                                <span className="tracking-wide">{item.name}</span>
                                            </div>
                                            {itemWithBadge.badge && (
                                                <span className="flex items-center justify-center px-1.5 min-w-[20px] h-5 rounded-full bg-[#ef4444] text-[10px] font-bold text-white shadow-sm">
                                                    {itemWithBadge.badge}
                                                </span>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Platform Status and Logout */}
            <div className="p-4 bg-slate-50 flex flex-col gap-3 relative z-10 border-t border-slate-200">
                {!isCollapsed && (
                    <div className="flex items-center justify-between overflow-hidden whitespace-nowrap transition-all duration-300">
                        <div className="flex items-center gap-3">
                            <div className="relative flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-emerald-500/20">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-blue-500 uppercase tracking-widest font-bold">Platform Status</span>
                                <span className="text-[11px] text-emerald-400 font-medium">All Systems Operational</span>
                                <span className="text-[9px] text-slate-500 mt-0.5">Last updated: Sep 30, 2026 16:42</span>
                            </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-500" />
                    </div>
                )}
                
                <button
                    onClick={logout}
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'} py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300`}
                    title={isCollapsed ? "Logout" : undefined}
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="text-xs font-semibold uppercase tracking-wider">Sign Out</span>}
                </button>
            </div>
        </aside>
    );
}
