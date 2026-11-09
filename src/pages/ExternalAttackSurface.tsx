import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, Shield, Server, AlertTriangle, CheckCircle2, RefreshCw,
  Zap, Search, Filter, ArrowRight, Lock, Eye, Network, Terminal,
  Radio, ShieldAlert, Cpu, Activity, Ban, RotateCcw, Share2, Layers,
  Compass, AlertOctagon, HelpCircle, HardDrive, Key, Database,
  Check, ExternalLink, Play, RadioTower, Wifi, FileText, Plus, Trash2, Target, X
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ExternalAttackSurface() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'exposures' | 'inventory' | 'ports' | 'certificates' | 'simulator'>('exposures');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  // Add Domain Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAssetValue, setNewAssetValue] = useState('');
  const [newAssetType, setNewAssetType] = useState('DOMAIN');
  const [newAssetScope, setNewAssetScope] = useState<'FULL_DOMAIN' | 'PARTICULAR_SUBDOMAIN'>('FULL_DOMAIN');
  const [newAssetProvider, setNewAssetProvider] = useState('CLOUDFLARE');
  const [newAssetIp, setNewAssetIp] = useState('');
  const [newAssetShadow, setNewAssetShadow] = useState(false);
  const [addingAsset, setAddingAsset] = useState(false);

  // Core Data
  const [overview, setOverview] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [ports, setPorts] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);

  // Filters
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('ALL');
  const [shadowOnly, setShadowOnly] = useState<boolean>(false);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [assetSearch, setAssetSearch] = useState<string>('');

  // Remediation
  const [remediatingId, setRemediatingId] = useState<string | null>(null);

  // Target Domain & Simulator Form
  const [targetRootDomain, setTargetRootDomain] = useState('elsea.co.in');
  const [simDomain, setSimDomain] = useState('unclaimed-blog.elsea.co.in');
  const [simCname, setSimCname] = useState('legacy-blog.s3-website-us-east-1.amazonaws.com');
  const [simPort, setSimPort] = useState<number | ''>(3389);
  const [simService, setSimService] = useState('RDP');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/easm/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOverview(await res.json());
    } catch (e) {
      console.error('Failed to load EASM overview', e);
    }
  };

  const fetchAssets = async () => {
    try {
      let url = `${API_URL}/v2/easm/assets`;
      const params = [];
      if (assetTypeFilter !== 'ALL') params.push(`asset_type=${assetTypeFilter}`);
      if (shadowOnly) params.push('is_shadow=true');
      if (params.length) url += `?${params.join('&')}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAssets(await res.json());
    } catch (e) {
      console.error('Failed to load assets', e);
    }
  };

  const fetchPorts = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/easm/ports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPorts(await res.json());
    } catch (e) {
      console.error('Failed to load ports', e);
    }
  };

  const fetchCertificates = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/easm/certificates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setCertificates(await res.json());
    } catch (e) {
      console.error('Failed to load certificates', e);
    }
  };

  const fetchFindings = async () => {
    try {
      let url = `${API_URL}/v2/easm/findings`;
      if (severityFilter !== 'ALL') url += `?severity=${severityFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setFindings(await res.json());
    } catch (e) {
      console.error('Failed to load findings', e);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOverview(),
      fetchAssets(),
      fetchPorts(),
      fetchCertificates(),
      fetchFindings()
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchOverview(),
        fetchAssets(),
        fetchPorts(),
        fetchCertificates(),
        fetchFindings()
      ]);
      setLoading(false);
    };
    init();
  }, [assetTypeFilter, shadowOnly, severityFilter]);

  const handleTriggerDiscovery = async () => {
    setDiscovering(true);
    try {
      const res = await fetch(`${API_URL}/v2/easm/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ root_domain: targetRootDomain })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Perimeter Discovery Complete! Discovered new edge asset: ${data.new_asset_discovered}`);
        refreshAll();
      } else {
        toast.error('Discovery scan failed');
      }
    } catch (e: any) {
      toast.error('Discovery error: ' + e.message);
    } finally {
      setDiscovering(false);
    }
  };

  const handleRemediate = async (findingId: string) => {
    setRemediatingId(findingId);
    try {
      const res = await fetch(`${API_URL}/v2/easm/remediate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ finding_id: findingId })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.remediation_summary || 'Finding remediated successfully!');
        refreshAll();
      } else {
        toast.error(data.detail || 'Remediation failed');
      }
    } catch (e: any) {
      toast.error('Remediation error: ' + e.message);
    } finally {
      setRemediatingId(null);
    }
  };

  const handleDomainInputChange = (val: string) => {
    setNewAssetValue(val);
    const clean = val.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
    const parts = clean.split('.');
    const isCctld = parts.length >= 3 && ['co', 'com', 'gov', 'ac', 'org', 'edu', 'net'].includes(parts[parts.length - 2]);
    const isRoot = isCctld ? parts.length === 3 : parts.length <= 2;
    
    if (clean) {
      if (isRoot) {
        setNewAssetScope('FULL_DOMAIN');
        setNewAssetType('DOMAIN');
      } else {
        setNewAssetScope('PARTICULAR_SUBDOMAIN');
        setNewAssetType('SUBDOMAIN');
      }
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetValue.trim()) {
      toast.error('Please enter a domain or asset name');
      return;
    }
    setAddingAsset(true);
    try {
      const res = await fetch(`${API_URL}/v2/easm/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          value: newAssetValue.trim(),
          asset_type: newAssetType,
          protection_scope: newAssetScope,
          hosting_provider: newAssetProvider,
          ip_address: newAssetIp.trim() || undefined,
          is_shadow_asset: newAssetShadow
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Domain ${newAssetValue} added to monitoring!`);
        setIsAddModalOpen(false);
        setNewAssetValue('');
        setNewAssetIp('');
        refreshAll();
      } else {
        toast.error(data.detail || 'Failed to add asset');
      }
    } catch (err: any) {
      toast.error('Error adding domain: ' + err.message);
    } finally {
      setAddingAsset(false);
    }
  };

  const handleDeleteAsset = async (assetId: string, assetValue: string) => {
    if (!window.confirm(`Are you sure you want to stop monitoring ${assetValue}?`)) return;
    try {
      const res = await fetch(`${API_URL}/v2/easm/assets/${assetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`Asset ${assetValue} removed from monitoring`);
        refreshAll();
      } else {
        toast.error('Failed to remove asset');
      }
    } catch (err: any) {
      toast.error('Error removing asset: ' + err.message);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimResult(null);
    try {
      const payload: any = {
        domain: simDomain,
        cname: simCname || undefined,
        port: simPort !== '' ? Number(simPort) : undefined,
        service: simService
      };
      const res = await fetch(`${API_URL}/v2/easm/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setSimResult(data);
      if (data.threat_detected) {
        toast.error(`Perimeter Risk Detected: ${data.title}`);
      } else {
        toast.success('Telemetry evaluated normal. No perimeter exposure matched.');
      }
      fetchFindings();
      fetchOverview();
    } catch (e: any) {
      toast.error('Evaluation failed: ' + e.message);
    } finally {
      setSimulating(false);
    }
  };

  const filteredAssets = assets.filter(a => {
    if (!assetSearch) return true;
    const s = assetSearch.toLowerCase();
    return (
      a.value?.toLowerCase().includes(s) ||
      a.asset_id?.toLowerCase().includes(s) ||
      a.hosting_provider?.toLowerCase().includes(s) ||
      a.ip_address?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">External Attack Surface Management (EASM)</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Perimeter
                </span>
                <div className="flex items-center gap-1.5 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Target Root Domain:</span>
                  <input
                    type="text"
                    value={targetRootDomain}
                    onChange={e => {
                      const newDom = e.target.value;
                      setTargetRootDomain(newDom);
                      setSimDomain(`unclaimed-blog.${newDom}`);
                    }}
                    placeholder="e.g. elsea.co.in"
                    className="bg-transparent border-0 text-xs font-mono text-white focus:outline-none focus:ring-0 w-36"
                  />
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Automated perimeter asset discovery, subdomain takeover defense, exposed service detection, and SSL/TLS hygiene.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-lg shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Add Monitored Domain
          </button>
          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium border border-gray-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleTriggerDiscovery}
            disabled={discovering}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium shadow-lg shadow-orange-600/20 transition"
          >
            <RadioTower className={`w-4 h-4 ${discovering ? 'animate-spin' : ''}`} />
            Scan External Perimeter
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Perimeter Health Score */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Perimeter Health</span>
            <Shield className="w-5 h-5 text-orange-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.perimeter_health_score !== undefined ? `${overview.perimeter_health_score}` : '--'}
            </span>
            <span className="text-xs font-medium text-gray-400">/ 100</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (overview?.perimeter_health_score || 0) > 75
                  ? 'bg-emerald-500'
                  : (overview?.perimeter_health_score || 0) > 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${overview?.perimeter_health_score || 50}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Attack Surface Exposure Rating</p>
        </div>

        {/* Total Assets & Shadow IT */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Perimeter Assets</span>
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.total_assets_count || 0}
            </span>
            <span className="text-xs font-medium text-rose-400">
              ({overview?.shadow_assets_count || 0} Shadow Assets)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <span>{overview?.asset_types?.SUBDOMAIN || 0} Subdomains</span>
            <span>•</span>
            <span>{overview?.asset_types?.IP_ADDRESS || 0} Public IPs</span>
          </div>
        </div>

        {/* Exposed Dangerous Ports */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Exposed Ports</span>
            <Server className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">
              {overview?.exposed_dangerous_ports_count || 0}
            </span>
            <span className="text-xs font-medium text-gray-400">Dangerous Ingress</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
              3389 RDP
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              9200 ES
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              22 SSH
            </span>
          </div>
        </div>

        {/* SSL / TLS Hygiene */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Certificates & TLS</span>
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {overview?.total_certificates_monitored || 0}
            </span>
            <span className="text-xs font-medium text-rose-400">
              ({overview?.expired_certificates_count || 0} Expired)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-amber-400 font-medium">
            <span>{overview?.expiring_soon_count || 0} Expiring Soon (&lt;30d)</span>
            <span>•</span>
            <span>SSL Labs A+ to F</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('exposures')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'exposures'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Perimeter Exposures & Vulnerabilities ({findings.filter(f => f.status === 'OPEN').length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'inventory'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          Perimeter Asset Inventory ({assets.length})
        </button>
        <button
          onClick={() => setActiveTab('ports')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'ports'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Server className="w-4 h-4" />
          Open Ports & Services ({ports.length})
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'certificates'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          SSL/TLS Certificates & Grades ({certificates.length})
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'simulator'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Exposure Evaluator
        </button>
      </div>

      {/* TAB 1: PERIMETER EXPOSURES & FINDINGS */}
      {activeTab === 'exposures' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">Severity Filter:</span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(s => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={`px-2.5 py-0.5 rounded text-xs font-medium border transition ${
                    severityFilter === s
                      ? 'bg-orange-600/20 border-orange-500 text-orange-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400">
              Showing {findings.length} exposure findings
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {findings.map(f => (
              <div
                key={f.finding_id}
                className={`p-5 rounded-xl bg-gray-900/90 border transition ${
                  f.status === 'REMEDIATED'
                    ? 'border-gray-800 opacity-60'
                    : f.severity === 'CRITICAL'
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : 'border-amber-500/30 bg-amber-950/10'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2 rounded-lg border mt-0.5 ${
                      f.status === 'REMEDIATED'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : f.severity === 'CRITICAL'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}>
                      {f.status === 'REMEDIATED' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-gray-300">{f.finding_id}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          f.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {f.severity}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-500/10 text-orange-300 border border-orange-500/20">
                          {f.finding_type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          f.status === 'REMEDIATED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {f.status}
                        </span>
                      </div>

                      <h3 className="mt-1 text-sm font-bold text-white">{f.title}</h3>
                      <p className="mt-1 text-xs text-gray-300">{f.description}</p>

                      <div className="mt-2.5 flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span>
                          <strong className="text-gray-300">Target Asset:</strong> {f.asset_id}
                        </span>
                        <span>•</span>
                        <span className="text-orange-400">
                          <strong>Remediation:</strong> {f.remediation_step}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {f.status !== 'REMEDIATED' && (
                      <button
                        onClick={() => handleRemediate(f.finding_id)}
                        disabled={remediatingId === f.finding_id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md shadow-emerald-600/20 transition"
                      >
                        {remediatingId === f.finding_id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Remediate Exposure
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: EXTERNAL ASSET INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-400 uppercase">Type:</span>
              {['ALL', 'DOMAIN', 'SUBDOMAIN', 'IP_ADDRESS'].map(t => (
                <button
                  key={t}
                  onClick={() => setAssetTypeFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                    assetTypeFilter === t
                      ? 'bg-orange-600/20 border-orange-500 text-orange-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {t}
                </button>
              ))}
              <label className="flex items-center gap-2 text-xs text-gray-300 ml-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shadowOnly}
                  onChange={e => setShadowOnly(e.target.checked)}
                  className="rounded bg-gray-800 border-gray-700"
                />
                <span>Shadow Assets Only</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[280px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search domain, subdomain, IP..."
                  value={assetSearch}
                  onChange={e => setAssetSearch(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Monitored Domain
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/60">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-950/80 text-xs uppercase text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Perimeter Asset</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Hosting Provider</th>
                  <th className="px-4 py-3 font-semibold">IP Address</th>
                  <th className="px-4 py-3 font-semibold">Risk Score</th>
                  <th className="px-4 py-3 font-semibold">Asset Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredAssets.map(a => (
                  <tr key={a.asset_id} className="hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white flex items-center gap-2">
                        {a.value}
                        {a.is_shadow_asset && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            SHADOW ASSET
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-gray-500">{a.asset_id}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.asset_type === 'DOMAIN' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                        }`}>
                          {a.asset_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {a.hosting_provider}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {a.ip_address || '--'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold ${
                          a.risk_score >= 70 ? 'text-rose-400' : a.risk_score >= 40 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {a.risk_score}
                        </span>
                        <div className="w-16 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              a.risk_score >= 70 ? 'bg-rose-500' : a.risk_score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${a.risk_score}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate('/attack-validation', { state: { targetAsset: a.value } })}
                          title={`Launch Automated Pentest against ${a.value}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-medium transition"
                        >
                          <Target className="w-3 h-3 text-rose-400" />
                          <span>Pentest</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(a.asset_id, a.value)}
                          title={`Remove ${a.value} from monitoring`}
                          className="p-1.5 rounded bg-gray-800 hover:bg-rose-900/40 text-gray-400 hover:text-rose-400 border border-gray-700 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OPEN PORTS & SERVICES */}
      {activeTab === 'ports' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/60">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-950/80 text-xs uppercase text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Port & Protocol</th>
                  <th className="px-4 py-3 font-semibold">Service Name</th>
                  <th className="px-4 py-3 font-semibold">IP Address</th>
                  <th className="px-4 py-3 font-semibold">Service Banner Intelligence</th>
                  <th className="px-4 py-3 font-semibold">TLS Version</th>
                  <th className="px-4 py-3 font-semibold">Exposure Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {ports.map(p => (
                  <tr key={p.port_id} className="hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-bold text-white">
                        {p.port_number} / {p.protocol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-200">
                      {p.service_name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {p.ip_address}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-300 max-w-xs truncate">
                      {p.banner_text || '--'}
                    </td>
                    <td className="px-4 py-3 text-xs text-cyan-400 font-mono">
                      {p.tls_version || 'None'}
                    </td>
                    <td className="px-4 py-3">
                      {p.is_vulnerable_or_exposed ? (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          DANGEROUS EXPOSURE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
                          Standard Service
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

      {/* TAB 4: SSL/TLS CERTIFICATES & GRADES */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map(c => (
              <div key={c.cert_id} className="p-5 rounded-xl bg-gray-900 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-bold text-white">{c.domain_name}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-extrabold ${
                    c.tls_grade === 'A+' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    c.tls_grade === 'B' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    Grade {c.tls_grade}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-300">
                  <div><strong>Issuer:</strong> {c.issuer}</div>
                  <div><strong>Key Length:</strong> {c.key_length} bits RSA</div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                    <span className="text-gray-400">Days Until Expiry:</span>
                    <span className={`font-mono font-bold ${
                      c.is_expired ? 'text-rose-400' : c.days_until_expiration <= 30 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {c.is_expired ? 'EXPIRED' : `${c.days_until_expiration} Days`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SIMULATOR & TELEMETRY */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-bold text-white">Perimeter Exposure Evaluator</h2>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Simulate external reconnaissance findings (dangling CNAMEs, open RDP/Elasticsearch ports) against Monitorix EASM heuristics.
            </p>

            <form onSubmit={handleSimulate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Target Subdomain / Host</label>
                <input
                  type="text"
                  value={simDomain}
                  onChange={e => setSimDomain(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">CNAME Target (Takeover Test)</label>
                <input
                  type="text"
                  value={simCname}
                  onChange={e => setSimCname(e.target.value)}
                  placeholder="e.g. bucket.s3-website-us-east-1.amazonaws.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Port Number</label>
                  <input
                    type="number"
                    value={simPort}
                    onChange={e => setSimPort(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="3389, 9200, 22..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Service Name</label>
                  <input
                    type="text"
                    value={simService}
                    onChange={e => setSimService(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={simulating}
                className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Evaluate Perimeter Exposure
              </button>
            </form>
          </div>

          <div className="p-6 rounded-xl bg-gray-950 border border-gray-800 font-mono flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <span className="text-xs text-gray-400 uppercase font-semibold">Heuristic Output</span>
                {simResult?.threat_detected ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    EXPOSURE DETECTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-800 text-gray-400">
                    NORMAL
                  </span>
                )}
              </div>

              <div className="mt-4 text-xs text-gray-300 space-y-2 overflow-auto max-h-[380px]">
                {simResult ? (
                  <pre className="text-orange-400 text-xs bg-gray-900/90 p-4 rounded-lg border border-gray-800 overflow-x-auto">
                    {JSON.stringify(simResult, null, 2)}
                  </pre>
                ) : (
                  <div className="text-gray-600 italic py-16 text-center">
                    Enter perimeter values on the left to evaluate potential exposure risks.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD MONITORED DOMAIN / ASSET */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Enroll Domain for Perimeter Monitoring</h3>
                  <p className="text-xs text-gray-400">Continuous attack surface protection, DNS audit, and SSL hygiene</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Domain / FQDN / Hostname <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. elsea.co.in or monitorix.elsea.co.in"
                  value={newAssetValue}
                  onChange={e => handleDomainInputChange(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Protection Scope Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1.5">
                  Protection Scope & Subdomain Strategy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Full Domain */}
                  <div
                    onClick={() => {
                      setNewAssetScope('FULL_DOMAIN');
                      setNewAssetType('DOMAIN');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      newAssetScope === 'FULL_DOMAIN'
                        ? 'border-emerald-500 bg-emerald-950/20 text-white'
                        : 'border-gray-800 bg-gray-950/60 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-400">
                        <Globe className="w-3.5 h-3.5" />
                        Full Domain & Subdomains
                      </span>
                      <input
                        type="radio"
                        name="scope"
                        checked={newAssetScope === 'FULL_DOMAIN'}
                        onChange={() => {}}
                        className="text-emerald-500 focus:ring-0"
                      />
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      Auto-protects root domain, automatically enrolls default subdomains (<code className="text-emerald-300">mail</code>, <code className="text-emerald-300">smtp</code>, <code className="text-emerald-300">api</code>, <code className="text-emerald-300">vpn</code>), and scans entire subdomains.
                    </p>
                    <div className="mt-2 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Audits Email Security (SPF, DMARC, MX)
                    </div>
                  </div>

                  {/* Option 2: Particular Subdomain */}
                  <div
                    onClick={() => {
                      setNewAssetScope('PARTICULAR_SUBDOMAIN');
                      setNewAssetType('SUBDOMAIN');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      newAssetScope === 'PARTICULAR_SUBDOMAIN'
                        ? 'border-cyan-500 bg-cyan-950/20 text-white'
                        : 'border-gray-800 bg-gray-950/60 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-cyan-400">
                        <Target className="w-3.5 h-3.5" />
                        Particular Subdomain Only
                      </span>
                      <input
                        type="radio"
                        name="scope"
                        checked={newAssetScope === 'PARTICULAR_SUBDOMAIN'}
                        onChange={() => {}}
                        className="text-cyan-500 focus:ring-0"
                      />
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      Strictly scopes monitoring and defense to <strong>this single subdomain only</strong>. Will not scan or enroll other subdomains.
                    </p>
                    <div className="mt-2 text-[10px] text-cyan-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Isolated Target Defense
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                    Asset Type
                  </label>
                  <select
                    value={newAssetType}
                    onChange={e => setNewAssetType(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="DOMAIN">Root Domain</option>
                    <option value="SUBDOMAIN">Subdomain</option>
                    <option value="IP_ADDRESS">Public IP / Gateway</option>
                    <option value="CLOUD_EDGE">Cloud Edge / CDN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                    Hosting Provider
                  </label>
                  <select
                    value={newAssetProvider}
                    onChange={e => setNewAssetProvider(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CLOUDFLARE">Cloudflare</option>
                    <option value="AWS">Amazon Web Services (AWS)</option>
                    <option value="GCP">Google Cloud Platform (GCP)</option>
                    <option value="AZURE">Microsoft Azure</option>
                    <option value="DIGITALOCEAN">DigitalOcean</option>
                    <option value="SELF_HOSTED">Self-Hosted / On-Premise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Public IP Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 104.21.48.11"
                  value={newAssetIp}
                  onChange={e => setNewAssetIp(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-gray-950 border border-gray-800 space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAssetShadow}
                    onChange={e => setNewAssetShadow(e.target.checked)}
                    className="rounded bg-gray-800 border-gray-700 text-emerald-500 focus:ring-0"
                  />
                  <span>Mark as Shadow / Unmanaged Asset (Flags untracked legacy infrastructure)</span>
                </label>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Enables continuous port discovery, certificate expiry alerts, & takeover guards</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingAsset || !newAssetValue.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition"
                >
                  {addingAsset ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Shield className="w-3.5 h-3.5" />
                  )}
                  Start Monitoring
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
