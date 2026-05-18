import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Bell, Search, Menu, LayoutDashboard, Users, FileText, List, LogOut, ArrowRight as ArrowRightIcon, Activity, AlertTriangle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

interface HeaderProps {
    onMenuClick?: () => void;
}

interface Notification {
    Id: number;
    Title: string;
    Message: string;
    Type: 'Info' | 'Warning' | 'Error' | 'Critical';
    CreatedAt: string;
    IsRead: boolean;
    AgentId?: string;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const { user, logout, token } = useAuth();
    const role = user?.role || 'VIEWER';
    const navigate = useNavigate();

    // Notifications State
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const notifRef = useRef<HTMLDivElement>(null);


    // Search/Command State
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch notifications once on mount (no separate socket — Dashboard already has one)
    useEffect(() => {
        if (!token || !user) return;
        const fetchNotifs = async () => {
            try {
                const res = await fetch(`${API_URL}/notifications`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setNotifications(await res.json());
            } catch { /* silent */ }
        };
        fetchNotifs();
    }, [token, user]);

    // Commands Definition
    const commands = [
        { id: 'nav-dash', label: 'Go to Dashboard', icon: LayoutDashboard, action: () => navigate('/status'), type: 'Navigation' },
        { id: 'nav-users', label: 'Go to Users', icon: Users, action: () => navigate('/users'), type: 'Navigation' },
        { id: 'nav-reports', label: 'Go to Reports', icon: FileText, action: () => navigate('/reports'), type: 'Navigation' },
        { id: 'nav-events', label: 'Go to Event Log', icon: List, action: () => navigate('/events'), type: 'Navigation' },
        { id: 'nav-activities', label: 'Go to Activities', icon: Activity, action: () => navigate('/events'), type: 'Navigation' },
        { id: 'act-theme', label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, icon: theme === 'dark' ? Sun : Moon, action: toggleTheme, type: 'Action' },
        { id: 'act-logout', label: 'Logout', icon: LogOut, action: logout, type: 'Action' },
    ];

    const filteredCommands = commands.filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()));

    // Keyboard Shortcuts & Click Outside
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+K to open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowSearch(true);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
            // Escape to close
            if (e.key === 'Escape') {
                setShowSearch(false);
                setShowNotifications(false);
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            // Close Notifications
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            // Close Search
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearch(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleCommandClick = (action: () => void) => {
        action();
        setShowSearch(false);
        setSearchQuery('');
    };

    const clearAllNotifications = async () => {
        try {
            await fetch(`${API_URL}/notifications/clear`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications([]);
        } catch (e) {
            console.error(e);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`${API_URL}/notifications/read-all`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <header className="flex items-center justify-between px-8 py-5 sticky top-0 z-40 bg-white/60 dark:bg-[#020617]/60 backdrop-blur-3xl border-b border-slate-200 dark:border-slate-800/50 transition-all duration-500">
            {/* Search / Command Area */}
            <div className="flex items-center gap-6 flex-1">
                <button
                    onClick={onMenuClick}
                    className="p-3 md:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <Menu size={20} />
                </button>
                <div className="relative flex-1 max-w-[240px] sm:max-w-none md:w-[450px] group" ref={searchRef}>
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-500 ${showSearch ? 'text-blue-500 scale-110' : 'text-slate-400'}`} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="TERMINAL SEARCH..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowSearch(true)}
                        className={`w-full bg-slate-100 dark:bg-white/5 border rounded-2xl pl-12 pr-14 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all duration-500 ${showSearch ? 'ring-4 ring-blue-500/10 border-blue-500/50 bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800'}`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex gap-1.5 pointer-events-none opacity-40">
                        <span className="text-[8px] font-black text-slate-500 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">CTRL</span>
                        <span className="text-[8px] font-black text-slate-500 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">K</span>
                    </div>

                    {/* Command Palette Dropdown */}
                    {showSearch && (
                        <div className="absolute top-full left-0 right-0 mt-4 glass-card border border-slate-200 dark:border-slate-800/50 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="max-h-[400px] overflow-y-auto py-2">
                                {filteredCommands.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic">No matching protocols.</div>
                                ) : (
                                    <>
                                        <div className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-50/50 dark:bg-white/5">Suggested Procedures</div>
                                        {filteredCommands.map((cmd) => (
                                            <button
                                                key={cmd.id}
                                                onClick={() => handleCommandClick(cmd.action)}
                                                className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-blue-500/5 transition-all group"
                                            >
                                                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 text-slate-500 dark:text-slate-400">
                                                    <cmd.icon size={16} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors">{cmd.label}</span>
                                                {cmd.type === 'Navigation' && <ArrowRightIcon className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-blue-500" size={14} />}
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>
                            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950 text-[8px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                                <span>Navigate with arrows</span>
                                <span>Enter to execute</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-500 shadow-xl"
                    title={`Protocol: ${theme === 'dark' ? 'Standard' : 'Tactical'} Mode`}
                >
                    {theme === 'dark' ? <Sun size={18} className="animate-spin-slow" /> : <Moon size={18} />}
                </button>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            if (!showNotifications) markAllAsRead();
                        }}
                        className={`p-3 rounded-2xl border transition-all duration-500 relative shadow-xl ${showNotifications ? 'bg-blue-500 text-white border-blue-500 shadow-blue-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500 hover:border-blue-500/30'}`}
                    >
                        <Bell size={18} />
                        {notifications.filter(n => !n.IsRead).length > 0 && (
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-2xl"></span>
                        )}
                    </button>

                    {/* Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-4 w-96 glass-card border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
                                <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Signal Feed</h3>
                                <button onClick={clearAllNotifications} className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-600 transition-colors tracking-widest">Purge All</button>
                            </div>
                            <div className="max-h-[450px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-4 opacity-40">
                                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-3xl">
                                            <Bell size={32} />
                                        </div>
                                        Vacuum State
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.Id} className={`p-6 border-b border-slate-50 dark:border-slate-800/50 hover:bg-blue-500/5 transition-all relative group ${!n.IsRead ? 'bg-blue-500/[0.03]' : ''}`}>
                                            <div className="flex gap-4">
                                                <div className={`p-3 rounded-2xl h-fit transition-transform group-hover:scale-110 duration-500 ${n.Type === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                    n.Type === 'Warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                        'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                    }`}>
                                                    {n.Type === 'Critical' ? <AlertTriangle size={16} /> : n.Type === 'Warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className={`text-[10px] font-black uppercase tracking-widest truncate ${n.Type === 'Critical' ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{n.Title}</h4>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{n.Message}</p>
                                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(n.CreatedAt).toLocaleTimeString()}</span>
                                                        {n.AgentId && <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md font-black tracking-widest uppercase">{n.AgentId}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-4 pl-6 ml-2 border-l border-slate-200 dark:border-slate-800/50">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{user?.username || 'ANONYMOUS'}</p>
                        <p className="text-[8px] text-blue-500 font-black uppercase tracking-[0.2em] mt-0.5">{role}</p>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-0 bg-blue-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                        <div className="w-11 h-11 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-sm shadow-2xl relative z-10 transition-transform group-hover:scale-105 active:scale-95 duration-500 ring-1 ring-slate-200 dark:ring-slate-800">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
