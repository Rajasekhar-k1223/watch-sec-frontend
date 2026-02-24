
import { Monitor, Server, Wifi, WifiOff, AlertTriangle, X, List, Image, Maximize2, Minimize2, Download, Trash2, Video, StopCircle, Cpu, Activity, MousePointer, FileText, MapPin, MapPinOff, Usb, Zap, Search, RefreshCw, Calendar, Lock, ShieldCheck, ChevronDown, Check, Camera, CameraOff } from 'lucide-react';
import RemoteDesktop from '../components/RemoteDesktop';
import ScreenshotsGallery from '../components/ScreenshotsGallery';
import ActivityLogViewer from '../components/ActivityLogViewer';
import AgentCapabilitiesModal from '../components/AgentCapabilitiesModal'; // [NEW]
import SpeechLogViewer from '../components/SpeechLogViewer'; // [NEW]
// import MailProcessing from './MailProcessing.tsx'; 
import MailLogViewer from '../components/MailLogViewer';
import FeaturePolicyManager from '../components/FeaturePolicyManager';
import ShadowVault from '../components/ShadowVault';
import AgentSecurityLedger from '../components/AgentSecurityLedger'; // [NEW]
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { API_URL, SOCKET_URL } from '../config';
import { Analytics } from '../services/analytics';

// [v1.8.2] Dynamic Versioning: Fetched via API

interface AgentReport {
    id: number;
    agentId: string;
    tenantId: number;
    status: string;
    cpuUsage: number;
    memoryUsage: number;
    timestamp: string;
    hostname: string;
    locationTrackingEnabled: boolean;
    usbBlockingEnabled: boolean;
    networkMonitoringEnabled: boolean;
    fileDlpEnabled: boolean;
    hardwareJson?: string;
    powerStatusJson?: string; // [NEW]
    version?: string;
    targetVersion?: string;
    screenshotsEnabled?: boolean;
    screenshotsQuality?: number;
    screenshotsResolution?: string;
    activityMonitorEnabled?: boolean;
    keyloggerEnabled?: boolean;
    clipboardMonitorEnabled?: boolean;
    appBlockerEnabled?: boolean;
    browserEnforcerEnabled?: boolean;
    printerMonitorEnabled?: boolean;
    shadowMonitorEnabled?: boolean;
    liveStreamEnabled?: boolean;
    remoteShellEnabled?: boolean;
    mailMonitorEnabled?: boolean;
    updateStatus?: string;
    updateFailureReason?: string;
    lastUpdateAttempt?: string;
    policyId?: number; // [NEW]
}

interface DashStats {
    active_agents: number;
    total_alerts: number;
    today_events: number;
    security_score: number;
    incidents_trend: any[];
    threat_level: string;
    recentLogs?: any[];
    agents?: { online: number; total: number; offline: number };
    resources?: { trend: any[] };
    threats?: { total: number; total24h: number; trend: any[] };
}

interface AgentEvent {
    type: string;
    details: string;
    timestamp: string;
    isMetric?: boolean;
    cpu?: number;
    mem?: number;
    RiskLevel?: string;
    Category?: string;
}

// Helper for consistent date parsing (SQL -> ISO UTC -> Local)
const normalizeTimestamp = (ts: any) => {
    if (!ts) return "";
    let str = String(ts).trim();
    // Fix SQL format "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
    if (str.includes(' ') && !str.includes('T')) str = str.replace(' ', 'T');

    // Ensure UTC 'Z' if missing timezone info (check for Z or +HH:mm / -HH:mm)
    // Previous bug: !str.includes('-') failed because date 'YYYY-MM-DD' has hyphens
    const hasTimezone = str.endsWith('Z') || /[+-]\d{2}(:?\d{2})?$/.test(str);
    if (!hasTimezone) str += 'Z';

    return str;
};

// [NEW] Feature Matrix for UI Enforcement
const PLAN_LEVELS: Record<string, number> = {
    "Starter": 1,
    "Professional": 2,
    "Pro": 2, // Alias
    "Enterprise": 3,
    "Unlimited": 100
};

const FEATURE_TIERS: Record<string, number> = {
    "activity": 1,
    "screenshots": 1,
    "browser": 1,
    "keylogger": 2,
    "clipboard": 2,
    "app_blocker": 2,
    "printer": 2,
    "location": 2,
    "usb": 2,
    "shadow": 3,
    "live_stream": 3,
    "remote_shell": 3,
    "mail": 3,
    "network": 3,
    "file_dlp": 3,
    "speech": 3,
    "vuln": 3
};

const TAB_TABS = [
    { id: 'logs', label: 'Logs', feat: null },
    { id: 'monitor', label: 'Monitor', feat: null },
    { id: 'remote', label: 'Remote', feat: 'remote_shell' },
    { id: 'screenshots', label: 'Screenshots', feat: 'screenshots' },
    { id: 'activity', label: 'Activity', feat: 'activity' },
    { id: 'mail', label: 'Mail', feat: 'mail' },
    { id: 'speech', label: 'Speech', feat: 'speech' },
    { id: 'vuln', label: 'Security', feat: 'vuln' },
    { id: 'specs', label: 'Specs', feat: null },
    { id: 'apps', label: 'Apps', feat: 'app_blocker' },
    { id: 'vault', label: 'Vault', feat: 'shadow' },
    { id: 'policy', label: 'Policy', feat: null, role: 'TenantAdmin' }
];

export default function Agents() {
    const { user, token, logout } = useAuth();
    const [agents, setAgents] = useState<AgentReport[]>([]);
    const [policies, setPolicies] = useState<any[]>([]); // [NEW]
    const [loading, setLoading] = useState(true);
    // [UNREACHABLE] Unused in current build, commented to unblock CI
    // const [assignPolicyId, setAssignPolicyId] = useState<number | null>(null); 
    // const [selectedPolicy, setSelectedPolicy] = useState<number | string>(""); 

    const [stats, setStats] = useState<DashStats | null>(null);
    const [selectedDate, setSelectedDate] = useState(''); // Default to empty for rolling 24h
    const [agentSearch, setAgentSearch] = useState('');

    const [latestVersion, setLatestVersion] = useState("v1.8.1"); // Default fallback
    const [updateProgressMap, setUpdateProgressMap] = useState<Record<string, number>>({});
    const updateTimeouts = useRef<Record<string, any>>({});



    // [NEW] Plan State
    const [currentPlan, setCurrentPlan] = useState<string>("Starter");
    const [planLevel, setPlanLevel] = useState<number>(1);

    const isFeatureLocked = (featureKey: string) => {
        // Super Admins override? Maybe not, simulate plan strictly.
        // User.role check? If TenantAdmin, enforce plan.
        const req = FEATURE_TIERS[featureKey] || 3;
        return planLevel < req;
    };

    const [modalStartDate, setModalStartDate] = useState(() => {
        const d = new Date();
        d.setHours(d.getHours() - 24);
        return d.toISOString().split('T')[0];
    });
    const [modalEndDate, setModalEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const setModalQuickFilter = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        setModalStartDate(start.toISOString().split('T')[0]);
        setModalEndDate(end.toISOString().split('T')[0]);
    };

    const fetchStats = useCallback(async (dateStr?: string) => {
        try {
            let url = `${API_URL}/dashboard/stats?hours=24`;
            if (dateStr) {
                // Ensure we request the full UTC day corresponding to the selected date string (YYYY-MM-DD)
                const from = `${dateStr}T00:00:00Z`;
                const to = `${dateStr}T23:59:59Z`;
                url = `${API_URL}/dashboard/stats?from_date=${from}&to_date=${to}`;
            }
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                console.log("[Agents] Dashboard Stats (24h Data):", data);
                setStats(data);
            }
        } catch (e) { console.error("Stats error", e); }
    }, [token]);

    // [v1.8.2] Fetch LATEST_AGENT_VERSION from Backend
    useEffect(() => {
        const fetchVersions = async () => {
            try {
                const res = await fetch(`${API_URL}/agents/config/versions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setLatestVersion(data.latest);
                }
            } catch (e) {
                console.error("[Agents] Version fetch error:", e);
            }
        };
        if (token) fetchVersions();
    }, [token]);

    useEffect(() => {
        // [NEW] Fetch Tenant Plan
        if (token && user?.tenantId) {
            // [FIX] Cache bust and Capitalized 'Plan' property
            fetch(`${API_URL}/billing/?t=${Date.now()}`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => {
                    const p = data.Plan || data.plan || "Starter"; // Try both to be safe
                    console.log("[Agents] Plan Fetched:", p);
                    setCurrentPlan(p);
                    setPlanLevel(PLAN_LEVELS[p] || 1);
                })
                .catch(e => console.error("Failed to fetch plan", e));
        }

        fetchAgents();
        fetchPolicies(); // [NEW]
        fetchStats(selectedDate);
        const interval = setInterval(() => { fetchAgents(); fetchStats(selectedDate); }, 10000);
        return () => clearInterval(interval);
    }, [fetchStats, selectedDate, token, user?.tenantId]);

    // [NEW] Fetch Policies for Dropdown
    const fetchPolicies = async () => {
        try {
            const res = await fetch(`${API_URL}/policies?tenantId=${user?.tenantId || 1}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setPolicies(await res.json());
        } catch (e) { console.error(e); }
    };

    // [NEW] Handle Policy Assignment (Commented to resolve TS6133)
    /*
    const handleAssignPolicy = async () => {
        if (!assignPolicyId) return;
        try {
            const pid = selectedPolicy === "" ? null : Number(selectedPolicy);
            const res = await fetch(`${API_URL}/agents/${agents.find(a => a.id === assignPolicyId)?.agentId}/policy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ policyId: pid })
            });

            if (res.ok) {
                toast.success("Policy assigned successfully");
                setAssignPolicyId(null);
                fetchAgents();
            } else {
                toast.error("Failed to assign policy");
            }
        } catch (e) { console.error(e); }
    };
    */

    const fetchAgents = async () => {
        try {
            const query = user?.tenantId ? `?tenantId=${user.tenantId}` : '';
            if (!token) return;
            // Use standard /agents endpoint instead of dashboard status
            const res = await fetch(`${API_URL}/agents${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                logout();
                return;
            }
            if (res.ok) {
                const data = await res.json();
                console.log("[Agents] Raw API Data:", data);
                const normalizedData: AgentReport[] = (Array.isArray(data) ? data : []).map((a: any) => {
                    return {
                        id: a.id || a.Id,
                        status: a.status || a.Status || 'Unknown',
                        cpuUsage: a.cpuUsage ?? a.CpuUsage ?? 0,
                        memoryUsage: a.memoryUsage ?? a.MemoryUsage ?? 0,
                        timestamp: normalizeTimestamp(a.timestamp || a.Timestamp || a.lastSeen || a.LastSeen),
                        tenantId: a.tenantId ?? a.TenantId ?? 0,
                        agentId: a.agentId || a.AgentId || 'Unknown',
                        hostname: a.hostname || a.Hostname || 'Unknown',
                        locationTrackingEnabled: a.locationTrackingEnabled ?? a.LocationTrackingEnabled ?? false,
                        usbBlockingEnabled: a.usbBlockingEnabled ?? a.UsbBlockingEnabled ?? false,
                        networkMonitoringEnabled: a.networkMonitoringEnabled ?? a.NetworkMonitoringEnabled ?? false,
                        fileDlpEnabled: a.fileDlpEnabled ?? a.FileDlpEnabled ?? false,
                        hardwareJson: a.hardwareJson || a.HardwareJson,
                        powerStatusJson: a.powerStatusJson || a.PowerStatusJson,
                        version: a.version || a.Version || '1.0.0',
                        targetVersion: a.targetVersion || a.TargetVersion || '1.0.0',
                        screenshotsEnabled: a.screenshotsEnabled ?? a.ScreenshotsEnabled ?? false,
                        screenshotsQuality: a.screenshotsQuality ?? a.ScreenshotQuality ?? 80,
                        screenshotsResolution: a.screenshotsResolution ?? a.ScreenshotResolution ?? 'Original',
                        activityMonitorEnabled: a.activityMonitorEnabled ?? a.ActivityMonitorEnabled ?? true,
                        keyloggerEnabled: a.keyloggerEnabled ?? a.KeyloggerEnabled ?? false,
                        clipboardMonitorEnabled: a.clipboardMonitorEnabled ?? a.ClipboardMonitorEnabled ?? false,
                        appBlockerEnabled: a.appBlockerEnabled ?? a.AppBlockerEnabled ?? false,
                        browserEnforcerEnabled: a.browserEnforcerEnabled ?? a.BrowserEnforcerEnabled ?? false,
                        printerMonitorEnabled: a.printerMonitorEnabled ?? a.PrinterMonitorEnabled ?? false,
                        shadowMonitorEnabled: a.shadowMonitorEnabled ?? a.ShadowMonitorEnabled ?? false,
                        liveStreamEnabled: a.liveStreamEnabled ?? a.LiveStreamEnabled ?? true,
                        remoteShellEnabled: a.remoteShellEnabled ?? a.RemoteShellEnabled ?? true,
                        mailMonitorEnabled: a.mailMonitorEnabled ?? a.MailMonitorEnabled ?? false,
                        speechMonitorEnabled: a.speechMonitorEnabled ?? a.SpeechMonitorEnabled ?? false,
                        vulnerabilityIntelligenceEnabled: a.vulnerabilityIntelligenceEnabled ?? a.VulnerabilityIntelligenceEnabled ?? false,
                        policyId: a.policyId ?? a.PolicyId // [NEW]
                    };
                });

                // Sort: Online first, then by timestamp desc
                normalizedData.sort((a: AgentReport, b: AgentReport) => {
                    if (a.status === 'Online' && b.status !== 'Online') return -1;
                    if (a.status !== 'Online' && b.status === 'Online') return 1;
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                });

                setAgents(normalizedData);
            }
        } catch (e) {
            console.error("Failed to fetch agents", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleAgentSetting = async (agentId: string, feature: string, enabled: boolean) => {
        try {
            const res = await fetch(`${API_URL}/agents/${agentId}/toggle-feature?feature=${feature}&enabled=${enabled}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchAgents();
        } catch (error) {
            console.error("Failed to toggle setting", error);
        }
    };

    const filteredAgents = useMemo(() => {
        return agents.filter(a =>
            (a.hostname || '').toLowerCase().includes(agentSearch.toLowerCase()) ||
            (a.agentId || '').toLowerCase().includes(agentSearch.toLowerCase()) ||
            (a.status || '').toLowerCase().includes(agentSearch.toLowerCase())
        );
    }, [agents, agentSearch]);

    const handleToggleNetwork = async (agentId: string, currentStatus: boolean) => {
        if (isFeatureLocked('network')) {
            toast.error(`Upgrade specific to ${currentPlan} Plan required for Network Monitoring.`);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/agents/${agentId}/toggle-network?enabled=${!currentStatus}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchAgents();
        } catch (e) { console.error(e); }
    };

    const handleToggleFile = async (agentId: string, currentStatus: boolean) => {
        if (isFeatureLocked('file_dlp')) {
            toast.error(`Upgrade specific to ${currentPlan} Plan required for File DLP.`);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/agents/${agentId}/toggle-file-dlp?enabled=${!currentStatus}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchAgents();
        } catch (e) { console.error(e); }
    };

    const handleUpdateAgent = async (agentId: string) => {
        if (!window.confirm("Trigger remote software update for this agent?")) return;

        // [v1.7.0] Optimistic UI & Timeout
        setUpdateProgressMap(prev => ({ ...prev, [agentId]: 1 })); // Start at 1%

        // Clear existing timeout
        if (updateTimeouts.current[agentId]) clearTimeout(updateTimeouts.current[agentId]);

        // Set 5m Timeout
        updateTimeouts.current[agentId] = setTimeout(() => {
            toast.error(`Update for ${agentId} timed out (5m). Resetting status.`);
            setUpdateProgressMap(prev => {
                const next = { ...prev };
                delete next[agentId];
                return next;
            });
        }, 300000);

        try {
            const res = await fetch(`${API_URL}/agents/${agentId}/update`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Update command sent to agent.");
                fetchAgents();
            } else {
                if (res.status === 429) {
                    toast.error("Rate limit exceeded. Please wait."); // [v1.7.0] Rate Limit Feedback
                } else {
                    toast.error("Failed to trigger update.");
                }
                // Revert optimistic state on failure
                setUpdateProgressMap(prev => {
                    const next = { ...prev };
                    delete next[agentId];
                    return next;
                });
                clearTimeout(updateTimeouts.current[agentId]);
            }
        } catch (e) {
            console.error(e);
            setUpdateProgressMap(prev => {
                const next = { ...prev };
                delete next[agentId];
                return next;
            });
            clearTimeout(updateTimeouts.current[agentId]);
        }
    };
    // ... 
    // [NEW] Toggle USB
    const handleToggleUsb = async (agentId: string, currentStatus: boolean) => {
        if (isFeatureLocked('usb')) {
            toast.error(`Upgrade specific to ${currentPlan} Plan required for USB Blocking.`);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/agents/${agentId}/toggle-usb?enabled=${!currentStatus}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchAgents();
                Analytics.track('Toggle USB Block', { agentId, enabled: !currentStatus });
            }
        } catch (e) {
            console.error("Failed to toggle USB", e);
        }
    };

    const handleToggleScreenshots = async (agentId: string, currentStatus: boolean) => {
        if (isFeatureLocked('screenshots')) {
            toast.error(`Upgrade specific to ${currentPlan} Plan required for Screenshots.`);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/agents/${agentId}/toggle-screenshots?enabled=${!currentStatus}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchAgents();
                toast.success(`Screenshots ${!currentStatus ? 'Enabled' : 'Disabled'} for ${agentId}`);
                Analytics.track('Toggle Screenshots', { agentId, enabled: !currentStatus });
            }
        } catch (e) {
            console.error("Failed to toggle screenshots", e);
        }
    };


    const [showDeployModal, setShowDeployModal] = useState(false);
    const [deployOS, setDeployOS] = useState<'windows' | 'linux' | 'mac'>('windows');
    // const [showOtpModal, setShowOtpModal] = useState(false);
    // const [otpToken, setOtpToken] = useState<string | null>(null);
    const [tenantApiKey, setTenantApiKey] = useState<string | null>(null);

    const [showCapabilities, setShowCapabilities] = useState(false); // [NEW]




    useEffect(() => {
        if (showDeployModal && !tenantApiKey && token) {
            fetch(`${API_URL}/tenants/api-key`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setTenantApiKey(data.apiKey))
                .catch(e => console.error("Failed to fetch API key", e));
        }
    }, [showDeployModal, token, tenantApiKey]);

    // WebRTC Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);




    /*
    const handleGenerateToken = async () => {
        try {
            const res = await fetch(`${API_URL}/install/token`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOtpToken(data.token);
                setShowOtpModal(true);
            }
        } catch (e) {
            console.error("Failed to generate OTP", e);
        }
    };
    */

    // const [isDownloading, setIsDownloading] = useState(false);

    /*
    const handleDownload = async (os: string) => {
        setIsDownloading(true);
        try {
            let downloadUrl = '';
            let filename = '';

            if (os === 'windows') {
                // [UPDATED] Use Zip Bundle to bypass browser blocks and auto-install Root CA
                downloadUrl = `${API_URL}/downloads/installer/exe?key=${tenantApiKey}&format=zip`;
                filename = `monitorix-installer-${tenantApiKey}.zip`;
                toast.success("Download Started!\n\nNOTE: The zip is password protected to avoid browser blocking.\n\nPassword: monitorix\n\n1. Unzip using password 'monitorix'.\n2. Run 'install.bat' to install safely.");
            } else {
                downloadUrl = `${API_URL}/downloads/public/agent?key=${tenantApiKey}&os_type=${os}&payload=false`;
                filename = 'monitorix-installer.sh';
            }

            const res = await fetch(downloadUrl);

            if (!res.ok) throw new Error("Download failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            Analytics.track('Download Installer', { os: os });
        } catch (e) {
            console.error("Download error:", e);
            Analytics.track('Download Installer Failed', { os: os, error: e });
            toast.error("Failed to download agent. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };
    */

    // [NEW] Toggle Location
    const handleToggleLocation = async (agentId: string, currentStatus: boolean) => {
        if (isFeatureLocked('location')) {
            toast.error(`Upgrade specific to ${currentPlan} Plan required for Location Tracking.`);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/agents/${agentId}/toggle-location?enabled=${!currentStatus}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchAgents(); // Refresh list
                Analytics.track('Toggle Location', { agentId, enabled: !currentStatus });
            }
        } catch (e) {
            console.error("Failed to toggle location", e);
        }
    };

    const handleDelete = async (identifier: number | string) => {
        let finalId = identifier;

        // Fallback: If passed null/undefined, try to find the agent string ID from the list
        if (!finalId) {
            console.error("[Agents] Delete called with invalid ID");
            toast.error("Error: Invalid Agent ID.");
            return;
        }

        if (!confirm(`Are you sure you want to delete this agent (${finalId})? This action cannot be undone.`)) return;

        try {
            const res = await fetch(`${API_URL}/agents/${finalId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchAgents();
                Analytics.track('Delete Agent', { id: finalId });
            } else {
                const err = await res.json();
                toast.error(`Failed to delete agent: ${err.detail || 'Unknown error'}`);
            }
        } catch (e) {
            console.error("Delete failed", e);
            toast.error("Delete request failed.");
        }
    };

    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'logs' | 'monitor' | 'activity' | 'screenshots' | 'mail' | 'remote' | 'specs' | 'apps' | 'vault' | 'policy' | 'speech' | 'vuln' | null>(null);
    const [events, setEvents] = useState<AgentEvent[]>([]);
    const [showGraphs, setShowGraphs] = useState(false);
    const [logFilter, setLogFilter] = useState(''); // [NEW] Filter State: Text
    const [eventTypeFilter, setEventTypeFilter] = useState('All'); // [NEW] Filter State: Dropdown

    // Get Unique Event Types (Memoized)
    const eventTypes = useMemo(() => {
        const types = new Set(events.map(e => e.type));
        return ['All', ...Array.from(types)].sort();
    }, [events]);

    const filteredEvents = useMemo(() => {
        let res = events;
        // 1. Type Filter
        if (eventTypeFilter !== 'All') {
            res = res.filter(e => e.type === eventTypeFilter);
        }
        // 2. Text Filter
        if (logFilter) {
            const lower = logFilter.toLowerCase();
            res = res.filter(e =>
                (e.type || '').toLowerCase().includes(lower) ||
                (e.details || '').toLowerCase().includes(lower)
            );
        }
        return res;
    }, [events, logFilter, eventTypeFilter]);

    // Live Screen State
    const [isScreenMaximized, setIsScreenMaximized] = useState(false);
    const [liveScreen, setLiveScreen] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [socketStatus, setSocketStatus] = useState<string>('Disconnected');
    const socketRef = useRef<any>(null); // socketio types are complex, any is okayish here but let's keep it for now

    // Recording Logic
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const handleStartRecording = () => {
        if (!remoteStreamRef.current) return;

        try {
            const recorder = new MediaRecorder(remoteStreamRef.current);
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `recording-${selectedAgentId}-${new Date().toISOString()}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                chunksRef.current = [];
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
        } catch (err) {
            console.error("Failed to start recording:", err);
            toast.error("Failed to start recording.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    useEffect(() => {
        if (liveScreen && remoteStreamRef.current && videoRef.current) {
            const videoEl = videoRef.current;
            if (videoEl.srcObject !== remoteStreamRef.current) {
                videoEl.srcObject = remoteStreamRef.current;
            }
            videoEl.play().catch(e => {
                if (e.name !== 'AbortError') console.error("[Agents.tsx] Play error:", e);
            });
        }
    }, [liveScreen]);

    useEffect(() => {
        if (!selectedAgentId) return;

        const fetchData = async () => {
            try {
                const params = new URLSearchParams();
                if (modalStartDate) params.append('start_date', modalStartDate + "T00:00:00");
                if (modalEndDate) params.append('end_date', modalEndDate + "T23:59:59");

                // 1. Fetch Security Events
                const eventsRes = await fetch(`${API_URL}/events/${selectedAgentId}?${params.toString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                let eventsData = await eventsRes.json();

                // Normalize Events
                const normalizedEvents = eventsData.map((e: any) => ({
                    ...e,
                    timestamp: normalizeTimestamp(e.timestamp || e.Timestamp)
                }));

                // 2. Fetch Metrics History
                const historyRes = await fetch(`${API_URL}/history/${selectedAgentId}?${params.toString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                let historyData: AgentReport[] = await historyRes.json();
                if (!Array.isArray(historyData)) historyData = [];

                // 3. Fetch Activity Logs (Merged View) [NEW]
                const activityRes = await fetch(`${API_URL}/events/activity/${selectedAgentId}?${params.toString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                let activityData = [];
                if (activityRes.ok) {
                    activityData = await activityRes.json();
                }

                // 4. Merge and Sort
                const historyAsEvents: AgentEvent[] = historyData.map((h: any) => {
                    const status = h.status || h.Status || 'Unknown';
                    let cpu = h.cpuUsage ?? h.CpuUsage ?? 0;
                    let mem = h.memoryUsage ?? h.MemoryUsage ?? 0;

                    return {
                        type: "System Heartbeat",
                        details: `Status: ${status} | CPU: ${Number(cpu).toFixed(1)}% | MEM: ${Number(mem).toFixed(1)}MB`,
                        timestamp: normalizeTimestamp(h.timestamp || h.Timestamp),
                        isMetric: true,
                        cpu: Number(cpu),
                        mem: Number(mem)
                    };
                });

                const activityAsEvents: AgentEvent[] = (Array.isArray(activityData) ? activityData : []).map((a: any) => ({
                    type: a.ActivityType || 'Activity',
                    details: `${a.ProcessName || ''} - ${a.WindowTitle || a.Url || ''}`.trim(),
                    timestamp: normalizeTimestamp(a.Timestamp),
                    RiskLevel: a.RiskLevel,
                    Category: a.Category
                }));

                let combined = [...normalizedEvents, ...historyAsEvents, ...activityAsEvents];

                // [FIX] Remove Gaps (Empty Type/Details) and duplicates (optional)
                combined = combined.filter(c => c.type && c.details && c.details.length > 1);

                combined.sort((a, b) => {
                    const timeA = new Date(a.timestamp).getTime();
                    const timeB = new Date(b.timestamp).getTime();
                    if (timeB !== timeA) return timeB - timeA;
                    // Tie-breaker: Type then Details
                    return (a.type || '').localeCompare(b.type || '') || (a.details || '').localeCompare(b.details || '');
                });

                setEvents(combined);
            } catch (err) {
                console.error("Failed to fetch logs/history", err);
            }
        };

        fetchData();

        const socket = io(SOCKET_URL, {
            auth: { token: token }, // Pass token in auth object for better compatibility
            query: { token: token }, // Keep query for fallback
            transports: ['polling', 'websocket']
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setSocketStatus('Connected');
            // [DEBUG] Log user state to backend
            socket.emit("client_debug", { component: 'Agents', user: user, token: token ? 'HAS_TOKEN' : 'NO_TOKEN' });

            socket.emit("client_debug", { component: 'ActivityLogViewer', user: user, agentId: selectedAgentId });

            // Join the tenant room to receive activity updates
            if (user?.tenantId) {
                socket.emit("join_room", { room: `tenant_${user.tenantId}` });
            }
        });

        socket.on("disconnect", () => setSocketStatus('Disconnected'));

        socket.on("ReceiveScreen", (agentId: string, base64: string) => {
            if (selectedAgentId && agentId.toLowerCase() === selectedAgentId.toLowerCase()) {
                setLiveScreen(base64);
            }
        });

        socket.on("ReceiveEvent", (data: any) => {
            const agentId = data.agentId || data.AgentId;
            const title = data.title || data.Type || 'Info';
            const details = data.details || data.Details || '';
            const timestamp = normalizeTimestamp(data.timestamp || data.Timestamp);

            if (agentId && selectedAgentId && agentId.toLowerCase() === selectedAgentId.toLowerCase()) {
                setEvents(prev => [{ type: title, details, timestamp }, ...prev]);
            }
        });

        socket.on("agent_list_update", (updatedAgent: any) => {
            setAgents(prev => {
                const index = prev.findIndex(a => a.agentId === updatedAgent.agentId);
                if (index === -1) return prev;

                // [v1.7.0] Clear progress if update finished
                if (updatedAgent.version && updatedAgent.targetVersion && updatedAgent.version === updatedAgent.targetVersion) {
                    setUpdateProgressMap(prevMap => {
                        const next = { ...prevMap };
                        delete next[updatedAgent.agentId];
                        return next;
                    });
                    if (updateTimeouts.current[updatedAgent.agentId]) {
                        clearTimeout(updateTimeouts.current[updatedAgent.agentId]);
                    }
                }

                const next = [...prev];
                next[index] = {
                    ...next[index],
                    status: updatedAgent.status || next[index].status,
                    hostname: updatedAgent.hostname || next[index].hostname,
                    version: updatedAgent.version || next[index].version,
                    targetVersion: updatedAgent.targetVersion || next[index].targetVersion,
                    cpuUsage: updatedAgent.cpuUsage ?? next[index].cpuUsage,
                    memoryUsage: updatedAgent.memoryUsage ?? next[index].memoryUsage,
                    powerStatusJson: updatedAgent.powerStatusJson ?? next[index].powerStatusJson,
                    timestamp: normalizeTimestamp(updatedAgent.timestamp || next[index].timestamp)
                };
                return next;
            });
        });

        // [v1.7.0] Progress Event
        socket.on("update_progress", (data: { agentId: string, progress: number }) => {
            setUpdateProgressMap(prev => ({ ...prev, [data.agentId]: data.progress }));
        });

        socket.on("dashboard_stats_update", (payload: any) => {
            if (payload.type === 'resource' && payload.data) {
                setStats(prev => {
                    if (!prev) return null;
                    const next = { ...prev };

                    // Append new point to trend
                    const newPoint = {
                        time: payload.data.time,
                        cpu: payload.data.cpu,
                        mem: payload.data.mem
                    };

                    // Update Resource Trend
                    if (next.resources) {
                        next.resources = {
                            ...next.resources,
                            trend: [...(next.resources.trend || []), newPoint]
                        };
                    }

                    // Update Agent Counts dynamically if needed (Online/Offline status requires separate event, but strictly resources here)

                    return next;
                });
            }
        });

        socket.on("webrtc_offer", async (data: any) => {
            if (pcRef.current) pcRef.current.close();
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            pcRef.current = pc;

            pc.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    remoteStreamRef.current = event.streams[0];
                    setLiveScreen(event.streams[0].id);
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice_candidate', {
                        target: selectedAgentId,
                        candidate: event.candidate
                    });
                }
            };

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('webrtc_answer', {
                    target: selectedAgentId,
                    sdp: answer.sdp,
                    type: answer.type
                });
            } catch (err) {
                console.error("[Agents.tsx] WebRTC Error:", err);
            }
        });

        socket.on('ice_candidate', async (data) => {
            if (pcRef.current) {
                try {
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) { console.error("Error adding ICE:", e); }
            }
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            setLiveScreen(null);
            setEvents([]);
            setIsStreaming(false);
        };
    }, [selectedAgentId, token, user?.tenantId, SOCKET_URL, modalStartDate, modalEndDate]);

    const handleViewLogs = (agentId: string) => {
        setSelectedAgentId(agentId);
        setViewMode('logs');
        Analytics.track('View Logs', { agentId: agentId });
    };

    const handleMonitor = (agentId: string) => {
        setSelectedAgentId(agentId);
        setViewMode('monitor');
        Analytics.track('Live Monitor', { agentId: agentId });
    };

    const closeModal = () => {
        setSelectedAgentId(null);
        setViewMode(null);
        setIsScreenMaximized(false);
    };

    const handleSimulateEvent = async () => {
        if (!selectedAgentId) return;
        try {
            await fetch(`${API_URL}/events/simulate/${selectedAgentId}`, { method: 'POST' });
        } catch (e) {
            console.error("Failed to trigger simulation", e);
        }
    };

    const handleStartStream = () => {
        if (socketRef.current && selectedAgentId) {
            socketRef.current.emit('start_stream', { agentId: selectedAgentId });
            setIsStreaming(true);
        }
    };

    const handleStopStream = () => {
        if (socketRef.current && selectedAgentId) {
            socketRef.current.emit('stop_stream', { agentId: selectedAgentId });
            setIsStreaming(false);
        }
    };

    const monitorContainerRef = useRef<HTMLDivElement>(null);
    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            monitorContainerRef.current?.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => setIsScreenMaximized(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div>
            <div className="mb-6 space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Monitor className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                            Agent Management
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Monitor connected endpoints, track resources, and analyze fleet security.</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 items-center shadow-sm">
                            {/* Date Picker Simple Implementation */}
                            <input
                                type="date"
                                value={selectedDate}
                                className="bg-transparent text-gray-900 dark:text-white text-xs px-2 py-1 outline-none"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setSelectedDate(e.target.value);
                                    }
                                }}
                            />
                            <span className="text-gray-400 dark:text-gray-500 text-xs py-1 border-l border-gray-200 dark:border-gray-700 px-2 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => setSelectedDate('')}>24H (Default)</span>
                        </div>

                        {user?.role === 'TenantAdmin' && (
                            <>
                                <button onClick={() => setShowDeployModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold shadow-lg shadow-blue-900/20">
                                    <Download size={18} /> Deploy Agent
                                </button>
                                {/* <button onClick={handleGenerateToken} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold border border-gray-600">
                                    <AlertTriangle size={18} className="text-yellow-500" /> Generate OTP
                                </button> */}

                                <button onClick={() => setShowCapabilities(true)} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors border border-gray-300 dark:border-gray-600" title="Feature Matrix">
                                    <List size={18} /> Features
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Fleet Analytics Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Card 1: Agent Status */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg transition-colors">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2"> <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Fleet Status</h3>
                        <div className="flex items-end justify-between">
                            <div>
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.agents?.total || 0}</span>
                                <span className="text-xs text-gray-500 block">Total Agents</span>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold text-green-500 dark:text-green-400">{stats?.agents?.online || 0}</span>
                                <span className="text-xs text-gray-500 block">Online</span>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold text-red-500 dark:text-red-400">{stats?.agents?.offline || 0}</span>
                                <span className="text-xs text-gray-500 block">Offline</span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-1 mt-3 rounded-full overflow-hidden flex">
                            <div className="bg-green-500 h-full" style={{ width: `${((stats?.agents?.online || 0) / (stats?.agents?.total || 1)) * 100}%` }}></div>
                            <div className="bg-red-500 h-full flex-1"></div>
                        </div>
                    </div>

                    {/* Card 2: Resource Trends */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg col-span-2 relative overflow-hidden group transition-colors">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-2"> <Activity className="w-4 h-4 text-purple-500 dark:text-purple-400" /> Resource Trends (Avg)</h3>
                        <div className="h-24 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.resources?.trend || []}>
                                    <defs>
                                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                                    <Area type="monotone" dataKey="cpu" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="mem" stroke="#10b981" fillOpacity={1} fill="url(#colorMem)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Card 3: Security Events */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg transition-colors">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2"> <AlertTriangle className="w-4 h-4 text-yellow-500" /> Security Events</h3>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-200 dark:border-gray-700/50">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Total (Period)</span>
                                <span className="font-bold text-gray-900 dark:text-white text-lg">{stats?.threats?.total24h || stats?.threats?.total || 0}</span>
                            </div>
                            <div className="h-16 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats?.threats?.trend || []}>
                                        <Bar dataKey="count" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Recent Activity Feed (New) */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg col-span-1 md:col-span-4 max-h-48 overflow-hidden flex flex-col transition-colors">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2"> <List className="w-4 h-4 text-cyan-500 dark:text-cyan-400" /> Recent Activities</h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                            {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                                stats.recentLogs.map((log: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700/50 text-xs hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0 w-24 truncate" title={log.agentId}>{log.agentId}</span>
                                            <span className={`font-bold shrink-0 ${['Critical', 'High', 'Error'].includes(log.type) ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>{log.type}</span>
                                            <span className="text-gray-600 dark:text-gray-500 truncate">{log.details}</span>
                                        </div>
                                        <span className="text-gray-500 shrink-0 ml-2">{new Date(normalizeTimestamp(log.timestamp)).toLocaleTimeString()}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500 italic text-center py-4 text-xs">No recent activities found in this range.</div>
                            )}
                        </div>
                    </div>
                </div>



                <div className="flex bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm items-center justify-between gap-4 transition-colors">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Find agent (Hostname, ID, Status)..."
                            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-gray-200"
                            value={agentSearch}
                            onChange={(e) => setAgentSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                            {filteredAgents.length} Agents Found
                        </div>
                        <button onClick={() => fetchAgents()} className="p-2 text-gray-500 hover:text-blue-500 transition-colors" title="Refresh Fleet">
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>




            {showDeployModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 z-50">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden transition-colors">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"> <Server className="w-5 h-5 text-blue-600 dark:text-blue-500" /> Deploy Enterprise Agent </h2>
                            <button onClick={() => setShowDeployModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
                                {(['windows', 'linux', 'mac'] as const).map(os => (
                                    <button key={os} onClick={() => setDeployOS(os)} className={`flex-1 py-3 rounded-lg border font-bold flex flex-col items-center gap-2 transition-all ${deployOS === os ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                        <span className="text-lg capitalize">{os}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                {/* <div className="flex items-center gap-4">
                                    <button onClick={() => handleDownload(deployOS)} disabled={isDownloading} className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold text-sm ${isDownloading ? 'opacity-75 cursor-not-allowed' : ''}`}>
                                        <Download size={18} /> {isDownloading ? 'Downloading...' : 'Download Installer'}
                                    </button>
                                    <span className="text-gray-500 text-sm">Or use CLI (Recommended)</span>
                                </div> */}


                                {deployOS === 'windows' && (
                                    <div className="bg-gray-100 dark:bg-black/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-xs relative group">
                                        <p className="text-gray-500 dark:text-gray-400 mb-2 font-bold uppercase">PowerShell Command (Run as Admin)</p>
                                        <div className="text-gray-900 dark:text-green-400 break-all pr-12">
                                            powershell -Ep Bypass -C "irm 'https://monitorix.co.in/api/downloads/script?key=${tenantApiKey || 'Loading...'}' | iex"
                                        </div>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(`powershell -Ep Bypass -C "irm 'https://monitorix.co.in/api/downloads/script?key=${tenantApiKey}' | iex"`).then(() => toast.success("Copied to clipboard!"))}
                                            className="absolute top-4 right-4 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                            title="Copy to Clipboard"
                                        >
                                            <FileText size={16} />
                                        </button>
                                    </div>
                                )}

                                {(deployOS === 'linux' || deployOS === 'mac') && (
                                    <div className="bg-gray-100 dark:bg-black/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-xs relative group">
                                        <p className="text-gray-500 dark:text-gray-400 mb-2 font-bold uppercase">Terminal Command</p>
                                        <div className="text-gray-900 dark:text-green-400 break-all pr-12">
                                            curl -sL "https://monitorix.co.in/api/downloads/public/agent?key=${tenantApiKey || 'Loading...'}&os_type=${deployOS}" | bash
                                        </div>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(`curl -sL "https://monitorix.co.in/api/downloads/public/agent?key=${tenantApiKey}&os_type=${deployOS}" | bash`).then(() => toast.success("Copied to clipboard!"))}
                                            className="absolute top-4 right-4 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                            title="Copy to Clipboard"
                                        >
                                            <FileText size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}



            <AgentCapabilitiesModal isOpen={showCapabilities} onClose={() => setShowCapabilities(false)} />

            {/* 
                showOtpModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 z-50">
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-8 max-w-sm w-full text-center transition-colors">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Installation PIN</h2>
                            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                                <span className="text-4xl font-mono mobile-nums text-blue-600 dark:text-blue-400 font-bold tracking-widest">{otpToken?.substring(0, 3)}-{otpToken?.substring(3)}</span>
                            </div>
                            <button onClick={() => setShowOtpModal(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg">Close</button>
                        </div>
                    </div>
                )
             */}





            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg transition-colors">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm uppercase font-semibold">
                        <tr><th className="p-4">Agent ID</th><th className="p-4 hidden md:table-cell">Hostname</th><th className="p-4">Status</th><th className="p-4 hidden md:table-cell">Resources</th><th className="p-4 hidden md:table-cell">Last Seen</th><th className="p-4">Actions</th></tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-gray-300 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading agents...</td></tr> : filteredAgents.map((agent: AgentReport) => (
                            <tr key={agent.agentId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                <td className="p-4 font-bold text-gray-900 dark:text-white">
                                    <div className="flex items-center gap-2">
                                        <Server className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                        {agent.agentId}
                                    </div>
                                    <div className="mt-1 flex flex-col gap-1">
                                        {updateProgressMap[agent.agentId] !== undefined && updateProgressMap[agent.agentId] < 100 ? (
                                            <div className="w-24 mt-1">
                                                <div className="flex justify-between text-[10px] mb-0.5">
                                                    <span className="text-blue-500 font-bold animate-pulse">Updating...</span>
                                                    <span className="text-gray-500 font-mono">{updateProgressMap[agent.agentId]}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-blue-500 h-full transition-all duration-300 ease-out"
                                                        style={{ width: `${updateProgressMap[agent.agentId]}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex gap-1">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20" title="Current Version">
                                                        {agent.version}
                                                    </span>
                                                    {agent.version !== agent.targetVersion ? (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 animate-pulse flex items-center gap-1" title="Target Version">
                                                            <RefreshCw size={8} className="animate-spin" /> → {agent.targetVersion}
                                                        </span>
                                                    ) : (
                                                        agent.version === latestVersion ? (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20 flex items-center gap-0.5" title="System Up-to-Date">
                                                                <Check size={8} /> Up-to-Date
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50/50 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 flex items-center gap-1" title="Update Available">
                                                                <Zap size={8} /> Update to {latestVersion}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                                {agent.version !== agent.targetVersion && agent.updateStatus === 'pending' && (
                                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter animate-pulse">
                                                        Update Starting...
                                                    </span>
                                                )}
                                                {agent.updateStatus === 'failed' && (
                                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter flex items-center gap-1 cursor-help" title={`Last Error: ${agent.updateFailureReason || 'Unknown error'}`}>
                                                        <AlertTriangle size={10} /> Update Failed
                                                    </span>
                                                )}
                                                {agent.version !== agent.targetVersion && agent.updateStatus !== 'pending' && agent.updateStatus !== 'failed' && (
                                                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">
                                                        Update Pending
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-sm font-mono text-gray-600 dark:text-gray-400 hidden md:table-cell"> {agent.hostname || 'Unknown'} </td>
                                <td className="p-4">
                                    <div className={`flex items-center gap-2 px-2 py-1 rounded w-fit text-xs font-bold border ${agent.status === 'Online' ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>
                                        {agent.status === 'Online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />} {agent.status === 'Online' ? 'ONLINE' : 'OFFLINE'}
                                    </div>
                                </td>
                                <td className="p-4 hidden md:table-cell">
                                    <div className="text-xs space-y-1">
                                        <div className="flex justify-between w-32"> <span className="text-gray-500">CPU:</span> <span className={`${(agent.cpuUsage || 0) > 80 ? 'text-red-500 dark:text-red-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>{(agent.cpuUsage || 0).toFixed(1)}%</span> </div>
                                        <div className="flex justify-between w-32"> <span className="text-gray-500">MEM:</span> <span className="text-gray-700 dark:text-gray-300">{(agent.memoryUsage || 0).toFixed(0)} MB</span> </div>
                                        {agent.powerStatusJson && (
                                            <div className="flex justify-between w-32 items-center">
                                                <span className="text-gray-500">BAT:</span>
                                                {(() => {
                                                    try {
                                                        const pwr = JSON.parse(agent.powerStatusJson);
                                                        return (
                                                            <span className={`flex items-center gap-1 ${pwr.battery_percent < 20 && !pwr.power_plugged ? 'text-red-500 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                {pwr.power_plugged ? <Zap size={10} className="text-yellow-500" /> : <Monitor size={10} />}
                                                                {pwr.battery_percent}%
                                                            </span>
                                                        );
                                                    } catch (e) { return null; }
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-gray-500 dark:text-gray-400 text-sm hidden md:table-cell"> {agent.timestamp ? new Date(agent.timestamp).toLocaleString() : 'Never'} </td>
                                <td className="p-4">
                                    <div className="flex gap-3 items-center">
                                        <button
                                            onClick={() => handleToggleScreenshots(agent.agentId, !!agent.screenshotsEnabled)}
                                            className={`text-sm font-medium flex items-center gap-1 transition-colors ${isFeatureLocked('screenshots') ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : agent.screenshotsEnabled ? 'text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                            title={isFeatureLocked('screenshots') ? "Screenshots (Upgrade Plan)" : agent.screenshotsEnabled ? "Screenshots ON" : "Screenshots OFF"}
                                        >
                                            {isFeatureLocked('screenshots') ? <Lock className="w-4 h-4" /> : agent.screenshotsEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                                        </button>

                                        <button
                                            onClick={() => handleToggleUsb(agent.agentId, agent.usbBlockingEnabled)}
                                            className={`text-sm font-medium flex items-center gap-1 transition-colors ${isFeatureLocked('usb') ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : agent.usbBlockingEnabled ? 'text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                            title={isFeatureLocked('usb') ? "USB Blocking (Upgrade Plan)" : agent.usbBlockingEnabled ? "USB Blocking ACTIVE (Write Protected)" : "USB Access ALLOWED"}
                                        >
                                            {isFeatureLocked('usb') ? <Lock className="w-4 h-4" /> : <Usb className="w-4 h-4" />}
                                            {/* <span className="hidden md:inline">{agent.usbBlockingEnabled ? 'Block' : 'Allow'}</span> */}
                                        </button>

                                        <button
                                            onClick={() => handleToggleNetwork(agent.agentId, agent.networkMonitoringEnabled)}
                                            className={`text-sm font-medium flex items-center gap-1 transition-colors ${isFeatureLocked('network') ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : agent.networkMonitoringEnabled ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                            title={isFeatureLocked('network') ? "Network Monitor (Upgrade Plan)" : agent.networkMonitoringEnabled ? "Network Analysis ON" : "Network Analysis OFF"}
                                        >
                                            {isFeatureLocked('network') ? <Lock className="w-4 h-4" /> : agent.networkMonitoringEnabled ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                                        </button>

                                        <button
                                            onClick={() => handleToggleFile(agent.agentId, agent.fileDlpEnabled)}
                                            className={`text-sm font-medium flex items-center gap-1 transition-colors ${isFeatureLocked('file_dlp') ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : agent.fileDlpEnabled ? 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                            title={isFeatureLocked('file_dlp') ? "File DLP (Upgrade Plan)" : agent.fileDlpEnabled ? "File System DLP ON (Confidential Folder)" : "File System DLP OFF"}
                                        >
                                            {isFeatureLocked('file_dlp') ? <Lock className="w-4 h-4" /> : agent.fileDlpEnabled ? <FileText className="w-4 h-4" /> : <FileText className="w-4 h-4 opacity-50" />}
                                        </button>

                                        <button
                                            onClick={() => handleToggleLocation(agent.agentId, agent.locationTrackingEnabled)}
                                            className={`text-sm font-medium flex items-center gap-1 transition-colors ${isFeatureLocked('location') ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : agent.locationTrackingEnabled ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                            title={isFeatureLocked('location') ? "Location Tracking (Upgrade Plan)" : agent.locationTrackingEnabled ? "Location Tracking ON" : "Location Tracking OFF"}
                                        >
                                            {isFeatureLocked('location') ? <Lock className="w-4 h-4" /> : agent.locationTrackingEnabled ? <MapPin className="w-4 h-4" /> : <MapPinOff className="w-4 h-4" />}
                                            {/* <span className="hidden md:inline">{agent.locationTrackingEnabled ? 'Loc On' : 'Loc Off'}</span> */}
                                        </button>

                                        <button onClick={() => handleViewLogs(agent.agentId)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm font-medium hover:underline flex items-center gap-1"> <List className="w-4 h-4" /> Logs </button>
                                        <button onClick={() => handleMonitor(agent.agentId)} className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline flex items-center gap-1"> <Monitor className="w-4 h-4" /> Monitor </button>
                                        <button onClick={() => { setSelectedAgentId(agent.agentId); setViewMode('remote'); }} className="text-purple-400 hover:text-purple-300 text-sm font-medium hover:underline flex items-center gap-1"> <MousePointer className="w-4 h-4" /> Remote </button>
                                        <button onClick={() => handleDelete(agent.id || agent.agentId)} className="text-gray-400 hover:text-red-500 transition-colors ml-2" title="Delete Agent"> <Trash2 className="w-4 h-4" /> </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {
                selectedAgentId && createPortal(
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col">
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2"> <Server className="w-5 h-5 text-blue-500" /> Agent: <span className="text-blue-400 font-mono">{selectedAgentId}</span> </h2>
                                    <div className="flex gap-4 mt-2">
                                        <div className="flex gap-4 mt-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
                                            {TAB_TABS.map(t => {
                                                const locked = t.feat ? isFeatureLocked(t.feat) : false;
                                                const restricted = t.role && user?.role !== t.role;
                                                const disabled = locked || restricted;

                                                return (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => !restricted && setViewMode(t.id as any)}
                                                        className={`
                                                        text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1
                                                        ${viewMode === t.id ? 'text-white border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'}
                                                        ${disabled ? 'opacity-50 cursor-not-allowed group' : ''}
                                                    `}
                                                        title={locked ? `Upgrade Plan for ${t.label}` : restricted ? `Restricted to ${t.role}` : ''}
                                                    >
                                                        {t.label}
                                                        {(locked || restricted) && <Lock size={10} />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    {viewMode === 'logs' && (
                                        <button onClick={() => setShowGraphs(!showGraphs)} className={`p-2 rounded-full transition-colors ${showGraphs ? 'bg-purple-900/50 text-purple-400' : 'hover:bg-gray-700 text-gray-400'}`} title="Toggle Graphs"> <Activity className="w-5 h-5" /> </button>
                                    )}
                                    {(() => {
                                        const agent = agents.find(a => a.agentId === selectedAgentId);
                                        if (!agent) return null;

                                        // Case 1: Update in progress
                                        if (agent.version !== agent.targetVersion) {
                                            return (
                                                <div className="px-3 py-1 bg-amber-600/20 text-amber-400 rounded border border-amber-600/50 text-xs font-bold flex items-center gap-1 animate-pulse">
                                                    <RefreshCw size={12} className="animate-spin" /> Updating to {agent.targetVersion}...
                                                </div>
                                            );
                                        }

                                        // Case 2: Up-to-Date (Latest)
                                        if (agent.version === latestVersion) {
                                            return (
                                                <div className="px-3 py-1 bg-green-600/20 text-green-400 rounded border border-green-600/50 text-xs font-bold flex items-center gap-1">
                                                    <Check size={12} /> Software Up-to-Date
                                                </div>
                                            );
                                        }

                                        // Case 3: Update Available (But not yet triggered)
                                        return (
                                            <button
                                                onClick={() => handleUpdateAgent(agent.agentId)}
                                                className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs font-bold flex items-center gap-1 shadow-lg shadow-amber-900/20"
                                            >
                                                <Download size={12} /> Update Software
                                            </button>
                                        );
                                    })()}
                                    {viewMode === 'logs' && (
                                        <button onClick={handleSimulateEvent} className="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 text-xs font-bold border border-red-600/50"> Simulate Event </button>
                                    )}
                                    <button onClick={closeModal} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"> <X className="w-6 h-6" /> </button>
                                </div>
                            </div>

                            {viewMode === 'logs' && (
                                <div className="flex-1 overflow-hidden p-6 bg-gray-900/50 flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-3">
                                            {/* [NEW] Type Dropdown */}
                                            <div className="relative">
                                                <select
                                                    value={eventTypeFilter}
                                                    onChange={(e) => setEventTypeFilter(e.target.value)}
                                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none appearance-none pr-6 cursor-pointer"
                                                >
                                                    {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                                            </div>

                                            {/* Search Input */}
                                            <div className="relative">
                                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Filter logs..."
                                                    className="bg-gray-800 border border-gray-700 rounded pl-7 pr-2 py-1 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none w-48"
                                                    value={logFilter}
                                                    onChange={(e) => setLogFilter(e.target.value)}
                                                />
                                            </div>

                                            {modalStartDate && (
                                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-3 py-1 rounded border border-blue-500/20 font-bold uppercase tracking-wider shadow-sm">
                                                    Showing: {modalStartDate.split('-').reverse().join('-')} to {modalEndDate.split('-').reverse().join('-')}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 items-center gap-1 shadow-inner">
                                            <div className="flex bg-gray-200 dark:bg-gray-900/50 rounded p-0.5">
                                                <button onClick={() => setModalQuickFilter(1)} className={`text-[10px] px-2 py-1 rounded transition-colors font-bold ${modalStartDate === new Date(Date.now() - 86400000).toISOString().split('T')[0] ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-200'}`}>24H</button>
                                                <button onClick={() => setModalQuickFilter(7)} className={`text-[10px] px-2 py-1 rounded transition-colors font-bold ${modalStartDate === new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-200'}`}>7D</button>
                                                <button onClick={() => setModalQuickFilter(30)} className={`text-[10px] px-2 py-1 rounded transition-colors font-bold ${modalStartDate === new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0] ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-200'}`}>30D</button>
                                            </div>
                                            <Calendar size={14} className="text-gray-500 ml-1" />
                                            <input
                                                type="date"
                                                value={modalStartDate}
                                                onChange={(e) => setModalStartDate(e.target.value)}
                                                className="bg-transparent text-[10px] text-gray-400 outline-none w-24"
                                            />
                                            <span className="text-gray-600 dark:text-gray-500 text-[10px]">-</span>
                                            <input
                                                type="date"
                                                value={modalEndDate}
                                                onChange={(e) => setModalEndDate(e.target.value)}
                                                className="bg-transparent text-[10px] text-gray-400 outline-none w-24"
                                            />
                                            <button onClick={() => { setModalStartDate(''); setModalEndDate(''); }} className="text-[10px] text-gray-500 hover:text-red-500 font-bold px-2">Clear</button>
                                        </div>
                                    </div>
                                    {showGraphs && events.length > 0 && (
                                        <div className="mb-4 grid grid-cols-2 gap-4 h-48">
                                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col">
                                                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase"> <Activity className="w-3 h-3 text-cyan-400" /> Event Distribution </div>
                                                <div className="flex-1 w-full text-xs">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={Object.entries(events.reduce((acc: any, curr: any) => { acc[curr.type] = (acc[curr.type] || 0) + 1; return acc; }, {})).map(([name, count]) => ({ name, count })).slice(0, 10)}>
                                                            <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} />
                                                            <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                                                            <Tooltip contentStyle={{ backgroundColor: '#111827', fontSize: '10px' }} />
                                                            <Bar dataKey="count" fill="#3b82f6" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col">
                                                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase"> <Cpu className="w-3 h-3 text-purple-400" /> System Performance </div>
                                                <div className="flex-1 w-full text-xs">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={events.filter(e => e.isMetric).slice(0, 50).reverse()}>
                                                            <XAxis dataKey="timestamp" hide />
                                                            <YAxis domain={[0, 100]} stroke="#6b7280" tick={{ fontSize: 10 }} />
                                                            <Tooltip contentStyle={{ backgroundColor: '#111827', fontSize: '10px' }} />
                                                            <Line type="monotone" name="CPU" dataKey="cpu" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                                            <Line type="monotone" name="Memory" dataKey="mem" stroke="#10b981" strokeWidth={2} dot={false} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex-1 flex flex-col">
                                        <div className="overflow-y-auto flex-1">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs sticky top-0">
                                                    <tr><th className="p-4 w-48">Timestamp</th><th className="p-4 w-48">Event Type</th><th className="p-4">Details</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-700 text-gray-300 font-mono">
                                                    {filteredEvents.length === 0 ? <tr><td colSpan={3} className="p-8 text-center text-gray-500 italic">No logs recorded (or no match).</td></tr> : filteredEvents.map((evt, i) => (
                                                        <tr key={i} className="hover:bg-gray-700/30">
                                                            <td className="p-4 text-gray-500">{new Date(evt.timestamp).toLocaleString()}</td>
                                                            <td className="p-4 font-bold"> <span className="text-blue-400">{evt.type}</span> </td>
                                                            <td className="p-4 break-all">{evt.details}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {viewMode === 'monitor' && (
                                <div className={`flex-1 ${isScreenMaximized ? 'flex flex-col' : 'grid grid-cols-1 lg:grid-cols-3'} gap-0 overflow-hidden min-h-0`}>
                                    {!isScreenMaximized && (
                                        <div className="flex flex-col border-r border-gray-800 bg-gray-900/50 col-span-1 overflow-hidden min-h-0">
                                            <div className="p-3 bg-gray-800/30 border-b border-gray-800 flex items-center gap-2"> <List className="w-4 h-4 text-gray-400" /> <span className="text-xs font-bold text-gray-300 uppercase">Recent Activity</span> </div>
                                            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
                                                <div className="mb-4 bg-black/40 p-2 rounded border border-gray-700 h-32">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={events.filter(e => e.isMetric).slice(0, 50).reverse()}>
                                                            <YAxis hide domain={[0, 100]} />
                                                            <Line type="monotone" dataKey="cpu" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                {events.map((evt, i) => (
                                                    <div key={i} className="p-3 bg-gray-800 rounded border border-gray-700/50 hover:border-gray-600">
                                                        <div className="flex justify-between text-xs text-gray-500 mb-1"> <span>{new Date(normalizeTimestamp(evt.timestamp)).toLocaleTimeString()}</span> <span className="font-bold text-blue-500">{evt.type}</span> </div>
                                                        <p className="text-gray-300 break-all line-clamp-2" title={evt.details}>{evt.details}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div ref={monitorContainerRef} className={`flex flex-col bg-black ${isScreenMaximized ? 'fixed inset-0 z-50' : 'col-span-2'} overflow-hidden min-h-0 relative`}>
                                        {isFeatureLocked('live_stream') && (
                                            <div className="absolute inset-0 z-[60] bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                                                <div className="p-4 bg-purple-500/10 rounded-full mb-4 ring-4 ring-purple-500/20">
                                                    <Lock className="w-12 h-12 text-purple-500" />
                                                </div>
                                                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Enterprise Feature</h2>
                                                <p className="text-gray-400 max-w-xs mb-8 text-sm leading-relaxed">
                                                    Real-time High-FPS screen monitoring and remote control is an <b>Enterprise-only</b> capability.
                                                </p>
                                                <button
                                                    onClick={() => setShowCapabilities(true)}
                                                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-purple-500/20 transition-all flex items-center gap-2 group"
                                                >
                                                    <Zap className="w-4 h-4 group-hover:animate-pulse" /> Upgrade to Enterprise
                                                </button>
                                            </div>
                                        )}
                                        <div className={`p-3 bg-gray-800/30 border-b border-gray-800 flex items-center gap-2 ${isScreenMaximized ? 'absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm transition-opacity opacity-0 hover:opacity-100' : ''}`}>
                                            <Image className="w-4 h-4 text-gray-400" /> <span className="text-xs font-bold text-gray-300 uppercase">Live Screen Feed</span>
                                            <div className="ml-auto flex items-center gap-3">
                                                {isStreaming ? (
                                                    <button onClick={handleStopStream} className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-600/50 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2"> <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Stop Stream </button>
                                                ) : (
                                                    <button onClick={handleStartStream} className="px-3 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-500 border border-green-600/50 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2"> <Server className="w-3 h-3" /> Start Stream </button>
                                                )}
                                                {isStreaming && (
                                                    <button onClick={isRecording ? handleStopRecording : handleStartRecording} className={`px-3 py-1 border rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isRecording ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-gray-700/50 text-gray-300 border-gray-600'}`}>
                                                        {isRecording ? <StopCircle className="w-3 h-3 animate-pulse" /> : <Video className="w-3 h-3" />} {isRecording ? 'Rec ON' : 'Record'}
                                                    </button>
                                                )}
                                                <button onClick={handleToggleFullscreen} className="text-gray-400 hover:text-white transition-colors"> {isScreenMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />} </button>
                                            </div>
                                        </div>
                                        <div className="flex-1 relative overflow-hidden bg-black min-h-0">
                                            {liveScreen ? (
                                                <video ref={videoRef} className="absolute inset-0 w-full h-full object-contain z-10" autoPlay playsInline muted />
                                            ) : (
                                                <div className="text-center text-gray-600 bg-gray-900/50 p-8 rounded-xl border border-dashed border-gray-700 h-full flex flex-col justify-center items-center">
                                                    <div className="w-12 h-12 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                                                    <h3 className="text-white font-bold mb-2">Waiting for video stream...</h3>
                                                    <div className="text-xs font-mono text-left inline-block bg-black/50 p-3 rounded border border-gray-800 space-y-1">
                                                        <p className="text-gray-400">Agent: <span className="text-blue-400">{selectedAgentId}</span></p>
                                                        <p className="text-gray-400">Socket: <span className={socketStatus.includes('Joined') ? 'text-green-400' : 'text-yellow-400'}>{socketStatus}</span></p>
                                                        <p className="text-gray-400">Streaming: <span className={isStreaming ? 'text-green-400' : 'text-red-400'}>{isStreaming ? 'YES' : 'NO'}</span></p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {viewMode === 'screenshots' && (
                                <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 font-sans">
                                    <ScreenshotsGallery agentId={selectedAgentId} apiUrl={API_URL} token={token} />
                                </div>
                            )}

                            {viewMode === 'activity' && (
                                <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 font-sans">
                                    <ActivityLogViewer
                                        agentId={selectedAgentId}
                                        apiUrl={API_URL}
                                        token={token}
                                        isEnabled={agents.find(a => a.agentId === selectedAgentId)?.activityMonitorEnabled}
                                        onEnable={async () => toggleAgentSetting(selectedAgentId!, 'ActivityMonitorEnabled', true)}
                                        planLevel={planLevel}
                                        requiredTier={FEATURE_TIERS['activity']}
                                    />
                                </div>
                            )}

                            {viewMode === 'remote' && (
                                <div className="flex-1 overflow-hidden p-6 bg-gray-900/50 font-sans relative">
                                    {isFeatureLocked('remote_shell') && (
                                        <div className="absolute inset-0 z-50 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                                            <div className="p-4 bg-purple-500/10 rounded-full mb-4 ring-4 ring-purple-500/20">
                                                <Lock className="w-12 h-12 text-purple-500" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2">Enterprise Feature</h2>
                                            <p className="text-gray-400 max-w-xs mb-8 text-sm">
                                                Remote Desktop and Shell access are exclusive to the <b>Enterprise Plan</b>.
                                            </p>
                                            <button
                                                onClick={() => setShowCapabilities(true)}
                                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-purple-500/20 transition-all flex items-center gap-2"
                                            >
                                                <Zap className="w-4 h-4" /> Upgrade to Enterprise
                                            </button>
                                        </div>
                                    )}
                                    <RemoteDesktop agentId={selectedAgentId!} token={token!} />
                                </div>
                            )}

                            {viewMode === 'mail' && (
                                <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 font-sans relative">
                                    {isFeatureLocked('mail') && (
                                        <div className="absolute inset-0 z-50 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                                            <div className="p-4 bg-purple-500/10 rounded-full mb-4 ring-4 ring-purple-500/20">
                                                <Lock className="w-12 h-12 text-purple-500" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2">Enterprise Feature</h2>
                                            <p className="text-gray-400 max-w-xs mb-8 text-sm">
                                                Advanced Email Monitoring and Data Loss Prevention requires <b>Enterprise Plan</b>.
                                            </p>
                                            <button
                                                onClick={() => setShowCapabilities(true)}
                                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-purple-500/20 transition-all flex items-center gap-2"
                                            >
                                                <Zap className="w-4 h-4" /> Upgrade to Enterprise
                                            </button>
                                        </div>
                                    )}
                                    <MailLogViewer agentId={selectedAgentId!} apiUrl={API_URL} token={token!} />
                                </div>
                            )}

                            {viewMode === 'speech' && (
                                <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 font-sans relative">
                                    {isFeatureLocked('speech') && (
                                        <div className="absolute inset-0 z-50 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                                            <div className="p-4 bg-purple-500/10 rounded-full mb-4 ring-4 ring-purple-500/20">
                                                <Lock className="w-12 h-12 text-purple-500" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Enterprise Feature</h2>
                                            <p className="text-gray-400 max-w-xs mb-8 text-sm leading-relaxed">
                                                Real-time **Speech Monitoring** and Audio Transcription is an **Enterprise-only** capability.
                                            </p>
                                            <button
                                                onClick={() => setShowCapabilities(true)}
                                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-purple-500/20 transition-all flex items-center gap-2"
                                            >
                                                <Zap className="w-4 h-4" /> Upgrade to Enterprise
                                            </button>
                                        </div>
                                    )}
                                    <SpeechLogViewer agentId={selectedAgentId!} apiUrl={API_URL} token={token!} />
                                </div>
                            )}

                            {viewMode === 'speech' && (
                                <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 font-sans">
                                    <SpeechLogViewer
                                        agentId={selectedAgentId!}
                                        apiUrl={API_URL}
                                        token={token!}
                                    />
                                </div>
                            )}

                            {viewMode === 'vuln' && (
                                <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 font-sans relative">
                                    {isFeatureLocked('vuln') && (
                                        <div className="absolute inset-0 z-50 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                                            <div className="p-4 bg-purple-500/10 rounded-full mb-4 ring-4 ring-purple-500/20">
                                                <Lock className="w-12 h-12 text-purple-500" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2">Enterprise Feature</h2>
                                            <p className="text-gray-400 max-w-xs mb-8 text-sm">
                                                Vulnerability Intelligence and CVE matching is an <b>Enterprise-only</b> capability.
                                            </p>
                                            <button
                                                onClick={() => setShowCapabilities(true)}
                                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-purple-500/20 transition-all flex items-center gap-2"
                                            >
                                                <Zap className="w-4 h-4" /> Upgrade to Enterprise
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                                Agent Vulnerability Ledger
                                            </h3>
                                        </div>
                                        <AgentSecurityLedger
                                            agentId={selectedAgentId!}
                                            apiUrl={API_URL}
                                            token={token!}
                                        />
                                    </div>
                                </div>
                            )}

                            {viewMode === 'vault' && (
                                <div className="flex-1 overflow-hidden relative">
                                    {isFeatureLocked('shadow') && (
                                        <div className="absolute inset-0 z-50 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                                            <div className="p-4 bg-purple-500/10 rounded-full mb-4 ring-4 ring-purple-500/20">
                                                <Lock className="w-12 h-12 text-purple-500" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Enterprise Feature</h2>
                                            <p className="text-gray-400 max-w-xs mb-8 text-sm leading-relaxed">
                                                Secure Shadow Vault and File Integrity Monitoring are <b>Enterprise-only</b> capabilities.
                                            </p>
                                            <button
                                                onClick={() => setShowCapabilities(true)}
                                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-purple-500/20 transition-all flex items-center gap-2 group"
                                            >
                                                <Zap className="w-4 h-4 group-hover:animate-pulse" /> Upgrade to Enterprise
                                            </button>
                                        </div>
                                    )}
                                    <ShadowVault
                                        agentId={selectedAgentId!}
                                        token={token!}
                                        apiUrl={API_URL}
                                    />
                                </div>
                            )}

                            {viewMode === 'apps' && (
                                <div className="flex-1 overflow-hidden relative">
                                    {isFeatureLocked('app_blocker') && (
                                        <div className="absolute inset-0 z-50 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                                            <div className="p-4 bg-blue-500/10 rounded-full mb-4 ring-4 ring-blue-500/20">
                                                <Lock className="w-12 h-12 text-blue-500" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Professional Feature</h2>
                                            <p className="text-gray-400 max-w-xs mb-8 text-sm leading-relaxed">
                                                Application Blocking and Process Enforcement are <b>Professional Plan</b> capabilities.
                                            </p>
                                            <button
                                                onClick={() => setShowCapabilities(true)}
                                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2 group"
                                            >
                                                <Zap className="w-4 h-4 group-hover:animate-pulse" /> Upgrade to Professional
                                            </button>
                                        </div>
                                    )}
                                    {/* Placeholder for Apps Component if it existed, or text */}
                                    <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 font-sans">
                                        <div className="text-center text-gray-400 mt-20">
                                            <p>This module allows you to block specific applications from running on the agent.</p>
                                            <p className="text-xs mt-2 opacity-50">Please upgrade to configure blocked apps.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {viewMode === 'policy' && (
                                <FeaturePolicyManager
                                    agent={agents.find(a => a.agentId === selectedAgentId)}
                                    token={token!}
                                    apiUrl={API_URL}
                                    onUpdate={fetchAgents}
                                    policies={policies} // [NEW]
                                />
                            )}

                            {viewMode === 'specs' && (
                                <div className="flex-1 overflow-y-auto p-8 bg-gray-900/50 font-sans">
                                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-4xl mx-auto shadow-lg">
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-700 pb-4">
                                            <Cpu className="w-5 h-5 text-blue-500" /> System Specifications
                                        </h3>
                                        {(() => {
                                            const currentAgent = agents.find(a => a.agentId === selectedAgentId);
                                            let hw = null;
                                            try {
                                                if (currentAgent?.hardwareJson) hw = JSON.parse(currentAgent.hardwareJson);
                                            } catch (e) { console.error("JSON Parse Error", e); }

                                            // Handle case where parsing fails or null
                                            if (!hw && currentAgent?.hardwareJson?.includes('{')) {
                                                // Fallback or retry?
                                            }

                                            if (!hw) return <div className="text-gray-500 italic text-center py-8">No hardware data available for this agent. Ensure agent version is up to date (Monitorix v2.1+).</div>;

                                            return (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Processor</label>
                                                            <div className="text-white text-lg font-medium">{hw.CpuModel || 'Unknown'}</div>
                                                            <div className="text-sm text-gray-400 mt-1 flex gap-4">
                                                                <span>Cores: <b className="text-gray-300">{hw.CpuCores}</b></span>
                                                                <span>Threads: <b className="text-gray-300">{hw.CpuThreads}</b></span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Memory (RAM)</label>
                                                            <div className="flex items-end gap-2">
                                                                <span className="text-2xl font-bold text-green-400">{hw.RamTotalGB} GB</span>
                                                                <span className="text-sm text-gray-500 mb-1">Total</span>
                                                            </div>
                                                            <div className="w-full bg-gray-700 h-2 rounded-full mt-2 overflow-hidden">
                                                                <div className="bg-green-500 h-full" style={{ width: `${hw.RamPercent}%` }}></div>
                                                            </div>
                                                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                                <span>Used: {hw.RamUsedGB} GB</span>
                                                                <span>Free: {hw.RamAvailableGB} GB</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Storage (C: / Root)</label>
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative w-24 h-24 flex items-center justify-center">
                                                                    <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                                                                    <div className="absolute inset-0 border-4 border-blue-500 rounded-full" style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`, transform: `rotate(${(1 - (hw.DiskFreeGB / hw.DiskTotalGB)) * 360}deg)` }}></div>
                                                                    {/* Simple visualization, SVG would be better but keeping it text-based for safety */}
                                                                    <div className="text-center">
                                                                        <div className="text-xl font-bold text-white">{hw.DiskTotalGB}</div>
                                                                        <div className="text-[10px] text-gray-500">GB Total</div>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2 text-sm text-gray-300">
                                                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Used: {(hw.DiskTotalGB - hw.DiskFreeGB).toFixed(2)} GB</div>
                                                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-600"></div> Free: {hw.DiskFreeGB} GB</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">System</label>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="bg-gray-700/50 p-3 rounded text-sm">
                                                                    <span className="text-gray-400 block text-xs">Hostname</span>
                                                                    <span className="font-mono text-white">{currentAgent?.hostname}</span>
                                                                </div>
                                                                <div className="bg-gray-700/50 p-3 rounded text-sm">
                                                                    <span className="text-gray-400 block text-xs">Agent ID</span>
                                                                    <span className="font-mono text-white truncate" title={currentAgent?.agentId}>{currentAgent?.agentId}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* [NEW] Battery Analysis Section */}
                                                        {(() => {
                                                            try {
                                                                const pwr = currentAgent?.powerStatusJson ? JSON.parse(currentAgent.powerStatusJson) : null;
                                                                if (!pwr) return null;
                                                                return (
                                                                    <div className="mt-6 border-t border-gray-700 pt-6">
                                                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Power & Battery Analysis</label>
                                                                        <div className="bg-gray-700/30 p-4 rounded-lg flex items-center justify-between">
                                                                            <div className="flex items-center gap-4">
                                                                                <div className={`p-3 rounded-full ${pwr.power_plugged ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                                                                    {pwr.power_plugged ? <Zap size={24} /> : <Monitor size={24} />}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-white font-bold text-xl">{pwr.battery_percent}%</div>
                                                                                    <div className="text-xs text-gray-400 uppercase tracking-tighter">
                                                                                        {pwr.power_plugged ? 'AC Power Connected' : 'Running on Battery'}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <div className="text-gray-400 text-xs mb-1">Estimated Time Remaining</div>
                                                                                <div className="text-white font-mono">
                                                                                    {pwr.time_left_min > 0 ? `${Math.floor(pwr.time_left_min / 60)}h ${pwr.time_left_min % 60}m` : (pwr.power_plugged ? 'Calculating...' : 'Unlimited')}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            } catch (e) { return null; }
                                                        })()}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 border-t border-gray-800 bg-gray-800/50 flex justify-end">
                                <button onClick={closeModal} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">Close Viewer</button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
}

