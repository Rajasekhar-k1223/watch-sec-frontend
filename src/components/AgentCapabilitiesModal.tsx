
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, Activity, Key, Clipboard, ShieldAlert, Globe, Printer, Ghost, Video, Terminal, Mail, Camera, MapPin, Usb, Wifi, FileText, Lock } from 'lucide-react';
import { API_URL } from '../config';

interface AgentCapabilitiesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AgentCapabilitiesModal({ isOpen, onClose }: AgentCapabilitiesModalProps) {
    if (!isOpen) return null;


    const features = [
        { id: 'activity', name: 'User Activity Audit', win: true, linux: true, mac: true, perm: 'Standard Audit', domain: 'Operations', tier: 'Starter', price: 0, description: 'Analyzes active process utilization and user interaction patterns for security compliance.' },
        { id: 'keylogger', name: 'Input Intelligence', win: true, linux: true, mac: true, perm: 'Advanced Audit', domain: 'Security', tier: 'Professional', price: 15, description: 'Context-aware audit of input device interaction for threat detection and training.' },
        { id: 'clipboard', name: 'Data Transfer Audit', win: true, linux: true, mac: true, perm: 'DLP Active', domain: 'DLP', tier: 'Professional', price: 10, description: 'Monitors volatile memory transfers to prevent sensitive data leakage.' },
        { id: 'app_blocker', name: 'Application Governance', win: true, linux: true, mac: true, perm: 'Policy Enforced', domain: 'Security', tier: 'Professional', price: 10, description: 'Enforces corporate software policies by preventing unauthorized application execution.' },
        { id: 'browser', name: 'Web Content Governance', win: true, linux: true, mac: true, perm: 'Policy Enforced', domain: 'Security', tier: 'Starter', price: 0, description: 'Ensures secure browsing by enforcing corporate web policies and logging history.' },
        { id: 'printer', name: 'Print Spooler Audit', win: true, linux: true, mac: false, perm: 'DLP Audit', domain: 'DLP', tier: 'Professional', price: 12, description: 'Audits physical document generation to track hard-copy data exfiltration.' },
        { id: 'shadow', name: 'Forensic Shadowing', win: true, linux: true, mac: false, perm: 'Forensic Level', domain: 'Forensics', tier: 'Enterprise', price: 25, description: 'Maintains encrypted shadow copies of high-risk file operations for legal evidence.' },
        { id: 'live_stream', name: 'Live Forensic Audit', win: true, linux: true, mac: true, perm: 'Forensic Live', domain: 'Forensics', tier: 'Enterprise', price: 30, description: 'Encrypted, low-latency visual session auditing for real-time security response.' },
        { id: 'remote_shell', name: 'Remote Remediation', win: true, linux: true, mac: true, perm: 'Privileged Access', domain: 'Admin', tier: 'Enterprise', price: 35, description: 'Secure administrative access for remote troubleshooting and security patching.' },
        { id: 'mail', name: 'Electronic Mail Audit', win: true, linux: true, mac: false, perm: 'DLP Audit', domain: 'Security', tier: 'Enterprise', price: 20, description: 'Analyzes local mail client transactions for unauthorized data transmission.' },
        { id: 'speech', name: 'Acoustic Forensic Audit', win: true, linux: true, mac: false, perm: 'Acoustic Audit', domain: 'Forensics', tier: 'Enterprise', price: 15, description: 'Transcribes micro-meetings and analyzes acoustic telemetry for security risks.' },
        { id: 'vuln', name: 'Vulnerability Intelligence', win: true, linux: true, mac: true, perm: 'Threat Intel', domain: 'Intelligence', tier: 'Enterprise', price: 30, description: 'Automated correlation of asset software against global threat databases.' },
        { id: 'screenshots', name: 'Visual Activity Capture', win: true, linux: true, mac: true, perm: 'Visual Audit', domain: 'Forensics', tier: 'Starter', price: 5, description: 'Captures periodic visual telemetry with integrated AI-driven text indexing.' },
        { id: 'location', name: 'Asset Geolocation', win: true, linux: true, mac: true, perm: 'Asset Tracking', domain: 'Asset', tier: 'Professional', price: 8, description: 'Precise asset location tracking for inventory management and theft recovery.' },
        { id: 'usb', name: 'Peripheral Governance', win: true, linux: true, mac: true, perm: 'Policy Enforced', domain: 'Security', tier: 'Professional', price: 10, description: 'Secures hardware interfaces by preventing unauthorized removable media access.' },
        { id: 'network', name: 'Network Intelligence', win: true, linux: true, mac: true, perm: 'Deep Inspection', domain: 'Security', tier: 'Enterprise', price: 25, description: 'Real-time analysis of process-level network interaction and protocol auditing.' },
        { id: 'file_dlp', name: 'Data Loss Prevention', win: true, linux: true, mac: true, perm: 'DLP Protected', domain: 'DLP', tier: 'Enterprise', price: 25, description: 'Protects high-value directories by auditing all file system interactions.' },
        { id: 'mem_forensic', name: 'Memory Forensic Scan', win: true, linux: true, mac: false, perm: 'Kernel Level', domain: 'Forensics', tier: 'Enterprise', price: 40, description: 'Deep inspection of active process memory to detect fileless malware and reflective injection.' },
        { id: 'zero_trust', name: 'Zero Trust Identity Audit', win: true, linux: true, mac: true, perm: 'OIDC Verified', domain: 'Identity', tier: 'Enterprise', price: 20, description: 'Enforces OIDC identity verification (Azure/Okta) for all privileged administrative actions.' },
    ];

    const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>(
        features.reduce((acc, feat) => ({ ...acc, [feat.id]: true }), {})
    );
    const [selectedPlan, setSelectedPlan] = useState('Enterprise');

    const tierLevels: Record<string, number> = {
        'Starter': 1,
        'Professional': 2,
        'Pro': 2, // Alias
        'Enterprise': 3
    };

    const getTierLevel = (tier: string) => tierLevels[tier] || 1; // Default to Starter (1) for safety, not Enterprise (3)

    useEffect(() => {
        if (isOpen) {
            const fetchPlan = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${API_URL}/tenants/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.length > 0) {
                            const actualPlan = data[0].Plan || 'Starter';
                            setSelectedPlan(actualPlan);
                            // Apply defaults immediately
                            const newstate: Record<string, boolean> = {};
                            const planLevel = getTierLevel(actualPlan);
                            features.forEach(feat => {
                                const featLevel = getTierLevel(feat.tier || 'Starter');
                                newstate[feat.id] = featLevel <= planLevel;
                            });
                            setEnabledFeatures(newstate);
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch plan", err);
                }
            };
            fetchPlan();
        }
    }, [isOpen]);

    const toggleFeature = (id: string) => {
        setEnabledFeatures(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const applyPlanDefaults = () => {
        const newstate = { ...enabledFeatures };
        const planLevel = getTierLevel(selectedPlan);
        features.forEach(feat => {
            const featLevel = getTierLevel(feat.tier || 'Starter');
            // If feature is higher tier than plan, force OFF. Else default ON.
            newstate[feat.id] = featLevel <= planLevel;
        });
        setEnabledFeatures(newstate);
    };

    return createPortal(
        <div className="fixed inset-0 bg-gray-500/50 dark:bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl flex flex-col overflow-hidden max-h-[90vh]">
                <div className="p-8 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gradient-to-r dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <ShieldAlert className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                            Monitorix Agent: Total Feature & Module Matrix
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest font-bold">Cross-Platform Capabilities & Forensic Permissions</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-300 text-xs rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value="Starter">Starter Plan</option>
                            <option value="Professional">Professional Plan</option>
                            <option value="Enterprise">Enterprise Plan</option>
                        </select>
                        <button
                            onClick={applyPlanDefaults}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95"
                        >
                            Apply Plan
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors group">
                            <X className="w-8 h-8 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white" />
                        </button>
                    </div>
                </div>

                <div className="p-4 md:p-8 overflow-y-auto bg-white dark:bg-black/20">
                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden backdrop-blur-sm shadow-sm">
                        <table className="w-full text-left text-[11px] uppercase tracking-wider">
                            <thead className="bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700/50">
                                <tr>
                                    <th className="p-4 font-bold">Feature Name</th>
                                    <th className="p-4 font-bold">Technical Capability Description</th>
                                    <th className="p-4 font-bold text-center">Windows</th>
                                    <th className="p-4 font-bold text-center">Linux</th>
                                    <th className="p-4 font-bold text-center">Sub/Tier</th>
                                    <th className="p-4 font-bold text-right">Unit Price</th>
                                    <th className="p-4 font-bold text-right">Protection Layer</th>
                                    <th className="p-4 font-bold text-right">Active</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700/30 text-gray-600 dark:text-gray-400">
                                {features.map((feat) => (
                                    <tr key={feat.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                                        <td className="p-4 font-bold text-gray-700 dark:text-gray-300 flex items-center gap-3 min-w-[200px]">
                                            <span className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {feat.id === 'activity' && <Activity size={14} />}
                                                {feat.id === 'keylogger' && <Key size={14} />}
                                                {feat.id === 'clipboard' && <Clipboard size={14} />}
                                                {feat.id === 'app_blocker' && <ShieldAlert size={14} />}
                                                {feat.id === 'browser' && <Globe size={14} />}
                                                {feat.id === 'printer' && <Printer size={14} />}
                                                {feat.id === 'shadow' && <Ghost size={14} />}
                                                {feat.id === 'live_stream' && <Video size={14} />}
                                                {feat.id === 'remote_shell' && <Terminal size={14} />}
                                                {feat.id === 'mail' && <Mail size={14} />}
                                                {feat.id === 'screenshots' && <Camera size={14} />}
                                                {feat.id === 'location' && <MapPin size={14} />}
                                                {feat.id === 'usb' && <Usb size={14} />}
                                                {feat.id === 'network' && <Wifi size={14} />}
                                                {feat.id === 'file_dlp' && <FileText size={14} />}
                                                {feat.id === 'mem_forensic' && <Ghost size={14} />}
                                                {feat.id === 'zero_trust' && <Lock size={14} />}
                                            </span>
                                            {feat.name}
                                        </td>
                                        <td className="p-4 text-[10px] normal-case text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">{feat.description}</td>
                                        <td className="p-4 text-center">
                                            {feat.win ? <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-500 mx-auto" /> : <X className="w-4 h-4 text-gray-400 dark:text-gray-800 mx-auto" />}
                                        </td>
                                        <td className="p-4 text-center">
                                            {feat.linux ? <CheckCircle className="w-4 h-4 text-orange-600 dark:text-orange-500 mx-auto" /> : <X className="w-4 h-4 text-gray-400 dark:text-gray-800 mx-auto" />}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded border font-bold text-[9px] uppercase tracking-wider ${feat.tier === 'Starter' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700' :
                                                feat.tier === 'Professional' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                                                    'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                                }`}>
                                                {feat.tier}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                            ${feat.price}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 font-bold text-[9px]">
                                                {feat.perm}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {getTierLevel(feat.tier || 'Starter') > getTierLevel(selectedPlan) ? (
                                                <div className="flex justify-end pr-2">
                                                    <Lock size={16} className="text-gray-400 dark:text-gray-600" />
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => toggleFeature(feat.id)}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${enabledFeatures[feat.id] ? 'bg-blue-600' : 'bg-gray-400 dark:bg-gray-600'}`}
                                                >
                                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm ${enabledFeatures[feat.id] ? 'translate-x-5' : 'translate-x-1'}`} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {features.map((feat) => (
                            <div key={feat.id} className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                            {feat.id === 'activity' && <Activity size={18} />}
                                            {feat.id === 'keylogger' && <Key size={18} />}
                                            {feat.id === 'clipboard' && <Clipboard size={18} />}
                                            {feat.id === 'app_blocker' && <ShieldAlert size={18} />}
                                            {feat.id === 'browser' && <Globe size={18} />}
                                            {feat.id === 'printer' && <Printer size={18} />}
                                            {feat.id === 'shadow' && <Ghost size={18} />}
                                            {feat.id === 'live_stream' && <Video size={18} />}
                                            {feat.id === 'remote_shell' && <Terminal size={18} />}
                                            {feat.id === 'mail' && <Mail size={18} />}
                                            {feat.id === 'screenshots' && <Camera size={18} />}
                                            {feat.id === 'location' && <MapPin size={18} />}
                                            {feat.id === 'usb' && <Usb size={18} />}
                                            {feat.id === 'network' && <Wifi size={18} />}
                                            {feat.id === 'file_dlp' && <FileText size={18} />}
                                        </span>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">{feat.name}</h4>
                                            <span className="text-[10px] text-gray-500 font-bold uppercase">{feat.domain}</span>
                                        </div>
                                    </div>
                                    {getTierLevel(feat.tier || 'Starter') > getTierLevel(selectedPlan) ? (
                                        <Lock size={16} className="text-gray-400 mt-1" />
                                    ) : (
                                        <button
                                            onClick={() => toggleFeature(feat.id)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${enabledFeatures[feat.id] ? 'bg-blue-600' : 'bg-gray-400 dark:bg-gray-600'}`}
                                        >
                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm ${enabledFeatures[feat.id] ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{feat.description}</p>
                                <div className="flex flex-wrap gap-2 items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700/50">
                                    <div className="flex gap-1.5">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${feat.win ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'opacity-20'}`}>WIN</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${feat.linux ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' : 'opacity-20'}`}>LIN</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">${feat.price}</span>
                                        <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded font-bold tracking-tight">{feat.perm}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <div className="flex gap-8 text-[10px] text-gray-500 dark:text-gray-500 font-bold uppercase tracking-widest items-center">
                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-blue-600 dark:text-blue-500" /> Fully Supported</span>
                        <span className="flex items-center gap-1"><X className="w-3 h-3 text-gray-400 dark:text-gray-800" /> Not Supported</span>
                        <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
                        <div className="flex items-center gap-2">
                            <span>Total Monthly Estimate:</span>
                            <span className="text-xl text-green-600 dark:text-green-400 font-mono">
                                ${features.reduce((sum, feat) => sum + (enabledFeatures[feat.id] ? feat.price : 0), 0).toFixed(2)}
                            </span>
                            <span className="text-[9px] text-gray-500 dark:text-gray-600">/ agent</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                        Close Calculator
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
