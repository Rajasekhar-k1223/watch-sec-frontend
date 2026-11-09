import React, { useState, useEffect } from 'react';
import { 
    Users, ShieldAlert, RefreshCw, UserCheck, Key, Clock, 
    Globe, Server, AlertTriangle, CheckCircle, Search, Eye, 
    X, Sparkles, Sliders, Activity
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface UebaProfile {
    common_ips?: string[];
    login_hours?: {
        start: number;
        end: number;
        timezone?: string;
    };
    common_processes?: string[];
    avg_daily_bytes_out?: number;
}

interface UebaItem {
    id: number;
    entity_id: string;
    entity_type: string;
    profile: UebaProfile;
    last_updated: string | null;
}

interface EvaluationResult {
    score: number;
    anomalies: string[];
}

export default function UebaIdentity() {
    const { token } = useAuth();
    const [baselines, setBaselines] = useState<UebaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [isRebuilding, setIsRebuilding] = useState(false);

    // Selected Baseline for Drawer
    const [selectedEntity, setSelectedEntity] = useState<UebaItem | null>(null);

    // Test Evaluation Simulator
    const [evalEntityId, setEvalEntityId] = useState('');
    const [evalHour, setEvalHour] = useState('23');
    const [evalIp, setEvalIp] = useState('203.0.113.199');
    const [evalProcess, setEvalProcess] = useState('mimikatz.exe');
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);

    const fetchBaselines = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/v2/ueba/baselines`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBaselines(Array.isArray(data) ? data : []);
                if (data.length > 0 && !evalEntityId) {
                    setEvalEntityId(data[0].entity_id);
                }
            }
        } catch (e) {
            console.error('Failed to fetch UEBA baselines:', e);
            toast.error('Failed to load UEBA baselines');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBaselines();
    }, [token]);

    const handleRebuildBaselines = async () => {
        try {
            setIsRebuilding(true);
            const res = await fetch(`${API_URL}/v2/ueba/rebuild`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('UEBA baseline recalculation queued in background!');
                setTimeout(() => fetchBaselines(), 2500);
            } else {
                toast.error('Failed to queue baseline rebuild');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error rebuilding baselines');
        } finally {
            setIsRebuilding(false);
        }
    };

    const handleRunEvaluation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!evalEntityId) {
            toast.error('Please select an entity to evaluate');
            return;
        }

        try {
            setIsEvaluating(true);
            setEvalResult(null);
            const dummyDate = new Date();
            dummyDate.setUTCHours(parseInt(evalHour, 10), 0, 0, 0);

            const payload = {
                entity_id: evalEntityId,
                timestamp: dummyDate.toISOString(),
                source_ip: evalIp,
                process_name: evalProcess
            };

            const res = await fetch(`${API_URL}/v2/ueba/evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setEvalResult(data);
                if (data.score >= 50) {
                    toast.error(`High Anomaly Score: ${data.score}/100!`, { icon: '🚨' });
                } else {
                    toast.success(`Nominal Anomaly Score: ${data.score}/100`, { icon: '🛡️' });
                }
            } else {
                toast.error('Evaluation request failed');
            }
        } catch (e) {
            console.error(e);
            toast.error('Evaluation error');
        } finally {
            setIsEvaluating(false);
        }
    };

    const filteredBaselines = baselines.filter(b => {
        const matchesSearch = b.entity_id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'All' || b.entity_type.toLowerCase() === typeFilter.toLowerCase();
        return matchesSearch && matchesType;
    });

    const userCount = baselines.filter(b => b.entity_type === 'User').length;
    const deviceCount = baselines.filter(b => b.entity_type === 'Device').length;

    return (
        <div className="p-6 md:p-8 bg-slate-50 min-h-screen text-slate-800 font-sans">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            User & Entity Behavior Analytics (UEBA)
                            <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-500/30">
                                Adaptive Baselines
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Autonomous statistical profiling for identities and devices — flagging impossible travel, off-hours logins, and process drift
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRebuildBaselines}
                        disabled={isRebuilding}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRebuilding ? 'animate-spin' : ''}`} />
                        {isRebuilding ? 'Rebuilding...' : 'Rebuild Baselines'}
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">User Identities</span>
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900">
                        {userCount}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                        Active credential profiles
                    </div>
                </div>

                <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Device Entities</span>
                        <Server className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900">
                        {deviceCount}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                        Workstations & Server nodes
                    </div>
                </div>

                <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Anomaly Threshold</span>
                        <Sliders className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-amber-600">
                        Score &ge; 80
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                        Auto-escalates to Critical SOC Alert
                    </div>
                </div>

                <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Decay Half-Life</span>
                        <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900">
                        24 Hours
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                        Mathematical risk score decay (0.9x)
                    </div>
                </div>
            </div>

            {/* Interactive UEBA Anomaly Evaluator Simulator */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 mb-8 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-bold text-slate-900">Live UEBA Anomaly Simulator</h2>
                </div>
                <p className="text-xs text-slate-500 mb-5">
                    Test the autonomous behavioral engine by simulating anomalous events (e.g. 03:00 AM login, unknown foreign IP, or unauthorized process injection) against an entity's baseline.
                </p>

                <form onSubmit={handleRunEvaluation} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Target Entity
                        </label>
                        <select
                            value={evalEntityId}
                            onChange={(e) => setEvalEntityId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            {baselines.map(b => (
                                <option key={b.id} value={b.entity_id}>
                                    {b.entity_id} ({b.entity_type})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Event Hour (UTC 0-23)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="23"
                            value={evalHour}
                            onChange={(e) => setEvalHour(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Source IP Address
                        </label>
                        <input
                            type="text"
                            value={evalIp}
                            onChange={(e) => setEvalIp(e.target.value)}
                            placeholder="e.g. 203.0.113.199"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Executed Process
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={evalProcess}
                                onChange={(e) => setEvalProcess(e.target.value)}
                                placeholder="e.g. powershell.exe"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
                            />
                            <button
                                type="submit"
                                disabled={isEvaluating}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1.5"
                            >
                                {isEvaluating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                                Score
                            </button>
                        </div>
                    </div>
                </form>

                {/* Evaluation Result */}
                {evalResult && (
                    <div className={`mt-5 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        evalResult.score >= 50
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}>
                        <div className="flex items-start gap-3">
                            {evalResult.score >= 50 ? (
                                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                            ) : (
                                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-base">
                                        Calculated Anomaly Score: {evalResult.score} / 100
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                        evalResult.score >= 80 ? 'bg-rose-600 text-white' : evalResult.score >= 50 ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                                    }`}>
                                        {evalResult.score >= 80 ? 'CRITICAL BREACH' : evalResult.score >= 50 ? 'ANOMALOUS' : 'NORMAL'}
                                    </span>
                                </div>
                                <div className="text-xs mt-1">
                                    {evalResult.anomalies.length > 0 ? (
                                        <span>Triggered Flags: <strong>{evalResult.anomalies.join(' • ')}</strong></span>
                                    ) : (
                                        <span>No deviation from baseline parameters. Event is classified as safe.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Baselines Table */}
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Active Entity Baseline Registry</h2>
                        <p className="text-xs text-slate-500">Statistical bounds generated from historic audit telemetry</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 outline-none font-medium"
                        >
                            <option value="All">All Entity Types</option>
                            <option value="User">Users Only</option>
                            <option value="Device">Devices Only</option>
                        </select>

                        <div className="relative w-56">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search entities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-xl pl-8 pr-3 py-2 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                        <span className="font-medium">Loading entity baselines...</span>
                    </div>
                ) : filteredBaselines.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 font-medium">
                        No baselines found. Click "Rebuild Baselines" to construct initial behavior profiles.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 border-b border-slate-200 font-bold">
                                <tr>
                                    <th className="py-3.5 px-6">Entity Identifier</th>
                                    <th className="py-3.5 px-6">Entity Type</th>
                                    <th className="py-3.5 px-6">Allowed Hours (UTC)</th>
                                    <th className="py-3.5 px-6">Subnet IPs</th>
                                    <th className="py-3.5 px-6">Common Processes</th>
                                    <th className="py-3.5 px-6 text-right">Profile</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredBaselines.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-4 px-6 font-semibold text-slate-900 font-mono">
                                            <div className="flex items-center gap-2">
                                                {item.entity_type === 'User' ? (
                                                    <Key className="w-3.5 h-3.5 text-emerald-600" />
                                                ) : (
                                                    <Server className="w-3.5 h-3.5 text-blue-600" />
                                                )}
                                                <span>{item.entity_id}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                                                item.entity_type === 'User' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                            }`}>
                                                {item.entity_type}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-slate-700 font-medium">
                                            {item.profile.login_hours ? `${item.profile.login_hours.start}:00 - ${item.profile.login_hours.end}:00` : '24/7 Allowed'}
                                        </td>
                                        <td className="py-4 px-6 font-mono text-slate-600">
                                            {(item.profile.common_ips || []).join(', ') || 'Dynamic DHCP'}
                                        </td>
                                        <td className="py-4 px-6 font-mono text-slate-600 max-w-xs truncate">
                                            {(item.profile.common_processes || []).join(', ') || '-'}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                onClick={() => setSelectedEntity(item)}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-lg text-xs font-semibold border border-slate-200 hover:border-indigo-500 transition-all inline-flex items-center gap-1.5 shadow-sm"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Inspect
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Profile JSON Drawer Modal */}
            {selectedEntity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Key className="w-4 h-4 text-indigo-600" />
                                    Behavior Baseline — {selectedEntity.entity_id}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Last updated: {selectedEntity.last_updated ? new Date(selectedEntity.last_updated).toLocaleString() : 'Recent'}</p>
                            </div>
                            <button
                                onClick={() => setSelectedEntity(null)}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mt-4">
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                Baseline Specification (JSON)
                            </label>
                            <pre className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 overflow-x-auto max-h-72 leading-relaxed">
                                {JSON.stringify(selectedEntity.profile, null, 2)}
                            </pre>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedEntity(null)}
                                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
                            >
                                Close Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
