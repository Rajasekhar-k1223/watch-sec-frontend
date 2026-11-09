import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  AlertTriangle, Activity, Lock, Clock, 
  Terminal, Network, FileText, CheckCircle, ChevronRight, 
  Layers, ArrowLeft, Bot, MessageSquare, Send,
  Share2, Shield, ShieldCheck, UserCheck, Check, X, RefreshCw
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  type SocCaseItem, 
  type SocCaseStatus, 
  type SocCaseComment,
  type ContainHostResponse,
  fetchSocCaseDetail, 
  updateSocCaseStatus, 
  assignSocCase, 
  fetchSocCaseComments, 
  addSocCaseComment, 
  containHostSafely,
  getPermittedTransitions
} from '../services/soc_case_api';

interface WorkspaceTimelineItem {
  event: string;
  timestamp: string;
  source: string;
  severity: string;
}

interface ProcessTreeNode {
  pid: number;
  name: string;
  command_line?: string;
  children?: ProcessTreeNode[];
}

interface NetworkActivityItem {
  dest_ip: string;
  dest_port: number;
  protocol: string;
  threat_intel_match?: string;
  bytes_sent?: number;
  bytes_recv?: number;
}

interface MitreAttackItem {
  tactic: string;
  technique: string;
  phase: string;
}

interface SecurityGraphNode {
  id: string;
  type: string;
  label: string;
  status: string;
}

interface AiAnswerItem {
  question?: string;
  answer?: string;
  response?: string;
  confidence?: number;
  sources?: string[];
  [key: string]: unknown;
}

interface WorkspaceDataPayload {
  affected_devices?: Array<{ agent_id?: string; hostname?: string; os?: string }>;
  timeline?: WorkspaceTimelineItem[];
  process_tree?: ProcessTreeNode;
  network_activity?: NetworkActivityItem[];
  mitre_attack?: MitreAttackItem[];
  security_graph?: { nodes?: SecurityGraphNode[] };
  overview?: { title?: string; assigned_to?: string; [key: string]: unknown };
  severity?: { level?: string; [key: string]: unknown };
  [key: string]: unknown;
}

const ADMIN_CONTAINMENT_ROLES = ['SuperAdmin', 'Admin', 'TenantAdmin'];
const SOC_WRITE_ROLES = ['SuperAdmin', 'Admin', 'TenantAdmin', 'Analyst'];

export default function AdvancedIncidentWorkspace() {
  const { id } = useParams<{ id: string }>();
  const parsedId = parseInt(id || '1', 10);
  const { token, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'forensics' | 'graph' | 'ai' | 'notes' | 'audit'>('overview');

  // Core SOC Case Data
  const [socCase, setSocCase] = useState<SocCaseItem | null>(null);
  const [comments, setComments] = useState<SocCaseComment[]>([]);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceDataPayload | null>(null);

  // Status Transition Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<SocCaseStatus>('TRIAGED');
  const [closureSummary, setClosureSummary] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignAnalyst, setAssignAnalyst] = useState('');
  const [assignTeam, setAssignTeam] = useState('Tier 2 Threat Response');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Note Composer State
  const [noteText, setNoteText] = useState('');
  const [isCustomerVisible, setIsCustomerVisible] = useState(false);
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Containment State (Admin Only)
  const [containAgentId, setContainAgentId] = useState('');
  const [containConfirmed, setContainConfirmed] = useState(false);
  const [containSafeMode, setContainSafeMode] = useState(true);
  const [containReason, setContainReason] = useState('Critical threat containment ordered from SOC Workspace');
  const [isSubmittingContain, setIsSubmittingContain] = useState(false);
  const [containmentResult, setContainmentResult] = useState<ContainHostResponse | null>(null);

  // AI Prompt State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswers, setAiAnswers] = useState<AiAnswerItem[]>([]);

  // Permissions
  const userRole = user?.role || user?.Role || '';
  const canContain = ADMIN_CONTAINMENT_ROLES.includes(userRole);
  const canWrite = SOC_WRITE_ROLES.includes(userRole);

  // Load Case & Workspace Data
  const loadCaseData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // 1. Load primary modern SOC Case
      let currentCase: SocCaseItem | null = null;
      try {
        currentCase = await fetchSocCaseDetail(parsedId);
        setSocCase(currentCase);
        if (currentCase.lead_analyst) {
          setAssignAnalyst(currentCase.lead_analyst);
        }
        if (currentCase.assigned_team) {
          setAssignTeam(currentCase.assigned_team);
        }
      } catch (err: unknown) {
        console.warn("Could not load from /v2/soc/cases, checking legacy /workspace:", err);
      }

      // 2. Load comments
      if (currentCase) {
        try {
          const cms = await fetchSocCaseComments(currentCase.id);
          setComments(cms);
        } catch (e) {
          console.warn("Could not load comments:", e);
        }
      }

      // 3. Load /v2/soc/incidents/:id/workspace for enriched telemetry
      const incId = currentCase?.incident_id || parsedId;
      try {
        const res = await fetch(`${API_URL}/v2/soc/incidents/${incId}/workspace`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setWorkspaceData(json);
          // Auto-select agent for containment if found
          setContainAgentId(prev => {
            if (!prev && json.affected_devices?.length > 0) {
              return json.affected_devices[0].agent_id || '';
            }
            return prev;
          });
        }
      } catch (e) {
        console.warn("Could not load incident workspace:", e);
      }

      // Fallback agent from case evidence
      if (currentCase?.evidence && currentCase.evidence.length > 0) {
        const found = currentCase.evidence.find(ev => ev.agent_id);
        if (found?.agent_id) {
          setContainAgentId(prev => prev || (found.agent_id as string));
        }
      }

    } catch (err: unknown) {
      console.error('Failed to load incident investigation', err);
      const msg = (err instanceof Error) ? err.message : 'Failed to load incident investigation workspace';
      setLoadError(msg);
      toast.error('Failed to load incident investigation');
    } finally {
      setLoading(false);
    }
  }, [parsedId, token]);

  useEffect(() => {
    if (token) {
      loadCaseData();
    }
  }, [token, loadCaseData]);

  // Handle Status Transition
  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socCase) return;

    if (targetStatus === 'CLOSED' && !closureSummary.trim()) {
      toast.error('Closure summary is required when closing a case.');
      return;
    }

    setIsSubmittingStatus(true);
    try {
      const updated = await updateSocCaseStatus(socCase.id, {
        status: targetStatus,
        notes: statusNotes.trim() || undefined,
        closure_summary: closureSummary.trim() || undefined
      });
      setSocCase(updated);
      toast.success(`Case transitioned to ${updated.status}!`);
      setIsStatusModalOpen(false);
      setClosureSummary('');
      setStatusNotes('');
      loadCaseData();
    } catch (err: unknown) {
      const msg = (err instanceof Error) ? err.message : 'Status transition failed';
      toast.error(msg);
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Handle Assign Case
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socCase) return;
    if (!assignAnalyst.trim()) {
      toast.error('Lead analyst username is required.');
      return;
    }

    setIsSubmittingAssign(true);
    try {
      const updated = await assignSocCase(socCase.id, {
        lead_analyst: assignAnalyst.trim(),
        assigned_team: assignTeam.trim() || undefined
      });
      setSocCase(updated);
      toast.success(`Case assigned to ${updated.lead_analyst}!`);
      setIsAssignModalOpen(false);
      loadCaseData();
    } catch (err: unknown) {
      const msg = (err instanceof Error) ? err.message : 'Assignment failed';
      toast.error(msg);
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Handle Note / Comment Posting
  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    if (!socCase) {
      toast.error('No active SOC case loaded');
      return;
    }

    setNoteSubmitting(true);
    try {
      const newComment = await addSocCaseComment(socCase.id, {
        comment_text: noteText.trim(),
        is_customer_visible: isCustomerVisible
      });
      setComments(prev => [...prev, newComment]);
      toast.success(isCustomerVisible ? 'Customer advisory dispatched' : 'Internal analyst note recorded');
      setNoteText('');
    } catch (err: unknown) {
      const msg = (err instanceof Error) ? err.message : 'Failed to save note';
      toast.error(msg);
    } finally {
      setNoteSubmitting(false);
    }
  };

  // Handle Host Containment (Admin Only)
  const handleContainHost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socCase) return;
    if (!canContain) {
      toast.error('Access denied: Host containment requires Admin or SuperAdmin role');
      return;
    }
    if (!containAgentId.trim()) {
      toast.error('Target Agent ID is required');
      return;
    }
    if (!containConfirmed) {
      toast.error('You must explicitly confirm the containment action');
      return;
    }

    setIsSubmittingContain(true);
    try {
      const res = await containHostSafely(socCase.id, {
        agent_id: containAgentId.trim(),
        confirmed: true,
        safe_mode: containSafeMode,
        reason: containReason.trim()
      });
      setContainmentResult(res);
      toast.success(res.message || 'Containment executed successfully', { icon: '🔒' });
      loadCaseData();
    } catch (err: unknown) {
      console.error('Host containment error:', err);
      const msg = (err instanceof Error) ? err.message : 'Host containment failed';
      toast.error(msg);
    } finally {
      setIsSubmittingContain(false);
    }
  };

  // Handle AI SOC Question
  const handleAskAi = async () => {
    if (!aiQuestion.trim()) return;
    const incId = socCase?.incident_id || parsedId;
    setAiLoading(true);
    try {
      const res = await fetch(`${API_URL}/v2/soc/ai-investigate/${incId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ question: aiQuestion })
      });
      if (res.ok) {
        const json = await res.json();
        setAiAnswers(prev => [json, ...prev]);
        setAiQuestion('');
        toast.success('AI SOC analysis complete');
      } else {
        toast.error('AI SOC query failed');
      }
    } catch {
      toast.error('AI SOC query failed');
    } finally {
      setAiLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 font-mono text-sm tracking-wider uppercase">
            Loading SOC Investigation Workspace...
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError && !socCase && !workspaceData) {
    return (
      <div className="p-8 max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Investigation Workspace Unavailable</h2>
        <p className="text-sm text-slate-400 mb-6">{loadError}</p>
        <div className="flex gap-4">
          <Link to="/incidents" className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-700 transition">
            Back to Incidents Hub
          </Link>
          <button onClick={loadCaseData} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // Fallbacks for display
  const caseNumber = socCase?.case_number || `INCIDENT #${parsedId}`;
  const caseTitle = socCase?.title || workspaceData?.overview?.title || 'Security Incident Investigation';
  const caseSeverity = socCase?.severity || workspaceData?.severity?.level || 'High';
  const caseStatus = socCase?.status || 'NEW';
  const casePriority = socCase?.priority || 'P1';
  const leadAnalyst = socCase?.lead_analyst || workspaceData?.overview?.assigned_to || 'Unassigned';
  const assignedTeam = socCase?.assigned_team || 'Tier 1 Triage';

  // State machine permitted transitions
  const permittedTransitions = socCase ? getPermittedTransitions(socCase.status) : [];

  return (
    <div className="p-4 md:p-6 max-w-[1700px] mx-auto space-y-6 bg-slate-950 text-slate-100 min-h-screen">
      
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Link to="/incidents" className="hover:text-blue-400 transition flex items-center gap-1">
              <ArrowLeft size={12} /> Incidents Hub
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/soc/queue" className="hover:text-blue-400 transition">Analyst Queue</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-cyan-400 font-mono font-bold">{caseNumber}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${caseSeverity === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
              {caseSeverity}
            </span>
            <span className="px-2 py-0.5 bg-slate-800 text-cyan-300 border border-slate-700 rounded text-xs font-mono font-bold">
              {casePriority}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${caseStatus === 'NEW' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
              STATUS: {caseStatus}
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{caseTitle}</h1>
          </div>
        </div>

        {/* Lead & Actions */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300">
            <span>TEAM: <b className="text-white">{assignedTeam}</b></span>
          </div>
          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300">
            <span>LEAD: <b className="text-cyan-400">{leadAnalyst}</b></span>
          </div>

          {canWrite && socCase && (
            <>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition font-sans font-semibold"
              >
                Assign
              </button>
              {permittedTransitions.length > 0 && (
                <button
                  onClick={() => {
                    setTargetStatus(permittedTransitions[0]);
                    setIsStatusModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-sans font-bold transition shadow-sm"
                >
                  Change Status
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition whitespace-nowrap ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          <Activity className="w-4 h-4" />
          <span>Case Triage & Containment</span>
        </button>

        <button
          onClick={() => setActiveTab('forensics')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition whitespace-nowrap ${activeTab === 'forensics' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          <Terminal className="w-4 h-4" />
          <span>Telemetry & Forensics</span>
        </button>

        <button
          onClick={() => setActiveTab('graph')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition whitespace-nowrap ${activeTab === 'graph' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          <Share2 className="w-4 h-4" />
          <span>Security Graph & MITRE ({socCase?.mitre_map?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition whitespace-nowrap ${activeTab === 'ai' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          <Bot className="w-4 h-4 text-cyan-400" />
          <span>Grounded AI SOC Copilot</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition whitespace-nowrap ${activeTab === 'notes' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Case Notes & Comms ({comments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition whitespace-nowrap ${activeTab === 'audit' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Audit Ledger</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: OVERVIEW & CONTAINMENT */}
      {/* =================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-mono">Case Number</span>
              <div className="text-xl font-bold text-cyan-400 font-mono mt-1">{caseNumber}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Tenant #{socCase?.tenant_id || 1}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-mono">Current Status</span>
              <div className="text-xl font-bold text-white font-mono mt-1">{caseStatus}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {permittedTransitions.length > 0 ? `Allowed next: ${permittedTransitions.join(', ')}` : 'Terminal Status'}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-mono">Attached Evidence</span>
              <div className="text-xl font-bold text-amber-400 font-mono mt-1">{socCase?.evidence?.length || 0} Items</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Immutable audit artifacts</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase font-mono">Lead Analyst</span>
              <div className="text-xl font-bold text-purple-400 font-mono mt-1">{leadAnalyst}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{assignedTeam}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Description, Evidence & Timeline */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Description & Investigation Notes */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Case Description & Investigation Scope
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap">
                  {socCase?.description || 'No detailed description provided for this SOC case.'}
                </p>

                {socCase?.internal_notes && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Internal Case Log:</span>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono whitespace-pre-wrap">
                      {socCase.internal_notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Evidence References */}
              {socCase?.evidence && socCase.evidence.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    Forensic Evidence References ({socCase.evidence.length})
                  </h3>
                  <div className="space-y-2 text-xs">
                    {socCase.evidence.map((ev, idx) => (
                      <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-bold">[{ev.type}]</span>
                          {ev.timestamp && <span className="text-[10px] text-slate-500">{new Date(ev.timestamp).toLocaleString()}</span>}
                        </div>
                        {ev.hostname && <div className="text-slate-300">Host: {ev.hostname} ({ev.agent_id})</div>}
                        {ev.rule_name && <div className="text-cyan-300">Rule: {ev.rule_name} (ID: {ev.rule_id})</div>}
                        {ev.reason && <div className="text-slate-400">Reason: {ev.reason}</div>}
                        {ev.safe_mode !== undefined && (
                          <div className={`text-[10px] ${ev.safe_mode ? 'text-indigo-400' : 'text-rose-400 font-bold'}`}>
                            Mode: {ev.safe_mode ? 'Safe Mode Simulation' : 'Live Packet Containment'}
                          </div>
                        )}
                        {ev.matched_content && (
                          <div className="bg-black/50 p-2 rounded text-[11px] text-red-300 overflow-x-auto break-all">
                            {ev.matched_content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Telemetry Progression Timeline (from workspaceData if available) */}
              {workspaceData?.timeline && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    Attack Progression Timeline
                  </h3>
                  <div className="relative border-l-2 border-slate-800 ml-3 space-y-4 py-2">
                    {workspaceData.timeline.map((ev, idx: number) => (
                      <div key={idx} className="relative pl-6">
                        <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
                        <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">{ev.event}</span>
                            <span className="font-mono text-[10px] text-slate-400">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-cyan-400 font-mono">[{ev.source}]</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold ${ev.severity === 'Critical' ? 'text-rose-400 bg-rose-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                              {ev.severity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right Col: Host Containment & Case Actions */}
            <div className="space-y-6">
              
              {/* Task 6: HOST CONTAINMENT UI (Admin Only) */}
              <div className="bg-slate-900 border border-rose-900/40 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-500" />
                    Endpoint Host Containment
                  </h3>
                  {canContain ? (
                    <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded font-mono font-bold">
                      Admin Authorized
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                      Admin Role Required
                    </span>
                  )}
                </div>

                {canContain ? (
                  <form onSubmit={handleContainHost} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Target Agent ID</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. pilot-46ef27fe"
                        value={containAgentId}
                        onChange={(e) => setContainAgentId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Containment Reason</label>
                      <input
                        type="text"
                        required
                        value={containReason}
                        onChange={(e) => setContainReason(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                      />
                    </div>

                    {/* Safe Mode Testing Toggle */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-indigo-900/40 space-y-2">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={containSafeMode}
                          onChange={(e) => setContainSafeMode(e.target.checked)}
                          className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                        />
                        <span className="text-indigo-300 font-bold text-xs">Safe Mode Test Mode</span>
                      </label>
                      <p className="text-[10px] text-slate-400">
                        When enabled, validates agent identity and C2 contracts, updates audit trail, but does NOT drop live network packets on the endpoint.
                      </p>
                    </div>

                    {/* Explicit Confirmation Gate */}
                    <div className="bg-rose-950/30 p-3 rounded-xl border border-rose-900/60">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={containConfirmed}
                          onChange={(e) => setContainConfirmed(e.target.checked)}
                          className="mt-0.5 rounded bg-slate-800 border-slate-700 text-rose-600 focus:ring-0"
                        />
                        <span className="text-rose-300 text-xs font-semibold leading-tight">
                          I explicitly confirm host containment for agent <b>{containAgentId || '(unspecified)'}</b>.
                        </span>
                      </label>
                    </div>

                    {/* Containment Result Banner */}
                    {containmentResult && (
                      <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-emerald-300 space-y-1">
                        <div className="flex items-center gap-2 font-bold">
                          <CheckCircle size={14} className="text-emerald-400" />
                          <span>{containmentResult.status.toUpperCase()}: {containmentResult.mode}</span>
                        </div>
                        <div className="text-[11px] text-slate-300">{containmentResult.message}</div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingContain || !containConfirmed || !containAgentId.trim()}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 disabled:opacity-40"
                    >
                      {isSubmittingContain ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock size={15} />}
                      {containSafeMode ? 'Execute Safe-Mode Containment' : 'Trigger Host Containment'}
                    </button>
                  </form>
                ) : (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs text-center space-y-1">
                    <Shield className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                    <p className="font-semibold text-slate-300">Host Containment Controls Restricted</p>
                    <p className="text-[11px] text-slate-500">
                      Your current role (<span className="text-cyan-400 font-mono">{userRole || 'Viewer'}</span>) is not authorized to dispatch host containment commands. Contact a TenantAdmin or SuperAdmin.
                    </p>
                  </div>
                )}
              </div>

              {/* State Machine Transition Quick Actions */}
              {canWrite && socCase && permittedTransitions.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Valid Status Transitions
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {permittedTransitions.map(st => (
                      <button
                        key={st}
                        onClick={() => {
                          setTargetStatus(st);
                          setIsStatusModalOpen(true);
                        }}
                        className="py-2 px-3 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200 border border-slate-700 rounded-xl font-mono font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <ChevronRight size={13} />
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: TELEMETRY & FORENSICS */}
      {/* =================================================================== */}
      {activeTab === 'forensics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {workspaceData?.process_tree ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Interactive Process Execution Tree
              </h3>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-3">
                <div>
                  <span className="text-slate-500">[PID {workspaceData.process_tree.pid}]</span> <b className="text-white">{workspaceData.process_tree.name}</b>
                </div>
                <div className="pl-6 border-l-2 border-slate-800 space-y-3">
                  {workspaceData.process_tree.children?.map((c, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <div>
                        <span className="text-slate-500">[PID {c.pid}]</span> <b className="text-yellow-400">{c.name}</b>
                        <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded mt-1 break-all">{c.command_line}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-center">
              No live process telemetry linked for this case.
            </div>
          )}

          {workspaceData?.network_activity ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan-400" />
                Network Sockets & C2 Telemetry
              </h3>
              <div className="space-y-2 text-xs">
                {workspaceData.network_activity.map((n, idx: number) => (
                  <div key={idx} className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5 font-mono">
                      <div className="text-slate-200 font-bold">{n.dest_ip}:{n.dest_port} ({n.protocol})</div>
                      <div className="text-cyan-400 text-[11px]">{n.threat_intel_match}</div>
                    </div>
                    <div className="text-right text-[11px] font-mono text-slate-400">
                      <div>Sent: {n.bytes_sent} B</div>
                      <div>Recv: {n.bytes_recv} B</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-center">
              No network telemetry recorded for this case.
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: SECURITY GRAPH & MITRE */}
      {/* =================================================================== */}
      {activeTab === 'graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MITRE ATT&CK */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Preserved MITRE ATT&CK Tactics & Techniques
            </h3>
            {socCase?.mitre_map && socCase.mitre_map.length > 0 ? (
              <div className="space-y-2.5 text-xs">
                {socCase.mitre_map.map((m, idx) => (
                  <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-purple-400 font-mono uppercase tracking-wider">{m.tactic}</span>
                      <div className="text-white font-semibold">{m.technique}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px] border border-slate-700">
                      {m.category || 'Endpoint Threat'}
                    </span>
                  </div>
                ))}
              </div>
            ) : workspaceData?.mitre_attack ? (
              <div className="space-y-2.5 text-xs">
                {workspaceData.mitre_attack.map((m, idx: number) => (
                  <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-purple-400 font-mono uppercase tracking-wider">{m.tactic}</span>
                      <div className="text-white font-semibold">{m.technique}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px] border border-slate-700">
                      {m.phase}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No MITRE ATT&CK indicators mapped to this case.</p>
            )}
          </div>

          {/* Security Graph or Attack Blast Radius */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-400" />
              Attack Blast Radius & Correlated Entities
            </h3>
            {workspaceData?.security_graph ? (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-6">
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  {workspaceData.security_graph.nodes?.map((node) => (
                    <div key={node.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl text-center space-y-1">
                      <span className="text-[10px] text-cyan-400 font-mono uppercase">{node.type}</span>
                      <div className="text-sm font-bold text-white truncate">{node.label}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-rose-500/20 text-rose-300">
                        {node.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  TOPOLOGY: {workspaceData.security_graph.nodes?.length || 0} Connected Nodes
                </div>
              </div>
            ) : (
              <div className="p-8 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs text-center">
                Security graph correlation active. No secondary node spread detected.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: GROUNDED AI SOC COPILOT */}
      {/* =================================================================== */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                Grounded AI SOC Investigation Copilot
              </h3>
            </div>

            {/* Interactive Q&A Input */}
            <div className="space-y-3 pt-2">
              <span className="text-xs text-slate-400 font-medium">Ask Investigative Questions Grounded in Incident Evidence:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                  placeholder="e.g. Analyze LSASS credential dumping timeline and recommend containment"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAskAi}
                  disabled={aiLoading}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{aiLoading ? 'Analyzing...' : 'Ask Copilot'}</span>
                </button>
              </div>

              {aiAnswers.length > 0 && (
                <div className="space-y-3 pt-3">
                  {aiAnswers.map((ans, idx) => (
                    <div key={idx} className="bg-slate-800/80 border border-cyan-500/30 p-4 rounded-xl text-xs space-y-2">
                      <div className="font-semibold text-cyan-300 flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        <span>Q: {ans.question}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{ans.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: CASE NOTES & CUSTOMER COMMS */}
      {/* =================================================================== */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Threaded Case Commentary & Client Communications
            </h3>

            {/* Note Composer */}
            {canWrite && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter analyst notes, forensic findings, or client advisories..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 min-h-[90px]"
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCustomerVisible}
                      onChange={(e) => setIsCustomerVisible(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>Publish to Customer Portal (Visible to Client)</span>
                  </label>

                  <button
                    onClick={handleAddNote}
                    disabled={noteSubmitting || !noteText.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{noteSubmitting ? 'Posting...' : 'Post Entry'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Existing Notes Feed */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No analyst notes or customer messages recorded yet.
                </div>
              ) : (
                comments.map((note) => (
                  <div key={note.id} className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <b className="text-white font-mono">{note.author_username}</b>
                        {note.author_role && (
                          <span className="text-slate-400 font-mono text-[11px]">({note.author_role})</span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${note.is_customer_visible ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'}`}>
                        {note.is_customer_visible ? 'CUSTOMER VISIBLE' : 'INTERNAL SOC ONLY'}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{note.comment_text}</p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(note.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 6: AUDIT LEDGER */}
      {/* =================================================================== */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Immutable SOC Case Audit Trail
          </h3>
          <div className="divide-y divide-slate-800 text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="text-cyan-400 font-mono">[System]</span> Case Created: {caseNumber}
                <div className="text-slate-400 text-[11px]">Severity: {caseSeverity}, Priority: {casePriority}</div>
              </div>
              <div className="text-slate-500 font-mono text-[10px]">
                {socCase?.created_at ? new Date(socCase.created_at).toLocaleString() : 'N/A'}
              </div>
            </div>
            {socCase?.closed_at && (
              <div className="py-3 flex items-center justify-between text-emerald-300">
                <div>
                  <span className="text-emerald-400 font-mono">[Status Sealer]</span> Case Closed & Resolved
                  <div className="text-slate-400 text-[11px]">SLA requirements finalized</div>
                </div>
                <div className="text-slate-500 font-mono text-[10px]">
                  {new Date(socCase.closed_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Update Case Status</h3>
                <p className="text-xs text-cyan-400 font-mono mt-0.5">{caseNumber}</p>
              </div>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStatusTransition} className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Current Status: </span>
                <span className="font-mono font-bold text-white">{caseStatus}</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Status (Permitted)</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as SocCaseStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                >
                  {permittedTransitions.map((st) => (
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
                    placeholder="Document root cause findings, threat resolution, and containment verification..."
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
                  placeholder="e.g. Threat verified neutralized on endpoint"
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
                  {isSubmittingStatus ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check size={16} />}
                  Confirm Transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                Assign Case Analyst
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssign} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lead Analyst Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. secops_analyst"
                  value={assignAnalyst}
                  onChange={(e) => setAssignAnalyst(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assigned Team</label>
                <input
                  type="text"
                  value={assignTeam}
                  onChange={(e) => setAssignTeam(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssign}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-md shadow-cyan-600/30 disabled:opacity-50"
                >
                  {isSubmittingAssign ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check size={16} />}
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
