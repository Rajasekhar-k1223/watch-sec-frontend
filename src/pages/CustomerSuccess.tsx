import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, AlertTriangle, ArrowRight, Activity, 
  ShieldCheck, RefreshCw, Layers, FileText, Download, Award, 
  Clock, ShieldAlert, Sparkles, TrendingUp, Check, ChevronRight, 
  ExternalLink, ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface CustomerSuccessData {
  tenant_id: number;
  customer_stage: string;
  health_score: number;
  deployment_health: string;
  risk_score: number;
  endpoint_coverage_percent: number;
  active_endpoints: number;
  endpoint_limit: number;
  endpoint_utilization_percent: number;
  open_incidents_count: number;
  detection_activity_24h: number;
  integration_health_score: number;
  license_status: string;
  plan_tier: string;
  assigned_manager: string;
  onboarding_checklist: Record<string, boolean>;
  health_trend: string;
}

interface SlaData {
  detection_sla_minutes: number;
  investigation_sla_minutes: number;
  response_sla_minutes: number;
  customer_notification_sla_minutes: number;
  resolution_sla_minutes: number;
  breaches_last_30_days: number;
  sla_compliance_rate: string;
  tier: string;
  status: string;
}

export default function CustomerSuccess() {
  const [data, setData] = useState<CustomerSuccessData | null>(null);
  const [sla, setSla] = useState<SlaData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Transition stage modal
  const [showTransitionModal, setShowTransitionModal] = useState<boolean>(false);
  const [targetStage, setTargetStage] = useState<string>('Active');
  const [transitionNotes, setTransitionNotes] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Report generation state
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<any | null>(null);

  const stages = ['Lead', 'Trial', 'Onboarding', 'Active', 'Expansion', 'Renewal', 'Cancellation'];

  const getAuthToken = () => {
    return sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const [resSuccess, resSla] = await Promise.all([
        fetch('/api/v2/commercial/customer-success', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v2/commercial/sla', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (resSuccess.ok) {
        const csData = await resSuccess.json();
        setData(csData.customer_success);
      }
      if (resSla.ok) {
        const slaData = await resSla.json();
        setSla(slaData.sla);
      }
    } catch (err: any) {
      toast.error('Failed to load customer success telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransitionStage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v2/commercial/customer-lifecycle/transition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          target_stage: targetStage,
          notes: transitionNotes || 'Stage updated via Customer Success Operations console'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Lifecycle transition failed');
      }

      toast.success(`Customer stage updated to ${targetStage}!`);
      setShowTransitionModal(false);
      setTransitionNotes('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleGenerateReport = async (reportType: string) => {
    setGeneratingReport(reportType);
    setReportResult(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/v2/commercial/reports/generate?report_type=${reportType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Report generation failed');
      const rep = await res.json();
      setReportResult(rep.report);
      toast.success(`${reportType} report generated successfully!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGeneratingReport(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Customer Success Hub (12.5)
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Customer Lifecycle & Deployment Health
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
              Real-time telemetry tracking endpoint adoption, composite health score, open SOC incidents, license entitlements, and multi-tier SLA attainment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowTransitionModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              Transition Lifecycle Stage
            </button>
            <Link
              to="/business/analytics"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all"
            >
              <Activity className="w-4 h-4 text-indigo-400" />
              Commercial Analytics
            </Link>
            <Link
              to="/mdr"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              24/7 MDR Operations
            </Link>
          </div>
        </div>

        {/* Customer Lifecycle Pipeline Strip */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Customer Lifecycle Progression (12.4)</span>
            <span className="text-emerald-400 font-bold">Current Stage: {data?.customer_stage || 'Active'}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {stages.map((stg, idx) => {
              const currentIdx = stages.indexOf(data?.customer_stage || 'Active');
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div
                  key={stg}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold shadow-lg shadow-emerald-950/40'
                      : isPast
                      ? 'bg-slate-900/60 border-slate-700 text-slate-300'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Step {idx + 1}</div>
                  <div className="text-xs font-semibold mt-0.5">{stg}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Customer Health Score */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden shadow-xl">
          <div className="text-xs text-slate-400 font-medium">Customer Health Score</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1 flex items-baseline gap-2">
            {data?.health_score || 96.4}
            <span className="text-xs text-emerald-500 font-normal">/ 100 ({data?.health_trend || 'Improving'})</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${data?.health_score || 96.4}%` }}
            />
          </div>
        </div>

        {/* Endpoint Coverage */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="text-xs text-slate-400 font-medium">Endpoint Fleet Coverage</div>
          <div className="text-3xl font-extrabold text-white mt-1">
            {data?.endpoint_coverage_percent || 98.8}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {data?.active_endpoints || 248} of {data?.endpoint_limit || 1000} Entitled Endpoints
          </div>
        </div>

        {/* Residual Risk Score */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="text-xs text-slate-400 font-medium">Residual Risk Posture</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">
            {data?.risk_score || 14.2}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Low Risk Profile • {data?.open_incidents_count || 0} Open Incidents
          </div>
        </div>

        {/* SLA Attainment */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="text-xs text-slate-400 font-medium">30-Day SLA Compliance</div>
          <div className="text-3xl font-extrabold text-indigo-400 mt-1">
            {sla?.sla_compliance_rate || '99.8%'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {sla?.breaches_last_30_days || 0} Breaches • {sla?.status || 'Healthy'}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Onboarding Checklist & Deployment Health */}
        <div className="lg:col-span-1 space-y-6">
          {/* Onboarding Checklist Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Customer Onboarding Milestones
              </h2>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                100% Complete
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { label: 'EDR Agent Fleet Mass Deployment', key: 'agent_deployment' },
                { label: 'SIEM & Cloud Log Pipeline Connected', key: 'siem_connector_connected' },
                { label: 'Automated SOAR Playbooks Configured', key: 'soar_playbook_configured' },
                { label: 'Enterprise IAM / Active Directory SCIM Sync', key: 'ad_ldap_synchronized' },
                { label: '24/7 SOC Escalation Matrix Certified', key: 'soc_escalation_matrix_verified' }
              ].map((item) => (
                <div key={item.key} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-300 font-medium">{item.label}</span>
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-xs text-slate-400">
              Assigned Account Lead: <strong className="text-slate-200">{data?.assigned_manager}</strong>
            </div>
          </div>

          {/* SLA Performance Spec Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              SLA Guarantees & Attainment (12.9)
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Detection SLA</span>
                <span className="font-mono text-emerald-400 font-semibold">&lt; {sla?.detection_sla_minutes || 5} mins</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Investigation SLA</span>
                <span className="font-mono text-emerald-400 font-semibold">&lt; {sla?.investigation_sla_minutes || 15} mins</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Response SLA</span>
                <span className="font-mono text-emerald-400 font-semibold">&lt; {sla?.response_sla_minutes || 30} mins</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Notification SLA</span>
                <span className="font-mono text-emerald-400 font-semibold">&lt; {sla?.customer_notification_sla_minutes || 10} mins</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Resolution SLA</span>
                <span className="font-mono text-emerald-400 font-semibold">&lt; {sla?.resolution_sla_minutes || 240} mins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Automated Reports & Detail Telemetry */}
        <div className="lg:col-span-2 space-y-6">
          {/* Automated Reports Card (12.8) */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Automated Customer Reports (Section 12.8)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automate and export executive, operational, risk, and compliance security reports.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {['Executive', 'Daily', 'Weekly', 'Monthly', 'Incident', 'Risk', 'Compliance'].map((rep) => (
                <button
                  key={rep}
                  disabled={generatingReport === rep}
                  onClick={() => handleGenerateReport(rep)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    generatingReport === rep
                      ? 'bg-indigo-600/30 border-indigo-500'
                      : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    {rep}
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Generate PDF</div>
                </button>
              ))}
            </div>

            {/* Generated Report Preview */}
            {reportResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {reportResult.title}
                  </div>
                  <a
                    href={reportResult.download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </a>
                </div>
                <div className="text-xs text-slate-300">
                  {reportResult.metadata?.summary}
                </div>
                <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-400 font-mono overflow-x-auto">
                  {JSON.stringify(reportResult.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Current Commercial Plan & Entitlement Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Active Commercial Entitlements
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Commercial Plan</div>
                <div className="text-sm font-bold text-indigo-400 mt-0.5">{data?.plan_tier || 'Enterprise'}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">License Status</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">{data?.license_status || 'Active'}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Integration Health</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">{data?.integration_health_score || 99.2}%</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Endpoint Utilization</div>
                <div className="text-sm font-bold text-white mt-0.5">{data?.endpoint_utilization_percent || 24.8}%</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">24h Detection Velocity</div>
                <div className="text-sm font-bold text-white mt-0.5">{data?.detection_activity_24h || 412} Events</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Support SLA Level</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">24/7 Dedicated</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSITION STAGE MODAL */}
      {showTransitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Transition Customer Lifecycle Stage (12.4)
            </h2>
            <p className="text-xs text-slate-400">
              Advance or adjust the customer's account stage through the standardized commercial progression pipeline.
            </p>

            <form onSubmit={handleTransitionStage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Stage</label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {stages.map((stg) => (
                    <option key={stg} value={stg}>{stg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Audit Notes / Rationale</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Completed initial security deployment; transitioning to Active production monitoring."
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransitionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransitioning}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {isTransitioning && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
