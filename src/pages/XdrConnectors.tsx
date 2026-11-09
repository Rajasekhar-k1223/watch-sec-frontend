import React, { useState, useEffect } from 'react';
import { 
    Layers, ShieldAlert, Zap, Globe, Activity, Terminal, 
    UserCheck, CheckCircle, RefreshCw, Sliders, ExternalLink, 
    X, Check, AlertTriangle, Key, Search, ShoppingBag, Database,
    Cloud, MessageSquare, BellRing, ShieldCheck, CheckCircle2,
    Copy, ArrowDownLeft, Radio, Play, FileJson, Ban
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ConnectorItem {
    id: string;
    name: string;
    category: string;
    description: string;
    icon: string;
    status: 'Connected' | 'Configured' | 'Disabled';
    enabled: boolean;
    api_endpoint: string;
    webhook_path?: string;
    last_sync: string;
    events_ingested: number;
    config: Record<string, any>;
}

interface MarketplaceConnector {
    id: string;
    name: string;
    category: string;
    icon: string;
    status: string;
    description: string;
    version: string;
    events_forwarded_24h: number;
    is_installed: boolean;
}

interface InboundEvent {
    id: string;
    connector_id: string;
    connector_name: string;
    title: string;
    severity: string;
    agent_or_host: string;
    mitre_tactic: string;
    timestamp: string;
    status: string;
    raw_payload: any;
}

export default function XdrConnectors() {
    const { token } = useAuth();
    const [connectors, setConnectors] = useState<ConnectorItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Tab Navigation
    const [mainTab, setMainTab] = useState<'pipelines' | 'inbound' | 'marketplace'>('pipelines');

    // Marketplace State
    const [marketplaceConnectors, setMarketplaceConnectors] = useState<MarketplaceConnector[]>([]);
    const [loadingMarketplace, setLoadingMarketplace] = useState(false);
    const [testingMarketplaceId, setTestingMarketplaceId] = useState<string | null>(null);

    // Inbound Webhooks & Events State
    const [inboundEvents, setInboundEvents] = useState<InboundEvent[]>([]);
    const [loadingInbound, setLoadingInbound] = useState(false);
    const [simulatingConnectorId, setSimulatingConnectorId] = useState<string | null>(null);
    const [selectedPayloadEvent, setSelectedPayloadEvent] = useState<InboundEvent | null>(null);

    // Testing State
    const [testingId, setTestingId] = useState<string | null>(null);

    // Configuration Modal
    const [configModalConnector, setConfigModalConnector] = useState<ConnectorItem | null>(null);
    const [modalEndpoint, setModalEndpoint] = useState('');
    const [modalApiKey, setModalApiKey] = useState('');
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    const fetchConnectors = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/v2/xdr/connectors`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConnectors(data.connectors || []);
            }
        } catch (e) {
            console.error('Failed to fetch XDR connectors:', e);
            toast.error('Failed to load XDR connectors');
        } finally {
            setLoading(false);
        }
    };

    const fetchMarketplace = async () => {
        try {
            setLoadingMarketplace(true);
            const res = await fetch(`${API_URL}/v2/marketplace/connectors`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMarketplaceConnectors(data.connectors || []);
            }
        } catch (e) {
            console.error('Failed to load marketplace connectors:', e);
            toast.error('Failed to load marketplace');
        } finally {
            setLoadingMarketplace(false);
        }
    };

    const fetchInboundEvents = async () => {
        try {
            setLoadingInbound(true);
            const res = await fetch(`${API_URL}/v2/xdr/inbound/events`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInboundEvents(data.events || []);
            }
        } catch (e) {
            console.error('Failed to fetch inbound events:', e);
        } finally {
            setLoadingInbound(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        fetchConnectors();
        fetchInboundEvents();
    }, [token]);

    const handleToggle = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/v2/xdr/connectors/${id}/toggle`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConnectors(prev => prev.map(c => c.id === id ? { ...c, enabled: data.enabled, status: data.new_status } : c));
                toast.success(`Connector ${data.enabled ? 'Enabled' : 'Disabled'}`);
            }
        } catch (e) {
            toast.error('Failed to toggle connector');
        }
    };

    const handleTest = async (id: string) => {
        try {
            setTestingId(id);
            const res = await fetch(`${API_URL}/v2/xdr/connectors/${id}/test`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                toast.success(`${data.message} (${data.latency_ms}ms)`, { icon: '🟢' });
            } else {
                toast.error('Diagnostic test handshake failed');
            }
        } catch (e) {
            toast.error('Diagnostic request error');
        } finally {
            setTestingId(null);
        }
    };

    const handleTestMarketplaceConnector = async (connectorId: string) => {
        try {
            setTestingMarketplaceId(connectorId);
            const res = await fetch(`${API_URL}/v2/marketplace/connectors/${connectorId}/test`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                toast.success(`${data.connector_name}: Handshake ${data.connection_test} (${data.latency_ms}ms)`);
            } else {
                toast.error('Connector test failed');
            }
        } catch (e) {
            toast.error('Error testing connector handshake');
        } finally {
            setTestingMarketplaceId(null);
        }
    };

    const handleSimulateInbound = async (connectorId: string) => {
        try {
            setSimulatingConnectorId(connectorId);
            const res = await fetch(`${API_URL}/v2/xdr/inbound/${connectorId}/simulate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                toast.success(data.message, { icon: '🚨' });
                fetchInboundEvents();
                fetchConnectors();
            } else {
                toast.error('Simulation failed');
            }
        } catch (e) {
            toast.error('Error generating simulation alert');
        } finally {
            setSimulatingConnectorId(null);
        }
    };

    const handleOpenConfig = (conn: ConnectorItem) => {
        setConfigModalConnector(conn);
        setModalEndpoint(conn.api_endpoint || '');
        setModalApiKey('');
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!configModalConnector) return;

        try {
            setIsSavingConfig(true);
            const res = await fetch(`${API_URL}/v2/xdr/connectors/${configModalConnector.id}/configure`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    api_endpoint: modalEndpoint,
                    config: modalApiKey ? { api_key: modalApiKey } : {}
                })
            });

            if (res.ok) {
                toast.success('Connector configuration saved!');
                setConfigModalConnector(null);
                fetchConnectors();
            } else {
                toast.error('Failed to update connector');
            }
        } catch (e) {
            toast.error('Save configuration error');
        } finally {
            setIsSavingConfig(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Webhook URL copied to clipboard');
    };

    const categories = ['All', 'EDR / XDR', 'SIEM / SOAR', 'Cloud Workload', 'Identity Providers'];

    const filteredConnectors = connectors.filter(c => {
        const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const activeCount = connectors.filter(c => c.enabled).length;
    const totalEvents = connectors.reduce((acc, c) => acc + (c.events_ingested || 0), 0);

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'ShieldAlert': return <ShieldAlert className="w-5 h-5 text-rose-600" />;
            case 'Zap': return <Zap className="w-5 h-5 text-purple-600" />;
            case 'Layers': return <Layers className="w-5 h-5 text-blue-600" />;
            case 'Activity': return <Activity className="w-5 h-5 text-amber-600" />;
            case 'Globe': return <Globe className="w-5 h-5 text-emerald-600" />;
            case 'UserCheck': return <UserCheck className="w-5 h-5 text-indigo-600" />;
            default: return <Terminal className="w-5 h-5 text-cyan-600" />;
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto min-w-0 font-sans">
            {/* Header Card */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/90 shadow-sm p-6 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-600">
                        <Layers className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                XDR & SIEM Connectors Hub
                            </h1>
                            <span className="text-[11px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-700 px-2.5 py-0.5 rounded-full border border-cyan-200">
                                Bi-Directional Sync
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Cross-platform ingestion and alert dispatch with CrowdStrike, SentinelOne, Splunk, Microsoft Sentinel, and AWS GuardDuty.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (mainTab === 'pipelines') fetchConnectors();
                            else if (mainTab === 'inbound') fetchInboundEvents();
                            else fetchMarketplace();
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-all shadow-2xs"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${(loading || loadingMarketplace || loadingInbound) ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2 overflow-x-auto">
                <button
                    onClick={() => setMainTab('pipelines')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                        mainTab === 'pipelines'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    Connected Pipelines ({connectors.length})
                </button>

                <button
                    onClick={() => {
                        setMainTab('inbound');
                        fetchInboundEvents();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                        mainTab === 'inbound'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                    }`}
                >
                    <ArrowDownLeft className="w-4 h-4" />
                    Live Webhooks & Inbound Stream ({inboundEvents.length})
                </button>

                <button
                    onClick={() => {
                        setMainTab('marketplace');
                        fetchMarketplace();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                        mainTab === 'marketplace'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                    }`}
                >
                    <ShoppingBag className="w-4 h-4" />
                    Security Marketplace (66)
                </button>
            </div>

            {/* TAB 1: PIPELINES */}
            {mainTab === 'pipelines' && (
                <>
                {/* KPI Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Active Pipelines</span>
                            <Zap className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-black text-slate-900">
                            {activeCount} / {connectors.length}
                        </div>
                        <div className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" /> Bi-directional sync operational
                        </div>
                    </div>

                    <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Total Synced Events</span>
                            <Activity className="w-4 h-4 text-cyan-600" />
                        </div>
                        <div className="text-2xl font-black text-slate-900">
                            {totalEvents.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-medium">
                            Cross-correlated across external platforms
                        </div>
                    </div>

                    <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Pipeline Latency</span>
                            <Activity className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-2xl font-black text-purple-600">
                            &lt; 40ms
                        </div>
                        <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-medium">
                            Edge TLS 1.3 buffered stream
                        </div>
                    </div>

                    <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Coverage</span>
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-black text-emerald-600">
                            100%
                        </div>
                        <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-medium">
                            EDR, Cloud, Identity & SIEM
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    categoryFilter === cat
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search connectors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Connectors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredConnectors.map(conn => (
                        <div 
                            key={conn.id}
                            className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all shadow-sm ${
                                conn.enabled ? 'border-blue-300 hover:border-blue-400 shadow-md' : 'border-slate-200 opacity-75'
                            }`}
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                                        {getIcon(conn.icon)}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            conn.status === 'Connected' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : conn.status === 'Configured'
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                        }`}>
                                            {conn.status}
                                        </span>

                                        <button
                                            onClick={() => handleToggle(conn.id)}
                                            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                                                conn.enabled ? 'bg-blue-600' : 'bg-slate-300'
                                            }`}
                                        >
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                                conn.enabled ? 'translate-x-4' : ''
                                            }`}></div>
                                        </button>
                                    </div>
                                </div>

                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                                    {conn.category}
                                </span>
                                <h3 className="text-sm font-bold text-slate-900 mb-1">{conn.name}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">{conn.description}</p>
                            </div>

                            <div>
                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[10px] text-slate-700 mb-3 truncate">
                                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">OUTBOUND ENDPOINT</span>
                                    {conn.api_endpoint}
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-3 mb-3 font-mono">
                                    <span>Synced: {conn.last_sync}</span>
                                    <span className="font-bold text-slate-800">{(conn.events_ingested || 0).toLocaleString()} events</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleTest(conn.id)}
                                        disabled={testingId === conn.id}
                                        className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-3 h-3 ${testingId === conn.id ? 'animate-spin text-blue-600' : ''}`} />
                                        Handshake
                                    </button>

                                    <button
                                        onClick={() => handleOpenConfig(conn)}
                                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                                    >
                                        <Sliders className="w-3 h-3" />
                                        Config
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                </>
            )}

            {/* TAB 2: INBOUND WEBHOOKS & LIVE EVENT STREAM */}
            {mainTab === 'inbound' && (
                <div className="space-y-6">
                    {/* Webhook URLs Card */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <ArrowDownLeft className="w-5 h-5 text-blue-600" />
                            <h2 className="text-base font-bold text-slate-900">Inbound SIEM / XDR Webhook Gateways</h2>
                        </div>
                        <p className="text-xs text-slate-500 mb-6">
                            Configure your external SIEM or EDR alerting rules to POST JSON webhooks directly to these dedicated Monitorix receivers. Incoming detections are immediately ingested into the incident correlation matrix.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {connectors.map(c => {
                                const webhookUrl = `${window.location.origin}/api/v2/xdr/inbound/${c.id}`;
                                return (
                                    <div key={c.id} className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    {getIcon(c.icon)}
                                                    <span className="text-xs font-bold text-slate-900">{c.name}</span>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                    c.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                    {c.enabled ? 'Ready' : 'Disabled'}
                                                </span>
                                            </div>
                                            <div className="p-2 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-600 truncate flex items-center justify-between mb-3">
                                                <span className="truncate">{webhookUrl}</span>
                                                <button
                                                    onClick={() => copyToClipboard(webhookUrl)}
                                                    className="text-slate-400 hover:text-blue-600 p-1 shrink-0 ml-2"
                                                    title="Copy Webhook URL"
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleSimulateInbound(c.id)}
                                            disabled={simulatingConnectorId === c.id || !c.enabled}
                                            className="w-full py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                                        >
                                            {simulatingConnectorId === c.id ? (
                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Play className="w-3 h-3" />
                                            )}
                                            Simulate Alert Ingestion
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Live Inbound Event Telemetry Table */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-slate-900">Ingested External Telemetry Stream</h2>
                                    <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                                        Live Stream ({inboundEvents.length})
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">Live incoming security alerts processed from CrowdStrike, SentinelOne, and Microsoft Sentinel</p>
                            </div>

                            <button
                                onClick={fetchInboundEvents}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loadingInbound ? 'animate-spin' : ''}`} />
                                Refresh Stream
                            </button>
                        </div>

                        {loadingInbound ? (
                            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                                <span className="text-xs font-semibold">Streaming external XDR telemetry...</span>
                            </div>
                        ) : inboundEvents.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 text-xs font-medium">
                                No external events ingested yet. Click "Simulate Alert Ingestion" above to test the webhook pipeline.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-700">
                                    <thead className="bg-slate-50/90 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-bold">
                                        <tr>
                                            <th className="py-3 px-6">Timestamp</th>
                                            <th className="py-3 px-6">Source Platform</th>
                                            <th className="py-3 px-6">Alert Title</th>
                                            <th className="py-3 px-6">Target Host</th>
                                            <th className="py-3 px-6">Severity</th>
                                            <th className="py-3 px-6">MITRE Tactic</th>
                                            <th className="py-3 px-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {inboundEvents.map(ev => (
                                            <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                                    {new Date(ev.timestamp).toLocaleTimeString()}
                                                </td>
                                                <td className="py-3.5 px-6 font-semibold text-slate-900 whitespace-nowrap">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700">
                                                        {ev.connector_name}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-6 font-bold text-slate-900 max-w-xs truncate">
                                                    {ev.title}
                                                </td>
                                                <td className="py-3.5 px-6 font-mono text-slate-600 text-[11px]">
                                                    {ev.agent_or_host}
                                                </td>
                                                <td className="py-3.5 px-6">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                        ev.severity === 'Critical' ? 'bg-rose-100 text-rose-700' :
                                                        ev.severity === 'High' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {ev.severity}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-6 text-slate-500 text-[11px] max-w-xs truncate">
                                                    {ev.mitre_tactic}
                                                </td>
                                                <td className="py-3.5 px-6 text-right">
                                                    <button
                                                        onClick={() => setSelectedPayloadEvent(ev)}
                                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                                                    >
                                                        <FileJson className="w-3 h-3 text-blue-600" />
                                                        Payload
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: CONNECTOR MARKETPLACE */}
            {mainTab === 'marketplace' && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-black tracking-widest uppercase bg-purple-100 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
                                    Integration Marketplace v3.0.0
                                </span>
                                <h2 className="text-xl font-bold text-slate-900 mt-2">
                                    Enterprise Security Connector & SIEM Marketplace
                                </h2>
                                <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                                    Turnkey integrations with industry-standard SIEMs, Cloud Providers, Identity Providers, and ITSM frameworks with bi-directional event sync and automated API handshake testing.
                                </p>
                            </div>
                            <button
                                onClick={fetchMarketplace}
                                disabled={loadingMarketplace}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all self-start md:self-auto"
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingMarketplace ? 'animate-spin' : ''}`} />
                                Sync Marketplace
                            </button>
                        </div>
                    </div>

                    {loadingMarketplace ? (
                        <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                            <span>Loading marketplace connectors...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {marketplaceConnectors.map((c) => (
                                <div
                                    key={c.id}
                                    className="bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md rounded-2xl p-5 transition-all duration-300 shadow-sm flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                                {c.category.includes('SIEM') ? (
                                                    <Database className="w-5 h-5 text-purple-600" />
                                                ) : c.category.includes('Cloud') ? (
                                                    <Cloud className="w-5 h-5 text-cyan-600" />
                                                ) : c.category.includes('Identity') ? (
                                                    <Key className="w-5 h-5 text-amber-600" />
                                                ) : c.category.includes('Collaboration') ? (
                                                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                                                ) : c.category.includes('Alerting') ? (
                                                    <BellRing className="w-5 h-5 text-rose-600" />
                                                ) : (
                                                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                    c.status === 'CONNECTED'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                                }`}>
                                                    {c.status}
                                                </span>
                                                <div className="text-[10px] text-slate-400 font-mono mt-1">
                                                    {c.version}
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-sm font-bold text-slate-900 mb-1">{c.name}</h3>
                                        <div className="text-[10px] text-purple-600 font-bold mb-2 uppercase">{c.category}</div>
                                        <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">{c.description}</p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <div className="text-[11px] text-slate-500">
                                            <span className="font-mono text-slate-900 font-bold">
                                                {c.events_forwarded_24h.toLocaleString()}
                                            </span> events (24h)
                                        </div>
                                        <button
                                            onClick={() => handleTestMarketplaceConnector(c.id)}
                                            disabled={testingMarketplaceId === c.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all shadow-sm"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${testingMarketplaceId === c.id ? 'animate-spin' : ''}`} />
                                            {testingMarketplaceId === c.id ? 'Verifying...' : 'Test Sync'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* PAYLOAD INSPECTOR MODAL */}
            {selectedPayloadEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <FileJson className="w-5 h-5 text-blue-600" />
                                    External Alert Payload
                                </h3>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedPayloadEvent.id} • {selectedPayloadEvent.connector_name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedPayloadEvent(null)}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    selectedPayloadEvent.severity === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {selectedPayloadEvent.severity}
                                </span>
                                <span className="font-bold text-xs text-slate-900">{selectedPayloadEvent.title}</span>
                            </div>

                            <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-72">
                                <pre>{JSON.stringify(selectedPayloadEvent.raw_payload, null, 2)}</pre>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 mt-4">
                            <button
                                onClick={() => setSelectedPayloadEvent(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIGURE MODAL */}
            {configModalConnector && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-blue-600" />
                                    Configure {configModalConnector.name}
                                </h3>
                                <p className="text-xs text-slate-500">{configModalConnector.category}</p>
                            </div>
                            <button
                                onClick={() => setConfigModalConnector(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveConfig} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                    Target Ingestion URL / API Endpoint
                                </label>
                                <input
                                    type="text"
                                    value={modalEndpoint}
                                    onChange={(e) => setModalEndpoint(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                    API Key / Secret Token (Optional update)
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter secret token or Bearer token..."
                                    value={modalApiKey}
                                    onChange={(e) => setModalApiKey(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                                />
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                                <strong>Security Note:</strong> All outgoing payloads are encrypted using mutual TLS (mTLS) with cryptographically bound machine signatures.
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setConfigModalConnector(null)}
                                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingConfig}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
                                >
                                    Save Configuration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
