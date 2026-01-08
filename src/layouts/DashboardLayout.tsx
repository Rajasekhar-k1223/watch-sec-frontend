import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function DashboardLayout() {
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300 font-sans">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col w-[calc(100%-16rem)]">
                <Header />
                <main className="flex-1 p-8 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
