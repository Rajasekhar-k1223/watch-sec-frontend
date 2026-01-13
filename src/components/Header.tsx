import { Sun, Moon, Bell, Search, Menu } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();

    return (
        <header className="flex items-center justify-between px-6 py-4 mb-2 sticky top-0 z-40">
            {/* Search / Command Area */}
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onMenuClick}
                    className="p-2 md:hidden text-gray-400 hover:text-white"
                >
                    <Menu size={20} />
                </button>
                <div className="relative w-96 group hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-cyan-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="SEARCH COMMANDS..."
                        className="w-full bg-black/40 backdrop-blur border border-gray-800 rounded pl-10 pr-12 py-2 text-xs font-mono text-cyan-100 placeholder-gray-600 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                        <span className="text-[10px] text-gray-600 px-1.5 py-0.5 rounded border border-gray-700">CTRL</span>
                        <span className="text-[10px] text-gray-600 px-1.5 py-0.5 rounded border border-gray-700">K</span>
                    </div>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded bg-black/40 border border-gray-800 text-gray-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all shadow-sm"
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Notifications */}
                <button className="p-2 rounded bg-black/40 border border-gray-800 text-gray-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all relative shadow-sm">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse"></span>
                </button>

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-4 ml-2 border-l border-gray-800/50">
                    <div className="text-right hidden md:block">
                        <p className="text-xs font-bold text-gray-200 tracking-wide">{user?.username || 'GUEST'}</p>
                        <p className="text-[10px] text-cyan-500/70 uppercase tracking-wider">{user?.role || 'VIEWER'}</p>
                    </div>
                    <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-900 to-blue-900 border border-cyan-500/20 flex items-center justify-center text-cyan-100 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
}
