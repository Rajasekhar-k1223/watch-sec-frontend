import React, { useState, useEffect } from 'react';
import { 
    Share2, ShieldAlert, ShieldCheck, RefreshCw, Globe, Server, 
    Terminal, Zap, AlertTriangle, ArrowRight, X, ExternalLink, 
    Lock, CheckCircle, Sliders, Eye
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface GraphNode {
    id: string;
    label: string;
    type: string;
    layer: 'external' | 'perimeter' | 'internal' | 'process';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    status: string;
    ip?: string;
    cve?: string;
    os?: string;
    agent_id?: string;
    is_isolated?: boolean;
    details?: string;
}

interface GraphEdge {
    from: string;
    to: string;
    label: string;
    type: string;
    status?: string;
}

interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
    total_nodes: number;
    total_edges: number;
    last_correlated?: string;
}

export default function SecurityGraph() {
    const { token } = useAuth();
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [], total_nodes: 0, total_edges: 0 });
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedLayer, setSelectedLayer] = useState<string>('all');
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [isolatingAgent, setIsolatingAgent] = useState<string | null>(null);

    const fetchGraph = async () => {
        try {
            setLoading(true);
            const activeToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
            const res = await fetch(`${API_URL}/v2/federation/security-graph`, {
                headers: { 'Authorization': `Bearer ${activeToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setGraphData(data);
            }
        } catch (e) {
            console.error('Failed to load security graph:', e);
            toast.error('Failed to load security graph');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGraph();
    }, [token]);

    const handleSyncAttackSurface = async () => {
        try {
            setIsSyncing(true);
            const activeToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
            const res = await fetch(`${API_URL}/v2/federation/sync-surface`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${activeToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                toast.success(`Attack Surface Synced: ${data.external_findings_pulled} findings correlated across ${data.internal_endpoints_correlated} endpoints!`, { icon: '🌐' });
                fetchGraph();
            } else {
                toast.error('Sync request failed');
            }
        } catch (e) {
            toast.error('Error connecting to Attack Surface Engine');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleIsolateNode = async (agentId: string) => {
        try {
            setIsolatingAgent(agentId);
            const activeToken = token || sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
            const res = await fetch(`${API_URL}/agents/${agentId}/isolate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${activeToken}` }
            });
            if (res.ok) {
                toast.success(`Host ${agentId} network successfully quarantined!`, { icon: '🛡️' });
                fetchGraph();
                if (selectedNode) {
                    setSelectedNode({ ...selectedNode, is_isolated: true, status: 'ISOLATED', severity: 'critical' });
                }
            } else {
                toast.error('Isolation command failed');
            }
        } catch (e) {
            toast.error('Isolation error');
        } finally {
            setIsolatingAgent(null);
        }
    };

    const getSeverityColor = (sev: string) => {
        switch (sev?.toLowerCase()) {
            case 'critical': return 'border-red-200 bg-red-50/90 text-red-900 shadow-sm';
            case 'high': return 'border-amber-200 bg-amber-50/90 text-amber-900 shadow-sm';
            case 'medium': return 'border-yellow-200 bg-yellow-50/90 text-yellow-900 shadow-sm';
            case 'info': return 'border-cyan-200 bg-cyan-50/90 text-cyan-900 shadow-sm';
            default: return 'border-emerald-200 bg-emerald-50/90 text-emerald-900 shadow-sm';
        }
    };


    // Filter nodes by layer
    const externalNodes = graphData.nodes.filter(n => n.layer === 'external');
    const perimeterNodes = graphData.nodes.filter(n => n.layer === 'perimeter');
    const internalNodes = graphData.nodes.filter(n => n.layer === 'internal');
    const processNodes = graphData.nodes.filter(n => n.layer === 'process');

    const visibleNodes = selectedLayer === 'all' 
        ? graphData.nodes 
        : graphData.nodes.filter(n => n.layer === selectedLayer);

    return (
        <div className="max-w-7xl mx-auto min-w-0 font-sans p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
                        <Share2 className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            Unified Security Graph & Attack Paths
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2.5 py-0.5 rounded-full font-semibold border border-purple-500/30">
                                Surface Recon ↔ Monitorix EDR
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Correlating external internet attack surface discovery with internal endpoint EDR lineage and host containment (Monitorix)
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSyncAttackSurface}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Synchronizing...' : 'Sync Surface Intelligence'}
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Graph Nodes</span>
                        <Share2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900">
                        {graphData.nodes.length}
                    </div>
                    <div className="text-xs text-purple-600 mt-2 flex items-center gap-1 font-semibold">
                        Cross-correlated topology vertices
                    </div>
                </div>

                <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Attack Path Edges</span>
                        <Zap className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900">
                        {graphData.edges.length}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                        Active reconnaissance & ingress routes
                    </div>
                </div>

                <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">External Vulnerabilities</span>
                        <Globe className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-rose-600">
                        {graphData.nodes.filter(n => n.cve).length} CVEs
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                        Discovered by perimeter scanners
                    </div>
                </div>

                <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Isolated Endpoints</span>
                        <Lock className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-600">
                        {graphData.nodes.filter(n => n.is_isolated).length}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                        Active firewall perimeter quarantine
                    </div>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl p-4 mb-8 shadow-sm">
                <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Layer View:</span>
                    <div className="flex flex-wrap gap-1.5 ml-2">
                        {[
                            { id: 'all', label: 'Complete Security Graph' },
                            { id: 'external', label: '1. External Attack Surface' },
                            { id: 'perimeter', label: '2. Ingress DMZ' },
                            { id: 'internal', label: '3. Monitorix Endpoints' },
                            { id: 'process', label: '4. Process Lineage' },
                        ].map(layer => (
                            <button
                                key={layer.id}
                                onClick={() => setSelectedLayer(layer.id)}
                                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                                    selectedLayer === layer.id
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
                                }`}
                            >
                                {layer.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* GRAPH VISUAL CANVAS */}
            {loading ? (
                <div className="p-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                    <span>Correlating attack surface vectors with Monitorix telemetry...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
                    {/* TIER 1: External Attack Surface */}
                    <div className="space-y-4">
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between shadow-sm">
                            <span className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-2">
                                <Globe className="w-4 h-4" /> 1. External Threat
                            </span>
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded font-mono font-bold">
                                {externalNodes.length} Nodes
                            </span>
                        </div>

                        <div className="space-y-3">
                            {externalNodes.map(node => (
                                <div
                                    key={node.id}
                                    onClick={() => setSelectedNode(node)}
                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-md ${getSeverityColor(node.severity)}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                            {node.type}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-600 font-semibold">{node.ip}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 truncate">{node.label}</h4>
                                    {node.cve && (
                                        <div className="mt-2 text-xs font-mono font-bold text-red-700 bg-red-100 p-1.5 rounded border border-red-200">
                                            {node.cve}
                                        </div>
                                    )}
                                    <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">{node.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TIER 2: Ingress & Perimeter */}
                    <div className="space-y-4">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between shadow-sm">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> 2. Perimeter & DMZ
                            </span>
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                                {perimeterNodes.length} Nodes
                            </span>
                        </div>

                        <div className="space-y-3">
                            {perimeterNodes.map(node => (
                                <div
                                    key={node.id}
                                    onClick={() => setSelectedNode(node)}
                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-md ${getSeverityColor(node.severity)}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                            {node.type}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-600 font-semibold">{node.ip}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 truncate">{node.label}</h4>
                                    <p className="text-[11px] text-slate-600 mt-2">{node.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TIER 3: Internal Endpoints (Monitorix Fleet) */}
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between shadow-sm">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
                                <Server className="w-4 h-4" /> 3. Internal Endpoints (EDR)
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                                {internalNodes.length} Nodes
                            </span>
                        </div>


                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                            {internalNodes.map(node => (
                                <div
                                    key={node.id}
                                    onClick={() => setSelectedNode(node)}
                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-md ${
                                        node.is_isolated ? 'border-red-500 bg-red-50 text-red-900 shadow-md ring-2 ring-red-400' : getSeverityColor(node.severity)
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                            {node.os || 'Endpoint'}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            node.is_isolated ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        }`}>
                                            {node.status}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 truncate">{node.label}</h4>
                                    <span className="text-[11px] font-mono text-slate-600 block mt-1">{node.ip}</span>
                                    <p className="text-[11px] text-slate-600 mt-2">{node.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TIER 4: Process Execution & Lineage */}
                    <div className="space-y-4">
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between shadow-sm">
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-2">
                                <Terminal className="w-4 h-4" /> 4. Process Lineage & Triage
                            </span>
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono font-bold">
                                {processNodes.length} Nodes
                            </span>
                        </div>

                        <div className="space-y-3">
                            {processNodes.map(node => (
                                <div
                                    key={node.id}
                                    onClick={() => setSelectedNode(node)}
                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-md ${getSeverityColor(node.severity)}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                            {node.type}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                                            SUSPICIOUS
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-bold font-mono text-slate-900 break-all">{node.label}</h4>
                                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">{node.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Node Inspector Drawer */}
            {selectedNode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Share2 className="w-5 h-5 text-purple-600" />
                                    {selectedNode.label}
                                </h3>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-0.5">
                                    Layer: {selectedNode.layer} • Type: {selectedNode.type}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-4 text-xs font-mono">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-slate-500 block mb-1">STATUS</span>
                                    <span className="font-bold text-slate-900">{selectedNode.status}</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-slate-500 block mb-1">SEVERITY</span>
                                    <span className="font-bold uppercase text-rose-600">{selectedNode.severity}</span>
                                </div>
                            </div>

                            {selectedNode.ip && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-slate-500 block mb-1">IP ADDRESS</span>
                                    <span className="font-bold text-blue-600">{selectedNode.ip}</span>
                                </div>
                            )}

                            {selectedNode.cve && (
                                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                                    <span className="text-rose-600 block mb-1 font-bold">CVE IDENTIFIER</span>
                                    <span className="font-bold text-slate-900">{selectedNode.cve}</span>
                                </div>
                            )}

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-sans text-xs text-slate-700">
                                <strong className="text-slate-500 block mb-1 uppercase text-[10px]">CORRELATED DETAILS</strong>
                                {selectedNode.details}
                            </div>
                        </div>

                        {/* Node Actions */}
                        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                            {selectedNode.layer === 'internal' && selectedNode.agent_id ? (
                                <button
                                    onClick={() => handleIsolateNode(selectedNode.agent_id!)}
                                    disabled={isolatingAgent === selectedNode.agent_id || selectedNode.is_isolated}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                                        selectedNode.is_isolated
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                            : 'bg-rose-600 hover:bg-rose-700 text-white'
                                    }`}
                                >
                                    <Lock className="w-3.5 h-3.5" />
                                    {selectedNode.is_isolated ? 'Host Already Isolated' : 'Isolate Host via Monitorix'}
                                </button>
                            ) : (
                                <span className="text-xs text-slate-500">Continuous telemetry active</span>
                            )}

                            <button
                                onClick={() => setSelectedNode(null)}
                                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
