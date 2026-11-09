import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    AlertTriangle, CheckCircle, 
    Search, Plus, RefreshCw, X, ChevronRight, 
    Flame, ArrowUpRight, Activity,
    UserCheck, Layers, ChevronLeft, MessageSquare, Shield, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
    type SocCaseItem, 
    type SocCaseSeverity, 
    type SocCaseStatus, 
    type SocCasePriority,
    fetchSocCases, 
    createSocCase, 
    updateSocCaseStatus,
    getPermittedTransitions
} from '../services/soc_case_api';

const SOC_WRITE_ROLES = ['SuperAdmin', 'Admin', 'TenantAdmin', 'Analyst'];

export default function Incidents() {
    const { token, user } = useAuth();

    // Data states
    const [cases, setCases] = useState<SocCaseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [severityFilter, setSeverityFilter] = useState<string>('All');
    const [priorityFilter, setPriorityFilter] = useState<string>('All');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    // Modals & Drawers
    const [selectedCase, setSelectedCase] = useState<SocCaseItem | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statusTargetCase, setStatusTargetCase] = useState<SocCaseItem | null>(null);
    const [targetStatus, setTargetStatus] = useState<SocCaseStatus>('TRIAGED');
    const [closureSummary, setClosureSummary] = useState('');
    const [statusNotes, setStatusNotes] = useState('');
    const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

    // Create Case Form
    const [newTitle, setNewTitle] = useState('');
    const [newSeverity, setNewSeverity] = useState<SocCaseSeverity>('High');
    const [newPriority, setNewPriority] = useState<SocCasePriority>('P2');
    const [newDescription, setNewDescription] = useState('');
    const [newAssignedTeam, setNewAssignedTeam] = useState('Tier 1 Triage');
    const [newLeadAnalyst, setNewLeadAnalyst] = useState('');
    const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

    const userCanWrite = useMemo(() => {
        const role = user?.role || user?.Role || '';
        return SOC_WRITE_ROLES.includes(role);
    }, [user]);

    // Fetch SOC Cases
    const loadCases = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchSocCases({
                status: statusFilter,
                severity: severityFilter,
                priority: priorityFilter,
                search: searchTerm,
                limit: 100
            });
            setCases(data);
        } catch (err: unknown) {
            console.error("Error loading SOC cases:", err);
            const msg = (err instanceof Error) ? err.message : "Failed to load security cases.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, severityFilter, priorityFilter, searchTerm]);

    useEffect(() => {
        if (token) {
            loadCases();
        }
    }, [token, loadCases]);

    // Handle Create Case
    const handleCreateCase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) {
            toast.error("Case Title is required.");
            return;
        }

        setIsSubmittingCreate(true);
        try {
            const created = await createSocCase({
                title: newTitle.trim(),
                description: newDescription.trim(),
                severity: newSeverity,
                priority: newPriority,
                assigned_team: newAssignedTeam,
                lead_analyst: newLeadAnalyst.trim() || undefined
            });

            toast.success(`SOC Case ${created.case_number} created successfully!`, { icon: '🛡️' });
            setIsCreateModalOpen(false);
            setNewTitle('');
            setNewDescription('');
            setNewSeverity('High');
            setNewPriority('P2');
            setNewLeadAnalyst('');
            loadCases();
        } catch (err: unknown) {
            console.error("Create case error:", err);
            const msg = (err instanceof Error) ? err.message : "Failed to create SOC case";
            toast.error(msg);
        } finally {
            setIsSubmittingCreate(false);
        }
    };

    // Open Status Transition Modal
    const openStatusTransition = (c: SocCaseItem) => {
        setStatusTargetCase(c);
        const permitted = getPermittedTransitions(c.status);
        if (permitted.length > 0) {
            setTargetStatus(permitted[0]);
        }
        setClosureSummary('');
        setStatusNotes('');
        setIsStatusModalOpen(true);
    };

    // Handle Status Transition
    const handleStatusTransition = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!statusTargetCase) return;

        if (targetStatus === 'CLOSED' && !closureSummary.trim()) {
            toast.error("A Closure Summary is required when closing a SOC Case.");
            return;
        }

        setIsSubmittingStatus(true);
        try {
            const updated = await updateSocCaseStatus(statusTargetCase.id, {
                status: targetStatus,
                notes: statusNotes.trim() || undefined,
                closure_summary: closureSummary.trim() || undefined
            });

            toast.success(`Case ${updated.case_number} transitioned to ${updated.status}!`);
            setIsStatusModalOpen(false);
            setStatusTargetCase(null);
            if (selectedCase?.id === statusTargetCase.id) {
                setSelectedCase(updated);
            }
            loadCases();
        } catch (err: unknown) {
            console.error("Status update error:", err);
            const msg = (err instanceof Error) ? err.message : "Failed to transition case status";
            toast.error(msg);
        } finally {
            setIsSubmittingStatus(false);
        }
    };

    // Filtered & Paginated Cases
    const filteredCases = useMemo(() => {
        return cases.filter(c => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = !term || 
                c.case_number.toLowerCase().includes(term) ||
                c.title.toLowerCase().includes(term) ||
                (c.description && c.description.toLowerCase().includes(term)) ||
                (c.lead_analyst && c.lead_analyst.toLowerCase().includes(term));
            
            const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
            const matchesSeverity = severityFilter === 'All' || c.severity === severityFilter;
            const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesSeverity && matchesPriority;
        });
    }, [cases, searchTerm, statusFilter, severityFilter, priorityFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));
    const paginatedCases = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredCases.slice(start, start + pageSize);
    }, [filteredCases, currentPage, pageSize]);

    // KPI Metrics directly from live case data
    const kpiMetrics = useMemo(() => {
        const total = cases.length;
        const active = cases.filter(c => c.status !== 'CLOSED').length;
        const criticalOpen = cases.filter(c => (c.severity === 'Critical' || c.severity === 'High') && c.status !== 'CLOSED').length;
        const awaitingTriage = cases.filter(c => c.status === 'NEW').length;
        const containedOrResolved = cases.filter(c => c.status === 'CONTAINED' || c.status === 'RESOLVED' || c.status === 'CLOSED').length;
        return { total, active, criticalOpen, awaitingTriage, containedOrResolved };
    }, [cases]);

    // Style Helpers
    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'Critical':
                return 'bg-red-500/15 text-red-500 border border-red-500/30';
            case 'High':
                return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
            case 'Medium':
                return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
            default:
                return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'P1':
                return 'bg-rose-950 text-rose-300 border border-rose-800';
            case 'P2':
                return 'bg-amber-950 text-amber-300 border border-amber-800';
            case 'P3':
                return 'bg-blue-950 text-blue-300 border border-blue-800';
            default:
                return 'bg-slate-800 text-slate-300 border border-slate-700';
        }
    };

    const getStatusBadge = (status: SocCaseStatus) => {
        switch (status) {
            case 'NEW':
                return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 animate-pulse';
            case 'TRIAGED':
                return 'bg-blue-500/20 text-blue-400 border border-blue-500/40';
            case 'CONTAINED':
                return 'bg-purple-500/20 text-purple-400 border border-purple-500/40';
            case 'RESOLVED':
                return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
            case 'CLOSED':
                return 'bg-slate-700/40 text-slate-400 border border-slate-600/40';
            default:
                return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
        }
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-slate-950 font-sans text-slate-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-950/60 rounded-2xl border border-rose-800/60 text-rose-400 shadow-lg shadow-rose-950/30">
                            <Flame className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                                    Incident Management & SOC Cockpit
                                </h1>
                                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                                    Module 08
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 font-medium mt-0.5">
                                Enterprise SOC case lifecycle, multi-tenant triage, forensic investigations, and containment
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadCases}
                        disabled={loading}
                        className="px-3.5 py-2 bg-slate-900 text-slate-300 rounded-xl border border-slate-800 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 text-xs font-semibold shadow-sm"
                        title="Refresh Cases"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin text-cyan-400" : ""} />
                        Refresh
                    </button>

                    {userCanWrite && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Create SOC Case
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Summary Row (Live Operational Data) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <span>Active SOC Cases</span>
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-3xl font-black text-white font-mono">
                        {kpiMetrics.active}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                        {kpiMetrics.total} total cases recorded
                    </div>
                </div>

                <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <span>Critical & High Open</span>
                        <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                    </div>
                    <div className="text-3xl font-black text-rose-400 font-mono">
                        {kpiMetrics.criticalOpen}
                    </div>
                    <div className="text-[11px] text-rose-400/80 mt-1 font-medium">Immediate response required</div>
                </div>

                <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <span>Awaiting Triage</span>
                        <Activity className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-3xl font-black text-indigo-400 font-mono">
                        {kpiMetrics.awaitingTriage}
                    </div>
                    <div className="text-[11px] text-indigo-400/80 mt-1 font-medium">Status: NEW (Unassigned/Fresh)</div>
                </div>

                <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <span>Contained & Closed</span>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-black text-emerald-400 font-mono">
                        {kpiMetrics.containedOrResolved}
                    </div>
                    <div className="text-[11px] text-emerald-400/80 mt-1 font-medium">Threat neutralized / resolved</div>
                </div>
            </div>

            {/* Error Banner with Retry */}
            {error && (
                <div className="mb-6 p-4 bg-rose-950/40 border border-rose-800/80 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-rose-300 text-xs">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        <div>
                            <span className="font-bold">Failed to load SOC cases:</span> {error}
                        </div>
                    </div>
                    <button
                        onClick={loadCases}
                        className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold transition"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Controls Row (Search, Filters) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm mb-6">
                <div className="flex-1 flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                    <Search className="text-slate-400 shrink-0" size={16} />
                    <input
                        type="text"
                        placeholder="Search by Case Number (e.g. CASE-2026), Title, Analyst..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="bg-transparent text-xs w-full text-white outline-none placeholder-slate-500 font-sans"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-white">
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Filter */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-medium">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-800 outline-none font-medium cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="NEW">NEW</option>
                            <option value="TRIAGED">TRIAGED</option>
                            <option value="CONTAINED">CONTAINED</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="CLOSED">CLOSED</option>
                        </select>
                    </div>

                    {/* Severity Filter */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-medium">Severity:</span>
                        <select
                            value={severityFilter}
                            onChange={(e) => {
                                setSeverityFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-800 outline-none font-medium cursor-pointer"
                        >
                            <option value="All">All Severities</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>

                    {/* Priority Filter */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-medium">Priority:</span>
                        <select
                            value={priorityFilter}
                            onChange={(e) => {
                                setPriorityFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-800 outline-none font-medium cursor-pointer"
                        >
                            <option value="All">All Priorities</option>
                            <option value="P1">P1 (Urgent)</option>
                            <option value="P2">P2 (High)</option>
                            <option value="P3">P3 (Medium)</option>
                            <option value="P4">P4 (Low)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Cases Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold border-b border-slate-800 tracking-wider">
                            <tr>
                                <th className="p-4 w-32 font-mono">Case #</th>
                                <th className="p-4">Case Title</th>
                                <th className="p-4">Severity / Priority</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Lead Analyst</th>
                                <th className="p-4">Evidence / Comms</th>
                                <th className="p-4">Created Date</th>
                                <th className="p-4 text-right pr-6">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-slate-300">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-16 text-center text-slate-400">
                                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
                                        <span className="font-medium text-sm">Loading security cases from SOC engine...</span>
                                    </td>
                                </tr>
                            ) : paginatedCases.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-16 text-center text-slate-400">
                                        <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                        <p className="text-base font-semibold text-slate-300">No SOC cases match your filter criteria.</p>
                                        <p className="text-xs text-slate-500 mt-1">Try resetting filters or create a new SOC case.</p>
                                        {userCanWrite && (
                                            <button
                                                onClick={() => setIsCreateModalOpen(true)}
                                                className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2"
                                            >
                                                <Plus size={14} /> Create First Case
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                paginatedCases.map((c) => (
                                    <tr 
                                        key={c.id} 
                                        onClick={() => setSelectedCase(c)}
                                        className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                                    >
                                        {/* Case Number */}
                                        <td className="p-4 font-mono font-bold text-cyan-400 group-hover:text-cyan-300">
                                            {c.case_number}
                                        </td>

                                        {/* Title & Description */}
                                        <td className="p-4 max-w-md">
                                            <div className="font-bold text-white group-hover:text-blue-300 transition line-clamp-1">
                                                {c.title}
                                            </div>
                                            {c.description && (
                                                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                                    {c.description}
                                                </div>
                                            )}
                                        </td>

                                        {/* Severity & Priority */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getSeverityBadge(c.severity)}`}>
                                                    {c.severity}
                                                </span>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${getPriorityBadge(c.priority)}`}>
                                                    {c.priority}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${getStatusBadge(c.status)}`}>
                                                {c.status}
                                            </span>
                                        </td>

                                        {/* Lead Analyst */}
                                        <td className="p-4">
                                            {c.lead_analyst ? (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                                                    <UserCheck size={13} className="text-cyan-400" />
                                                    <span className="font-mono">{c.lead_analyst}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-slate-500 italic">Unassigned</span>
                                            )}
                                        </td>

                                        {/* Evidence & Comments */}
                                        <td className="p-4 font-mono text-xs">
                                            <div className="flex items-center gap-3 text-slate-400">
                                                <span title="Evidence items attached" className="flex items-center gap-1">
                                                    <Layers size={13} className="text-amber-400" />
                                                    {c.evidence?.length || 0}
                                                </span>
                                                <span title="Analyst comments" className="flex items-center gap-1">
                                                    <MessageSquare size={13} className="text-blue-400" />
                                                    {c.comment_count || 0}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Created Date */}
                                        <td className="p-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                            {c.created_at ? new Date(c.created_at).toLocaleString() : 'N/A'}
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 text-right pr-6 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                {userCanWrite && (
                                                    <button
                                                        onClick={() => openStatusTransition(c)}
                                                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
                                                        title="Transition Status"
                                                    >
                                                        Status
                                                    </button>
                                                )}
                                                <Link
                                                    to={`/soc/incidents/${c.id}`}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm shadow-blue-600/30"
                                                >
                                                    <span>Workspace</span>
                                                    <ArrowUpRight size={13} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredCases.length > pageSize && (
                    <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <div>
                            Showing <span className="text-white font-mono font-bold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                            <span className="text-white font-mono font-bold">
                                {Math.min(currentPage * pageSize, filteredCases.length)}
                            </span>{' '}
                            of <span className="text-white font-mono font-bold">{filteredCases.length}</span> cases
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-40 transition flex items-center gap-1"
                            >
                                <ChevronLeft size={14} /> Previous
                            </button>
                            <span className="font-mono text-slate-300">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-40 transition flex items-center gap-1"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Details Drawer */}
            {selectedCase && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
                    <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div>
                                <div className="text-xs text-cyan-400 font-mono font-bold">
                                    {selectedCase.case_number}
                                </div>
                                <h2 className="text-lg font-bold text-white mt-1">
                                    {selectedCase.title}
                                </h2>
                            </div>
                            <button onClick={() => setSelectedCase(null)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Status & Priority Row */}
                        <div className="grid grid-cols-3 gap-3 text-xs">
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                <div className="text-slate-400 mb-1">Status</div>
                                <span className={`px-2 py-0.5 rounded-full font-mono font-bold ${getStatusBadge(selectedCase.status)}`}>
                                    {selectedCase.status}
                                </span>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                <div className="text-slate-400 mb-1">Severity</div>
                                <span className={`px-2 py-0.5 rounded font-bold ${getSeverityBadge(selectedCase.severity)}`}>
                                    {selectedCase.severity}
                                </span>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                <div className="text-slate-400 mb-1">Priority</div>
                                <span className={`px-2 py-0.5 rounded font-mono font-bold ${getPriorityBadge(selectedCase.priority)}`}>
                                    {selectedCase.priority}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        {selectedCase.description && (
                            <div className="space-y-1 text-xs">
                                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Description</div>
                                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {selectedCase.description}
                                </div>
                            </div>
                        )}

                        {/* Assignment */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Assigned Team:</span>
                                <span className="text-white font-medium">{selectedCase.assigned_team || 'Tier 1 Triage'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Lead Analyst:</span>
                                <span className="text-cyan-400 font-mono font-bold">{selectedCase.lead_analyst || 'Unassigned'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Created:</span>
                                <span className="text-slate-300 font-mono">{new Date(selectedCase.created_at).toLocaleString()}</span>
                            </div>
                            {selectedCase.closed_at && (
                                <div className="flex justify-between text-emerald-400">
                                    <span>Closed At:</span>
                                    <span className="font-mono">{new Date(selectedCase.closed_at).toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        {/* Evidence Summary */}
                        {selectedCase.evidence && selectedCase.evidence.length > 0 && (
                            <div className="space-y-2 text-xs">
                                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                    Attached Evidence ({selectedCase.evidence.length})
                                </div>
                                <div className="space-y-2">
                                    {selectedCase.evidence.map((ev, idx) => (
                                        <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300">
                                            <span className="text-slate-500">[{ev.type}]</span> {ev.hostname ? `Host: ${ev.hostname}` : ''} {ev.rule_name ? `Rule: ${ev.rule_name}` : ''}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                            {userCanWrite && (
                                <button
                                    onClick={() => {
                                        openStatusTransition(selectedCase);
                                    }}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
                                >
                                    Change Status
                                </button>
                            )}
                            <Link
                                to={`/soc/incidents/${selectedCase.id}`}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                            >
                                <span>Open Full Investigation Workspace</span>
                                <ArrowUpRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Case Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-rose-500" />
                                Create New SOC Case
                            </h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Case Title *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Credential Dumping Attempt on DC-01"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-rose-500 transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Severity</label>
                                    <select
                                        value={newSeverity}
                                        onChange={(e) => setNewSeverity(e.target.value as SocCaseSeverity)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                                    >
                                        <option value="Critical">Critical</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                                    <select
                                        value={newPriority}
                                        onChange={(e) => setNewPriority(e.target.value as SocCasePriority)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                                    >
                                        <option value="P1">P1 (Urgent SLA)</option>
                                        <option value="P2">P2 (Standard SLA)</option>
                                        <option value="P3">P3 (Medium)</option>
                                        <option value="P4">P4 (Low)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Assigned Team</label>
                                    <input
                                        type="text"
                                        value={newAssignedTeam}
                                        onChange={(e) => setNewAssignedTeam(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Lead Analyst (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. secops_lead"
                                        value={newLeadAnalyst}
                                        onChange={(e) => setNewLeadAnalyst(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    placeholder="Provide incident context, affected hosts, indicators of compromise..."
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none resize-none focus:border-rose-500 transition"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingCreate}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-md shadow-rose-600/30 disabled:opacity-50"
                                >
                                    {isSubmittingCreate ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                                    Create Case
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Status Transition Modal */}
            {isStatusModalOpen && statusTargetCase && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-white">Transition Case Status</h3>
                                <p className="text-xs text-cyan-400 font-mono mt-0.5">{statusTargetCase.case_number}</p>
                            </div>
                            <button onClick={() => setIsStatusModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleStatusTransition} className="space-y-4 text-xs">
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                <span className="text-slate-400">Current Status: </span>
                                <span className={`px-2 py-0.5 rounded font-mono font-bold ${getStatusBadge(statusTargetCase.status)}`}>
                                    {statusTargetCase.status}
                                </span>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Target Status (Permitted Transitions)</label>
                                <select
                                    value={targetStatus}
                                    onChange={(e) => setTargetStatus(e.target.value as SocCaseStatus)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                                >
                                    {getPermittedTransitions(statusTargetCase.status).map((st) => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                            </div>

                            {targetStatus === 'CLOSED' && (
                                <div>
                                    <label className="block text-rose-300 font-semibold mb-1">Closure Summary *</label>
                                    <textarea
                                        required
                                        rows={3}
                                        placeholder="Document resolution verification, root cause findings, and threat neutralization..."
                                        value={closureSummary}
                                        onChange={(e) => setClosureSummary(e.target.value)}
                                        className="w-full bg-slate-950 border border-rose-900/60 rounded-xl p-3 text-white outline-none resize-none"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Transition Notes (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Host verified clean after EDR containment"
                                    value={statusNotes}
                                    onChange={(e) => setStatusNotes(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsStatusModalOpen(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingStatus}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-md shadow-blue-600/30 disabled:opacity-50"
                                >
                                    {isSubmittingStatus ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle size={16} />}
                                    Update Status
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
