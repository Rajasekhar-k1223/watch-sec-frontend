import React, { useState, useEffect } from 'react';
import {
  Globe, Shield, Users, Clock, CheckCircle2, AlertTriangle, XCircle,
  ArrowRight, Activity, Terminal, Layers, Lock, Sparkles, RefreshCw,
  Play, Sliders, Plus, Search, Filter, GitBranch, Zap, Building,
  CreditCard, ShieldCheck, Palette, FileText, ChevronRight, PhoneCall,
  Laptop, ExternalLink, Key, Check
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function GlobalMdrMssp() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'global_soc' | 'partners' | 'customers' | 'white_label' | 'mdr_ops'>('global_soc');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [overview, setOverview] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('MSSP-PARTNER-APEX');
  const [partnerDetails, setPartnerDetails] = useState<any>(null);
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<any>(null);

  // Modals
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showCreatePartnerModal, setShowCreatePartnerModal] = useState(false);

  // Form States
  const [handoverFrom, setHandoverFrom] = useState('APAC');
  const [handoverTo, setHandoverTo] = useState('EMEA');
  const [outgoingLead, setOutgoingLead] = useState('Tokyo SOC Lead');
  const [incomingLead, setIncomingLead] = useState('London SOC Commander');
  const [handoverNotes, setHandoverNotes] = useState('');

  const [escIncidentId, setEscIncidentId] = useState(101);
  const [escSeverity, setEscSeverity] = useState('P1_CRITICAL');
  const [escTier, setEscTier] = useState('L3_THREAT_HUNTER');
  const [escReason, setEscReason] = useState('');

  const [onboardPartnerId, setOnboardPartnerId] = useState('MSSP-PARTNER-APEX');
  const [onboardCustName, setOnboardCustName] = useState('');
  const [onboardIndustry, setOnboardIndustry] = useState('Financial Services');
  const [onboardTier, setOnboardTier] = useState('MANAGED_RESPONSE');
  const [onboardEndpoints, setOnboardEndpoints] = useState(350);

  // White Label Form State
  const [wlBrandName, setWlBrandName] = useState('');
  const [wlDomain, setWlDomain] = useState('');
  const [wlLogoUrl, setWlLogoUrl] = useState('');
  const [wlPrimaryColor, setWlPrimaryColor] = useState('#6366f1');
  const [wlAccentColor, setWlAccentColor] = useState('#a855f7');
  const [savingWl, setSavingWl] = useState(false);

  // Fetch Telemetry
  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      const [ovRes, partRes, custRes] = await Promise.all([
        fetch(`${API_URL}/v2/mssp/overview`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/v2/mssp/partners`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/v2/mssp/customers`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (ovRes.ok) setOverview(await ovRes.json());
      if (partRes.ok) {
        const pList = await partRes.json();
        setPartners(pList);
        if (pList.length > 0 && !selectedPartnerId) {
          setSelectedPartnerId(pList[0].partner_id);
        }
      }
      if (custRes.ok) setCustomers(await custRes.json());

      if (selectedPartnerId) {
        fetchPartnerSpecificData(selectedPartnerId);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to Global MDR & MSSP network');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPartnerSpecificData = async (pId: string) => {
    try {
      const [detRes, wlRes] = await Promise.all([
        fetch(`${API_URL}/v2/mssp/partners/${pId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/v2/mssp/partners/${pId}/whitelabel`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (detRes.ok) setPartnerDetails(await detRes.json());
      if (wlRes.ok) {
        const wl = await wlRes.json();
        setWhiteLabelConfig(wl);
        setWlBrandName(wl.brand_name || '');
        setWlDomain(wl.custom_domain || '');
        setWlLogoUrl(wl.logo_url || '');
        setWlPrimaryColor(wl.primary_brand_color || '#6366f1');
        setWlAccentColor(wl.accent_brand_color || '#a855f7');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 25000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (selectedPartnerId) {
      fetchPartnerSpecificData(selectedPartnerId);
    }
  }, [selectedPartnerId]);

  // Handle Shift Handover
  const handleCreateHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/v2/mssp/shifts/handover`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_region: handoverFrom,
          to_region: handoverTo,
          outgoing_lead: outgoingLead,
          incoming_lead: incomingLead,
          briefing_notes: handoverNotes || 'Scheduled Follow-the-Sun shift handover completed.'
        })
      });
      if (res.ok) {
        toast.success('Regional SOC shift handover logged successfully!');
        setShowHandoverModal(false);
        fetchAllData();
      } else {
        toast.error('Failed to log shift handover');
      }
    } catch (err) {
      toast.error('Network error recording handover');
    }
  };

  // Handle Escalation
  const handleCreateEscalation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escReason.trim()) {
      toast.error('Trigger reason is required');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/v2/mssp/escalations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: Number(escIncidentId),
          severity: escSeverity,
          escalation_tier: escTier,
          partner_id: selectedPartnerId,
          trigger_reason: escReason.trim()
        })
      });
      if (res.ok) {
        toast.success(`Incident #${escIncidentId} escalated to ${escTier}`);
        setShowEscalationModal(false);
        setEscReason('');
        fetchAllData();
      } else {
        toast.error('Failed to create escalation');
      }
    } catch (err) {
      toast.error('Network error recording escalation');
    }
  };

  // Handle Customer Onboarding
  const handleOnboardCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardCustName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/v2/mssp/customers/onboard`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: onboardPartnerId,
          customer_name: onboardCustName.trim(),
          industry: onboardIndustry,
          mdr_tier: onboardTier,
          endpoints_count: Number(onboardEndpoints)
        })
      });
      if (res.ok) {
        toast.success(`Customer ${onboardCustName} onboarded with dedicated tenant!`);
        setShowOnboardModal(false);
        setOnboardCustName('');
        fetchAllData();
      } else {
        toast.error('Failed to onboard customer');
      }
    } catch (err) {
      toast.error('Network error onboarding customer');
    }
  };

  // Handle White Label Save
  const handleSaveWhiteLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWl(true);
    try {
      const res = await fetch(`${API_URL}/v2/mssp/partners/${selectedPartnerId}/whitelabel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: wlBrandName.trim(),
          custom_domain: wlDomain.trim(),
          logo_url: wlLogoUrl.trim(),
          primary_brand_color: wlPrimaryColor,
          accent_brand_color: wlAccentColor
        })
      });
      if (res.ok) {
        toast.success('White-label branding updated! Sovereign audit controls preserved.');
        fetchPartnerSpecificData(selectedPartnerId);
      } else {
        toast.error('Failed to update white-label config');
      }
    } catch (err) {
      toast.error('Network error updating white label');
    } finally {
      setSavingWl(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 border border-indigo-800/40 p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg shadow-indigo-500/30">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                    Global MDR & MSSP Operations
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    v3.11.0
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    24/7 FOLLOW-THE-SUN
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1 max-w-3xl">
                  Unified command center for Global SOC regional shifts (APAC, EMEA, AMER), multi-tier MSSP partner hierarchy,
                  delegated customer administration, and white-label branding with sovereign Monitorix audit preservation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowHandoverModal(true)}
              className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 font-medium text-sm transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-indigo-400" />
              Shift Handover
            </button>
            <button
              onClick={() => setShowEscalationModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Incident Escalation
            </button>
            <button
              onClick={() => setShowOnboardModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Onboard Customer
            </button>
            <button
              onClick={fetchAllData}
              disabled={refreshing}
              className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-300 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Follow-the-Sun Regional SOC Tracker Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['APAC', 'EMEA', 'AMER'].map(regionKey => {
          const region = overview?.regional_soc_teams?.[regionKey];
          const isOnDuty = region?.current_shift_status === 'ON_DUTY';
          return (
            <div
              key={regionKey}
              className={`rounded-xl p-4 border transition-all ${
                isOnDuty
                  ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-900/20'
                  : 'bg-slate-900/60 border-slate-800/80 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  {region?.name || `${regionKey} Regional SOC`}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isOnDuty
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isOnDuty ? 'LIVE ON DUTY' : 'STANDBY'}
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-400">Shift Commander:</div>
                  <div className="font-semibold text-slate-200">{region?.active_lead || 'SOC Lead'}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400">Analysts Active:</div>
                  <div className="font-bold text-indigo-400">{region?.analysts_on_duty || 14} Analysts</div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Queue Depth: <strong className="text-slate-200">{region?.queue_depth ?? 3} cases</strong></span>
                <span>Avg Response: <strong className="text-emerald-400">{region?.avg_response_min ?? 3.0} min</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Executive Hero KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="text-[10px] uppercase font-semibold text-slate-400">MTTD</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{overview?.metrics?.mttd_minutes ?? 2.1}m</div>
          <div className="text-[10px] text-slate-500">Mean Time to Detect</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="text-[10px] uppercase font-semibold text-slate-400">MTTA</div>
          <div className="text-xl font-bold text-cyan-400 mt-1">{overview?.metrics?.mtta_minutes ?? 4.2}m</div>
          <div className="text-[10px] text-slate-500">Mean Time to Ack</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="text-[10px] uppercase font-semibold text-slate-400">MTTR</div>
          <div className="text-xl font-bold text-indigo-400 mt-1">{overview?.metrics?.mttr_minutes ?? 16.5}m</div>
          <div className="text-[10px] text-slate-500">Mean Time to Remediate</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="text-[10px] uppercase font-semibold text-slate-400">SLA Adherence</div>
          <div className="text-xl font-bold text-teal-400 mt-1">{overview?.metrics?.sla_compliance_rate_pct ?? 99.7}%</div>
          <div className="text-[10px] text-slate-500">P1-P4 Global Fleet</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="text-[10px] uppercase font-semibold text-slate-400">Fleet Health</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{overview?.metrics?.customer_fleet_health_score ?? 98.2}</div>
          <div className="text-[10px] text-slate-500">Sensor Coverage Score</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="text-[10px] uppercase font-semibold text-slate-400">Fleet Risk</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{overview?.metrics?.customer_fleet_risk_score ?? 14.9}</div>
          <div className="text-[10px] text-slate-500">Normalized Risk (0-100)</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="text-[10px] uppercase font-semibold text-slate-400">Endpoints</div>
          <div className="text-xl font-bold text-purple-400 mt-1">{(overview?.metrics?.total_endpoints_managed ?? 3200).toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">Managed Agents</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="text-[10px] uppercase font-semibold text-slate-400">Utilization</div>
          <div className="text-xl font-bold text-slate-200 mt-1">{overview?.metrics?.analyst_utilization_pct ?? 68.4}%</div>
          <div className="text-[10px] text-slate-500">Analyst Load Index</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('global_soc')}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'global_soc'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Globe className="w-4 h-4" />
          Follow-the-Sun Operations & Escalations
        </button>

        <button
          onClick={() => setActiveTab('partners')}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'partners'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Building className="w-4 h-4" />
          MSSP Partner Organizations ({partners.length})
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'customers'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Users className="w-4 h-4" />
          Managed Customer Accounts ({customers.length})
        </button>

        <button
          onClick={() => setActiveTab('white_label')}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'white_label'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Palette className="w-4 h-4" />
          White-Label Branding & Audit Lock
        </button>

        <button
          onClick={() => setActiveTab('mdr_ops')}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'mdr_ops'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Managed Detection & Response (MDR)
        </button>
      </div>

      {/* TAB 1: GLOBAL SOC & ESCALATIONS */}
      {activeTab === 'global_soc' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shift Handovers Section */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  Follow-the-Sun Shift Handovers
                </h3>
                <span className="text-xs text-slate-400 font-mono">Immutable Shift Logs</span>
              </div>

              <div className="space-y-3">
                {overview?.recent_shift_handovers?.map((h: any) => (
                  <div key={h.handover_id} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-indigo-400 font-semibold">{h.handover_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        {h.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold">{h.from_region}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="px-2 py-0.5 bg-indigo-900/40 text-indigo-300 rounded font-semibold">{h.to_region}</span>
                      <span className="text-slate-400 ml-2">({h.outgoing_lead} → {h.incoming_lead})</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>Active Incidents: <strong className="text-slate-200">{h.active_incidents_count}</strong></span>
                      <span>P1 Escalations: <strong className="text-rose-400">{h.escalated_p1_count}</strong></span>
                      <span>Time: <span className="text-slate-300 font-mono">{new Date(h.handover_timestamp).toLocaleTimeString()}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Escalations Section */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  Multi-Tier Incident Escalations
                </h3>
                <span className="text-xs text-slate-400 font-mono">SLA Targeted</span>
              </div>

              <div className="space-y-3">
                {overview?.recent_escalations?.map((e: any) => (
                  <div key={e.escalation_id} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-rose-400 font-semibold">{e.escalation_id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.severity === 'P1_CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}>
                        {e.severity}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      <strong>Target Tier:</strong> <span className="text-indigo-400 font-semibold">{e.escalation_tier}</span> | Region: {e.originating_region} → {e.target_region}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>SLA Commitment: <strong className="text-slate-200">&lt; {e.sla_target_minutes}m</strong></span>
                      <span>Response: <strong className="text-emerald-400">{e.response_time_minutes}m</strong></span>
                      <span className="text-slate-300">Status: <strong className="text-slate-100">{e.status}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MSSP PARTNER ORGANIZATIONS */}
      {activeTab === 'partners' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partners.map(p => (
              <div
                key={p.partner_id}
                onClick={() => setSelectedPartnerId(p.partner_id)}
                className={`bg-slate-900/80 border rounded-xl p-5 shadow-lg cursor-pointer transition-all ${
                  selectedPartnerId === p.partner_id
                    ? 'border-indigo-500/80 ring-1 ring-indigo-500/40'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-indigo-400 font-bold">{p.partner_id}</span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    {p.tier} PARTNER
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{p.name}</h3>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  {p.primary_domain}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                  <div>
                    <div className="text-slate-500">Customers:</div>
                    <div className="font-bold text-slate-200">{p.total_customers} Managed</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Endpoints:</div>
                    <div className="font-bold text-purple-400">{p.endpoints_managed.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Rev Share:</div>
                    <div className="font-bold text-emerald-400">{p.revenue_share_pct}%</div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Billing: <strong className="text-slate-200">{p.billing_plan}</strong></span>
                  <span>P1 SLA: <strong className="text-emerald-400">&lt; {p.sla_p1_min}m response</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Partner Deep-Dive Drawer */}
          {partnerDetails && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-indigo-400" />
                    {partnerDetails.name} — Delegated Fleet Operations
                  </h3>
                  <p className="text-xs text-slate-400">
                    Partner ID: <span className="font-mono text-indigo-300">{partnerDetails.partner_id}</span> | Domain: {partnerDetails.domain}
                  </p>
                </div>
                <span className="px-3 py-1 bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 text-xs rounded-lg font-semibold">
                  Delegated Administration Active
                </span>
              </div>

              {/* Sub-Tenants Table */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Managed Sub-Tenants ({partnerDetails.managed_customers?.length})</h4>
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Customer Name</th>
                        <th className="p-3">Tenant ID</th>
                        <th className="p-3">Industry</th>
                        <th className="p-3">MDR Tier</th>
                        <th className="p-3">Health</th>
                        <th className="p-3">Risk</th>
                        <th className="p-3">SLA %</th>
                        <th className="p-3">Endpoints</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {partnerDetails.managed_customers?.map((c: any) => (
                        <tr key={c.customer_id} className="hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-white">{c.customer_name}</td>
                          <td className="p-3 font-mono text-indigo-400">Tenant #{c.tenant_id}</td>
                          <td className="p-3">{c.industry}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-medium">{c.mdr_tier}</span>
                          </td>
                          <td className="p-3 text-emerald-400 font-bold">{c.health_score}</td>
                          <td className="p-3 text-amber-400 font-bold">{c.risk_score}</td>
                          <td className="p-3 text-teal-400 font-bold">{c.sla_compliance_rate}%</td>
                          <td className="p-3 font-mono">{c.endpoints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANAGED CUSTOMER ACCOUNTS */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Managed Customer Fleet</h3>
                <p className="text-xs text-slate-400">
                  Global inventory of customer sub-tenants mapped under MSSP partners. All customers run under strict tenant isolation.
                </p>
              </div>
              <button
                onClick={() => setShowOnboardModal(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Onboard Customer
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Customer ID</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Partner Org</th>
                    <th className="p-3">Industry</th>
                    <th className="p-3">MDR Tier</th>
                    <th className="p-3">Health</th>
                    <th className="p-3">Risk</th>
                    <th className="p-3">SLA Compliance</th>
                    <th className="p-3">Endpoints</th>
                    <th className="p-3">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {customers.map(c => (
                    <tr key={c.customer_id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-mono text-indigo-400 font-semibold">{c.customer_id}</td>
                      <td className="p-3 font-bold text-white">{c.customer_name}</td>
                      <td className="p-3 font-mono text-slate-400">{c.partner_id}</td>
                      <td className="p-3">{c.industry}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-medium text-[10px]">{c.mdr_tier}</span>
                      </td>
                      <td className="p-3 text-emerald-400 font-bold">{c.health_score}</td>
                      <td className="p-3 text-amber-400 font-bold">{c.risk_score}</td>
                      <td className="p-3 text-teal-400 font-bold">{c.sla_compliance_rate}%</td>
                      <td className="p-3 font-mono">{c.endpoints_count}</td>
                      <td className="p-3 text-emerald-400 font-mono">{c.service_availability_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WHITE-LABEL BRANDING & SOVEREIGN AUDIT LOCK */}
      {activeTab === 'white_label' && (
        <div className="space-y-6">
          {/* Sovereign Audit Lock Banner */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-700/50 rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-950 border border-emerald-700/60 rounded-lg text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Monitorix Sovereign Audit Controls Locked</h4>
                <p className="text-xs text-slate-400">
                  While partner logos, domains, and portal themes are fully customizable, all immutable audit logging,
                  cryptographic provenance, and SIEM security controls remain under sovereign Monitorix supervision.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs rounded-lg font-bold">
              AUDIT LOCKED
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Branding Editor */}
            <form onSubmit={handleSaveWhiteLabel} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                Custom Partner Branding Settings
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Partner Organization</label>
                <select
                  value={selectedPartnerId}
                  onChange={e => setSelectedPartnerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
                >
                  {partners.map(p => (
                    <option key={p.partner_id} value={p.partner_id}>{p.name} ({p.partner_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={wlBrandName}
                  onChange={e => setWlBrandName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Domain (CNAME)</label>
                <input
                  type="text"
                  placeholder="e.g. soc.apexcyber.com"
                  value={wlDomain}
                  onChange={e => setWlDomain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Logo URL</label>
                <input
                  type="text"
                  value={wlLogoUrl}
                  onChange={e => setWlLogoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={wlPrimaryColor}
                      onChange={e => setWlPrimaryColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={wlPrimaryColor}
                      onChange={e => setWlPrimaryColor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={wlAccentColor}
                      onChange={e => setWlAccentColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={wlAccentColor}
                      onChange={e => setWlAccentColor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingWl}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold"
                >
                  {savingWl ? 'Saving...' : 'Apply White-Label Branding'}
                </button>
              </div>
            </form>

            {/* Live Customer Portal Preview */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Laptop className="w-5 h-5 text-indigo-400" />
                Live Customer Portal Preview
              </h3>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner">
                {/* Simulated Browser Bar */}
                <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center gap-2 text-xs">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <div className="flex-1 text-center font-mono text-[11px] text-slate-400 bg-slate-950 py-0.5 rounded border border-slate-800">
                    https://{wlDomain || 'soc.partner-domain.com'}/#/dashboard
                  </div>
                </div>

                {/* Simulated Portal Content */}
                <div className="p-6 space-y-4" style={{ borderTop: `3px solid ${wlPrimaryColor}` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ background: wlPrimaryColor }}>
                        {wlBrandName ? wlBrandName.charAt(0) : 'M'}
                      </div>
                      <span className="font-bold text-white text-sm">{wlBrandName || 'Partner Managed Defense'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Client Portal</span>
                  </div>

                  <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 space-y-2">
                    <div className="text-xs text-slate-400">Security Operations Status:</div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4" /> 24/7 Managed Defense Active
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 text-center pt-2">
                    Sovereign Core Powered by Monitorix Cybersecurity Platform
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MDR SECURITY OPERATIONS */}
      {activeTab === 'mdr_ops' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Managed Detection & Triage
              </h4>
              <p className="text-xs text-slate-400">
                Continuous 24/7 streaming telemetry ingestion from endpoints, network, identity, and cloud workloads.
              </p>
              <div className="space-y-2 pt-2 text-xs">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-300">Daily Telemetry Events:</span>
                  <strong className="text-slate-100">48,200/day</strong>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-300">Auto Triage Ratio:</span>
                  <strong className="text-emerald-400">88.4%</strong>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                Managed Investigation & SOAR
              </h4>
              <p className="text-xs text-slate-400">
                Automated root cause analysis, volatile memory capture, and timeline reconstruction across attack chains.
              </p>
              <div className="space-y-2 pt-2 text-xs">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-300">Mean Investigation Time:</span>
                  <strong className="text-cyan-400">8.2 min</strong>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-300">SOAR Playbooks Active:</span>
                  <strong className="text-purple-400">42 Playbooks</strong>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Managed Response & Containment
              </h4>
              <p className="text-xs text-slate-400">
                Authorized remote isolation, process termination, token invalidation, and DNS sinkhole blocklisting.
              </p>
              <div className="space-y-2 pt-2 text-xs">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-300">Containment Latency:</span>
                  <strong className="text-emerald-400">&lt; 15 min (P1 SLA)</strong>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-300">Containment Success:</span>
                  <strong className="text-emerald-400">99.8%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHIFT HANDOVER MODAL */}
      {showHandoverModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Record Regional SOC Shift Handover
              </h3>
              <button onClick={() => setShowHandoverModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHandover} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">From Region</label>
                  <select
                    value={handoverFrom}
                    onChange={e => setHandoverFrom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  >
                    <option value="APAC">APAC (Tokyo/Singapore)</option>
                    <option value="EMEA">EMEA (London/Frankfurt)</option>
                    <option value="AMER">AMER (New York/Austin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">To Region</label>
                  <select
                    value={handoverTo}
                    onChange={e => setHandoverTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  >
                    <option value="EMEA">EMEA (London/Frankfurt)</option>
                    <option value="AMER">AMER (New York/Austin)</option>
                    <option value="APAC">APAC (Tokyo/Singapore)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Outgoing Lead</label>
                  <input
                    type="text"
                    value={outgoingLead}
                    onChange={e => setOutgoingLead(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Incoming Lead</label>
                  <input
                    type="text"
                    value={incomingLead}
                    onChange={e => setIncomingLead(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Briefing & Watch Items</label>
                <textarea
                  rows={3}
                  placeholder="Notes on ongoing containment, high severity investigations, or customer alerts..."
                  value={handoverNotes}
                  onChange={e => setHandoverNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowHandoverModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg"
                >
                  Log Shift Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INCIDENT ESCALATION MODAL */}
      {showEscalationModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Escalate Incident Across SOC Tiers
              </h3>
              <button onClick={() => setShowEscalationModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEscalation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Incident ID</label>
                  <input
                    type="number"
                    value={escIncidentId}
                    onChange={e => setEscIncidentId(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Severity Tier</label>
                  <select
                    value={escSeverity}
                    onChange={e => setEscSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  >
                    <option value="P1_CRITICAL">P1 Critical (SLA: 15 min)</option>
                    <option value="P2_HIGH">P2 High (SLA: 30 min)</option>
                    <option value="P3_MEDIUM">P3 Medium (SLA: 2 hours)</option>
                    <option value="P4_LOW">P4 Low (SLA: 8 hours)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Escalation Tier</label>
                <select
                  value={escTier}
                  onChange={e => setEscTier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                >
                  <option value="L2_INVESTIGATION">Tier 2 Specialist (Forensic Investigation)</option>
                  <option value="L3_THREAT_HUNTER">Tier 3 Threat Hunter (Adversary Deep-Dive)</option>
                  <option value="PRINCIPAL_COMMANDER">Principal Incident Commander (War Room)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Trigger Reason *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the technical reason for escalation (e.g., active C2 beaconing, lateral movement)..."
                  value={escReason}
                  onChange={e => setEscReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEscalationModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-semibold rounded-lg"
                >
                  Escalate Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER ONBOARDING MODAL */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Onboard Managed Customer Tenant
              </h3>
              <button onClick={() => setShowOnboardModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOnboardCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Partner Organization</label>
                <select
                  value={onboardPartnerId}
                  onChange={e => setOnboardPartnerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                >
                  {partners.map(p => (
                    <option key={p.partner_id} value={p.partner_id}>{p.name} ({p.partner_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Customer Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Bank"
                  value={onboardCustName}
                  onChange={e => setOnboardCustName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Industry</label>
                  <select
                    value={onboardIndustry}
                    onChange={e => setOnboardIndustry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  >
                    <option value="Financial Services">Financial Services</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Technology">Technology</option>
                    <option value="Aerospace & Defense">Aerospace & Defense</option>
                    <option value="Energy & Utilities">Energy & Utilities</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">MDR Package Tier</label>
                  <select
                    value={onboardTier}
                    onChange={e => setOnboardTier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                  >
                    <option value="MANAGED_DETECTION">Managed Detection</option>
                    <option value="MANAGED_RESPONSE">Managed Response</option>
                    <option value="PREMIUM_HUNTING">Premium Threat Hunting</option>
                    <option value="ENTERPRISE_SOC">Enterprise 24/7 SOC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Allocated Endpoint Quota</label>
                <input
                  type="number"
                  value={onboardEndpoints}
                  onChange={e => setOnboardEndpoints(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg"
                >
                  Provision & Onboard Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
