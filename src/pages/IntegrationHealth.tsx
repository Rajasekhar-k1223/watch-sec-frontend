import React, { useState, useEffect } from 'react';
import { 
  Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, 
  Power, RotateCcw, ShieldAlert, ArrowLeft, ExternalLink, Zap, 
  Clock, Database, Lock, Check, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface IntegrationHealthItem {
  id: number;
  extension_id: string;
  name: string;
  category: string;
  icon: string;
  status: 'Connected' | 'Healthy' | 'Warning' | 'Failed' | 'Disabled';
  is_enabled: boolean;
  events_ingested_24h: number;
  total_events: number;
  error_count_24h: number;
  last_error: string | null;
  last_sync: string | null;
  requires_approval_high_risk: boolean;
  pinned_version: string;
  latency_p99_ms: number;
}

export default function IntegrationHealth() {
  const [integrations, setIntegrations] = useState<IntegrationHealthItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState({
    total: 0,
    healthy: 0,
    warning: 0,
    failed: 0
  });

  // Rollback modal state
  const [rollbackItem, setRollbackItem] = useState<IntegrationHealthItem | null>(null);
  const [targetVersion, setTargetVersion] = useState<string>('2.8.0');
  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);

  // Sandboxed Action trigger modal
  const [actionItem, setActionItem] = useState<IntegrationHealthItem | null>(null);
  const [actionName, setActionName] = useState<string>('isolate_host');
  const [targetEntity, setTargetEntity] = useState<string>('ENDPOINT-WIN-8492');
  const [approvalGranted, setApprovalGranted] = useState<boolean>(false);
  const [actionResult, setActionResult] = useState<any | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);

  const getAuthToken = () => {
    return sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('monitorix_token');
  };

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v2/marketplace/integrations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load integration telemetry');
      const data = await res.json();
      setIntegrations(data.integrations || []);
      setSummary({
        total: data.total_integrations || 0,
        healthy: data.healthy_count || 0,
        warning: data.warning_count || 0,
        failed: data.failed_count || 0
      });
    } catch (err: any) {
      toast.error(err.message || 'Error loading integration metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleToggleState = async (integrationId: number, currentStatus: boolean, name: string) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/v2/marketplace/integrations/${integrationId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ enable: !currentStatus })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to toggle integration state');
      }
      toast.success(`${name} ${!currentStatus ? 'enabled & listening' : 'safely disabled'}`);
      fetchIntegrations();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRollback = async () => {
    if (!rollbackItem) return;
    setIsRollingBack(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/v2/marketplace/integrations/${rollbackItem.id}/rollback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ target_version: targetVersion })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Rollback failed');
      }
      toast.success(`Rolled back ${rollbackItem.name} to v${targetVersion}`);
      setRollbackItem(null);
      fetchIntegrations();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionItem) return;
    setIsExecutingAction(true);
    setActionResult(null);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/v2/marketplace/actions/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          extension_id: actionItem.extension_id,
          action_name: actionName,
          target_entity: targetEntity,
          approval_granted: approvalGranted
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Action failed');
      }
      setActionResult(data);
      toast.success(data.message || 'Action dispatched');
    } catch (err: any) {
      setActionResult({ error: err.message });
      toast.error(err.message);
    } finally {
      setIsExecutingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Connected':
      case 'Healthy':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> {status}
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Warning
          </span>
        );
      case 'Failed':
      case 'Disabled':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" /> {status}
          </span>
        );
    }
  };

  const total24hEvents = integrations.reduce((acc, i) => acc + (i.events_ingested_24h || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Top Breadcrumb & Controls */}
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
              <Activity className="w-6 h-6 text-emerald-400" />
              Integration Health & Telemetry Hub
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live sync telemetry, high-risk approval guards, and version pinning for installed connectors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchIntegrations}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link
            to="/developers"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Developer Portal
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Installed Connectors</div>
          <div className="text-2xl font-bold text-white mt-1">{summary.total}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Connected / Healthy</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{summary.healthy}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Warnings / Degradation</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{summary.warning}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Failed / Disabled</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{summary.failed}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">24h Ingested Events</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">
            {total24hEvents.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Integrations Health Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Connected Security Systems & Services
          </h2>
          <span className="text-xs text-slate-400">
            Real-time telemetry updated every 30s
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400">Loading active connector telemetry...</p>
          </div>
        ) : integrations.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-300">No active integrations found for this tenant.</p>
            <Link
              to="/marketplace"
              className="mt-3 inline-block px-4 py-2 rounded-xl bg-indigo-600 text-xs font-semibold text-white"
            >
              Browse Marketplace Catalog
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Connector</th>
                  <th className="py-3 px-4">Health Status</th>
                  <th className="py-3 px-4">24h Events</th>
                  <th className="py-3 px-4">24h Errors</th>
                  <th className="py-3 px-4">Last Sync</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {integrations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Name & ID */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span className="font-mono text-slate-500">{item.extension_id}</span>
                        <span>•</span>
                        <span>{item.category}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Events */}
                    <td className="py-3 px-4 font-mono">
                      <div className="text-slate-200 font-semibold">{item.events_ingested_24h.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Total: {item.total_events.toLocaleString()}</div>
                    </td>

                    {/* Errors */}
                    <td className="py-3 px-4 font-mono">
                      <span className={item.error_count_24h > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {item.error_count_24h}
                      </span>
                    </td>

                    {/* Last Sync */}
                    <td className="py-3 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.last_sync ? new Date(item.last_sync).toLocaleTimeString() : 'Never'}</span>
                      </div>
                    </td>

                    {/* Pinned Version */}
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700/60">
                        v{item.pinned_version}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right space-x-2">
                      {/* Sandboxed Action Trigger */}
                      <button
                        title="Execute Sandboxed Response Action"
                        onClick={() => {
                          setActionItem(item);
                          setActionResult(null);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 border border-slate-700 transition-all inline-flex items-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Action</span>
                      </button>

                      {/* Rollback Version */}
                      <button
                        title="Rollback Pinned Version"
                        onClick={() => {
                          setRollbackItem(item);
                          setTargetVersion('2.8.0');
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 transition-all inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Rollback</span>
                      </button>

                      {/* Enable / Disable Toggle */}
                      <button
                        title={item.is_enabled ? 'Disable Integration' : 'Enable Integration'}
                        onClick={() => handleToggleState(item.id, item.is_enabled, item.name)}
                        className={`p-1.5 rounded-lg border transition-all inline-flex items-center gap-1 ${
                          item.is_enabled
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span className="text-[11px]">{item.is_enabled ? 'Disable' : 'Enable'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ROLLBACK MODAL */}
      {rollbackItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              Safety Rollback: {rollbackItem.name}
            </h2>
            <p className="text-xs text-slate-400">
              Roll back to a certified predecessor package to immediately mitigate connector regressions or breaking upstream API changes.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Rollback Version
              </label>
              <input
                type="text"
                value={targetVersion}
                onChange={(e) => setTargetVersion(e.target.value)}
                placeholder="e.g. 2.7.0"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300">
              <span className="font-semibold">Notice:</span> Rollback preserves encrypted configuration secrets and replays connector state in sandbox mode.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRollbackItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRollingBack}
                onClick={handleRollback}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white shadow-lg shadow-amber-600/30 flex items-center gap-2"
              >
                {isRollingBack && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Rollback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SANDBOXED ACTION EXECUTION MODAL */}
      {actionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                Trigger Sandboxed Action: {actionItem.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute permission-controlled response action with mandatory high-risk approval verification.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Action Operation
                </label>
                <select
                  value={actionName}
                  onChange={(e) => setActionName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="isolate_host">isolate_host (High-Risk)</option>
                  <option value="revoke_user_tokens">revoke_user_tokens (High-Risk)</option>
                  <option value="block_hash">block_hash (Medium-Risk)</option>
                  <option value="quarantine_file">quarantine_file (High-Risk)</option>
                  <option value="create_incident_ticket">create_incident_ticket (Low-Risk)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Entity
                </label>
                <input
                  type="text"
                  value={targetEntity}
                  onChange={(e) => setTargetEntity(e.target.value)}
                  placeholder="e.g. ENDPOINT-WIN-8491 or admin@corp.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* High-Risk Approval Checkbox */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="approvalCheckbox"
                    checked={approvalGranted}
                    onChange={(e) => setApprovalGranted(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="approvalCheckbox" className="text-xs font-semibold text-slate-200 cursor-pointer">
                    SecOps Lead Explicit Approval Granted
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 pl-6">
                  Section 11.5 Mandate: High-risk actions will be blocked by the kernel sandbox if approval is not certified.
                </p>
              </div>

              {/* Execution Feedback */}
              {actionResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono break-all ${
                    actionResult.error
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                      : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  }`}
                >
                  <div className="font-bold mb-1">Execution Status:</div>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(actionResult, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActionItem(null);
                  setActionResult(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isExecutingAction}
                onClick={handleExecuteAction}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                {isExecutingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Execute in Sandbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
