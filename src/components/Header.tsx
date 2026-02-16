import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Bell, Search, Menu, LayoutDashboard, Users, FileText, List, LogOut, ArrowRight as ArrowRightIcon, Activity, AlertTriangle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
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
    const navigate = useNavigate();

    // Notifications State
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const notifRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    // Search/Command State
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch History & Init Socket
    useEffect(() => {
        if (!token || !user) return;

        // 1. Fetch Initial Notifications
        const fetchNotifs = async () => {
            const res = await fetch(`${API_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setNotifications(await res.json());
        };
        fetchNotifs();

        // 2. Connect Socket for Real-time
        const socket = io(API_URL, {
            transports: ['websocket'],
            auth: { token }
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            if (user.tenantId) {
                socket.emit('join', { room: `tenant_${user.tenantId}` });
            }
        });

        socket.on('NewNotification', (notif: any) => {
            setNotifications(prev => [
                {
                    Id: notif.id || Date.now(),
                    Title: notif.title,
                    Message: notif.message,
                    Type: notif.type,
                    CreatedAt: new Date().toISOString(),
                    IsRead: false,
                    AgentId: notif.agentId
                },
                ...prev
            ].slice(0, 50));
        });

        return () => { socket.disconnect(); };
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
        <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 mb-2 sticky top-0 z-40 bg-white/80 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
            {/* Search / Command Area */}
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onMenuClick}
                    className="p-2 md:hidden text-gray-500 hover:text-gray-900 dark:hover:text-white"
                >
                    <Menu size={20} />
                </button>
                <div className="relative w-96 group hidden md:block" ref={searchRef}>
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${showSearch ? 'text-cyan-500' : 'text-gray-500'}`} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="SEARCH COMMANDS..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowSearch(true)}
                        className={`w-full bg-gray-100 dark:bg-black/40 backdrop-blur border rounded pl-10 pr-12 py-2 text-xs font-mono text-gray-800 dark:text-cyan-100 placeholder-gray-500 dark:placeholder-gray-600 outline-none transition-all ${showSearch ? 'ring-1 ring-cyan-500/50 border-cyan-500/50' : 'border-gray-200 dark:border-gray-800'}`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
                        <span className="text-[10px] text-gray-400 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded">CTRL</span>
                        <span className="text-[10px] text-gray-400 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded">K</span>
                    </div>

                    {/* Command Palette Dropdown */}
                    {showSearch && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <div className="max-h-80 overflow-y-auto py-1">
                                {filteredCommands.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-xs italic">No commands found.</div>
                                ) : (
                                    <>
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">Suggested Actions</div>
                                        {filteredCommands.map((cmd) => (
                                            <button
                                                key={cmd.id}
                                                onClick={() => handleCommandClick(cmd.action)}
                                                className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors group"
                                            >
                                                <div className="p-1.5 rounded bg-gray-100 dark:bg-gray-800 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/40 text-gray-500 dark:text-gray-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                                    <cmd.icon size={14} />
                                                </div>
                                                <span className="text-sm font-medium">{cmd.label}</span>
                                                {cmd.type === 'Navigation' && <ArrowRightIcon className="ml-auto opacity-0 group-hover:opacity-50" size={12} />}
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>
                            <div className="p-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-[10px] text-gray-400 flex justify-between">
                                <span>Navigate with arrows</span>
                                <span>Enter to select</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/30 transition-all shadow-sm"
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            if (!showNotifications) markAllAsRead();
                        }}
                        className={`p-2 rounded border transition-all relative shadow-sm ${showNotifications ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border-cyan-500/30' : 'bg-white dark:bg-black/40 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/30'}`}
                    >
                        <Bell size={18} />
                        {notifications.filter(n => !n.IsRead).length > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
                        )}
                    </button>

                    {/* Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                            <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Alerts & System Feed</h3>
                                <button onClick={clearAllNotifications} className="text-[10px] text-blue-500 hover:underline font-bold">Clear All</button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-10 text-center text-gray-400 dark:text-gray-500 text-xs italic flex flex-col items-center gap-2">
                                        <Bell className="opacity-20" size={32} />
                                        No new notifications
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.Id} className={`p-4 border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative ${!n.IsRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                            <div className="flex gap-3">
                                                <div className={`p-2 rounded-lg h-fit ${n.Type === 'Critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-500' :
                                                    n.Type === 'Warning' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-500' :
                                                        'bg-blue-100 dark:bg-blue-900/30 text-blue-500'
                                                    }`}>
                                                    {n.Type === 'Critical' ? <AlertTriangle size={14} /> : n.Type === 'Warning' ? <AlertTriangle size={14} /> : <Info size={14} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className={`text-sm font-bold truncate ${n.Type === 'Critical' ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>{n.Title}</h4>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{n.Message}</p>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-[10px] text-gray-400 font-medium">{new Date(n.CreatedAt).toLocaleTimeString()}</span>
                                                        {n.AgentId && <span className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded font-mono">{n.AgentId}</span>}
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
                <div className="flex items-center gap-3 pl-2 md:pl-4 ml-1 md:ml-2 border-l-0 md:border-l border-gray-200 dark:border-gray-800/50">
                    <div className="text-right hidden md:block">
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-200 tracking-wide">{user?.username || 'GUEST'}</p>
                        <p className="text-[10px] text-cyan-600 dark:text-cyan-500/70 uppercase tracking-wider">{user?.role || 'VIEWER'}</p>
                    </div>
                    <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-900 to-blue-900 border border-cyan-500/20 flex items-center justify-center text-cyan-100 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
}
