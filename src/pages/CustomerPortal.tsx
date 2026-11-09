import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Server, AlertTriangle, Key, Activity, RefreshCw,
  Cpu, Database, Cloud, Radio, Zap, Clock, CheckCircle2, XCircle,
  FileText, ExternalLink, HelpCircle, HardDrive, Filter, Power,
  Download, Plus, ChevronRight, Lock, Laptop
} from 'lucide-react';
import toast from 'react-hot-toast';

interface EntitlementSummary {
  license: {
    license_id: string;
    plan: string;
    plan_code: string;
    edition: string;
    status: string;
    valid_from: string;
    valid_until: string;
    offline_grace_period_days: number;
    signature_verified: boolean;
  };
  endpoint_usage: {
    limit: number;
    active_agents: number;
    available: number;
    usage_percent: number;
    status: string;
  };
  resource_usage: Record<string, { limit: number; used: number }>;
  feature_entitlements: Array<{
    feature: string;
    code: string;
    included: boolean;
    limit: number;
    used: number;
    available: number;
  }>;
}

interface DeploymentRecord {
  id: number;
  deployment_id: string;
  customer_id: number;
  tenant_id: number;
  environment: string;
  deployment_type: string;
  version: string;
  license_id: string;
  license_status: string;
  control_plane_connection: string;
  local_health: string;
  agent_gateway_health: string;
  local_entitlement_health: string;
  active_agent_count: number;
  agent_limit: number;
  server_count: number;
  cloud_account_count: number;
  database_count: number;
  kubernetes_count: number;
  storage_usage_gb: number;
  cpu_usage_percent: number;
  memory_usage_percent: number;
  last_heartbeat_at: string;
}

interface AgentItem {
  id: number;
  agentId: string;
  hostname: string;
  status: string;
  lastSeen: string | null;
  publicIp?: string;
  cpuUsage?: number;
  memoryUsage?: number;
}

interface SupportTicketItem {
  id: number;
  ticket_id: string;
  title: string;
  description: string;
  severity: string;
  category: string;
  status: string;
  created_at: string;
}

export default function CustomerPortal() {
  const [activeTab, setActiveTab] = useState<'overview' | 'license' | 'entitlements' | 'deployments' | 'agents' | 'support'>('overview');
  const [entitlements, setEntitlements] = useState<EntitlementSummary | null>(null);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Activation modal state
  const [showActivateModal, setShowActivateModal] = useState<boolean>(false);
  const [licenseTokenInput, setLicenseTokenInput] = useState<string>('');
  const [isActivating, setIsActivating] = useState<boolean>(false);

  // Support ticket modal state
  const [showTicketModal, setShowTicketModal] = useState<boolean>(false);
  const [ticketTitle, setTicketTitle] = useState<string>('');
  const [ticketDesc, setTicketDesc] = useState<string>('');
  const [ticketCategory, setTicketCategory] = useState<string>('LicenseEntitlement');
  const [ticketSeverity, setTicketSeverity] = useState<string>('Normal');

  // Agent filter state
  const [agentStatusFilter, setAgentStatusFilter] = useState<string>('all');

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

      // 1. Fetch live authoritative entitlements
      const entRes = await fetch('/api/v2/customer/entitlements', { headers });
      if (entRes.ok) {
        const entData = await entRes.json();
        setEntitlements(entData);
      }

      // 2. Fetch customer deployments
      const depRes = await fetch('/api/v2/deployments', { headers });
      if (depRes.ok) {
        const depData = await depRes.json();
        setDeployments(depData);
      }

      // 3. Fetch agents
      const agentRes = await fetch('/api/agents?limit=100', { headers });
      if (agentRes.ok) {
        const agentData = await agentRes.json();
        setAgents(agentData);
      }

      // 4. Fetch support tickets
      const tktRes = await fetch('/api/v2/customer/support/tickets', { headers });
      if (tktRes.ok) {
        const tktData = await tktRes.json();
        setSupportTickets(tktData);
      }
    } catch (err: any) {
      console.error('Customer Portal load error:', err);
      toast.error('Failed to load commercial portal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleActivateLicense = async () => {
    if (!licenseTokenInput.trim()) {
      toast.error('Please enter a signed license token');
      return;
    }
    try {
      setIsActivating(true);
      const res = await fetch('/api/v2/licenses/activate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ license_token: licenseTokenInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`License ${data.license_id} successfully activated!`);
        setShowActivateModal(false);
        setLicenseTokenInput('');
        fetchData();
      } else {
        toast.error(data.message || 'License activation failed. Invalid signature or expired.');
      }
    } catch (err: any) {
      toast.error(`Activation error: ${err.message}`);
    } finally {
      setIsActivating(false);
    }
  };

  const handleDecommissionAgent = async (agentId: string) => {
    if (!confirm(`Are you sure you want to decommission Agent ${agentId}? This will immediately release its endpoint entitlement quota slot.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/agents/${agentId}/decommission`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Agent ${agentId} decommissioned. Quota slot released!`);
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to decommission agent');
      }
    } catch (err: any) {
      toast.error(`Decommission error: ${err.message}`);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketTitle.trim() || !ticketDesc.trim()) {
      toast.error('Please fill in title and description');
      return;
    }
    try {
      const res = await fetch('/api/v2/customer/support/ticket', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title: ticketTitle,
          description: ticketDesc,
          category: ticketCategory,
          severity: ticketSeverity
        })
      });
      if (res.ok) {
        toast.success('Support ticket created successfully');
        setShowTicketModal(false);
        setTicketTitle('');
        setTicketDesc('');
        fetchData();
      } else {
        toast.error('Failed to create support ticket');
      }
    } catch (err: any) {
      toast.error(`Ticket error: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">ACTIVE</span>;
      case 'EXPIRING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">EXPIRING SOON</span>;
      case 'GRACE_PERIOD':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">OFFLINE GRACE</span>;
      case 'RESTRICTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">RESTRICTED</span>;
      case 'EXPIRED':
      case 'REVOKED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">EXPIRED</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const filteredAgents = agents.filter(a => {
    if (agentStatusFilter === 'all') return true;
    return a.status.toLowerCase() === agentStatusFilter.toLowerCase();
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Commercial & Deployment Portal</h1>
                {entitlements?.license?.status && getStatusBadge(entitlements.license.status)}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Authoritative local licensing, agent entitlement quotas, deployment health, and support.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowActivateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Key className="w-4 h-4" />
            Activate Signed License
          </button>
          <button
            onClick={() => setShowTicketModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            New Ticket
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 gap-2 pb-2">
        {[
          { id: 'overview', label: 'Overview & Health', icon: Activity },
          { id: 'license', label: 'License & Signatures', icon: Key },
          { id: 'entitlements', label: 'Authoritative Entitlements', icon: Zap },
          { id: 'deployments', label: 'Deployments (On-Prem / Cloud)', icon: Server },
          { id: 'agents', label: 'Agent Fleet & Quota Management', icon: Laptop },
          { id: 'support', label: 'Support & SLA', icon: HelpCircle },
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

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quota Exceeded Banner (if applicable) */}
          {entitlements?.endpoint_usage && entitlements.endpoint_usage.available <= 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/60 text-rose-600 rounded-lg">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
                    Endpoint Limit Reached ({entitlements.endpoint_usage.active_agents}/{entitlements.endpoint_usage.limit})
                  </h3>
                  <p className="text-sm text-rose-700 dark:text-rose-300">
                    New agent enrollments will be rejected with <code className="bg-rose-100 dark:bg-rose-900 px-1 py-0.5 rounded font-mono text-xs">ENDPOINT_LIMIT_EXCEEDED</code>. Decommission inactive agents or upgrade license.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('agents')}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Manage Agents
                </button>
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-lg"
                >
                  Request Expansion
                </button>
              </div>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
                <span>Active Plan</span>
                <ShieldCheck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {entitlements?.license?.plan || 'Enterprise XDR'}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <span>Edition: {entitlements?.license?.edition || 'Standard'}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
                <span>Endpoint Quota</span>
                <Laptop className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {entitlements?.endpoint_usage?.active_agents || 0} / {entitlements?.endpoint_usage?.limit || 500}
              </div>
              <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (entitlements?.endpoint_usage?.usage_percent || 0) >= 100
                      ? 'bg-rose-500'
                      : (entitlements?.endpoint_usage?.usage_percent || 0) >= 85
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, entitlements?.endpoint_usage?.usage_percent || 0)}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-slate-500 text-right">
                {entitlements?.endpoint_usage?.available || 0} slots remaining ({entitlements?.endpoint_usage?.usage_percent || 0}%)
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
                <span>Deployment Nodes</span>
                <Server className="w-4 h-4 text-purple-500" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {deployments.length} Active
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Control Plane Connected</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
                <span>License Validity</span>
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {entitlements?.license?.valid_until ? new Date(entitlements.license.valid_until).toLocaleDateString() : 'N/A'}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Offline Grace: {entitlements?.license?.offline_grace_period_days || 14} days
              </div>
            </div>
          </div>

          {/* Core System Engines Health */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">On-Premises Local Engine Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Control Plane Sync</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="mt-2 text-base font-bold text-slate-900 dark:text-white">CONNECTED</div>
                <p className="mt-1 text-xs text-slate-500">Outbound mTLS telemetry only</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">License Validation</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-2 text-base font-bold text-slate-900 dark:text-white">VALID (Ed25519)</div>
                <p className="mt-1 text-xs text-slate-500">Cryptographically verified locally</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Local Entitlement Engine</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-2 text-base font-bold text-slate-900 dark:text-white">HEALTHY</div>
                <p className="mt-1 text-xs text-slate-500">Authoritative quota enforcement</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Agent Gateway</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-2 text-base font-bold text-slate-900 dark:text-white">HEALTHY</div>
                <p className="mt-1 text-xs text-slate-500">mTLS agent enrollment active</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LICENSE & OFFLINE VERIFICATION */}
      {activeTab === 'license' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Cryptographic License Details</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              The Monitorix License is digitally signed by the Root Authority using Ed25519 cryptography. It is verified completely offline by your customer server without requiring cloud connectivity.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-sm text-slate-500">License ID</span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{entitlements?.license?.license_id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-sm text-slate-500">Product Plan</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{entitlements?.license?.plan}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-sm text-slate-500">Status</span>
                  <span>{entitlements?.license?.status && getStatusBadge(entitlements.license.status)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-sm text-slate-500">Digital Signature</span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ed25519 Verified Locally
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-sm text-slate-500">Valid From</span>
                  <span className="text-sm text-slate-900 dark:text-white">
                    {entitlements?.license?.valid_from ? new Date(entitlements.license.valid_from).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-sm text-slate-500">Valid Until</span>
                  <span className="text-sm text-slate-900 dark:text-white font-bold">
                    {entitlements?.license?.valid_until ? new Date(entitlements.license.valid_until).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-sm text-slate-500">Offline Grace Period</span>
                  <span className="text-sm text-purple-600 font-semibold">{entitlements?.license?.offline_grace_period_days || 14} Days</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-sm text-slate-500">Endpoint Limit</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{entitlements?.endpoint_usage?.limit} Endpoints</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowActivateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                Upload New Signed License Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUTHORITATIVE ENTITLEMENTS */}
      {activeTab === 'entitlements' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Authoritative Feature Entitlement Matrix</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              All entitlements are strictly enforced by the backend Local Entitlement Engine. Security telemetry and agent enrollments are validated locally against these limits.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="pb-3">Security Feature / Module</th>
                    <th className="pb-3">Included</th>
                    <th className="pb-3 text-right">Plan Limit</th>
                    <th className="pb-3 text-right">Currently Used</th>
                    <th className="pb-3 text-right">Available</th>
                    <th className="pb-3 text-right">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {entitlements?.feature_entitlements?.map((f, i) => {
                    const pct = f.limit > 0 ? Math.round((f.used / f.limit) * 100) : 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3.5 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-500" />
                          {f.feature}
                        </td>
                        <td className="py-3.5">
                          {f.included ? (
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">Yes</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">No</span>
                          )}
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold">{f.limit}</td>
                        <td className="py-3.5 text-right font-mono text-blue-600">{f.used}</td>
                        <td className="py-3.5 text-right font-mono text-emerald-600">{f.available}</td>
                        <td className="py-3.5 text-right font-mono">
                          <span className={`font-semibold ${pct >= 100 ? 'text-rose-600' : pct >= 80 ? 'text-amber-600' : 'text-slate-600'}`}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEPLOYMENTS */}
      {activeTab === 'deployments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deployments.map(dep => (
              <div key={dep.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
                      <Server className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{dep.deployment_id}</h3>
                      <p className="text-xs text-slate-500">{dep.deployment_type} • {dep.environment}</p>
                    </div>
                  </div>
                  {getStatusBadge(dep.license_status)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-slate-100 dark:border-slate-800 py-3">
                  <div>
                    <span className="text-slate-400">Software Version</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{dep.version}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Active Agents</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{dep.active_agent_count} / {dep.agent_limit}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Control Plane Link</span>
                    <p className="font-semibold text-emerald-600">{dep.control_plane_connection}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Last Outbound Sync</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {dep.last_heartbeat_at ? new Date(dep.last_heartbeat_at).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Server CPU Usage</span>
                    <span className="font-semibold">{dep.cpu_usage_percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${dep.cpu_usage_percent}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Server RAM Usage</span>
                    <span className="font-semibold">{dep.memory_usage_percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${dep.memory_usage_percent}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AGENTS & QUOTA MANAGEMENT */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Endpoint Fleet</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Decommissioning an inactive or retired endpoint releases its quota slot immediately.
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={agentStatusFilter}
                  onChange={e => setAgentStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Agents</option>
                  <option value="active">Active (Enrolled)</option>
                  <option value="offline">Offline</option>
                  <option value="stale">Stale</option>
                  <option value="blocked">Blocked</option>
                  <option value="decommissioned">Decommissioned (Quota Released)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    <th className="pb-3">Hostname / ID</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">IP Address</th>
                    <th className="pb-3">Last Heartbeat</th>
                    <th className="pb-3 text-right">Quota Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAgents.map(ag => (
                    <tr key={ag.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        <div>{ag.hostname}</div>
                        <div className="text-xs text-slate-400 font-mono">{ag.agentId}</div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          ag.status.toLowerCase() === 'active' || ag.status.toLowerCase() === 'online'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ag.status.toLowerCase() === 'decommissioned'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ag.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {ag.publicIp || '10.0.4.12'}
                      </td>
                      <td className="py-3 text-xs text-slate-500">
                        {ag.lastSeen ? new Date(ag.lastSeen).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-3 text-right">
                        {ag.status.toLowerCase() !== 'decommissioned' ? (
                          <button
                            onClick={() => handleDecommissionAgent(ag.agentId)}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-800 transition-all"
                            title="Decommission and immediately release 1 quota slot"
                          >
                            Decommission (Free Slot)
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Slot Released</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredAgents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                        No agents match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SUPPORT & TICKETS */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Commercial & Technical Support</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Open a ticket for quota expansions, on-prem deployment issues, or security operational assistance.
                </p>
              </div>
              <button
                onClick={() => setShowTicketModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Open Ticket
              </button>
            </div>

            <div className="space-y-3">
              {supportTickets.map(t => (
                <div key={t.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-600">{t.ticket_id}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {t.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{t.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {t.status}
                    </span>
                    <p className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {supportTickets.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No support tickets on record.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ACTIVATE SIGNED LICENSE */}
      {showActivateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                Activate Cryptographic Signed License
              </h3>
              <button
                onClick={() => setShowActivateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Paste the cryptographic license token issued by your Monitorix partner or administrator. The token is cryptographically verified locally on this server using Ed25519 asymmetric cryptography.
            </p>

            <textarea
              value={licenseTokenInput}
              onChange={e => setLicenseTokenInput(e.target.value)}
              placeholder="eyJhbGciOiJFZDI1NTE5IiwidHlwIjoiTVRYLUxJQyJ9..."
              className="w-full h-36 p-3 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowActivateModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleActivateLicense}
                disabled={isActivating}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2"
              >
                {isActivating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Verify & Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SUPPORT TICKET */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Open Support Request
              </h3>
              <button
                onClick={() => setShowTicketModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subject</label>
                <input
                  type="text"
                  value={ticketTitle}
                  onChange={e => setTicketTitle(e.target.value)}
                  placeholder="e.g. Request Endpoint Quota Increase to 1,000"
                  className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={e => setTicketCategory(e.target.value)}
                    className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="LicenseEntitlement">License & Entitlement</option>
                    <option value="AgentEnrollment">Agent Enrollment</option>
                    <option value="Deployment">On-Premises Deployment</option>
                    <option value="SecurityOperations">Security Operations</option>
                    <option value="Billing">Billing & Renewal</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Severity</label>
                  <select
                    value={ticketSeverity}
                    onChange={e => setTicketSeverity(e.target.value)}
                    className="mt-1 w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  value={ticketDesc}
                  onChange={e => setTicketDesc(e.target.value)}
                  placeholder="Provide technical or commercial details regarding your request..."
                  className="mt-1 w-full h-28 p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowTicketModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
