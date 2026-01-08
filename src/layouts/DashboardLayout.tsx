import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout() {
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <Outlet />
            </main>
        </div>
    );
}
