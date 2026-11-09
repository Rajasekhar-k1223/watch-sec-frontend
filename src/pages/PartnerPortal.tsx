import React, { useState, useEffect } from 'react';
import {
  Users, Building2, FileText, DollarSign, TrendingUp,
  Percent, ArrowRight, ShieldCheck, Server, RefreshCw,
  Plus, CheckCircle2, Clock, AlertTriangle, Eye, HelpCircle,
  Briefcase, Laptop, Award, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PartnerCustomer {
  id: number;
  customer_code: string;
  customer_name: string;
  partner_id: number;
  tenant_id: number;
  primary_contact_email: string;
  industry: string;
  deployment_model: string;
  status: string;
  created_at: string;
}

interface PartnerQuote {
  id: number;
  quote_number: string;
  customer_id: number;
  plan_code: string;
  billing_cycle: string;
  gross_amount_usd: number;
  discount_percent: number;
  net_amount_usd: number;
  valid_until: string;
  status: string;
  created_at: string;
}

interface PartnerCommission {
  id: number;
  partner_id: number;
  order_id: number;
  customer_id: number;
  gross_amount_usd: number;
  commission_rate_percent: number;
  commission_amount_usd: number;
  payout_status: string;
  created_at: string;
  paid_at: string | null;
}

interface DeploymentSummary {
  deployment_id: string;
  environment: string;
  deployment_type: string;
  version: string;
  license_status: string;
  control_plane_connection: string;
  local_health: string;
  active_agent_count: number;
  agent_limit: number;
  last_heartbeat_at: string;
}

export default function PartnerPortal() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'quotes' | 'commissions' | 'deployments'>('dashboard');
  const [customers, setCustomers] = useState<PartnerCustomer[]>([]);
  const [quotes, setQuotes] = useState<PartnerQuote[]>([]);
  const [commissions, setCommissions] = useState<PartnerCommission[]>([]);
  const [deployments, setDeployments] = useState<DeploymentSummary[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Customer Modal
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerIndustry, setCustomerIndustry] = useState<string>('Technology');
  const [deploymentModel, setDeploymentModel] = useState<string>('OnPremises');

  // New Quote Modal
  const [showQuoteModal, setShowQuoteModal] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('XDR-500');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [billingCycle, setBillingCycle] = useState<string>('annual');

  const getHeaders = () => {
    const token = sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = getHeaders();

      // 1. Fetch partner customers
      const cRes = await fetch('/api/v2/partner/customers', { headers });
      if (cRes.ok) {
        const cData = await cRes.json();
        setCustomers(cData);
        if (cData.length > 0) setSelectedCustomerId(cData[0].id);
      }

      // 2. Fetch quotes
      const qRes = await fetch('/api/v2/partner/quotes', { headers });
      if (qRes.ok) {
        const qData = await qRes.json();
        setQuotes(qData);
      }

      // 3. Fetch commissions
      const commRes = await fetch('/api/v2/partner/commissions', { headers });
      if (commRes.ok) {
        const commData = await commRes.json();
        setCommissions(commData);
      }

      // 4. Fetch deployment health summary
      const depRes = await fetch('/api/v2/partner/deployments', { headers });
      if (depRes.ok) {
        const depData = await depRes.json();
        setDeployments(depData);
      }

      // 5. Fetch available product plans
      const planRes = await fetch('/api/v2/admin/commercial/plans', { headers });
      if (planRes.ok) {
        const planData = await planRes.json();
        setPlans(planData);
      }
    } catch (err: any) {
      console.error('Partner Portal load error:', err);
      toast.error('Failed to load partner data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCustomer = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error('Please enter customer organization name and primary email');
      return;
    }
    try {
      const res = await fetch('/api/v2/partner/customers', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          customer_name: customerName,
          primary_contact_email: customerEmail,
          industry: customerIndustry,
          deployment_model: deploymentModel
        })
      });
      if (res.ok) {
        toast.success(`Customer ${customerName} registered successfully!`);
        setShowCustomerModal(false);
        setCustomerName('');
        setCustomerEmail('');
        fetchData();
      } else {
        toast.error('Failed to create customer');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleCreateQuote = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }
    try {
      const res = await fetch('/api/v2/partner/quotes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          plan_code: selectedPlanCode,
          billing_cycle: billingCycle,
          discount_percent: Number(discountPercent)
        })
      });
      if (res.ok) {
        const quote = await res.json();
        toast.success(`Quote ${quote.quote_number} generated! Net: $${quote.net_amount_usd?.toLocaleString()}`);
        setShowQuoteModal(false);
        fetchData();
      } else {
        toast.error('Failed to generate quote');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const totalEarnedCommissions = commissions.reduce((sum, c) => sum + (c.commission_amount_usd || 0), 0);
  const pendingCommissions = commissions
    .filter(c => c.payout_status === 'PENDING')
    .reduce((sum, c) => sum + (c.commission_amount_usd || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
            <Briefcase className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Partner & Reseller Commercial Hub</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                AUTHORIZED RESELLER
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Customer provisioning, quotes, commission tracking, and customer deployment operational health.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQuoteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <FileText className="w-4 h-4" />
            Create Quote
          </button>
          <button
            onClick={() => setShowCustomerModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            New Customer
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 gap-2 pb-2">
        {[
          { id: 'dashboard', label: 'Overview & Performance', icon: TrendingUp },
          { id: 'customers', label: 'Customer Accounts', icon: Building2 },
          { id: 'quotes', label: 'Commercial Quotes', icon: FileText },
          { id: 'commissions', label: 'Reseller Commissions', icon: DollarSign },
          { id: 'deployments', label: 'Deployment Health', icon: Server },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & PERFORMANCE */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
                <span>Managed Customers</span>
                <Building2 className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{customers.length}</div>
              <p className="mt-1 text-xs text-slate-500">Active enterprise accounts</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
                <span>Total Commission</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                ${totalEarnedCommissions.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-emerald-600 font-medium">Standard 20% margin</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
                <span>Pending Payout</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                ${pendingCommissions.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-amber-600 font-medium">Next cycle payout</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
                <span>Active Quotes</span>
                <FileText className="w-4 h-4 text-purple-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{quotes.length}</div>
              <p className="mt-1 text-xs text-slate-500">Pipeline opportunities</p>
            </div>
          </div>

          {/* Data Sovereignty Notice */}
          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">Customer Data Sovereignty Architecture</h4>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                Monitorix enforces strict data sovereignty. Resellers and partners have full visibility over commercial orders, licenses, quotes, and deployment operational health, but cannot access raw customer security telemetry or incident evidence unless explicitly granted by the customer organization.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Customer Organizations</h2>
            <button
              onClick={() => setShowCustomerModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-xs uppercase">
                  <th className="pb-3">Customer Code</th>
                  <th className="pb-3">Organization Name</th>
                  <th className="pb-3">Contact Email</th>
                  <th className="pb-3">Deployment Model</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-mono font-bold text-blue-600 text-xs">{c.customer_code}</td>
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{c.customer_name}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{c.primary_contact_email}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {c.deployment_model}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-500">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: QUOTES */}
      {activeTab === 'quotes' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Commercial Quotes</h2>
            <button
              onClick={() => setShowQuoteModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Quote
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-xs uppercase">
                  <th className="pb-3">Quote #</th>
                  <th className="pb-3">Plan Code</th>
                  <th className="pb-3">Billing</th>
                  <th className="pb-3 text-right">Gross Price</th>
                  <th className="pb-3 text-right">Discount</th>
                  <th className="pb-3 text-right">Net Price</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Valid Until</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quotes.map(q => (
                  <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-mono font-bold text-blue-600 text-xs">{q.quote_number}</td>
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{q.plan_code}</td>
                    <td className="py-3 capitalize text-slate-600 dark:text-slate-300">{q.billing_cycle}</td>
                    <td className="py-3 text-right font-mono text-slate-500">${q.gross_amount_usd?.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono text-amber-600">{q.discount_percent}%</td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-600">${q.net_amount_usd?.toLocaleString()}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-500">
                      {q.valid_until ? new Date(q.valid_until).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: COMMISSIONS */}
      {activeTab === 'commissions' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Reseller Commissions Ledger</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-xs uppercase">
                  <th className="pb-3">Transaction ID</th>
                  <th className="pb-3 text-right">Order Gross</th>
                  <th className="pb-3 text-right">Commission Rate</th>
                  <th className="pb-3 text-right">Commission Amount</th>
                  <th className="pb-3">Payout Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {commissions.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-mono text-xs text-slate-600 dark:text-slate-300">COMM-{c.id}</td>
                    <td className="py-3 text-right font-mono">${c.gross_amount_usd?.toLocaleString()}</td>
                    <td className="py-3 text-right font-mono font-semibold text-blue-600">{c.commission_rate_percent}%</td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-600">${c.commission_amount_usd?.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        c.payout_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.payout_status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-500">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DEPLOYMENTS HEALTH */}
      {activeTab === 'deployments' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Customer Deployment Health & Agent Usage</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Operational status and agent fleet metrics. SOC telemetry remains isolated within customer tenancy.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deployments.map(d => (
              <div key={d.deployment_id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{d.deployment_id}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {d.license_status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div>Model: <span className="font-semibold">{d.deployment_type}</span></div>
                  <div>Version: <span className="font-semibold">{d.version}</span></div>
                  <div>Health: <span className="font-semibold text-emerald-600">{d.local_health}</span></div>
                  <div>Link: <span className="font-semibold text-emerald-600">{d.control_plane_connection}</span></div>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Enrolled Endpoints</span>
                  <span className="font-mono font-bold text-blue-600">{d.active_agent_count} / {d.agent_limit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: NEW CUSTOMER */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Register New Customer</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Organization Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Primary Contact Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="admin@acme.com"
                  className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Deployment Model</label>
                  <select
                    value={deploymentModel}
                    onChange={e => setDeploymentModel(e.target.value)}
                    className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="OnPremises">On-Premises Server</option>
                    <option value="Cloud">Monitorix Cloud</option>
                    <option value="Hybrid">Hybrid Architecture</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Industry</label>
                  <select
                    value={customerIndustry}
                    onChange={e => setCustomerIndustry(e.target.value)}
                    className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Finance">Financial Services</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Defense">Defense / Gov</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomer}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
              >
                Create Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE QUOTE */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Draft Commercial Quote</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(Number(e.target.value))}
                  className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.customer_name} ({c.customer_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Product Plan & Capacity</label>
                <select
                  value={selectedPlanCode}
                  onChange={e => setSelectedPlanCode(e.target.value)}
                  className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  {plans.map(p => (
                    <option key={p.plan_code} value={p.plan_code}>
                      {p.plan_name} (${p.annual_price_usd?.toLocaleString()}/yr)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Partner Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={discountPercent}
                    onChange={e => setDiscountPercent(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Billing Cycle</label>
                  <select
                    value={billingCycle}
                    onChange={e => setBillingCycle(e.target.value)}
                    className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="annual">Annual Prepaid</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowQuoteModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuote}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
              >
                Generate Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
