import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bell, Search, Menu, Settings, Sun, Moon, X, Check, 
  Trash2, AlertTriangle, Info, CheckCircle2, ShieldAlert,
  LogOut, User as UserIcon, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import LanguageSelector from './LanguageSelector';
import { API_URL } from '../config';

interface HeaderProps {
    onMenuClick?: () => void;
}

interface NotificationItem {
    Id: number;
    Title: string;
    Message: string;
    Type?: string;
    Severity?: string;
    IsRead: boolean;
    CreatedAt?: string;
    CreatedDate?: string;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { user, logout } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();

    // ── Theme State (Persistent in localStorage) ───────────────────────────
    const [isDark, setIsDark] = useState<boolean>(() => {
        const saved = localStorage.getItem('monitorix_theme');
        if (saved) return saved === 'dark';
        return document.documentElement.classList.contains('dark');
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('monitorix_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('monitorix_theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(prev => !prev);

    // ── Notification Drawer State ──────────────────────────────────────────
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const [notifError, setNotifError] = useState<string | null>(null);
    const drawerRef = useRef<HTMLDivElement>(null);
    const bellRef = useRef<HTMLButtonElement>(null);

    // ── User Profile Menu State ────────────────────────────────────────────
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const token = sessionStorage.getItem('token') || localStorage.getItem('token') || '';

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        setLoadingNotifs(true);
        setNotifError(null);
        try {
            const res = await fetch(`${API_URL}/notifications?limit=25`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const userRole = (user?.role || user?.Role || '').toLowerCase();
                const isPrivileged = userRole === 'superadmin' || userRole === 'producthead';
                const items = Array.isArray(data) ? data : [];
                const safeItems = isPrivileged
                    ? items
                    : items.filter(n => {
                        const title = (n.Title || '').toUpperCase();
                        const msg = (n.Message || '').toUpperCase();
                        const typ = (n.Type || '').toUpperCase();
                        return !title.includes('[INTERNAL_PRI]') && !msg.includes('[INTERNAL_PRI]') && !typ.includes('INTERNAL_PRI');
                    });
                setNotifications(safeItems);
            } else if (res.status === 401) {
                setNotifications([]);
            } else {
                setNotifError('Unable to load notifications');
            }
        } catch {
            setNotifError('Network error connecting to notification service');
        } finally {
            setLoadingNotifs(false);
        }
    }, [token]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // 1 min poll
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAllRead = async () => {
        if (!token) return;
        try {
            await fetch(`${API_URL}/notifications/read-all`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
        } catch {
            // non-fatal
        }
    };

    const clearAllNotifications = async () => {
        if (!token) return;
        try {
            await fetch(`${API_URL}/notifications/clear`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications([]);
        } catch {
            // non-fatal
        }
    };

    // Close popups on click outside or Escape
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                drawerRef.current && 
                !drawerRef.current.contains(e.target as Node) &&
                bellRef.current &&
                !bellRef.current.contains(e.target as Node)
            ) {
                setDrawerOpen(false);
            }
            if (
                profileRef.current && 
                !profileRef.current.contains(e.target as Node)
            ) {
                setProfileOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setDrawerOpen(false);
                setProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.IsRead).length;

    const profileName = user?.username || "SecOps Lead";
    const profileRole = user?.role || "Administrator";
    const initials = profileName.substring(0, 2).toUpperCase();

    const getSeverityIcon = (n: NotificationItem) => {
        const type = (n.Type || n.Severity || '').toLowerCase();
        if (type.includes('critical') || type.includes('alert')) {
            return <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />;
        }
        if (type.includes('warn')) {
            return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
        }
        if (type.includes('success')) {
            return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
        }
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    };

    return (
        <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
            {/* Search Area */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <button
                    onClick={onMenuClick}
                    className="p-1.5 sm:p-2 md:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors shrink-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Open mobile menu"
                >
                    <Menu size={20} />
                </button>
                <div className="relative w-full max-w-2xl min-w-0">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t('hdr_search_placeholder', 'Search endpoints, threats, incidents... (Ctrl+K)')}
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 sm:pl-11 pr-4 sm:pr-14 py-2 sm:py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all truncate"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 opacity-60">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded shadow-sm">Ctrl</span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded shadow-sm">K</span>
                    </div>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-4 shrink-0 relative">
                {/* Sovereign Country & Language Selector */}
                <LanguageSelector />

                {/* Quick Action Icons */}
                <div className="flex items-center gap-1 sm:gap-2 pr-2 sm:pr-4 border-r border-slate-200 dark:border-slate-800">
                    {/* Notification Bell Button */}
                    <button 
                        ref={bellRef}
                        onClick={() => {
                            setDrawerOpen(prev => !prev);
                            if (!drawerOpen) fetchNotifications();
                        }}
                        className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative" 
                        aria-label="Notifications" 
                        aria-expanded={drawerOpen}
                        title={t('hdr_notifications', 'Notifications')}
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 min-w-[14px] h-3.5 px-1 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Theme Toggle Button */}
                    <button 
                        onClick={toggleTheme}
                        className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" 
                        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"} 
                        title={t('hdr_dark_mode', 'Toggle Theme')}
                    >
                        {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
                    </button>

                    {/* Settings Navigation Button */}
                    <button 
                        onClick={() => navigate('/settings')}
                        className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors hidden sm:block" 
                        aria-label="Settings" 
                        title={t('nav_settings', 'Settings')}
                    >
                        <Settings size={18} />
                    </button>
                </div>

                {/* User Profile Trigger */}
                <div 
                    onClick={() => setProfileOpen(prev => !prev)}
                    className="flex items-center gap-2 sm:gap-3 cursor-pointer group p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    aria-expanded={profileOpen}
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{profileName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{profileRole}</p>
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all shrink-0">
                        {initials}
                    </div>
                </div>

                {/* ── User Profile Menu Dropdown ─────────────────────────── */}
                {profileOpen && (
                    <div 
                        ref={profileRef}
                        className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{profileName}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{profileRole}</p>
                        </div>
                        <button
                            onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <Settings size={14} />
                            <span>Platform Settings</span>
                        </button>
                        <button
                            onClick={() => { setProfileOpen(false); logout(); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors font-medium"
                        >
                            <LogOut size={14} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                )}

                {/* ── Notification Slide-Over Drawer ─────────────────────── */}
                {drawerOpen && (
                    <div 
                        ref={drawerRef}
                        className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150"
                        role="dialog"
                        aria-label="Notification center"
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Security Alerts & Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full">
                                        {unreadCount} unread
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={fetchNotifications}
                                    title="Refresh"
                                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                                >
                                    <RefreshCw size={13} className={loadingNotifs ? "animate-spin" : ""} />
                                </button>
                                <button
                                    onClick={() => setDrawerOpen(false)}
                                    title="Close"
                                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        </div>

                        {/* Action Bar */}
                        {notifications.length > 0 && (
                            <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800/60 text-[11px] bg-white dark:bg-slate-900">
                                <button
                                    onClick={markAllRead}
                                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                                >
                                    <Check size={12} />
                                    <span>Mark all read</span>
                                </button>
                                <button
                                    onClick={clearAllNotifications}
                                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1"
                                >
                                    <Trash2 size={12} />
                                    <span>Clear all</span>
                                </button>
                            </div>
                        )}

                        {/* Notification List Body */}
                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                            {loadingNotifs && notifications.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                                    <RefreshCw size={18} className="animate-spin text-blue-500" />
                                    <span>Fetching security notifications...</span>
                                </div>
                            ) : notifError ? (
                                <div className="p-6 text-center text-xs text-rose-500 space-y-2">
                                    <p>{notifError}</p>
                                    <button 
                                        onClick={fetchNotifications}
                                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-semibold"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                                    <CheckCircle2 size={24} className="mx-auto text-emerald-500/80 mb-2" />
                                    <p className="font-semibold text-slate-700 dark:text-slate-300">No active alerts</p>
                                    <p className="text-[11px]">All endpoints and SIEM pipelines are operating in normal state.</p>
                                </div>
                            ) : (
                                notifications.map(item => (
                                    <div 
                                        key={item.Id} 
                                        className={`p-3 text-xs flex items-start gap-2.5 transition-colors ${
                                            item.IsRead 
                                                ? 'bg-white dark:bg-slate-900 opacity-75' 
                                                : 'bg-blue-50/40 dark:bg-blue-950/20'
                                        }`}
                                    >
                                        {getSeverityIcon(item)}
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-semibold truncate ${
                                                item.IsRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'
                                            }`}>
                                                {item.Title}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                                {item.Message}
                                            </p>
                                            {item.CreatedDate && (
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                                    {new Date(item.CreatedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            )}
                                        </div>
                                        {!item.IsRead && (
                                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 mt-1" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
