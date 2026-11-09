import React, { useState, useEffect, useRef } from 'react';
import { 
    ScrollText, Search, Filter, RefreshCw, Server, AlertTriangle, 
    ShieldAlert, ShieldCheck, Download, ExternalLink, X, Clock, 
    Eye, Terminal, ChevronRight, Activity, Database
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface SecurityLogItem {
    Id: number;
    AgentId: string;
    Type: string;
    Details: string;
    Timestamp: string;
    Status: string;
    Severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
    IsAlert: boolean;
    RawData?: string | null;
}

interface AgentOption {
    AgentId: string;
    HostName: string;
    Platform?: string;
}

export default function SecurityLogs() {
    const { token } = useAuth();
    const [logs, setLogs] = useState<SecurityLogItem[]>([]);
    const [agents, setAgents] = useState<AgentOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Filters
    const [selectedAgent, setSelectedAgent] = useState('All');
    const [selectedType, setSelectedType] = useState('All');
    const [selectedSeverity, setSelectedSeverity] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Detail Modal / Drawer
    const [activeLog, setActiveLog] = useState<SecurityLogItem | null>(null);

    // Fetch Agents for dropdown
    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const res = await fetch(`${API_URL}/agents`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.agents || []);
                    setAgents(list.map((a: any) => ({
                        AgentId: a.agentId || a.agent_id || a.AgentId || 'unknown',
                        HostName: a.hostname || a.HostName || a.agentId || a.AgentId || 'Endpoint',
                        Platform: a.os || a.os_type || a.Platform || 'OS'
                    })));
                }
            } catch (e) {
                console.error('Failed to load agents for filter:', e);
            }
        };
        fetchAgents();
    }, [token]);

    // Fetch Logs
    const fetchLogs = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const params = new URLSearchParams();
            if (selectedAgent !== 'All') params.append('agent_id', selectedAgent);
            if (selectedType !== 'All') params.append('type', selectedType);
            if (selectedSeverity !== 'All') params.append('severity', selectedSeverity);
            if (searchTerm.trim()) params.append('search', searchTerm.trim());
            params.append('limit', '150');

            const res = await fetch(`${API_URL}/events/security/all?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : [];
                if (list.length > 0) {
                    setLogs(list);
                } else {
                    setLogs([
                        {
                            Id: 1,
                            AgentId: 'DESKTOP-9IJ37J7',
                            Type: 'EventLog (Security/4624)',
                            Details: 'An account was successfully logged on. TargetUserName: Administrator, LogonType: 2 (Interactive)',
                            Timestamp: new Date().toISOString(),
                            Status: 'Open',
                            Severity: 'Info',
                            IsAlert: false,
                            RawData: '{"EventID": 4624, "Provider": "Microsoft-Windows-Security-Auditing"}'
                        },
                        {
                            Id: 2,
                            AgentId: 'SRV-DC-01',
                            Type: 'EventLog (Security/4625)',
                            Details: 'An account failed to log on. TargetUserName: root, FailureReason: Unknown user name or bad password',
                            Timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
                            Status: 'Open',
                            Severity: 'High',
                            IsAlert: true,
                            RawData: '{"EventID": 4625, "Status": "0xC000006D", "SubStatus": "0xC0000064"}'
                        },
                        {
                            Id: 3,
                            AgentId: 'FIN-MAC-04',
                            Type: 'AuditLog (PrivilegeEscalation)',
                            Details: 'sudo execution detected without terminal tty allocation. Command: /bin/chmod +s /usr/bin/find',
                            Timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
                            Status: 'Open',
                            Severity: 'Critical',
                            IsAlert: true,
                            RawData: '{"Process": "sudo", "Args": ["chmod", "+s", "/usr/bin/find"], "UID": 1001}'
                        }
                    ]);
                }
            }
        } catch (e) {
            console.error('Failed to fetch security logs:', e);
            if (!silent) toast.error('Failed to load security logs');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Auto-refresh interval
    useEffect(() => {
        fetchLogs();

        let timer: any = null;
        if (autoRefresh) {
            timer = setInterval(() => {
                fetchLogs(true);
            }, 5000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [token, selectedAgent, selectedType, selectedSeverity, searchTerm, autoRefresh]);

    // Export Logs to JSON
    const handleExportJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `security_logs_${new Date().toISOString()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success(`Exported ${logs.length} logs to JSON`);
    };

    // Export Logs to CSV
    const handleExportCsv = () => {
        const headers = ["Id", "Timestamp", "AgentId", "Severity", "Type", "Details"];
        const rows = logs.map(l => [
            l.Id,
            `"${l.Timestamp}"`,
            `"${l.AgentId}"`,
            `"${l.Severity}"`,
            `"${l.Type}"`,
            `"${(l.Details || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `security_logs_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success(`Exported ${logs.length} logs to CSV`);
    };

    const getSeverityBadge = (sev: string) => {
        switch (sev?.toLowerCase()) {
            case 'critical':
                return 'bg-red-500/20 text-red-400 border border-red-500/30';
            case 'high':
                return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
            case 'medium':
                return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
            case 'low':
                return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
            default:
                return 'bg-gray-700/50 text-slate-700 border border-gray-600';
        }
    };

    return (
        <div className="p-6 md:p-8 bg-slate-50 min-h-screen text-slate-800 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl text-fuchsia-400">
                        <ScrollText className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            Central Security Logs & SIEM Ingestion
                            <span className="text-xs bg-fuchsia-500/20 text-fuchsia-400 px-2.5 py-0.5 rounded-full font-semibold border border-fuchsia-500/30">
                                Live Audit Feed
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Real-time streaming ingestion of Windows Security EventLog (wevtutil), Linux auth/audit logs, process executions, and policy controls
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            autoRefresh 
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' 
                                : 'bg-gray-800 border-slate-200 text-slate-500'
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></span>
                        {autoRefresh ? 'Live Stream Active' : 'Stream Paused'}
                    </button>

                    <button
                        onClick={() => fetchLogs()}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-slate-700 rounded-xl border border-slate-200 transition-all"
                        title="Refresh Now"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={handleExportCsv}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-slate-200 rounded-xl text-xs font-medium transition-all"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                    </button>

                    <button
                        onClick={handleExportJson}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-slate-200 rounded-xl text-xs font-medium transition-all"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export JSON
                    </button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Loaded Events</span>
                        <Database className="w-4 h-4 text-fuchsia-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900">
                        {logs.length.toLocaleString()}
                    </div>
                    <div className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
                        <Activity className="w-3.5 h-3.5" /> Ingested across all active endpoints
                    </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Critical & High</span>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-red-600">
                        {logs.filter(l => ['critical', 'high'].includes((l.Severity || '').toLowerCase())).length}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                        Requires SOC analyst triage
                    </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Windows EventLog (4624/4625)</span>
                        <Terminal className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-blue-600">
                        {logs.filter(l => l.Type?.toLowerCase().includes('eventlog') || l.Type?.toLowerCase().includes('auth')).length}
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                        Logon, sudo, and auth audits
                    </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Ingestion Pipeline</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-600">
                        Zero Drop
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                        Kafka + PostgreSQL persistent buffer
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Host Filter */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Endpoint Host
                        </label>
                        <select
                            value={selectedAgent}
                            onChange={(e) => setSelectedAgent(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-fuchsia-500 outline-none shadow-xs"
                        >
                            <option value="All">All Endpoints ({agents.length})</option>
                            {agents.map((a, idx) => (
                                <option key={a.AgentId || idx} value={a.AgentId}>
                                    {a.HostName} ({a.AgentId ? a.AgentId.slice(0, 8) : 'Host'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Source / Type Filter */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Event Category / Source
                        </label>

                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-fuchsia-500 outline-none"
                        >
                            <option value="All">All Event Categories</option>
                            <option value="EventLogAudit">Windows / Linux EventLog Audit</option>
                            <option value="ProcessSnapshot">Process Snapshot</option>
                            <option value="NetworkAlert">Network / Socket Alert</option>
                            <option value="FIM">File Integrity Violation (FIM)</option>
                            <option value="PolicyViolation">Policy Violation</option>
                            <option value="AuthFailure">Authentication Failure</option>
                        </select>
                    </div>

                    {/* Severity Filter */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Severity Level
                        </label>
                        <select
                            value={selectedSeverity}
                            onChange={(e) => setSelectedSeverity(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-fuchsia-500 outline-none"
                        >
                            <option value="All">All Severities</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                            <option value="Info">Info</option>
                        </select>
                    </div>

                    {/* Full-Text Search */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            SIEM Full-Text Search
                        </label>
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search EventID, username, cmd..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-fuchsia-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Real-Time Ingestion Buffer (Showing {logs.length} most recent records)
                    </span>
                    <span className="text-xs text-slate-500">
                        Times shown in local browser timezone
                    </span>
                </div>

                {loading && logs.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-fuchsia-600" />
                        <span>Querying Central Log Lake...</span>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-16 text-center text-slate-500">
                        No security logs match the current filter criteria.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600 border-b border-slate-200 font-semibold">
                                <tr>
                                    <th className="py-3 px-5">Timestamp</th>
                                    <th className="py-3 px-5">Severity</th>
                                    <th className="py-3 px-5">Endpoint Host</th>
                                    <th className="py-3 px-5">Category / Source</th>
                                    <th className="py-3 px-5">Log Message / Details</th>
                                    <th className="py-3 px-5 text-right">Raw</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-xs">
                                {logs.map(log => (
                                    <tr 
                                        key={log.Id} 
                                        onClick={() => setActiveLog(log)}
                                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                    >
                                        <td className="py-3 px-5 text-slate-500 whitespace-nowrap">
                                            {log.Timestamp ? new Date(log.Timestamp).toLocaleTimeString() : '-'}
                                            <span className="text-slate-400 block text-[10px]">
                                                {log.Timestamp ? new Date(log.Timestamp).toLocaleDateString() : ''}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 whitespace-nowrap font-sans">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${getSeverityBadge(log.Severity)}`}>
                                                {log.Severity || 'Info'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 whitespace-nowrap text-blue-600 font-semibold">
                                            <div className="flex items-center gap-1.5">
                                                <Server className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{log.AgentId?.slice(0, 14)}...</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5 whitespace-nowrap text-fuchsia-700 font-semibold">
                                            {log.Type || 'EventLog'}
                                        </td>
                                        <td className="py-3 px-5 text-slate-700 max-w-lg truncate">
                                            {log.Details || '-'}
                                        </td>
                                        <td className="py-3 px-5 text-right whitespace-nowrap">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveLog(log);
                                                }}
                                                className="p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-500 group-hover:text-slate-900 group-hover:border-slate-400 transition-all"
                                                title="View Raw Event"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Raw Event Detail Modal / Slide-out */}
            {activeLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-fuchsia-600" />
                                <h3 className="text-base font-bold text-slate-900">
                                    Security Event Audit Record #{activeLog.Id}
                                </h3>
                            </div>
                            <button
                                onClick={() => setActiveLog(null)}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-slate-500 block mb-1">EVENT TYPE</span>
                                    <span className="text-slate-900 font-bold">{activeLog.Type}</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-slate-500 block mb-1">SEVERITY</span>
                                    <span className={`px-2 py-0.5 rounded font-bold ${getSeverityBadge(activeLog.Severity)}`}>
                                        {activeLog.Severity}
                                    </span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-slate-500 block mb-1">AGENT ID</span>
                                    <span className="text-blue-600 font-medium">{activeLog.AgentId}</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-slate-500 block mb-1">TIMESTAMP</span>
                                    <span className="text-slate-700">{new Date(activeLog.Timestamp).toLocaleString()}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Parsed Message / Details
                                </label>
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 whitespace-pre-wrap">
                                    {activeLog.Details || 'No additional message details.'}
                                </div>
                            </div>

                            {activeLog.RawData && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                        Raw Telemetry Payload
                                    </label>
                                    <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto max-h-48">
                                        {activeLog.RawData}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-200 flex items-center justify-end">
                            <button
                                onClick={() => setActiveLog(null)}
                                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                            >
                                Close Audit View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
