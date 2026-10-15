import React, { useState, useEffect } from 'react';
import { 
    Layers, ShieldAlert, Zap, Globe, Activity, Terminal, 
    UserCheck, CheckCircle, RefreshCw, Sliders, ExternalLink, 
    X, Check, AlertTriangle, Key, Search, ShoppingBag, Database,
    Cloud, MessageSquare, BellRing, ShieldCheck, CheckCircle2
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

export default function XdrConnectors() {
    const { token } = useAuth();
    const [connectors, setConnectors] = useState<ConnectorItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Feature 66: Marketplace State
    const [mainTab, setMainTab] = useState<'pipelines' | 'marketplace'>('pipelines');
    const [marketplaceConnectors, setMarketplaceConnectors] = useState<MarketplaceConnector[]>([]);
    const [loadingMarketplace, setLoadingMarketplace] = useState(false);
    const [testingMarketplaceId, setTestingMarketplaceId] = useState<string | null>(null);

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

    useEffect(() => {
        fetchConnectors();
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
            case 'ShieldAlert': return <ShieldAlert className="w-6 h-6 text-red-400" />;
            case 'Zap': return <Zap className="w-6 h-6 text-purple-400" />;
            case 'Layers': return <Layers className="w-6 h-6 text-blue-400" />;
            case 'Activity': return <Activity className="w-6 h-6 text-amber-400" />;
            case 'Globe': return <Globe className="w-6 h-6 text-emerald-400" />;
            case 'UserCheck': return <UserCheck className="w-6 h-6 text-indigo-400" />;
            default: return <Terminal className="w-6 h-6 text-cyan-400" />;
        }
    };

    return (
        <div className="p-6 md:p-8 bg-gray-900 min-h-screen text-gray-100 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                        <Layers className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                            XDR & SIEM Connectors Hub
                            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2.5 py-0.5 rounded-full font-semibold border border-cyan-500/30">
                                Cross-Platform Ingestion
                            </span>
                        </h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            Unified telemetry synchronization with enterprise XDRs, cloud detection hubs, and external SOAR frameworks
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={mainTab === 'pipelines' ? fetchConnectors : fetchMarketplace}
                        className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${(loading || loadingMarketplace) ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-2 mb-8 bg-gray-800/80 p-1 rounded-xl border border-gray-700 w-fit">
                <button
                    onClick={() => setMainTab('pipelines')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        mainTab === 'pipelines'
                            ? 'bg-cyan-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <Layers className="w-3.5 h-3.5" />
                    Hub Pipelines
                </button>
                <button
                    onClick={() => {
                        setMainTab('marketplace');
                        fetchMarketplace();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        mainTab === 'marketplace'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Security Marketplace (66)
                </button>
            </div>

            {/* TAB 1: PIPELINES */}
            {mainTab === 'pipelines' && (
                <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="p-5 bg-gray-800/80 border border-gray-700/60 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Active Pipelines</span>
                        <Zap className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-extrabold text-white">
                        {activeCount} / {connectors.length}
                    </div>
                    <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Bi-directional sync operational
                    </div>
                </div>

                <div className="p-5 bg-gray-800/80 border border-gray-700/60 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Total Synced Events</span>
                        <Activity className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-3xl font-extrabold text-white">
                        {totalEvents.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        Correlated across external platforms
                    </div>
                </div>

                <div className="p-5 bg-gray-800/80 border border-gray-700/60 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Pipeline Latency</span>
                        <Activity className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-3xl font-extrabold text-purple-400">
                        &lt; 50ms
                    </div>
                    <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        Edge TLS 1.3 buffered stream
                    </div>
                </div>

                <div className="p-5 bg-gray-800/80 border border-gray-700/60 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-gray-400 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Telemetry Coverage</span>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-400">
                        100%
                    </div>
                    <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        EDR, Cloud, Identity & SIEM
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-800/80 border border-gray-700/80 rounded-2xl p-4 mb-8 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {['All', 'EDR / XDR', 'SIEM / SOAR', 'Cloud Workload', 'Identity Providers'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                categoryFilter === cat
                                    ? 'bg-cyan-600 text-white shadow-md'
                                    : 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search connectors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-xs rounded-xl pl-9 pr-3 py-2 outline-none"
                    />
                </div>
            </div>

            {/* Connectors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredConnectors.map(conn => (
                    <div 
                        key={conn.id}
                        className={`bg-gray-800/90 border rounded-2xl p-6 flex flex-col justify-between transition-all shadow-xl ${
                            conn.enabled ? 'border-cyan-500/40 hover:border-cyan-500' : 'border-gray-700/60 opacity-80'
                        }`}
                    >
                        <div>
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="p-3 bg-gray-900 rounded-xl border border-gray-700">
                                    {getIcon(conn.icon)}
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        conn.status === 'Connected' 
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : conn.status === 'Configured'
                                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                : 'bg-gray-700 text-gray-400'
                                    }`}>
                                        {conn.status}
                                    </span>

                                    {/* Toggle Switch */}
                                    <button
                                        onClick={() => handleToggle(conn.id)}
                                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                                            conn.enabled ? 'bg-cyan-600' : 'bg-gray-700'
                                        }`}
                                    >
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                            conn.enabled ? 'translate-x-4' : ''
                                        }`}></div>
                                    </button>
                                </div>
                            </div>

                            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                                {conn.category}
                            </span>
                            <h3 className="text-base font-bold text-white mb-2">{conn.name}</h3>
                            <p className="text-xs text-gray-400 leading-relaxed mb-4">{conn.description}</p>
                        </div>

                        <div>
                            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 font-mono text-[11px] text-gray-400 mb-4 truncate">
                                <span className="text-gray-600 block text-[9px] uppercase tracking-wider">ENDPOINT</span>
                                {conn.api_endpoint}
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-700/60 pt-3 mb-4 font-mono">
                                <span>Synced: {conn.last_sync}</span>
                                <span className="font-bold text-gray-300">{(conn.events_ingested || 0).toLocaleString()} events</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleTest(conn.id)}
                                    disabled={testingId === conn.id}
                                    className="flex-1 py-2 bg-gray-900 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-3 h-3 ${testingId === conn.id ? 'animate-spin text-cyan-400' : ''}`} />
                                    Test Handshake
                                </button>

                                <button
                                    onClick={() => handleOpenConfig(conn)}
                                    className="px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                                >
                                    <Sliders className="w-3 h-3" />
                                    Configure
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            </>
            )}

            {/* TAB 2: SECURITY CONNECTOR MARKETPLACE (Feature 66) */}
            {mainTab === 'marketplace' && (
                <div className="space-y-6">
                    {/* Marketplace Banner */}
                    <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-cyan-900/40 border border-purple-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-black tracking-widest uppercase bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/40">
                                    Integration Marketplace v3.0.0
                                </span>
                                <h2 className="text-xl font-bold text-white mt-2">
                                    Enterprise Security Connector & SIEM Marketplace
                                </h2>
                                <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                                    Turnkey integrations with industry-standard SIEMs, Cloud Providers, Identity Providers, and ITSM frameworks with bidirectional event sync and automated API handshake testing.
                                </p>
                            </div>
                            <button
                                onClick={fetchMarketplace}
                                disabled={loadingMarketplace}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all self-start md:self-auto"
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingMarketplace ? 'animate-spin' : ''}`} />
                                Sync Marketplace
                            </button>
                        </div>
                    </div>

                    {/* Connectors Grid */}
                    {loadingMarketplace ? (
                        <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
                            <span>Loading marketplace connectors...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {marketplaceConnectors.map((c) => (
                                <div
                                    key={c.id}
                                    className="bg-gray-800/80 border border-gray-700/80 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 shadow-lg flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="p-3 bg-gray-900 border border-gray-700 rounded-xl">
                                                {c.category.includes('SIEM') ? (
                                                    <Database className="w-6 h-6 text-purple-400" />
                                                ) : c.category.includes('Cloud') ? (
                                                    <Cloud className="w-6 h-6 text-cyan-400" />
                                                ) : c.category.includes('Identity') ? (
                                                    <Key className="w-6 h-6 text-amber-400" />
                                                ) : c.category.includes('Collaboration') ? (
                                                    <MessageSquare className="w-6 h-6 text-emerald-400" />
                                                ) : c.category.includes('Alerting') ? (
                                                    <BellRing className="w-6 h-6 text-rose-400" />
                                                ) : (
                                                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                    c.status === 'CONNECTED'
                                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                        : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                                                }`}>
                                                    {c.status}
                                                </span>
                                                <div className="text-[10px] text-gray-500 font-mono mt-1">
                                                    {c.version}
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-base font-bold text-white mb-1">{c.name}</h3>
                                        <div className="text-[11px] text-purple-400 font-medium mb-3">{c.category}</div>
                                        <p className="text-xs text-gray-400 leading-relaxed mb-4">{c.description}</p>
                                    </div>

                                    <div className="pt-4 border-t border-gray-700/60 flex items-center justify-between">
                                        <div className="text-[11px] text-gray-400">
                                            <span className="font-mono text-white font-semibold">
                                                {c.events_forwarded_24h.toLocaleString()}
                                            </span> events (24h)
                                        </div>
                                        <button
                                            onClick={() => handleTestMarketplaceConnector(c.id)}
                                            disabled={testingMarketplaceId === c.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all shadow-sm"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${testingMarketplaceId === c.id ? 'animate-spin' : ''}`} />
                                            {testingMarketplaceId === c.id ? 'Verifying...' : 'Test Connection'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Configure Modal */}
            {configModalConnector && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-cyan-400" />
                                    Configure {configModalConnector.name}
                                </h3>
                                <p className="text-xs text-gray-400">{configModalConnector.category}</p>
                            </div>
                            <button
                                onClick={() => setConfigModalConnector(null)}
                                className="text-gray-400 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveConfig} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Target Ingestion URL / API Endpoint
                                </label>
                                <input
                                    type="text"
                                    value={modalEndpoint}
                                    onChange={(e) => setModalEndpoint(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-xs font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    API Key / Secret Token (Optional update)
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter secret token or Bearer token..."
                                    value={modalApiKey}
                                    onChange={(e) => setModalApiKey(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-xs font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
                                />
                            </div>

                            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 text-[11px] text-gray-400">
                                <strong>Security Note:</strong> All outgoing payloads are encrypted using mutual TLS (mTLS) with cryptographically bound hardware machine signatures.
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setConfigModalConnector(null)}
                                    className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingConfig}
                                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
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
