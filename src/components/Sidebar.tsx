import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    LayoutDashboard, Users, Shield, Server, Monitor, List, FileText, Brain, Settings, X, 
    ShieldAlert, Wifi, Mail, Package, Target, Crosshair, Zap, AlertTriangle, Search, 
    FileCheck, Activity, Globe, Share2, Map as MapIcon, Database, Gauge, Lock, 
    PackageSearch, Image as ImageIcon, Mic, Key, Bot, History, LineChart, PieChart, 
    Briefcase, Building, Download, CreditCard, Cpu, ScrollText, ChevronDown, ChevronRight, 
    Terminal, Network, Radar, Fingerprint, UserCheck, LogOut, LayoutGrid, ShieldCheck,
    Radio, Layers, FlaskConical, GitBranch, Cloud, Boxes, Scale, Eye
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export default function Sidebar({ isOpen = false, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
    const { user, logout } = useAuth();
    const { t } = useI18n();
    const location = useLocation();
    const searchInputRef = useRef<HTMLInputElement>(null);

    const getCategoryTitle = (rawTitle: string): string => {
        switch(rawTitle) {
            case 'COMMAND CENTER': return t('nav_command_center', 'COMMAND CENTER');
            case 'ASSET & INFRASTRUCTURE': return t('nav_asset_infrastructure', 'ASSET & INFRASTRUCTURE');
            case 'INTELLIGENCE & RESEARCH': return t('nav_intelligence_research', 'INTELLIGENCE & RESEARCH');
            case 'ADMINISTRATION': return t('nav_administration', 'ADMINISTRATION');
            case 'COMMERCIAL & MDR': return t('nav_saas_commercial', 'COMMERCIAL & MDR');
            default: return rawTitle;
        }
    };

    const getItemName = (rawName: string): string => {
        switch(rawName) {
            case 'Global Compliance Center': return t('nav_compliance', 'Global Compliance Center');
            case 'Data Loss & Ingestion Health': return t('nav_data_loss', 'Data Loss & Ingestion Health');
            case 'SOC Command Center': return t('nav_soc', 'SOC Command Center');
            case 'Analyst Work Queue': return t('nav_queue', 'Analyst Work Queue');
            case 'Dashboard': return t('nav_dashboard', 'Dashboard');
            case 'Central Server': return t('nav_central_server', 'Central Server');
            case 'Active Agents': return t('nav_active_agents', 'Active Agents');
            case 'Incidents': return t('nav_incidents', 'Incidents');
            case 'Detection Alerts': return t('nav_alerts', 'Detection Alerts');
            case 'Vulnerabilities': return t('nav_vulnerabilities', 'Vulnerabilities');
            case 'Fleet Location Map': return t('nav_fleet_map', 'Fleet Location Map');
            case 'Threat Hunting Lab': return t('nav_threat_hunting', 'Threat Hunting Lab');
            case 'Detonation Sandbox': return t('nav_sandbox', 'Detonation Sandbox');
            case 'External Attack Surface': return t('nav_easm', 'External Attack Surface');
            case 'Web & API Security (WAAP)': return t('nav_waap', 'Web & API Security (WAAP)');
            case 'Data Loss Prevention (DLP)': return t('nav_dlp', 'Data Loss Prevention (DLP)');
            default: return rawName;
        }
    };
    
    // Track which accordion categories are open - default to COMMAND CENTER
    const [openCategories, setOpenCategories] = useState<string[]>(['COMMAND CENTER']);
    const [searchQuery, setSearchQuery] = useState('');

    // Global keyboard shortcut: Ctrl+K or Cmd+K focuses search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    // Navigation categories with signature colors & exact item counts matching Screen 1
    const navCategories = [
        {
            title: 'COMMAND CENTER',
            categoryIcon: Terminal,
            iconColor: 'text-blue-600',
            titleColor: 'text-blue-600',
            count: 10,
            items: [
                { name: 'Global Compliance Center', path: '/compliance', icon: Scale, badge: '32-REG', badgeColor: 'bg-blue-600' },
                { name: 'Data Loss & Ingestion Health', path: '/data-loss-monitoring', icon: ShieldCheck, badge: 'P0', badgeColor: 'bg-emerald-600' },
                { name: 'SOC Command Center', path: '/soc', icon: Radio, badge: '24/7', badgeColor: 'bg-blue-600' },
                { name: 'Analyst Work Queue', path: '/soc/queue', icon: Activity, badge: 8, badgeColor: 'bg-rose-500' },
                { name: 'Dashboard', path: '/status', icon: LayoutDashboard },
                { name: 'Central Server', path: '/central-server', icon: Monitor },
                { name: 'Active Agents', path: '/agents', icon: Server, badge: 12, badgeColor: 'bg-rose-500' },
                { name: 'Incidents', path: '/incidents', icon: AlertTriangle, badge: 8, badgeColor: 'bg-rose-500' },
                { name: 'Detection Alerts', path: '/alerts', icon: List, badge: 24, badgeColor: 'bg-rose-500' },
                { name: 'Vulnerabilities', path: '/vulnerabilities', icon: Target, badge: 5, badgeColor: 'bg-rose-500' },
            ]
        },
        {
            title: 'ASSET & INFRASTRUCTURE',
            categoryIcon: Network,
            iconColor: 'text-slate-800',
            titleColor: 'text-slate-800',
            count: 19,
            items: [
                { name: 'Breach Emulation (BAS)', path: '/attack-validation', icon: Target, badge: 'P0', badgeColor: 'bg-rose-600' },
                { name: 'Self-Protection & Tamper', path: '/platform-protection', icon: ShieldAlert, badge: 'P0', badgeColor: 'bg-rose-600' },
                { name: 'Network Detection (NDR)', path: '/ndr', icon: Radio, badge: 'P0', badgeColor: 'bg-teal-600' },
                { name: 'Supply-Chain Security', path: '/supply-chain', icon: Package, badge: 'P0', badgeColor: 'bg-purple-600' },
                { name: 'Kubernetes Security', path: '/kubernetes-security', icon: Boxes, badge: 'P0', badgeColor: 'bg-cyan-600' },
                { name: 'Database Security (DAM)', path: '/database-security', icon: Database, badge: 'P0', badgeColor: 'bg-emerald-600' },
                { name: 'Secrets Security', path: '/secrets', icon: Key, badge: 'P0', badgeColor: 'bg-amber-600' },
                { name: 'Data Security (DSPM)', path: '/dspm', icon: Database, badge: 'P0', badgeColor: 'bg-indigo-600' },
                { name: 'Web & API Security (WAAP)', path: '/waap', icon: Shield, badge: 'P0', badgeColor: 'bg-emerald-600' },
                { name: 'Attack Surface (EASM)', path: '/easm', icon: Globe, badge: 'P0', badgeColor: 'bg-orange-600' },
                { name: 'Cloud Security (CNAPP)', path: '/cloud/cnapp', icon: Cloud, badge: 'P0', badgeColor: 'bg-cyan-600' },
                { name: 'Asset Management', path: '/fleet-inventory', icon: Package },
                { name: 'Fleet Map', path: '/fleet-map', icon: Globe },
                { name: 'Network Analytics', path: '/bandwidth', icon: Wifi },
                { name: 'Network Topology', path: '/architecture', icon: Share2 },
                { name: 'Infrastructure Map', path: '/infrastructure-map', icon: MapIcon },
                { name: 'Agentless Assets', path: '/agentless', icon: Database },
                { name: 'Policies', path: '/policies', icon: FileCheck },
                { name: 'Bandwidth Control', path: '/bandwidth-settings', icon: Gauge },
            ]
        },
        {
            title: 'THREAT INTELLIGENCE',
            categoryIcon: Radar,
            iconColor: 'text-amber-500',
            titleColor: 'text-amber-500',
            count: 13,
            items: [
                { name: 'Honeypots & Deception', path: '/deception', icon: Eye, badge: 'P0', badgeColor: 'bg-blue-600' },
                { name: 'Malware Lab (Sandbox)', path: '/malware-lab', icon: PackageSearch, badge: 'P0', badgeColor: 'bg-purple-600' },
                { name: 'Security Research Lab', path: '/research', icon: FlaskConical, badge: 'v3.10', badgeColor: 'bg-violet-600' },
                { name: 'Global Threat Network', path: '/intelligence/global', icon: Globe, badge: 'v3.9', badgeColor: 'bg-teal-600' },
                { name: 'Threat Intelligence', path: '/threat-intelligence', icon: ShieldAlert },
                { name: 'Attack Chains', path: '/attack-chains', icon: Network, badge: 2, badgeColor: 'bg-rose-500' },
                { name: 'Threat Hunting', path: '/threat-hunting', icon: Crosshair },
                { name: 'Cyber Range', path: '/cyber-range', icon: Target },
                { name: 'YARA Scanner', path: '/yara-scanner', icon: Search },
                { name: 'Ransomware Shield', path: '/ransomware', icon: Lock },
                { name: 'Sandbox Analysis', path: '/sandbox', icon: PackageSearch },
                { name: 'Visual Intelligence', path: '/image-recognition', icon: ImageIcon },
                { name: 'Human Intelligence', path: '/human-intelligence', icon: Users },
            ]
        },
        {
            title: 'SECURITY & FORENSICS',
            categoryIcon: Fingerprint,
            iconColor: 'text-fuchsia-600',
            titleColor: 'text-fuchsia-600',
            count: 7,
            items: [
                { name: 'Security Logs', path: '/security-logs', icon: ScrollText },
                { name: 'System Audit', path: '/audit', icon: Activity },
                { name: 'Email Security', path: '/mail', icon: Mail },
                { name: 'Email Forensics', path: '/email-forensics', icon: Search },
                { name: 'Acoustic Forensics', path: '/speech-recognition', icon: Mic },
                { name: 'DLP Dashboard', path: '/dlp', icon: Shield },
                { name: 'Incident Forensics', path: '/incident-forensics', icon: History },
            ]
        },
        {
            title: 'IDENTITY & ZERO TRUST',
            categoryIcon: UserCheck,
            iconColor: 'text-indigo-600',
            titleColor: 'text-indigo-600',
            count: 4,
            items: [
                { name: 'Identity Threats (ITDR)', path: '/identity/threats', icon: ShieldAlert, badge: 'P0', badgeColor: 'bg-purple-600' },
                { name: 'Identity & Access', path: '/identity', icon: Key },
                { name: 'User Identity', path: '/user-identity', icon: Users },
                { name: 'Zero Trust Network', path: '/zero-trust', icon: Shield },
            ]
        },
        {
            title: 'SECURITY OPERATIONS',
            categoryIcon: Zap,
            iconColor: 'text-cyan-600',
            titleColor: 'text-cyan-600',
            count: 6,
            items: [
                { name: 'MDR Operations', path: '/mdr', icon: Server, badge: 'MDR', badgeColor: 'bg-purple-600' },
                { name: 'Customer Security Portal', path: '/portal', icon: ShieldCheck },
                { name: 'SOAR Playbooks', path: '/playbooks', icon: Zap },
                { name: 'Security Automation', path: '/automation', icon: Bot },
                { name: 'Audit Trail', path: '/audit-trail', icon: History },
                { name: 'Security Reports', path: '/reports', icon: FileText },
            ]
        },
        {
            title: 'INTELLIGENCE & ANALYTICS',
            categoryIcon: Brain,
            iconColor: 'text-purple-600',
            titleColor: 'text-purple-600',
            count: 5,
            items: [
                { name: 'Autonomous Security', path: '/ai/autonomous', icon: Zap, badge: 'v3.8', badgeColor: 'bg-cyan-600' },
                { name: 'Performance Analytics', path: '/performance', icon: LineChart },
                { name: 'Productivity Pulse', path: '/productivity', icon: PieChart },
                { name: 'Executive Intel', path: '/executive', icon: Briefcase },
                { name: 'AI Security Copilot', path: '/ai-copilot', icon: Brain },
            ]
        },
        {
            title: 'ADMINISTRATION',
            categoryIcon: Settings,
            iconColor: 'text-slate-700',
            titleColor: 'text-slate-700',
            count: 5,
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
            superAdminOnly: true,
            categoryIcon: Cpu,
            iconColor: 'text-emerald-600',
            titleColor: 'text-emerald-600',
            count: 3,
            items: [
                { name: 'Release Gate', path: '/release-gate', icon: ShieldCheck, badge: '100%', badgeColor: 'bg-emerald-600' },
                { name: 'Runtime Scope', path: '/runtime-scope', icon: Cpu },
                { name: 'Platform Status', path: '/platform-status', icon: Activity },
            ]
        },
        {
            title: 'SAAS & GLOBAL ENTERPRISE',
            superAdminOnly: true,
            categoryIcon: Globe,
            iconColor: 'text-indigo-600',
            titleColor: 'text-indigo-600',
            count: 7,
            items: [
                { name: 'Global Security Platform', path: '/global/platform', icon: Globe, badge: 'v3.7', badgeColor: 'bg-emerald-600' },
                { name: 'Global Operations', path: '/global/operations', icon: Globe, badge: 'HA', badgeColor: 'bg-indigo-600' },
                { name: 'Organizations', path: '/admin/organizations', icon: Building },
                { name: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard },
                { name: 'Usage Metering', path: '/admin/usage', icon: Gauge },
                { name: 'Regional Mesh', path: '/admin/regions', icon: MapIcon },
                { name: 'Resource Quotas', path: '/admin/quotas', icon: Layers },
            ]
        },
        {
            title: 'ECOSYSTEM & MARKETPLACE',
            superAdminOnly: true,
            categoryIcon: Package,
            iconColor: 'text-violet-500',
            titleColor: 'text-violet-500',
            count: 3,
            items: [
                { name: 'Security Marketplace', path: '/marketplace', icon: Package, badge: 'v3.5', badgeColor: 'bg-violet-600' },
                { name: 'Integration Health', path: '/marketplace/integrations', icon: Activity },
                { name: 'Developer Portal', path: '/developers', icon: Terminal, badge: 'SDK', badgeColor: 'bg-emerald-600' },
            ]
        },
        {
            title: 'COMMERCIAL & LICENSING',
            superAdminOnly: true,
            categoryIcon: ShieldCheck,
            iconColor: 'text-emerald-500',
            titleColor: 'text-emerald-500',
            count: 7,
            items: [
                { name: 'Customer Commercial Portal', path: '/customer', icon: ShieldCheck, badge: 'P0', badgeColor: 'bg-blue-600' },
                { name: 'Partner / Reseller Hub', path: '/partner', icon: Briefcase, badge: 'RESELLER', badgeColor: 'bg-emerald-600' },
                { name: 'Admin Commercial Ops', path: '/admin/commercial', icon: Building, badge: 'ADMIN', badgeColor: 'bg-purple-600' },
                { name: 'Global MDR & MSSP', path: '/mssp', icon: Globe, badge: 'v3.11', badgeColor: 'bg-indigo-600' },
                { name: 'Customer Success', path: '/customer-success', icon: Users, badge: 'CS', badgeColor: 'bg-emerald-600' },
                { name: 'MDR 24/7 Operations', path: '/mdr', icon: Server, badge: 'SOC', badgeColor: 'bg-purple-600' },
                { name: 'Commercial Analytics', path: '/business/analytics', icon: LineChart, badge: 'ARR', badgeColor: 'bg-indigo-600' },
            ]
        },

        {
            title: 'CONTINUOUS EVOLUTION',
            superAdminOnly: true,
            categoryIcon: GitBranch,
            iconColor: 'text-indigo-400',
            titleColor: 'text-indigo-400',
            count: 2,
            items: [
                { name: 'Continuous Evolution', path: '/evolution', icon: GitBranch, badge: 'v18.0', badgeColor: 'bg-emerald-600' },
                { name: 'Release Governance', path: '/governance/releases', icon: ShieldCheck, badge: '13-Gates', badgeColor: 'bg-indigo-600' },
            ]
        }
    ];

    const isSuperAdmin = (user?.role || user?.Role || '').toLowerCase() === 'superadmin';

    // Role-filtered navigation categories (Domains 9-13 reserved for SuperAdmin)
    const visibleNavCategories = useMemo(() => {
        if (isSuperAdmin) return navCategories;
        return navCategories.filter(cat => !(cat as any).superAdminOnly);
    }, [isSuperAdmin]);

    // Filter categories based on search query
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return visibleNavCategories;
        const q = searchQuery.toLowerCase().trim();
        return visibleNavCategories
            .map(cat => ({
                ...cat,
                items: cat.items.filter(item => 
                    item.name.toLowerCase().includes(q) || item.path.toLowerCase().includes(q)
                )
            }))
            .filter(cat => cat.items.length > 0);
    }, [searchQuery, visibleNavCategories]);

    // Auto-expand category for current path or search
    useEffect(() => {
        if (searchQuery.trim()) {
            setOpenCategories(filteredCategories.map(c => c.title));
            return;
        }

        const activeCategory = visibleNavCategories.find(cat => 
            cat.items.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))
        );
        
        if (activeCategory && !openCategories.includes(activeCategory.title)) {
            setOpenCategories(prev => [...prev, activeCategory.title]);
        }
    }, [location.pathname, searchQuery, visibleNavCategories]);
    
    const toggleCategory = (title: string) => {
        setOpenCategories(prev => 
            prev.includes(title) 
                ? prev.filter(t => t !== title) 
                : [...prev, title]
        );
    };

    return (
        <aside className={`
            ${isCollapsed ? 'w-20' : 'w-64'} bg-white h-screen flex flex-col fixed left-0 top-0 z-50 
            transition-all duration-300 ease-in-out border-r border-slate-200/90 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            {/* Top Brand Header */}
            <div className={`p-4 border-b border-slate-100 flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'} relative`}>
                <button
                    onClick={onClose}
                    className="md:hidden absolute right-3 top-3 text-slate-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    <X size={18} />
                </button>
                
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0 ring-2 ring-blue-100">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col whitespace-nowrap overflow-hidden">
                            <span className="text-sm font-black tracking-wider text-slate-900 uppercase">
                                MONITORIX
                            </span>
                            <span className="text-[10px] font-extrabold tracking-widest text-blue-600 uppercase">
                                BY ELSEA
                            </span>
                        </div>
                    )}
                </div>

                {onToggleCollapse && !isCollapsed && (
                    <button 
                        onClick={onToggleCollapse} 
                        className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100/90 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                        title="Collapse Sidebar"
                    >
                        <span className="text-xs font-bold leading-none -mt-0.5">«</span>
                    </button>
                )}
                
                {onToggleCollapse && isCollapsed && (
                    <button 
                        onClick={onToggleCollapse} 
                        className="hidden md:flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors mt-1"
                        title="Expand Sidebar"
                    >
                        <span className="text-xs font-bold leading-none">»</span>
                    </button>
                )}
            </div>

            {!isCollapsed && (
                <>
                    {/* Organization / Tenant Switcher Card (Screen 1 Feature) */}
                    <div className="px-3 pt-3">
                        <div className="p-2.5 rounded-2xl bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/80 flex items-center justify-between transition-colors cursor-pointer group shadow-2xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/90 text-slate-500 flex items-center justify-center shrink-0 shadow-2xs group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col min-w-0 truncate">
                                    <span className="text-[11px] font-black text-slate-800 tracking-wider uppercase truncate">
                                        ENTERPRISE SOC
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium truncate">
                                        Tenant: {(user as any)?.tenant || (user?.tenantId ? `Tenant #${user.tenantId}` : 'TenantAdmin')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"></span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            </div>
                        </div>
                    </div>

                    {/* Search Filter Input with Ctrl+K */}
                    <div className="px-3 pt-2.5 pb-1">
                        <div className="relative flex items-center bg-slate-50/80 hover:bg-slate-100/70 rounded-xl border border-slate-200/90 px-3 py-2 group focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 transition-all shadow-2xs">
                            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 group-focus-within:text-blue-600 transition-colors shrink-0" />
                            <input 
                                ref={searchInputRef}
                                type="text" 
                                placeholder="Search menu..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs text-slate-800 w-full placeholder-slate-400 font-medium"
                            />
                            {searchQuery ? (
                                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 p-0.5">
                                    <X size={13} />
                                </button>
                            ) : (
                                <div className="hidden sm:flex items-center gap-1 opacity-70">
                                    <span className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 px-1 py-0.2 rounded shadow-2xs">Ctrl</span>
                                    <span className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 px-1 py-0.2 rounded shadow-2xs">K</span>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Navigation Menus List (Accordion without tree lines) */}
            <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-3'} py-2 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden`}>
                {filteredCategories.map((category, idx) => {
                    const isCategoryOpen = !isCollapsed && openCategories.includes(category.title);
                    const hasActiveChild = category.items.some(item => 
                        location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                    );

                    return (
                        <div key={idx} className="flex flex-col">
                            {/* Category Accordion Header */}
                            <button 
                                onClick={() => {
                                    if (isCollapsed && onToggleCollapse) {
                                        onToggleCollapse();
                                        setTimeout(() => toggleCategory(category.title), 200);
                                    } else {
                                        toggleCategory(category.title);
                                    }
                                }}
                                className={`w-full flex items-center ${
                                    isCollapsed 
                                        ? 'justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-2xs mb-1' 
                                        : 'justify-between px-2.5 py-2 hover:bg-slate-100/70 rounded-xl'
                                } text-left transition-all group`}
                                title={isCollapsed ? getCategoryTitle(category.title) : undefined}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <category.categoryIcon className={`w-4 h-4 shrink-0 ${category.iconColor}`} />
                                    {!isCollapsed && (
                                        <span className={`text-[11px] font-black uppercase tracking-wider truncate ${category.titleColor}`}>
                                            {getCategoryTitle(category.title)}
                                        </span>
                                    )}
                                </div>
                                {!isCollapsed && (
                                    <div className="flex items-center shrink-0 ml-1">
                                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                )}
                            </button>
                            
                            {/* Accordion Menu Items - CLEAN SUBMENU (NO TREE LINE, NO COUNT BADGES) */}
                            {(!isCollapsed && isCategoryOpen) && (
                                <div className="py-1 space-y-0.5 pl-1 pr-1">
                                    {category.items.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => {
                                                if (window.innerWidth < 768 && onClose) {
                                                    onClose();
                                                }
                                            }}
                                            className={({ isActive }) =>
                                                `group/item flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                                                    isActive
                                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                                                }`
                                            }
                                        >
                                            {({ isActive }) => (
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <item.icon className={`w-4 h-4 shrink-0 transition-colors ${
                                                        isActive ? 'text-white' : 'text-slate-400 group-hover/item:text-slate-700'
                                                    }`} />
                                                    <span className="truncate">{getItemName(item.name)}</span>
                                                </div>
                                            )}
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Bottom Footer Section (Platform Status & Sign Out - Screen 1 Feature) */}
            <div className="p-3 bg-slate-50/90 border-t border-slate-200/90 flex flex-col gap-2">
                {!isCollapsed ? (
                    <>
                        {/* Platform Status Card */}
                        <NavLink 
                            to="/platform-status"
                            onClick={() => {
                                if (window.innerWidth < 768 && onClose) {
                                    onClose();
                                }
                            }}
                            className="flex items-center justify-between p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 transition-all group shadow-2xs"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-emerald-100/90 flex items-center justify-center shrink-0">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-black text-blue-600 tracking-wider uppercase">
                                        PLATFORM STATUS
                                    </span>
                                    <span className="text-xs font-bold text-emerald-600 truncate">
                                        {t('hdr_status_operational', 'All Systems Operational')}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-medium">
                                        Last updated: Oct 15, 2026 15:10
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                        </NavLink>

                        {/* Sign Out Action Button */}
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors uppercase tracking-wider"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>{t('nav_sign_out', 'SIGN OUT')}</span>
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3 py-1">
                        <NavLink 
                            to="/platform-status"
                            title="Platform Status: Operational"
                            className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center hover:ring-2 hover:ring-emerald-400 transition-all"
                        >
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        </NavLink>
                        <button
                            onClick={logout}
                            title="Sign Out"
                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
