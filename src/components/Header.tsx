import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, Settings, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Default static info for the design representation
    const profileName = user?.username || "Rajasekhar";
    const profileRole = user?.role || "Operations Lead";
    const initials = "RK";

    return (
        <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-40 bg-white border-b border-slate-200">
            {/* Search Area */}
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onMenuClick}
                    className="p-2 md:hidden text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <Menu size={20} />
                </button>
                <div className="relative w-full max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search endpoints, IPs, users, incidents, threats, or run a command..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-11 pr-14 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 opacity-60">
                        <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">Ctrl</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">K</span>
                    </div>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 ml-4">
                {/* Icons */}
                <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
                    <button className="p-2 text-slate-400 hover:text-slate-700 transition-colors relative">
                        <Bell size={18} />
                        <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">3</span>
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-700 transition-colors">
                        <Moon size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-700 transition-colors">
                        <Settings size={18} />
                    </button>
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-right hidden sm:block">
                        <p className="text-[11px] font-bold text-slate-800">{profileName}</p>
                        <p className="text-[10px] text-slate-500">{profileRole}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all">
                        {initials}
                    </div>
                </div>
            </div>
        </header>
    );
}
