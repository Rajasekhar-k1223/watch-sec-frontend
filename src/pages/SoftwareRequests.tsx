import { useState, useEffect } from 'react';
import { Package, Check, X, Clock, Monitor } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

interface SoftwareRequest {
    id: number;
    agentId: string;
    hostname: string;
    softwareName: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'DENIED' | 'COMPLETED' | 'FAILED';
    requestedAt: string;
}

export default function SoftwareRequests() {
    const { token } = useAuth();
    const [requests, setRequests] = useState<SoftwareRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await fetch(`${API_URL}/software_requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setRequests(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchRequests();
        const interval = setInterval(() => {
            if (token) fetchRequests();
        }, 15000);
        return () => clearInterval(interval);
    }, [token]);

    const handleAction = async (id: number, action: 'approve' | 'deny') => {
        if (!confirm(`Are you sure you want to ${action} this request?`)) return;
        try {
            const res = await fetch(`${API_URL}/software_requests/${id}/${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchRequests();
            } else {
                alert(`Failed to ${action} request`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-500 px-2 py-1 rounded text-xs font-bold uppercase"><Clock size={12} /> Pending</span>;
            case 'APPROVED':
                return <span className="flex items-center gap-1 text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold uppercase"><Check size={12} /> Approved</span>;
            case 'COMPLETED':
                return <span className="flex items-center gap-1 text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-xs font-bold uppercase"><Check size={12} /> Completed</span>;
            case 'DENIED':
                return <span className="flex items-center gap-1 text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded text-xs font-bold uppercase"><X size={12} /> Denied</span>;
            case 'FAILED':
                return <span className="flex items-center gap-1 text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded text-xs font-bold uppercase"><X size={12} /> Failed</span>;
            default:
                return <span className="text-gray-500">{status}</span>;
        }
    };

    return (
        <div className="p-6 transition-colors">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="text-purple-600 dark:text-purple-500" />
                        Software Requests
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage user requests for new software installations.</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading requests...</div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Device</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Software Requested</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requested At</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            No software requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Monitor className="text-gray-400" size={16} />
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white">{req.hostname || 'Unknown'}</div>
                                                        <div className="text-xs text-gray-500 font-mono">{req.agentId.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-bold text-gray-900 dark:text-white">
                                                {req.softwareName}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={req.reason}>
                                                {req.reason || '-'}
                                            </td>
                                            <td className="p-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {req.requestedAt ? new Date(req.requestedAt).toLocaleString() : 'N/A'}
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                {getStatusBadge(req.status)}
                                            </td>
                                            <td className="p-4 text-right whitespace-nowrap">
                                                {req.status === 'PENDING' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleAction(req.id, 'approve')}
                                                            className="flex items-center gap-1 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                                                        >
                                                            <Check size={14} /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(req.id, 'deny')}
                                                            className="flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                                                        >
                                                            <X size={14} /> Deny
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
