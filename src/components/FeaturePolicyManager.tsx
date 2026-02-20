
import React, { useState, useEffect } from 'react';
import {
    Activity, Key, Clipboard, ShieldAlert, Globe, Printer,
    Ghost, Video, Terminal, Mail, Camera, MapPin, Usb, Wifi, FileText, CheckCircle, Info, Mic, AlertCircle, Clock, Rocket, Lock, Shield
} from 'lucide-react';

interface Feature {
    id: string;
    name: string;
    domain: string;
    icon: React.ReactNode;
    description: string;
    permission: string;
    osSupport: { win: boolean; linux: boolean; mac: boolean };
    dbKey: string;
}

interface FeaturePolicyManagerProps {
    agent: any;
    token: string;
    apiUrl: string;
    onUpdate: () => void;
    policies?: any[]; // [NEW]
}

// Trial-related interfaces
interface TrialInfo {
    feature: string;
    expires_at: string;
    remaining_seconds: number;
}

interface TrialStatus {
    active_trials: TrialInfo[];
    available_trials: string[];
    used_trials: string[];
}

export default function FeaturePolicyManager({ agent, token, apiUrl, onUpdate, policies = [] }: FeaturePolicyManagerProps) {
    const [toggling, setToggling] = useState<string | null>(null);
    const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
    const [trialCountdowns, setTrialCountdowns] = useState<Record<string, number>>({});
    const [startingTrial, setStartingTrial] = useState<string | null>(null);

    const features: Feature[] = [
        {
            id: 'activity', name: 'Activity Monitor', domain: 'Surveillance', icon: <Activity className="w-4 h-4" />,
            description: 'Logs active window titles, process names, and user idle durations.',
            permission: 'User/Standard',
            osSupport: { win: true, linux: true, mac: true }, dbKey: 'activityMonitorEnabled'
        },
        {
            id: 'keylogger', name: 'Smart Keylogger', domain: 'Surveillance', icon: <Key className="w-4 h-4" />,
            description: 'Context-aware keystroke logging grouped by application.',
            permission: 'Kernel/Hook',
            osSupport: { win: true, linux: true, mac: true }, dbKey: 'keyloggerEnabled'
        },
        {
            id: 'clipboard', name: 'Clipboard Auditor', domain: 'DLP', icon: <Clipboard className="w-4 h-4" />,
            description: 'Intercepts and logs sensitive text copied to clipboard.',
            permission: 'User/Active',
            osSupport: { win: true, linux: true, mac: true }, dbKey: 'clipboardMonitorEnabled'
        },
        {
            id: 'app_blocker', name: 'App Enforcer', domain: 'Security', icon: <ShieldAlert className="w-4 h-4" />,
            description: 'Terminates forbidden applications in real-time.',
            permission: 'Admin/Process',
            osSupport: { win: true, linux: true, mac: true }, dbKey: 'appBlockerEnabled'
        },
        {
            id: 'browser', name: 'Browser Guard', domain: 'Security', icon: <Globe className="w-4 h-4" />,
            description: 'Enforces browser policies and monitors web history.',
            permission: 'Admin/Policy',
            osSupport: { win: true, linux: true, mac: true }, dbKey: 'browserEnforcerEnabled'
        },
        {
            id: 'printer', name: 'Printer Monitor', domain: 'DLP', icon: <Printer className="w-4 h-4" />,
            description: 'Tracks document titles and pages for all print jobs.',
            permission: 'User/Spooler',
            osSupport: { win: true, linux: true, mac: false }, dbKey: 'printerMonitorEnabled'
        },
        {
            id: 'shadow', name: 'Forensic Shadowing', domain: 'Forensics', icon: <Ghost className="w-4 h-4" />,
            description: 'Keeps hidden copies of files moved to USB or printed.',
            permission: 'Admin/System',
            osSupport: { win: true, linux: true, mac: false }, dbKey: 'shadowMonitorEnabled'
        },
        {
            id: 'live_stream', name: 'Live Stream (WebRTC)', domain: 'Remote', icon: <Video className="w-4 h-4" />,
            description: 'Low-latency screen streaming with recording capability.',
            permission: 'User/Capturer',
            osSupport: { win: true, linux: true, mac: true }, dbKey: 'liveStreamEnabled'
        },
        {
            id: 'remote_shell', name: 'Remote Terminal', domain: 'Remote', icon: <Terminal className="w-4 h-4" />,
            description: 'Direct interactive shell (CMD/Bash) access.',
            permission: 'Admin/Shell',
            osSupport: { win: true, linux: true, mac: true }, dbKey: 'remoteShellEnabled'
        },
        {
            id: 'mail', name: 'Email Auditor', domain: 'Surveillance', icon: <Mail className="w-4 h-4" />,
            description: 'Monitors desktop email clients for sensitive traffic.',
            permission: 'User/Standard',
            osSupport: { win: true, linux: true, mac: true }, dbKey: 'mailMonitorEnabled'
        },
        {
            id: 'screenshots', name: 'Intelligent Screenshots', domain: 'Surveillance', icon: <Camera className="w-4 h-4" />,
            description: 'Capture periodic screen snapshots with AI OCR index.',
            permission: 'User/Capturer',
            osSupport: { win: true, linux: true, mac: true }, dbKey: 'screenshotsEnabled'
        },
        {
            id: 'location', name: 'GPS/Location Tracking', domain: 'Asset', icon: <MapPin className="w-4 h-4" />,
            description: 'Device geolocation via IP and WiFi triangulation.',
            permission: 'User/Loc',
            osSupport: { win: true, linux: true, mac: true }, dbKey: 'locationTrackingEnabled'
        },
        {
            id: 'usb', name: 'USB Blocking', domain: 'Security', icon: <Usb className="w-4 h-4" />,
            description: 'Prevent data theft by locking down USB storage ports.',
            permission: 'Admin/Reg',
            osSupport: { win: true, linux: true, mac: true }, dbKey: 'usbBlockingEnabled'
        },
        {
            id: 'network', name: 'Network Analytics', domain: 'Security', icon: <Wifi className="w-4 h-4" />,
            description: 'Real-time per-process traffic and connection analysis.',
            permission: 'Admin/Drive',
            osSupport: { win: true, linux: true, mac: true }, dbKey: 'networkMonitoringEnabled'
        },
        {
            id: 'file_dlp', name: 'File System DLP', domain: 'DLP', icon: <FileText className="w-4 h-4" />,
            description: 'Monitor access to sensitive local file directories.',
            permission: 'User/Watch',
            osSupport: { win: true, linux: true, mac: true }, dbKey: 'fileDlpEnabled'
        },
        {
            id: 'speech', name: 'Speech Monitor', domain: 'Surveillance', icon: <Mic className="w-4 h-4" />,
            description: 'Transcribes micro-meetings and flags sensitive keywords.',
            permission: 'User/Mic',
            osSupport: { win: true, linux: true, mac: false }, dbKey: 'speechMonitorEnabled'
        },
        {
            id: 'vuln', name: 'Vulnerability Intel', domain: 'Intelligence', icon: <AlertCircle className="w-4 h-4" />,
            description: 'Global CVE correlation and patching intelligence.',
            permission: 'System/DB',
            osSupport: { win: true, linux: true, mac: true }, dbKey: 'vulnerabilityIntelligenceEnabled'
        }
    ];

    // Feature name mapping for trial API
    const FEATURE_NAME_MAP: Record<string, string> = {
        'live_stream': 'LiveStreamEnabled',
        'remote_shell': 'RemoteShellEnabled'
    };

    const TRIAL_ELIGIBLE_FEATURES = ['live_stream', 'remote_shell'];

    // Fetch trial status on mount and when agent changes
    useEffect(() => {
        fetchTrialStatus();
    }, [agent.agentId]);

    // Countdown timer for active trials
    useEffect(() => {
        if (!trialStatus?.active_trials.length) return;

        const interval = setInterval(() => {
            setTrialCountdowns(prev => {
                const updated = { ...prev };
                let hasExpired = false;

                trialStatus.active_trials.forEach(trial => {
                    const currentRemaining = prev[trial.feature] ?? trial.remaining_seconds;
                    const newRemaining = Math.max(0, currentRemaining - 1);
                    updated[trial.feature] = newRemaining;

                    if (newRemaining === 0 && currentRemaining > 0) {
                        hasExpired = true;
                    }
                });

                if (hasExpired) {
                    // Refresh trial status when any trial expires
                    setTimeout(() => {
                        fetchTrialStatus();
                        onUpdate();
                    }, 1000);
                }

                return updated;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [trialStatus]);

    // Initialize countdown values when trial status is fetched
    useEffect(() => {
        if (trialStatus?.active_trials) {
            const initial: Record<string, number> = {};
            trialStatus.active_trials.forEach(trial => {
                initial[trial.feature] = trial.remaining_seconds;
            });
            setTrialCountdowns(initial);
        }
    }, [trialStatus?.active_trials]);

    const fetchTrialStatus = async () => {
        try {
            const res = await fetch(`${apiUrl}/trials/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTrialStatus(data);
            }
        } catch (e) {
            console.error('Failed to fetch trial status:', e);
        }
    };

    const startTrial = async (featureName: string) => {
        setStartingTrial(featureName);
        try {
            const res = await fetch(`${apiUrl}/trials/start`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ feature: featureName })
            });

            if (res.ok) {
                await fetchTrialStatus();
                await onUpdate();
            } else {
                const error = await res.json();
                alert(`Trial activation failed: ${error.error || 'Unknown error'}`);
            }
        } catch (e) {
            console.error('Failed to start trial:', e);
            alert('Failed to start trial. Please try again.');
        } finally {
            setStartingTrial(null);
        }
    };

    // Helper functions for trial logic
    const canStartTrial = (featureId: string): boolean => {
        if (!TRIAL_ELIGIBLE_FEATURES.includes(featureId)) return false;
        if (!trialStatus) return false;

        const backendName = FEATURE_NAME_MAP[featureId];
        return trialStatus.available_trials.includes(backendName);
    };

    const isTrialActive = (featureId: string): boolean => {
        if (!trialStatus) return false;
        const backendName = FEATURE_NAME_MAP[featureId];
        return trialStatus.active_trials.some(t => t.feature === backendName);
    };

    const isTrialExpired = (featureId: string): boolean => {
        if (!trialStatus) return false;
        const backendName = FEATURE_NAME_MAP[featureId];
        return trialStatus.used_trials.includes(backendName) && !isTrialActive(featureId);
    };

    const getTrialRemaining = (featureId: string): number => {
        const backendName = FEATURE_NAME_MAP[featureId];
        return trialCountdowns[backendName] || 0;
    };

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleToggle = async (id: string, current: boolean) => {
        setToggling(id);
        try {
            const res = await fetch(`${apiUrl}/agents/${agent.agentId}/toggle-feature?feature=${id}&enabled=${!current}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                onUpdate();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setToggling(null);
        }
    };

    const handleAssignPolicy = async (policyId: number | null) => {
        try {
            const res = await fetch(`${apiUrl}/agents/${agent.agentId}/policy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ policyId })
            });
            if (res.ok) {
                onUpdate();
            }
        } catch (e) { console.error(e); }
    };

    const OSSupportBadge = ({ support }: { support: { win: boolean, linux: boolean, mac: boolean } }) => (
        <div className="flex gap-1 justify-center">
            <span className={`text-[10px] px-1 rounded ${support.win ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-gray-800 text-gray-600 border border-gray-700'}`}>W</span>
            <span className={`text-[10px] px-1 rounded ${support.linux ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-gray-800 text-gray-600 border border-gray-700'}`}>L</span>
            <span className={`text-[10px] px-1 rounded ${support.mac ? 'bg-gray-400/10 text-gray-300 border border-gray-400/20' : 'bg-gray-800 text-gray-600 border border-gray-700'}`}>M</span>
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-4">
                    <div className="bg-blue-600/20 p-2 rounded-lg">
                        <Info className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">Enterprise Policy Control</h4>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                            Use these controls to activate or deactivate agent capabilities in real-time. Toggling a feature will send a command to the remote device, which will reconfigure and sync immediately.
                        </p>
                    </div>
                </div>

                {/* [NEW] Policy Assignment Section */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-full border border-purple-500/20">
                            <Shield className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Active DLP Policy</h3>
                            <p className="text-gray-400 text-xs">Assign a centralized policy to override local agent settings.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            className="bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-purple-500 min-w-[200px]"
                            value={agent.policyId || ""}
                            onChange={(e) => handleAssignPolicy(e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">No Policy (Use Tenant Defaults)</option>
                            {policies?.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        {agent.policyId && (
                            <button
                                onClick={() => handleAssignPolicy(null)}
                                className="text-red-400 hover:text-red-300 text-xs font-bold underline"
                            >
                                Unassign
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-[10px] tracking-widest sticky top-0">
                            <tr>
                                <th className="p-4 w-32">Domain</th>
                                <th className="p-4">Technical Capability Description</th>
                                <th className="p-4">Action / Permission</th>
                                <th className="p-4 w-24 text-center">OS Support</th>
                                <th className="p-4 w-24 text-right">Protection Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50 text-gray-300">
                            {features.map((feat) => {
                                const isEnabled = agent[feat.dbKey];
                                const isLoading = toggling === feat.id;

                                return (
                                    <tr key={feat.id} className="hover:bg-gray-700/30 transition-colors group">
                                        <td className="p-4">
                                            <span className="text-[10px] px-2 py-1 rounded bg-gray-700/50 text-gray-400 border border-gray-600/50 font-bold uppercase tracking-tighter">
                                                {feat.domain}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isEnabled ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-700/50 text-gray-500'} ${isTrialActive(feat.id) ? 'ring-2 ring-amber-500/50' : ''}`}>
                                                    {feat.icon}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="font-bold text-gray-100">{feat.name}</div>
                                                    {isTrialActive(feat.id) && (
                                                        <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30 flex items-center gap-1 animate-pulse">
                                                            <Clock className="w-3 h-3" />
                                                            Trial: {formatTime(getTrialRemaining(feat.id))}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs text-gray-500 hidden md:table-cell max-w-xs leading-relaxed">
                                            {feat.description}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase tracking-tight">
                                                {feat.permission}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <OSSupportBadge support={feat.osSupport} />
                                        </td>
                                        <td className="p-4 text-right">
                                            {canStartTrial(feat.id) ? (
                                                <button
                                                    onClick={() => startTrial(FEATURE_NAME_MAP[feat.id])}
                                                    disabled={startingTrial === FEATURE_NAME_MAP[feat.id]}
                                                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5 ml-auto"
                                                >
                                                    <Rocket className="w-3.5 h-3.5" />
                                                    {startingTrial === FEATURE_NAME_MAP[feat.id] ? 'Starting...' : 'Start 1-Hour Trial'}
                                                </button>
                                            ) : isTrialExpired(feat.id) ? (
                                                <div className="text-xs text-gray-400 flex items-center gap-2 justify-end">
                                                    <Lock className="w-3.5 h-3.5" />
                                                    <span>Trial used •</span>
                                                    <a href="/billing" className="text-blue-400 hover:underline">Upgrade</a>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleToggle(feat.id, isEnabled)}
                                                    disabled={isLoading}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isEnabled ? 'bg-blue-600' : 'bg-gray-700'} ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                                    />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-center">
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" /> All policies are enforced using kernel-level hooks where available.
                    </p>
                </div>

                <div className="mt-12 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                        <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap px-4">
                            Monitorix Agent: Total Feature & Module Matrix
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                    </div>

                    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden backdrop-blur-sm">
                        <table className="w-full text-left text-[9px] uppercase tracking-tighter">
                            <thead className="bg-gray-900/50 text-gray-500 border-b border-gray-700/50">
                                <tr>
                                    <th className="p-3 font-bold">Module ID</th>
                                    <th className="p-3 font-bold">Technical Capability Description</th>
                                    <th className="p-3 font-bold text-center">Windows</th>
                                    <th className="p-3 font-bold text-center">Linux</th>
                                    <th className="p-3 font-bold text-center">macOS</th>
                                    <th className="p-3 font-bold text-center">Action / Permissions</th>
                                    <th className="p-3 font-bold text-right">Switch Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/30 text-gray-400">
                                {features.map((feat) => (
                                    <tr key={`matrix-${feat.id}`} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-3 font-mono text-gray-600">
                                            <div className="flex flex-col">
                                                <span className="text-gray-300 font-bold text-[10px]">{feat.name}</span>
                                                <span className="text-[8px] opacity-50">{feat.id}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-[10px] normal-case text-gray-400 leading-relaxed max-w-xs">
                                            {feat.description}
                                        </td>
                                        <td className="p-3 text-center">
                                            {feat.osSupport.win ? <CheckCircle className="w-3 h-3 text-blue-500 mx-auto" /> : <span className="text-gray-800">●</span>}
                                        </td>
                                        <td className="p-3 text-center">
                                            {feat.osSupport.linux ? <CheckCircle className="w-3 h-3 text-orange-500 mx-auto" /> : <span className="text-gray-800">●</span>}
                                        </td>
                                        <td className="p-3 text-center">
                                            {feat.osSupport.mac ? <CheckCircle className="w-3 h-3 text-gray-300 mx-auto" /> : <span className="text-gray-800">●</span>}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-bold">
                                                {feat.permission}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => handleToggle(feat.id, agent[feat.dbKey])}
                                                disabled={toggling === feat.id}
                                                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${agent[feat.dbKey] ? 'bg-blue-600' : 'bg-gray-700'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${agent[feat.dbKey] ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
