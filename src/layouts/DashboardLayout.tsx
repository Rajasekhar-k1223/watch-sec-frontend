import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function DashboardLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen transition-colors duration-300 font-sans selection:bg-cyan-500/30">
            {/* Scanline Effect Overlay (Global) */}
            <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20"></div>

            <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <div className="flex-1 md:ml-64 flex flex-col w-full md:w-[calc(100%-16rem)] relative z-10 transition-all duration-300">
                <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
                <main className="flex-1 p-6 overflow-x-hidden">
                    {/* Main Content Area - "The Screen" */}
                    <div className="min-h-full rounded-2xl glass-panel relative overflow-hidden backdrop-blur-xl border border-white/5 dark:border-gray-800 p-6">
                        {/* Decorative Corners */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-xl pointer-events-none"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-xl pointer-events-none"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50 rounded-br-xl pointer-events-none"></div>

                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
