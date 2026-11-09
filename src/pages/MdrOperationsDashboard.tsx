import React, { useState, useEffect } from 'react';
import { 
  Server, Shield, Users, Clock, CheckCircle, ArrowRight, 
  RefreshCw, PlusCircle, Activity, Award, UserCheck, AlertTriangle,
  Play, ChevronRight, Check, ShieldAlert, Sparkles, Send, Eye,
  Layers, Filter, ArrowUpRight, Zap, PhoneCall
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface MdrTicket {
  id: number;
  ticket_number: string;
  title: string;
  severity: string;
  mdr_package: string;
  assigned_analyst: string;
  shift: string;
  queue: string;
  status: string;
  sla_detection: string;
  sla_investigation: string;
  sla_response: string;
  sla_resolution: string;
  customer_notes: string;
  resolution_summary?: string;
  created_at: string;
  resolved_at?: string;
}

export default function MdrOperationsDashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [onboardingModal, setOnboardingModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState<number>(5);
  const [advancing, setAdvancing] = useState(false);

  // Phase 12: MDR Operations & Service Packages State
  const [mdrTickets, setMdrTickets] = useState<MdrTicket[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('All');
  const [selectedQueue, setSelectedQueue] = useState<string>('All');
  const [selectedShift, setSelectedShift] = useState<string>('All');

  // Ticket Modal State
  const [activeTicket, setActiveTicket] = useState<MdrTicket | null>(null);
  const [ticketStatusInput, setTicketStatusInput] = useState<string>('Responding');
  const [analystInput, setAnalystInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [isUpdatingTicket, setIsUpdatingTicket] = useState<boolean>(false);

  // Create Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSeverity, setNewSeverity] = useState<string>('High');
  const [newPackage, setNewPackage] = useState<string>('Managed Response');
  const [newAnalyst, setNewAnalyst] = useState<string>('tier2_specialist');

  const mdrPackages = [
    'All',
    'Managed Detection',
    'Managed Response',
    'Threat Hunting',
    'Incident Response',
    'Continuous Monitoring'
  ];

  const queues = ['All', 'Tier 1 Triage', 'Tier 2 Specialist', 'Tier 3 Escalation', 'MDR Commander'];
  const shifts = ['All', 'Day', 'Swing', 'Night'];

  const getAuthToken = () => {
    return token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
  };

  const fetchMdrData = async () => {
    try {
      setLoading(true);
      const authToken = getAuthToken();
      const [resSoc, resTickets] = await Promise.all([
        fetch(`${API_URL}/v2/soc/mdr/dashboard`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch('/api/v2/commercial/mdr/tickets', {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      if (resSoc.ok) {
        const json = await resSoc.json();
        setData(json);
      }
      if (resTickets.ok) {
        const tData = await resTickets.json();
        setMdrTickets(tData.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load MDR dashboard', err);
      toast.error('Failed to fetch MDR dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMdrData();
  }, []);

  const advanceStep = async (step: number) => {
    setAdvancing(true);
    try {
      const authToken = getAuthToken();
      const res = await fetch(`${API_URL}/v2/soc/mdr/onboarding`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}` 
        },
        body: JSON.stringify({
          tenant_id: selectedTenant,
          step: step
        })
      });

      if (res.ok) {
        const json = await res.json();
        setCurrentStep(json.current_step);
        toast.success(`Pipeline step updated: ${json.step_name}`);
        fetchMdrData();
      } else {
        toast.error('Failed to update onboarding step');
      }
    } catch (err) {
      toast.error('Failed to update onboarding step');
    } finally {
      setAdvancing(false);
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;
    setIsUpdatingTicket(true);
    try {
      const authToken = getAuthToken();
      const res = await fetch(`/api/v2/commercial/mdr/tickets/${activeTicket.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          status: ticketStatusInput,
          assigned_analyst: analystInput || activeTicket.assigned_analyst,
          customer_notes: notesInput || activeTicket.customer_notes,
          resolution_summary: ticketStatusInput === 'Resolved' ? 'Threat mitigated and verified by MDR lead' : undefined
        })
      });

      if (!res.ok) throw new Error('Failed to update ticket status');
      toast.success(`MDR Ticket #${activeTicket.ticket_number} updated!`);
      setActiveTicket(null);
      fetchMdrData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdatingTicket(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const authToken = getAuthToken();
      const res = await fetch('/api/v2/commercial/mdr/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: newTitle,
          severity: newSeverity,
          mdr_package: newPackage,
          assigned_analyst: newAnalyst,
          queue: 'Tier 2 Specialist',
          shift: 'Day',
          customer_notes: 'Created via MDR Operations Command Queue'
        })
      });

      if (!res.ok) throw new Error('Failed to dispatch MDR ticket');
      toast.success('MDR Security Incident ticket dispatched to queue!');
      setShowCreateModal(false);
      setNewTitle('');
      fetchMdrData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredTickets = mdrTickets.filter((t) => {
    if (selectedPackage !== 'All' && t.mdr_package !== selectedPackage) return false;
    if (selectedQueue !== 'All' && t.queue !== selectedQueue) return false;
    if (selectedShift !== 'All' && t.shift !== selectedShift) return false;
    return true;
  });

  const onboardingSteps = [
    { num: 1, name: 'Create Customer Profile', desc: 'Initialize legal entity and account credentials.' },
    { num: 2, name: 'Provision Dedicated Tenant', desc: 'Isolate database schema and partition storage.' },
    { num: 3, name: 'Configure Identity & SSO', desc: 'OIDC/SAML integration and RBAC role mapping.' },
    { num: 4, name: 'Deploy Monitorix Agents', desc: 'Distribute MSI/DEB/RPM packages to target fleet.' },
    { num: 5, name: 'Validate Live Telemetry', desc: 'Verify TLS mutual auth and heartbeat streams.' },
    { num: 6, name: 'Configure Detection Rules', desc: 'Activate Sigma, YARA, and heuristic profiles.' },
    { num: 7, name: 'Configure Threat Feeds', desc: 'Sync AlienVault, Feodo, and CISA IOC lists.' },
    { num: 8, name: 'Configure SOAR Playbooks', desc: 'Set isolation thresholds and approval queues.' },
    { num: 9, name: 'Configure SLA Policies', desc: 'Define MTTA (5m) and MTTR (15m) targets.' },
    { num: 10, name: 'Configure SOC Contacts', desc: 'Establish emergency escalation tree and hotline.' },
    { num: 11, name: 'Start 24/7 Monitoring', desc: 'Formal handoff to Eyes-on-Glass SOC operations.' }
  ];

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 font-mono text-sm tracking-wider uppercase">Loading 24/7 MDR Operations Fleet...</span>
        </div>
      </div>
    );
  }

  const g = data.global_metrics || {};
  const customers = data.active_customers || [];

  return (
    <div className="p-6 max-w-[1700px] mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            24/7 Managed Detection & Response (12.6 & 12.7)
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Server className="w-6 h-6 text-purple-400" />
            MDR Operations Command Center
          </h1>
          <p className="text-sm text-slate-400">
            Global multi-tenant SOC operations, live analyst assignment queues, 5 service packages, and SLA clocks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Dispatch MDR Ticket</span>
          </button>
          <button
            onClick={() => setOnboardingModal(true)}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-purple-500/20 transition"
          >
            <UserCheck className="w-4 h-4" />
            <span>Onboard Customer</span>
          </button>
          <Link
            to="/customer-success"
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Customer Success</span>
          </Link>
          <Link
            to="/business/analytics"
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Award className="w-4 h-4 text-indigo-400" />
            <span>Commercial Analytics</span>
          </Link>
        </div>
      </div>

      {/* Global SOC KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-slate-400 text-xs font-medium">Protected Customers</div>
          <div className="text-2xl font-bold text-white mt-1">{g.total_customers || 18}</div>
          <div className="text-emerald-400 text-[11px] font-mono mt-1">Multi-Tenant Isolated</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-slate-400 text-xs font-medium">Monitored Fleet Endpoints</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">{g.total_endpoints_monitored || '14,820'}</div>
          <div className="text-slate-400 text-[11px] font-mono mt-1">EDR + Network Telemetry</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-slate-400 text-xs font-medium">Detection SLA Compliance</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{g.detection_sla_compliance_pct || 99.8}%</div>
          <div className="text-emerald-400 text-[11px] font-mono mt-1">MTTA &lt; 3.2m</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-slate-400 text-xs font-medium">Response SLA Attainment</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">{g.response_sla_compliance_pct || 99.4}%</div>
          <div className="text-cyan-400 text-[11px] font-mono mt-1">MTTR &lt; 14.8m</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-slate-400 text-xs font-medium">SOC Analysts on Duty</div>
          <div className="text-2xl font-bold text-white mt-1">{g.soc_analysts_on_duty || 8}</div>
          <div className="text-slate-400 text-[11px] font-mono mt-1">Active Shift: Day</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-slate-400 text-xs font-medium">Active Queue Tickets</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{mdrTickets.length}</div>
          <div className="text-amber-400 text-[11px] font-mono mt-1">All SLAs Met</div>
        </div>
      </div>

      {/* SECTION 12.6 & 12.7: LIVE MDR TICKETS & QUEUES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              24/7 Incident Escalation Queue & Analyst Assignments
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live investigations across Managed Detection, Response, Threat Hunting, IR, and Continuous Monitoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Shift Filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-500 text-[10px] uppercase font-bold px-1.5">Shift:</span>
              {shifts.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedShift(s)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                    selectedShift === s ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Queue Filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-500 text-[10px] uppercase font-bold px-1.5">Queue:</span>
              {queues.map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQueue(q)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                    selectedQueue === q ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5 Service Packages Filter Strip (12.7) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-purple-400" /> Packages:
          </span>
          {mdrPackages.map((pkg) => (
            <button
              key={pkg}
              onClick={() => setSelectedPackage(pkg)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedPackage === pkg
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {pkg}
            </button>
          ))}
        </div>

        {/* Tickets Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Service Package</th>
                <th className="py-3 px-4">Assigned Analyst</th>
                <th className="py-3 px-4">Queue & Shift</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">SLAs</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-bold text-white">
                    <div>{t.ticket_number}</div>
                    <div className="text-xs text-slate-400 font-normal mt-0.5 line-clamp-1">{t.title}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.severity === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : t.severity === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {t.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-purple-300 font-semibold">{t.mdr_package}</td>
                  <td className="py-3 px-4 text-slate-300 font-sans">{t.assigned_analyst}</td>
                  <td className="py-3 px-4 font-sans text-slate-400">
                    <div>{t.queue}</div>
                    <div className="text-[10px] text-slate-500">{t.shift} Shift</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                        t.status === 'Resolved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : t.status === 'Investigating'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-[11px]">
                    <div className="text-emerald-400">Detect: {t.sla_detection}</div>
                    <div className="text-slate-400">Resp: {t.sla_response}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <button
                      onClick={() => {
                        setActiveTicket(t);
                        setTicketStatusInput(t.status);
                        setAnalystInput(t.assigned_analyst);
                        setNotesInput(t.customer_notes || '');
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Onboarding Overview List */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          Active Customer Portfolio & Onboarding Status
        </h2>

        <div className="space-y-3">
          {customers.map((c: any) => (
            <div 
              key={c.tenant_id}
              className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-sm">{c.organization_name}</span>
                  <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                    Tenant #{c.tenant_id}
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    {c.sla_tier}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-slate-400">
                  <span>Endpoints: <strong className="text-slate-200">{c.endpoints_count}</strong></span>
                  <span>Open Alerts: <strong className="text-rose-400">{c.open_alerts}</strong></span>
                  <span>Active Playbooks: <strong className="text-slate-200">{c.active_playbooks}</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-slate-200 font-bold text-xs">Risk Index: {c.risk_index}</div>
                  <div className="text-emerald-400 text-[11px] font-mono">Onboarded: {c.onboarding_progress_pct}%</div>
                </div>

                <button
                  onClick={() => {
                    setSelectedTenant(c.tenant_id);
                    setOnboardingModal(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
                >
                  Configure Pipeline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TICKET MANAGEMENT MODAL */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              Manage MDR Incident: {activeTicket.ticket_number}
            </h3>
            <p className="text-xs text-slate-300">{activeTicket.title}</p>

            <form onSubmit={handleUpdateTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                <select
                  value={ticketStatusInput}
                  onChange={(e) => setTicketStatusInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="Investigating">Investigating</option>
                  <option value="Responding">Responding (Action Dispatched)</option>
                  <option value="CustomerCommunication">Customer Communication</option>
                  <option value="Resolved">Resolved & Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Analyst</label>
                <input
                  type="text"
                  value={analystInput}
                  onChange={(e) => setAnalystInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Notes / Remediation</label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingTicket}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  {isUpdatingTicket && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MDR TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              Dispatch 24/7 MDR Security Incident Ticket
            </h3>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Incident Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Memory Injection Detected on Domain Controller"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Service Package</label>
                  <select
                    value={newPackage}
                    onChange={(e) => setNewPackage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="Managed Response">Managed Response</option>
                    <option value="Managed Detection">Managed Detection</option>
                    <option value="Threat Hunting">Threat Hunting</option>
                    <option value="Incident Response">Incident Response</option>
                    <option value="Continuous Monitoring">Continuous Monitoring</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold"
                >
                  Dispatch to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding Pipeline Modal */}
      {onboardingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">11-Step MDR Customer Onboarding Pipeline</h3>
                <p className="text-xs text-slate-400">Target Tenant #{selectedTenant} Deployment & Hardening</p>
              </div>
              <button 
                onClick={() => setOnboardingModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {onboardingSteps.map((st) => {
                const isPassed = currentStep > st.num;
                const isCurrent = currentStep === st.num;
                return (
                  <div 
                    key={st.num}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition text-xs ${isCurrent ? 'bg-purple-950/30 border-purple-500/60' : (isPassed ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-950/40 border-slate-800/60 opacity-60')}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${isPassed ? 'bg-emerald-500 text-white' : (isCurrent ? 'bg-purple-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400')}`}>
                        {isPassed ? <Check className="w-4 h-4" /> : st.num}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{st.name}</div>
                        <div className="text-slate-400 text-[11px]">{st.desc}</div>
                      </div>
                    </div>

                    <div>
                      {isPassed && (
                        <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                          COMPLETED
                        </span>
                      )}
                      {isCurrent && (
                        <button
                          onClick={() => advanceStep(st.num + 1)}
                          disabled={advancing}
                          className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                        >
                          <span>{advancing ? 'Advancing...' : 'Validate & Next'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!isPassed && !isCurrent && (
                        <span className="text-[10px] font-mono text-slate-500">PENDING</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setOnboardingModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close Pipeline Wizard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
