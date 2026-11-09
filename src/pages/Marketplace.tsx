import React, { useState, useEffect } from 'react';
import { 
  Package, Search, ShieldCheck, Lock, ExternalLink, Download, 
  CheckCircle2, AlertTriangle, ArrowRight, Activity, Plus, RefreshCw, 
  Eye, Check, Filter, Layers, Radio, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface ExtensionPermission {
  read_permissions: string[];
  write_permissions: string[];
  response_permissions: string[];
  api_scopes: string[];
  requires_approval: string[];
}

interface ExtensionItem {
  id: number;
  extension_id: string;
  name: string;
  category: string;
  section: string;
  icon: string;
  description: string;
  version: string;
  author: string;
  lifecycle_status: string;
  extension_type: string;
  permissions: ExtensionPermission;
  signature_hash: string;
  is_certified: boolean;
  is_sandboxed: boolean;
  is_installed: boolean;
}

export default function Marketplace() {
  const [extensions, setExtensions] = useState<ExtensionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected extension for detail / permission modal
  const [detailModalExt, setDetailModalExt] = useState<ExtensionItem | null>(null);

  // Install modal state
  const [installModalExt, setInstallModalExt] = useState<ExtensionItem | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [endpointInput, setEndpointInput] = useState<string>('');
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  // Partner submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [submitForm, setSubmitForm] = useState({
    name: '',
    category: 'Threat intelligence',
    extension_type: 'DetectionPack',
    description: '',
    version: '1.0.0',
    author: '',
    read_scope: 'events:read',
    write_scope: 'alerts:write'
  });

  const sections = [
    'All',
    'Featured',
    'Security',
    'Cloud',
    'Identity',
    'Threat Intelligence',
    'ITSM',
    'Communication',
    'Compliance'
  ];

  const categories = [
    'All',
    'SIEM',
    'EDR',
    'IAM',
    'Cloud',
    'Firewall',
    'Email',
    'Ticketing',
    'Threat intelligence',
    'Vulnerability management',
    'Collaboration',
    'ITSM',
    'Compliance'
  ];

  const getAuthToken = () => {
    return sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
  };

  const fetchExtensions = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const params = new URLSearchParams();
      if (selectedSection !== 'All') params.append('section', selectedSection);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/v2/marketplace/extensions?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to load marketplace catalog');
      const data = await res.json();
      setExtensions(data.extensions || []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading marketplace catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, [selectedSection, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExtensions();
  };

  const handleInstall = async () => {
    if (!installModalExt) return;
    setIsInstalling(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v2/marketplace/extensions/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          extension_id: installModalExt.extension_id,
          config: {
            api_key: apiKeyInput || 'sec_token_default_env',
            endpoint: endpointInput || 'https://api.partner.monitorix.internal'
          }
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to install connector');
      }

      toast.success(`${installModalExt.name} successfully certified & installed!`);
      setInstallModalExt(null);
      setApiKeyInput('');
      setEndpointInput('');
      fetchExtensions();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleLifecycleTransition = async (extId: string, targetStage: string) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/v2/marketplace/extensions/${extId}/lifecycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ target_stage: targetStage })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Lifecycle transition failed');
      }
      toast.success(`Lifecycle transitioned to ${targetStage}`);
      if (detailModalExt && detailModalExt.extension_id === extId) {
        setDetailModalExt({ ...detailModalExt, lifecycle_status: targetStage });
      }
      fetchExtensions();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSubmitPartnerExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v2/marketplace/extensions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: submitForm.name,
          category: submitForm.category,
          extension_type: submitForm.extension_type,
          description: submitForm.description,
          version: submitForm.version,
          author: submitForm.author,
          permissions: {
            read_permissions: [submitForm.read_scope],
            write_permissions: [submitForm.write_scope],
            response_permissions: [],
            api_scopes: [submitForm.read_scope, submitForm.write_scope],
            requires_approval: []
          }
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to submit extension');
      }

      toast.success('Partner extension submitted for static certification review!');
      setShowSubmitModal(false);
      setSubmitForm({
        name: '',
        category: 'Threat intelligence',
        extension_type: 'DetectionPack',
        description: '',
        version: '1.0.0',
        author: '',
        read_scope: 'events:read',
        write_scope: 'alerts:write'
      });
      fetchExtensions();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Monitorix Ecosystem v3.5
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Security Marketplace & Connectors
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
              Standardized, sandboxed integrations for SIEM, EDR, IAM, Cloud, Firewalls, Threat Intelligence, and SOAR automation. Zero external dependencies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/marketplace/integrations"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700/80 transition-all shadow-sm"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              Integration Health Hub
            </Link>
            <Link
              to="/developers"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700/80 transition-all shadow-sm"
            >
              <ExternalLink className="w-4 h-4 text-indigo-400" />
              Developer Portal & SDK
            </Link>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Submit Partner Pack
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/60">
            <div className="text-xs text-slate-400 font-medium">Available Connectors</div>
            <div className="text-2xl font-bold text-white mt-1">{extensions.length || 15}</div>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/60">
            <div className="text-xs text-slate-400 font-medium">Enterprise Categories</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1">11 Verticals</div>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/60">
            <div className="text-xs text-slate-400 font-medium">Certification Sandbox</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">100% Sandboxed</div>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/60">
            <div className="text-xs text-slate-400 font-medium">High-Risk Gate</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">Mandatory Approval</div>
          </div>
        </div>
      </div>

      {/* Search & Section Filter Bar */}
      <div className="space-y-4">
        {/* Sections Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Sections:
          </span>
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedSection === sec
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Category Pills & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Categories:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-200 text-slate-950 font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search connectors, vendors, packs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
            />
          </form>
        </div>
      </div>

      {/* Extensions Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading security extensions and connectors...</p>
        </div>
      ) : extensions.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 p-8">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No extensions matched your filter</h3>
          <p className="text-slate-500 text-xs mt-1">Try resetting the section or category filters.</p>
          <button
            onClick={() => { setSelectedSection('All'); setSelectedCategory('All'); setSearchQuery(''); }}
            className="mt-4 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {extensions.map((ext) => (
            <div
              key={ext.extension_id}
              className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all p-5 shadow-lg hover:shadow-indigo-950/20"
            >
              <div>
                {/* Header: Icon, Name, Category */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold group-hover:scale-105 transition-transform">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {ext.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-medium text-slate-400">{ext.category}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-mono">
                          v{ext.version}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      ext.lifecycle_status === 'Published'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : ext.lifecycle_status === 'Certification'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {ext.lifecycle_status}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {ext.description}
                </p>

                {/* Badges / Guarantees */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {ext.is_certified && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-medium">
                      <ShieldCheck className="w-3 h-3" /> Certified
                    </span>
                  )}
                  {ext.is_sandboxed && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-400 border border-indigo-800/40 font-medium">
                      <Lock className="w-3 h-3" /> Sandboxed
                    </span>
                  )}
                  {ext.permissions?.requires_approval?.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40 font-medium">
                      <AlertTriangle className="w-3 h-3" /> Approval Guard
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => setDetailModalExt(ext)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 px-2 rounded-lg hover:bg-slate-800"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Permissions & Spec
                </button>

                {ext.is_installed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                ) : (
                  <button
                    onClick={() => setInstallModalExt(ext)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Install
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL / PERMISSION SPEC MODAL */}
      {detailModalExt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{detailModalExt.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 font-mono">
                    v{detailModalExt.version}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Publisher: {detailModalExt.author}</p>
              </div>
              <button
                onClick={() => setDetailModalExt(null)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {detailModalExt.description}
            </p>

            {/* Lifecycle Transition Manager */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Connector Lifecycle Stage
                </span>
                <span className="text-xs font-bold text-indigo-400">
                  Current: {detailModalExt.lifecycle_status}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Draft', 'Development', 'Testing', 'Certification', 'Published', 'Deprecation'].map((stage) => (
                  <button
                    key={stage}
                    disabled={detailModalExt.lifecycle_status === stage}
                    onClick={() => handleLifecycleTransition(detailModalExt.extension_id, stage)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                      detailModalExt.lifecycle_status === stage
                        ? 'bg-indigo-600 text-white font-bold cursor-default'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            {/* Permissions Breakdown Matrix */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                Declared Connector Permissions & Access Scopes
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="font-semibold text-slate-300 mb-1.5">Read Permissions</div>
                  <div className="flex flex-wrap gap-1">
                    {detailModalExt.permissions?.read_permissions?.length ? (
                      detailModalExt.permissions.read_permissions.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40 font-mono text-[11px]">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">None</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="font-semibold text-slate-300 mb-1.5">Write Permissions</div>
                  <div className="flex flex-wrap gap-1">
                    {detailModalExt.permissions?.write_permissions?.length ? (
                      detailModalExt.permissions.write_permissions.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-mono text-[11px]">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">None</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="font-semibold text-slate-300 mb-1.5">Response Actions</div>
                  <div className="flex flex-wrap gap-1">
                    {detailModalExt.permissions?.response_permissions?.length ? (
                      detailModalExt.permissions.response_permissions.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 font-mono text-[11px]">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">None</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="font-semibold text-slate-300 mb-1.5">High-Risk Approval Required</div>
                  <div className="flex flex-wrap gap-1">
                    {detailModalExt.permissions?.requires_approval?.length ? (
                      detailModalExt.permissions.requires_approval.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 font-mono text-[11px]">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">None</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cryptographic Signature Hash */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="font-semibold text-slate-300 mb-1">Package Signature (SHA-256)</div>
                <div className="text-[11px] font-mono text-slate-400 break-all select-all">
                  {detailModalExt.signature_hash}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setDetailModalExt(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Close Spec
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSTALL CONNECTOR MODAL */}
      {installModalExt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-400" />
                Configure & Install {installModalExt.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Credentials are automatically encrypted via Fernet AES-128 before storage in the database vault.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  API Key or Bearer Token
                </label>
                <input
                  type="password"
                  placeholder="e.g. sk_live_secure_connector_token"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Integration Endpoint (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://api.sentinel.azure.com"
                  value={endpointInput}
                  onChange={(e) => setEndpointInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Automated Security Verification:
                </div>
                <div className="text-[11px] text-slate-400">
                  • Sandboxed runner initialized with isolated tenant space.
                  <br />• High-risk response operations will require SecOps explicit approval.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInstallModalExt(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isInstalling}
                onClick={handleInstall}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                {isInstalling && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Installation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT PARTNER EXTENSION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Submit Partner Extension Pack
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Publish detection bundles, threat connectors, or custom dashboards into the Monitorix Ecosystem.
              </p>
            </div>

            <form onSubmit={handleSubmitPartnerExtension} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Extension Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Ransomware Heuristic Pack"
                  value={submitForm.name}
                  onChange={(e) => setSubmitForm({ ...submitForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={submitForm.category}
                    onChange={(e) => setSubmitForm({ ...submitForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Extension Type</label>
                  <select
                    value={submitForm.extension_type}
                    onChange={(e) => setSubmitForm({ ...submitForm, extension_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="DetectionPack">Detection Pack</option>
                    <option value="ThreatIntel">Threat Intel</option>
                    <option value="SOAR">SOAR Connector</option>
                    <option value="Report">Report Bundle</option>
                    <option value="Dashboard">Dashboard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Publisher / Author *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CyberGuard Labs"
                  value={submitForm.author}
                  onChange={(e) => setSubmitForm({ ...submitForm, author: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe detection rules, indicators, and capabilities..."
                  value={submitForm.description}
                  onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30"
                >
                  Submit for Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
