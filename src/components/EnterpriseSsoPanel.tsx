import React, { useState, useEffect } from 'react';
import { 
    Shield, Key, Users, Copy, Check, ExternalLink, Download, 
    RefreshCw, CheckCircle2, AlertTriangle, Lock, Server, 
    FileText, Zap, ChevronRight, Eye, EyeOff, Globe, Sparkles
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

interface SsoPreset {
    id: string;
    name: string;
    icon: string;
    description: string;
    default_idp_url: string;
    default_entity_id: string;
    attribute_mapping: Record<string, string>;
    scim_supported: boolean;
    instructions: string;
}

interface CertInfo {
    valid_format: boolean;
    subject?: string;
    issuer?: string;
    serial_number?: string;
    not_valid_before?: string;
    not_valid_after?: string;
    is_valid?: boolean;
    is_expired?: boolean;
    days_remaining?: number;
    sha256_fingerprint?: string;
    error?: string;
}

interface SsoConfig {
    tenant_id: number;
    enabled: boolean;
    provider: string;
    idp_url: string;
    entity_id: string;
    certificate_configured: boolean;
    certificate_info: CertInfo | null;
    attribute_mapping: Record<string, string>;
    default_role: string;
    jit_provisioning: boolean;
    sp_entity_id: string;
    sp_acs_url: string;
    sp_metadata_url: string;
}

interface ScimTokenInfo {
    tenant_id: number;
    scim_url: string;
    scim_token: string;
    token_masked: string;
    scim_version: string;
    supported_features: string[];
}

interface ScimUser {
    id: string;
    userName: string;
    displayName: string;
    active: boolean;
    emails: { value: string; primary: boolean }[];
    meta?: {
        resourceType: string;
        created: string;
        location: string;
    };
}

interface ScimSyncLog {
    id: string;
    timestamp: string;
    provider: string;
    event_type: string;
    target_user: string;
    status: string;
    details: string;
}

interface SaasQuotaInfo {
    tenant_id: number;
    subscription_tier: string;
    quota: {
        max_licensed_endpoints: number;
        active_enrolled_endpoints: number;
        utilization_pct: number;
        data_retention_days: number;
        hot_storage_quota_tb: number;
        hot_storage_used_tb: number;
    };
    feature_entitlements: Record<string, boolean>;
    isolation_model: string;
    compliance_certifications: string[];
}

export default function EnterpriseSsoPanel() {
    const { token } = useAuth();
    const [subTab, setSubTab] = useState<'saml' | 'scim' | 'quotas'>('saml');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    // SSO State
    const [presets, setPresets] = useState<SsoPreset[]>([]);
    const [ssoConfig, setSsoConfig] = useState<SsoConfig | null>(null);
    const [provider, setProvider] = useState<string>('okta');
    const [enabled, setEnabled] = useState<boolean>(false);
    const [idpUrl, setIdpUrl] = useState<string>('');
    const [entityId, setEntityId] = useState<string>('');
    const [certificate, setCertificate] = useState<string>('');
    const [defaultRole, setDefaultRole] = useState<string>('Analyst');
    const [jitProvisioning, setJitProvisioning] = useState<boolean>(true);
    const [attrMapping, setAttrMapping] = useState<Record<string, string>>({
        username: 'nameid',
        email: 'email',
        displayName: 'displayName',
        role: 'memberOf'
    });

    // Diagnostics State
    const [diagnosticsResult, setDiagnosticsResult] = useState<{
        certificate_valid: boolean;
        cert_info: CertInfo;
        diagnostics: string[];
    } | null>(null);

    // SCIM State
    const [scimTokenInfo, setScimTokenInfo] = useState<ScimTokenInfo | null>(null);
    const [showScimSecret, setShowScimSecret] = useState(false);
    const [scimUsers, setScimUsers] = useState<ScimUser[]>([]);
    const [scimLogs, setScimLogs] = useState<ScimSyncLog[]>([]);
    const [simulatingSync, setSimulatingSync] = useState(false);

    // Quotas State
    const [quotas, setQuotas] = useState<SaasQuotaInfo | null>(null);

    // Copied feedback
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2500);
    };

    const fetchAllData = async () => {
        setLoading(true);
        setStatusMsg(null);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            // 1. Presets
            const resPresets = await fetch(`${API_URL}/sso/presets`, { credentials: 'include', headers });
            if (resPresets.ok) {
                const data = await resPresets.json();
                setPresets(data);
            }

            // 2. SSO Config
            const resConfig = await fetch(`${API_URL}/sso/config`, { credentials: 'include', headers });
            if (resConfig.ok) {
                const data: SsoConfig = await resConfig.json();
                setSsoConfig(data);
                setEnabled(data.enabled);
                setProvider(data.provider || 'okta');
                setIdpUrl(data.idp_url || '');
                setEntityId(data.entity_id || '');
                setDefaultRole(data.default_role || 'Analyst');
                setJitProvisioning(data.jit_provisioning ?? true);
                if (data.attribute_mapping && Object.keys(data.attribute_mapping).length > 0) {
                    setAttrMapping(data.attribute_mapping);
                }
            }

            // 3. SCIM Token & Users & Logs
            const [resToken, resUsers, resLogs, resQuotas] = await Promise.all([
                fetch(`${API_URL}/v2/iam/scim/token`, { credentials: 'include', headers }),
                fetch(`${API_URL}/v2/iam/scim/v2/Users?count=50`, { credentials: 'include', headers }),
                fetch(`${API_URL}/v2/iam/scim/sync-logs`, { credentials: 'include', headers }),
                fetch(`${API_URL}/v2/iam/saas/quotas`, { credentials: 'include', headers }),
            ]);

            if (resToken.ok) setScimTokenInfo(await resToken.json());
            if (resUsers.ok) {
                const uData = await resUsers.json();
                setScimUsers(uData.Resources || []);
            }
            if (resLogs.ok) setScimLogs(await resLogs.json());
            if (resQuotas.ok) setQuotas(await resQuotas.json());
        } catch (err: any) {
            console.error('Error fetching SSO/SCIM data:', err);
            setStatusMsg({ type: 'error', text: 'Failed to load SSO configuration: ' + (err.message || 'Network error') });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [token]);

    const handleApplyPreset = (p: SsoPreset) => {
        setProvider(p.id);
        if (!idpUrl || idpUrl.includes('{')) {
            setIdpUrl(p.default_idp_url);
        }
        if (!entityId || entityId.includes('{')) {
            setEntityId(p.default_entity_id);
        }
        setAttrMapping(p.attribute_mapping);
        setStatusMsg({ type: 'info', text: `Applied template configuration for ${p.name}. Customize your IdP URL and X.509 Certificate.` });
    };

    const handleTestSso = async () => {
        setTesting(true);
        setDiagnosticsResult(null);
        setStatusMsg(null);
        try {
            if (!idpUrl) {
                throw new Error('Please enter the Identity Provider SSO Target URL.');
            }
            if (!certificate && !ssoConfig?.certificate_configured) {
                throw new Error('Please paste your Identity Provider X.509 Certificate in PEM format.');
            }

            const certToTest = certificate || (ssoConfig?.certificate_info ? 'EXISTING_CERT' : '');
            if (!certToTest) {
                throw new Error('X.509 Certificate required for signature verification test.');
            }

            const res = await fetch(`${API_URL}/sso/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    idp_url: idpUrl,
                    certificate: certificate,
                    entity_id: entityId
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || 'Test verification failed.');
            }

            setDiagnosticsResult(data);
            setStatusMsg({
                type: data.certificate_valid ? 'success' : 'error',
                text: data.certificate_valid
                    ? 'SAML 2.0 Identity Provider configuration passed cryptographic validation!'
                    : 'Certificate validation failed. Check certificate expiry or issuer structure.'
            });
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: err.message || 'Diagnostic test failed' });
        } finally {
            setTesting(false);
        }
    };

    const handleSaveSso = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setStatusMsg(null);
        try {
            const bodyPayload: any = {
                provider,
                idp_url: idpUrl,
                entity_id: entityId,
                attribute_mapping: attrMapping,
                default_role: defaultRole,
                jit_provisioning: jitProvisioning,
                enabled
            };
            if (certificate && certificate.trim()) {
                bodyPayload.certificate = certificate.trim();
            }

            const res = await fetch(`${API_URL}/sso/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bodyPayload)
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || 'Failed to update SSO configuration.');
            }

            setStatusMsg({ type: 'success', text: 'Enterprise SSO configuration successfully saved and committed!' });
            // Refresh
            const resConfig = await fetch(`${API_URL}/sso/config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resConfig.ok) {
                const refreshed = await resConfig.json();
                setSsoConfig(refreshed);
                setCertificate(''); // Clear textarea since it's securely stored in backend
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: err.message || 'Save failed' });
        } finally {
            setSaving(false);
        }
    };

    const handleRotateScimToken = async () => {
        if (!window.confirm('Are you sure you want to rotate the SCIM 2.0 Bearer Token? Any existing Okta or Azure AD SCIM provisioning integrations using the old token will need to be updated.')) {
            return;
        }
        try {
            const res = await fetch(`${API_URL}/v2/iam/scim/token/rotate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (scimTokenInfo) {
                    setScimTokenInfo({
                        ...scimTokenInfo,
                        scim_token: data.new_token,
                        token_masked: data.token_masked
                    });
                }
                setStatusMsg({ type: 'success', text: 'SCIM 2.0 authorization token rotated successfully.' });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: 'Failed to rotate SCIM token: ' + err.message });
        }
    };

    const handleSimulateScimSync = async () => {
        setSimulatingSync(true);
        try {
            const res = await fetch(`${API_URL}/v2/iam/scim/simulate-sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ provider: provider === 'entra' ? 'Microsoft Entra ID' : 'Okta Universal Directory' })
            });

            if (res.ok) {
                const data = await res.json();
                setStatusMsg({ type: 'success', text: `Directory push successful! Created ${data.user_provisioned.userName} via SCIM 2.0 protocol.` });
                // Re-fetch users and logs
                const [resUsers, resLogs] = await Promise.all([
                    fetch(`${API_URL}/v2/iam/scim/v2/Users?count=50`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/v2/iam/scim/sync-logs`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                if (resUsers.ok) setScimUsers((await resUsers.json()).Resources || []);
                if (resLogs.ok) setScimLogs(await resLogs.json());
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: 'SCIM sync simulation failed: ' + err.message });
        } finally {
            setSimulatingSync(false);
        }
    };

    const handleDownloadSpMetadata = () => {
        const tenantId = ssoConfig?.tenant_id || 1;
        window.open(`${API_URL}/sso/metadata/${tenantId}`, '_blank');
    };

    const handleFileUploadCert = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                if (text) {
                    setCertificate(text.trim());
                    setStatusMsg({ type: 'info', text: `Loaded certificate from file: ${file.name}` });
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Navigation Sub-Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSubTab('saml')}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                            subTab === 'saml'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Shield size={15} /> SAML 2.0 Single Sign-On
                    </button>
                    <button
                        onClick={() => setSubTab('scim')}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                            subTab === 'scim'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Users size={15} /> SCIM 2.0 Directory Sync
                    </button>
                    <button
                        onClick={() => setSubTab('quotas')}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                            subTab === 'quotas'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Server size={15} /> SaaS Quota & Isolation
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAllData}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="Refresh configuration"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {enabled ? 'SSO Active & Enforced' : 'SSO Standby (Local Auth Available)'}
                    </div>
                </div>
            </div>

            {/* Notification Banner */}
            {statusMsg && (
                <div className={`p-4 rounded-xl flex items-start gap-3 border text-xs font-semibold ${
                    statusMsg.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : statusMsg.type === 'error'
                        ? 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                        : 'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                }`}>
                    {statusMsg.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
                    <div className="flex-1">{statusMsg.text}</div>
                </div>
            )}

            {/* SUB-TAB 1: SAML 2.0 SINGLE SIGN-ON */}
            {subTab === 'saml' && (
                <div className="space-y-8">
                    {/* Identity Provider Presets Selector */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Sparkles size={14} className="text-blue-500" /> Identity Provider Presets
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Select your enterprise identity provider to prefill recommended protocol parameters and claim attributes.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            {presets.map((p) => {
                                const isSelected = provider === p.id;
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => handleApplyPreset(p)}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                            isSelected 
                                                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-2 ring-blue-500/20' 
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</span>
                                            {isSelected && <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400" />}
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{p.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Service Provider (SP) Credentials */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Globe size={14} className="text-blue-500" /> Monitorix Service Provider (SP) Endpoints
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Copy these URLs into your IdP application configuration (Okta / Azure AD / PingIdentity).</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleDownloadSpMetadata}
                                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-sm transition-all"
                            >
                                <Download size={14} /> Download SP Metadata XML
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Entity ID */}
                            <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SP Entity ID / Audience URI</span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(ssoConfig?.sp_entity_id || `monitorix-sp-${ssoConfig?.tenant_id || 1}`, 'sp_entity')}
                                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                        {copiedKey === 'sp_entity' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                        {copiedKey === 'sp_entity' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <code className="block text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {ssoConfig?.sp_entity_id || `monitorix-sp-${ssoConfig?.tenant_id || 1}`}
                                </code>
                            </div>

                            {/* ACS URL */}
                            <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assertion Consumer Service (ACS) URL</span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(ssoConfig?.sp_acs_url || `https://app.monitorix.io/api/sso/acs/${ssoConfig?.tenant_id || 1}`, 'sp_acs')}
                                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                        {copiedKey === 'sp_acs' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                        {copiedKey === 'sp_acs' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <code className="block text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {ssoConfig?.sp_acs_url || `https://app.monitorix.io/api/sso/acs/${ssoConfig?.tenant_id || 1}`}
                                </code>
                            </div>
                        </div>
                    </div>

                    {/* Identity Provider Inbound Form */}
                    <form onSubmit={handleSaveSso} className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                            {/* Enable Toggle & Provider Selection */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Enable SAML 2.0 Single Sign-On</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">When active, users can authenticate directly via corporate SSO credentials.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={enabled}
                                        onChange={(e) => setEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {/* Inputs: IdP SSO URL & Entity ID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                                        IdP Single Sign-On URL <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="url"
                                        value={idpUrl}
                                        onChange={(e) => setIdpUrl(e.target.value)}
                                        placeholder="https://dev-12345.okta.com/app/sso/saml"
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">HTTP-POST binding target endpoint provided by your IdP.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                                        IdP Issuer / Entity ID
                                    </label>
                                    <input
                                        type="text"
                                        value={entityId}
                                        onChange={(e) => setEntityId(e.target.value)}
                                        placeholder="http://www.okta.com/exk123456789"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">Unique identifier issued by your IdP.</p>
                                </div>
                            </div>

                            {/* X.509 Signing Certificate */}
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                        <Key size={14} className="text-blue-500" /> Identity Provider X.509 Public Certificate (PEM) <span className="text-red-500">*</span>
                                    </label>
                                    <label className="cursor-pointer text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                        <Download size={13} /> Upload .crt / .cer / .pem
                                        <input type="file" accept=".crt,.cer,.pem,.txt" onChange={handleFileUploadCert} className="hidden" />
                                    </label>
                                </div>

                                {/* Active Certificate Status Badge if already configured */}
                                {ssoConfig?.certificate_configured && ssoConfig.certificate_info && (
                                    <div className="mb-3 p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                                                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Active Certificate Configured</span>
                                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-200/60 dark:bg-emerald-800/40 text-emerald-800 dark:text-emerald-300 rounded-full">
                                                    {ssoConfig.certificate_info.days_remaining} Days Remaining
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                                                Subject: {ssoConfig.certificate_info.subject}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-mono">
                                                SHA-256: {ssoConfig.certificate_info.sha256_fingerprint}
                                            </p>
                                        </div>
                                        <span className="text-[11px] text-slate-500 shrink-0 italic">Leave empty to keep current</span>
                                    </div>
                                )}

                                <textarea
                                    rows={4}
                                    value={certificate}
                                    onChange={(e) => setCertificate(e.target.value)}
                                    placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDpDCCAoygAwIBAgIGAYV...&#10;-----END CERTIFICATE-----"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">Used to cryptographically verify signatures on SAML assertions sent by your IdP.</p>
                            </div>

                            {/* Attribute Claims & JIT Provisioning */}
                            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <FileText size={14} className="text-blue-500" /> SAML Attribute Claims Mapping & Role Assignment
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username Claim</label>
                                        <input
                                            type="text"
                                            value={attrMapping.username || 'nameid'}
                                            onChange={(e) => setAttrMapping({ ...attrMapping, username: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-800 dark:text-slate-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Claim</label>
                                        <input
                                            type="text"
                                            value={attrMapping.email || 'email'}
                                            onChange={(e) => setAttrMapping({ ...attrMapping, email: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-800 dark:text-slate-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Display Name Claim</label>
                                        <input
                                            type="text"
                                            value={attrMapping.displayName || 'displayName'}
                                            onChange={(e) => setAttrMapping({ ...attrMapping, displayName: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-800 dark:text-slate-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Group / Role Claim</label>
                                        <input
                                            type="text"
                                            value={attrMapping.role || 'memberOf'}
                                            onChange={(e) => setAttrMapping({ ...attrMapping, role: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-800 dark:text-slate-200"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Default JIT Role</label>
                                        <select
                                            value={defaultRole}
                                            onChange={(e) => setDefaultRole(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200"
                                        >
                                            <option value="Analyst">Analyst (Tier 1 SOC)</option>
                                            <option value="Security Engineer">Security Engineer (Incident Responder)</option>
                                            <option value="Auditor">Compliance Auditor (Read-Only)</option>
                                            <option value="TenantAdmin">Tenant Administrator</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-3 pt-4">
                                        <input
                                            type="checkbox"
                                            id="jit_check"
                                            checked={jitProvisioning}
                                            onChange={(e) => setJitProvisioning(e.target.checked)}
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                                        />
                                        <label htmlFor="jit_check" className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                                            Enable Just-In-Time (JIT) Automatic User Creation
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Diagnostics Validation Box */}
                        {diagnosticsResult && (
                            <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <span className="font-bold uppercase tracking-wider flex items-center gap-2 text-emerald-400">
                                        <CheckCircle2 size={14} /> Diagnostic Validation Results
                                    </span>
                                    <span className="text-slate-400 text-[11px]">RFC 7522 Compliance Check</span>
                                </div>
                                <ul className="space-y-1.5 text-[11px]">
                                    {diagnosticsResult.diagnostics.map((d, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <span className="text-blue-400">&gt;</span> {d}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Submit & Test Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleTestSso}
                                disabled={testing}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 shadow-sm transition-all"
                            >
                                <Zap size={14} className={testing ? 'animate-bounce text-amber-500' : 'text-blue-500'} />
                                {testing ? 'Validating Cryptography...' : 'Test & Validate SAML'}
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                            >
                                <Lock size={14} />
                                {saving ? 'Committing...' : 'Save SSO Configuration'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* SUB-TAB 2: SCIM 2.0 DIRECTORY SYNC */}
            {subTab === 'scim' && (
                <div className="space-y-6">
                    {/* SCIM Info Header */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider">
                                    RFC 7644 Active
                                </span>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">SCIM 2.0 Inbound User Provisioning</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Automatically push users, deprovision leavers, and synchronize Active Directory security groups from Okta or Entra ID.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSimulateScimSync}
                                disabled={simulatingSync}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                            >
                                <Zap size={13} className={simulatingSync ? 'animate-spin' : ''} />
                                {simulatingSync ? 'Syncing...' : 'Simulate Inbound Push'}
                            </button>
                        </div>
                    </div>

                    {/* SCIM Configuration Credentials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* SCIM Base URL */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SCIM 2.0 Base Endpoint URL</span>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(scimTokenInfo?.scim_url || 'https://app.monitorix.io/api/v2/iam/scim/v2/Users', 'scim_url')}
                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    {copiedKey === 'scim_url' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    {copiedKey === 'scim_url' ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <code className="block text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 truncate">
                                {scimTokenInfo?.scim_url || 'https://app.monitorix.io/api/v2/iam/scim/v2/Users'}
                            </code>
                            <p className="text-[11px] text-slate-400 mt-2">Paste into Okta / Entra SCIM Provisioning 'SCIM Connector Base URL' field.</p>
                        </div>

                        {/* SCIM Secret Bearer Token */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SCIM Bearer Token (HTTP Authorization)</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowScimSecret(!showScimSecret)}
                                        className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                                    >
                                        {showScimSecret ? <EyeOff size={12} /> : <Eye size={12} />}
                                        {showScimSecret ? 'Hide' : 'Reveal'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(scimTokenInfo?.scim_token || '', 'scim_token')}
                                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                        {copiedKey === 'scim_token' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                        {copiedKey === 'scim_token' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                            <code className="block text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 truncate">
                                {showScimSecret ? scimTokenInfo?.scim_token : scimTokenInfo?.token_masked || '••••••••••••••••••••••••••••'}
                            </code>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-[11px] text-slate-400">OAuth 2.0 Bearer authorization secret.</p>
                                <button
                                    type="button"
                                    onClick={handleRotateScimToken}
                                    className="text-[11px] font-bold text-red-500 hover:text-red-600 hover:underline flex items-center gap-1"
                                >
                                    <RefreshCw size={11} /> Rotate Secret
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Synchronized Users Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Users size={14} className="text-blue-500" /> Synchronized Directory Users ({scimUsers.length})
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Active identities synchronized via SCIM 2.0 protocol.</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 uppercase tracking-wider text-[10px] font-black border-b border-slate-200 dark:border-slate-800">
                                        <th className="py-3 px-5">User / Username</th>
                                        <th className="py-3 px-5">Primary Email</th>
                                        <th className="py-3 px-5">Status</th>
                                        <th className="py-3 px-5">SCIM Resource Location</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {scimUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                                                No directory users provisioned yet. Click "Simulate Inbound Push" or configure Okta SCIM integration.
                                            </td>
                                        </tr>
                                    ) : (
                                        scimUsers.map((u) => (
                                            <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="py-3 px-5 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                                                        {u.userName.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div>{u.displayName || u.userName}</div>
                                                        <div className="text-[10px] font-mono text-slate-400 font-normal">ID: {u.id}</div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-5 font-mono text-slate-600 dark:text-slate-300">
                                                    {u.emails?.[0]?.value || u.userName}
                                                </td>
                                                <td className="py-3 px-5">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                        u.active
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                        {u.active ? 'Active' : 'Suspended'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-5 font-mono text-slate-400 text-[11px] truncate max-w-xs">
                                                    {u.meta?.location || `/api/v2/iam/scim/v2/Users/${u.id}`}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SCIM Event Audit Log */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <FileText size={14} className="text-blue-500" /> Recent SCIM Directory Synchronization Events
                            </h4>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {scimLogs.map((log) => (
                                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900 dark:text-white">{log.provider}</span>
                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                                                {log.event_type}
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                                {log.status}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-[11px]">{log.details}</p>
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-400 shrink-0">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* SUB-TAB 3: SAAS QUOTA & ENTERPRISE ISOLATION */}
            {subTab === 'quotas' && quotas && (
                <div className="space-y-6">
                    {/* Header Card */}
                    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="px-2.5 py-0.5 rounded bg-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                                    {quotas.subscription_tier}
                                </span>
                                <h3 className="text-xl font-black tracking-tight mt-2">Enterprise Multi-Tenant Tenant #{quotas.tenant_id}</h3>
                                <p className="text-xs text-blue-200 mt-1 max-w-xl">
                                    {quotas.isolation_model}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {quotas.compliance_certifications.map((c, i) => (
                                    <span key={i} className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold">
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quota Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Licensed Endpoints */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Endpoint Capacity</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    {quotas.quota.active_enrolled_endpoints.toLocaleString()}
                                </span>
                                <span className="text-xs text-slate-400 font-semibold">
                                    / {quotas.quota.max_licensed_endpoints.toLocaleString()} Licensed
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full rounded-full"
                                    style={{ width: `${Math.max(1, quotas.quota.utilization_pct)}%` }}
                                ></div>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1.5 block">
                                {quotas.quota.utilization_pct}% capacity allocated
                            </span>
                        </div>

                        {/* Hot Storage Quota */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Telemetry Hot Storage</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    {quotas.quota.hot_storage_used_tb} TB
                                </span>
                                <span className="text-xs text-slate-400 font-semibold">
                                    / {quotas.quota.hot_storage_quota_tb} TB Provisioned
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full rounded-full"
                                    style={{ width: `${(quotas.quota.hot_storage_used_tb / quotas.quota.hot_storage_quota_tb) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1.5 block">
                                ClickHouse + NVMe SSD cluster storage tier
                            </span>
                        </div>

                        {/* Data Retention */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Forensic Data Retention</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    {quotas.quota.data_retention_days} Days
                                </span>
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                                    (1 Full Year)
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                                Immutable regulatory compliance logging with cryptographic SHA-256 chain verification.
                            </p>
                        </div>
                    </div>

                    {/* Entitlements Checklist */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <CheckCircle2 size={15} className="text-blue-500" /> Active Enterprise Feature Entitlements
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(quotas.feature_entitlements).map(([k, v]) => (
                                <div key={k} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                    <span className="text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">
                                        {k.replace(/_/g, ' ')}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        {v ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
