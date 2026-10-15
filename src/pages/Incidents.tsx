import React, { useState, useEffect, useMemo } from 'react';
import { 
    AlertTriangle, ShieldAlert, ShieldCheck, CheckCircle, Clock, 
    Search, Filter, Plus, RefreshCw, Server, X, ChevronRight, 
    FileText, User, Flame, ArrowUpRight, Activity, Eye, Check
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface IncidentItem {
    id: number;
    agentId: string;
    affectedAgentIds: string[];
    tenantId: number;
    title: string;
    description: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    status: 'Open' | 'Investigating' | 'Resolved';
    createdDate: string;
    updateDate?: string;
    resolutionNotes?: string;
}

interface IncidentSummary {
    openCritical: number;
    totalActive: number;
    avgResolutionTime?: string;
}

export default function Incidents() {
    const { token } = useAuth();
    const [incidents, setIncidents] = useState<IncidentItem[]>([]);
    const [summary, setSummary] = useState<IncidentSummary>({ openCritical: 0, totalActive: 0 });
    const [loading, setLoading] = useState(true);
    
    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [severityFilter, setSeverityFilter] = useState<string>('All');
    
    // Modals & Drawers
    const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const [resolvingId, setResolvingId] = useState<number | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [resolvingStatus, setResolvingStatus] = useState('Resolved');
    const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);

    // Create Incident Form
    const [newTitle, setNewTitle] = useState('');
    const [newAgentId, setNewAgentId] = useState('');
    const [newSeverity, setNewSeverity] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
    const [newDescription, setNewDescription] = useState('');
    const [newAffectedAgents, setNewAffectedAgents] = useState('');
    const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

    // Fetch Incidents & Summary
    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const [listRes, summaryRes] = await Promise.all([
                fetch(`${API_URL}/incidents?limit=100`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_URL}/incidents/summary`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (listRes.ok) {
                const data = await listRes.json();
                setIncidents(Array.isArray(data) ? data : []);
            }
            if (summaryRes.ok) {
                const sumData = await summaryRes.json();
                setSummary(sumData);
            }
        } catch (err) {
            console.error("Error fetching incidents:", err);
            toast.error("Failed to load security incidents.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchIncidents();
    }, [token]);

    // Handle Create Incident
    const handleCreateIncident = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newAgentId.trim()) {
            toast.error("Title and Target Agent ID are required.");
            return;
        }

        setIsSubmittingCreate(true);
        try {
            const affectedList = newAffectedAgents
                .split(',')
                .map(a => a.trim())
                .filter(a => a.length > 0);

            const res = await fetch(`${API_URL}/incidents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    agent_id: newAgentId.trim(),
                    title: newTitle.trim(),
                    description: newDescription.trim(),
                    severity: newSeverity,
                    affected_agent_ids: affectedList
                })
            });

            if (res.ok) {
                toast.success("Incident created and dispatched to SOAR!");
                setIsCreateModalOpen(false);
                setNewTitle('');
                setNewAgentId('');
                setNewDescription('');
                setNewAffectedAgents('');
                fetchIncidents();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(`Error: ${err.detail || "Failed to create incident"}`);
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error while creating incident.");
        } finally {
            setIsSubmittingCreate(false);
        }
    };

    // Handle Resolve Incident
    const handleResolveIncident = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resolvingId) return;

        setIsSubmittingResolve(true);
        try {
            const params = new URLSearchParams({
                resolution_notes: resolutionNotes.trim() || "Resolved by SOC Analyst",
                status: resolvingStatus
            });
            const res = await fetch(`${API_URL}/incidents/${resolvingId}/resolve?${params.toString()}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                toast.success(`Incident #${resolvingId} marked as ${resolvingStatus}!`);
                setIsResolveModalOpen(false);
                setResolvingId(null);
                setResolutionNotes('');
                if (selectedIncident?.id === resolvingId) {
                    setSelectedIncident(prev => prev ? { ...prev, status: resolvingStatus as any, resolutionNotes } : null);
                }
                fetchIncidents();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(`Error: ${err.detail || "Failed to resolve incident"}`);
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error while resolving incident.");
        } finally {
            setIsSubmittingResolve(false);
        }
    };

    // Quick Host Isolation from Incident
    const handleIsolateHost = async (agentId: string) => {
        if (!confirm(`Are you sure you want to ISOLATE ${agentId}? This will block all traffic except C2.`)) return;
        try {
            const res = await fetch(`${API_URL}/agents/${agentId}/isolate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success(`Agent ${agentId} network isolated!`);
            } else {
                toast.error("Failed to isolate agent.");
            }
        } catch (e) {
            toast.error("Network error.");
        }
    };

    // Filtered Incidents
    const filteredIncidents = useMemo(() => {
        return incidents.filter(inc => {
            const matchesSearch = 
                inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inc.agentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (inc.description && inc.description.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = statusFilter === 'All' || inc.status === statusFilter;
            const matchesSeverity = severityFilter === 'All' || inc.severity === severityFilter;

            return matchesSearch && matchesStatus && matchesSeverity;
        });
    }, [incidents, searchTerm, statusFilter, severityFilter]);

    // Severity Colors
    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'Critical':
                return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
            case 'High':
                return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
            case 'Medium':
                return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
            default:
                return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Open':
                return 'bg-red-500 text-white animate-pulse';
            case 'Investigating':
                return 'bg-amber-500 text-white';
            case 'Resolved':
                return 'bg-emerald-600 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-100 dark:bg-red-950/50 rounded-2xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400">
                            <Flame className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                Security Incident Hub
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                Active SOC ticket triage, containment, and SOAR response workflows
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchIncidents}
                        disabled={loading}
                        className="px-3.5 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-xs font-semibold shadow-sm"
                        title="Refresh Incidents"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Create Incident
                    </button>
                </div>
            </div>

            {/* KPI Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800/80 shadow-sm">
                    <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <span>Active Incidents</span>
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                        {summary.totalActive}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 font-medium">Awaiting SOC remediation</div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800/80 shadow-sm">
                    <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <span>Critical Open</span>
                        <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                    </div>
                    <div className="text-3xl font-black text-red-600 dark:text-red-400">
                        {summary.openCritical}
                    </div>
                    <div className="text-[11px] text-red-500/80 mt-1 font-medium">Urgent attention needed</div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800/80 shadow-sm">
                    <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <span>Under Investigation</span>
                        <Activity className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
                        {incidents.filter(i => i.status === 'Investigating').length}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 font-medium">Analyst assigned</div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800/80 shadow-sm">
                    <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <span>Resolved</span>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {incidents.filter(i => i.status === 'Resolved').length}
                    </div>
                    <div className="text-[11px] text-emerald-500/80 mt-1 font-medium">Contained & closed</div>
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm mb-6">
                <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-950 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800">
                    <Search className="text-gray-400 shrink-0" size={16} />
                    <input
                        type="text"
                        placeholder="Search by Title, Node ID, Description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent text-xs w-full text-gray-900 dark:text-white outline-none placeholder-gray-400"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400 font-medium">Severity:</span>
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 outline-none font-medium cursor-pointer"
                        >
                            <option value="All">All Severities</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400 font-medium">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 outline-none font-medium cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Open">Open</option>
                            <option value="Investigating">Investigating</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Incidents Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/80 dark:bg-gray-950/60 text-gray-500 uppercase font-bold border-b border-gray-200 dark:border-gray-800 tracking-wider">
                            <tr>
                                <th className="p-4 w-20">ID</th>
                                <th className="p-4">Incident Title</th>
                                <th className="p-4">Primary Node</th>
                                <th className="p-4">Severity</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Created Date</th>
                                <th className="p-4 text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80 text-gray-700 dark:text-gray-300">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-gray-400">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-red-500" />
                                        Loading security incidents...
                                    </td>
                                </tr>
                            ) : filteredIncidents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-gray-400">
                                        <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                                        No incidents found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredIncidents.map((incident) => (
                                    <tr 
                                        key={incident.id}
                                        className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors cursor-pointer group"
                                        onClick={() => setSelectedIncident(incident)}
                                    >
                                        <td className="p-4 font-mono font-bold text-gray-500">
                                            #{incident.id}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                                {incident.title}
                                            </div>
                                            <div className="text-[11px] text-gray-400 truncate max-w-md mt-0.5">
                                                {incident.description || "No description provided."}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 font-mono text-gray-800 dark:text-gray-200">
                                                <Server size={13} className="text-gray-400" />
                                                <span>{incident.agentId}</span>
                                            </div>
                                            {incident.affectedAgentIds && incident.affectedAgentIds.length > 1 && (
                                                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-0.5 block">
                                                    +{incident.affectedAgentIds.length - 1} other nodes
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getSeverityBadge(incident.severity)}`}>
                                                {incident.severity}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${getStatusBadge(incident.status)}`}>
                                                {incident.status}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-gray-500 text-[11px]">
                                            {incident.createdDate ? new Date(incident.createdDate).toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="p-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedIncident(incident)}
                                                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                                                    title="View Incident Triage"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                {incident.status !== 'Resolved' && (
                                                    <button
                                                        onClick={() => {
                                                            setResolvingId(incident.id);
                                                            setResolutionNotes('');
                                                            setResolvingStatus('Resolved');
                                                            setIsResolveModalOpen(true);
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition-all"
                                                        title="Mark Incident Resolved"
                                                    >
                                                        <Check size={12} />
                                                        Resolve
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleIsolateHost(incident.agentId)}
                                                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                                                    title="Isolate Compromised Node"
                                                >
                                                    <ShieldAlert size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Incident Details Slide-Out Drawer */}
            {selectedIncident && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
                    <div className="w-full max-w-xl bg-white dark:bg-gray-900 h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-gray-200 dark:border-gray-800 animate-in slide-in-from-right duration-300">
                        <div>
                            {/* Drawer Header */}
                            <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="font-mono text-xs font-bold text-gray-400">INCIDENT #{selectedIncident.id}</span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${getStatusBadge(selectedIncident.status)}`}>
                                            {selectedIncident.status}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getSeverityBadge(selectedIncident.severity)}`}>
                                            {selectedIncident.severity}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                                        {selectedIncident.title}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setSelectedIncident(null)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body Content */}
                            <div className="py-6 space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description & Forensic Evidence</h3>
                                    <div className="p-3.5 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed font-mono">
                                        {selectedIncident.description || "No description provided."}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Primary Compromised Node</h3>
                                    <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
                                        <div className="flex items-center gap-2.5">
                                            <Server className="w-5 h-5 text-red-500" />
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white text-xs">{selectedIncident.agentId}</div>
                                                <div className="text-[10px] text-gray-400 font-mono">Source of initial anomaly</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => window.open(`/forensics/${selectedIncident.agentId}`, '_blank')}
                                                className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-700"
                                            >
                                                Forensics <ArrowUpRight size={10} />
                                            </button>
                                            <button
                                                onClick={() => handleIsolateHost(selectedIncident.agentId)}
                                                className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-red-700"
                                            >
                                                Isolate Host
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {selectedIncident.affectedAgentIds && selectedIncident.affectedAgentIds.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                            All Affected Nodes ({selectedIncident.affectedAgentIds.length})
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedIncident.affectedAgentIds.map(nodeId => (
                                                <span key={nodeId} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-mono font-medium border border-gray-200 dark:border-gray-700 flex items-center gap-1">
                                                    <Server size={10} /> {nodeId}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedIncident.resolutionNotes && (
                                    <div>
                                        <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Resolution Audit Notes</h3>
                                        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 whitespace-pre-wrap leading-relaxed font-mono">
                                            {selectedIncident.resolutionNotes}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Incident Metadata</h3>
                                    <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 dark:bg-gray-950 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800">
                                        <div>
                                            <span className="text-gray-400 block text-[10px]">Created Timestamp</span>
                                            <span className="font-mono text-gray-700 dark:text-gray-300">
                                                {selectedIncident.createdDate ? new Date(selectedIncident.createdDate).toLocaleString() : 'N/A'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block text-[10px]">Last Updated</span>
                                            <span className="font-mono text-gray-700 dark:text-gray-300">
                                                {selectedIncident.updateDate ? new Date(selectedIncident.updateDate).toLocaleString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Drawer Actions */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
                            <button
                                onClick={() => setSelectedIncident(null)}
                                className="px-4 py-2 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Close
                            </button>
                            {selectedIncident.status !== 'Resolved' && (
                                <button
                                    onClick={() => {
                                        setResolvingId(selectedIncident.id);
                                        setResolutionNotes('');
                                        setResolvingStatus('Resolved');
                                        setIsResolveModalOpen(true);
                                    }}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                                >
                                    <Check size={14} />
                                    Mark as Resolved
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Incident Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Flame className="w-5 h-5 text-red-500" />
                                Create Security Incident
                            </h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateIncident} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Incident Title *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Cobalt Strike Beacon activity detected"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Primary Node ID *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., DESKTOP-ABC"
                                        value={newAgentId}
                                        onChange={(e) => setNewAgentId(e.target.value)}
                                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:border-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Severity</label>
                                    <select
                                        value={newSeverity}
                                        onChange={(e) => setNewSeverity(e.target.value as any)}
                                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:border-red-500 font-bold"
                                    >
                                        <option value="Critical">Critical</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Affected Nodes (comma-separated)</label>
                                <input
                                    type="text"
                                    placeholder="DESKTOP-ABC, SERVER-01, DB-02"
                                    value={newAffectedAgents}
                                    onChange={(e) => setNewAffectedAgents(e.target.value)}
                                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Description & Evidence</label>
                                <textarea
                                    rows={3}
                                    placeholder="Describe anomalies, MITRE tactics observed, or forensic IOCs..."
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingCreate}
                                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/20"
                                >
                                    {isSubmittingCreate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus size={14} />}
                                    Create & Dispatch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Resolve Incident Modal */}
            {isResolveModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                Resolve Incident #{resolvingId}
                            </h2>
                            <button onClick={() => setIsResolveModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleResolveIncident} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Target Status</label>
                                <select
                                    value={resolvingStatus}
                                    onChange={(e) => setResolvingStatus(e.target.value)}
                                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-bold"
                                >
                                    <option value="Resolved">Resolved (Contained)</option>
                                    <option value="Investigating">Investigating (In Triage)</option>
                                    <option value="Closed - False Positive">Closed - False Positive</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Resolution Audit Notes *</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Explain root cause, actions taken (e.g. process terminated, host unisolated, credentials rotated)..."
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setIsResolveModalOpen(false)}
                                    className="px-4 py-2 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingResolve}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                                >
                                    {isSubmittingResolve ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check size={14} />}
                                    Confirm Resolution
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
