import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Building2, Users, FileText, DollarSign,
  Key, Server, RefreshCw, CheckCircle2, Clock, Plus,
  CreditCard, ArrowRight, AlertTriangle, Layers, Percent
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCommercialPortal() {
  const [activeTab, setActiveTab] = useState<'partners' | 'customers' | 'plans' | 'orders' | 'licenses' | 'deployments'>('partners');
  const [partners, setPartners] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Partner Modal
  const [showPartnerModal, setShowPartnerModal] = useState<boolean>(false);
  const [partnerName, setPartnerName] = useState<string>('');
  const [partnerEmail, setPartnerEmail] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<number>(20.0);

  // Issue License Modal
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(1);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('XDR-500');
  const [endpointLimit, setEndpointLimit] = useState<number>(500);
  const [issuedLicenseToken, setIssuedLicenseToken] = useState<string>('');

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

      const [pRes, cRes, plRes, qRes, depRes, commRes] = await Promise.all([
        fetch('/api/v2/admin/commercial/partners', { headers }),
        fetch('/api/v2/admin/commercial/customers', { headers }),
        fetch('/api/v2/admin/commercial/plans', { headers }),
        fetch('/api/v2/partner/quotes', { headers }),
        fetch('/api/v2/deployments', { headers }),
        fetch('/api/v2/admin/commercial/commissions', { headers })
      ]);

      if (pRes.ok) setPartners(await pRes.json());
      if (cRes.ok) setCustomers(await cRes.json());
      if (plRes.ok) setPlans(await plRes.json());
      if (qRes.ok) setQuotes(await qRes.json());
      if (depRes.ok) setDeployments(await depRes.json());
      if (commRes.ok) setCommissions(await commRes.json());
    } catch (err: any) {
      console.error('Admin Commercial Portal error:', err);
      toast.error('Failed to load commercial records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePartner = async () => {
    if (!partnerName.trim() || !partnerEmail.trim()) {
      toast.error('Please enter partner name and contact email');
      return;
    }
    try {
      const res = await fetch('/api/v2/admin/commercial/partners', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          partner_name: partnerName,
          contact_email: partnerEmail,
          commission_rate_percent: Number(commissionRate)
        })
      });
      if (res.ok) {
        toast.success(`Partner ${partnerName} registered!`);
        setShowPartnerModal(false);
        setPartnerName('');
        setPartnerEmail('');
        fetchData();
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleAcceptQuoteAndPay = async (quoteId: number) => {
    try {
      // 1. Accept Quote -> Creates Order
      const accRes = await fetch(`/api/v2/admin/commercial/quotes/${quoteId}/accept`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!accRes.ok) {
        toast.error('Failed to accept quote');
        return;
      }
      const orderData = await accRes.json();

      // 2. Process Order Payment -> Issues Signed License & calculates commission
      const payRes = await fetch(`/api/v2/admin/commercial/orders/${orderData.order_id}/pay`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ payment_method: 'WireTransfer' })
      });
      if (payRes.ok) {
        const payData = await payRes.json();
        toast.success(`Order ${payData.order_number} paid! Signed License ${payData.license_id} issued.`);
        fetchData();
      } else {
        toast.error('Payment processing failed');
      }
    } catch (err: any) {
      toast.error(`Order flow error: ${err.message}`);
    }
  };

  const handleIssueLicense = async () => {
    try {
      const res = await fetch('/api/v2/licenses/issue', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          tenant_id: selectedCustomerId,
          plan_code: selectedPlanCode,
          endpoint_limit: Number(endpointLimit),
          validity_days: 365
        })
      });
      if (res.ok) {
        const lic = await res.json();
        setIssuedLicenseToken(lic.license_token);
        toast.success(`License ${lic.license_id} cryptographically signed!`);
        fetchData();
      } else {
        toast.error('Failed to issue license');
      }
    } catch (err: any) {
      toast.error(`Issue error: ${err.message}`);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Commercial & Licensing Operations</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                GLOBAL CONTROL PLANE
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Global governance of resellers, customers, product catalog, quotes, cryptographic licenses, and deployment registry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPartnerModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Partner
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Key className="w-4 h-4" />
            Issue License
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

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 gap-2 pb-2">
        {[
          { id: 'partners', label: 'Partners & Resellers', icon: Users },
          { id: 'customers', label: 'Customer Directory', icon: Building2 },
          { id: 'plans', label: 'Product Catalog & Plans', icon: Layers },
          { id: 'orders', label: 'Quotes & Orders', icon: FileText },
          { id: 'deployments', label: 'Customer Deployments Registry', icon: Server },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PARTNERS */}
      {activeTab === 'partners' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Commercial Partners & Resellers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-xs uppercase">
                  <th className="pb-3">Partner Code</th>
                  <th className="pb-3">Partner Name</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Contact Email</th>
                  <th className="pb-3 text-right">Commission Rate</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {partners.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-mono font-bold text-blue-600 text-xs">{p.partner_code}</td>
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{p.partner_name}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{p.partner_type}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{p.contact_email}</td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-600">{p.commission_rate_percent}%</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">All Customer Organizations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-xs uppercase">
                  <th className="pb-3">Customer Code</th>
                  <th className="pb-3">Customer Name</th>
                  <th className="pb-3">Partner ID</th>
                  <th className="pb-3">Tenant ID</th>
                  <th className="pb-3">Model</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-mono font-bold text-blue-600 text-xs">{c.customer_code}</td>
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{c.customer_name}</td>
                    <td className="py-3 font-mono text-xs">{c.partner_id ? `PRT-${c.partner_id}` : 'Direct'}</td>
                    <td className="py-3 font-mono text-xs text-blue-600">TENANT-{c.tenant_id}</td>
                    <td className="py-3">{c.deployment_model}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PLANS */}
      {activeTab === 'plans' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Product Catalog & Capacity Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(p => (
              <div key={p.plan_code} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-600">{p.plan_code}</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{p.plan_name}</h3>
                  <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                    ${p.annual_price_usd?.toLocaleString()}<span className="text-xs text-slate-500 font-normal">/year</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Endpoint Limit</span>
                    <span className="font-bold">{p.endpoint_limit} Agents</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cloud Accounts</span>
                    <span className="font-bold">{p.cloud_account_limit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Database Instances</span>
                    <span className="font-bold">{p.database_limit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kubernetes Clusters</span>
                    <span className="font-bold">{p.kubernetes_limit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NDR Sensors</span>
                    <span className="font-bold">{p.network_sensor_limit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Storage / Ingestion</span>
                    <span className="font-bold">{p.storage_limit_gb} GB / {p.events_per_second_limit} EPS</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Quotes & Orders Lifecycle</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-xs uppercase">
                  <th className="pb-3">Quote #</th>
                  <th className="pb-3">Customer ID</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3 text-right">Net Price</th>
                  <th className="pb-3">Quote Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quotes.map(q => (
                  <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-mono font-bold text-blue-600 text-xs">{q.quote_number}</td>
                    <td className="py-3 font-mono text-xs">CUST-{q.customer_id}</td>
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{q.plan_code}</td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-600">${q.net_amount_usd?.toLocaleString()}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {q.status !== 'ACCEPTED' ? (
                        <button
                          onClick={() => handleAcceptQuoteAndPay(q.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                        >
                          Accept & Provision License
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Order Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DEPLOYMENTS */}
      {activeTab === 'deployments' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Customer Deployments Registry</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-xs uppercase">
                  <th className="pb-3">Deployment ID</th>
                  <th className="pb-3">Customer ID</th>
                  <th className="pb-3">Type / Env</th>
                  <th className="pb-3">Control Plane</th>
                  <th className="pb-3 text-right">Enrolled Endpoints</th>
                  <th className="pb-3">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {deployments.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="py-3 font-mono font-bold text-slate-900 dark:text-white text-xs">{d.deployment_id}</td>
                    <td className="py-3 font-mono text-xs">CUST-{d.customer_id}</td>
                    <td className="py-3 text-xs">{d.deployment_type} ({d.environment})</td>
                    <td className="py-3 text-xs text-emerald-600 font-semibold">{d.control_plane_connection}</td>
                    <td className="py-3 text-right font-mono font-bold text-blue-600">{d.active_agent_count} / {d.agent_limit}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {d.local_health}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD PARTNER */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Register Reseller Partner</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Partner Organization Name</label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={e => setPartnerName(e.target.value)}
                  placeholder="e.g. ABC Security Solutions"
                  className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Contact Email</label>
                <input
                  type="email"
                  value={partnerEmail}
                  onChange={e => setPartnerEmail(e.target.value)}
                  placeholder="partner@abcsecurity.com"
                  className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Commission Rate (%)</label>
                <input
                  type="number"
                  min="5"
                  max="40"
                  value={commissionRate}
                  onChange={e => setCommissionRate(Number(e.target.value))}
                  className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPartnerModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePartner}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl"
              >
                Register Partner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE CRYPTOGRAPHIC LICENSE */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Issue Cryptographically Signed License</h3>
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Plan</label>
                <select
                  value={selectedPlanCode}
                  onChange={e => setSelectedPlanCode(e.target.value)}
                  className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  {plans.map(p => (
                    <option key={p.plan_code} value={p.plan_code}>{p.plan_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Endpoint Limit</label>
                <input
                  type="number"
                  value={endpointLimit}
                  onChange={e => setEndpointLimit(Number(e.target.value))}
                  className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              {issuedLicenseToken && (
                <div>
                  <label className="text-xs font-semibold text-emerald-600">Generated License Token (Copy to clipboard)</label>
                  <textarea
                    readOnly
                    value={issuedLicenseToken}
                    className="mt-1 w-full h-24 p-2 text-xs font-mono bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowIssueModal(false); setIssuedLicenseToken(''); }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300"
              >
                Close
              </button>
              <button
                onClick={handleIssueLicense}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
              >
                Generate & Sign License
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
