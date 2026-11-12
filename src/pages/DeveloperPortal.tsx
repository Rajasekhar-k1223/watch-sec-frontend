import React, { useState, useEffect } from 'react';
import { 
  Terminal, Key, Webhook, Code, Play, Copy, Check, Plus, 
  ExternalLink, ArrowLeft, RefreshCw, Layers, ShieldCheck, 
  FileText, Database, Send, Radio, AlertCircle, Download,
  BookOpen, Shield, CreditCard, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface OAuthApp {
  id: number;
  app_name: string;
  client_id: string;
  client_secret_preview: string;
  client_secret_full?: string;
  redirect_uris: string[];
  scopes: string[];
  is_active: boolean;
  created_at: string;
}

interface WebhookSub {
  id: number;
  name: string;
  target_url: string;
  secret_key: string;
  subscribed_events: string[];
  is_enabled: boolean;
  retry_count: number;
  max_retries: number;
}

interface WebhookLog {
  id: number;
  subscription_id: number;
  event_type: string;
  delivered_at: string;
  response_status_code: number;
  is_success: boolean;
  retry_count: number;
  latency_ms: number;
  payload: any;
}

export default function DeveloperPortal() {
  const [activeTab, setActiveTab] = useState<'sdk' | 'oauth' | 'webhooks' | 'sandbox' | 'guides'>('sdk');

  // SDK Templates
  const [sdkLanguage, setSdkLanguage] = useState<'python' | 'nodejs'>('python');
  const [sdkCode, setSdkCode] = useState<string>('');
  const [sdkLoading, setSdkLoading] = useState<boolean>(false);
  const [copiedSdk, setCopiedSdk] = useState<boolean>(false);

  // OAuth Apps
  const [oauthApps, setOauthApps] = useState<OAuthApp[]>([]);
  const [appsLoading, setAppsLoading] = useState<boolean>(false);
  const [showCreateAppModal, setShowCreateAppModal] = useState<boolean>(false);
  const [newAppName, setNewAppName] = useState<string>('');
  const [newAppRedirect, setNewAppRedirect] = useState<string>('https://secops.internal/callback');
  const [newAppScopes, setNewAppScopes] = useState<string[]>(['events:read', 'alerts:write']);
  const [createdSecretAlert, setCreatedSecretAlert] = useState<{ id: string; secret: string } | null>(null);

  // Webhooks
  const [webhooks, setWebhooks] = useState<WebhookSub[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState<boolean>(false);
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState<boolean>(false);
  const [newWhName, setNewWhName] = useState<string>('');
  const [newWhUrl, setNewWhUrl] = useState<string>('');
  const [dispatchingWhId, setDispatchingWhId] = useState<number | null>(null);

  // Sandbox
  const [sandboxExtensionId, setSandboxExtensionId] = useState<string>('ext-crowdstrike-falcon');
  const [sandboxPayload, setSandboxPayload] = useState<string>(
    JSON.stringify(
      {
        event_type: 'ProcessRollup2',
        hostname: 'WORKSTATION-X982',
        process_name: 'powershell.exe',
        command_line: 'powershell.exe -enc SQBFAFgA...',
        user: 'CORP\\analyst_1',
        source_ip: '10.200.4.52',
        severity: 'High'
      },
      null,
      2
    )
  );
  const [sandboxResponse, setSandboxResponse] = useState<any | null>(null);
  const [sandboxLoading, setSandboxLoading] = useState<boolean>(false);

  const getAuthToken = () => {
    return sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
  };

  // Fetch SDK Template
  const fetchSdkTemplate = async (lang: string) => {
    setSdkLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/v2/marketplace/developers/sdk-template?lang=${lang}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSdkCode(data.template_code || '');
      }
    } catch (e) {
      // fallback
    } finally {
      setSdkLoading(false);
    }
  };

  // Fetch OAuth Apps
  const fetchOAuthApps = async () => {
    setAppsLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v2/marketplace/developers/apps', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOauthApps(data.oauth_applications || []);
      }
    } catch (e) {
      toast.error('Failed to load OAuth applications');
    } finally {
      setAppsLoading(false);
    }
  };

  // Fetch Webhooks & Logs
  const fetchWebhooksAndLogs = async () => {
    setWebhooksLoading(true);
    try {
      const token = getAuthToken();
      const [resWh, resLogs] = await Promise.all([
        fetch('/api/v2/marketplace/webhooks', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v2/marketplace/webhooks/logs?limit=25', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (resWh.ok) {
        const data = await resWh.json();
        setWebhooks(data.subscriptions || []);
      }
      if (resLogs.ok) {
        const logData = await resLogs.json();
        setWebhookLogs(logData.delivery_logs || []);
      }
    } catch (e) {
      toast.error('Failed to load webhook subscriptions');
    } finally {
      setWebhooksLoading(false);
    }
  };

  useEffect(() => {
    fetchSdkTemplate(sdkLanguage);
    fetchOAuthApps();
    fetchWebhooksAndLogs();
  }, []);

  const handleCreateOAuthApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v2/marketplace/developers/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          app_name: newAppName,
          redirect_uris: [newAppRedirect],
          scopes: newAppScopes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create OAuth application');
      }

      const data = await res.json();
      const app = data.application;
      setCreatedSecretAlert({ id: app.client_id, secret: app.client_secret });
      setShowCreateAppModal(false);
      setNewAppName('');
      toast.success('OAuth2 application created!');
      fetchOAuthApps();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v2/marketplace/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newWhName,
          target_url: newWhUrl,
          events: ['incident.created', 'alert.triggered', 'agent.quarantined']
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to register webhook');
      }

      toast.success('Webhook registered successfully!');
      setShowCreateWebhookModal(false);
      setNewWhName('');
      setNewWhUrl('');
      fetchWebhooksAndLogs();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDispatchTestWebhook = async (subId: number) => {
    setDispatchingWhId(subId);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v2/marketplace/webhooks/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription_id: subId,
          event_type: 'incident.created',
          payload: {
            incident_id: 'INC-' + Math.floor(10000 + Math.random() * 90000),
            severity: 'Critical',
            title: 'Synthetic Test Event Dispatched via Developer Portal',
            triggered_at: new Date().toISOString()
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Dispatch failed');
      toast.success(`Webhook delivered! HTTP Status: ${data.delivery_status || 200}`);
      fetchWebhooksAndLogs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDispatchingWhId(null);
    }
  };

  const handleRunSandbox = async () => {
    setSandboxLoading(true);
    setSandboxResponse(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(sandboxPayload);
      } catch {
        throw new Error('Payload is not valid JSON');
      }

      const res = await fetch(`/api/v2/marketplace/webhooks/incoming/${sandboxExtensionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parsed)
      });

      const data = await res.json();
      setSandboxResponse(data);
      toast.success('Ingested and normalized successfully!');
    } catch (err: any) {
      setSandboxResponse({ error: err.message });
      toast.error(err.message);
    } finally {
      setSandboxLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSdk(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedSdk(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/marketplace"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Terminal className="w-6 h-6 text-indigo-400" />
              Monitorix Developer Portal & Connector SDK
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Standardized SDKs, OAuth2 application credentials, webhook pipelines, and interactive sandbox.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/marketplace"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-all"
          >
            Marketplace Catalog
          </Link>
          <Link
            to="/marketplace/integrations"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            Integration Health Hub
          </Link>
        </div>
      </div>

      {/* Secret Banner Alert if just created */}
      {createdSecretAlert && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              New OAuth Client Secret Generated
            </div>
            <button
              onClick={() => setCreatedSecretAlert(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-slate-300">
            Copy your secret immediately. For security, Monitorix hashes this value and it will not be displayed again.
          </p>
          <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300 border border-emerald-900/60 select-all break-all">
            {createdSecretAlert.secret}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { key: 'sdk', label: 'Connector SDK', icon: Code },
          { key: 'oauth', label: 'OAuth2 Applications & Keys', icon: Key },
          { key: 'webhooks', label: 'Webhook Subscriptions', icon: Webhook },
          { key: 'sandbox', label: 'Interactive Sandbox', icon: Play },
          { key: 'guides', label: 'Architecture & Guides (.docx)', icon: FileText }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === t.key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SDK DOCUMENTATION & CODE TEMPLATES */}
      {activeTab === 'sdk' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Connector SDK Spec (11.1)
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                The Monitorix Connector SDK standardizes authentication, event ingestion, telemetry normalization, alert creation, and response action dispatch across all security domains.
              </p>

              <div className="pt-2 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
                  <span className="text-slate-300">
                    <strong>Unified Schema:</strong> Automatic mapping to MonitorixEventSchema.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
                  <span className="text-slate-300">
                    <strong>Crypto Vault:</strong> AES-128 Fernet encrypted secrets at rest.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
                  <span className="text-slate-300">
                    <strong>HMAC Webhooks:</strong> SHA-256 integrity verification.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
                  <span className="text-slate-300">
                    <strong>Resilience:</strong> Exponential backoff & circuit breakers.
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select SDK Language
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSdkLanguage('python');
                    fetchSdkTemplate('python');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    sdkLanguage === 'python'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Python 3.11+
                </button>
                <button
                  onClick={() => {
                    setSdkLanguage('nodejs');
                    fetchSdkTemplate('nodejs');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    sdkLanguage === 'nodejs'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Node.js / TypeScript
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Starter Template ({sdkLanguage.toUpperCase()})
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(sdkCode)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                >
                  {copiedSdk ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSdk ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              {sdkLoading ? (
                <div className="py-20 flex justify-center">
                  <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
              ) : (
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto max-h-[500px]">
                    {sdkCode}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OAUTH2 APPLICATIONS & API KEYS */}
      {activeTab === 'oauth' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Developer OAuth Applications & Service Principals
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage OAuth2 Client IDs, secure API keys, and scoped tokens for custom integration workers.
              </p>
            </div>
            <button
              onClick={() => setShowCreateAppModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              Register New OAuth App
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {appsLoading ? (
              <div className="py-16 flex justify-center">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : oauthApps.length === 0 ? (
              <div className="py-16 text-center">
                <Key className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No developer applications registered yet.</p>
                <button
                  onClick={() => setShowCreateAppModal(true)}
                  className="mt-3 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                >
                  Create Your First App
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Application</th>
                    <th className="py-3 px-4">Client ID</th>
                    <th className="py-3 px-4">Secret Preview</th>
                    <th className="py-3 px-4">Granted Scopes</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {oauthApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-white">{app.app_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-300 select-all">{app.client_id}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{app.client_secret_preview}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {app.scopes.map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: WEBHOOK PLATFORM & LOGS */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Webhook Event Subscriptions (Section 11.6)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every event notification is cryptographically signed using HMAC-SHA256 (header: X-Monitorix-Signature).
              </p>
            </div>
            <button
              onClick={() => setShowCreateWebhookModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              New Webhook Subscription
            </button>
          </div>

          {/* Subscriptions List */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Registered Outgoing Subscriptions
              </span>
              <button
                onClick={fetchWebhooksAndLogs}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {webhooksLoading ? (
              <div className="py-12 flex justify-center">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : webhooks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No webhook subscriptions registered yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {webhooks.map((sub) => (
                  <div key={sub.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/20">
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs flex items-center gap-2">
                        {sub.name}
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Listening
                        </span>
                      </div>
                      <div className="font-mono text-xs text-slate-400 break-all">{sub.target_url}</div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {sub.subscribed_events.map((ev) => (
                          <span key={ev} className="px-2 py-0.5 rounded bg-slate-950 text-indigo-300 font-mono text-[10px] border border-slate-800">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={dispatchingWhId === sub.id}
                        onClick={() => handleDispatchTestWebhook(sub.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-medium transition-all"
                      >
                        {dispatchingWhId === sub.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        Dispatch Test Event
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Webhook Delivery Logs */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Live Delivery Logs & Dead-Letter Audit
              </span>
            </div>

            {webhookLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No delivery logs recorded yet. Click "Dispatch Test Event" above to record deliveries.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Event Type</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Latency</th>
                    <th className="py-2.5 px-4">Retries</th>
                    <th className="py-2.5 px-4">Delivered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {webhookLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono text-slate-200">{log.event_type}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            log.is_success
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          HTTP {log.response_status_code}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-400">{log.latency_ms.toFixed(1)}ms</td>
                      <td className="py-2.5 px-4 font-mono text-slate-400">{log.retry_count}</td>
                      <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                        {new Date(log.delivered_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: INTERACTIVE TEST SANDBOX */}
      {activeTab === 'sandbox' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300">
            <span className="font-semibold">Interactive Ingestion Sandbox:</span> Simulate third-party telemetry incoming events. The connector client standardizes heterogeneous payloads into the standard MonitorixEventSchema.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-indigo-400" />
                Raw Event Payload (Inbound)
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Extension</label>
                <select
                  value={sandboxExtensionId}
                  onChange={(e) => setSandboxExtensionId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="ext-crowdstrike-falcon">CrowdStrike Falcon (EDR)</option>
                  <option value="ext-splunk-enterprise">Splunk Enterprise (SIEM)</option>
                  <option value="ext-okta-identity">Okta Universal Directory (IAM)</option>
                  <option value="ext-virustotal-v3">VirusTotal v3 (Threat Intel)</option>
                  <option value="ext-aws-guardduty">AWS GuardDuty (Cloud)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">JSON Payload Body</label>
                <textarea
                  rows={10}
                  value={sandboxPayload}
                  onChange={(e) => setSandboxPayload(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="button"
                disabled={sandboxLoading}
                onClick={handleRunSandbox}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {sandboxLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Ingest & Normalize
              </button>
            </div>

            {/* Normalized Output */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Normalized Monitorix Schema (Outbound)
              </h2>

              {sandboxResponse ? (
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-mono overflow-x-auto max-h-[420px]">
                  {JSON.stringify(sandboxResponse, null, 2)}
                </pre>
              ) : (
                <div className="py-24 text-center text-xs text-slate-500">
                  Click "Ingest & Normalize" to see normalized schema output.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ARCHITECTURAL & MODULAR INTEGRATION GUIDES */}
      {activeTab === 'guides' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Enterprise Architecture & Modular Integration Guides
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Download publication-grade Word documents (.docx) with embedded high-resolution diagrams, API payload schemas, and zero-trust protocol specifications.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                715+ REST APIs Available
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
                PCI-DSS 3.4 Certified
              </span>
            </div>
          </div>

          {/* Quick Explanatory Banners */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                Pick-and-Choose Modules
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Consume individual modules (YARA File Scanning, 1-Sec EDR Isolation, DLP Sanitizer, Threat Intel) without full suite lock-in. Fully headless capable.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Key className="w-4 h-4" />
                Zero-Trust Key Handshake
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Exchange static <code className="text-emerald-300">mk_...</code> keys for short-lived Session JWTs via <code className="text-slate-300">POST /api/auth/sdk-handshake</code> with IP whitelisting and 60s Redis fast-path caching.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <CreditCard className="w-4 h-4" />
                PCI-DSS Transaction Privacy
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Online credit cards are automatically scrubbed into <code className="text-amber-300">••••-••••-••••-••••</code> and passwords into <code className="text-amber-300">[REDACTED]</code> prior to database persistence.
              </p>
            </div>
          </div>

          {/* Downloadable Guides Catalog */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Guide 1: Modular Pick-and-Choose */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                    v4.2.0 Enterprise Spec
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Word .docx (~402 KB)</span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  Modular "Pick-and-Choose" Architecture & Integration Guide
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Deep-dive blueprint explaining decoupled micro-service integration, standalone API invocation, HMAC-SHA256 webhook signatures, and financial transaction redaction.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">FastAPI Backend</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">YARA Malware Lab</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">PCI-DSS 3.4</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">mTLS Rust EDR</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <a
                  href="/api/v2/marketplace/developers/guides/download/MONITORIX_MODULAR_INTEGRATION_AND_PICK_AND_CHOOSE_GUIDE.docx"
                  download
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Word (.docx)
                </a>
                <a
                  href="/api/v2/marketplace/developers/guides/download/MONITORIX_MODULAR_INTEGRATION_AND_PICK_AND_CHOOSE_GUIDE.md"
                  download
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Markdown (.md)
                </a>
              </div>
            </div>

            {/* Guide 2: Reseller & Partner Ecosystem */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                    v4.2.0 Commercial Spec
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Word .docx (~452 KB)</span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  Reseller & Commercial Partner Network Deep-Dive Guide
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Complete manual for MSPs, MSSPs, and VARs covering sub-tenant isolation, quote generator with automated 20% margin calculation, white-label engine, and payout ledger.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">20% Reseller Margin</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Sub-Tenant Provisioning</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">White-Labeling</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Net-30 Settlement</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <a
                  href="/api/v2/marketplace/developers/guides/download/MONITORIX_RESELLER_AND_PARTNER_ECOSYSTEM_DEEP_DIVE_GUIDE.docx"
                  download
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Word (.docx)
                </a>
                <a
                  href="/api/v2/marketplace/developers/guides/download/MONITORIX_RESELLER_AND_PARTNER_ECOSYSTEM_DEEP_DIVE_GUIDE.md"
                  download
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Markdown (.md)
                </a>
              </div>
            </div>

            {/* Guide 3: Command Center Deep-Dive */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                    v4.2.0 SOC Operations
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Word .docx (~720 KB)</span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  Command Center & SOC Telemetry Deep-Dive Guide
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time telemetry ingestion, incident state machine lifecycles (NEW ➔ TRIAGED ➔ RESOLVED ➔ CLOSED), and SLA breach auto-escalation.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <a
                  href="/api/v2/marketplace/developers/guides/download/MONITORIX_COMMAND_CENTER_DEEP_DIVE_GUIDE.docx"
                  download
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Word (.docx)
                </a>
              </div>
            </div>

            {/* Guide 4: Threat Intelligence Lab */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                    v4.2.0 Threat Research
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Word .docx (~636 KB)</span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  Threat Intelligence, YARA & Malware Lab Deep-Dive Guide
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Global threat intelligence feeds, YARA heuristic file scanning engine, deception honeypots, and multi-stage attack graph correlation.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <a
                  href="/api/v2/marketplace/developers/guides/download/MONITORIX_THREAT_INTELLIGENCE_DEEP_DIVE_GUIDE.docx"
                  download
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Word (.docx)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE OAUTH APP MODAL */}
      {showCreateAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              Register Developer OAuth Application
            </h2>

            <form onSubmit={handleCreateOAuthApp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Application Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise SIEM Ingestion Service"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Redirect Callback URI</label>
                <input
                  type="url"
                  required
                  placeholder="https://secops.internal/callback"
                  value={newAppRedirect}
                  onChange={(e) => setNewAppRedirect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateAppModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30"
                >
                  Create Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE WEBHOOK MODAL */}
      {showCreateWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Webhook className="w-4 h-4 text-indigo-400" />
              Register Webhook Subscription
            </h2>

            <form onSubmit={handleCreateWebhook} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Webhook Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incident Escalation Slack Bot"
                  value={newWhName}
                  onChange={(e) => setNewWhName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Endpoint URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://hooks.slack.com/services/..."
                  value={newWhUrl}
                  onChange={(e) => setNewWhUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateWebhookModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30"
                >
                  Register Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
