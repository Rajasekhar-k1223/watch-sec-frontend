import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import GlobalAiChatbot from '../components/GlobalAiChatbot';

export default function DashboardLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen transition-colors duration-300 font-sans selection:bg-blue-500/30">
            {/* Scanline Effect Overlay (Global) */}
            <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-[0.03] animate-scanline"></div>

            <Sidebar 
                isOpen={isMobileMenuOpen} 
                onClose={() => setIsMobileMenuOpen(false)} 
                isCollapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <div className={`flex-1 flex flex-col w-full relative z-10 transition-all duration-300 ease-in-out ${isCollapsed ? 'md:ml-20 md:w-[calc(100%-5rem)]' : 'md:ml-64 md:w-[calc(100%-16rem)]'}`}>
                <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
                <main className="flex-1 overflow-x-hidden bg-[#f3f4f6]">
                    {/* Main Content Area - Full width */}
                    <div className="min-h-full relative overflow-hidden">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Persistent Sovereign AI Chatbot */}
            <GlobalAiChatbot />
        </div>
    );
}
