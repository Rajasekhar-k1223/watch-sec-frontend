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
    const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
    const [requests, setRequests] = useState<SoftwareRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await fetch(`${API_URL}/software_requests`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
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
        if (authToken) fetchRequests();
        const interval = setInterval(() => {
            if (authToken) fetchRequests();
        }, 15000);
        return () => clearInterval(interval);
    }, [authToken]);

    const handleAction = async (id: number, action: 'approve' | 'deny') => {
        if (!confirm(`Are you sure you want to ${action} this request?`)) return;
        try {
            const res = await fetch(`${API_URL}/software_requests/${id}/${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
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
                return <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase"><Clock size={11} /> Pending</span>;
            case 'APPROVED':
                return <span className="flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase"><Check size={11} /> Approved</span>;
            case 'COMPLETED':
                return <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase"><Check size={11} /> Completed</span>;
            case 'DENIED':
                return <span className="flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase"><X size={11} /> Denied</span>;
            case 'FAILED':
                return <span className="flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase"><X size={11} /> Failed</span>;
            default:
                return <span className="text-slate-500 text-xs">{status}</span>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/90 shadow-sm p-6 rounded-2xl">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shadow-xs">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Software Requests</h1>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Manage user requests for new software installations across the endpoint fleet
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400 text-xs">Loading software requests...</div>
            ) : (
                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="p-4">Device</th>
                                    <th className="p-4">Software Requested</th>
                                    <th className="p-4">Reason</th>
                                    <th className="p-4">Requested At</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-400">
                                            No software requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Monitor className="text-slate-400" size={14} />
                                                    <div>
                                                        <div className="font-bold text-slate-900">{req.hostname || 'Unknown'}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">{req.agentId?.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-bold text-slate-900">
                                                {req.softwareName}
                                            </td>
                                            <td className="p-4 text-slate-600 max-w-xs truncate" title={req.reason}>
                                                {req.reason || '-'}
                                            </td>
                                            <td className="p-4 text-slate-500 font-mono whitespace-nowrap">
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
                                                            className="flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                                                        >
                                                            <Check size={13} /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(req.id, 'deny')}
                                                            className="flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                                                        >
                                                            <X size={13} /> Deny
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
