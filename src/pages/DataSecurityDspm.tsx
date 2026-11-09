import React, { useState, useEffect } from 'react';
import {
  Shield, Database, AlertTriangle, CheckCircle2, RefreshCw,
  Zap, Search, Filter, ArrowRight, Lock, Eye, Network, Terminal,
  Radio, ShieldAlert, Cpu, Activity, Ban, RotateCcw, Share2, Layers,
  Compass, AlertOctagon, HelpCircle, HardDrive, Key, Globe,
  Check, ExternalLink, Play, RadioTower, Wifi, FileText, Code, Slash,
  Server, FileSpreadsheet, FolderGit2, AlertCircle, Sparkles, Unlock
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function DataSecurityDspm() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'stores' | 'findings' | 'assets' | 'compliance' | 'classifier'>('stores');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [overview, setOverview] = useState<any>(null);
  const [dataStores, setDataStores] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);

  // Filters
  const [cloudFilter, setCloudFilter] = useState<string>('ALL');
  const [shadowOnlyFilter, setShadowOnlyFilter] = useState<boolean>(false);
  const [findingSeverityFilter, setFindingSeverityFilter] = useState<string>('ALL');
  const [storeSearch, setStoreSearch] = useState<string>('');

  // Classifier Sandbox
  const [classifierInput, setClassifierInput] = useState(
    "Customer Account: John Doe, SSN: 123-45-6789, Primary Card: 4532015012348912 (Visa). Emergency token: AKIAIOSFODNN7EXAMPLE."
  );
  const [classifying, setClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState<any>(null);

  // Remediation / Scan state
  const [remediatingId, setRemediatingId] = useState<string | null>(null);
  const [scanningStoreId, setScanningStoreId] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/dspm/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOverview(await res.json());
    } catch (e) {
      console.error('Failed to load DSPM overview', e);
    }
  };

  const fetchDataStores = async () => {
    try {
      let url = `${API_URL}/v2/dspm/datastores`;
      const params = new URLSearchParams();
      if (cloudFilter !== 'ALL') params.append('cloud_provider', cloudFilter);
      if (shadowOnlyFilter) params.append('is_shadow_only', 'true');
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setDataStores(await res.json());
    } catch (e) {
      console.error('Failed to load data stores', e);
    }
  };

  const fetchFindings = async () => {
    try {
      let url = `${API_URL}/v2/dspm/findings`;
      if (findingSeverityFilter !== 'ALL') url += `?severity=${findingSeverityFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setFindings(await res.json());
    } catch (e) {
      console.error('Failed to load findings', e);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/dspm/assets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAssets(await res.json());
    } catch (e) {
      console.error('Failed to load assets', e);
    }
  };

  const fetchCompliance = async () => {
    try {
      const res = await fetch(`${API_URL}/v2/dspm/compliance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setCompliance(await res.json());
    } catch (e) {
      console.error('Failed to load compliance', e);
    }
  };

  const reloadAll = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOverview(),
      fetchDataStores(),
      fetchFindings(),
      fetchAssets(),
      fetchCompliance()
    ]);
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    reloadAll();
  }, [cloudFilter, shadowOnlyFilter, findingSeverityFilter]);

  const handleClassify = async () => {
    if (!classifierInput.trim()) {
      toast.error('Please input text sample for classification');
      return;
    }
    setClassifying(true);
    try {
      const res = await fetch(`${API_URL}/v2/dspm/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text_sample: classifierInput })
      });
      if (res.ok) {
        const data = await res.json();
        setClassificationResult(data);
        if (data.has_sensitive_data) {
          toast.success(`Classified ${data.detections_count} sensitive data tokens!`);
        } else {
          toast('No sensitive patterns identified.', { icon: 'ℹ️' });
        }
      } else {
        toast.error('Classification request failed');
      }
    } catch (e) {
      toast.error('Error contacting classifier service');
    } finally {
      setClassifying(false);
    }
  };

  const handleRemediate = async (findingId: string, defaultAction: string) => {
    setRemediatingId(findingId);
    try {
      const res = await fetch(`${API_URL}/v2/dspm/remediate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ finding_id: findingId, action_taken: defaultAction })
      });
      if (res.ok) {
        toast.success(`Finding ${findingId} remediated successfully!`);
        reloadAll();
      } else {
        toast.error('Failed to apply remediation');
      }
    } catch (e) {
      toast.error('Remediation error');
    } finally {
      setRemediatingId(null);
    }
  };

  const handleTriggerScan = async (storeId: string) => {
    setScanningStoreId(storeId);
    try {
      const res = await fetch(`${API_URL}/v2/dspm/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ store_id: storeId })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Discovery scan completed on ${data.store_name}!`);
        reloadAll();
      } else {
        toast.error('Scan failed');
      }
    } catch (e) {
      toast.error('Error triggering scan');
    } finally {
      setScanningStoreId(null);
    }
  };

  const filteredStores = dataStores.filter(s => {
    if (!storeSearch) return true;
    return (
      s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.store_id.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.store_type.toLowerCase().includes(storeSearch.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-blue-600/20 rounded-xl border border-indigo-500/30">
              <Database className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Data Security Posture Management (DSPM)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  WAVE 1.5
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ACTIVE ENFORCING
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Multi-Cloud & Hybrid Data Discovery, Autonomous Classification & Exposure Governance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reloadAll}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-sm font-medium transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Posture Score */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Data Posture</span>
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {overview?.data_posture_score ?? '--'}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-2 text-xs text-indigo-400/90 flex items-center gap-1 font-medium">
            <Activity className="w-3.5 h-3.5" />
            {(overview?.data_posture_score ?? 0) >= 70 ? 'Defended' : 'Vulnerable Posture'}
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Total Stores */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Data Repositories</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {overview?.total_datastores_count ?? '--'}
            </span>
            <span className="text-xs text-slate-400">stores</span>
          </div>
          <div className="mt-2 text-xs text-amber-400 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            {overview?.shadow_datastores_count ?? 0} Shadow / Unmanaged
          </div>
        </div>

        {/* Sensitive Records */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sensitive Records</span>
            <FileSpreadsheet className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {overview ? Number(overview.total_sensitive_records_count).toLocaleString() : '--'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>Vol: {overview?.total_data_volume_gb ?? '--'} GB total</span>
          </div>
        </div>

        {/* Public & Unencrypted Stores */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Security Exposure</span>
            <Unlock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400">
              {overview?.publicly_exposed_datastores_count ?? 0}
            </span>
            <span className="text-xs text-slate-400">publicly exposed</span>
          </div>
          <div className="mt-2 text-xs text-rose-400 flex items-center gap-1 font-medium">
            <AlertOctagon className="w-3.5 h-3.5" />
            {overview?.unencrypted_datastores_count ?? 0} unencrypted at rest
          </div>
        </div>

        {/* Open Findings */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Violations & Findings</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {overview?.open_findings_count ?? '--'}
            </span>
            <span className="text-xs text-slate-400">open</span>
          </div>
          <div className="mt-2 text-xs text-rose-400 flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {overview?.critical_findings_count ?? 0} Critical (PCI/Secrets)
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-1">
        <button
          onClick={() => setActiveTab('stores')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'stores'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Database className="w-4 h-4" />
          Data Stores & Repositories
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
            {dataStores.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('findings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'findings'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Sensitive Exposure Findings
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-rose-900/50 text-rose-300 border border-rose-800/50">
            {findings.filter(f => f.status === 'OPEN').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'assets'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Sensitive Asset Catalog
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
            {assets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'compliance'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          Compliance & Residency
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
            {compliance.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('classifier')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'classifier'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Interactive Data Classifier
        </button>
      </div>

      {/* Tab 1: Data Stores Inventory */}
      {activeTab === 'stores' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search stores by name, ID, type..."
                value={storeSearch}
                onChange={e => setStoreSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Cloud Filter */}
              <select
                value={cloudFilter}
                onChange={e => setCloudFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Cloud Providers</option>
                <option value="AWS">AWS</option>
                <option value="AZURE">Azure</option>
                <option value="GCP">GCP</option>
                <option value="ON_PREMISE">On-Premises</option>
              </select>

              {/* Shadow Data toggle */}
              <button
                onClick={() => setShadowOnlyFilter(!shadowOnlyFilter)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-1.5 ${
                  shadowOnlyFilter
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Shadow Stores Only
              </button>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Repository / Store Name</th>
                  <th className="py-3 px-4">Type & Provider</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Exposure & Encryption</th>
                  <th className="py-3 px-4">Sensitive Records</th>
                  <th className="py-3 px-4">Risk</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStores.map(store => (
                  <tr key={store.store_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60">
                          {store.store_type.includes('S3') || store.store_type.includes('BLOB') || store.store_type.includes('GCS') ? (
                            <FolderGit2 className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Database className="w-4 h-4 text-indigo-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            {store.name}
                            {store.is_shadow_data && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                SHADOW DATA
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {store.store_id} • {store.region} • {store.total_size_mb} MB
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <span className="px-2 py-0.5 w-fit rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {store.store_type}
                        </span>
                        <span className="text-xs text-slate-400">
                          {store.cloud_provider}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                        store.data_classification === 'RESTRICTED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : store.data_classification === 'CONFIDENTIAL'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {store.data_classification}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 text-xs">
                        {store.is_publicly_accessible ? (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <Unlock className="w-3.5 h-3.5" /> Public Access Open!
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> Private Access
                          </span>
                        )}

                        {store.is_encrypted_at_rest ? (
                          <span className="text-slate-400 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" /> AES-256 Encrypted
                          </span>
                        ) : (
                          <span className="text-amber-400 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-400" /> Unencrypted at Rest
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">
                        {Number(store.sensitive_records_count).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">
                        of {Number(store.total_records_count).toLocaleString()} records
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          store.risk_score >= 70 ? 'text-rose-400' : store.risk_score >= 40 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {store.risk_score}
                        </span>
                        <div className="w-14 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              store.risk_score >= 70 ? 'bg-rose-500' : store.risk_score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${store.risk_score}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleTriggerScan(store.store_id)}
                        disabled={scanningStoreId === store.store_id}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${scanningStoreId === store.store_id ? 'animate-spin' : ''}`} />
                        Scan Store
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Sensitive Exposure Findings */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Active security findings and compliance violations detected across data assets.
            </div>

            <select
              value={findingSeverityFilter}
              onChange={e => setFindingSeverityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {findings.map(finding => (
              <div
                key={finding.finding_id}
                className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-slate-400">{finding.finding_id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      finding.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : finding.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {finding.severity}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-2">
                    {finding.data_type.replace(/_/g, ' ')}
                  </h3>
                  <div className="text-xs text-slate-400 mt-1">
                    Category: <span className="text-indigo-400 font-semibold">{finding.category}</span> • Store: <span className="font-mono">{finding.store_id}</span>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-xs text-slate-300">
                    <div className="text-slate-500 text-[11px] mb-1">Masked Sample Evidence:</div>
                    <div className="text-rose-400 font-semibold">{finding.sample_masked_snippet || 'Masked token'}</div>
                    <div className="text-slate-400 text-[11px] mt-1">
                      Matched occurrences: <span className="text-white font-bold">{finding.matched_count}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs">
                    Status:{' '}
                    <span className={`font-bold ${finding.status === 'REMEDIATED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {finding.status}
                    </span>
                  </div>

                  {finding.status === 'OPEN' ? (
                    <button
                      onClick={() => handleRemediate(finding.finding_id, finding.remediation_action)}
                      disabled={remediatingId === finding.finding_id}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-950"
                    >
                      <Check className="w-3.5 h-3.5" />
                      1-Click Remediate: {finding.remediation_action.replace(/_/g, ' ')}
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Remediated
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Sensitive Asset Catalog */}
      {activeTab === 'assets' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/90 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Asset ID & Path</th>
                <th className="py-3 px-4">Store</th>
                <th className="py-3 px-4">Asset Format</th>
                <th className="py-3 px-4">Detected Sensitive Types</th>
                <th className="py-3 px-4">Records</th>
                <th className="py-3 px-4">Sensitivity Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {assets.map(asset => (
                <tr key={asset.asset_id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white font-mono text-xs">{asset.asset_id}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
                      {asset.asset_path}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                    {asset.store_id}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {asset.asset_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {asset.sensitive_types_found.map((t: string) => (
                        <span key={t} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-white font-medium">
                    {Number(asset.record_count).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-sm font-bold ${
                      asset.sensitivity_score >= 80 ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {asset.sensitivity_score}/100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Compliance & Residency */}
      {activeTab === 'compliance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {compliance.map(comp => (
            <div
              key={comp.framework}
              className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{comp.framework.replace(/_/g, ' ')}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  comp.status === 'COMPLIANT'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {comp.status}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{comp.compliance_score}</span>
                <span className="text-xs text-slate-400">% Compliance Score</span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Violations Count:</span>
                  <span className={`font-bold ${comp.violations_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {comp.violations_count}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Audited Data Stores:</span>
                  <span className="font-bold text-white">{comp.controlled_stores_count} stores</span>
                </div>
                <div className="flex justify-between">
                  <span>Evaluation Engine:</span>
                  <span className="text-indigo-400 font-mono text-[11px]">Continuous Audit Rule</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Interactive Content Classifier */}
      {activeTab === 'classifier' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Real-Time Sensitive Data Classifier Sandbox
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Evaluate arbitrary text, API payloads, or document snippets against Luhn credit cards, SSNs, passports, AWS/GitHub secrets, and medical IDs.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-slate-400 font-medium py-1">Quick Presets:</span>
              <button
                onClick={() => setClassifierInput("Customer John Doe, SSN: 123-45-6789, Primary Card: 4532015012348912 (Visa)")}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                PCI + PII (Credit Card & SSN)
              </button>
              <button
                onClick={() => setClassifierInput("API Gateway Secret: AKIAIOSFODNN7EXAMPLE with token ghp_111122223333444455556666777788889999")}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Cloud Keys & Tokens
              </button>
              <button
                onClick={() => setClassifierInput("Patient discharge note for EHR MRN-8472-1928, diagnosed with cardiac arrhythmia.")}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                PHI (Medical Record Number)
              </button>
            </div>

            <textarea
              rows={4}
              value={classifierInput}
              onChange={e => setClassifierInput(e.target.value)}
              placeholder="Paste raw data sample to classify..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />

            <div className="flex justify-end">
              <button
                onClick={handleClassify}
                disabled={classifying}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-950"
              >
                <Play className={`w-4 h-4 ${classifying ? 'animate-spin' : ''}`} />
                Run Classification Engine
              </button>
            </div>
          </div>

          {classificationResult && (
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${classificationResult.has_sensitive_data ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <h4 className="text-base font-bold text-white">
                    Classification Outcome: {classificationResult.suggested_classification}
                  </h4>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Scanned: {classificationResult.scanned_bytes} bytes
                </span>
              </div>

              {classificationResult.detections && classificationResult.detections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {classificationResult.detections.map((d: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-400">{d.category}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {d.severity}
                        </span>
                      </div>
                      <div className="text-white font-medium">{d.data_type}</div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        Masked Token: <span className="text-rose-400 font-bold">{d.masked_snippet}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  All sensitive data checks clear. No PII, PHI, PCI, or credential tokens identified.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
