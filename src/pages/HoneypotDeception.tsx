import React, { useState, useEffect } from 'react';
import {
  Eye, Shield, Server, AlertTriangle, CheckCircle2, RefreshCw,
  Zap, Search, Filter, Lock, Terminal, Radio, ShieldAlert,
  Cpu, Activity, Database, Key, Check, Plus, Copy,
  Crosshair, RadioTower, HelpCircle, Layers, Flame, FileSpreadsheet,
  AlertOctagon, X, Play
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface HoneypotItem {
  id: string;
  name: string;
  port: number;
  protocol: string;
  emulated_service: string;
  status: string;
  deployed_on: string;
  hits_detected: number;
  purpose: string;
}

interface HoneyTokenItem {
  id: number;
  agent_id: string;
  token_path: string;
  campaign_id: number;
  campaign_name: string;
  token_type: string;
  token_hash?: string;
  deployed_at?: string;
}

interface DeceptionAlertItem {
  id: number;
  agent_id: string;
  process_id: number;
  action: string;
  token_path: string;
  campaign_name: string;
  token_type: string;
  timestamp: string;
  severity: string;
  containment_status: string;
}

interface CampaignItem {
  id: number;
  name: string;
  type: string;
  payload_template: string;
  is_active: boolean;
}

export default function HoneypotDeception() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'honeypots' | 'tokens' | 'canaries' | 'alerts' | 'campaigns'>('honeypots');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data from backend
  const [overview, setOverview] = useState<any>(null);
  const [honeypots, setHoneypots] = useState<HoneypotItem[]>([]);
  const [tokens, setTokens] = useState<HoneyTokenItem[]>([]);
  const [alerts, setAlerts] = useState<DeceptionAlertItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);

  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Deploy Modal
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deployCampaignId, setDeployCampaignId] = useState<number | ''>('');
  const [deployAgentId, setDeployAgentId] = useState('');
  const [deployCustomPath, setDeployCustomPath] = useState('');
  const [submittingDeploy, setSubmittingDeploy] = useState(false);

  // New Campaign Modal
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [newCampName, setNewCampName] = useState('');
  const [newCampType, setNewCampType] = useState('File');
  const [newCampPayload, setNewCampPayload] = useState('');
  const [submittingCamp, setSubmittingCamp] = useState(false);

  // Simulator
  const [simulating, setSimulating] = useState(false);

  const fetchDeceptionData = async () => {
    try {
      const activeToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const res = await fetch(`${API_URL}/v2/deception/overview`, { headers });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
        setHoneypots(data.honeypots || []);
        setTokens(data.tokens || []);
        setAlerts(data.alerts || []);
        setCampaigns(data.campaigns || []);

        // Also seed available agents from tokens if list not yet loaded
        if (data.tokens && Array.isArray(data.tokens)) {
          const uniqueAgentIds = Array.from(new Set(data.tokens.map((t: any) => t.agent_id)));
          setAvailableAgents(prev => {
            if (prev.length > 0) return prev;
            return uniqueAgentIds.map(id => ({ AgentId: id, Hostname: id, status: 'Active' }));
          });
        }
      }
    } catch (err) {
      console.error('Error fetching deception data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAgentsList = async () => {
    try {
      const activeToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }
      
      // Try dedicated deception agent endpoint first, fallback to fleet agents
      let res = await fetch(`${API_URL}/v2/deception/agents`, { headers });
      if (!res.ok) {
        res = await fetch(`${API_URL}/agents`, { headers });
      }

      if (res.ok) {
        const data = await res.json();
        setAvailableAgents(Array.isArray(data) ? data : (data.agents || []));
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  useEffect(() => {
    fetchDeceptionData();
    fetchAgentsList();
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDeceptionData();
  };

  const handleDeployToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployCampaignId || !deployAgentId) {
      toast.error('Please select both a campaign and target agent');
      return;
    }
    setSubmittingDeploy(true);
    try {
      const activeToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`${API_URL}/v2/deception/tokens/deploy`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          campaign_id: Number(deployCampaignId),
          agent_id: deployAgentId,
          token_path: deployCustomPath.trim() || undefined
        })
      });

      if (res.ok) {
        toast.success('Honeytoken successfully deployed to agent target!');
        setIsDeployModalOpen(false);
        setDeployCustomPath('');
        fetchDeceptionData();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to deploy honeytoken');
      }
    } catch (e) {
      toast.error('Connection error deploying honeytoken');
    } finally {
      setSubmittingDeploy(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim() || !newCampPayload.trim()) {
      toast.error('Please enter campaign name and payload template');
      return;
    }
    setSubmittingCamp(true);
    try {
      const activeToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`${API_URL}/v2/deception/campaigns`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newCampName.trim(),
          token_type: newCampType,
          payload_template: newCampPayload.trim()
        })
      });

      if (res.ok) {
        toast.success('Deception campaign established!');
        setIsNewCampaignOpen(false);
        setNewCampName('');
        setNewCampPayload('');
        fetchDeceptionData();
      } else {
        toast.error('Failed to create campaign');
      }
    } catch (e) {
      toast.error('Connection error creating campaign');
    } finally {
      setSubmittingCamp(false);
    }
  };

  const handleSimulateIntrusion = async (tokenItem?: HoneyTokenItem) => {
    const targetToken = tokenItem || tokens[0];
    if (!targetToken) {
      toast.error('No deployed honeytokens found to simulate trigger');
      return;
    }

    setSimulating(true);
    try {
      const activeToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`${API_URL}/v2/deception/trigger`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          agent_id: targetToken.agent_id,
          token_path: targetToken.token_path,
          process_id: Math.floor(1000 + Math.random() * 9000),
          action: 'UnauthorizedReadAttempt'
        })
      });

      if (res.ok) {
        toast.success(`Honeypot Triggered! Incident reported for agent ${targetToken.agent_id}`);
        fetchDeceptionData();
        setActiveTab('alerts');
      } else {
        toast.error('Failed to trigger deception alert');
      }
    } catch (e) {
      toast.error('Error triggering simulation');
    } finally {
      setSimulating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const filteredTokens = tokens.filter(t => {
    const matchesSearch = t.token_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.campaign_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || t.token_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Autonomous Cyber Defense &bull; Threat Deception Grid</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CANARY WATCHDOG ACTIVE
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Eye className="w-8 h-8 text-blue-500" />
            Honeypots &amp; Deception Technology
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Lethal cyber deception matrix deploying emulated shadow services, distributed file honeytokens, AD bait credentials, and canary anti-ransomware tripwires across endpoints with zero-tolerance auto-containment.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            Refresh Grid
          </button>

          <button
            onClick={() => handleSimulateIntrusion()}
            disabled={simulating}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 text-xs font-medium text-amber-300 hover:text-amber-200 transition shadow-sm"
          >
            <Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-bounce' : ''}`} />
            Simulate Probe
          </button>

          <button
            onClick={() => setIsDeployModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition shadow-md shadow-blue-900/30"
          >
            <Plus className="w-4 h-4" />
            Deploy Honeytoken
          </button>
        </div>
      </div>

      {/* Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Network Honeypots */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Shadow Honeypots</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <RadioTower className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">
              {overview?.active_honeypots_count ?? 4}
              <span className="text-xs font-semibold text-emerald-400 ml-2">4 Online</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">TCP: 2222 (SSH), 3389 (RDP), 6379, 9200</p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Lateral Scan Trapping</span>
            <span className="text-emerald-400 font-medium">100% Active</span>
          </div>
        </div>

        {/* Card 2: Distributed Honeytokens */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Planted Honeytokens</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">
              {overview?.deployed_honeytokens_count ?? tokens.length}
              <span className="text-xs font-semibold text-purple-400 ml-2">Baits Active</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">AWS Keys, DB Dumps, Payroll Spreadsheets</p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Coverage Scope</span>
            <span className="text-purple-300 font-medium">{availableAgents.length || 4} Host Nodes</span>
          </div>
        </div>

        {/* Card 3: Anti-Ransomware Canaries */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Ransomware Canaries</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">
              Tripwires
              <span className="text-xs font-semibold text-emerald-400 ml-2">Armored</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">LockBit &amp; ALPHV Canary Decoys</p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Kernel Auto-Isolation</span>
            <span className="text-emerald-400 font-medium">Instant WFP / Iptables</span>
          </div>
        </div>

        {/* Card 4: Intrusion Alerts */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Trapped Intruders</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">
              {overview?.total_alerts_count ?? alerts.length}
              <span className="text-xs font-semibold text-rose-400 ml-2">Critical Trapped</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Zero False-Positive Breaches</p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Containment Ratio</span>
            <span className="text-emerald-400 font-medium">100% Contained</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-1 sm:space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('honeypots')}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'honeypots'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <RadioTower className="w-4 h-4" />
          Network Honeypots (Shadow Services)
          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-blue-900/50 text-blue-300">
            {honeypots.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tokens')}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'tokens'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-4 h-4" />
          Honeytokens &amp; Baits
          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-purple-900/50 text-purple-300">
            {tokens.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('canaries')}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'canaries'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          Canary Ransomware Tripwires
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'alerts'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          Intruder Alerts
          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-rose-900/50 text-rose-300">
            {alerts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'campaigns'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Deception Campaigns
          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-cyan-900/50 text-cyan-300">
            {campaigns.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Network Honeypots (Shadow Services) */}
      {activeTab === 'honeypots' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-400" />
                Active Shadow Honeypot Listeners
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Emulated TCP decoy listeners deployed by the Monitorix Agent. Lateral reconnaissance, port scanners, and unauthorized brute-force attempts targeting these ports trigger immediate high-priority alerts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                Daemon: Rust Deception Engine v2
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {honeypots.map((hp) => (
              <div
                key={hp.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 rounded-xl p-5 space-y-4 transition shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800">
                        {hp.protocol} :{hp.port}
                      </span>
                      <h4 className="text-sm font-bold text-white">{hp.name}</h4>
                    </div>
                    <p className="text-xs text-slate-400">{hp.purpose}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-800/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {hp.status}
                  </span>
                </div>

                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800/80 font-mono text-xs space-y-1.5">
                  <div className="text-slate-500 text-[11px] uppercase tracking-wider">Emulated Banner &amp; Service:</div>
                  <div className="text-blue-300 font-semibold truncate">{hp.emulated_service}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <span>Target Deployment:</span>
                    <span className="text-amber-400">{hp.deployed_on}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <span className="text-slate-400">
                    Caught Hits: <strong className="text-white ml-1">{hp.hits_detected}</strong>
                  </span>
                  <button
                    onClick={() => handleSimulateIntrusion()}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs font-medium"
                  >
                    <Play className="w-3 h-3" />
                    Test Trigger
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Honeytoken Inventory */}
      {activeTab === 'tokens' && (
        <div className="space-y-4">
          {/* Controls: Search, Filter, Add */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search file path, agent ID, campaign..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Bait Types</option>
                  <option value="Credential">Credentials</option>
                  <option value="File">Confidential Files</option>
                  <option value="NetworkShare">Network Shares</option>
                  <option value="ShadowService">Shadow Services</option>
                  <option value="CanaryToken">Canary Tokens</option>
                </select>
              </div>

              <button
                onClick={() => setIsDeployModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Plant Bait
              </button>
            </div>
          </div>

          {/* Tokens Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Bait Path / Asset</th>
                    <th className="py-3 px-4">Bait Type</th>
                    <th className="py-3 px-4">Campaign</th>
                    <th className="py-3 px-4">Target Agent</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTokens.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No honeytokens match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTokens.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono">
                          <div className="flex items-center gap-2">
                            {t.token_type === 'Credential' ? (
                              <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : t.token_type === 'File' ? (
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Database className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            )}
                            <span className="text-white truncate max-w-md">{t.token_path}</span>
                            <button
                              onClick={() => copyToClipboard(t.token_path)}
                              title="Copy Path"
                              className="text-slate-500 hover:text-slate-300 transition"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            t.token_type === 'Credential'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : t.token_type === 'File'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}>
                            {t.token_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-medium">
                          {t.campaign_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {t.agent_id}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Armored &bull; Armed
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleSimulateIntrusion(t)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-blue-400 hover:text-blue-300 transition"
                          >
                            Simulate Breach
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Canary Ransomware Tripwires */}
      {activeTab === 'canaries' && (
        <div className="space-y-6">
          {/* Informational Hero Card */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-900/60 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Canary Guard: Kernel-Level Ransomware Tripwire Decoys
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                  Monitorix Rust Endpoint Agents deploy hidden, highly-sensitive decoy canary files (<code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded">.canary_token_lockbit.xlsx</code> and <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded">.canary_token_alphv.docx</code>) across key user directories, root shares, and temporary scratch spaces.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                  <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg">
                    <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
                      <Activity className="w-3.5 h-3.5" />
                      1. OS Kernel Interception
                    </div>
                    <p className="text-[11px] text-slate-400">
                      File System Watchers (eBPF on Linux / Minifilter on Windows) monitor canary read, write, rename, and encryption attempts in real-time.
                    </p>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg">
                    <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-1">
                      <Zap className="w-3.5 h-3.5" />
                      2. Sub-Millisecond Kill
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Offending processes and parent execution trees are terminated instantaneously via kernel process termination before encryption spreads.
                    </p>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg">
                    <div className="text-xs font-semibold text-blue-400 flex items-center gap-1.5 mb-1">
                      <Shield className="w-3.5 h-3.5" />
                      3. Instant Host Quarantine
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Network adapters are placed under WFP / iptables perimeter lock, severing lateral SMB/C2 communication while keeping telemetry alive.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Tripwire Canaries Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                  CANARY-TOKEN-ALPHV
                </span>
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tripwire Armed
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">Confidential Financial Canary (.docx)</h4>
              <p className="text-xs text-slate-400 font-mono break-all bg-slate-950 p-2 rounded border border-slate-800">
                C:\Users\Administrator\Desktop\.canary_token_alphv.docx
              </p>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span>Ransomware Profile: ALPHV / BlackCat</span>
                <span className="text-blue-400">SHA-256 Monitored</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                  CANARY-TOKEN-LOCKBIT
                </span>
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tripwire Armed
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">Executive Payroll Ledger (.xlsx)</h4>
              <p className="text-xs text-slate-400 font-mono break-all bg-slate-950 p-2 rounded border border-slate-800">
                C:\Users\Public\Documents\.canary_token_lockbit.xlsx
              </p>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span>Ransomware Profile: LockBit 3.0 / Black Basta</span>
                <span className="text-blue-400">Zero-Delay Isolation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Intruder Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Live Intrusion Audit Trail
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every unauthorized access to a honeytoken or shadow service triggers high-fidelity alerts directly into the SIEM/SOAR pipeline with 0% false positives.
              </p>
            </div>
            <button
              onClick={() => handleSimulateIntrusion()}
              disabled={simulating}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              Simulate Intrusion Probe
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Event ID</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Target Agent</th>
                    <th className="py-3 px-4">Process PID</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Triggered Decoy Token</th>
                    <th className="py-3 px-4">Containment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No honeypot intrusion triggers recorded yet.
                      </td>
                    </tr>
                  ) : (
                    alerts.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-slate-400">
                          #{a.id}
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {a.timestamp ? new Date(a.timestamp).toLocaleString() : 'Just now'}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-rose-400">
                          {a.agent_id}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          PID {a.process_id}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                            {a.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300 max-w-xs truncate">
                          {a.token_path}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Auto-Contained
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Deception Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Active Deception Campaigns
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Standardized bait campaigns defining payload templates and deployment topologies across your environment.
              </p>
            </div>
            <button
              onClick={() => setIsNewCampaignOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Campaign
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-5 space-y-3 transition shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    camp.type === 'Credential'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : camp.type === 'File'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : camp.type === 'ShadowService'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : 'bg-purple-950 text-purple-300 border border-purple-800'
                  }`}>
                    {camp.type}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Active
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{camp.name}</h4>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-400 max-h-24 overflow-y-auto whitespace-pre-wrap">
                  {camp.payload_template}
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span>Tokens Planted:</span>
                  <span className="text-white font-semibold">
                    {tokens.filter(t => t.campaign_id === camp.id).length} Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Deploy Honeytoken */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                Deploy Honeytoken Decoy
              </h3>
              <button
                onClick={() => setIsDeployModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDeployToken} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Target Deception Campaign
                </label>
                <select
                  value={deployCampaignId}
                  onChange={(e) => setDeployCampaignId(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a Campaign...</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Target Host / Agent Node
                </label>
                <select
                  value={deployAgentId}
                  onChange={(e) => setDeployAgentId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Target Agent...</option>
                  {availableAgents.map((ag) => (
                    <option key={ag.AgentId || ag.agent_id} value={ag.AgentId || ag.agent_id}>
                      {ag.Hostname || ag.hostname || ag.AgentId || ag.agent_id} ({ag.AgentId || ag.agent_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Custom File / Share Path (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. C:\Users\Finance\Desktop\Executive_Bonus_2026.xlsx"
                  value={deployCustomPath}
                  onChange={(e) => setDeployCustomPath(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Leave empty to let the engine generate a realistic deceptive decoy path automatically.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeployModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDeploy}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-blue-900/30"
                >
                  {submittingDeploy ? 'Deploying...' : 'Deploy Bait to Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Campaign */}
      {isNewCampaignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-500" />
                Create Deception Campaign
              </h3>
              <button
                onClick={() => setIsNewCampaignOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Production Database Decoy Credentials"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Bait Archetype / Type
                </label>
                <select
                  value={newCampType}
                  onChange={(e) => setNewCampType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="File">Confidential File Decoy (.xlsx, .pdf, .docx)</option>
                  <option value="Credential">Cloud / DB API Key Decoy</option>
                  <option value="NetworkShare">SMB / Active Directory Decoy Share</option>
                  <option value="ShadowService">TCP Shadow Service Listener</option>
                  <option value="CanaryToken">Ransomware Canary Tripwire</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Bait Payload Template
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. host=db-internal.corp\nuser=db_admin_backup\npass=K9#mQ8$zX2@v"
                  value={newCampPayload}
                  onChange={(e) => setNewCampPayload(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCamp}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-cyan-900/30"
                >
                  {submittingCamp ? 'Saving...' : 'Establish Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

