import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, CreditCard, DollarSign, Users, Award, Shield, 
  ArrowUpRight, Download, RefreshCw, Key, Check, Plus, ExternalLink, 
  PieChart, LineChart, FileText, Activity, AlertCircle, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface CommercialMetrics {
  arr_usd: number;
  mrr_usd: number;
  expansion_arr_usd: number;
  net_revenue_retention_percent: number;
  churn_rate_percent: number;
  total_customers: number;
  total_monitored_endpoints: number;
  plan_distribution: Record<string, number>;
  average_revenue_per_customer_usd: number;
  support_load_tickets_open: number;
  soc_analyst_capacity_percent: number;
}

interface CommercialPlan {
  tier: string;
  name: string;
  endpoint_limit: number;
  storage_gb: number;
  event_volume_eps: number;
  user_limit: number;
  ai_usage_tokens: number;
  retention_days: number;
  support_level: string;
  sla_tier: string;
  annual_price_usd: number;
  monthly_price_usd: number;
  entitlements: Record<string, boolean>;
}

interface InvoiceItem {
  id: number;
  invoice_number: string;
  amount_usd: number;
  currency: string;
  status: string;
  provider: string;
  invoice_pdf_url: string;
  created_at: string;
}

export default function CommercialAnalytics() {
  const [analytics, setAnalytics] = useState<CommercialMetrics | null>(null);
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // License Modal State
  const [showLicenseModal, setShowLicenseModal] = useState<boolean>(false);
  const [licensePlan, setLicensePlan] = useState<string>('Enterprise');
  const [licenseType, setLicenseType] = useState<string>('Online');
  const [licenseValidityDays, setLicenseValidityDays] = useState<number>(365);
  const [issuedLicense, setIssuedLicense] = useState<any | null>(null);
  const [isIssuingLicense, setIsIssuingLicense] = useState<boolean>(false);

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [checkoutPlan, setCheckoutPlan] = useState<string>('Enterprise');
  const [checkoutCycle, setCheckoutCycle] = useState<string>('annual');
  const [checkoutProvider, setCheckoutProvider] = useState<string>('Stripe');
  const [checkoutResult, setCheckoutResult] = useState<any | null>(null);

  const getAuthToken = () => {
    return sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
  };

  const fetchCommercialData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const [resMetrics, resPlans, resInvoices] = await Promise.all([
        fetch('/api/v2/commercial/analytics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v2/commercial/plans', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v2/commercial/billing/invoices', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (resMetrics.ok) {
        const m = await resMetrics.json();
        setAnalytics(m.analytics);
      }
      if (resPlans.ok) {
        const p = await resPlans.json();
        setPlans(p.plans || []);
      }
      if (resInvoices.ok) {
        const inv = await resInvoices.json();
        setInvoices(inv.invoices || []);
      }
    } catch (err: any) {
      toast.error('Failed to load commercial telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommercialData();
  }, []);

  const handleIssueLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuingLicense(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v2/commercial/license/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_tier: licensePlan,
          license_type: licenseType,
          validity_days: licenseValidityDays
        })
      });

      if (!res.ok) throw new Error('Failed to issue license');
      const data = await res.json();
      setIssuedLicense(data.license);
      toast.success('Commercial license generated and signed!');
      fetchCommercialData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsIssuingLicense(false);
    }
  };

  const handleCreateCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v2/commercial/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_tier: checkoutPlan,
          billing_cycle: checkoutCycle,
          provider: checkoutProvider
        })
      });

      if (!res.ok) throw new Error('Failed to generate checkout session');
      const data = await res.json();
      setCheckoutResult(data.checkout_session);
      toast.success('Checkout session generated via provider abstraction!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Commercial Operations & Scale (12.10)
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Commercial Analytics & Financial Metrics
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
              Real-time recurring revenue, plan distribution, license issuance, provider-agnostic billing integration, and fleet economics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setShowLicenseModal(true);
                setIssuedLicense(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Key className="w-4 h-4" />
              Generate License
            </button>
            <button
              onClick={() => {
                setShowCheckoutModal(true);
                setCheckoutResult(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              Upgrade / Checkout
            </button>
            <Link
              to="/customer-success"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              Customer Success
            </Link>
          </div>
        </div>
      </div>

      {/* Financial KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* ARR */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="text-xs text-slate-400 font-medium">Annual Run-Rate (ARR)</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            ${(analytics?.arr_usd || 3414000).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +18.4% YoY Growth
          </div>
        </div>

        {/* MRR */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="text-xs text-slate-400 font-medium">Monthly Recurring (MRR)</div>
          <div className="text-2xl font-extrabold text-white mt-1">
            ${(analytics?.mrr_usd || 284500).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Normalized Active MRR
          </div>
        </div>

        {/* Expansion ARR */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="text-xs text-slate-400 font-medium">Expansion ARR</div>
          <div className="text-2xl font-extrabold text-indigo-400 mt-1">
            ${(analytics?.expansion_arr_usd || 425000).toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-300 mt-1">
            NRR: {analytics?.net_revenue_retention_percent || 118.4}%
          </div>
        </div>

        {/* Churn Rate */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="text-xs text-slate-400 font-medium">Net Churn Rate</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {analytics?.churn_rate_percent || 0.8}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Industry Benchmark &lt; 2.5%
          </div>
        </div>

        {/* Total Customers */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="text-xs text-slate-400 font-medium">Active Enterprise Tenants</div>
          <div className="text-2xl font-extrabold text-white mt-1">
            {analytics?.total_customers || 18}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Avg: ${(analytics?.average_revenue_per_customer_usd || 189666).toLocaleString()}/yr
          </div>
        </div>

        {/* Monitored Endpoints */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="text-xs text-slate-400 font-medium">Monitored Endpoints</div>
          <div className="text-2xl font-extrabold text-indigo-400 mt-1">
            {(analytics?.total_monitored_endpoints || 14820).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Live Telemetry Ingestion
          </div>
        </div>
      </div>

      {/* Plan Distribution Breakdown */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <PieChart className="w-4 h-4 text-indigo-400" />
          Enterprise Customer Distribution Across Commercial Plans
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(analytics?.plan_distribution || { Trial: 4, Starter: 3, Business: 5, Enterprise: 4, MDR: 2, MSSP: 1 }).map(([tier, count]) => (
            <div key={tier} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{tier}</div>
              <div className="text-2xl font-bold text-white mt-1">{count}</div>
              <div className="text-[10px] text-indigo-400 font-medium mt-0.5">Tenants</div>
            </div>
          ))}
        </div>
      </div>

      {/* Commercial Plans Comparison Table (12.1) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Commercial Plan Tier Specifications & Entitlements (12.1)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configurable endpoint limits, storage quotas, event volume, user limits, retention, and SLA tiers.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Endpoints</th>
                <th className="py-3 px-4">Storage (GB)</th>
                <th className="py-3 px-4">Event Volume (EPS)</th>
                <th className="py-3 px-4">Users</th>
                <th className="py-3 px-4">Retention</th>
                <th className="py-3 px-4">Support & SLA</th>
                <th className="py-3 px-4 text-right">Pricing (Annual)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {plans.map((p) => (
                <tr key={p.tier} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-white font-sans flex items-center gap-2">
                    {p.name}
                    {p.tier === 'Enterprise' && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                        Popular
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-200">{p.endpoint_limit.toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-200">{p.storage_gb.toLocaleString()} GB</td>
                  <td className="py-3 px-4 text-slate-200">{p.event_volume_eps.toLocaleString()} EPS</td>
                  <td className="py-3 px-4 text-slate-200">{p.user_limit} Users</td>
                  <td className="py-3 px-4 text-slate-200">{p.retention_days} Days</td>
                  <td className="py-3 px-4 font-sans">
                    <div className="text-slate-200 font-semibold">{p.sla_tier}</div>
                    <div className="text-[10px] text-slate-500">{p.support_level}</div>
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                    {p.annual_price_usd === 0 ? 'Free POV' : `$${p.annual_price_usd.toLocaleString()}/yr`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Invoices Card (12.3) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Auditable Customer Billing Invoices (12.3)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Provider-abstracted invoice records with cryptographic audit trail. Zero raw card storage.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-mono font-semibold text-white">{inv.invoice_number}</td>
                  <td className="py-3 px-4 font-mono text-emerald-400 font-bold">${inv.amount_usd.toLocaleString()} USD</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{inv.provider}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={inv.invoice_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ISSUE / UPGRADE LICENSE MODAL (12.2) */}
      {showLicenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              Cryptographic License Generation (12.2)
            </h2>
            <p className="text-xs text-slate-400">
              Generate an enterprise signed license or an air-gapped offline token with full entitlement binding.
            </p>

            <form onSubmit={handleIssueLicense} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Plan Tier</label>
                  <select
                    value={licensePlan}
                    onChange={(e) => setLicensePlan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {['Trial', 'Starter', 'Business', 'Enterprise', 'MDR', 'MSSP'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">License Type</label>
                  <select
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Online">Online Connected</option>
                    <option value="Offline">Offline Air-Gapped</option>
                    <option value="Enterprise">Enterprise Sovereign</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Validity (Days)</label>
                <input
                  type="number"
                  value={licenseValidityDays}
                  onChange={(e) => setLicenseValidityDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Issued License Display */}
              {issuedLicense && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-800/60 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> License Successfully Generated & Signed
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 break-all select-all p-2 rounded bg-slate-900 border border-slate-800">
                    {issuedLicense.license_key}
                  </div>
                  {licenseType === 'Offline' && (
                    <div className="text-[10px] font-mono text-indigo-300 break-all select-all p-2 rounded bg-indigo-950/40 border border-indigo-900">
                      {issuedLicense.air_gapped_offline_token}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLicenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isIssuingLicense}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {isIssuingLicense && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Sign & Issue License
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECKOUT BILLING MODAL (12.3) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Enterprise Checkout (Provider Abstraction 12.3)
            </h2>
            <p className="text-xs text-slate-400">
              Tokenized gateway session. Card credentials are never transmitted through or retained on Monitorix servers.
            </p>

            <form onSubmit={handleCreateCheckout} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Plan</label>
                <select
                  value={checkoutPlan}
                  onChange={(e) => setCheckoutPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {['Starter', 'Business', 'Enterprise', 'MDR', 'MSSP'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Cycle</label>
                  <select
                    value={checkoutCycle}
                    onChange={(e) => setCheckoutCycle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="annual">Annual (Save 15%)</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Provider Adapter</label>
                  <select
                    value={checkoutProvider}
                    onChange={(e) => setCheckoutProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Stripe">Stripe Gateway</option>
                    <option value="Paddle">Paddle Gateway</option>
                    <option value="Direct">Enterprise Direct Invoicing</option>
                  </select>
                </div>
              </div>

              {checkoutResult && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-800/60 space-y-2">
                  <div className="text-xs font-bold text-emerald-400">Checkout Session Initialized</div>
                  <div className="text-[11px] font-mono text-slate-300 break-all">
                    Session ID: {checkoutResult.session_id}
                  </div>
                  <div className="text-xs text-emerald-400 font-bold">
                    Amount: ${checkoutResult.amount_usd.toLocaleString()} {checkoutResult.currency}
                  </div>
                  <a
                    href={checkoutResult.checkout_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs mt-2"
                  >
                    Proceed to Tokenized Checkout Gateway
                  </a>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30"
                >
                  Generate Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
