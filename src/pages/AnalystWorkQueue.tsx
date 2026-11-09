import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, AlertTriangle, Clock, CheckCircle, 
  Users, ChevronRight, UserCheck, Search,
  RefreshCw, CheckSquare, Square, Zap,
  ExternalLink, UserPlus
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  fetchSocCases, 
  assignSocCase, 
  updateSocCaseStatus, 
  getPermittedTransitions,
  type SocCaseItem, 
  type SocCaseStatus, 
  type SocCaseSeverity 
} from '../services/soc_case_api';

// Severity SLA Policies (in minutes)
const SEVERITY_SLA_MINUTES: Record<SocCaseSeverity, number> = {
  Critical: 15,
  High: 60,
  Medium: 240,
  Low: 1440
};

interface SlaStatus {
  ageMinutes: number;
  remainingMinutes: number;
  isBreached: boolean;
  targetMinutes: number;
}

function calculateSla(c: SocCaseItem): SlaStatus {
  const createdAt = new Date(c.created_at).getTime();
  const now = Date.now();
  const ageMinutes = Math.max(0, Math.floor((now - createdAt) / (1000 * 60)));
  const targetMinutes = SEVERITY_SLA_MINUTES[c.severity] || 240;
  const remainingMinutes = targetMinutes - ageMinutes;
  const isResolvedOrClosed = c.status === 'RESOLVED' || c.status === 'CLOSED';
  const isBreached = !isResolvedOrClosed && remainingMinutes <= 0;

  return { ageMinutes, remainingMinutes, isBreached, targetMinutes };
}

export default function AnalystWorkQueue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFilter = searchParams.get('filter') || 'all';
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<SocCaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  // Status Change Modal State
  const [statusModalCase, setStatusModalCase] = useState<SocCaseItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<SocCaseStatus>('TRIAGED');
  const [statusNotes, setStatusNotes] = useState('');
  const [closureSummary, setClosureSummary] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Reassign Modal State
  const [assignModalCase, setAssignModalCase] = useState<SocCaseItem | null>(null);
  const [assignAnalyst, setAssignAnalyst] = useState('');
  const [assignTeam, setAssignTeam] = useState('Tier 2 Threat Response');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Bulk Action State
  const [bulkAction, setBulkAction] = useState<'assign' | 'status'>('assign');
  const [bulkAnalystName, setBulkAnalystName] = useState('');
  const [bulkStatusValue, setBulkStatusValue] = useState<SocCaseStatus>('TRIAGED');
  const [submittingBulk, setSubmittingBulk] = useState(false);

  const loadCases = async () => {
    try {
      setLoading(true);
      const data = await fetchSocCases({ limit: 100 });
      setCases(data);
      setSelectedIds([]);
    } catch (err: unknown) {
      console.error('Failed to load analyst queue cases:', err);
      const msg = (err instanceof Error) ? err.message : 'Failed to load SOC cases';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  // Filter cases in-memory based on selected tab and search query
  const filteredCases = useMemo(() => {
    let result = cases;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => 
        c.title.toLowerCase().includes(q) ||
        c.case_number.toLowerCase().includes(q) ||
        (c.lead_analyst && c.lead_analyst.toLowerCase().includes(q)) ||
        (c.tags && c.tags.some(t => t.toLowerCase().includes(q))) ||
        (c.evidence && c.evidence.some(e => e.agent_id && e.agent_id.toLowerCase().includes(q)))
      );
    }

    switch (currentFilter) {
      case 'my':
        return result.filter(c => c.lead_analyst && user?.username && c.lead_analyst.toLowerCase() === user.username.toLowerCase());
      case 'unassigned':
        return result.filter(c => !c.lead_analyst);
      case 'critical_high':
        return result.filter(c => c.severity === 'Critical' || c.severity === 'High');
      case 'awaiting_triage':
        return result.filter(c => c.status === 'NEW');
      case 'overdue':
        return result.filter(c => calculateSla(c).isBreached);
      case 'active':
        return result.filter(c => c.status !== 'CLOSED' && c.status !== 'RESOLVED');
      case 'all':
      default:
        return result;
    }
  }, [cases, currentFilter, searchQuery, user?.username]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = cases.length;
    const myCases = cases.filter(c => c.lead_analyst && user?.username && c.lead_analyst.toLowerCase() === user.username.toLowerCase()).length;
    const unassigned = cases.filter(c => !c.lead_analyst).length;
    const criticalHigh = cases.filter(c => (c.severity === 'Critical' || c.severity === 'High') && c.status !== 'CLOSED').length;
    const overdue = cases.filter(c => calculateSla(c).isBreached).length;
    return { total, myCases, unassigned, criticalHigh, overdue };
  }, [cases, user?.username]);

  // Handle Quick Assign to Current User
  const handleAssignToMe = async (c: SocCaseItem) => {
    const username = user?.username || 'analyst';
    try {
      setActionInProgress(c.id);
      await assignSocCase(c.id, { lead_analyst: username, assigned_team: 'SOC Tier 1' });
      toast.success(`Case ${c.case_number} assigned to @${username}`);
      await loadCases();
    } catch (err: unknown) {
      const msg = (err instanceof Error) ? err.message : 'Failed to assign case';
      toast.error(msg);
    } finally {
      setActionInProgress(null);
    }
  };

  // Open Status Modal with permitted transitions
  const handleOpenStatusModal = (c: SocCaseItem) => {
    setStatusModalCase(c);
    const permitted = getPermittedTransitions(c.status);
    setTargetStatus(permitted.length > 0 ? permitted[0] : c.status);
    setStatusNotes('');
    setClosureSummary('');
  };

  // Submit Status Transition
  const handleSubmitStatusChange = async () => {
    if (!statusModalCase) return;
    try {
      setSubmittingStatus(true);
      await updateSocCaseStatus(statusModalCase.id, {
        status: targetStatus,
        notes: statusNotes.trim() || undefined,
        closure_summary: targetStatus === 'CLOSED' ? (closureSummary.trim() || 'Closed by analyst in triage queue') : undefined
      });
      toast.success(`Case ${statusModalCase.case_number} transitioned to ${targetStatus}`);
      setStatusModalCase(null);
      await loadCases();
    } catch (err: unknown) {
      const msg = (err instanceof Error) ? err.message : 'Failed to update status';
      toast.error(msg);
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Open Reassign Modal
  const handleOpenAssignModal = (c: SocCaseItem) => {
    setAssignModalCase(c);
    setAssignAnalyst(c.lead_analyst || user?.username || '');
    setAssignTeam(c.assigned_team || 'Tier 2 Threat Response');
  };

  // Submit Reassign
  const handleSubmitAssign = async () => {
    if (!assignModalCase || !assignAnalyst.trim()) {
      toast.error('Analyst username is required');
      return;
    }
    try {
      setSubmittingAssign(true);
      await assignSocCase(assignModalCase.id, {
        lead_analyst: assignAnalyst.trim(),
        assigned_team: assignTeam.trim() || undefined
      });
      toast.success(`Case ${assignModalCase.case_number} assigned to ${assignAnalyst.trim()}`);
      setAssignModalCase(null);
      await loadCases();
    } catch (err: unknown) {
      const msg = (err instanceof Error) ? err.message : 'Failed to assign case';
      toast.error(msg);
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCases.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCases.map(c => c.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Bulk Execution
  const executeBulkOperation = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one case');
      return;
    }
    setSubmittingBulk(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        if (bulkAction === 'assign') {
          if (!bulkAnalystName.trim()) {
            toast.error('Please enter an analyst username for bulk assignment');
            setSubmittingBulk(false);
            return;
          }
          await assignSocCase(id, { lead_analyst: bulkAnalystName.trim() });
          successCount++;
        } else if (bulkAction === 'status') {
          await updateSocCaseStatus(id, { status: bulkStatusValue });
          successCount++;
        }
      } catch {
        failCount++;
      }
    }

    setSubmittingBulk(false);
    if (successCount > 0) {
      toast.success(`Bulk operation completed: ${successCount} updated${failCount > 0 ? `, ${failCount} failed` : ''}`);
      await loadCases();
    } else {
      toast.error('Bulk operation failed for all selected cases');
    }
  };

  const filterTabs = [
    { key: 'all', label: 'All Cases', count: metrics.total },
    { key: 'my', label: 'My Cases', count: metrics.myCases },
    { key: 'unassigned', label: 'Unassigned Queue', count: metrics.unassigned },
    { key: 'critical_high', label: 'Critical & High', count: metrics.criticalHigh },
    { key: 'awaiting_triage', label: 'Awaiting Triage (NEW)', count: cases.filter(c => c.status === 'NEW').length },
    { key: 'overdue', label: 'SLA Breached / Overdue', count: metrics.overdue }
  ];

  return (
    <div className="p-6 max-w-[1750px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-500" />
            Analyst Work Queue & Triage Workbench
          </h1>
          <p className="text-sm text-slate-400">
            Real-time SOC case dispatch, severity SLA tracking, one-click triage assignment, and state machine controls.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case #, title, host, analyst..."
              className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 w-56 md:w-72"
            />
          </div>

          <button
            onClick={loadCases}
            disabled={loading}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/soc/incidents"
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-medium transition shadow-md shadow-blue-500/20"
          >
            <span>All Incidents</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 font-mono uppercase">Total Cases</div>
          <div className="text-xl font-bold text-white mt-1">{metrics.total}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 font-mono uppercase">My Active Cases</div>
          <div className="text-xl font-bold text-blue-400 mt-1">{metrics.myCases}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 font-mono uppercase">Unassigned Cases</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{metrics.unassigned}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 font-mono uppercase">Critical / High</div>
          <div className="text-xl font-bold text-rose-400 mt-1">{metrics.criticalHigh}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 font-mono uppercase">SLA Breached</div>
          <div className={`text-xl font-bold mt-1 ${metrics.overdue > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
            {metrics.overdue}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs font-semibold">
        {filterTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setSearchParams({ filter: t.key })}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition flex items-center gap-2 ${
              currentFilter === t.key 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>{t.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              currentFilter === t.key ? 'bg-blue-750 text-blue-100 bg-white/20' : 'bg-slate-800 text-slate-400'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk Action Bar (Visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-950/40 border border-blue-500/40 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs shadow-xl animate-in fade-in">
          <div className="flex items-center space-x-3 text-slate-200">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span><b>{selectedIds.length}</b> cases selected</span>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value as 'assign' | 'status')}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="assign">Bulk Assign</option>
              <option value="status">Bulk Update Status</option>
            </select>

            {bulkAction === 'assign' && (
              <input
                type="text"
                placeholder="Analyst username..."
                value={bulkAnalystName}
                onChange={(e) => setBulkAnalystName(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none placeholder-slate-500"
              />
            )}

            {bulkAction === 'status' && (
              <select
                value={bulkStatusValue}
                onChange={(e) => setBulkStatusValue(e.target.value as SocCaseStatus)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="TRIAGED">TRIAGED</option>
                <option value="CONTAINED">CONTAINED</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            )}

            <button
              onClick={executeBulkOperation}
              disabled={submittingBulk}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {submittingBulk ? 'Executing...' : 'Apply to Selected'}
            </button>
          </div>
        </div>
      )}

      {/* Main Cases Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="p-4 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                    {selectedIds.length === filteredCases.length && filteredCases.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">Case Details</th>
                <th className="p-4">Severity & Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assigned Analyst</th>
                <th className="p-4">SLA Countdown</th>
                <th className="p-4">Evidence & Tags</th>
                <th className="p-4 text-right">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 font-mono">
                    Zero cases matching filter "{currentFilter}". All queues clear.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const isCritical = c.severity === 'Critical';
                  const isHigh = c.severity === 'High';
                  const sla = calculateSla(c);

                  const targetHost = c.evidence?.find(e => e.agent_id)?.agent_id || 
                                     c.evidence?.find(e => e.hostname)?.hostname || 'N/A';

                  return (
                    <tr 
                      key={c.id}
                      className={`hover:bg-slate-800/50 transition ${isSelected ? 'bg-blue-950/20' : ''}`}
                    >
                      <td className="p-4">
                        <button onClick={() => toggleSelect(c.id)} className="text-slate-400 hover:text-white">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <Link 
                            to={`/soc/incidents/${c.id}`}
                            className="font-semibold text-white hover:text-blue-400 flex items-center gap-1.5 transition"
                          >
                            <span className="font-mono text-blue-400">[{c.case_number}]</span>
                            <span>{c.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          </Link>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                            <span>Host: <b className="text-slate-300">{targetHost}</b></span>
                            <span>•</span>
                            <span>Opened {sla.ageMinutes}m ago</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                            isCritical 
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                              : isHigh 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {c.severity}
                          </span>
                          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                            {c.priority}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          c.status === 'NEW' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          c.status === 'TRIAGED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          c.status === 'CONTAINED' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                          c.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          {c.lead_analyst ? (
                            <div className="flex items-center gap-1.5 text-slate-200">
                              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                              <span className="font-medium">@{c.lead_analyst}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>UNASSIGNED</span>
                            </div>
                          )}
                          {c.assigned_team && (
                            <div className="text-[10px] text-slate-400 font-mono">{c.assigned_team}</div>
                          )}
                        </div>
                      </td>

                      <td className="p-4 font-mono">
                        {c.status === 'CLOSED' || c.status === 'RESOLVED' ? (
                          <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Resolved
                          </span>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Clock className={`w-3.5 h-3.5 ${sla.isBreached ? 'text-rose-400' : 'text-emerald-400'}`} />
                              <span className={sla.isBreached ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                {sla.isBreached 
                                  ? `${Math.abs(sla.remainingMinutes)}m overdue` 
                                  : `${sla.remainingMinutes}m left`}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-500">
                              Policy: {sla.targetMinutes}m max
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {c.tags && c.tags.length > 0 ? (
                            c.tags.slice(0, 3).map((t, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded font-mono text-[10px]">
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-[10px] font-mono">No tags</span>
                          )}
                          {c.evidence && c.evidence.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-blue-950/40 border border-blue-800/40 text-blue-300 rounded font-mono text-[10px]">
                              {c.evidence.length} ev
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Quick Assign to Me */}
                          {(!c.lead_analyst || (user?.username && c.lead_analyst.toLowerCase() !== user.username.toLowerCase())) && (
                            <button
                              onClick={() => handleAssignToMe(c)}
                              disabled={actionInProgress === c.id}
                              title="Assign to Me"
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg border border-slate-700 flex items-center gap-1 transition"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-semibold">Claim</span>
                            </button>
                          )}

                          {/* Reassign Modal Trigger */}
                          <button
                            onClick={() => handleOpenAssignModal(c)}
                            title="Assign / Reassign"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>

                          {/* Status Transition Trigger */}
                          <button
                            onClick={() => handleOpenStatusModal(c)}
                            title="Change Status (State Machine)"
                            className="p-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 rounded-lg border border-amber-800/60 transition"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>

                          {/* Open in Workspace */}
                          <Link
                            to={`/soc/incidents/${c.id}`}
                            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition"
                            title="Investigate in Workspace"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Transition Modal */}
      {statusModalCase && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Update Status: {statusModalCase.case_number}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Current Status: <span className="text-white font-mono font-bold">{statusModalCase.status}</span>
                </p>
              </div>
              <button onClick={() => setStatusModalCase(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Next Permitted Status</label>
                {getPermittedTransitions(statusModalCase.status).length === 0 ? (
                  <p className="text-rose-400 font-mono text-[11px]">No permitted state transitions available.</p>
                ) : (
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as SocCaseStatus)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    {getPermittedTransitions(statusModalCase.status).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              </div>

              {targetStatus === 'CLOSED' && (
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Closure Summary *</label>
                  <textarea
                    rows={2}
                    value={closureSummary}
                    onChange={(e) => setClosureSummary(e.target.value)}
                    placeholder="Provide justification and resolution summary for closing this case..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Transition Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Internal audit notes regarding this status change..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button 
                onClick={() => setStatusModalCase(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitStatusChange}
                disabled={submittingStatus || getPermittedTransitions(statusModalCase.status).length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {submittingStatus ? 'Updating...' : 'Confirm Transition'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Analyst Modal */}
      {assignModalCase && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Assign Lead Analyst: {assignModalCase.case_number}
                </h3>
              </div>
              <button onClick={() => setAssignModalCase(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Analyst Username *</label>
                <input
                  type="text"
                  value={assignAnalyst}
                  onChange={(e) => setAssignAnalyst(e.target.value)}
                  placeholder="e.g. secops_lead, analyst1..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Assigned SOC Team</label>
                <input
                  type="text"
                  value={assignTeam}
                  onChange={(e) => setAssignTeam(e.target.value)}
                  placeholder="e.g. Tier 1 Triage, Forensics..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button 
                onClick={() => setAssignModalCase(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitAssign}
                disabled={submittingAssign || !assignAnalyst.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {submittingAssign ? 'Assigning...' : 'Save Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
